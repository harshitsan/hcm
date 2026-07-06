/**
 * Leave requests (LVE-03) with workflow steps (LVE-04), tentative flag
 * (LVE-30), notify-peers (LVE-31), loss-of-pay portions (LVE-32), FMLA
 * routing (LVE-37/38) and partial-day support (LVE-49).
 */

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'cancellation-requested'
  | 'cancelled'

export type StepMode = 'sequential' | 'parallel'

export interface ApprovalStep {
  level: number
  name: string
  approver: string
  mode: StepMode
  /** For parallel levels: whether all approvers or any single one completes it. */
  rule: 'all' | 'any'
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  actedBy: string | null
  actedOn: string | null
  note: string | null
  /** Set when a delegate acted on behalf of the primary approver (LVE-05). */
  delegatedFrom: string | null
  /** Set when SLA escalation reassigned this step (LVE-06). */
  escalated: boolean
  slaHours: number
}

export interface HistoryEntry {
  at: string
  actor: string
  action: string
  detail: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  department: string
  location: string
  typeId: string
  typeName: string
  unit: 'days' | 'hours'
  from: string
  to: string
  fromTime: string | null
  toTime: string | null
  /** Requested amount in the type's tracking unit. */
  amount: number
  /** Days recorded as loss of pay because the balance was exceeded (LVE-32). */
  lopAmount: number
  reason: string
  tentative: boolean
  tentativeReason: string | null
  notifyPeers: string[]
  notifyEmails: string[]
  fmla: boolean
  fmlaQualifyingReason: string | null
  fmlaRejectionReason: string | null
  status: RequestStatus
  steps: ApprovalStep[]
  submittedOn: string
  /** Admin who recorded this on behalf of a non-user employee (LVE-17). */
  onBehalfOf: string | null
  history: HistoryEntry[]
}

export function pendingStep(steps: ApprovalStep[]): ApprovalStep | undefined {
  return steps.find((s) => s.status === 'pending')
}

function step(
  level: number,
  name: string,
  approver: string,
  overrides: Partial<ApprovalStep> = {}
): ApprovalStep {
  return {
    level,
    name,
    approver,
    mode: 'sequential',
    rule: 'all',
    status: 'pending',
    actedBy: null,
    actedOn: null,
    note: null,
    delegatedFrom: null,
    escalated: false,
    slaHours: 48,
    ...overrides,
  }
}

export const seedRequests: LeaveRequest[] = [
  {
    id: 'lr-2001',
    employeeId: 'emp-1001',
    employeeName: 'Ananya Sharma',
    employeeCode: 'STI-0142',
    department: 'Engineering',
    location: 'Hyderabad',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    unit: 'days',
    from: '2026-07-20',
    to: '2026-07-24',
    fromTime: null,
    toTime: null,
    amount: 5,
    lopAmount: 0,
    reason: 'Family trip to Coorg.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: ['Priya Iyer'],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'pending',
    steps: [
      step(1, 'Reporting Manager', 'Rahul Menon'),
      step(2, 'HR Partner', 'Sunita Patil', { mode: 'parallel', rule: 'any' }),
    ],
    submittedOn: '2026-06-28',
    onBehalfOf: null,
    history: [
      {
        at: '2026-06-28T09:12:00Z',
        actor: 'Ananya Sharma',
        action: 'Submitted',
        detail: 'Routed to Reporting Manager (sequential level 1).',
      },
    ],
  },
  {
    id: 'lr-2002',
    employeeId: 'emp-1003',
    employeeName: 'Priya Iyer',
    employeeCode: 'STI-0233',
    department: 'Engineering',
    location: 'Hyderabad',
    typeId: 'lt-sick',
    typeName: 'Sick / Medical Leave',
    unit: 'hours',
    from: '2026-07-06',
    to: '2026-07-06',
    fromTime: '09:00',
    toTime: '13:00',
    amount: 4,
    lopAmount: 0,
    reason: 'Dental procedure — half day.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'pending',
    steps: [step(1, 'Reporting Manager', 'Ananya Sharma')],
    submittedOn: '2026-07-01',
    onBehalfOf: null,
    history: [
      {
        at: '2026-07-01T07:40:00Z',
        actor: 'Priya Iyer',
        action: 'Submitted',
        detail: 'Partial-day request: 4 hours deducted from Sick balance.',
      },
    ],
  },
  {
    id: 'lr-2003',
    employeeId: 'emp-1004',
    employeeName: 'Vikram Rao',
    employeeCode: 'STI-0250',
    department: 'Engineering',
    location: 'Bengaluru',
    typeId: 'lt-casual',
    typeName: 'Casual Leave',
    unit: 'days',
    from: '2026-07-10',
    to: '2026-07-14',
    fromTime: null,
    toTime: null,
    amount: 3,
    lopAmount: 2,
    reason: 'Cousin’s wedding — balance short by 2 days, proceeding on LOP.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: ['Ananya Sharma'],
    notifyEmails: ['events@familywedding.in'],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'pending',
    steps: [
      step(1, 'Reporting Manager', 'Ananya Sharma'),
      step(2, 'Loss-of-Pay Approver', 'Sunita Patil'),
    ],
    submittedOn: '2026-06-25',
    onBehalfOf: null,
    history: [
      {
        at: '2026-06-25T11:03:00Z',
        actor: 'Vikram Rao',
        action: 'Submitted',
        detail:
          'Requested 5 days with 3 available — confirmed 2 days as loss of pay. Routed to LOP approver.',
      },
    ],
  },
  {
    id: 'lr-2004',
    employeeId: 'emp-1005',
    employeeName: 'Meera Krishnan',
    employeeCode: 'STI-0261',
    department: 'Engineering',
    location: 'Chennai',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    unit: 'days',
    from: '2026-08-03',
    to: '2026-08-07',
    fromTime: null,
    toTime: null,
    amount: 5,
    lopAmount: 0,
    reason: 'Might attend a training in Singapore — dates not final.',
    tentative: true,
    tentativeReason: 'Visa appointment not yet confirmed.',
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'pending',
    steps: [step(1, 'Reporting Manager', 'Ananya Sharma')],
    submittedOn: '2026-06-30',
    onBehalfOf: null,
    history: [
      {
        at: '2026-06-30T08:00:00Z',
        actor: 'Meera Krishnan',
        action: 'Submitted (tentative)',
        detail: 'Marked tentative: “Visa appointment not yet confirmed.”',
      },
    ],
  },
  {
    id: 'lr-2005',
    employeeId: 'emp-1006',
    employeeName: 'Jordan Blake',
    employeeCode: 'STU-0034',
    department: 'Sales',
    location: 'Austin',
    typeId: 'lt-fmla',
    typeName: 'FMLA Leave',
    unit: 'hours',
    from: '2026-07-13',
    to: '2026-07-31',
    fromTime: null,
    toTime: null,
    amount: 120,
    lopAmount: 0,
    reason: 'Care for spouse post-surgery.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: true,
    fmlaQualifyingReason: 'Care for spouse with a serious health condition',
    fmlaRejectionReason: null,
    status: 'pending',
    steps: [step(1, 'FMLA Approver (Austin)', 'Dana Willis', { slaHours: 72 })],
    submittedOn: '2026-06-29',
    onBehalfOf: null,
    history: [
      {
        at: '2026-06-29T15:30:00Z',
        actor: 'Jordan Blake',
        action: 'Submitted (FMLA)',
        detail: 'Routed to the FMLA approver configured for Austin.',
      },
    ],
  },
  {
    id: 'lr-2006',
    employeeId: 'emp-1001',
    employeeName: 'Ananya Sharma',
    employeeCode: 'STI-0142',
    department: 'Engineering',
    location: 'Hyderabad',
    typeId: 'lt-casual',
    typeName: 'Casual Leave',
    unit: 'days',
    from: '2026-06-12',
    to: '2026-06-12',
    fromTime: null,
    toTime: null,
    amount: 1,
    lopAmount: 0,
    reason: 'School admission visit.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'approved',
    steps: [
      step(1, 'Reporting Manager', 'Rahul Menon', {
        status: 'approved',
        actedBy: 'Rahul Menon',
        actedOn: '2026-06-10',
      }),
    ],
    submittedOn: '2026-06-09',
    onBehalfOf: null,
    history: [
      {
        at: '2026-06-09T10:00:00Z',
        actor: 'Ananya Sharma',
        action: 'Submitted',
        detail: 'Routed to Reporting Manager.',
      },
      {
        at: '2026-06-10T09:20:00Z',
        actor: 'Rahul Menon',
        action: 'Approved',
        detail: 'Level 1 approved — request finalized, 1 day deducted.',
      },
    ],
  },
  {
    id: 'lr-2007',
    employeeId: 'emp-1001',
    employeeName: 'Ananya Sharma',
    employeeCode: 'STI-0142',
    department: 'Engineering',
    location: 'Hyderabad',
    typeId: 'lt-compoff',
    typeName: 'Compensatory-off (Comp-off)',
    unit: 'days',
    from: '2026-08-14',
    to: '2026-08-14',
    fromTime: null,
    toTime: null,
    amount: 1,
    lopAmount: 0,
    reason: 'Comp-off for the July release weekend on-call.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'approved',
    steps: [
      step(1, 'Reporting Manager', 'Rahul Menon', {
        status: 'approved',
        actedBy: 'Sunita Patil (delegate)',
        actedOn: '2026-06-20',
        delegatedFrom: 'Rahul Menon',
      }),
    ],
    submittedOn: '2026-06-18',
    onBehalfOf: null,
    history: [
      {
        at: '2026-06-18T12:00:00Z',
        actor: 'Ananya Sharma',
        action: 'Submitted',
        detail: 'Validated against comp-off credit CO-3 (earned 2026-06-14).',
      },
      {
        at: '2026-06-20T09:05:00Z',
        actor: 'Sunita Patil',
        action: 'Approved (as delegate)',
        detail: 'Acted on behalf of Rahul Menon under active delegation.',
      },
    ],
  },
  {
    id: 'lr-2008',
    employeeId: 'emp-1008',
    employeeName: 'Ravi Naik',
    employeeCode: 'OSV-0412',
    department: 'Operations',
    location: 'Chennai',
    typeId: 'lt-sick',
    typeName: 'Sick / Medical Leave',
    unit: 'hours',
    from: '2026-06-22',
    to: '2026-06-23',
    fromTime: null,
    toTime: null,
    amount: 16,
    lopAmount: 0,
    reason: 'Fever — reported via shift supervisor.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'approved',
    steps: [
      step(1, 'Reporting Manager', 'Ananya Sharma', {
        status: 'approved',
        actedBy: 'Ananya Sharma',
        actedOn: '2026-06-23',
      }),
    ],
    submittedOn: '2026-06-22',
    onBehalfOf: 'Sunita Patil (HR)',
    history: [
      {
        at: '2026-06-22T06:45:00Z',
        actor: 'Sunita Patil',
        action: 'Recorded on behalf',
        detail:
          'Employee (Non-User) has no portal access — leave recorded against his profile and balance.',
      },
      {
        at: '2026-06-23T10:15:00Z',
        actor: 'Ananya Sharma',
        action: 'Approved',
        detail: '16 hours deducted from Sick balance.',
      },
    ],
  },
  {
    id: 'lr-2009',
    employeeId: 'emp-1003',
    employeeName: 'Priya Iyer',
    employeeCode: 'STI-0233',
    department: 'Engineering',
    location: 'Hyderabad',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    unit: 'days',
    from: '2026-05-18',
    to: '2026-05-22',
    fromTime: null,
    toTime: null,
    amount: 5,
    lopAmount: 0,
    reason: 'Europe trip.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'rejected',
    steps: [
      step(1, 'Reporting Manager', 'Ananya Sharma', {
        status: 'rejected',
        actedBy: 'Ananya Sharma',
        actedOn: '2026-05-02',
        note: 'Release week — please shift by one week.',
      }),
    ],
    submittedOn: '2026-04-30',
    onBehalfOf: null,
    history: [
      {
        at: '2026-04-30T09:00:00Z',
        actor: 'Priya Iyer',
        action: 'Submitted',
        detail: 'Routed to Reporting Manager.',
      },
      {
        at: '2026-05-02T14:00:00Z',
        actor: 'Ananya Sharma',
        action: 'Rejected',
        detail: 'Reason: “Release week — please shift by one week.” Balance restored.',
      },
    ],
  },
  {
    id: 'lr-2010',
    employeeId: 'emp-1007',
    employeeName: 'Sunita Patil',
    employeeCode: 'STI-0301',
    department: 'Human Resources',
    location: 'Hyderabad',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    unit: 'days',
    from: '2026-07-27',
    to: '2026-07-31',
    fromTime: null,
    toTime: null,
    amount: 5,
    lopAmount: 0,
    reason: 'Annual family vacation.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'pending',
    steps: [
      step(1, 'Reporting Manager', 'Rahul Menon', {
        escalated: true,
        approver: 'Escalation: Dept Head',
        slaHours: 48,
      }),
    ],
    submittedOn: '2026-06-20',
    onBehalfOf: null,
    history: [
      {
        at: '2026-06-20T09:00:00Z',
        actor: 'Sunita Patil',
        action: 'Submitted',
        detail: 'Routed to Reporting Manager.',
      },
      {
        at: '2026-06-23T09:00:00Z',
        actor: 'Workflow Engine',
        action: 'SLA escalation',
        detail:
          '48h SLA breached with no action — reassigned to the designated escalation approver.',
      },
    ],
  },
  // Historical request from an inactive (exited) employee — surfaces only
  // when the active/inactive toggle includes former employees (ETOR-05).
  {
    id: 'lr-2011',
    employeeId: 'emp-1011',
    employeeName: 'Deepak Kulkarni',
    employeeCode: 'STI-0188',
    department: 'Engineering',
    location: 'Hyderabad',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    unit: 'days',
    from: '2026-04-13',
    to: '2026-04-17',
    fromTime: null,
    toTime: null,
    amount: 5,
    lopAmount: 0,
    reason: 'Relocation and notice-period wrap-up.',
    tentative: false,
    tentativeReason: null,
    notifyPeers: [],
    notifyEmails: [],
    fmla: false,
    fmlaQualifyingReason: null,
    fmlaRejectionReason: null,
    status: 'approved',
    steps: [
      step(1, 'Reporting Manager', 'Ananya Sharma', {
        status: 'approved',
        actedBy: 'Ananya Sharma',
        actedOn: '2026-04-06',
        note: 'Approved — final leave before exit on 2026-05-15.',
      }),
    ],
    submittedOn: '2026-04-03',
    onBehalfOf: null,
    history: [
      {
        at: '2026-04-03T10:00:00Z',
        actor: 'Deepak Kulkarni',
        action: 'Submitted',
        detail: 'Routed to Reporting Manager.',
      },
      {
        at: '2026-04-06T09:30:00Z',
        actor: 'Ananya Sharma',
        action: 'Approved',
        detail: '5 days deducted from Privileged balance. Employee exited 2026-05-15.',
      },
    ],
  },
]
