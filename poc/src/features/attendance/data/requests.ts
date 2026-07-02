/**
 * Employee-raised requests: attendance corrections (TNA-11/15/44), overtime
 * (TNA-31), comp off (TNA-33), out time (TNA-36) and work from home (TNA-38).
 * All flow through the shared Workflow/Notification engines (TNA-27).
 */

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'blocked'

export type CorrectionKind = 'missed-punch' | 'late-arrival' | 'early-exit'

export interface CorrectionRequest {
  id: string
  employeeId: string
  /** Who keyed the request (admin when raised on behalf of a non-user, TNA-18). */
  requestedBy: string
  date: string
  kind: CorrectionKind
  originalIn: string
  originalOut: string | null
  requestedIn: string
  requestedOut: string
  justification: string
  status: RequestStatus
  /** Current level in the configured approver chain (TNA-16). */
  approvalLevel: number
  /** True when raised after the payroll cut-off — needs 2nd level (TNA-43). */
  afterPayrollCutoff: boolean
  slaHoursLeft: number
  escalatedTo: string | null
  submittedOn: string
}

export interface OvertimeRequest {
  id: string
  employeeId: string
  date: string
  recordedHours: number
  approvedHours: number | null
  category: 'normal' | 'holiday' | 'night-shift'
  status: RequestStatus
  /** True when hours exceed the supervisor approval cap (TNA-30). */
  needsHigherApproval: boolean
  approver: string
  submittedOn: string
}

export interface CompOffRequest {
  id: string
  employeeId: string
  compOffDate: string
  days: number
  earnedFrom: string
  status: RequestStatus
  submittedOn: string
}

export const OUT_TIME_TYPES = ['Personal', 'Official', 'Medical'] as const
export type OutTimeType = (typeof OUT_TIME_TYPES)[number]

export interface OutTimeRequest {
  id: string
  employeeId: string
  type: OutTimeType
  fromDateTime: string
  toDateTime: string
  hours: number
  status: RequestStatus
  /** Set when a configured monthly/duration limit was breached (TNA-35). */
  policyNote: string | null
  submittedOn: string
}

export interface WfhRequest {
  id: string
  employeeId: string
  fromDate: string
  toDate: string
  days: number
  hours: number
  status: RequestStatus
  policyNote: string | null
  submittedOn: string
}

export const seedCorrections: CorrectionRequest[] = [
  {
    id: 'cor-01', employeeId: 'emp-01', requestedBy: 'Ananya Sharma', date: '2026-07-01',
    kind: 'missed-punch', originalIn: '09:00', originalOut: null, requestedIn: '09:00', requestedOut: '18:15',
    justification: 'Exit reader was down at HYD Gate 1; left at 18:15 with team.',
    status: 'pending', approvalLevel: 1, afterPayrollCutoff: false, slaHoursLeft: 14,
    escalatedTo: null, submittedOn: '2026-07-01',
  },
  {
    id: 'cor-02', employeeId: 'emp-01', requestedBy: 'Ananya Sharma', date: '2026-06-30',
    kind: 'late-arrival', originalIn: '09:41', originalOut: '18:05', requestedIn: '09:15', requestedOut: '18:05',
    justification: 'Was in the office at 09:15 — badge only registered on second attempt.',
    status: 'escalated', approvalLevel: 2, afterPayrollCutoff: false, slaHoursLeft: 0,
    escalatedTo: 'Arjun Mehta (L2)', submittedOn: '2026-06-30',
  },
  {
    id: 'cor-03', employeeId: 'emp-07', requestedBy: 'Lakshmi Menon', date: '2026-06-30',
    kind: 'early-exit', originalIn: '09:15', originalOut: '16:20', requestedIn: '09:15', requestedOut: '18:00',
    justification: 'Worked from home after leaving for a school event; laptop VPN logs attached.',
    status: 'pending', approvalLevel: 1, afterPayrollCutoff: true, slaHoursLeft: 30,
    escalatedTo: null, submittedOn: '2026-07-01',
  },
  {
    id: 'cor-04', employeeId: 'emp-09', requestedBy: 'Sunita Patil (on behalf)', date: '2026-06-27',
    kind: 'missed-punch', originalIn: '08:40', originalOut: null, requestedIn: '08:40', requestedOut: '17:45',
    justification: 'Non-user employee — supervisor confirmed exit time on the floor log.',
    status: 'approved', approvalLevel: 2, afterPayrollCutoff: false, slaHoursLeft: 0,
    escalatedTo: null, submittedOn: '2026-06-28',
  },
  {
    id: 'cor-05', employeeId: 'emp-04', requestedBy: 'Kabir Anand', date: '2026-06-25',
    kind: 'late-arrival', originalIn: '22:35', originalOut: '07:10', requestedIn: '22:00', requestedOut: '07:10',
    justification: 'Company transport arrived late.',
    status: 'rejected', approvalLevel: 1, afterPayrollCutoff: false, slaHoursLeft: 0,
    escalatedTo: null, submittedOn: '2026-06-26',
  },
]

export const seedOvertime: OvertimeRequest[] = [
  { id: 'ot-01', employeeId: 'emp-01', date: '2026-06-29', recordedHours: 2.5, approvedHours: null, category: 'normal', status: 'pending', needsHigherApproval: false, approver: 'Sunita Patil', submittedOn: '2026-06-30' },
  { id: 'ot-02', employeeId: 'emp-04', date: '2026-06-30', recordedHours: 1.17, approvedHours: 1, category: 'night-shift', status: 'approved', needsHigherApproval: false, approver: 'Vikram Rathore', submittedOn: '2026-07-01' },
  { id: 'ot-03', employeeId: 'emp-10', date: '2026-06-30', recordedHours: 9.92, approvedHours: null, category: 'holiday', status: 'pending', needsHigherApproval: true, approver: 'Arjun Mehta (above cap)', submittedOn: '2026-07-01' },
  { id: 'ot-04', employeeId: 'emp-02', date: '2026-06-24', recordedHours: 3, approvedHours: null, category: 'normal', status: 'rejected', needsHigherApproval: false, approver: 'Sunita Patil', submittedOn: '2026-06-25' },
]

export const seedCompOff: CompOffRequest[] = [
  { id: 'co-01', employeeId: 'emp-01', compOffDate: '2026-07-10', days: 1, earnedFrom: 'Holiday work on 28 Jun', status: 'pending', submittedOn: '2026-07-01' },
  { id: 'co-02', employeeId: 'emp-03', compOffDate: '2026-07-03', days: 1, earnedFrom: 'Holiday work on 28 Jun', status: 'approved', submittedOn: '2026-06-29' },
  { id: 'co-03', employeeId: 'emp-04', compOffDate: '2026-06-22', days: 0.5, earnedFrom: 'Extended night shift 15 Jun', status: 'rejected', submittedOn: '2026-06-18' },
]

export const seedOutTime: OutTimeRequest[] = [
  { id: 'out-01', employeeId: 'emp-01', type: 'Personal', fromDateTime: '2026-07-02T15:00', toDateTime: '2026-07-02T17:00', hours: 2, status: 'pending', policyNote: null, submittedOn: '2026-07-01' },
  { id: 'out-02', employeeId: 'emp-01', type: 'Medical', fromDateTime: '2026-06-19T10:00', toDateTime: '2026-06-19T12:30', hours: 2.5, status: 'approved', policyNote: null, submittedOn: '2026-06-18' },
  { id: 'out-03', employeeId: 'emp-05', type: 'Personal', fromDateTime: '2026-06-26T14:00', toDateTime: '2026-06-26T19:00', hours: 5, status: 'blocked', policyNote: 'Exceeds max 3h per request', submittedOn: '2026-06-25' },
]

export const seedWfh: WfhRequest[] = [
  { id: 'wfh-01', employeeId: 'emp-01', fromDate: '2026-07-06', toDate: '2026-07-07', days: 2, hours: 16, status: 'pending', policyNote: null, submittedOn: '2026-07-01' },
  { id: 'wfh-02', employeeId: 'emp-05', fromDate: '2026-06-30', toDate: '2026-06-30', days: 1, hours: 8, status: 'approved', policyNote: null, submittedOn: '2026-06-27' },
  { id: 'wfh-03', employeeId: 'emp-12', fromDate: '2026-06-23', toDate: '2026-06-27', days: 5, hours: 40, status: 'blocked', policyNote: 'Exceeds 4 WFH instances this month', submittedOn: '2026-06-20' },
]
