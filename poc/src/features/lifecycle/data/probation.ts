import { makeSteps, type ApprovalStep } from './shared'

/** Probation confirmation, peer reviews and periodic (mid-probation) reviews. */

export const PROBATION_OUTCOMES = [
  'Confirm',
  'Extend',
  'Initiate Separation',
] as const

export type ProbationOutcome = (typeof PROBATION_OUTCOMES)[number]

export type ProbationStatus =
  | 'pending'
  | 'in-review'
  | 'pending-approval'
  | 'confirmed'
  | 'extended'
  | 'separation-initiated'

export interface ProbationCriterion {
  id: string
  label: string
  /** 1–5, null until evaluated. */
  score: number | null
}

/** Display-only D6 note attached to outcomes with a pay implication. */
export const D6_NOTE =
  'Pay implication forwarded to payroll computation (D6) — computation out of scope in this POC'

export interface ProbationHistoryEntry {
  id: string
  date: string
  text: string
  /** True for the display-only “Payroll notified” (D6) line items. */
  payroll?: boolean
}

/**
 * Employment status chip derived from the confirmation outcome:
 * Probation / Confirmed / Probation Extended / Separation Initiated.
 */
export function employmentStatus(c: ProbationCase) {
  if (c.status === 'confirmed') return 'confirmed'
  if (c.status === 'extended') return 'probation-extended'
  if (c.status === 'separation-initiated') return 'separation-initiated'
  return 'probation'
}

export interface ProbationCase {
  id: string
  employeeName: string
  employeeCode: string
  employeeClass: string
  department: string
  positionLevel: string
  manager: string
  joinDate: string
  dueDate: string
  status: ProbationStatus
  criteria: ProbationCriterion[]
  decision: ProbationOutcome | null
  /** Ordered Manager → Department Head → HR chain. */
  approvals: ApprovalStep[]
  extendedTo: string | null
  decisionTableVersion: string
  /** Extension length chosen with the Extend outcome (1–3 months). */
  extensionMonths: number | null
  /** Reason captured with the Extend / Initiate Separation outcome. */
  outcomeReason: string | null
  /** Date the employee was confirmed — drives “Confirmed this quarter”. */
  confirmedOn: string | null
  /** Record timeline, including display-only “Payroll notified” (D6) lines. */
  history: ProbationHistoryEntry[]
}

export const PROBATION_CHAIN = [
  { role: 'Manager', approver: 'Vikram Shah' },
  { role: 'Department Head', approver: 'Elena Petrova' },
  { role: 'HR', approver: 'Anita Desai' },
]

const criteria = (scores: (number | null)[]): ProbationCriterion[] =>
  [
    'Quality of work',
    'Attendance & punctuality',
    'Team collaboration',
    'Learning & adaptability',
  ].map((label, i) => ({ id: `c${i + 1}`, label, score: scores[i] ?? null }))

export const seedProbation: ProbationCase[] = [
  {
    id: 'prb-2001',
    employeeName: 'Ishaan Gupta',
    employeeCode: 'EMP-2381',
    employeeClass: 'Full-time',
    department: 'Engineering',
    positionLevel: 'L1 - Associate',
    manager: 'Vikram Shah',
    joinDate: '2026-01-05',
    dueDate: '2026-07-05',
    status: 'in-review',
    criteria: criteria([4, 5, null, null]),
    decision: null,
    approvals: makeSteps(PROBATION_CHAIN),
    extendedTo: null,
    decisionTableVersion: 'v3',
    extensionMonths: null,
    outcomeReason: null,
    confirmedOn: null,
    history: [
      {
        id: 'h-2001-1',
        date: '2026-06-20',
        text: 'Confirmation review initiated — evaluation opened against decision table v3.',
      },
    ],
  },
  {
    id: 'prb-2002',
    employeeName: 'Meghna Iyer',
    employeeCode: 'EMP-2374',
    employeeClass: 'Full-time',
    department: 'Sales',
    positionLevel: 'L2 - Senior',
    manager: 'Carlos Mendes',
    joinDate: '2026-01-12',
    dueDate: '2026-07-12',
    status: 'pending-approval',
    criteria: criteria([5, 4, 5, 4]),
    decision: 'Confirm',
    approvals: [
      {
        role: 'Manager',
        approver: 'Carlos Mendes',
        status: 'approved',
        actedOn: '2026-06-24',
        note: 'Strong quarter.',
      },
      ...makeSteps(PROBATION_CHAIN.slice(1)),
    ],
    extendedTo: null,
    decisionTableVersion: 'v3',
    extensionMonths: null,
    outcomeReason: null,
    confirmedOn: null,
    history: [
      {
        id: 'h-2002-1',
        date: '2026-06-18',
        text: 'Confirmation review initiated — evaluation opened against decision table v3.',
      },
      {
        id: 'h-2002-2',
        date: '2026-06-24',
        text: 'Decision “Confirm” submitted and routed for approval.',
      },
    ],
  },
  {
    id: 'prb-2003',
    employeeName: 'Dev Malhotra',
    employeeCode: 'EMP-2350',
    employeeClass: 'Full-time',
    department: 'Finance',
    positionLevel: 'L1 - Associate',
    manager: 'Elena Petrova',
    joinDate: '2025-12-01',
    dueDate: '2026-06-01',
    status: 'extended',
    criteria: criteria([null, null, null, null]),
    decision: 'Extend',
    approvals: PROBATION_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-05-28',
      note: null,
    })),
    extendedTo: '2026-09-01',
    decisionTableVersion: 'v2',
    extensionMonths: 3,
    outcomeReason:
      'Delivery pace improving but goals incomplete — extension recommended to finish the ramp-up plan.',
    confirmedOn: null,
    history: [
      {
        id: 'h-2003-1',
        date: '2026-05-20',
        text: 'Confirmation review initiated — evaluation opened against decision table v2.',
      },
      {
        id: 'h-2003-2',
        date: '2026-05-25',
        text: 'Decision “Extend” (3 months) submitted and routed for approval.',
      },
      {
        id: 'h-2003-3',
        date: '2026-05-28',
        text: 'Probation extended by 3 months — new probation end date 01 Sep 2026. Status stays Probation.',
      },
      {
        id: 'h-2003-4',
        date: '2026-05-28',
        text: `Payroll notified — ${D6_NOTE}.`,
        payroll: true,
      },
    ],
  },
  {
    id: 'prb-2004',
    employeeName: 'Sara Ali',
    employeeCode: 'EMP-2322',
    employeeClass: 'Contract',
    department: 'Operations',
    positionLevel: 'L1 - Associate',
    manager: 'Vikram Shah',
    joinDate: '2025-11-10',
    dueDate: '2026-05-10',
    status: 'confirmed',
    criteria: criteria([4, 4, 5, 5]),
    decision: 'Confirm',
    approvals: PROBATION_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-05-08',
      note: null,
    })),
    extendedTo: null,
    decisionTableVersion: 'v2',
    extensionMonths: null,
    outcomeReason: null,
    confirmedOn: '2026-05-08',
    history: [
      {
        id: 'h-2004-1',
        date: '2026-04-28',
        text: 'Confirmation review initiated — evaluation opened against decision table v2.',
      },
      {
        id: 'h-2004-2',
        date: '2026-05-05',
        text: 'Decision “Confirm” submitted and routed for approval.',
      },
      {
        id: 'h-2004-3',
        date: '2026-05-08',
        text: 'Employment status updated to Confirmed — Employee Confirmation letter queued.',
      },
      {
        id: 'h-2004-4',
        date: '2026-05-08',
        text: `Payroll notified — ${D6_NOTE}.`,
        payroll: true,
      },
    ],
  },
  {
    id: 'prb-2005',
    employeeName: 'Peter Novak',
    employeeCode: 'EMP-2308',
    employeeClass: 'Full-time',
    department: 'IT Support',
    positionLevel: 'L1 - Associate',
    manager: 'Elena Petrova',
    joinDate: '2025-12-15',
    dueDate: '2026-06-15',
    status: 'pending',
    criteria: criteria([null, null, null, null]),
    decision: null,
    approvals: makeSteps(PROBATION_CHAIN),
    extendedTo: null,
    decisionTableVersion: 'v3',
    extensionMonths: null,
    outcomeReason: null,
    confirmedOn: null,
    history: [],
  },
  {
    id: 'prb-2006',
    employeeName: 'Ritika Bansal',
    employeeCode: 'EMP-2290',
    employeeClass: 'Full-time',
    department: 'Human Resources',
    positionLevel: 'L2 - Senior',
    manager: 'Anita Desai',
    joinDate: '2025-10-20',
    dueDate: '2026-04-20',
    status: 'separation-initiated',
    criteria: criteria([2, 1, 2, 2]),
    decision: 'Initiate Separation',
    approvals: PROBATION_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-04-18',
      note: null,
    })),
    extendedTo: null,
    decisionTableVersion: 'v2',
    extensionMonths: null,
    outcomeReason:
      'Consistently low evaluation scores across all criteria despite coaching.',
    confirmedOn: null,
    history: [
      {
        id: 'h-2006-1',
        date: '2026-04-05',
        text: 'Confirmation review initiated — evaluation opened against decision table v2.',
      },
      {
        id: 'h-2006-2',
        date: '2026-04-12',
        text: 'Decision “Initiate Separation” submitted and routed for approval.',
      },
      {
        id: 'h-2006-3',
        date: '2026-04-18',
        text: 'Separation initiated — Probation Separation exit case opened and handed to the Exits workflow.',
      },
      {
        id: 'h-2006-4',
        date: '2026-04-18',
        text: `Payroll notified — ${D6_NOTE}.`,
        payroll: true,
      },
    ],
  },
  {
    id: 'prb-2007',
    employeeName: 'Harold Kim',
    employeeCode: 'EMP-2385',
    employeeClass: 'Full-time',
    department: 'Engineering',
    positionLevel: 'L2 - Senior',
    manager: 'Vikram Shah',
    joinDate: '2026-01-19',
    dueDate: '2026-07-19',
    status: 'pending',
    criteria: criteria([null, null, null, null]),
    decision: null,
    approvals: makeSteps(PROBATION_CHAIN),
    extendedTo: null,
    decisionTableVersion: 'v3',
    extensionMonths: null,
    outcomeReason: null,
    confirmedOn: null,
    history: [],
  },
]

export type PeerReviewStatus = 'Pending Approval' | 'Submitted'

export interface PeerReview {
  id: string
  employeeName: string
  /** Whether the reviewed employee is still on active rolls. */
  employeeActive: boolean
  reviewer: string
  requestedBy: string
  reviewDate: string
  status: PeerReviewStatus
  feedback: string | null
}

export const seedPeerReviews: PeerReview[] = [
  {
    id: 'peer-01',
    employeeName: 'Ishaan Gupta',
    employeeActive: true,
    reviewer: 'Rohan Verma',
    requestedBy: 'Anita Desai',
    reviewDate: '2026-07-03',
    status: 'Pending Approval',
    feedback: null,
  },
  {
    id: 'peer-02',
    employeeName: 'Ishaan Gupta',
    employeeActive: true,
    reviewer: 'Kavya Menon',
    requestedBy: 'Anita Desai',
    reviewDate: '2026-07-03',
    status: 'Submitted',
    feedback: 'Reliable teammate, picks up review comments quickly.',
  },
  {
    id: 'peer-03',
    employeeName: 'Meghna Iyer',
    employeeActive: true,
    reviewer: 'Arjun Rao',
    requestedBy: 'Carlos Mendes',
    reviewDate: '2026-06-20',
    status: 'Submitted',
    feedback: 'Great client handling on the Q2 renewals.',
  },
  {
    id: 'peer-04',
    employeeName: 'Peter Novak',
    employeeActive: true,
    reviewer: 'Rohan Verma',
    requestedBy: 'Elena Petrova',
    reviewDate: '2026-07-10',
    status: 'Pending Approval',
    feedback: null,
  },
  {
    id: 'peer-05',
    employeeName: 'Harold Kim',
    employeeActive: true,
    reviewer: 'Grace Obi',
    requestedBy: 'Anita Desai',
    reviewDate: '2026-07-15',
    status: 'Pending Approval',
    feedback: null,
  },
  {
    id: 'peer-06',
    employeeName: 'Ritika Bansal',
    employeeActive: false,
    reviewer: 'Kavya Menon',
    requestedBy: 'Anita Desai',
    reviewDate: '2026-04-10',
    status: 'Submitted',
    feedback: 'Feedback archived — employee separated during probation.',
  },
]

export type PeriodicReviewStatus = 'Active' | 'Submitted'

export interface PeriodicReview {
  id: string
  employeeName: string
  /** Whether the reviewed employee is still on active rolls. */
  employeeActive: boolean
  employeeCode: string
  department: string
  positionLevel: string
  manager: string
  periodFrom: string
  periodTo: string
  status: PeriodicReviewStatus
  notes: string | null
}

export const seedPeriodicReviews: PeriodicReview[] = [
  {
    id: 'per-01',
    employeeName: 'Ishaan Gupta',
    employeeActive: true,
    employeeCode: 'EMP-2381',
    department: 'Engineering',
    positionLevel: 'L1 - Associate',
    manager: 'Vikram Shah',
    periodFrom: '2026-04-01',
    periodTo: '2026-04-30',
    status: 'Submitted',
    notes: 'On track; needs deeper ownership of releases.',
  },
  {
    id: 'per-02',
    employeeName: 'Peter Novak',
    employeeActive: true,
    employeeCode: 'EMP-2308',
    department: 'IT Support',
    positionLevel: 'L1 - Associate',
    manager: 'Elena Petrova',
    periodFrom: '2026-03-15',
    periodTo: '2026-04-15',
    status: 'Submitted',
    notes: 'Ticket SLAs consistently met.',
  },
  {
    id: 'per-03',
    employeeName: 'Harold Kim',
    employeeActive: true,
    employeeCode: 'EMP-2385',
    department: 'Engineering',
    positionLevel: 'L2 - Senior',
    manager: 'Vikram Shah',
    periodFrom: '2026-04-19',
    periodTo: '2026-05-19',
    status: 'Active',
    notes: null,
  },
  {
    id: 'per-04',
    employeeName: 'Dev Malhotra',
    employeeActive: true,
    employeeCode: 'EMP-2350',
    department: 'Finance',
    positionLevel: 'L1 - Associate',
    manager: 'Elena Petrova',
    periodFrom: '2026-06-01',
    periodTo: '2026-07-01',
    status: 'Active',
    notes: null,
  },
  {
    id: 'per-05',
    employeeName: 'Ritika Bansal',
    employeeActive: false,
    employeeCode: 'EMP-2290',
    department: 'Human Resources',
    positionLevel: 'L2 - Senior',
    manager: 'Anita Desai',
    periodFrom: '2026-01-20',
    periodTo: '2026-02-20',
    status: 'Submitted',
    notes: 'Archived — employee separated during probation.',
  },
]
