import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { ROLES, type Role } from '@/context/role-context'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import { announceReAckWave } from '@/features/policy-distribution/data/reack-waves'
import {
  LINKED_MODULES,
  TENANT,
  seedPolicies,
  type Policy,
  type PolicyScope,
  type PolicyVersion,
} from '../data/policies'
import {
  evaluatePolicyForWorker,
  formatDate,
  windowsOverlap,
} from '../data/policy-utils'
import { seedWorkers } from '../data/workers'

export type PolicyDraft = Omit<
  Policy,
  'id' | 'tenant' | 'versions' | 'scopeConfigVersions' | 'retired'
> & { version: Omit<PolicyVersion, 'version' | 'createdOn'> }

export type VersionDraft = Omit<PolicyVersion, 'version' | 'createdOn'>

export interface PolicyNotification {
  id: string
  policyId: string
  policyName: string
  editionName: string
  message: string
  sentOn: string
  /** Only in-scope workers are notified (POL-18). */
  workerIds: string[]
}

export interface AuditEntry {
  id: string
  timestamp: string
  actorRole: Role
  action: string
  target: string
  outcome: 'success' | 'denied'
}

export interface RolePermission {
  role: Role
  canMaintain: boolean
  canView: boolean
}

const defaultPermissions: RolePermission[] = ROLES.map((role) => ({
  role,
  canMaintain:
    role === 'Platform Admin' ||
    role === 'Portfolio Admin' ||
    role === 'Group Company Admin' ||
    role === 'Company Admin',
  canView: role !== 'Employee (Non-User)',
}))

const seedNotifications: PolicyNotification[] = [
  {
    id: 'ntf-1',
    policyId: 'pol-1001',
    policyName: 'Employee Manual',
    editionName: 'Employee Manual 2026',
    message:
      'Employee Manual 2026 is now in force for your scope (effective 01 Jan 2026). Please review the updated AI tooling usage chapter.',
    sentOn: '2026-01-01',
    workerIds: ['w-01', 'w-02', 'w-04', 'w-08', 'w-10'],
  },
  {
    id: 'ntf-2',
    policyId: 'pol-1011',
    policyName: 'Asset Custody Policy',
    editionName: 'Asset Custody Policy v2',
    message:
      'Asset Custody Policy v2 has been published and becomes effective on 01 Aug 2026. BYOD registration will be required.',
    sentOn: '2026-06-20',
    workerIds: ['w-01', 'w-02', 'w-04', 'w-05', 'w-08', 'w-09', 'w-10'],
  },
]

const seedAudit: AuditEntry[] = [
  {
    id: 'aud-1',
    timestamp: '2026-06-20 10:42',
    actorRole: 'Company Admin',
    action: 'Published version',
    target: 'Asset Custody Policy v2',
    outcome: 'success',
  },
  {
    id: 'aud-2',
    timestamp: '2026-06-25 15:03',
    actorRole: 'Company Admin',
    action: 'Created draft',
    target: 'Intern Conduct Policy v1',
    outcome: 'success',
  },
  {
    id: 'aud-3',
    timestamp: '2026-06-26 09:18',
    actorRole: 'Employee (User)',
    action: 'Attempted policy edit',
    target: 'Remote Work Policy',
    outcome: 'denied',
  },
]

function nowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

/**
 * In-memory policy store. Stands in for the real effective-dated, tenant-scoped
 * persistence layer — every mutation preserves prior versions (POL-14) and
 * enforces non-overlapping effective windows (POL-15).
 */
export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>(seedPolicies)
  const [notifications, setNotifications] =
    useState<PolicyNotification[]>(seedNotifications)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(seedAudit)
  const [rolePermissions, setRolePermissions] =
    useState<RolePermission[]>(defaultPermissions)
  const [integrations, setIntegrations] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(LINKED_MODULES.map((m) => [m, true]))
  )
  const [refreshedAt, setRefreshedAt] = useState<string>(nowStamp())

  const recordAudit = useCallback(
    (actorRole: Role, action: string, target: string, outcome: 'success' | 'denied') => {
      setAuditLog((prev) => [
        { id: newId('aud'), timestamp: nowStamp(), actorRole, action, target, outcome },
        ...prev,
      ])
    },
    []
  )

  const canMaintain = useCallback(
    (role: Role) => rolePermissions.find((p) => p.role === role)?.canMaintain ?? false,
    [rolePermissions]
  )

  /** Denied maintenance attempts are blocked AND auditable (POL-08). */
  const recordDenied = useCallback(
    (role: Role, action: string, target: string) => {
      recordAudit(role, action, target, 'denied')
      toast.error(`${role} does not have policy maintenance rights`, {
        description: 'The attempt was denied and recorded in the audit trail.',
      })
    },
    [recordAudit]
  )

  /** Notify only workers inside the policy scope on publish (POL-18). */
  const notifyScope = useCallback((policy: Policy, version: PolicyVersion) => {
    const inScope = seedWorkers.filter(
      (w) => evaluatePolicyForWorker(policy, w, version.effectiveFrom).applies
    )
    setNotifications((prev) => [
      {
        id: newId('ntf'),
        policyId: policy.id,
        policyName: policy.name,
        editionName: version.editionName,
        message: `${version.editionName} has been published and takes effect on ${formatDate(
          version.effectiveFrom
        )}.`,
        sentOn: new Date().toISOString().slice(0, 10),
        workerIds: inScope.map((w) => w.id),
      },
      ...prev,
    ])
    return inScope.length
  }, [])

  /**
   * Publishing a NEW version of an already-published policy means the content
   * changed — employees who acknowledged an earlier edition must re-acknowledge.
   * Announces a re-acknowledgment wave to the Policy Distribution module and
   * records the request in the audit trail. Initial publications never announce.
   */
  const announceReAcknowledgment = useCallback(
    (policy: Policy, version: PolicyVersion, actorRole: Role) => {
      const trigger = version.regulatoryUpdate
        ? ('Regulatory update' as const)
        : ('Content change' as const)
      announceReAckWave({
        policyName: policy.name,
        editionName: version.editionName,
        trigger,
        priority: !!version.regulatoryUpdate,
        announcedBy: actorRole,
      })
      recordAudit(
        actorRole,
        `Re-acknowledgment requested (${trigger.toLowerCase()})`,
        `${policy.name} — ${version.editionName}`,
        'success'
      )
      publishAuditEvent({
        module: 'Policies',
        action: `Re-acknowledgment requested (${trigger})`,
        actor: actorRole,
        actorRole,
        actionType: 'update',
        recordId: policy.id,
        recordName: `${policy.name} — ${version.editionName}`,
      })
      toast.info('Employees will be asked to re-acknowledge', {
        description: version.regulatoryUpdate
          ? `${version.editionName} is a regulatory update — the re-acknowledgment is marked priority with a shorter deadline.`
          : `${version.editionName} replaces earlier acknowledged content, so previous acknowledgments no longer count.`,
      })
    },
    [recordAudit]
  )

  const addPolicy = useCallback(
    (draft: PolicyDraft, actorRole: Role) => {
      const version: PolicyVersion = {
        ...draft.version,
        version: 1,
        createdOn: new Date().toISOString().slice(0, 10),
      }
      const policy: Policy = {
        id: newId('pol'),
        name: draft.name,
        type: draft.type,
        category: draft.category,
        tenant: TENANT,
        ownerLevel: draft.ownerLevel,
        ownerName: draft.ownerName,
        linkedModules: draft.linkedModules,
        scope: draft.scope,
        scopeConfigVersions: [
          {
            version: 1,
            effectiveFrom: version.effectiveFrom,
            changedBy: actorRole,
            note: 'Initial applicability configuration',
            scope: draft.scope,
          },
        ],
        versions: [version],
        retired: false,
      }
      setPolicies((prev) => [policy, ...prev])
      recordAudit(actorRole, version.status === 'published' ? 'Created & published policy' : 'Created draft', `${draft.name} — ${version.editionName}`, 'success')
      if (version.status === 'published') {
        const count = notifyScope(policy, version)
        toast.success(`${draft.name} published`, {
          description: `${count} in-scope worker(s) notified.`,
        })
      } else {
        toast.success(`${draft.name} saved as draft`)
      }
      return policy
    },
    [notifyScope, recordAudit]
  )

  /**
   * Creates a new version, preserving prior editions (POL-04/32). Rejects
   * overlapping effective windows (POL-15); an open-ended prior version is
   * auto-closed the day before the new one starts (POL-05).
   */
  const addVersion = useCallback(
    (policyId: string, draft: VersionDraft, newScope: PolicyScope | null, actorRole: Role): boolean => {
      const policy = policies.find((p) => p.id === policyId)
      if (!policy) return false

      const published = policy.versions.filter((v) => v.status === 'published')
      const conflict = published.find(
        (v) =>
          v.effectiveTill !== null &&
          windowsOverlap(draft.effectiveFrom, draft.effectiveTill, v.effectiveFrom, v.effectiveTill)
      )
      if (conflict) {
        recordAudit(actorRole, 'Version rejected — overlapping effective period', `${policy.name} vs ${conflict.editionName}`, 'denied')
        toast.error('Integrity violation: overlapping effective periods', {
          description: `${conflict.editionName} already covers ${formatDate(conflict.effectiveFrom)} – ${formatDate(conflict.effectiveTill)}. Effective windows must not overlap.`,
        })
        return false
      }

      const nextNumber = Math.max(...policy.versions.map((v) => v.version)) + 1
      const version: PolicyVersion = {
        ...draft,
        version: nextNumber,
        createdOn: new Date().toISOString().slice(0, 10),
      }

      setPolicies((prev) =>
        prev.map((p) => {
          if (p.id !== policyId) return p
          const closed = p.versions.map((v) => {
            if (v.status === 'published' && v.effectiveTill === null && v.effectiveFrom < version.effectiveFrom) {
              const till = new Date(version.effectiveFrom)
              till.setDate(till.getDate() - 1)
              return { ...v, effectiveTill: till.toISOString().slice(0, 10) }
            }
            return v
          })
          const next: Policy = { ...p, versions: [...closed, version] }
          if (newScope) {
            next.scope = newScope
            next.scopeConfigVersions = [
              ...p.scopeConfigVersions,
              {
                version: p.scopeConfigVersions.length + 1,
                effectiveFrom: version.effectiveFrom,
                changedBy: actorRole,
                note: `Applicability updated with ${version.editionName}`,
                scope: newScope,
              },
            ]
          }
          return next
        })
      )

      recordAudit(actorRole, version.status === 'published' ? 'Published new version' : 'Drafted new version', `${policy.name} — ${version.editionName}`, 'success')
      if (version.status === 'published') {
        const updated: Policy = { ...policy, scope: newScope ?? policy.scope }
        const count = notifyScope(updated, version)
        toast.success(`${version.editionName} published (v${nextNumber})`, {
          description: `Prior editions preserved. ${count} in-scope worker(s) notified.`,
        })
        // Content changed relative to an earlier published edition →
        // start a re-acknowledgment wave.
        if (published.length > 0) {
          announceReAcknowledgment(updated, version, actorRole)
        }
      } else {
        toast.success(`${version.editionName} saved as draft (v${nextNumber})`)
      }
      return true
    },
    [policies, notifyScope, recordAudit, announceReAcknowledgment]
  )

  /** Publish an existing draft version after preview (POL-27). */
  const publishVersion = useCallback(
    (policyId: string, versionNumber: number, actorRole: Role) => {
      const policy = policies.find((p) => p.id === policyId)
      const version = policy?.versions.find((v) => v.version === versionNumber)
      if (!policy || !version) return
      const published: PolicyVersion = { ...version, status: 'published' }
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === policyId
            ? { ...p, versions: p.versions.map((v) => (v.version === versionNumber ? published : v)) }
            : p
        )
      )
      recordAudit(actorRole, 'Published version', `${policy.name} — ${version.editionName}`, 'success')
      const count = notifyScope(policy, published)
      toast.success(`${version.editionName} published`, {
        description: `Active per its effective dates. ${count} in-scope worker(s) notified.`,
      })
      // A draft published on top of earlier published editions is a content
      // change for everyone who already acknowledged → re-acknowledgment wave.
      const priorPublished = policy.versions.some(
        (v) => v.status === 'published' && v.version !== versionNumber
      )
      if (priorPublished) {
        announceReAcknowledgment(policy, published, actorRole)
      }
    },
    [policies, notifyScope, recordAudit, announceReAcknowledgment]
  )

  /** Retire = no longer applied, history retained for audit (POL-01/14). */
  const retirePolicy = useCallback(
    (policyId: string, actorRole: Role) => {
      const policy = policies.find((p) => p.id === policyId)
      if (!policy) return
      setPolicies((prev) => prev.map((p) => (p.id === policyId ? { ...p, retired: true } : p)))
      recordAudit(actorRole, 'Retired policy', policy.name, 'success')
      toast.success(`${policy.name} retired`, {
        description: 'It no longer applies; version history remains available.',
      })
    },
    [policies, recordAudit]
  )

  const toggleRolePermission = useCallback(
    (role: Role, field: 'canMaintain' | 'canView') => {
      setRolePermissions((prev) =>
        prev.map((p) => (p.role === role ? { ...p, [field]: !p[field] } : p))
      )
      toast.success(`Permissions updated for ${role}`)
    },
    []
  )

  const toggleIntegration = useCallback((module: string) => {
    setIntegrations((prev) => {
      const next = { ...prev, [module]: !prev[module] }
      toast.success(
        next[module]
          ? `${module} module now consumes in-force policies`
          : `${module} module integration paused`
      )
      return next
    })
  }, [])

  /** On-demand list refresh preserving filters (POL-29). */
  const refresh = useCallback(() => {
    setRefreshedAt(nowStamp())
    toast.success('Policy list refreshed', {
      description: 'Latest policies and effective statuses loaded.',
    })
  }, [])

  return {
    policies,
    notifications,
    auditLog,
    rolePermissions,
    integrations,
    refreshedAt,
    canMaintain,
    recordDenied,
    addPolicy,
    addVersion,
    publishVersion,
    retirePolicy,
    toggleRolePermission,
    toggleIntegration,
    refresh,
  }
}

export type PoliciesStore = ReturnType<typeof usePolicies>
