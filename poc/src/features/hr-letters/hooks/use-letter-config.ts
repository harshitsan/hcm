import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedDecisionRules,
  seedGovernance,
  seedTenantRecords,
  type CompanyGovernance,
  type DecisionRule,
} from '../data/catalogs'
import { WORKFLOW_EVENTS, type WorkflowEvent } from '../data/hr-letters'

export type EndOfRetentionPolicy = 'archive' | 'purge' | 'legal-review'

export interface LetterSettings {
  retentionYears: number
  endOfRetentionPolicy: EndOfRetentionPolicy
  channelEmail: boolean
  channelInApp: boolean
  channelPrint: boolean
  deliveryMessageTemplate: string
  autoTriggers: Record<WorkflowEvent, boolean>
}

const defaultSettings: LetterSettings = {
  retentionYears: 7,
  endOfRetentionPolicy: 'archive',
  channelEmail: true,
  channelInApp: true,
  channelPrint: true,
  deliveryMessageTemplate:
    'Dear {{employee.name}}, your {{document.type}} from {{company.name}} is attached / available.',
  autoTriggers: WORKFLOW_EVENTS.reduce(
    (acc, e) => ({ ...acc, [e]: true }),
    {} as Record<WorkflowEvent, boolean>
  ),
}

export type LetterConfigStore = ReturnType<typeof useLetterConfig>

/**
 * Governed configuration store: decision tables (HLC-20), notification-engine
 * distribution settings (HLC-21), auto-generation triggers (HLC-04), the
 * 7-year retention rule (HLC-11), and group governance rows (HLC-15/38).
 * Changes apply immediately — no code deployment.
 */
export function useLetterConfig() {
  const [settings, setSettings] = useState<LetterSettings>(defaultSettings)
  const [decisionRules, setDecisionRules] =
    useState<DecisionRule[]>(seedDecisionRules)
  const [governance, setGovernance] =
    useState<CompanyGovernance[]>(seedGovernance)
  const tenantRecords = seedTenantRecords

  const updateSettings = useCallback((patch: Partial<LetterSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
    toast.success('Configuration saved — applied without code deployment')
  }, [])

  const toggleAutoTrigger = useCallback((event: WorkflowEvent) => {
    setSettings((prev) => ({
      ...prev,
      autoTriggers: {
        ...prev.autoTriggers,
        [event]: !prev.autoTriggers[event],
      },
    }))
    toast.success(`Auto-generation trigger for "${event}" updated`)
  }, [])

  const updateDecisionRule = useCallback(
    (
      id: string,
      patch: Partial<Pick<DecisionRule, 'approvalWorkflow' | 'signingAuthority'>>
    ) => {
      setDecisionRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      toast.success('Decision table updated — next generation uses the new rules')
    },
    []
  )

  /** Group Company Admin pushes the group baseline onto a diverged company. */
  const enforceStandard = useCallback((company: string) => {
    setGovernance((prev) =>
      prev.map((g) =>
        g.company === company
          ? {
              ...g,
              templatesAligned: true,
              workflowsAligned: true,
              retentionAligned: true,
              catalogsAligned: true,
              divergence: '—',
            }
          : g
      )
    )
    toast.success(`Group standard enforced on ${company}`)
  }, [])

  return {
    settings,
    decisionRules,
    governance,
    tenantRecords,
    updateSettings,
    toggleAutoTrigger,
    updateDecisionRule,
    enforceStandard,
  }
}
