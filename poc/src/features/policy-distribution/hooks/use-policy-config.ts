import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type Criticality } from '../data/policies'
import {
  seedDecisionRules,
  seedEscalationPaths,
  seedIntegrations,
  seedReminderRules,
  seedTemplates,
  type DecisionRule,
  type EscalationPath,
  type IntegrationSetting,
  type NotificationTemplate,
  type ReminderRule,
} from '../data/config'

/**
 * In-memory governance store: reminder SLA milestones, criticality-mapped
 * escalation paths, versioned notification/receipt templates, the
 * re-acknowledgment decision table and module integrations.
 */
export function usePolicyConfig() {
  const [reminderRules, setReminderRules] =
    useState<ReminderRule[]>(seedReminderRules)
  const [escalationPaths, setEscalationPaths] =
    useState<EscalationPath[]>(seedEscalationPaths)
  const [templates, setTemplates] =
    useState<NotificationTemplate[]>(seedTemplates)
  const [decisionRules, setDecisionRules] =
    useState<DecisionRule[]>(seedDecisionRules)
  const [integrations, setIntegrations] =
    useState<IntegrationSetting[]>(seedIntegrations)

  const updateMilestones = useCallback(
    (criticality: Criticality, milestones: number[]) => {
      setReminderRules((prev) =>
        prev.map((r) =>
          r.criticality === criticality
            ? { ...r, milestones: [...milestones].sort((a, b) => a - b) }
            : r
        )
      )
      toast.success(`${criticality} reminder milestones updated`)
    },
    []
  )

  const toggleReminderRule = useCallback((criticality: Criticality) => {
    setReminderRules((prev) =>
      prev.map((r) =>
        r.criticality === criticality ? { ...r, enabled: !r.enabled } : r
      )
    )
  }, [])

  const updateEscalationRoute = useCallback(
    (id: string, route: string[], slaHoursToAct: number) => {
      setEscalationPaths((prev) =>
        prev.map((p) => (p.id === id ? { ...p, route, slaHoursToAct } : p))
      )
      toast.success('Escalation path updated — executed via workflow engine')
    },
    []
  )

  /** Editing a template supersedes the old row and appends a new version. */
  const updateTemplate = useCallback(
    (id: string, subject: string, body: string) => {
      setTemplates((prev) => {
        const current = prev.find((t) => t.id === id && !t.superseded)
        if (!current) return prev
        const next: NotificationTemplate = {
          ...current,
          id: `${current.id}-v${current.version + 1}`,
          version: current.version + 1,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          subject,
          body,
          superseded: false,
        }
        return [
          next,
          ...prev.map((t) => (t.id === id ? { ...t, superseded: true } : t)),
        ]
      })
      toast.success('Template saved as a new effective-dated version')
    },
    []
  )

  const bumpRule = useCallback(
    (rule: DecisionRule, patch: Partial<DecisionRule>): DecisionRule => ({
      ...rule,
      ...patch,
      version: rule.version + 1,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    }),
    []
  )

  const toggleDecisionRule = useCallback(
    (id: string) => {
      setDecisionRules((prev) =>
        prev.map((r) => (r.id === id ? bumpRule(r, { enabled: !r.enabled }) : r))
      )
      toast.success('Decision table updated — change versioned, no deployment')
    },
    [bumpRule]
  )

  const moveDecisionRule = useCallback(
    (id: string, direction: 'up' | 'down') => {
      setDecisionRules((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order)
        const index = sorted.findIndex((r) => r.id === id)
        const swapWith = direction === 'up' ? index - 1 : index + 1
        if (index < 0 || swapWith < 0 || swapWith >= sorted.length) return prev
        const a = sorted[index]
        const b = sorted[swapWith]
        return prev.map((r) =>
          r.id === a.id
            ? bumpRule(a, { order: b.order })
            : r.id === b.id
              ? bumpRule(b, { order: a.order })
              : r
        )
      })
    },
    [bumpRule]
  )

  const toggleIntegration = useCallback((id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
    )
  }, [])

  const activeTemplates = templates.filter((t) => !t.superseded)
  const enabledReAckTriggers = decisionRules
    .filter((r) => r.enabled)
    .map((r) => r.trigger)

  return {
    reminderRules,
    escalationPaths,
    templates,
    activeTemplates,
    decisionRules,
    integrations,
    enabledReAckTriggers,
    updateMilestones,
    toggleReminderRule,
    updateEscalationRoute,
    updateTemplate,
    toggleDecisionRule,
    moveDecisionRule,
    toggleIntegration,
  }
}

export type PolicyConfigStore = ReturnType<typeof usePolicyConfig>
