import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedApproverGraphs,
  seedCustomFields,
  seedInterviewQuestions,
  seedNotificationTemplates,
  seedScopeRules,
  type ApproverGraph,
  type CustomFieldDef,
  type InterviewQuestion,
  type NotificationTemplate,
  type ScopeRule,
} from '../data/governance'

export const SETUP_STEPS = [
  'Department details',
  'Locations & work areas',
  'Shifts & weekly offs',
  'Review & finish',
] as const

type LogEvent = (entity: string, action: string, detail: string) => void

/**
 * Governed, versioned department configuration (L2 config layer):
 * custom fields, approver graphs, scope rules, interview questions and
 * notification templates — all tenant-scoped and in-memory for the POC.
 */
export function useDepartmentConfig(logEvent: LogEvent) {
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(seedCustomFields)
  const [approverGraphs, setApproverGraphs] = useState<ApproverGraph[]>(seedApproverGraphs)
  const [scopeRules, setScopeRules] = useState<ScopeRule[]>(seedScopeRules)
  const [interviewQuestions, setInterviewQuestions] =
    useState<InterviewQuestion[]>(seedInterviewQuestions)
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>(
    seedNotificationTemplates
  )
  const [setupStep, setSetupStep] = useState(0)

  /* ---------------- custom fields (UDF schema) ---------------- */

  const addCustomField = useCallback(
    (field: Omit<CustomFieldDef, 'id' | 'version' | 'effectiveFrom'>) => {
      const def: CustomFieldDef = {
        ...field,
        id: `cf-${crypto.randomUUID().slice(0, 6)}`,
        version: 1,
        effectiveFrom: new Date().toISOString().slice(0, 10),
      }
      setCustomFields((prev) => [...prev, def])
      logEvent('Department schema', 'custom field added', `"${field.label}" (${field.type}) — tenant-scoped, applies to this company only.`)
      toast.success(`Custom field "${field.label}" added to department forms`)
    },
    [logEvent]
  )

  const bumpCustomFieldVersion = useCallback(
    (id: string) => {
      setCustomFields((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, version: f.version + 1, effectiveFrom: new Date().toISOString().slice(0, 10) }
            : f
        )
      )
      const field = customFields.find((f) => f.id === id)
      logEvent('Department schema', 'custom field versioned', `"${field?.label}" effective-dated — prior values retained under the old schema.`)
      toast.success('Schema version bumped — existing departments keep values captured under the prior version')
    },
    [customFields, logEvent]
  )

  const removeCustomField = useCallback(
    (id: string) => {
      const field = customFields.find((f) => f.id === id)
      setCustomFields((prev) => prev.filter((f) => f.id !== id))
      logEvent('Department schema', 'custom field removed', `"${field?.label}" retired from the form schema.`)
      toast.success(`Custom field "${field?.label}" removed`)
    },
    [customFields, logEvent]
  )

  /* ---------------- approver graphs ---------------- */

  const updateApproverGraph = useCallback(
    (id: string, patch: Partial<Pick<ApproverGraph, 'useDepartmentHead' | 'cascadeToParents' | 'keyDepartmentId'>>) => {
      setApproverGraphs((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                ...patch,
                version: g.version + 1,
                effectiveFrom: new Date().toISOString().slice(0, 10),
              }
            : g
        )
      )
      logEvent('Approver graph', 'config versioned', 'In-flight approvals keep the config version that applied when they started.')
      toast.success('Approver graph saved as a new effective-dated version')
    },
    [logEvent]
  )

  /* ---------------- scope rules (roles + policies) ---------------- */

  const addScopeRule = useCallback(
    (rule: Omit<ScopeRule, 'id' | 'version' | 'flagged'>) => {
      const row: ScopeRule = {
        ...rule,
        id: `sr-${crypto.randomUUID().slice(0, 6)}`,
        version: 1,
        flagged: false,
      }
      setScopeRules((prev) => [...prev, row])
      logEvent('Decision table', 'row added', `${rule.kind === 'role' ? 'Role' : 'Policy'} "${rule.name}" scoped to ${rule.departmentId}${rule.cascade ? ' (cascades to children)' : ''}.`)
      toast.success(`${rule.kind === 'role' ? 'Role scope' : 'Policy applicability'} row added`)
    },
    [logEvent]
  )

  const toggleScopeCascade = useCallback((id: string) => {
    setScopeRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, cascade: !r.cascade, version: r.version + 1 } : r))
    )
    toast.success('Cascade setting versioned and saved')
  }, [])

  const removeScopeRule = useCallback((id: string) => {
    setScopeRules((prev) => prev.filter((r) => r.id !== id))
    toast.success('Rule removed from the decision table')
  }, [])

  /* ---------------- interview questions ---------------- */

  const toggleQuestionDepartment = useCallback(
    (questionId: string, deptId: string) => {
      setInterviewQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                departmentIds: q.departmentIds.includes(deptId)
                  ? q.departmentIds.filter((d) => d !== deptId)
                  : [...q.departmentIds, deptId],
              }
            : q
        )
      )
      toast.success('Question applicability updated')
    },
    []
  )

  /* ---------------- notification templates ---------------- */

  const saveTemplateBody = useCallback(
    (id: string, body: string) => {
      setNotificationTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, body, version: t.version + 1 } : t))
      )
      const tpl = notificationTemplates.find((t) => t.id === id)
      logEvent('Notification template', 'versioned', `"${tpl?.name}" updated — in-flight notifications keep v${tpl?.version}.`)
      toast.success('Template saved — applies to this company only; in-flight notifications keep the prior version')
    },
    [notificationTemplates, logEvent]
  )

  /* ---------------- dependency flagging on department delete ---------------- */

  const flagDepartmentRefs = useCallback(
    (deptId: string, deptName: string) => {
      let flaggedCount = 0
      setApproverGraphs((prev) =>
        prev.map((g) => {
          if (g.keyDepartmentId !== deptId || g.flagged) return g
          flaggedCount += 1
          return { ...g, flagged: true }
        })
      )
      setScopeRules((prev) =>
        prev.map((r) => {
          if (r.departmentId !== deptId || r.flagged) return r
          flaggedCount += 1
          return { ...r, flagged: true }
        })
      )
      setInterviewQuestions((prev) =>
        prev.map((q) => {
          if (!q.departmentIds.includes(deptId) || q.flagged) return q
          flaggedCount += 1
          return { ...q, flagged: true }
        })
      )
      if (flaggedCount > 0) {
        toast.warning(`${flaggedCount} dependent configuration item${flaggedCount > 1 ? 's' : ''} referencing ${deptName} flagged for review`)
      }
    },
    []
  )

  /** Names of config items referencing a department (delete warning, DEPT-09). */
  const configRefsFor = useCallback(
    (deptId: string): string[] => [
      ...approverGraphs.filter((g) => g.keyDepartmentId === deptId).map((g) => `Approver graph: ${g.name}`),
      ...scopeRules.filter((r) => r.departmentId === deptId).map((r) => `${r.kind === 'role' ? 'Role scope' : 'Policy'}: ${r.name}`),
      ...interviewQuestions.filter((q) => q.departmentIds.includes(deptId)).map((q) => `Interview question #${q.order}`),
    ],
    [approverGraphs, scopeRules, interviewQuestions]
  )

  /* ---------------- guided setup stepper (DEPT-33) ---------------- */

  const saveAndNext = useCallback(() => {
    setSetupStep((prev) => {
      if (prev >= SETUP_STEPS.length - 1) {
        toast.success('Department setup complete — configuration saved')
        return prev
      }
      toast.success(`"${SETUP_STEPS[prev]}" saved — you can resume from the next step any time`)
      return prev + 1
    })
  }, [])

  const goBack = useCallback(() => {
    setSetupStep((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    customFields,
    approverGraphs,
    scopeRules,
    interviewQuestions,
    notificationTemplates,
    setupStep,
    addCustomField,
    bumpCustomFieldVersion,
    removeCustomField,
    updateApproverGraph,
    addScopeRule,
    toggleScopeCascade,
    removeScopeRule,
    toggleQuestionDepartment,
    saveTemplateBody,
    flagDepartmentRefs,
    configRefsFor,
    saveAndNext,
    goBack,
  }
}

export type DepartmentConfigStore = ReturnType<typeof useDepartmentConfig>
