import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAuditEvents,
  seedNotifications,
  type AuditCategory,
  type AuditEvent,
  type SecurityNotification,
} from '../data/audit'

export interface AuditAppendInput {
  category: AuditCategory
  actor: string
  actorRole: string
  target: string
  detail: string
  sourceCompanyId?: string | null
  targetCompanyId?: string | null
  underImpersonation?: boolean
}

export interface NotifyInput {
  event: string
  template: string
  recipients: string[]
  companyId: string
}

/**
 * Immutable append-only audit store (RSEC-17) plus the security-event
 * notification feed (RSEC-22). The store exposes no update or delete —
 * `attemptTamper` demonstrates the rejection path.
 */
export function useSecurityAudit() {
  const [events, setEvents] = useState<AuditEvent[]>(seedAuditEvents)
  const [notifications, setNotifications] =
    useState<SecurityNotification[]>(seedNotifications)

  const append = useCallback((input: AuditAppendInput) => {
    const event: AuditEvent = {
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      at: new Date().toISOString(),
      category: input.category,
      actor: input.actor,
      actorRole: input.actorRole,
      target: input.target,
      detail: input.detail,
      sourceCompanyId: input.sourceCompanyId ?? null,
      targetCompanyId: input.targetCompanyId ?? null,
      underImpersonation: input.underImpersonation ?? false,
    }
    setEvents((prev) => [event, ...prev])
  }, [])

  const notify = useCallback((input: NotifyInput) => {
    const notification: SecurityNotification = {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      at: new Date().toISOString(),
      ...input,
    }
    setNotifications((prev) => [notification, ...prev])
  }, [])

  /** RSEC-17: edits and deletes are rejected — the store is append-only. */
  const attemptTamper = useCallback((event: AuditEvent) => {
    toast.error(
      `Operation rejected — audit record ${event.id} is immutable. The security audit store is append-only and tamper-evident.`
    )
  }, [])

  return { events, notifications, append, notify, attemptTamper }
}

export type SecurityAuditStore = ReturnType<typeof useSecurityAudit>
