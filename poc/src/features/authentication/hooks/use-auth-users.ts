import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { companyName, seedEmployees, type EmployeeRecord } from '../data/companies'
import {
  seedAuthUsers,
  type AuthUser,
  type CompanyMembership,
  type CompanyRole,
} from '../data/auth-users'
import { type AuditEventDraft } from './use-auth-audit'

export type AuthUserDraft = Omit<
  AuthUser,
  | 'id'
  | 'lastLogin'
  | 'passwordUpdatedAt'
  | 'failedAttempts'
  | 'lockedAt'
  | 'mfaEnrolled'
  | 'memberships'
> & {
  /** Initial company membership for the new identity. */
  companyId: string
  roles: CompanyRole[]
  employeeId: string | null
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * In-memory store for User identities, their tenant-scoped memberships and
 * the workforce (Employee) records they may link to. Mirrors use-users.ts —
 * mutations touch local state only; audit entries flow through `logEvent`.
 */
export function useAuthUsers(logEvent: (draft: AuditEventDraft) => void) {
  const [users, setUsers] = useState<AuthUser[]>(seedAuthUsers)
  const [employees, setEmployees] = useState<EmployeeRecord[]>(seedEmployees)

  /** Unique login identity constraint (AUTH-16). */
  const emailTaken = useCallback(
    (email: string, exceptId?: string) =>
      users.some(
        (u) => u.id !== exceptId && u.email.toLowerCase() === email.toLowerCase()
      ),
    [users]
  )

  const addUser = useCallback(
    (draft: AuthUserDraft) => {
      const membership: CompanyMembership = {
        id: `m-${crypto.randomUUID().slice(0, 8)}`,
        companyId: draft.companyId,
        roles: draft.roles,
        employeeId: draft.employeeId,
        status: 'active',
        effectiveFrom: today(),
        effectiveTo: null,
      }
      const user: AuthUser = {
        id: `au-${crypto.randomUUID().slice(0, 8)}`,
        name: draft.name,
        email: draft.email,
        authMethod: draft.authMethod,
        status: draft.status,
        lastLogin: null,
        passwordUpdatedAt: null,
        failedAttempts: 0,
        lockedAt: null,
        mfaEnrolled: false,
        memberships: [membership],
      }
      setUsers((prev) => [user, ...prev])
      if (draft.employeeId) {
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === draft.employeeId ? { ...e, linkedUserId: user.id } : e
          )
        )
      }
      logEvent({
        actor: draft.email,
        eventType: 'membership-change',
        companyId: draft.companyId,
        outcome: 'info',
        detail: `User created${draft.employeeId ? ' and linked to an employee record' : ' with no workforce record'} in ${companyName(draft.companyId)}.`,
      })
      toast.success(`${draft.name} created`)
      return user
    },
    [logEvent]
  )

  /**
   * Count a consecutive failed local sign-in; when the policy
   * lockoutThreshold is reached the account is locked and audited.
   */
  const recordLoginFailure = useCallback(
    (userId: string, threshold: number, policyVersion: number) => {
      const user = users.find((u) => u.id === userId)
      if (!user) return { attempts: 0, locked: false }
      const attempts = user.failedAttempts + 1
      const locked = user.lockedAt === null && attempts >= threshold
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                failedAttempts: attempts,
                lockedAt: locked ? new Date().toISOString() : u.lockedAt,
              }
            : u
        )
      )
      if (locked) {
        logEvent({
          actor: user.email,
          eventType: 'account-locked',
          method: 'password',
          outcome: 'failure',
          detail: `User locked out after ${attempts} consecutive failed sign-in attempts (policy v${policyVersion} lockout threshold: ${threshold}). Unlock requires an administrator or a completed password reset.`,
        })
      }
      return { attempts, locked }
    },
    [users, logEvent]
  )

  /** Successful sign-in resets the failure counter and stamps last login. */
  const recordLoginSuccess = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, failedAttempts: 0, lastLogin: new Date().toISOString() }
          : u
      )
    )
  }, [])

  /** Administrative unlock — clears the lock and the failure counter. */
  const unlockUser = useCallback(
    (userId: string, actor: string) => {
      const user = users.find((u) => u.id === userId)
      if (!user || user.lockedAt === null) return
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, lockedAt: null, failedAttempts: 0 } : u
        )
      )
      logEvent({
        actor,
        eventType: 'account-unlocked',
        method: 'password',
        outcome: 'info',
        detail: `${user.email} unlocked by an administrator; failed-attempt counter reset to 0.`,
      })
      toast.success(`${user.name} unlocked`)
    },
    [users, logEvent]
  )

  /** Marks the authenticator as enrolled — the sign-in flow audits it. */
  const setMfaEnrolled = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, mfaEnrolled: true } : u))
    )
  }, [])

  /** Completed self-service reset: fresh credential clears expiry + lockout. */
  const completePasswordReset = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, passwordUpdatedAt: today(), failedAttempts: 0, lockedAt: null }
          : u
      )
    )
  }, [])

  const updateUser = useCallback(
    (id: string, patch: Partial<Pick<AuthUser, 'name' | 'email' | 'authMethod' | 'status'>>) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
      toast.success('User updated')
    },
    []
  )

  const addMembership = useCallback(
    (userId: string, companyId: string, roles: CompanyRole[], actor: string) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u
          const membership: CompanyMembership = {
            id: `m-${crypto.randomUUID().slice(0, 8)}`,
            companyId,
            roles,
            employeeId: null,
            status: 'active',
            effectiveFrom: today(),
            effectiveTo: null,
          }
          return { ...u, memberships: [...u.memberships, membership] }
        })
      )
      logEvent({
        actor,
        eventType: 'membership-change',
        companyId,
        outcome: 'info',
        detail: `Membership granted in ${companyName(companyId)} with roles: ${roles.join(', ')}.`,
      })
      toast.success(`Membership added in ${companyName(companyId)}`)
    },
    [logEvent]
  )

  const setMembershipRoles = useCallback(
    (userId: string, membershipId: string, roles: CompanyRole[], actor: string) => {
      let companyId: string | null = null
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u
          return {
            ...u,
            memberships: u.memberships.map((m) => {
              if (m.id !== membershipId) return m
              companyId = m.companyId
              return { ...m, roles }
            }),
          }
        })
      )
      logEvent({
        actor,
        eventType: 'membership-change',
        companyId,
        outcome: 'info',
        detail: `Roles updated to: ${roles.join(', ')}. Other companies' assignments unchanged.`,
      })
      toast.success('Roles updated for this company only')
    },
    [logEvent]
  )

  /** Effective-dated revoke — prior state retained, not deleted (AUTH-16). */
  const revokeMembership = useCallback(
    (userId: string, membershipId: string, actor: string) => {
      let companyId: string | null = null
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u
          return {
            ...u,
            memberships: u.memberships.map((m) => {
              if (m.id !== membershipId) return m
              companyId = m.companyId
              return { ...m, status: 'revoked' as const, effectiveTo: today() }
            }),
          }
        })
      )
      logEvent({
        actor,
        eventType: 'membership-change',
        companyId,
        outcome: 'info',
        detail: `Membership revoked in ${companyName(companyId)}; access denied at next context evaluation. Record retained effective-dated.`,
      })
      toast.success('Membership revoked (history retained)')
    },
    [logEvent]
  )

  const linkEmployee = useCallback(
    (userId: string, membershipId: string, employeeId: string, actor: string) => {
      let companyId: string | null = null
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u
          return {
            ...u,
            memberships: u.memberships.map((m) => {
              if (m.id !== membershipId) return m
              companyId = m.companyId
              return { ...m, employeeId }
            }),
          }
        })
      )
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, linkedUserId: userId } : e))
      )
      logEvent({
        actor,
        eventType: 'link-change',
        companyId,
        outcome: 'info',
        detail: `User linked to employee ${employeeId}. User and Employee remain distinct, associated records.`,
      })
      toast.success('Employee record linked')
    },
    [logEvent]
  )

  const unlinkEmployee = useCallback(
    (userId: string, membershipId: string, actor: string) => {
      let companyId: string | null = null
      let employeeId: string | null = null
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u
          return {
            ...u,
            memberships: u.memberships.map((m) => {
              if (m.id !== membershipId) return m
              companyId = m.companyId
              employeeId = m.employeeId
              return { ...m, employeeId: null }
            }),
          }
        })
      )
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, linkedUserId: null } : e))
      )
      logEvent({
        actor,
        eventType: 'link-change',
        companyId,
        outcome: 'info',
        detail: 'Employee unlinked: user account persists; employee reverts to a workforce-only record with no login.',
      })
      toast.success('Employee record unlinked — user account persists')
    },
    [logEvent]
  )

  return {
    users,
    employees,
    emailTaken,
    addUser,
    updateUser,
    recordLoginFailure,
    recordLoginSuccess,
    unlockUser,
    setMfaEnrolled,
    completePasswordReset,
    addMembership,
    setMembershipRoles,
    revokeMembership,
    linkEmployee,
    unlinkEmployee,
  }
}

export type AuthUsersStore = ReturnType<typeof useAuthUsers>
