import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAckRules,
  seedCategories,
  seedQuestionnaireVersions,
  seedRouting,
  type AckRules,
  type ApprovalRoute,
  type AssetCategoryConfig,
  type QuestionField,
  type QuestionnaireVersion,
  type RequestType,
} from '../data/config'
import { todayIso } from '../data/org'

export interface CategoryDraft {
  name: string
  code: string
  maintainAssetIds: boolean
  approxLifeMonths: number
}

/**
 * In-memory governed configuration store (L2 config). Every save bumps a
 * version and stamps a new effective date so changes apply to subsequent
 * transactions without a code deployment (ASM-19/20/21/40/43).
 */
export function useAssetConfig() {
  const [moduleEnabled, setModuleEnabledState] = useState(true)
  const [categories, setCategories] = useState<AssetCategoryConfig[]>(seedCategories)
  const [taxonomyVersion, setTaxonomyVersion] = useState(4)
  const [questionnaireVersions, setQuestionnaireVersions] = useState<QuestionnaireVersion[]>(
    seedQuestionnaireVersions
  )
  const [ackRules, setAckRules] = useState<AckRules>(seedAckRules)
  const [routing, setRouting] = useState<ApprovalRoute[]>(seedRouting)

  const currentQuestionnaire = questionnaireVersions[questionnaireVersions.length - 1]

  const setModuleEnabled = useCallback((enabled: boolean) => {
    setModuleEnabledState(enabled)
    toast.success(
      enabled
        ? 'Asset module enabled — requisition, issuance, arrival and outbound features are live'
        : 'Asset module disabled — asset screens are hidden across the tenant'
    )
  }, [])

  const addCategory = useCallback((draft: CategoryDraft) => {
    setCategories((prev) => [
      ...prev,
      { ...draft, id: `cat-${crypto.randomUUID().slice(0, 6)}`, active: true },
    ])
    setTaxonomyVersion((v) => v + 1)
    toast.success(`Category “${draft.name}” added — taxonomy versioned, effective ${todayIso()}`)
  }, [])

  const updateCategory = useCallback((id: string, draft: CategoryDraft) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...draft } : c)))
    setTaxonomyVersion((v) => v + 1)
    toast.success('Category updated — taxonomy versioned without a code deployment')
  }, [])

  /** Deactivation-only governance: a category in use can never be orphaned (ASM-19). */
  const setCategoryActive = useCallback(
    (id: string, active: boolean, inUseCount: number) => {
      if (!active && inUseCount > 0) {
        toast.error(
          `Cannot deactivate — ${inUseCount} asset(s) still reference this category. Reassign them first.`
        )
        return
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)))
      setTaxonomyVersion((v) => v + 1)
      toast.success(active ? 'Category re-enabled' : 'Category deactivated for new registrations')
    },
    []
  )

  const publishQuestionnaire = useCallback((fields: QuestionField[]) => {
    setQuestionnaireVersions((prev) => [
      ...prev,
      { version: prev.length + 1, effectiveFrom: todayIso(), fields },
    ])
    toast.success(
      'Condition-assessment template published — new acknowledgements render this version; prior captures keep theirs'
    )
  }, [])

  const saveAckRules = useCallback((draft: Omit<AckRules, 'version' | 'effectiveFrom'>) => {
    setAckRules((prev) => ({ ...draft, version: prev.version + 1, effectiveFrom: todayIso() }))
    toast.success('Acknowledgement & overdue policy saved — applies to subsequent transactions')
  }, [])

  const saveRouting = useCallback((requestType: RequestType, approvers: string[]) => {
    setRouting((prev) =>
      prev.map((r) =>
        r.requestType === requestType
          ? { ...r, approvers, version: r.version + 1, effectiveFrom: todayIso() }
          : r
      )
    )
    toast.success(`${requestType} approval routing updated — versioned, effective ${todayIso()}`)
  }, [])

  const approverFor = useCallback(
    (requestType: RequestType): string => {
      const route = routing.find((r) => r.requestType === requestType)
      return route?.approvers[0] ?? 'Priya Sharma'
    },
    [routing]
  )

  return {
    moduleEnabled,
    setModuleEnabled,
    categories,
    taxonomyVersion,
    addCategory,
    updateCategory,
    setCategoryActive,
    questionnaireVersions,
    currentQuestionnaire,
    publishQuestionnaire,
    ackRules,
    saveAckRules,
    routing,
    saveRouting,
    approverFor,
  }
}

export type AssetConfigStore = ReturnType<typeof useAssetConfig>
