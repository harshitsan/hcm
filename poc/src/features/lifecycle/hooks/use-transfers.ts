import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  GROUP_STEP,
  TRANSFER_CHAIN,
  seedAssignments,
  seedTransfers,
  type AssignmentRecord,
  type TransferRequest,
  type TransferType,
} from '../data/transfers'
import { makeSteps, pendingStep, shortId, todayISO } from '../data/shared'
import { type LogInput } from './use-lifecycle-log'

export interface TransferDraft {
  employeeName: string
  employeeCode: string
  type: TransferType
  fromDepartment: string
  toDepartment: string
  fromLocation: string
  toLocation: string
  fromCompany: string
  toCompany: string
  effectiveDate: string
  reason: string
}

interface Deps {
  log: (input: Omit<LogInput, 'actor' | 'actorRole'>) => void
}

/** Rules-engine style impact assessment: deterministic for the same input. */
function assessImpact(draft: TransferDraft): TransferRequest['impact'] {
  const impact: TransferRequest['impact'] = {
    assets: [],
    leaveAdjustments: [],
    policyDiffs: [],
  }
  if (draft.type !== 'Inter-Department') {
    impact.assets.push(`Access card reissue at ${draft.toLocation} campus`)
  }
  if (draft.fromDepartment !== draft.toDepartment) {
    impact.assets.push(
      `Laptop re-tagged to ${draft.toDepartment} cost centre`
    )
  }
  if (draft.type === 'Inter-Company') {
    impact.assets.push('Laptop returned to origin pool; destination issues new device')
    impact.leaveAdjustments.push(
      {
        leaveType: 'Earned Leave',
        before: 14,
        after: 10,
        note: 'Destination plan caps carry-over — 4 days encashed on transfer',
      },
      {
        leaveType: 'Sick Leave',
        before: 8,
        after: 5,
        note: 'Destination cap is 5 days',
      }
    )
    impact.policyDiffs.push(
      'Destination company uses PTO accrual instead of annual grant',
      `${draft.toCompany} holiday calendar applies from the effective date`
    )
  } else if (draft.type === 'Inter-Location') {
    impact.leaveAdjustments.push({
      leaveType: 'Casual Leave',
      before: 6,
      after: 6,
      note: 'No policy change at destination',
    })
    impact.policyDiffs.push(
      `${draft.toLocation} site working-day calendar applies from the effective date`
    )
  }
  return impact
}

/** Transfers store + effective-dated bitemporal assignment history. */
export function useTransfers({ log }: Deps) {
  const [transfers, setTransfers] = useState<TransferRequest[]>(seedTransfers)
  const [assignments, setAssignments] =
    useState<AssignmentRecord[]>(seedAssignments)

  const patch = useCallback(
    (id: string, fn: (t: TransferRequest) => TransferRequest) => {
      setTransfers((prev) => prev.map((t) => (t.id === id ? fn(t) : t)))
    },
    []
  )

  const addTransfer = useCallback(
    (draft: TransferDraft) => {
      const steps =
        draft.type === 'Inter-Company'
          ? makeSteps([...TRANSFER_CHAIN, GROUP_STEP])
          : makeSteps(TRANSFER_CHAIN)
      const transfer: TransferRequest = {
        ...draft,
        id: shortId('trf'),
        status: 'pending-approval',
        approvals: steps,
        impact: assessImpact(draft),
        submittedOn: todayISO(),
        balancesReconciled: false,
      }
      setTransfers((prev) => [transfer, ...prev])
      log({
        company: draft.fromCompany,
        module: 'Transfer',
        action: `${draft.type} transfer submitted`,
        target: `${transfer.id} · ${draft.employeeName}`,
        outcome:
          draft.type === 'Inter-Company'
            ? 'Routed with additional group-level approval step'
            : 'Routed through the configured approval workflow',
        onBehalfOf: null,
      })
      toast.success(
        'Transfer submitted — current assignment stays unchanged until approved & effective'
      )
    },
    [log]
  )

  const approveStep = useCallback(
    (t: TransferRequest) => {
      const step = pendingStep(t.approvals)
      if (!step) return
      const approvals = t.approvals.map((s) =>
        s === step ? { ...s, status: 'approved' as const, actedOn: todayISO() } : s
      )
      const done = approvals.every((s) => s.status === 'approved')
      patch(t.id, (prev) => ({
        ...prev,
        approvals,
        status: done ? 'scheduled' : prev.status,
      }))
      log({
        company: t.fromCompany,
        module: 'Transfer',
        action: `Approval granted (${step.role})`,
        target: `${t.id} · ${t.employeeName}`,
        outcome: done
          ? `Fully approved — scheduled for ${t.effectiveDate}`
          : 'Awaiting next approver',
        onBehalfOf: null,
      })
      toast.success(
        done
          ? `Transfer approved — takes effect on ${t.effectiveDate}`
          : `${step.role} approved`
      )
    },
    [log, patch]
  )

  const rejectStep = useCallback(
    (t: TransferRequest, note: string) => {
      const step = pendingStep(t.approvals)
      if (!step) return
      patch(t.id, (prev) => ({
        ...prev,
        status: 'rejected',
        approvals: prev.approvals.map((s) =>
          s === step
            ? { ...s, status: 'rejected' as const, actedOn: todayISO(), note }
            : s
        ),
      }))
      log({
        company: t.fromCompany,
        module: 'Transfer',
        action: `Approval rejected (${step.role})`,
        target: `${t.id} · ${t.employeeName}`,
        outcome: 'Transfer not applied — assignment unchanged',
        onBehalfOf: null,
      })
      toast.info('Transfer rejected — the employee keeps the current assignment')
    },
    [log, patch]
  )

  const processEffective = useCallback(
    (t: TransferRequest) => {
      if (t.status !== 'scheduled') return
      if (t.effectiveDate > todayISO()) {
        toast.error(
          `Effective date ${t.effectiveDate} not reached — assignment stays unchanged until then`
        )
        return
      }
      patch(t.id, (prev) => ({
        ...prev,
        status: 'effective',
        balancesReconciled: true,
      }))
      // Bitemporal write: close the prior record, append the new assignment.
      const now = new Date().toISOString()
      setAssignments((prev) => {
        const closed = prev.map((a) =>
          a.employeeName === t.employeeName && a.validTo === null
            ? { ...a, validTo: t.effectiveDate }
            : a
        )
        const record: AssignmentRecord = {
          id: shortId('asg'),
          employeeName: t.employeeName,
          department: t.toDepartment,
          location: t.toLocation,
          company: t.toCompany,
          validFrom: t.effectiveDate,
          validTo: null,
          recordedAt: now,
          kind: 'transfer',
        }
        return [...closed, record]
      })
      log({
        company: t.toCompany,
        module: 'Transfer',
        action: 'Transfer effective — assignment rewritten',
        target: `${t.id} · ${t.employeeName}`,
        outcome:
          'New effective-dated assignment appended; prior record retained. Balance engine reconciled leave per destination policy.',
        onBehalfOf: null,
      })
      toast.success(
        'Transfer processed — new assignment active, leave balances reconciled'
      )
    },
    [log, patch]
  )

  const recordCorrection = useCallback(
    (employeeName: string, department: string, location: string, company: string) => {
      const now = new Date().toISOString()
      setAssignments((prev) => [
        ...prev,
        {
          id: shortId('asg'),
          employeeName,
          department,
          location,
          company,
          validFrom: todayISO(),
          validTo: null,
          recordedAt: now,
          kind: 'correction',
        },
      ])
      log({
        company,
        module: 'Transfer',
        action: 'Assignment correction recorded',
        target: employeeName,
        outcome: 'Correction written as a new version — no destructive update',
        onBehalfOf: null,
      })
      toast.success('Correction recorded as a new assignment version')
    },
    [log]
  )

  return {
    transfers,
    assignments,
    addTransfer,
    approveStep,
    rejectStep,
    processEffective,
    recordCorrection,
  }
}

export type TransfersStore = ReturnType<typeof useTransfers>
