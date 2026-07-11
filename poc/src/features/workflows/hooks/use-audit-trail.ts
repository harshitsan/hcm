import { useCallback, useSyncExternalStore } from 'react'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
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

// Module-level store so the Workflow Engine page and the approval inbox in
// Tasks & Notifications write to (and read) the same audit trail.
let auditEvents: AuditEvent[] = seedAuditEvents
const auditListeners = new Set<() => void>()

function subscribeAudit(listener: () => void) {
  auditListeners.add(listener)
  return () => {
    auditListeners.delete(listener)
  }
}

function getAuditSnapshot() {
  return auditEvents
}

/**
 * Append-only audit store (WFE-12). Every workflow hook funnels its
 * actions, approvals, escalations and routing decisions through `append`.
 */
export function useAuditTrail() {
  const events = useSyncExternalStore(subscribeAudit, getAuditSnapshot)

  const append: AppendAudit = useCallback((input) => {
    const event: AuditEvent = {
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: nowStamp(),
      ...input,
    }
    auditEvents = [event, ...auditEvents]
    auditListeners.forEach((l) => l())
    // Mirror into the central platform trail so workflow actions show up on
    // /audit-logs immediately (worklist #26).
    publishAuditEvent({
      module: 'Workflow Engine',
      action: input.summary,
      actor: input.actor,
      actorRole: input.actorRole,
      recordId: input.refId,
      recordName: input.summary,
      changes: [
        { field: input.category, previousValue: null, newValue: input.detail },
      ],
    })
  }, [])

  return { events, append }
}

export type AuditTrailStore = ReturnType<typeof useAuditTrail>
