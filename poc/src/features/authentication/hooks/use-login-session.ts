import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { companyName } from '../data/companies'
import {
  activeMemberships,
  AUTH_METHOD_LABELS,
  type AuthMethod,
  type AuthUser,
} from '../data/auth-users'
import { type AuditEventDraft } from './use-auth-audit'

/** Demo credential accepted for every local (Email/Password) account. */
export const DEMO_PASSWORD = 'Demo@2026!'

export interface SessionState {
  userId: string
  method: AuthMethod
  activeCompanyId: string
}

/**
 * Simulated authentication session (AUTH-01/02/05/19). Login attempts,
 * failures, logouts and context switches all append to the audit log; a
 * successful sign-in binds the session to the User entity's memberships.
 */
export function useLoginSession(
  users: AuthUser[],
  logEvent: (draft: AuditEventDraft) => void
) {
  const [session, setSession] = useState<SessionState | null>(null)

  const sessionUser = useMemo(
    () => (session ? (users.find((u) => u.id === session.userId) ?? null) : null),
    [session, users]
  )

  const start = useCallback(
    (user: AuthUser, method: AuthMethod) => {
      const companies = activeMemberships(user)
      // Single-company users get that company as active context with no
      // switch prompt (AUTH-05/19); multi-company users start on the first.
      const first = companies[0]
      if (!first) {
        logEvent({
          actor: user.email,
          eventType: 'login-failure',
          method,
          outcome: 'failure',
          detail: 'Authenticated identity holds no active company membership; access denied.',
        })
        toast.error('No active company membership — access denied')
        return
      }
      setSession({ userId: user.id, method, activeCompanyId: first.companyId })
      logEvent({
        actor: user.email,
        eventType: method === 'password' ? 'login-success' : 'sso-login',
        method,
        companyId: first.companyId,
        outcome: 'success',
        detail:
          method === 'password'
            ? 'Local credential verified against stored hash; plain text never persisted or logged.'
            : `Federated identity resolved to User ${user.id}; session bound to its roles and permissions.`,
      })
      toast.success(`Signed in as ${user.name}`)
    },
    [logEvent]
  )

  const loginWithPassword = useCallback(
    (email: string, password: string) => {
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )
      const valid =
        user !== undefined &&
        user.authMethod === 'password' &&
        user.status === 'active' &&
        password === DEMO_PASSWORD
      if (!valid) {
        // Generic error — never disclose which field was wrong (AUTH-01).
        logEvent({
          actor: email || 'unknown',
          eventType: 'login-failure',
          method: 'password',
          outcome: 'failure',
          detail: 'Invalid credentials. Generic error returned; field-level cause not disclosed.',
        })
        toast.error('Incorrect email or password. Please try again.')
        return false
      }
      start(user, 'password')
      return true
    },
    [users, start, logEvent]
  )

  const loginWithSso = useCallback(
    (user: AuthUser, method: AuthMethod, providerAccepts: boolean) => {
      if (!providerAccepts) {
        logEvent({
          actor: user.email,
          eventType: 'sso-rejected',
          method,
          outcome: 'failure',
          detail: `${AUTH_METHOD_LABELS[method]} rejected the authentication; no application session created.`,
        })
        toast.error('Your identity provider rejected the sign-in')
        return false
      }
      start(user, method)
      return true
    },
    [start, logEvent]
  )

  /** Same authenticated session — no re-authentication (AUTH-05). */
  const switchCompany = useCallback(
    (companyId: string) => {
      if (!session || !sessionUser) return
      const from = companyName(session.activeCompanyId)
      setSession({ ...session, activeCompanyId: companyId })
      logEvent({
        actor: sessionUser.email,
        eventType: 'context-switch',
        companyId,
        outcome: 'info',
        detail: `Active company switched ${from} → ${companyName(companyId)} without re-authentication.`,
      })
      toast.success(`Context switched to ${companyName(companyId)}`)
    },
    [session, sessionUser, logEvent]
  )

  const logout = useCallback(() => {
    if (!session || !sessionUser) return
    logEvent({
      actor: sessionUser.email,
      eventType: 'logout',
      companyId: session.activeCompanyId,
      outcome: 'info',
      detail: 'Session terminated by user.',
    })
    setSession(null)
    toast.success('Signed out')
  }, [session, sessionUser, logEvent])

  return { session, sessionUser, loginWithPassword, loginWithSso, switchCompany, logout }
}

export type LoginSessionStore = ReturnType<typeof useLoginSession>
