import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCompOff,
  seedCorrections,
  seedOutTime,
  seedOvertime,
  seedWfh,
  type CompOffRequest,
  type CorrectionRequest,
  type OutTimeRequest,
  type OvertimeRequest,
  type WfhRequest,
} from '../data/requests'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import { employeeName, fmtDate, hoursBetween } from '../data/shared'

export interface CorrectionDraft {
  employeeId: string
  requestedBy: string
  date: string
  kind: CorrectionRequest['kind']
  originalIn: string
  originalOut: string | null
  requestedIn: string
  requestedOut: string
  justification: string
  afterPayrollCutoff: boolean
}

interface UseRequestsArgs {
  actor: string
  /** Writes the approved correction back onto the attendance record. */
  applyCorrection: (employeeId: string, date: string, punchIn: string, punchOut: string) => void
  /** OT above this many hours needs approval beyond the supervisor (TNA-30). */
  supervisorCapHours: number
  /** WFH monthly instance limit (TNA-37). */
  wfhMonthlyLimit: number
  /** Out-time per-request hour limit (TNA-35). */
  outTimeMaxHoursPerRequest: number
  /** W8 — corrections for dates on/before this date are frozen for payroll. */
  payrollLockedThrough: string
}

/**
 * All employee-raised request stores + the approver actions that drive them
 * through the workflow/notification engines (TNA-11/15/27/31/33/36/38).
 */
export function useRequests({
  actor,
  applyCorrection,
  supervisorCapHours,
  wfhMonthlyLimit,
  outTimeMaxHoursPerRequest,
  payrollLockedThrough,
}: UseRequestsArgs) {
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(seedCorrections)
  const [overtime, setOvertime] = useState<OvertimeRequest[]>(seedOvertime)
  const [compOff, setCompOff] = useState<CompOffRequest[]>(seedCompOff)
  const [outTime, setOutTime] = useState<OutTimeRequest[]>(seedOutTime)
  const [wfh, setWfh] = useState<WfhRequest[]>(seedWfh)

  /** Returns false when the payroll lock blocked the correction (W8). */
  const submitCorrection = useCallback(
    (draft: CorrectionDraft): boolean => {
      if (draft.date <= payrollLockedThrough) {
        toast.error(
          `This period is locked for payroll — corrections up to ${fmtDate(payrollLockedThrough)} are frozen. Contact HR to unlock.`
        )
        publishAuditEvent({
          module: 'Time & Attendance',
          action: 'Correction blocked by payroll lock',
          actor: draft.requestedBy,
          recordName: `Attendance correction — ${employeeName(draft.employeeId)}`,
          changes: [
            {
              field: `Correction for ${fmtDate(draft.date)}`,
              previousValue: null,
              newValue: `Blocked — period locked through ${fmtDate(payrollLockedThrough)}`,
            },
          ],
        })
        return false
      }
      setCorrections((prev) => [
        {
          ...draft,
          id: `cor-${crypto.randomUUID().slice(0, 6)}`,
          status: 'pending',
          approvalLevel: 1,
          slaHoursLeft: 48,
          escalatedTo: null,
          submittedOn: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      toast.success(
        draft.afterPayrollCutoff
          ? 'Correction submitted — raised after the payroll cut-off, so a second-level approval is required'
          : 'Correction request submitted and routed to your approver'
      )
      return true
    },
    [payrollLockedThrough]
  )

  const decideCorrection = useCallback(
    (id: string, approve: boolean, reason: string) => {
      const req = corrections.find((c) => c.id === id)
      if (!req) return
      // Payroll-cutoff requests advance to L2 before final approval (TNA-43).
      if (approve && req.afterPayrollCutoff && req.approvalLevel === 1) {
        setCorrections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, approvalLevel: 2 } : c))
        )
        toast.success('Level 1 approved — advanced to second-level approval (post-payroll rule)')
        return
      }
      setCorrections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: approve ? 'approved' : 'rejected' } : c
        )
      )
      if (approve) {
        applyCorrection(req.employeeId, req.date, req.requestedIn, req.requestedOut)
        toast.success(
          `Correction approved — attendance for ${employeeName(req.employeeId)} on ${req.date} updated; requester notified`
        )
      } else {
        toast.success(`Correction rejected (${reason || 'no reason given'}) — record unchanged, requester notified`)
      }
    },
    [applyCorrection, corrections]
  )

  /** TNA-11/15 — SLA breach escalates to the next authority automatically. */
  const escalateCorrection = useCallback((id: string) => {
    setCorrections((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'escalated', approvalLevel: c.approvalLevel + 1, slaHoursLeft: 0, escalatedTo: 'Arjun Mehta (Group HR)' }
          : c
      )
    )
    toast.warning('SLA threshold breached — request escalated to the next authority')
  }, [])

  const submitOvertime = useCallback(
    (employeeId: string, date: string, hours: number) => {
      const overCap = hours > supervisorCapHours
      setOvertime((prev) => [
        {
          id: `ot-${crypto.randomUUID().slice(0, 6)}`,
          employeeId,
          date,
          recordedHours: hours,
          approvedHours: null,
          category: 'normal',
          status: 'pending',
          needsHigherApproval: overCap,
          approver: overCap ? 'Department Head (above supervisor cap)' : 'Immediate Supervisor',
          submittedOn: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      toast.success(
        overCap
          ? `Overtime request submitted — ${hours}h exceeds the ${supervisorCapHours}h supervisor cap, routed for higher approval`
          : 'Overtime request submitted to your supervisor'
      )
    },
    [supervisorCapHours]
  )

  const decideOvertime = useCallback((id: string, approve: boolean, approvedHours?: number) => {
    setOvertime((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: approve ? 'approved' : 'rejected',
              approvedHours: approve ? (approvedHours ?? o.recordedHours) : null,
            }
          : o
      )
    )
    toast.success(
      approve
        ? 'Overtime authorized and released for payroll'
        : 'Overtime rejected — will not be paid; requester notified'
    )
  }, [])

  const submitCompOff = useCallback((employeeId: string, compOffDate: string, days: number) => {
    setCompOff((prev) => [
      {
        id: `co-${crypto.randomUUID().slice(0, 6)}`,
        employeeId,
        compOffDate,
        days,
        earnedFrom: 'Extra hours beyond business hours',
        status: 'pending',
        submittedOn: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ])
    toast.success('Comp off request submitted and routed to your approver')
  }, [])

  const decideCompOff = useCallback((id: string, approve: boolean) => {
    setCompOff((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: approve ? 'approved' : 'rejected' } : c))
    )
    toast.success(approve ? 'Comp off approved — balance updated' : 'Comp off rejected — requester notified')
  }, [])

  const submitOutTime = useCallback(
    (employeeId: string, type: OutTimeRequest['type'], fromDateTime: string, toDateTime: string) => {
      const hours = hoursBetween(fromDateTime.slice(11), toDateTime.slice(11))
      const overLimit = hours > outTimeMaxHoursPerRequest
      setOutTime((prev) => [
        {
          id: `out-${crypto.randomUUID().slice(0, 6)}`,
          employeeId,
          type,
          fromDateTime,
          toDateTime,
          hours,
          status: overLimit ? 'blocked' : 'pending',
          policyNote: overLimit ? `Exceeds max ${outTimeMaxHoursPerRequest}h per request` : null,
          submittedOn: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      if (overLimit) {
        toast.error(`Out-time request blocked — ${hours}h exceeds the ${outTimeMaxHoursPerRequest}h per-request limit`)
      } else {
        toast.success(`Out-time request submitted (${hours}h computed) and routed to your approver`)
      }
    },
    [outTimeMaxHoursPerRequest]
  )

  const decideOutTime = useCallback((id: string, approve: boolean) => {
    setOutTime((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: approve ? 'approved' : 'rejected' } : o))
    )
    toast.success(approve ? 'Out time approved — reflected in attendance' : 'Out time rejected — requester notified')
  }, [])

  const submitWfh = useCallback(
    (employeeId: string, fromDate: string, toDate: string) => {
      const days =
        Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1
      const monthUsed = wfh.filter(
        (w) => w.employeeId === employeeId && w.fromDate.slice(0, 7) === fromDate.slice(0, 7) && w.status !== 'rejected' && w.status !== 'blocked'
      ).length
      const overLimit = monthUsed >= wfhMonthlyLimit || days > wfhMonthlyLimit
      setWfh((prev) => [
        {
          id: `wfh-${crypto.randomUUID().slice(0, 6)}`,
          employeeId,
          fromDate,
          toDate,
          days,
          hours: days * 8,
          status: overLimit ? 'blocked' : 'pending',
          policyNote: overLimit ? `Exceeds ${wfhMonthlyLimit} WFH instances this month` : null,
          submittedOn: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ])
      if (overLimit) {
        toast.error(`WFH request rejected as over-limit (${wfhMonthlyLimit}/month policy)`)
      } else {
        toast.success(`WFH request submitted for ${days} day(s) and routed to your approver`)
      }
    },
    [wfh, wfhMonthlyLimit]
  )

  const decideWfh = useCallback((id: string, approve: boolean) => {
    setWfh((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: approve ? 'approved' : 'rejected' } : w))
    )
    toast.success(
      approve
        ? 'WFH approved — attendance for those days will reflect work-from-home'
        : 'WFH rejected — requester notified'
    )
  }, [])

  return {
    actor,
    corrections,
    overtime,
    compOff,
    outTime,
    wfh,
    submitCorrection,
    decideCorrection,
    escalateCorrection,
    submitOvertime,
    decideOvertime,
    submitCompOff,
    decideCompOff,
    submitOutTime,
    decideOutTime,
    submitWfh,
    decideWfh,
  }
}

export type RequestsStore = ReturnType<typeof useRequests>
