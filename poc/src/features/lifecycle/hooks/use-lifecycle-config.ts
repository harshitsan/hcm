import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedApproverGraphs,
  seedClearanceChains,
  seedConfirmationApprovers,
  seedConfirmationQuestions,
  seedDecisionTable,
  seedDisciplinaryApprovers,
  seedExitApproverGroups,
  seedExitQuestions,
  seedExitTaskDefs,
  seedExitTypes,
  seedJoineeWindow,
  seedLayoffApprovers,
  seedLetterTemplates,
  seedNoticeRules,
  seedSettings,
  seedTemplates,
  type ApproverGraph,
  type ApproverGraphStep,
  type JoineeWindowConfig,
  type LifecycleSettings,
  type OnboardingTemplate,
  type ProbationDecisionTable,
} from '../data/config'
import { shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

type Log = (input: Omit<LogInput, 'actor' | 'actorRole'>) => void

/** Generic in-memory list store for governed config entities. */
function useList<T extends { id: string }>(seed: T[]) {
  const [items, setItems] = useState<T[]>(seed)
  const add = useCallback((item: Omit<T, 'id'>, prefix: string) => {
    setItems((prev) => [{ ...item, id: shortId(prefix) } as T, ...prev])
  }, [])
  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    )
  }, [])
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])
  return { items, add, update, remove }
}

/**
 * Governed lifecycle configuration store. Versioned artifacts (templates,
 * decision table, approver graphs) publish a new effective-dated version;
 * in-flight workflow instances keep the version they started with.
 */
export function useLifecycleConfig(log: Log) {
  const [settings, setSettings] = useState<LifecycleSettings>(seedSettings)
  const [templates, setTemplates] =
    useState<OnboardingTemplate[]>(seedTemplates)
  const [decisionTable, setDecisionTable] =
    useState<ProbationDecisionTable>(seedDecisionTable)
  const [approverGraphs, setApproverGraphs] =
    useState<ApproverGraph[]>(seedApproverGraphs)
  const [joineeWindow, setJoineeWindow] =
    useState<JoineeWindowConfig>(seedJoineeWindow)

  const exitTypes = useList(seedExitTypes)
  const exitApproverGroups = useList(seedExitApproverGroups)
  const clearanceChains = useList(seedClearanceChains)
  const exitQuestions = useList(seedExitQuestions)
  const exitTaskDefs = useList(seedExitTaskDefs)
  const noticeRules = useList(seedNoticeRules)
  const layoffApprovers = useList(seedLayoffApprovers)
  const letterTemplates = useList(seedLetterTemplates)
  const confirmationApprovers = useList(seedConfirmationApprovers)
  const confirmationQuestions = useList(seedConfirmationQuestions)
  const disciplinaryApprovers = useList(seedDisciplinaryApprovers)

  const publishedTemplate =
    templates.find((t) => t.status === 'published') ?? templates[0]

  const updateSettings = useCallback(
    (patch: Partial<LifecycleSettings>, label: string) => {
      setSettings((prev) => ({ ...prev, ...patch }))
      log({
        company: 'Aurora Software India',
        module: 'Configuration',
        action: `Setting changed: ${label}`,
        target: 'Lifecycle settings',
        outcome: 'Applies to subsequent workflow instances',
        onBehalfOf: null,
      })
      toast.success(`${label} saved`)
    },
    [log]
  )

  /** New-joinee window settings → publishes a NEW effective-dated version. */
  const updateJoineeWindow = useCallback(
    (patch: { firstWindowDays: number; overdueAfterDays: number }) => {
      setJoineeWindow((prev) => ({
        version: `v${Number(prev.version.slice(1)) + 1}`,
        effectiveFrom: todayISO(),
        ...patch,
      }))
      log({
        company: 'Aurora Software India',
        module: 'Configuration',
        action: 'New joinee window settings published',
        target: `First window ${patch.firstWindowDays} day(s) · overdue after ${patch.overdueAfterDays} day(s)`,
        outcome:
          'Versioned & effective-dated — joinee chips recompute from the new definitions immediately',
        onBehalfOf: null,
      })
      toast.success(
        'Window settings saved — New Joinees statuses recomputed with the new definitions'
      )
    },
    [log]
  )

  /** Edit a template task → publishes a NEW effective-dated version. */
  const publishTemplateTask = useCallback(
    (
      taskId: string,
      patch: {
        name: string
        assigneeRole: string
        mandatory: boolean
        requiredDocs: string[]
        completionCriteria: string
      }
    ) => {
      setTemplates((prev) => {
        const current = prev.find((t) => t.status === 'published')
        if (!current) return prev
        const nextVersion = `v${Number(current.version.slice(1)) + 1}`
        const next: OnboardingTemplate = {
          ...current,
          id: `tpl-${nextVersion}`,
          version: nextVersion,
          effectiveFrom: todayISO(),
          status: 'published',
          stages: current.stages.map((s) => ({
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === taskId
                ? { ...t, ...patch }
                : { ...t }
            ),
          })),
        }
        return [
          next,
          ...prev.map((t) => ({ ...t, status: 'superseded' as const })),
        ]
      })
      log({
        company: 'Aurora Software India',
        module: 'Configuration',
        action: 'Onboarding template published',
        target: 'Standard Joiner Checklist',
        outcome:
          'New version effective today — in-flight onboardings keep their original template',
        onBehalfOf: null,
      })
      toast.success(
        'Template published as a new version — in-flight cases keep the old one'
      )
    },
    [log]
  )

  const updateDecisionRow = useCallback(
    (rowId: string, patch: { minScore: number; maxScore: number }) => {
      setDecisionTable((prev) => ({
        version: `v${Number(prev.version.slice(1)) + 1}`,
        effectiveFrom: todayISO(),
        rows: prev.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
      }))
      log({
        company: 'Aurora Software India',
        module: 'Configuration',
        action: 'Probation decision table published',
        target: 'Evaluation criteria & thresholds',
        outcome:
          'Versioned & effective-dated — open probation cases retain their original criteria',
        onBehalfOf: null,
      })
      toast.success('Decision table published as a new version')
    },
    [log]
  )

  const addGraphStep = useCallback(
    (workflow: ApproverGraph['workflow'], step: Omit<ApproverGraphStep, 'order'>) => {
      setApproverGraphs((prev) =>
        prev.map((g) =>
          g.workflow === workflow
            ? {
                ...g,
                version: `v${Number(g.version.slice(1)) + 1}`,
                effectiveFrom: todayISO(),
                steps: [
                  ...g.steps,
                  { ...step, order: g.steps.length + 1 },
                ],
              }
            : g
        )
      )
      log({
        company: 'Aurora Software India',
        module: 'Configuration',
        action: `Approver graph published (${workflow})`,
        target: `${workflow} approval routing`,
        outcome:
          'New version effective today — in-flight approvals keep their original graph',
        onBehalfOf: null,
      })
      toast.success(`${workflow} approver graph published as a new version`)
    },
    [log]
  )

  const logConfigChange = useCallback(
    (action: string, target: string) => {
      log({
        company: 'Aurora Software India',
        module: 'Configuration',
        action,
        target,
        outcome: 'Applies to subsequent workflow instances',
        onBehalfOf: null,
      })
    },
    [log]
  )

  return {
    settings,
    updateSettings,
    templates,
    publishedTemplate,
    publishTemplateTask,
    decisionTable,
    updateDecisionRow,
    approverGraphs,
    addGraphStep,
    joineeWindow,
    updateJoineeWindow,
    exitTypes,
    exitApproverGroups,
    clearanceChains,
    exitQuestions,
    exitTaskDefs,
    noticeRules,
    layoffApprovers,
    letterTemplates,
    confirmationApprovers,
    confirmationQuestions,
    disciplinaryApprovers,
    logConfigChange,
  }
}

export type LifecycleConfigStore = ReturnType<typeof useLifecycleConfig>
