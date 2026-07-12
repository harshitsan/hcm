import { type ApprovalStep } from './shared'

/** Disciplinary actions routed to location-specific approvers. */

export const DISCIPLINARY_ACTION_TYPES = [
  'Verbal Warning',
  'Warning Letter',
  'Show-Cause Notice',
  'Suspension',
  'Termination',
  'Counselling',
] as const

export type DisciplinaryActionType = (typeof DISCIPLINARY_ACTION_TYPES)[number]

/** Company policies a disciplinary case can be raised against. */
export const DISCIPLINARY_POLICIES = [
  'Code of Conduct',
  'Attendance Policy',
  'Data Security Policy',
  'Anti-Harassment Policy',
] as const

export type DisciplinaryStatus =
  | 'pending-approval'
  | 'approved'
  | 'letter-issued'
  | 'rejected'
  | 'counselling-in-progress'
  | 'counselling-completed'
  | 'closed'

/** Recorded when an approved Suspension/Termination is handed to the Exit Coordinator. */
export interface ExitHandoff {
  process: 'Suspension' | 'Termination'
  triggeredOn: string
  /** Id of the exit case opened from this disciplinary referral (case ↔ exit link). */
  exitId?: string
}

/** A dated line on the case's activity history. */
export interface DisciplinaryHistoryEntry {
  id: string
  date: string
  text: string
}

export interface DisciplinaryCase {
  id: string
  employeeName: string
  employeeCode: string
  department: string
  location: string
  actionType: DisciplinaryActionType
  policyDeviated: string
  reason: string
  reportedBy: string
  reportedOn: string
  actionToBeTakenOn: string
  attachmentName: string | null
  initiatedBy: string
  initiatedOn: string
  status: DisciplinaryStatus
  approvals: ApprovalStep[]
  exitHandoff: ExitHandoff | null
  /** Case activity trail — initiate, approvals, letters, handoffs. */
  history?: DisciplinaryHistoryEntry[]
}

/**
 * Statuses that count as an "open" disciplinary case. While an employee has
 * one, their probation confirmation is gated (Confirm blocked, Extend still
 * available) until the case is resolved.
 */
export const OPEN_DISCIPLINARY_STATUSES: DisciplinaryStatus[] = [
  'pending-approval',
  'approved',
  'counselling-in-progress',
]

/** The first open disciplinary case for an employee, if any. */
export function openDisciplinaryCaseFor(
  employeeName: string,
  cases: DisciplinaryCase[]
): DisciplinaryCase | null {
  return (
    cases.find(
      (c) =>
        c.employeeName === employeeName &&
        OPEN_DISCIPLINARY_STATUSES.includes(c.status)
    ) ?? null
  )
}

export const COUNSELLING_OUTCOMES = ['No Action', 'Termination'] as const

export type CounsellingOutcome = (typeof COUNSELLING_OUTCOMES)[number]

/**
 * A counselling engagement tracked against an approved 'Counselling' case.
 * The session itself happens offline between the counselor and the employee —
 * only scheduling details and the final outcome are recorded here.
 */
export interface CounsellingRecord {
  id: string
  caseId: string
  employees: string
  location: string
  department: string
  position: string
  startDate: string
  endDate: string
  /** "Counselling On" — the topic of the engagement. */
  topic: string
  notes: string
  status: 'in-progress' | 'completed'
  outcome: CounsellingOutcome | null
  outcomeComments: string | null
  initiatedBy: string
  initiatedOn: string
  completedOn: string | null
}

export const seedDisciplinary: DisciplinaryCase[] = [
  {
    id: 'dsc-5001',
    employeeName: 'Nikhil Joshi',
    employeeCode: 'EMP-2333',
    department: 'Engineering',
    location: 'Hyderabad',
    actionType: 'Warning Letter',
    policyDeviated: 'Attendance Policy',
    reason: 'Repeated late submissions of timesheets after two reminders.',
    reportedBy: 'Vikram Shah',
    reportedOn: '2026-06-03',
    actionToBeTakenOn: '2026-06-10',
    attachmentName: 'timesheet-audit-may.pdf',
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-05',
    status: 'letter-issued',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-06-07',
        note: null,
      },
    ],
    exitHandoff: null,
  },
  {
    id: 'dsc-5002',
    employeeName: 'Sara Ali',
    employeeCode: 'EMP-2322',
    department: 'Sales',
    location: 'Pune',
    actionType: 'Show-Cause Notice',
    policyDeviated: 'Attendance Policy',
    reason: 'Unapproved absence for three consecutive days.',
    reportedBy: 'Carlos Mendes',
    reportedOn: '2026-06-18',
    actionToBeTakenOn: '2026-06-26',
    attachmentName: null,
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-20',
    status: 'pending-approval',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Elena Petrova',
        status: 'pending',
        actedOn: null,
        note: null,
      },
    ],
    exitHandoff: null,
  },
  {
    id: 'dsc-5003',
    employeeName: 'Harold Kim',
    employeeCode: 'EMP-2385',
    department: 'Engineering',
    location: 'Hyderabad',
    actionType: 'Verbal Warning',
    policyDeviated: 'Code of Conduct',
    reason: 'Code of conduct reminder after client call escalation.',
    reportedBy: 'Vikram Shah',
    reportedOn: '2026-05-14',
    actionToBeTakenOn: '2026-05-20',
    attachmentName: null,
    initiatedBy: 'Vikram Shah',
    initiatedOn: '2026-05-15',
    status: 'approved',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-05-16',
        note: null,
      },
    ],
    exitHandoff: null,
    history: [
      {
        id: 'dh-5003-1',
        date: '2026-05-15',
        text: 'Case initiated by Vikram Shah and routed to the location approver.',
      },
      {
        id: 'dh-5003-2',
        date: '2026-05-16',
        text: 'Approved by Vikram Shah (Location Approver) — verbal warning to be delivered.',
      },
      {
        id: 'dh-5003-3',
        date: '2026-05-16',
        text: 'Open case is gating this employee’s probation confirmation until resolved.',
      },
    ],
  },
  {
    id: 'dsc-5004',
    employeeName: 'Tomás Silva',
    employeeCode: 'EMP-2416',
    department: 'IT Support',
    location: 'Pune',
    actionType: 'Warning Letter',
    policyDeviated: 'Data Security Policy',
    reason: 'Security policy breach — shared admin credentials.',
    reportedBy: 'Elena Petrova',
    reportedOn: '2026-06-22',
    actionToBeTakenOn: '2026-06-30',
    attachmentName: 'access-log-extract.xlsx',
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-24',
    status: 'rejected',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Elena Petrova',
        status: 'rejected',
        actedOn: '2026-06-25',
        note: 'Insufficient evidence; retrain instead.',
      },
    ],
    exitHandoff: null,
  },
  {
    id: 'dsc-5005',
    employeeName: 'Priya Nair',
    employeeCode: 'EMP-2402',
    department: 'Operations',
    location: 'Bengaluru',
    actionType: 'Counselling',
    policyDeviated: 'Code of Conduct',
    reason: 'Repeated friction with peers during shift handovers.',
    reportedBy: 'Sunil Patil',
    reportedOn: '2026-06-25',
    actionToBeTakenOn: '2026-07-06',
    attachmentName: 'shift-handover-notes.docx',
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-26',
    status: 'approved',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Elena Petrova',
        status: 'approved',
        actedOn: '2026-06-28',
        note: null,
      },
    ],
    exitHandoff: null,
  },
  {
    id: 'dsc-5006',
    employeeName: 'Imran Khan',
    employeeCode: 'EMP-2255',
    department: 'Operations',
    location: 'Hyderabad',
    actionType: 'Suspension',
    policyDeviated: 'Code of Conduct',
    reason:
      'Warehouse stock discrepancies traced to unlogged dispatches on his shift; suspension pending inquiry.',
    reportedBy: 'Sunil Patil',
    reportedOn: '2026-06-28',
    actionToBeTakenOn: '2026-07-10',
    attachmentName: 'stock-audit-june.pdf',
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-30',
    status: 'approved',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-07-02',
        note: 'Suspend pending inquiry outcome.',
      },
    ],
    exitHandoff: {
      process: 'Suspension',
      triggeredOn: '2026-07-02',
      exitId: 'ext-4007',
    },
    history: [
      {
        id: 'dh-5006-1',
        date: '2026-06-30',
        text: 'Case initiated by Anita Desai and routed to the location approver.',
      },
      {
        id: 'dh-5006-2',
        date: '2026-07-02',
        text: 'Approved by Vikram Shah (Location Approver).',
      },
      {
        id: 'dh-5006-3',
        date: '2026-07-02',
        text: 'Severe outcome — Suspension case handed to the Exit Coordinator. Exit case ext-4007 opened and linked back to this record.',
      },
    ],
  },
]

export const seedCounselling: CounsellingRecord[] = []
