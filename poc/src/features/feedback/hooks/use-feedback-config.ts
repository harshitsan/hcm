import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedConfig,
  type CategoryDef,
  type FeedbackConfig,
  type FormFieldDef,
} from '../data/config'
import { CURRENT_ADMIN } from '../data/entries'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface ReceiversPatch {
  anonymousEnabled: boolean
  nonAnonymousReceivers: string[]
  anonymousReceivers: string[]
  coordinator: string | null
  approverReminderDays: number
  coordinatorReminderDays: number
  accessRoles: string[]
}

/**
 * Governed per-tenant configuration store (FBG-13..15, FBG-21..29). Every
 * save appends a version entry so routing/config history stays recorded.
 */
export function useFeedbackConfig() {
  const [config, setConfig] = useState<FeedbackConfig>(seedConfig)

  const pushVersion = useCallback((prev: FeedbackConfig, note: string) => {
    return [
      ...prev.versions,
      {
        version: prev.versions.length + 1,
        changedOn: today(),
        changedBy: CURRENT_ADMIN,
        note,
      },
    ]
  }, [])

  /** Setup step: module toggle + categories + form schema (FBG-13/14/29). */
  const saveSetup = useCallback(
    (patch: { moduleEnabled: boolean; categories: CategoryDef[]; formFields: FormFieldDef[] }) => {
      setConfig((prev) => {
        const schemaChanged =
          JSON.stringify(patch.formFields) !== JSON.stringify(prev.formFields) ||
          JSON.stringify(patch.categories) !== JSON.stringify(prev.categories)
        const schemaVersion = schemaChanged ? prev.schemaVersion + 1 : prev.schemaVersion
        return {
          ...prev,
          ...patch,
          schemaVersion,
          versions: pushVersion(
            prev,
            schemaChanged
              ? `Setup saved: module ${patch.moduleEnabled ? 'enabled' : 'disabled'}; form schema bumped to v${schemaVersion} (existing entries keep their captured schema).`
              : `Setup saved: module ${patch.moduleEnabled ? 'enabled' : 'disabled'}.`
          ),
        }
      })
      toast.success('Setup configuration saved', {
        description: 'The change is versioned and effective from today.',
      })
      return true
    },
    [pushVersion]
  )

  /** Receivers step: routing, anonymity, SLAs, coordinator (FBG-21..26). */
  const saveReceivers = useCallback(
    (patch: ReceiversPatch) => {
      if (patch.coordinatorReminderDays > 0 && !patch.coordinator) {
        toast.error('Designate a Feedback / Grievance Coordinator', {
          description: 'Coordinator escalation is configured, so an accountable owner is required before saving.',
        })
        return false
      }
      setConfig((prev) => ({
        ...prev,
        ...patch,
        versions: pushVersion(
          prev,
          `Receiver routing saved: ${patch.nonAnonymousReceivers.length} non-anonymous / ${patch.anonymousReceivers.length} anonymous receiver role(s); anonymous support ${patch.anonymousEnabled ? 'on' : 'off'}; SLAs ${patch.approverReminderDays}d / ${patch.coordinatorReminderDays}d.`
        ),
      }))
      toast.success('Receiver configuration saved', {
        description: 'Future submissions route per the new configuration; prior routing history remains recorded.',
      })
      return true
    },
    [pushVersion]
  )

  /** Email templates step (FBG-28). */
  const saveTemplate = useCallback(
    (id: string, subject: string, body: string) => {
      setConfig((prev) => ({
        ...prev,
        templates: prev.templates.map((t) =>
          t.id === id ? { ...t, subject, body, updatedOn: today() } : t
        ),
        versions: pushVersion(
          prev,
          `Email template updated: ${prev.templates.find((t) => t.id === id)?.name ?? id}.`
        ),
      }))
      toast.success('Template saved', {
        description: 'Subsequent notifications will use the updated wording.',
      })
    },
    [pushVersion]
  )

  /** Portfolio-level per-company provisioning (FBG-10). */
  const toggleCompanyProvisioning = useCallback(
    (company: string) => {
      const enabled = !config.companyProvisioning[company]
      setConfig((prev) => ({
        ...prev,
        companyProvisioning: { ...prev.companyProvisioning, [company]: enabled },
        versions: pushVersion(prev, `Portfolio provisioning: ${company} ${enabled ? 'enabled' : 'disabled'}.`),
      }))
      toast.success(`${company}: module ${enabled ? 'enabled' : 'disabled'}`, {
        description: 'Feedback & grievance tracking, role-based review and access restriction apply per company.',
      })
    },
    [config.companyProvisioning, pushVersion]
  )

  return { config, saveSetup, saveReceivers, saveTemplate, toggleCompanyProvisioning }
}

export type FeedbackConfigStore = ReturnType<typeof useFeedbackConfig>
