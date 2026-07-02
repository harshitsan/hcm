import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAckConfigs,
  seedAcknowledgements,
  seedAppreciationCategories,
  seedAppreciations,
  seedApproverRules,
  seedClassChanges,
  seedDisciplinaryActions,
  seedQuadrantRatings,
  seedSalaryRevisions,
  type AckConfig,
  type Acknowledgement,
  type Appreciation,
  type AppreciationCategory,
  type AppreciationSettings,
  type ClassChangeApproverRule,
  type ClassChangeRequest,
  type ClassChangeStatus,
  type DisciplinaryAction,
  type DisciplinaryStatus,
  type QuadrantConfig,
  type QuadrantRating,
  type SalaryRevision,
  type SalaryRevisionStatus,
} from '../data/performance'

/**
 * In-memory store for recognition, ratings and request/approval workflows:
 * appreciations, quadrant ratings, salary revisions, class changes,
 * disciplinary actions and document acknowledgements.
 */
export function usePerformance() {
  const [categories, setCategories] = useState<AppreciationCategory[]>(
    seedAppreciationCategories
  )
  const [appreciations, setAppreciations] =
    useState<Appreciation[]>(seedAppreciations)
  const [appreciationSettings, setAppreciationSettings] =
    useState<AppreciationSettings>({
      notifyDayOfMonth: 1,
      scoreCalculationStart: '2026-01-01',
    })
  const [quadrantRatings, setQuadrantRatings] =
    useState<QuadrantRating[]>(seedQuadrantRatings)
  const [quadrantConfig, setQuadrantConfig] = useState<QuadrantConfig>({
    frequency: 'Monthly',
    periodStartDay: 1,
    reminderAfterDays: 5,
    completionDeadlineDays: 10,
  })
  const [salaryRevisions, setSalaryRevisions] =
    useState<SalaryRevision[]>(seedSalaryRevisions)
  const [classChanges, setClassChanges] =
    useState<ClassChangeRequest[]>(seedClassChanges)
  const [approverRules, setApproverRules] =
    useState<ClassChangeApproverRule[]>(seedApproverRules)
  const [disciplinaryActions, setDisciplinaryActions] = useState<
    DisciplinaryAction[]
  >(seedDisciplinaryActions)
  const [acknowledgements, setAcknowledgements] = useState<Acknowledgement[]>(
    seedAcknowledgements
  )
  const [ackConfigs, setAckConfigs] = useState<AckConfig[]>(seedAckConfigs)

  const saveCategory = useCallback(
    (draft: Omit<AppreciationCategory, 'id'>, id?: string) => {
      if (id) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...draft } : c))
        )
        toast.success(`Category "${draft.name}" updated`)
      } else {
        setCategories((prev) => [
          { ...draft, id: `ac-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Category "${draft.name}" added`)
      }
    },
    []
  )

  const giveAppreciation = useCallback(
    (draft: Omit<Appreciation, 'id' | 'date'>) => {
      setAppreciations((prev) => [
        {
          ...draft,
          id: `ap-${crypto.randomUUID().slice(0, 6)}`,
          date: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      toast.success(
        `${draft.employee} appreciated — ${draft.points} points attributed`
      )
    },
    []
  )

  const saveAppreciationSettings = useCallback(
    (settings: AppreciationSettings) => {
      setAppreciationSettings(settings)
      toast.success(
        `Schedule saved — employees notified on day ${settings.notifyDayOfMonth} each month`
      )
    },
    []
  )

  const saveQuadrantRating = useCallback(
    (draft: Omit<QuadrantRating, 'id'>) => {
      setQuadrantRatings((prev) => {
        const existing = prev.find(
          (r) => r.employee === draft.employee && r.month === draft.month
        )
        if (existing) {
          return prev.map((r) =>
            r.id === existing.id ? { ...r, ...draft } : r
          )
        }
        return [
          { ...draft, id: `qr-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ]
      })
      toast.success(
        `${draft.employee} rated "${draft.quadrant}" for ${draft.month}`
      )
    },
    []
  )

  const saveQuadrantConfig = useCallback((config: QuadrantConfig) => {
    setQuadrantConfig(config)
    toast.success('Quadrant rating cycle configuration saved')
  }, [])

  const setSalaryRevisionStatus = useCallback(
    (id: string, status: SalaryRevisionStatus) => {
      setSalaryRevisions((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
      toast.success(`Salary revision moved to "${status}"`)
    },
    []
  )

  const setClassChangeStatus = useCallback(
    (id: string, status: ClassChangeStatus) => {
      setClassChanges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      )
      toast.success(`Class change ${status.toLowerCase()}`)
    },
    []
  )

  const saveApproverRule = useCallback(
    (draft: Omit<ClassChangeApproverRule, 'id'>, id?: string) => {
      if (id) {
        setApproverRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...draft } : r))
        )
        toast.success(`Approver routing for ${draft.location} updated`)
      } else {
        setApproverRules((prev) => [
          { ...draft, id: `ar-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Approver routing for ${draft.location} added`)
      }
    },
    []
  )

  const addDisciplinaryAction = useCallback(
    (draft: Omit<DisciplinaryAction, 'id' | 'raisedOn' | 'status'>) => {
      setDisciplinaryActions((prev) => [
        {
          ...draft,
          id: `da-${crypto.randomUUID().slice(0, 6)}`,
          raisedOn: new Date().toISOString().slice(0, 10),
          status: 'Pending approval',
        },
        ...prev,
      ])
      toast.success('Disciplinary action recorded — Pending approval')
    },
    []
  )

  const setDisciplinaryStatus = useCallback(
    (id: string, status: DisciplinaryStatus) => {
      setDisciplinaryActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      )
      toast.success(
        status === 'Letter generated'
          ? 'Letter generated and queued for delivery'
          : `Disciplinary action ${status.toLowerCase()}`
      )
    },
    []
  )

  const acknowledgeDocument = useCallback((id: string) => {
    setAcknowledgements((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Acknowledged',
              acknowledgedOn: new Date().toISOString().slice(0, 10),
            }
          : a
      )
    )
    toast.success('Document acknowledged — recorded against your record')
  }, [])

  const saveAckConfig = useCallback(
    (draft: Omit<AckConfig, 'id'>, id?: string) => {
      if (id) {
        setAckConfigs((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...draft } : c))
        )
        toast.success('Acknowledgement configuration updated')
      } else {
        setAckConfigs((prev) => [
          { ...draft, id: `akc-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success('Acknowledgement configuration added')
      }
    },
    []
  )

  return {
    categories,
    appreciations,
    appreciationSettings,
    quadrantRatings,
    quadrantConfig,
    salaryRevisions,
    classChanges,
    approverRules,
    disciplinaryActions,
    acknowledgements,
    ackConfigs,
    saveCategory,
    giveAppreciation,
    saveAppreciationSettings,
    saveQuadrantRating,
    saveQuadrantConfig,
    setSalaryRevisionStatus,
    setClassChangeStatus,
    saveApproverRule,
    addDisciplinaryAction,
    setDisciplinaryStatus,
    acknowledgeDocument,
    saveAckConfig,
  }
}

export type PerformanceStore = ReturnType<typeof usePerformance>
