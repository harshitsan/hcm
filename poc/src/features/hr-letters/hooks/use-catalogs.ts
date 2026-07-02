import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCatalogTemplates,
  seedQuestionnaire,
  seedRoutings,
  type CatalogTemplate,
  type QuestionnaireQuestion,
  type RoutingConfig,
} from '../data/catalogs'

export type CatalogsStore = ReturnType<typeof useCatalogs>

/**
 * In-memory store for the domain-scoped template catalogs (HLC-23..27),
 * per-channel email/notification templates (HLC-25), approver/receiver
 * routing (HLC-31), and the certification questionnaire (HLC-30).
 */
export function useCatalogs() {
  const [catalogTemplates, setCatalogTemplates] = useState<CatalogTemplate[]>(
    seedCatalogTemplates
  )
  const [routings, setRoutings] = useState<RoutingConfig[]>(seedRoutings)
  const [questions, setQuestions] =
    useState<QuestionnaireQuestion[]>(seedQuestionnaire)

  const updateCatalogTemplate = useCallback(
    (id: string, patch: Pick<CatalogTemplate, 'description' | 'body'>) => {
      setCatalogTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
      toast.success(`Template ${id} saved for its channel`)
    },
    []
  )

  const addCatalogTemplate = useCallback(
    (draft: Omit<CatalogTemplate, 'id'>) => {
      const numbers = catalogTemplates.map((t) => Number(t.id.replace('TT-', '')))
      const id = `TT-${Math.max(...numbers) + 1}`
      setCatalogTemplates((prev) => [...prev, { ...draft, id }])
      toast.success(`Template ${id} filed under its domain catalog`)
    },
    [catalogTemplates]
  )

  const addRoutingMember = useCallback((domainId: string, member: string) => {
    setRoutings((prev) =>
      prev.map((r) =>
        r.domainId === domainId && !r.members.includes(member)
          ? { ...r, members: [...r.members, member] }
          : r
      )
    )
    toast.success(`${member} added to routing`)
  }, [])

  const removeRoutingMember = useCallback((domainId: string, member: string) => {
    setRoutings((prev) =>
      prev.map((r) =>
        r.domainId === domainId
          ? { ...r, members: r.members.filter((m) => m !== member) }
          : r
      )
    )
    toast.success(`${member} removed from routing`)
  }, [])

  const setRoutingThreshold = useCallback(
    (domainId: string, thresholdHours: number) => {
      setRoutings((prev) =>
        prev.map((r) => (r.domainId === domainId ? { ...r, thresholdHours } : r))
      )
      toast.success(`Short-time threshold set to ${thresholdHours} hours/week`)
    },
    []
  )

  const addQuestion = useCallback((text: string, required: boolean) => {
    setQuestions((prev) => [
      ...prev,
      { id: `q-${crypto.randomUUID().slice(0, 6)}`, text, required },
    ])
    toast.success('Questionnaire question added')
  }, [])

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    toast.success('Question removed')
  }, [])

  return {
    catalogTemplates,
    routings,
    questions,
    updateCatalogTemplate,
    addCatalogTemplate,
    addRoutingMember,
    removeRoutingMember,
    setRoutingThreshold,
    addQuestion,
    removeQuestion,
  }
}
