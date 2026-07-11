import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import {
  seedAuditEntries,
  seedSecurityEvents,
  type AuditEntry,
  type SecurityEvent,
  type SecurityEventType,
} from '../data/audit-entries'
import { getLiveAuditEntries, subscribeLiveAudit } from '../data/live-trail'

export type AuditLogStore = ReturnType<typeof useAuditLog>

/**
 * In-memory audit log store. Stands in for the platform's write-once audit
 * pipeline — entries are only ever appended (tamper-resistance), moved between
 * active and archival tiers by the retention sweep, or disposed once they
 * exceed total retention. There is no update/delete API by design.
 */
export function useAuditLog() {
  const [localEntries, setEntries] = useState<AuditEntry[]>(seedAuditEntries)
  const [securityEvents, setSecurityEvents] =
    useState<SecurityEvent[]>(seedSecurityEvents)
  // Live entries published by other modules (leave, employees, workflows…)
  // while this page was mounted or not — merged ahead of the seed data.
  const liveEntries = useSyncExternalStore(
    subscribeLiveAudit,
    getLiveAuditEntries
  )
  const entries = useMemo(
    () => [...liveEntries, ...localEntries],
    [liveEntries, localEntries]
  )

  /**
   * Demo of FR 6.29.1: a committed change generates its audit entry
   * atomically — the change is never persisted without one.
   */
  const simulateCommittedChange = useCallback(() => {
    const entry: AuditEntry = {
      id: `AE-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      entityType: 'Employee',
      recordId: 'EMP-1230',
      recordName: 'Devika Nair',
      actionType: 'update',
      changes: [
        {
          field: 'Department',
          previousValue: 'Operations',
          newValue: 'Customer Success',
        },
      ],
      actor: 'Priya Sharma (Platform Admin)',
      actorType: 'user',
      timestamp: new Date().toISOString(),
      companyId: 'CMP-NWR',
      companyName: 'Northwind Retail',
      tenant: 'Meridian Holdings',
      storageTier: 'active',
    }
    setEntries((prev) => [entry, ...prev])
    toast.success('Change committed — audit entry written in the same transaction')
  }, [])

  /**
   * Demo of FR 6.29.1: a failed / rolled-back transaction leaves no
   * misleading audit entry behind.
   */
  const simulateRolledBackChange = useCallback(() => {
    toast.info(
      'Transaction rolled back — no audit entry was written. The trail only ever reflects committed changes.'
    )
  }, [])

  /**
   * FR 6.29.5: modification attempts on the write-once log are prevented and
   * are themselves recorded as security events.
   */
  const recordSecurityEvent = useCallback(
    (type: SecurityEventType, detail: string, actor: string) => {
      const event: SecurityEvent = {
        id: `SEC-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        type,
        detail,
        actor,
        timestamp: new Date().toISOString(),
      }
      setSecurityEvents((prev) => [event, ...prev])
    },
    []
  )

  /**
   * FR 6.29.3: entries older than the active window transition to archival
   * storage (never silently deleted) using the currently effective policy.
   */
  const runArchivalSweep = useCallback(
    (activeMonths: number) => {
      const cutoff = new Date()
      cutoff.setMonth(cutoff.getMonth() - activeMonths)
      const isDue = (e: AuditEntry) =>
        e.storageTier === 'active' && new Date(e.timestamp) < cutoff
      const moved = entries.filter(isDue).length
      setEntries((prev) =>
        prev.map((e) =>
          isDue(e) ? { ...e, storageTier: 'archived' as const } : e
        )
      )
      toast.success(
        moved > 0
          ? `Archival sweep complete — ${moved} ${moved === 1 ? 'entry' : 'entries'} moved to archival storage (integrity preserved)`
          : 'Archival sweep complete — no entries past the active window'
      )
    },
    [entries]
  )

  /**
   * FR 6.29.3: archived entries older than total retention become eligible
   * for disposal.
   */
  const disposeExpired = useCallback(
    (totalYears: number) => {
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - totalYears)
      const isExpired = (e: AuditEntry) =>
        e.storageTier === 'archived' && new Date(e.timestamp) < cutoff
      const removed = entries.filter(isExpired).length
      setEntries((prev) => prev.filter((e) => !isExpired(e)))
      toast.success(
        removed > 0
          ? `${removed} ${removed === 1 ? 'entry' : 'entries'} past ${totalYears}-year total retention disposed`
          : `No archived entries older than ${totalYears} years — nothing to dispose`
      )
    },
    [entries]
  )

  return {
    entries,
    securityEvents,
    simulateCommittedChange,
    simulateRolledBackChange,
    recordSecurityEvent,
    runArchivalSweep,
    disposeExpired,
  }
}
