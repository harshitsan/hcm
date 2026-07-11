import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { companyName } from '../data/companies'
import {
  activeMemberships,
  AUTH_METHOD_LABELS,
  type AuthMethod,
  type AuthUser,
} from '../data/auth-users'
import { type PasswordPolicyVersion } from '../data/auth-config'
import { type AuditEventDraft } from './use-auth-audit'
import { type AuthUsersStore } from './use-auth-users'

/** Demo credential accepted for every local (Email/Password) account. */
export const DEMO_PASSWORD = 'Demo@2026!'

/** Code the mock authenticator app always displays (TOTP simulation). */
export const DEMO_MFA_CODE = '246810'

export interface SessionState {
  userId: string
  method: AuthMethod
  activeCompanyId: string
}

/** Credentials verified but a second factor still owed — no session yet. */
export interface MfaPendingState {
  userId: string
  method: AuthMethod
  /** First MFA sign-in enrolls the authenticator; later ones only challenge. */
  mode: 'enroll' | 'challenge'
}

const dayInMs = 86_400_000

/**
 * Simulated authentication session (AUTH-01/02/05/19). Login attempts,
 * failures, lockouts, MFA enrollment/challenges, logouts and context switches
 * all append to the audit log; a successful sign-in binds the session to the
 * User entity's memberships. The current effective password policy is
 * enforced here: consecutive failures lock the account at lockoutThreshold
 * and expired local credentials are refused until reset.
 */
export function useLoginSession(
  usersStore: Pick<
    AuthUsersStore,
    'users' | 'recordLoginFailure' | 'recordLoginSuccess' | 'setMfaEnrolled'
  >,
  logEvent: (draft: AuditEventDraft) => void,
  policy: PasswordPolicyVersion,
  /** Companies whose members must present a second factor at sign-in. */
  mfaCompanyIds: string[]
) {
  const { users, recordLoginFailure, recordLoginSuccess, setMfaEnrolled } =
    usersStore
  const [session, setSession] = useState<SessionState | null>(null)
  const [mfaPending, setMfaPending] = useState<MfaPendingState | null>(null)

  const sessionUser = useMemo(
    () => (session ? (users.find((u) => u.id === session.userId) ?? null) : null),
    [session, users]
  )

  const mfaPendingUser = useMemo(
    () =>
      mfaPending
        ? (users.find((u) => u.id === mfaPending.userId) ?? null)
        : null,
    [mfaPending, users]
  )

  /** MFA applies when any of the user's active companies requires it. */
  const mfaRequired = useCallback(
    (user: AuthUser) =>
      activeMemberships(user).some((m) => mfaCompanyIds.includes(m.companyId)),
    [mfaCompanyIds]
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
      recordLoginSuccess(user.id)
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
    [logEvent, recordLoginSuccess]
  )

  /** Credentials passed — park the sign-in behind the second factor. */
  const beginMfa = useCallback(
    (user: AuthUser, method: AuthMethod) => {
      const mode = user.mfaEnrolled ? 'challenge' : 'enroll'
      setMfaPending({ userId: user.id, method, mode })
      toast.info(
        mode === 'enroll'
          ? 'MFA required — enroll your authenticator to continue'
          : 'Enter the code from your authenticator to continue'
      )
    },
    []
  )

  /** Route through the MFA step when required, else open the session. */
  const proceed = useCallback(
    (user: AuthUser, method: AuthMethod) => {
      if (mfaRequired(user)) {
        beginMfa(user, method)
      } else {
        start(user, method)
      }
    },
    [mfaRequired, beginMfa, start]
  )

  const loginWithPassword = useCallback(
    (email: string, password: string) => {
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )
      // Locked accounts are refused outright — even with valid credentials.
      if (user?.lockedAt) {
        logEvent({
          actor: user.email,
          eventType: 'login-failure',
          method: 'password',
          outcome: 'failure',
          detail: 'Account is locked out; sign-in refused before credential evaluation.',
        })
        toast.error('Account locked — reset your password or contact an administrator')
        return false
      }
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
        // A wrong password against a real, active local account counts
        // toward the policy lockout threshold.
        if (user && user.authMethod === 'password' && user.status === 'active') {
          const { attempts, locked } = recordLoginFailure(
            user.id,
            policy.lockoutThreshold,
            policy.version
          )
          if (locked) {
            toast.error(
              `Account locked after ${attempts} consecutive failed attempts`
            )
            return false
          }
        }
        toast.error('Incorrect email or password. Please try again.')
        return false
      }
      // Password expiry under the current effective policy (AUTH-17).
      const ageDays = user.passwordUpdatedAt
        ? Math.floor(
            (Date.now() - new Date(user.passwordUpdatedAt).getTime()) / dayInMs
          )
        : null
      if (ageDays !== null && ageDays > policy.expiryDays) {
        logEvent({
          actor: user.email,
          eventType: 'login-failure',
          method: 'password',
          outcome: 'failure',
          detail: `Password expired under policy v${policy.version} (${ageDays} days old, limit ${policy.expiryDays}); reset required before sign-in.`,
        })
        toast.error('Password expired — use “Forgot password?” to set a new one')
        return false
      }
      proceed(user, 'password')
      return true
    },
    [users, proceed, logEvent, recordLoginFailure, policy]
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
      proceed(user, method)
      return true
    },
    [proceed, logEvent]
  )

  /** Verify the one-time code; enrollment happens on the first MFA sign-in. */
  const submitMfaCode = useCallback(
    (code: string) => {
      if (!mfaPending || !mfaPendingUser) return false
      const user = mfaPendingUser
      if (code.trim() !== DEMO_MFA_CODE) {
        logEvent({
          actor: user.email,
          eventType: 'mfa-challenge',
          method: mfaPending.method,
          outcome: 'failure',
          detail: 'One-time code rejected; no session created until the challenge passes.',
        })
        toast.error('That code is not valid. Please try again.')
        return false
      }
      if (mfaPending.mode === 'enroll') {
        setMfaEnrolled(user.id)
        logEvent({
          actor: user.email,
          eventType: 'mfa-enrolled',
          method: mfaPending.method,
          outcome: 'success',
          detail: 'Authenticator (TOTP) enrolled and verified; future sign-ins require a one-time code.',
        })
      } else {
        logEvent({
          actor: user.email,
          eventType: 'mfa-challenge',
          method: mfaPending.method,
          outcome: 'success',
          detail: 'One-time code verified against the enrolled authenticator.',
        })
      }
      setMfaPending(null)
      start(user, mfaPending.method)
      return true
    },
    [mfaPending, mfaPendingUser, setMfaEnrolled, logEvent, start]
  )

  /** Abandoning the second factor grants no access and is audited. */
  const cancelMfa = useCallback(() => {
    if (!mfaPending || !mfaPendingUser) return
    logEvent({
      actor: mfaPendingUser.email,
      eventType: 'mfa-challenge',
      method: mfaPending.method,
      outcome: 'failure',
      detail: 'MFA step abandoned; credentials verified but no session created.',
    })
    setMfaPending(null)
  }, [mfaPending, mfaPendingUser, logEvent])

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

  return {
    session,
    sessionUser,
    mfaPending,
    mfaPendingUser,
    loginWithPassword,
    loginWithSso,
    submitMfaCode,
    cancelMfa,
    switchCompany,
    logout,
  }
}

export type LoginSessionStore = ReturnType<typeof useLoginSession>
