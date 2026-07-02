import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedDsrRequests,
  seedLifecycleRecords,
  seedRetentionRules,
  type DsrRequest,
  type DsrStatus,
  type DsrType,
  type LifecycleRecord,
} from '../data/governance'

/**
 * In-memory data governance store (SYS-26, 37, 69, 70, 71). Retention rules,
 * the terminated-record lifecycle with legal holds and monthly purge, and
 * data-subject-rights requests.
 */
export function useGovernance() {
  const [lifecycleRecords, setLifecycleRecords] = useState<LifecycleRecord[]>(
    seedLifecycleRecords
  )
  const [dsrRequests, setDsrRequests] = useState<DsrRequest[]>(seedDsrRequests)
  const retentionRules = seedRetentionRules

  const toggleLegalHold = useCallback((id: string) => {
    setLifecycleRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        toast.success(
          r.legalHold
            ? 'Legal hold released — purge schedule resumes'
            : 'Legal hold applied — purge suspended for this record'
        )
        return { ...r, legalHold: !r.legalHold }
      })
    )
  }, [])

  /** Automated monthly purge; legal-hold records are skipped (SYS-70). */
  const runMonthlyPurge = useCallback(() => {
    let advanced = 0
    let held = 0
    setLifecycleRecords((prev) =>
      prev.map((r) => {
        if (r.stage === 'purged') return r
        if (r.legalHold) {
          held += 1
          return r
        }
        advanced += 1
        const next =
          r.stage === 'account disabled'
            ? 'active (exit processing)'
            : r.stage === 'active (exit processing)'
              ? 'anonymized'
              : 'purged'
        return { ...r, stage: next }
      })
    )
    toast.success(
      `Monthly purge complete — ${advanced} record(s) advanced, ${held} suspended by legal hold`
    )
  }, [])

  /** Self-service DSR submission with identity verification (SYS-37, 71). */
  const submitDsr = useCallback(
    (requester: string, type: DsrType, detail: string, sensitive: boolean) => {
      const now = new Date()
      const due = new Date(now)
      due.setDate(due.getDate() + 30)
      setDsrRequests((prev) => [
        {
          id: `dsr-${crypto.randomUUID().slice(0, 8)}`,
          requester,
          type,
          detail,
          sensitive,
          submittedAt: now.toISOString().slice(0, 10),
          slaDue: due.toISOString().slice(0, 10),
          status: 'received',
        },
        ...prev,
      ])
      toast.success(
        type === 'Rectification' && !sensitive
          ? 'Non-sensitive change applied immediately via self-service'
          : type === 'Rectification'
            ? 'Sensitive-field change routed to the approval workflow'
            : `${type} request submitted — identity verification pending, 30-day SLA tracked`
      )
    },
    []
  )

  const advanceDsr = useCallback((id: string) => {
    const order: DsrStatus[] = [
      'received',
      'identity verified',
      'in progress',
      'completed',
    ]
    setDsrRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id || r.status === 'statutory exception') return r
        const idx = order.indexOf(r.status)
        const next = order[Math.min(idx + 1, order.length - 1)]
        if (next !== r.status) toast.success(`Request ${r.id} → ${next}`)
        return { ...r, status: next }
      })
    )
  }, [])

  const exportDsrData = useCallback((request: DsrRequest) => {
    toast.success(
      `Machine-readable export generated for ${request.requester} — delivered within the 30-day SLA`
    )
  }, [])

  return {
    retentionRules,
    lifecycleRecords,
    dsrRequests,
    toggleLegalHold,
    runMonthlyPurge,
    submitDsr,
    advanceDsr,
    exportDsrData,
  }
}

export type GovernanceStore = ReturnType<typeof useGovernance>
