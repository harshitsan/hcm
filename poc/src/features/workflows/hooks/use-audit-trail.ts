import { useCallback, useState } from 'react'
import {
  seedAuditEvents,
  type AuditCategory,
  type AuditEvent,
} from '../data/audit'

export interface AppendAuditInput {
  actor: string
  actorRole: string
  company: string
  category: AuditCategory
  summary: string
  detail: string
  refId: string
}

export type AppendAudit = (input: AppendAuditInput) => void

function nowStamp() {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`
}

/**
 * Append-only audit store (WFE-12). Every workflow hook funnels its
 * actions, approvals, escalations and routing decisions through `append`.
 */
export function useAuditTrail() {
  const [events, setEvents] = useState<AuditEvent[]>(seedAuditEvents)

  const append: AppendAudit = useCallback((input) => {
    const event: AuditEvent = {
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: nowStamp(),
      ...input,
    }
    setEvents((prev) => [event, ...prev])
  }, [])

  return { events, append }
}

export type AuditTrailStore = ReturnType<typeof useAuditTrail>
