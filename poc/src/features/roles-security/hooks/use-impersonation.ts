import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { Role } from '@/context/role-context'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  CURRENT_SUPPORT_USER,
  authEffectiveStatus,
  expiryFromDuration,
  seedImpersonationAuths,
  seedImpersonationRequests,
  seedImpersonationSessions,
  type ImpersonationAuth,
  type ImpersonationDuration,
  type ImpersonationRequest,
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
 * Impersonation store (RSEC-06, RSEC-07, RSEC-14): support users request
 * authorization for a company; the Company Admin approves (creating a
 * time-boxed authorization) or denies with a reason. Only support users with
 * an unexpired authorization can start a "login as user" session; sessions
 * are strictly view-only, and the start, every viewed screen and the end are
 * written to the append-only audit store and the central audit trail
 * (RSEC-22).
 */
export function useImpersonation({
  append,
  notify,
  actorRole,
}: UseImpersonationOptions) {
  const [auths, setAuths] = useState<ImpersonationAuth[]>(
    seedImpersonationAuths
  )
  const [requests, setRequests] = useState<ImpersonationRequest[]>(
    seedImpersonationRequests
  )
  const [sessions, setSessions] = useState<ImpersonationSession[]>(
    seedImpersonationSessions
  )
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const activeSession =
    sessions.find((s) => s.id === activeSessionId && s.endedAt === null) ??
    null

  /** Expiry is applied at read time — expired grants cannot start sessions. */
  const isAuthorized = useCallback(
    (supportUser: SupportUser, companyId: string): boolean => {
      const now = new Date().toISOString()
      return auths.some(
        (a) =>
          a.supportUser === supportUser &&
          a.companyId === companyId &&
          authEffectiveStatus(a, now) === 'Active'
      )
    },
    [auths]
  )

  /** A support user asks the Company Admin for impersonation authority. */
  const submitRequest = useCallback(
    (
      supportUser: SupportUser,
      companyId: string,
      reason: string,
      duration: ImpersonationDuration
    ) => {
      const request: ImpersonationRequest = {
        id: `ir-${crypto.randomUUID().slice(0, 8)}`,
        supportUser,
        companyId,
        reason,
        requestedOn: new Date().toISOString().slice(0, 10),
        duration,
        status: 'Pending',
      }
      setRequests((prev) => [request, ...prev])
      append({
        category: 'Impersonation',
        actor: supportUser,
        actorRole,
        target: companyName(companyId),
        detail: `Impersonation authorization requested for ${duration} — ${reason}`,
        targetCompanyId: companyId,
      })
      notify({
        event: 'Impersonation authorization requested',
        template: 'security/impersonation-request',
        recipients: [`Company Admin of ${companyName(companyId)}`],
        companyId,
      })
      toast.success(
        `Request sent to the Company Admin of ${companyName(companyId)} — you will be able to sign in as their users once it is approved`
      )
    },
    [append, notify, actorRole]
  )

  /** Company Admin approves — creates a time-boxed authorization (RSEC-14). */
  const approveRequest = useCallback(
    (id: string, decidedBy: string) => {
      const request = requests.find((r) => r.id === id)
      if (!request || request.status !== 'Pending') return
      const decidedOn = new Date().toISOString().slice(0, 10)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'Approved', decidedBy, decidedOn } : r
        )
      )
      const auth: ImpersonationAuth = {
        id: `ia-${crypto.randomUUID().slice(0, 8)}`,
        supportUser: request.supportUser,
        companyId: request.companyId,
        grantedBy: decidedBy,
        grantedOn: decidedOn,
        expiresOn: expiryFromDuration(request.duration),
        status: 'Active',
      }
      setAuths((prev) => [
        auth,
        ...prev.filter(
          (a) =>
            !(
              a.supportUser === request.supportUser &&
              a.companyId === request.companyId
            )
        ),
      ])
      append({
        category: 'Impersonation',
        actor: decidedBy,
        actorRole,
        target: request.supportUser,
        detail: `Impersonation request approved for ${companyName(request.companyId)} — access expires after ${request.duration}`,
        targetCompanyId: request.companyId,
      })
      publishAuditEvent({
        module: 'Roles & Security',
        action: 'Impersonation authorization approved',
        actor: decidedBy,
        actorRole,
        entityType: 'Company',
        actionType: 'status-change',
        recordId: request.id,
        recordName: `${request.supportUser} → ${companyName(request.companyId)}`,
        changes: [
          {
            field: 'Authorization',
            previousValue: 'Pending',
            newValue: `Approved for ${request.duration}`,
          },
        ],
      })
      toast.success(
        `${request.supportUser} may now sign in as users of ${companyName(request.companyId)} for ${request.duration}`
      )
    },
    [append, actorRole, requests]
  )

  /** Company Admin denies — a reason is always recorded. */
  const denyRequest = useCallback(
    (id: string, denialReason: string, decidedBy: string) => {
      const request = requests.find((r) => r.id === id)
      if (!request || request.status !== 'Pending') return
      const decidedOn = new Date().toISOString().slice(0, 10)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'Denied', decidedBy, decidedOn, denialReason }
            : r
        )
      )
      append({
        category: 'Impersonation',
        actor: decidedBy,
        actorRole,
        target: request.supportUser,
        detail: `Impersonation request denied for ${companyName(request.companyId)} — ${denialReason}`,
        targetCompanyId: request.companyId,
      })
      publishAuditEvent({
        module: 'Roles & Security',
        action: 'Impersonation authorization denied',
        actor: decidedBy,
        actorRole,
        entityType: 'Company',
        actionType: 'status-change',
        recordId: request.id,
        recordName: `${request.supportUser} → ${companyName(request.companyId)}`,
        changes: [
          {
            field: 'Authorization',
            previousValue: 'Pending',
            newValue: `Denied — ${denialReason}`,
          },
        ],
      })
      toast.success(
        `Request denied — ${request.supportUser} cannot sign in as users of ${companyName(request.companyId)}`
      )
    },
    [append, actorRole, requests]
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
          // Direct grants are time-boxed too — one week by default.
          expiresOn: expiryFromDuration('7 days'),
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
        detail: `Impersonation authorization granted for ${companyName(companyId)} (valid 7 days)`,
        targetCompanyId: companyId,
      })
      publishAuditEvent({
        module: 'Roles & Security',
        action: 'Impersonation authorization granted',
        actor: grantedBy,
        actorRole,
        entityType: 'Company',
        actionType: 'create',
        recordName: `${supportUser} → ${companyName(companyId)}`,
      })
      toast.success(
        `${supportUser} may now sign in as users of ${companyName(companyId)} for 7 days`
      )
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
        publishAuditEvent({
          module: 'Roles & Security',
          action: 'Impersonation authorization revoked',
          actor: revokedBy,
          actorRole,
          entityType: 'Company',
          actionType: 'status-change',
          recordName: `${auth.supportUser} → ${companyName(auth.companyId)}`,
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
          detail: `Impersonation DENIED — ${CURRENT_SUPPORT_USER} has no active (unexpired) authorization for ${companyName(target.companyId)}`,
          targetCompanyId: target.companyId,
        })
        toast.error(
          `Denied — ${CURRENT_SUPPORT_USER} has no active authorization to sign in as users of ${companyName(target.companyId)}. Authorizations expire automatically.`
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
        detail: 'Impersonation session started (view-only)',
        targetCompanyId: target.companyId,
      })
      publishAuditEvent({
        module: 'Roles & Security',
        action: '[Impersonation] Session started (view-only)',
        actor: CURRENT_SUPPORT_USER,
        actorRole,
        entityType: 'Employee',
        actionType: 'create',
        recordName: target.name,
      })
      notify({
        event: 'Impersonation started',
        template: 'security/impersonation-start',
        recipients: [`Company Admin of ${companyName(target.companyId)}`],
        companyId: target.companyId,
      })
      toast.success(
        `Now viewing as ${target.name} — the session is view-only and every screen you open is logged`
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
      publishAuditEvent({
        module: 'Roles & Security',
        action: `[Impersonation] ${description}`,
        actor: activeSession.supportUser,
        actorRole,
        entityType: 'Employee',
        recordName: target?.name ?? activeSession.targetPersonId,
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
    publishAuditEvent({
      module: 'Roles & Security',
      action: '[Impersonation] Session ended',
      actor: activeSession.supportUser,
      actorRole,
      entityType: 'Employee',
      actionType: 'status-change',
      recordName: target?.name ?? activeSession.targetPersonId,
    })
    toast.success('Session ended — you are back in your own authenticated context')
  }, [append, actorRole, activeSession])

  return {
    auths,
    requests,
    sessions,
    activeSession,
    isAuthorized,
    submitRequest,
    approveRequest,
    denyRequest,
    grantAuth,
    revokeAuth,
    startSession,
    logAction,
    endSession,
  }
}

export type ImpersonationStore = ReturnType<typeof useImpersonation>
