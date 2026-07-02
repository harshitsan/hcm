import { useState } from 'react'
import { toast } from 'sonner'
import {
  pendingStep,
  seedRequests,
  type ApprovalStep,
  type LeaveRequest,
} from '../data/requests'
import { type LeaveType } from '../data/leave-types'
import {
  type ApproverMapping,
  type Delegation,
  type EmployeeClassRule,
} from '../data/config'
import { employeeById, rangesOverlap, shortId, todayISO } from '../data/shared'
import { type BalancesStore } from './use-balances'

export interface RequestDraft {
  employeeId: string
  typeId: string
  from: string
  to: string
  fromTime: string | null
  toTime: string | null
  amount: number
  lopAmount: number
  reason: string
  tentative: boolean
  tentativeReason: string | null
  notifyPeers: string[]
  notifyEmails: string[]
  fmlaQualifyingReason: string | null
  onBehalfOf: string | null
}

interface Deps {
  balances: BalancesStore
  leaveTypes: LeaveType[]
  delegations: Delegation[]
  fmlaApprovers: ApproverMapping[]
  classRules: EmployeeClassRule[]
  notify: (event: string, recipients: string, message: string) => void
  actor: string
}

const ACTIVE_STATUSES = ['pending', 'approved', 'cancellation-requested']

/**
 * Leave request store — submit/approve/reject/escalate/withdraw/cancel with
 * workflow routing, delegation, LOP and tentative handling
 * (LVE-03/04/05/06/12/15/17/30/31/32/49).
 */
export function useLeaveRequests({
  balances,
  leaveTypes,
  delegations,
  fmlaApprovers,
  classRules,
  notify,
  actor,
}: Deps) {
  const [requests, setRequests] = useState<LeaveRequest[]>(seedRequests)

  const patch = (id: string, fn: (r: LeaveRequest) => LeaveRequest) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? fn(r) : r)))

  const withHistory = (
    r: LeaveRequest,
    action: string,
    detail: string
  ): LeaveRequest => ({
    ...r,
    history: [
      ...r.history,
      { at: new Date().toISOString(), actor, action, detail },
    ],
  })

  /** LVE-03/23: overlap validation against the employee's existing requests. */
  const hasOverlap = (employeeId: string, from: string, to: string) =>
    requests.some(
      (r) =>
        r.employeeId === employeeId &&
        ACTIVE_STATUSES.includes(r.status) &&
        rangesOverlap(r.from, r.to, from, to)
    )

  const submit = (draft: RequestDraft) => {
    const emp = employeeById(draft.employeeId)
    const type = leaveTypes.find((t) => t.id === draft.typeId)
    if (!emp || !type) return

    // Workflow engine (LVE-24): build levels from config at runtime.
    const today = todayISO()
    const activeDelegation = delegations.find(
      (d) => d.fromDate <= today && d.toDate >= today
    )
    const managerName = employeeById(emp.managerId ?? '')?.name ?? 'Rahul Menon'
    const steps: ApprovalStep[] = []
    const base = {
      mode: 'sequential' as const,
      rule: 'all' as const,
      status: 'pending' as const,
      actedBy: null,
      actedOn: null,
      note: null,
      delegatedFrom: null,
      escalated: false,
      slaHours: 48,
    }
    if (type.fmla) {
      const mapping = fmlaApprovers.find((m) =>
        m.locations.includes(emp.location)
      )
      steps.push({
        ...base,
        level: 1,
        name: `FMLA Approver (${emp.location})`,
        approver:
          mapping?.approvers.join(', ') ??
          'Unassigned — configure FMLA approvers',
        mode: 'parallel',
        rule: 'any',
        slaHours: 72,
      })
    } else {
      steps.push({
        ...base,
        level: 1,
        name: 'Reporting Manager',
        approver:
          activeDelegation?.from === managerName
            ? activeDelegation.to
            : managerName,
        delegatedFrom:
          activeDelegation?.from === managerName ? managerName : null,
      })
      if (draft.lopAmount > 0) {
        steps.push({
          ...base,
          level: 2,
          name: 'Loss-of-Pay Approver',
          approver: 'Sunita Patil',
          slaHours: 72,
        })
      }
    }

    const request: LeaveRequest = {
      id: shortId('lr'),
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.code,
      department: emp.department,
      location: emp.location,
      typeId: type.id,
      typeName: type.name,
      unit: type.unit,
      from: draft.from,
      to: draft.to,
      fromTime: draft.fromTime,
      toTime: draft.toTime,
      amount: draft.amount,
      lopAmount: draft.lopAmount,
      reason: draft.reason,
      tentative: draft.tentative,
      tentativeReason: draft.tentativeReason,
      notifyPeers: draft.notifyPeers,
      notifyEmails: draft.notifyEmails,
      fmla: type.fmla,
      fmlaQualifyingReason: draft.fmlaQualifyingReason,
      fmlaRejectionReason: null,
      status: 'pending',
      steps,
      submittedOn: today,
      onBehalfOf: draft.onBehalfOf,
      history: [
        {
          at: new Date().toISOString(),
          actor,
          action: draft.onBehalfOf ? 'Recorded on behalf' : 'Submitted',
          detail: `Routed to ${steps[0].name}${draft.lopAmount > 0 ? ` — ${draft.lopAmount} ${type.unit} flagged as loss of pay` : ''}${draft.tentative ? ' (tentative)' : ''}.`,
        },
      ],
    }
    setRequests((prev) => [request, ...prev])

    const paid = draft.amount - draft.lopAmount
    balances.applyDelta(emp.id, type.id, {
      pendingApproval: paid,
      lopPending: draft.lopAmount,
      tentative: draft.tentative ? draft.amount : 0,
    })
    const peers = [...draft.notifyPeers, ...draft.notifyEmails]
    notify(
      'Submitted',
      `${steps[0].approver} (approver)${peers.length ? `, ${peers.join(', ')} (peers)` : ''}`,
      `Leave submitted: ${emp.name} — ${type.name}, ${draft.from} to ${draft.to}. Status: Pending.`
    )
    toast.success(
      draft.onBehalfOf
        ? `Leave recorded on behalf of ${emp.name} and routed for approval`
        : 'Leave request submitted and routed for approval'
    )
  }

  const finalizeApproval = (r: LeaveRequest): void => {
    const paid = r.amount - r.lopAmount
    balances.applyDelta(r.employeeId, r.typeId, {
      pendingApproval: -paid,
      scheduled: paid,
      lopPending: -r.lopAmount,
      lopApproved: r.lopAmount,
    })
    notify(
      'Approved',
      `${r.employeeName} (applicant)${r.notifyPeers.length ? `, ${r.notifyPeers.join(', ')} (peers)` : ''}`,
      `Leave approved: ${r.employeeName} — ${r.typeName}, ${r.from} to ${r.to}.`
    )
  }

  /** LVE-12/44: approve the current pending level; enforces supervisor limits. */
  const approve = (id: string, asSupervisor: boolean) => {
    const r = requests.find((x) => x.id === id)
    if (!r) return
    const step = pendingStep(r.steps)
    if (!step) return

    if (asSupervisor && r.unit === 'days' && step.name === 'Reporting Manager') {
      const emp = employeeById(r.employeeId)
      const rule = classRules.find(
        (c) => c.employeeClass === emp?.employeeClass
      )
      if (rule && r.amount > rule.maxSupervisorApproval) {
        toast.error(
          `Supervisors may approve at most ${rule.maxSupervisorApproval} days for ${rule.employeeClass} staff — request must escalate`
        )
        return
      }
    }

    const steps = r.steps.map((s) =>
      s === step
        ? {
            ...s,
            status: 'approved' as const,
            actedBy: actor,
            actedOn: todayISO(),
          }
        : s
    )
    const done = steps.every((s) => s.status !== 'pending')
    patch(id, (prev) =>
      withHistory(
        { ...prev, steps, status: done ? 'approved' : prev.status },
        `Approved (${step.name})`,
        done
          ? 'All levels complete — request finalized, balance deducted.'
          : `Level ${step.level} approved — advanced to the next configured level.`
      )
    )
    if (done) {
      finalizeApproval(r)
    } else {
      const next = steps.find((s) => s.status === 'pending')
      notify(
        'Submitted',
        `${next?.approver ?? 'Next approver'} (approver)`,
        `Leave awaiting your action: ${r.employeeName} — ${r.typeName}.`
      )
    }
    toast.success(
      done ? 'Request fully approved' : `${step.name} approved — next level notified`
    )
  }

  /** Reject with a mandatory reason; FMLA requests need a configured reason. */
  const reject = (
    id: string,
    reason: string,
    fmlaRejectionReason: string | null
  ) => {
    const r = requests.find((x) => x.id === id)
    if (!r) return
    const step = pendingStep(r.steps)
    if (!step) return
    patch(id, (prev) =>
      withHistory(
        {
          ...prev,
          status: 'rejected',
          fmlaRejectionReason,
          steps: prev.steps.map((s) =>
            s === step
              ? {
                  ...s,
                  status: 'rejected' as const,
                  actedBy: actor,
                  actedOn: todayISO(),
                  note: reason,
                }
              : s
          ),
        },
        `Rejected (${step.name})`,
        `Reason: “${fmlaRejectionReason ?? reason}”. Balance restored.`
      )
    )
    const paid = r.amount - r.lopAmount
    balances.applyDelta(r.employeeId, r.typeId, {
      pendingApproval: -paid,
      lopPending: -r.lopAmount,
      tentative: r.tentative ? -r.amount : 0,
    })
    notify(
      'Rejected',
      `${r.employeeName} (applicant)`,
      `Leave rejected: ${r.typeName}, ${r.from} to ${r.to}. Reason: ${fmlaRejectionReason ?? reason}`
    )
    toast.success('Request rejected — applicant notified, balance restored')
  }

  /** LVE-06: manual SLA escalation of the current pending level. */
  const escalate = (id: string) => {
    patch(id, (prev) => {
      const step = pendingStep(prev.steps)
      if (!step) return prev
      return withHistory(
        {
          ...prev,
          steps: prev.steps.map((s) =>
            s === step
              ? { ...s, escalated: true, approver: 'Escalation: Dept Head' }
              : s
          ),
        },
        'SLA escalation',
        `${step.slaHours}h SLA breached at level ${step.level} — reassigned to the escalation approver.`
      )
    })
    notify(
      'Escalated',
      'Escalation approver, applicant',
      'Leave request escalated after SLA breach.'
    )
    toast.info('Request escalated to the designated escalation approver')
  }

  /** LVE-15: withdraw a pending request — balance restored immediately. */
  const withdraw = (id: string) => {
    const r = requests.find((x) => x.id === id)
    if (!r || r.status !== 'pending') return
    patch(id, (prev) =>
      withHistory(
        { ...prev, status: 'withdrawn' },
        'Withdrawn',
        'Removed from the approval workflow; balance restored.'
      )
    )
    const paid = r.amount - r.lopAmount
    balances.applyDelta(r.employeeId, r.typeId, {
      pendingApproval: -paid,
      lopPending: -r.lopAmount,
      tentative: r.tentative ? -r.amount : 0,
    })
    notify(
      'Cancelled',
      `${pendingStep(r.steps)?.approver ?? 'Approver'} (approver)`,
      `Leave withdrawn by ${r.employeeName}.`
    )
    toast.success('Request withdrawn — balance restored')
  }

  /** LVE-15: cancel approved future leave — routed per policy, then restored. */
  const cancelApproved = (id: string) => {
    const r = requests.find((x) => x.id === id)
    if (!r || r.status !== 'approved') return
    patch(id, (prev) =>
      withHistory(
        { ...prev, status: 'cancellation-requested' },
        'Cancellation requested',
        'Cancellation routed for approval per policy.'
      )
    )
    toast.info('Cancellation routed for approval')
  }

  const processCancellation = (id: string) => {
    const r = requests.find((x) => x.id === id)
    if (!r || r.status !== 'cancellation-requested') return
    patch(id, (prev) =>
      withHistory(
        { ...prev, status: 'cancelled' },
        'Cancellation approved',
        'Balance restored; approvers and peers notified.'
      )
    )
    const paid = r.amount - r.lopAmount
    balances.applyDelta(r.employeeId, r.typeId, {
      scheduled: -paid,
      cancelled: r.amount,
      lopApproved: -r.lopAmount,
    })
    notify(
      'Cancelled',
      `${r.employeeName} (applicant)${r.notifyPeers.length ? `, ${r.notifyPeers.join(', ')} (peers)` : ''}`,
      `Leave cancelled: ${r.typeName}, ${r.from} to ${r.to}. Balance restored.`
    )
    toast.success('Cancellation processed — balance restored')
  }

  /** LVE-30: confirm a tentative request (or cancel it via withdraw). */
  const confirmTentative = (id: string) => {
    const r = requests.find((x) => x.id === id)
    if (!r || !r.tentative) return
    patch(id, (prev) =>
      withHistory(
        { ...prev, tentative: false },
        'Tentative confirmed',
        'Request confirmed — no longer provisional.'
      )
    )
    balances.applyDelta(r.employeeId, r.typeId, { tentative: -r.amount })
    toast.success('Tentative request confirmed')
  }

  return {
    requests,
    hasOverlap,
    submit,
    approve,
    reject,
    escalate,
    withdraw,
    cancelApproved,
    processCancellation,
    confirmTentative,
  }
}

export type LeaveRequestsStore = ReturnType<typeof useLeaveRequests>
