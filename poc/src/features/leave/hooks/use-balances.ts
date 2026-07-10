import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  dateOfJoinFor,
  remaining,
  seedAdjustments,
  seedBalances,
  seedCompOffCredits,
  type Adjustment,
  type CompOffCredit,
  type LeaveBalance,
} from '../data/balances'
import { employeeById, shortId, todayISO } from '../data/shared'

/**
 * Input for creating an adjustment. The enriched Adjust-Time-Off fields are
 * optional and defaulted; `autoApprove` (bulk approver checkbox) approves the
 * record immediately with `approvedBy` as the acting approver.
 */
export type AdjustmentInput = Omit<
  Adjustment,
  | 'id'
  | 'status'
  | 'requestedBy'
  | 'dateOfJoin'
  | 'sendMailToEmployee'
  | 'addedThisYear'
  | 'totalForYear'
  | 'documents'
  | 'comments'
  | 'approvedBy'
> &
  Partial<
    Pick<
      Adjustment,
      | 'dateOfJoin'
      | 'sendMailToEmployee'
      | 'addedThisYear'
      | 'totalForYear'
      | 'documents'
      | 'comments'
    >
  > & {
    autoApprove?: boolean
    approvedBy?: string
  }

interface Deps {
  append: (input: {
    actor: string
    actorRole: string
    action: string
    target: string
    before: string
    after: string
    reason: string
  }) => void
  notify: (event: string, recipients: string, message: string) => void
  actor: string
  actorRole: string
}

/**
 * Balances, comp-off credits and adjustment store (LVE-07, LVE-14, LVE-16,
 * LVE-26, LVE-34, LVE-43). Every override goes through the mandatory-reason
 * audit path.
 */
export function useBalances({ append, notify, actor, actorRole }: Deps) {
  const [balances, setBalances] = useState<LeaveBalance[]>(seedBalances)
  const [compOffCredits, setCompOffCredits] =
    useState<CompOffCredit[]>(seedCompOffCredits)
  const [adjustments, setAdjustments] = useState<Adjustment[]>(seedAdjustments)

  const balanceFor = useCallback(
    (employeeId: string, typeId: string) =>
      balances.find((b) => b.employeeId === employeeId && b.typeId === typeId),
    [balances]
  )

  /** Additive patch applied to one employee/type balance row. */
  const applyDelta = useCallback(
    (employeeId: string, typeId: string, patch: Partial<LeaveBalance>) => {
      setBalances((prev) => {
        const exists = prev.some(
          (b) => b.employeeId === employeeId && b.typeId === typeId
        )
        const base: LeaveBalance = {
          employeeId,
          typeId,
          credited: 0,
          taken: 0,
          tentative: 0,
          scheduled: 0,
          pendingApproval: 0,
          lopPending: 0,
          lopApproved: 0,
          cancelled: 0,
        }
        const rows = exists ? prev : [...prev, base]
        return rows.map((b) => {
          if (b.employeeId !== employeeId || b.typeId !== typeId) return b
          const next = { ...b }
          for (const [key, delta] of Object.entries(patch)) {
            const k = key as keyof Omit<LeaveBalance, 'employeeId' | 'typeId'>
            next[k] = Math.max(0, b[k] + Number(delta ?? 0))
          }
          return next
        })
      })
    },
    []
  )

  /** LVE-07/08: override any balance with a mandatory reason + audit entry. */
  const overrideBalance = useCallback(
    (employeeId: string, typeId: string, newCredited: number, reason: string) => {
      const before = balanceFor(employeeId, typeId)
      const emp = employeeById(employeeId)
      setBalances((prev) =>
        prev.map((b) =>
          b.employeeId === employeeId && b.typeId === typeId
            ? { ...b, credited: newCredited }
            : b
        )
      )
      append({
        actor,
        actorRole,
        action: 'Balance override',
        target: `${emp?.name ?? employeeId} · ${typeId}`,
        before: `Credited: ${before?.credited ?? 0}`,
        after: `Credited: ${newCredited}`,
        reason,
      })
      notify(
        'Adjusted',
        `${emp?.name ?? 'Employee'} (applicant)`,
        `Balance override applied by ${actor}. Reason: ${reason}`
      )
      toast.success('Override applied — audit trail entry created')
    },
    [actor, actorRole, append, balanceFor, notify]
  )

  /** LVE-26: accrual engine run — credits monthly accrual on paid balances. */
  const runAccrual = useCallback(() => {
    setBalances((prev) =>
      prev.map((b) =>
        b.typeId === 'lt-privileged' ? { ...b, credited: b.credited + 1.5 } : b
      )
    )
    // Lapse expired comp-off credits per policy.
    const today = todayISO()
    setCompOffCredits((prev) =>
      prev.map((c) =>
        c.status === 'available' && c.expiresOn < today
          ? { ...c, status: 'lapsed' }
          : c
      )
    )
    append({
      actor: 'Accrual Engine',
      actorRole: 'Platform Admin',
      action: 'Scheduled accrual run',
      target: 'All active balances',
      before: 'Pre-run balances',
      after: '+1.5 Privileged/Annual days per employee; expired comp-off lapsed',
      reason: 'Monthly accrual schedule (policy-configured).',
    })
    toast.success('Accrual engine run complete — balances updated, expired comp-off lapsed')
  }, [append])

  /** LVE-16: create a comp-off credit for eligible extra work. */
  const earnCompOff = useCallback(
    (employeeId: string, source: string) => {
      const emp = employeeById(employeeId)
      const earnedOn = todayISO()
      const expires = new Date()
      expires.setDate(expires.getDate() + 90)
      setCompOffCredits((prev) => [
        {
          id: shortId('co'),
          employeeId,
          employeeName: emp?.name ?? employeeId,
          source,
          earnedOn,
          expiresOn: expires.toISOString().slice(0, 10),
          status: 'available',
        },
        ...prev,
      ])
      applyDelta(employeeId, 'lt-compoff', { credited: 1 })
      notify(
        'Adjusted',
        `${emp?.name ?? 'Employee'} (applicant)`,
        `Comp-off credit created for: ${source}. Expires in 90 days per policy.`
      )
      toast.success('Comp-off credit created (expires in 90 days)')
    },
    [applyDelta, notify]
  )

  /**
   * Builds a full Adjustment from a partial input, defaulting the Adjust
   * Time Off 13-pointer fields (DOJ, added-in-year, totals, docs, comments).
   */
  const buildAdjustment = useCallback(
    (input: AdjustmentInput): Adjustment => {
      const addedThisYear =
        input.addedThisYear ??
        balanceFor(input.employeeId, input.typeId)?.credited ??
        0
      const autoApprove = input.autoApprove ?? false
      const { autoApprove: _auto, ...record } = input
      void _auto
      return {
        ...record,
        id: shortId('adj'),
        status: autoApprove ? 'approved' : 'pending',
        requestedBy: actor,
        dateOfJoin: input.dateOfJoin ?? dateOfJoinFor(input.employeeId),
        sendMailToEmployee: input.sendMailToEmployee ?? false,
        addedThisYear,
        totalForYear: input.totalForYear ?? addedThisYear + input.delta,
        documents: input.documents ?? [],
        comments: input.comments ?? '',
        approvedBy: autoApprove ? (input.approvedBy ?? actor) : null,
      }
    },
    [actor, balanceFor]
  )

  /** Applies an approved adjustment's credit + audit/notify side effects. */
  const applyApprovedAdjustment = useCallback(
    (adj: Adjustment) => {
      applyDelta(adj.employeeId, adj.typeId, { credited: adj.delta })
      append({
        actor: adj.approvedBy ?? actor,
        actorRole,
        action: 'Adjustment approved',
        target: `${adj.employeeName} · ${adj.typeName}`,
        before: `Balance ${adj.currentBalance}`,
        after: `Balance ${adj.currentBalance + adj.delta}`,
        reason: adj.comments
          ? `${adj.reason} — Comments: ${adj.comments}`
          : adj.reason,
      })
      notify(
        'Adjusted',
        `${adj.employeeName} (applicant)`,
        `Adjustment approved: ${adj.delta > 0 ? '+' : ''}${adj.delta} ${adj.typeName}.${adj.comments ? ` Comments: ${adj.comments}` : ''}`
      )
      if (adj.sendMailToEmployee) {
        notify(
          'Adjusted',
          `${adj.employeeName} (employee mail)`,
          `Mail sent to ${adj.employeeName}: your ${adj.typeName} balance was adjusted by ${adj.delta > 0 ? '+' : ''}${adj.delta} (approved by ${adj.approvedBy ?? actor}).`
        )
      }
    },
    [actor, actorRole, append, applyDelta, notify]
  )

  /** LVE-43: raise a balance adjustment routed to the adjustment approver. */
  const requestAdjustment = useCallback(
    (input: AdjustmentInput) => {
      const adj = buildAdjustment(input)
      setAdjustments((prev) => [adj, ...prev])
      if (adj.status === 'approved') {
        applyApprovedAdjustment(adj)
        toast.success('Adjustment created and auto-approved — balance updated')
        return
      }
      notify(
        'Submitted',
        'Adjustment approver (per location mapping)',
        `Time-off adjustment raised for ${input.employeeName}: ${input.delta > 0 ? '+' : ''}${input.delta} ${input.typeName}.`
      )
      toast.success('Adjustment created — routed to the adjustment approver')
    },
    [applyApprovedAdjustment, buildAdjustment, notify]
  )

  /**
   * Bulk Pending Time Off Adjustments: stage many adjustments at once.
   * Items flagged `autoApprove` are approved immediately (credit applied,
   * approver taken from the input); the rest await the adjustment approver.
   * One toast for the whole batch.
   */
  const requestAdjustments = useCallback(
    (inputs: AdjustmentInput[]) => {
      if (inputs.length === 0) return
      const built = inputs.map(buildAdjustment)
      setAdjustments((prev) => [...built, ...prev])
      const autoApproved = built.filter((a) => a.status === 'approved')
      for (const adj of autoApproved) applyApprovedAdjustment(adj)
      const pending = built.length - autoApproved.length
      if (pending > 0) {
        notify(
          'Submitted',
          'Adjustment approver (per location mapping)',
          `Bulk time-off adjustment: ${pending} record(s) pending approval per configuration.`
        )
      }
      toast.success(`${built.length} adjustments submitted`)
    },
    [applyApprovedAdjustment, buildAdjustment, notify]
  )

  /**
   * Approver decision. Per the Approve Adjusted Time Off flow the approver
   * may alter the number of time offs before approving (`newDelta`).
   */
  const decideAdjustment = useCallback(
    (id: string, approve: boolean, newDelta?: number) => {
      const found = adjustments.find((a) => a.id === id)
      if (!found || found.status !== 'pending') return
      const delta =
        approve && newDelta !== undefined && !Number.isNaN(newDelta)
          ? newDelta
          : found.delta
      const adj: Adjustment = {
        ...found,
        delta,
        totalForYear: found.addedThisYear + delta,
        status: approve ? 'approved' : 'rejected',
        approvedBy: approve ? actor : null,
      }
      setAdjustments((prev) => prev.map((a) => (a.id === id ? adj : a)))
      if (approve) {
        applyApprovedAdjustment(adj)
        toast.success(
          delta !== found.delta
            ? `Adjustment approved with altered time offs (${delta > 0 ? '+' : ''}${delta}) — balance updated`
            : 'Adjustment approved — balance updated'
        )
        return
      }
      append({
        actor,
        actorRole,
        action: 'Adjustment rejected',
        target: `${adj.employeeName} · ${adj.typeName}`,
        before: `Balance ${adj.currentBalance}`,
        after: `Balance unchanged (${adj.currentBalance})`,
        reason: adj.comments
          ? `${adj.reason} — Comments: ${adj.comments}`
          : adj.reason,
      })
      notify(
        'Adjusted',
        `${adj.employeeName} (applicant)`,
        `Adjustment rejected: ${adj.delta > 0 ? '+' : ''}${adj.delta} ${adj.typeName}.`
      )
      toast.success('Adjustment rejected')
    },
    [actor, actorRole, adjustments, append, applyApprovedAdjustment, notify]
  )

  return {
    balances,
    compOffCredits,
    adjustments,
    balanceFor,
    remainingFor: (employeeId: string, typeId: string) => {
      const b = balanceFor(employeeId, typeId)
      return b ? remaining(b) : 0
    },
    applyDelta,
    overrideBalance,
    runAccrual,
    earnCompOff,
    requestAdjustment,
    requestAdjustments,
    decideAdjustment,
  }
}

export type BalancesStore = ReturnType<typeof useBalances>
