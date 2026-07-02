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
  },
]

export type PeerReviewStatus = 'Pending Approval' | 'Submitted'

export interface PeerReview {
  id: string
  employeeName: string
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
    reviewer: 'Rohan Verma',
    requestedBy: 'Anita Desai',
    reviewDate: '2026-07-03',
    status: 'Pending Approval',
    feedback: null,
  },
  {
    id: 'peer-02',
    employeeName: 'Ishaan Gupta',
    reviewer: 'Kavya Menon',
    requestedBy: 'Anita Desai',
    reviewDate: '2026-07-03',
    status: 'Submitted',
    feedback: 'Reliable teammate, picks up review comments quickly.',
  },
  {
    id: 'peer-03',
    employeeName: 'Meghna Iyer',
    reviewer: 'Arjun Rao',
    requestedBy: 'Carlos Mendes',
    reviewDate: '2026-06-20',
    status: 'Submitted',
    feedback: 'Great client handling on the Q2 renewals.',
  },
  {
    id: 'peer-04',
    employeeName: 'Peter Novak',
    reviewer: 'Rohan Verma',
    requestedBy: 'Elena Petrova',
    reviewDate: '2026-07-10',
    status: 'Pending Approval',
    feedback: null,
  },
  {
    id: 'peer-05',
    employeeName: 'Harold Kim',
    reviewer: 'Grace Obi',
    requestedBy: 'Anita Desai',
    reviewDate: '2026-07-15',
    status: 'Pending Approval',
    feedback: null,
  },
]

export type PeriodicReviewStatus = 'Active' | 'Submitted'

export interface PeriodicReview {
  id: string
  employeeName: string
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
    employeeCode: 'EMP-2350',
    department: 'Finance',
    positionLevel: 'L1 - Associate',
    manager: 'Elena Petrova',
    periodFrom: '2026-06-01',
    periodTo: '2026-07-01',
    status: 'Active',
    notes: null,
  },
]
