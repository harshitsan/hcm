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
import { daySpan, employeeById, rangesOverlap, shortId, todayISO } from '../data/shared'
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
  /** Optional message included in the peer/email absence notification. */
  peerMessage?: string
  fmlaQualifyingReason: string | null
  /** File names of uploaded supporting documents (ATO-05). */
  attachments: string[]
  onBehalfOf: string | null
  /** Set when a manager/HR assigns the time off on the employee's behalf. */
  assignedBy?: string
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

const ACTIVE_STATUSES = [
  'pending',
  'approved',
  'cancellation-requested',
  'needs-clarification',
]

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

  /**
   * Shared creator behind submit (self-service / record-on-behalf) and
   * assign (manager/HR assigns time off, ETOR-AS). Assigned requests follow
   * the normal configured workflow and start as pending.
   */
  const createRequest = (draft: RequestDraft, assignedBy: string | null) => {
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
      attachments: draft.attachments,
      clarifications: [],
      periodChangedByApprover: null,
      pendingTasks: [],
      pendingKtTasks: [],
      approverAttachments: [],
      steps,
      submittedOn: today,
      onBehalfOf: assignedBy ?? draft.onBehalfOf,
      history: [
        {
          at: new Date().toISOString(),
          actor,
          action: assignedBy
            ? 'Assigned'
            : draft.onBehalfOf
              ? 'Recorded on behalf'
              : 'Submitted',
          detail: `${assignedBy ? `Assigned by ${assignedBy} on behalf of employee. ` : ''}Routed to ${steps[0].name}${draft.lopAmount > 0 ? ` — ${draft.lopAmount} ${type.unit} flagged as loss of pay` : ''}${draft.tentative ? ' (tentative)' : ''}.`,
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
      `Leave ${assignedBy ? 'assigned' : 'submitted'}: ${emp.name} — ${type.name}, ${draft.from} to ${draft.to}. Status: Pending.${draft.peerMessage ? ` Message to peers: “${draft.peerMessage}”` : ''}`
    )
    toast.success(
      assignedBy
        ? `Time off assigned to ${emp.name} — follows the normal approval workflow`
        : draft.onBehalfOf
          ? `Leave recorded on behalf of ${emp.name} and routed for approval`
          : 'Leave request submitted and routed for approval'
    )
  }

  const submit = (draft: RequestDraft) => createRequest(draft, null)

  /** ETOR-AS: manager/HR assigns time off on the employee's behalf. */
  const assign = (draft: RequestDraft) =>
    createRequest(draft, draft.assignedBy ?? actor)

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

  /**
   * LVE-12/44: approve the current pending level; enforces supervisor limits.
   * A comment is mandatory per the PDF — it is threaded into the step note so
   * second-level approvers see the first level's remarks (defaulted for
   * legacy callers).
   */
  const approve = (id: string, asSupervisor: boolean, comment = 'Approved') => {
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
            note: comment,
          }
        : s
    )
    const done = steps.every((s) => s.status !== 'pending')
    patch(id, (prev) =>
      withHistory(
        { ...prev, steps, status: done ? 'approved' : prev.status },
        `Approved (${step.name})`,
        `${
          done
            ? 'All levels complete — request finalized, balance deducted.'
            : `Level ${step.level} approved — advanced to the next configured level.`
        } Comment: “${comment}”`
      )
    )
    if (done) {
      finalizeApproval(r)
    } else {
      const next = steps.find((s) => s.status === 'pending')
      notify(
        'Submitted',
        `${next?.approver ?? 'Next approver'} (approver)`,
        `Leave awaiting your action: ${r.employeeName} — ${r.typeName}. Level ${step.level} comment: “${comment}”`
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

  /**
   * ETOR-NC: approver sends the request back with a question. The applicant
   * (or the approver on their behalf) answers via answerClarification.
   */
  const askClarification = (id: string, question: string, askedBy: string) => {
    const r = requests.find((x) => x.id === id)
    if (!r || r.status !== 'pending') return
    patch(id, (prev) =>
      withHistory(
        {
          ...prev,
          status: 'needs-clarification',
          clarifications: [
            ...prev.clarifications,
            {
              askedBy,
              askedOn: todayISO(),
              question,
              answeredOn: null,
              answer: null,
            },
          ],
        },
        'Clarification requested',
        `Asked: “${question}” Applicant notified.`
      )
    )
    notify(
      'Submitted',
      `${r.employeeName} (applicant)`,
      `Clarification needed on your ${r.typeName} request (${r.from} to ${r.to}): ${question}`
    )
    toast.info('Clarification requested — applicant notified')
  }

  /**
   * ETOR-NC: record the answer to the latest open clarification and put the
   * request back in the approval queue. Approvers may also answer on behalf
   * of the applicant (same API).
   */
  const answerClarification = (id: string, answer: string) => {
    const r = requests.find((x) => x.id === id)
    if (!r || r.status !== 'needs-clarification') return
    patch(id, (prev) => {
      let openIdx = -1
      for (let i = prev.clarifications.length - 1; i >= 0; i--) {
        if (prev.clarifications[i].answer === null) {
          openIdx = i
          break
        }
      }
      return withHistory(
        {
          ...prev,
          status: 'pending',
          clarifications: prev.clarifications.map((c, i) =>
            i === openIdx ? { ...c, answer, answeredOn: todayISO() } : c
          ),
        },
        'Clarification provided',
        `Answered: “${answer}” Request returned to the pending approval queue.`
      )
    })
    const approver = pendingStep(r.steps)?.approver ?? 'Approver'
    notify(
      'Submitted',
      `${approver} (approver)`,
      `Clarification provided on ${r.employeeName}'s ${r.typeName} request: ${answer}`
    )
    toast.success('Clarification submitted — approver notified')
  }

  /**
   * ETOA-06: approver changes the applied period. The amount is recomputed
   * the same way apply does (calendar-day span; 8h/day for hour-tracked
   * types unless a same-day time window is set) and pending balances shift
   * by the delta. The original dates are preserved on the request.
   */
  const changePeriod = (
    id: string,
    from: string,
    to: string,
    note: string,
    changedBy: string
  ) => {
    const r = requests.find((x) => x.id === id)
    if (!r || !['pending', 'needs-clarification'].includes(r.status)) return
    if (from > to) {
      toast.error('The new period is invalid — From must be on or before To')
      return
    }
    const days = daySpan(from, to)
    const newAmount =
      r.unit === 'hours'
        ? from === to && r.fromTime && r.toTime
          ? r.amount // same-day time window kept as applied
          : days * 8
        : days
    const paidDelta = (newAmount - r.lopAmount) - (r.amount - r.lopAmount)
    patch(id, (prev) =>
      withHistory(
        {
          ...prev,
          from,
          to,
          amount: newAmount,
          periodChangedByApprover: prev.periodChangedByApprover ?? {
            originalFrom: prev.from,
            originalTo: prev.to,
            changedBy,
            note,
          },
        },
        'Period changed by approver',
        `${changedBy} changed the period ${r.from} → ${r.to} to ${from} → ${to} (${newAmount} ${r.unit}). Note: “${note}”`
      )
    )
    if (paidDelta !== 0)
      balances.applyDelta(r.employeeId, r.typeId, {
        pendingApproval: paidDelta,
        tentative: r.tentative ? newAmount - r.amount : 0,
      })
    notify(
      'Adjusted',
      `${r.employeeName} (applicant)`,
      `Your ${r.typeName} period was changed by ${changedBy} to ${from} – ${to}. Note: ${note}`
    )
    toast.success('Period updated — applicant notified')
  }

  /** ETOA-06: approver uploads a document against the application. */
  const addApproverAttachment = (id: string, fileName: string) => {
    patch(id, (prev) =>
      withHistory(
        {
          ...prev,
          approverAttachments: [...prev.approverAttachments, fileName],
        },
        'Document uploaded',
        `Approver attached “${fileName}” to the application.`
      )
    )
    toast.success(`“${fileName}” attached to the application`)
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
    assign,
    approve,
    reject,
    askClarification,
    answerClarification,
    changePeriod,
    addApproverAttachment,
    escalate,
    withdraw,
    cancelApproved,
    processCancellation,
    confirmTentative,
  }
}

export type LeaveRequestsStore = ReturnType<typeof useLeaveRequests>
