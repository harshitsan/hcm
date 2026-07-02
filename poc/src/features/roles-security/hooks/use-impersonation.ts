import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import {
  CURRENT_SUPPORT_USER,
  seedImpersonationAuths,
  seedImpersonationSessions,
  type ImpersonationAuth,
  type ImpersonationSession,
  type SupportUser,
} from '../data/impersonation'
import { companyName, personById } from '../data/directory'
import type { AuditAppendInput, NotifyInput } from './use-security-audit'

interface UseImpersonationOptions {
  append: (input: AuditAppendInput) => void
  notify: (input: NotifyInput) => void
  actorRole: Role
}

/**
 * Impersonation store (RSEC-06, RSEC-07, RSEC-14): Company Admins authorize
 * support users per company; only authorized support users can start a
 * "login as user" session; the start, every action and the end are written
 * to the append-only audit store, and the notification engine alerts the
 * company (RSEC-22).
 */
export function useImpersonation({
  append,
  notify,
  actorRole,
}: UseImpersonationOptions) {
  const [auths, setAuths] = useState<ImpersonationAuth[]>(
    seedImpersonationAuths
  )
  const [sessions, setSessions] = useState<ImpersonationSession[]>(
    seedImpersonationSessions
  )
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const activeSession =
    sessions.find((s) => s.id === activeSessionId && s.endedAt === null) ??
    null

  const isAuthorized = useCallback(
    (supportUser: SupportUser, companyId: string): boolean =>
      auths.some(
        (a) =>
          a.supportUser === supportUser &&
          a.companyId === companyId &&
          a.status === 'Active'
      ),
    [auths]
  )

  /** RSEC-14: Company Admin grants a support user impersonation authority. */
  const grantAuth = useCallback(
    (supportUser: SupportUser, companyId: string, grantedBy: string) => {
      setAuths((prev) => [
        {
          id: `ia-${crypto.randomUUID().slice(0, 8)}`,
          supportUser,
          companyId,
          grantedBy,
          grantedOn: new Date().toISOString().slice(0, 10),
          status: 'Active',
        },
        ...prev.filter(
          (a) => !(a.supportUser === supportUser && a.companyId === companyId)
        ),
      ])
      append({
        category: 'Config',
        actor: grantedBy,
        actorRole,
        target: supportUser,
        detail: `Impersonation authorization granted for ${companyName(companyId)}`,
        targetCompanyId: companyId,
      })
      toast.success(`${supportUser} may now impersonate users of ${companyName(companyId)}`)
    },
    [append, actorRole]
  )

  const revokeAuth = useCallback(
    (id: string, revokedBy: string) => {
      const auth = auths.find((a) => a.id === id)
      setAuths((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Revoked' } : a))
      )
      if (auth) {
        append({
          category: 'Config',
          actor: revokedBy,
          actorRole,
          target: auth.supportUser,
          detail: `Impersonation authorization revoked for ${companyName(auth.companyId)}`,
          targetCompanyId: auth.companyId,
        })
      }
      toast.success('Authorization revoked — the next impersonation attempt will be denied')
    },
    [append, actorRole, auths]
  )

  /** RSEC-06: start "login as user"; denied unless authorized (RSEC-14). */
  const startSession = useCallback(
    (targetPersonId: string): boolean => {
      const target = personById(targetPersonId)
      if (!target) return false
      if (!target.isUser) {
        toast.error(
          `${target.name} has no system login — impersonation does not apply to non-user employees.`
        )
        return false
      }
      if (!isAuthorized(CURRENT_SUPPORT_USER, target.companyId)) {
        append({
          category: 'Impersonation',
          actor: CURRENT_SUPPORT_USER,
          actorRole,
          target: target.name,
          detail: `Impersonation DENIED — ${CURRENT_SUPPORT_USER} is not authorized for ${companyName(target.companyId)}`,
          targetCompanyId: target.companyId,
        })
        toast.error(
          `Denied — ${CURRENT_SUPPORT_USER} is not authorized to impersonate users of ${companyName(target.companyId)}`
        )
        return false
      }
      const session: ImpersonationSession = {
        id: `is-${crypto.randomUUID().slice(0, 8)}`,
        supportUser: CURRENT_SUPPORT_USER,
        targetPersonId,
        companyId: target.companyId,
        startedAt: new Date().toISOString(),
        endedAt: null,
        actions: [],
      }
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.id)
      append({
        category: 'Impersonation',
        actor: CURRENT_SUPPORT_USER,
        actorRole,
        target: target.name,
        detail: 'Impersonation session started',
        targetCompanyId: target.companyId,
      })
      notify({
        event: 'Impersonation started',
        template: 'security/impersonation-start',
        recipients: [`Company Admin of ${companyName(target.companyId)}`],
        companyId: target.companyId,
      })
      toast.success(
        `Now acting as ${target.name} — constrained to their permissions`
      )
      return true
    },
    [append, notify, actorRole, isAuthorized]
  )

  /** Every action inside the session is logged and flagged (RSEC-07). */
  const logAction = useCallback(
    (description: string) => {
      if (!activeSession) return
      const target = personById(activeSession.targetPersonId)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                actions: [
                  ...s.actions,
                  { at: new Date().toISOString(), description },
                ],
              }
            : s
        )
      )
      append({
        category: 'Impersonation',
        actor: activeSession.supportUser,
        actorRole,
        target: target?.name ?? activeSession.targetPersonId,
        detail: description,
        targetCompanyId: activeSession.companyId,
        underImpersonation: true,
      })
      toast.info(`Logged under impersonation: ${description}`)
    },
    [append, actorRole, activeSession]
  )

  /** RSEC-06: ending the session returns cleanly to the support context. */
  const endSession = useCallback(() => {
    if (!activeSession) return
    const target = personById(activeSession.targetPersonId)
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, endedAt: new Date().toISOString() }
          : s
      )
    )
    setActiveSessionId(null)
    append({
      category: 'Impersonation',
      actor: activeSession.supportUser,
      actorRole,
      target: target?.name ?? activeSession.targetPersonId,
      detail: 'Impersonation session ended — returned to own context',
      targetCompanyId: activeSession.companyId,
    })
    toast.success('Session ended — you are back in your own authenticated context')
  }, [append, actorRole, activeSession])

  return {
    auths,
    sessions,
    activeSession,
    isAuthorized,
    grantAuth,
    revokeAuth,
    startSession,
    logAction,
    endSession,
  }
}

export type ImpersonationStore = ReturnType<typeof useImpersonation>
