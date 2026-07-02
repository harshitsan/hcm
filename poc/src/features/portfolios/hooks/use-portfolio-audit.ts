import { useCallback, useState } from 'react'
import {
  seedAuditEvents,
  type PortfolioAuditEvent,
  type PortfolioEventType,
} from '../data/audit'

export interface RecordEventInput {
  eventType: PortfolioEventType
  companiesAffected: string[]
  parameters: string
  status: 'success' | 'failure'
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

/**
 * In-memory portfolio audit trail (PORT-25/26). Every portfolio-level
 * operation — including failed context switches per §7.2 — is recorded with
 * actor, companies affected, parameters, timestamp and status.
 */
export function usePortfolioAudit(actor: string, actorRole: string) {
  const [entries, setEntries] = useState<PortfolioAuditEvent[]>(seedAuditEvents)

  const record = useCallback(
    (input: RecordEventInput) => {
      const entry: PortfolioAuditEvent = {
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: nowStamp(),
        actor,
        actorRole,
        ...input,
      }
      setEntries((prev) => [entry, ...prev])
    },
    [actor, actorRole]
  )

  return { entries, record }
}

export type PortfolioAuditStore = ReturnType<typeof usePortfolioAudit>
export type RecordEventFn = PortfolioAuditStore['record']
