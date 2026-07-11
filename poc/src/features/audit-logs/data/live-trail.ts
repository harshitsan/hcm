/**
 * Central live audit trail (worklist #26) — module-level bus that live
 * module mutations publish into so demo actions appear immediately in
 * /audit-logs alongside the seed data.
 *
 * Donor modules (leave, employees, workflows…) call `publishAuditEvent` from
 * their append stores; /audit-logs merges `getLiveAuditEntries()` ahead of
 * the seeds and re-renders via `subscribeLiveAudit`.
 */
import type {
  AuditActionType,
  AuditEntityType,
  AuditEntry,
  AuditFieldChange,
} from './audit-entries'

export interface PublishAuditInput {
  /** Source module, shown as part of the record name, e.g. 'Leave Management'. */
  module: string
  /** What happened, e.g. 'Leave request approved'. */
  action: string
  actor: string
  actorRole?: string
  entityType?: AuditEntityType
  actionType?: AuditActionType
  recordId?: string
  recordName?: string
  changes?: AuditFieldChange[]
}

let liveEntries: AuditEntry[] = []
const listeners = new Set<() => void>()

export function getLiveAuditEntries(): AuditEntry[] {
  return liveEntries
}

export function subscribeLiveAudit(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function publishAuditEvent(input: PublishAuditInput) {
  const entry: AuditEntry = {
    id: `AE-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    entityType: input.entityType ?? 'Employee',
    recordId: input.recordId ?? '—',
    recordName: input.recordName ?? `${input.module} — ${input.action}`,
    actionType: input.actionType ?? 'update',
    changes: input.changes ?? [
      { field: input.action, previousValue: null, newValue: 'Recorded' },
    ],
    actor: input.actorRole ? `${input.actor} (${input.actorRole})` : input.actor,
    actorType: 'user',
    timestamp: new Date().toISOString(),
    // Live demo entries land in the same tenant scope as the seed data so
    // every admin role that can open /audit-logs sees them.
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  }
  liveEntries = [entry, ...liveEntries]
  listeners.forEach((l) => l())
}
