import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedConfig,
  type CategoryDef,
  type CoordinatorRoleDef,
  type FeedbackConfig,
  type FormFieldDef,
  type ReceiverDef,
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

  /**
   * Feedback Coordinator role (Organization > Role): role name/type,
   * description and the applicable location/department/position/employee.
   */
  const saveCoordinatorRole = useCallback(
    (def: CoordinatorRoleDef) => {
      if (!def.roleName.trim()) {
        toast.error('Role name is required')
        return false
      }
      if (!def.applicableEmployee) {
        toast.error('Select the applicable employee', {
          description:
            'The Feedback Coordinator role must be assigned to an employee.',
        })
        return false
      }
      setConfig((prev) => ({
        ...prev,
        coordinatorRole: def,
        versions: pushVersion(
          prev,
          `Coordinator role saved: "${def.roleName}" (${def.roleType}) assigned to ${def.applicableEmployee}.`
        ),
      }))
      toast.success('Feedback Coordinator role saved', {
        description: `${def.applicableEmployee} can now act on behalf of any employee and view/manage anonymous feedback/grievances.`,
      })
      return true
    },
    [pushVersion]
  )

  /** "Add New Feedback/Grievance Receivers" — applicability cascade + roles. */
  const addReceiverDef = useCallback(
    (def: Omit<ReceiverDef, 'id' | 'addedOn' | 'addedBy'>) => {
      if (def.applicableEmployees.length === 0 && def.applicableRoles.length === 0) {
        toast.error('Select at least one applicable employee or role', {
          description:
            'A receiver must be a specific employee or an employee with a specific role.',
        })
        return false
      }
      setConfig((prev) => ({
        ...prev,
        receiverDefs: [
          ...prev.receiverDefs,
          {
            ...def,
            id: `rcv-${prev.receiverDefs.length + 1}-${Date.now()}`,
            addedOn: today(),
            addedBy: CURRENT_ADMIN,
          },
        ],
        versions: pushVersion(
          prev,
          `Receiver added: ${[...def.applicableEmployees, ...def.applicableRoles.map((r) => `${r} (role)`)].join(', ') || '—'}.`
        ),
      }))
      toast.success('Feedback/Grievance receiver added', {
        description: 'The receiver can respond to submissions within the configured applicability scope.',
      })
      return true
    },
    [pushVersion]
  )

  const removeReceiverDef = useCallback(
    (id: string) => {
      setConfig((prev) => ({
        ...prev,
        receiverDefs: prev.receiverDefs.filter((r) => r.id !== id),
        versions: pushVersion(prev, 'Receiver configuration removed.'),
      }))
      toast.success('Receiver removed', {
        description: 'Existing entries keep their recorded routing history.',
      })
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

  return {
    config,
    saveSetup,
    saveReceivers,
    saveCoordinatorRole,
    addReceiverDef,
    removeReceiverDef,
    saveTemplate,
    toggleCompanyProvisioning,
  }
}

export type FeedbackConfigStore = ReturnType<typeof useFeedbackConfig>
