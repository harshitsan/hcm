import { useCallback, useState } from 'react'
import {
  seedAuditEvents,
  type AuditOutcome,
  type AuthAuditEvent,
  type AuthEventType,
} from '../data/auth-audit'
import { type AuthMethod } from '../data/auth-users'

export interface AuditEventDraft {
  actor: string
  eventType: AuthEventType
  method?: AuthMethod | null
  companyId?: string | null
  outcome: AuditOutcome
  detail: string
}

/**
 * In-memory authentication audit log (FR 6.1.6). Append-only: the review UI
 * never mutates or removes entries (AUTH-15) — other hooks call `logEvent`.
 */
export function useAuthAudit() {
  const [events, setEvents] = useState<AuthAuditEvent[]>(seedAuditEvents)

  const logEvent = useCallback((draft: AuditEventDraft) => {
    const event: AuthAuditEvent = {
      id: `evt-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      actor: draft.actor,
      eventType: draft.eventType,
      method: draft.method ?? null,
      companyId: draft.companyId ?? null,
      outcome: draft.outcome,
      detail: draft.detail,
    }
    setEvents((prev) => [event, ...prev])
    return event
  }, [])

  return { events, logEvent }
}

export type AuthAuditStore = ReturnType<typeof useAuthAudit>
