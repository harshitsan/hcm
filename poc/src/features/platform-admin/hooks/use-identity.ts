import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAccessAudits,
  seedAuthProviders,
  seedPersonRecords,
  seedSystemUsers,
  type AccessAuditRow,
  type AuthProvider,
  type CompanyMembership,
  type PersonRecord,
  type SystemUser,
} from '../data/identity'
import { seedPermissionSets, seedRoles } from '../data/roles'

export interface SystemUserDraft {
  name: string
  email: string
  status: SystemUser['status']
  membership: CompanyMembership
}

/**
 * In-memory identity & access store (SYS-02, 10, 11, 12, 20, 21, 29, 30, 38,
 * 39, 42, 43, 44, 75). Auth providers, system users with per-company
 * memberships, person records (engagements) and access audits.
 */
export function useIdentity() {
  const [authProviders, setAuthProviders] =
    useState<AuthProvider[]>(seedAuthProviders)
  const [systemUsers, setSystemUsers] =
    useState<SystemUser[]>(seedSystemUsers)
  const [personRecords, setPersonRecords] =
    useState<PersonRecord[]>(seedPersonRecords)
  const [accessAudits, setAccessAudits] =
    useState<AccessAuditRow[]>(seedAccessAudits)
  const roles = seedRoles
  const permissionSets = seedPermissionSets

  /** Platform-wide enable/disable of an auth method (SYS-02, 75). */
  const toggleProvider = useCallback((id: string) => {
    setAuthProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const enabled = !p.enabledOnPlatform
        toast.success(
          enabled
            ? `${p.name} is now available to tenants`
            : `${p.name} disabled platform-wide`
        )
        return { ...p, enabledOnPlatform: enabled }
      })
    )
  }, [])

  /** Company-level SSO adoption of a platform-enabled provider (SYS-30). */
  const adoptProvider = useCallback((id: string, tenantId: string) => {
    setAuthProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const adopted = p.adoptedByTenantIds.includes(tenantId)
        toast.success(
          adopted
            ? `${p.name} disabled for the company`
            : `${p.name} enabled for the company's users`
        )
        return {
          ...p,
          adoptedByTenantIds: adopted
            ? p.adoptedByTenantIds.filter((t) => t !== tenantId)
            : [...p.adoptedByTenantIds, tenantId],
        }
      })
    )
  }, [])

  /** Creates a user, or adds a company membership to an existing one (SYS-39). */
  const addUser = useCallback((draft: SystemUserDraft) => {
    setSystemUsers((prev) => {
      const existing = prev.find(
        (u) => u.email.toLowerCase() === draft.email.toLowerCase()
      )
      if (existing) {
        if (
          existing.memberships.some(
            (m) => m.tenantId === draft.membership.tenantId
          )
        ) {
          toast.error('User already has a membership in that company')
          return prev
        }
        toast.success(
          `Membership added — same identity, no duplicate user created`
        )
        return prev.map((u) =>
          u.id === existing.id
            ? { ...u, memberships: [...u.memberships, draft.membership] }
            : u
        )
      }
      toast.success(`${draft.name} added`)
      return [
        {
          id: `usr-${crypto.randomUUID().slice(0, 8)}`,
          name: draft.name,
          email: draft.email,
          status: draft.status,
          memberships: [draft.membership],
        },
        ...prev,
      ]
    })
  }, [])

  const removeMembership = useCallback((userId: string, tenantId: string) => {
    setSystemUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              memberships: u.memberships.filter(
                (m) => m.tenantId !== tenantId
              ),
            }
          : u
      )
    )
    toast.success('Company access revoked — other companies unaffected')
  }, [])

  /** Ends one engagement; the person's other engagements continue (SYS-42, 43). */
  const terminateEngagement = useCallback(
    (id: string) => {
      setPersonRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'terminated' } : r))
      )
      const rec = personRecords.find((r) => r.id === id)
      const others = personRecords.filter(
        (r) => r.personKey === rec?.personKey && r.id !== id
      ).length
      toast.success(
        others > 0
          ? `Engagement terminated — ${others} other engagement(s) unaffected`
          : 'Engagement terminated'
      )
    },
    [personRecords]
  )

  /** Maps a login onto an existing non-user record without duplication (SYS-29, 44). */
  const provisionAccess = useCallback((record: PersonRecord) => {
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`
    setSystemUsers((prev) => [
      {
        id: userId,
        name: record.personName,
        email: `${record.personName.toLowerCase().replace(/[^a-z]+/g, '.')}@invited.example`,
        status: 'invited',
        memberships: [
          {
            tenantId: record.tenantId,
            roleIds:
              record.workforceType === 'contractor'
                ? ['role-ctr']
                : ['role-emp'],
            personRecordId: record.id,
          },
        ],
      },
      ...prev,
    ])
    setPersonRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, userId } : r))
    )
    toast.success(
      `Login provisioned for ${record.personName} — mapped to the existing record, no duplicate created`
    )
  }, [])

  /** Editing a set updates every role that includes it (SYS-10). */
  const touchPermissionSet = useCallback(
    (setId: string) => {
      const affected = roles.filter((r) =>
        r.permissionSetIds.includes(setId)
      ).length
      toast.success(
        `Permission set updated — ${affected} role(s) that include it were updated`
      )
    },
    [roles]
  )

  const runAccessAudit = useCallback((tenantCode: string) => {
    setAccessAudits((prev) => [
      {
        id: `aa-${crypto.randomUUID().slice(0, 8)}`,
        tenantId: tenantCode,
        userName: 'You',
        detail: 'Access audit run — users × roles matrix reviewed',
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      },
      ...prev,
    ])
    toast.success('Access audit completed')
  }, [])

  return {
    authProviders,
    systemUsers,
    personRecords,
    accessAudits,
    roles,
    permissionSets,
    toggleProvider,
    adoptProvider,
    addUser,
    removeMembership,
    terminateEngagement,
    provisionAccess,
    touchPermissionSet,
    runAccessAudit,
  }
}

export type IdentityStore = ReturnType<typeof useIdentity>
