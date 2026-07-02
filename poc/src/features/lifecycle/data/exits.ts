import { makeSteps, type ApprovalStep } from './shared'

/** Exit management — requests, approvals, notice period, parallel clearance. */

export type ExitStatus =
  | 'pending-approval'
  | 'approved'
  | 'clearance-in-progress'
  | 'finalized'
  | 'rejected'

export type ClearanceStatus = 'pending' | 'cleared' | 'rejected'

export interface ClearanceItem {
  functionName: string
  owner: string
  status: ClearanceStatus
  note: string | null
}

export interface ExitTaskItem {
  id: string
  name: string
  owner: string
  /** LWD-relative label, e.g. "Before LWD - 3 Day(s)". */
  due: string
  done: boolean
}

export interface QuestionnaireAnswer {
  questionId: string
  question: string
  responder: string
  mandatory: boolean
  answer: string | null
}

export interface ExitCase {
  id: string
  employeeName: string
  employeeCode: string
  department: string
  location: string
  positionLevel: string
  exitType: string
  reason: string
  requestedOn: string
  lastWorkingDay: string
  noticePeriodDays: number
  status: ExitStatus
  approvals: ApprovalStep[]
  clearances: ClearanceItem[]
  tasks: ExitTaskItem[]
  questionnaire: QuestionnaireAnswer[]
  questionnaireSubmitted: boolean
  raisedBy: 'Employee' | 'Admin (proxy)'
}

export const EXIT_CHAIN = [
  { role: 'Manager', approver: 'Vikram Shah' },
  { role: 'HR', approver: 'Anita Desai' },
]

export const DEFAULT_CLEARANCES: Omit<ClearanceItem, 'status' | 'note'>[] = [
  { functionName: 'IT', owner: 'Tomás Silva' },
  { functionName: 'Finance', owner: 'Kavya Menon' },
  { functionName: 'HR', owner: 'Anita Desai' },
  { functionName: 'Admin', owner: 'Sunil Patil' },
]

const pendingClearances = (): ClearanceItem[] =>
  DEFAULT_CLEARANCES.map((c) => ({ ...c, status: 'pending', note: null }))

export const seedExits: ExitCase[] = [
  {
    id: 'ext-4001',
    employeeName: 'Dev Malhotra',
    employeeCode: 'EMP-2350',
    department: 'Finance',
    location: 'Bengaluru',
    positionLevel: 'L1 - Associate',
    exitType: 'Resignation',
    reason: 'Higher studies.',
    requestedOn: '2026-06-10',
    lastWorkingDay: '2026-08-09',
    noticePeriodDays: 60,
    status: 'clearance-in-progress',
    approvals: EXIT_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-06-14',
      note: null,
    })),
    clearances: [
      { functionName: 'IT', owner: 'Tomás Silva', status: 'cleared', note: 'Laptop returned.' },
      { functionName: 'Finance', owner: 'Kavya Menon', status: 'pending', note: null },
      { functionName: 'HR', owner: 'Anita Desai', status: 'cleared', note: null },
      { functionName: 'Admin', owner: 'Sunil Patil', status: 'pending', note: null },
    ],
    tasks: [
      { id: 't1', name: 'Knowledge transfer sessions', owner: 'Reporting Manager', due: 'Before LWD - 15 Day(s)', done: true },
      { id: 't2', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: false },
      { id: 't3', name: 'Full & final settlement input', owner: 'Finance', due: 'After LWD - 7 Day(s)', done: false },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: 'Pursuing a masters program.' },
      { questionId: 'q2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: 'Yes' },
      { questionId: 'q3', question: 'Any feedback for your manager or team?', responder: 'Employee', mandatory: false, answer: null },
    ],
    questionnaireSubmitted: false,
    raisedBy: 'Employee',
  },
  {
    id: 'ext-4002',
    employeeName: 'Ritika Bansal',
    employeeCode: 'EMP-2290',
    department: 'Human Resources',
    location: 'Bengaluru',
    positionLevel: 'L2 - Senior',
    exitType: 'Probation Separation',
    reason: 'Probation outcome: Initiate Separation.',
    requestedOn: '2026-04-18',
    lastWorkingDay: '2026-05-18',
    noticePeriodDays: 30,
    status: 'finalized',
    approvals: EXIT_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-04-20',
      note: null,
    })),
    clearances: DEFAULT_CLEARANCES.map((c) => ({
      ...c,
      status: 'cleared' as const,
      note: null,
    })),
    tasks: [
      { id: 't1', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: true },
      { id: 't2', name: 'Issue relieving letter', owner: 'HR', due: 'After LWD - 3 Day(s)', done: true },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: 'Separation initiated by company.' },
      { questionId: 'q2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: 'Maybe' },
    ],
    questionnaireSubmitted: true,
    raisedBy: 'Admin (proxy)',
  },
  {
    id: 'ext-4003',
    employeeName: 'Carlos Mendes',
    employeeCode: 'EMP-2211',
    department: 'Sales',
    location: 'Austin',
    positionLevel: 'L4 - Manager',
    exitType: 'Resignation',
    reason: 'Offer from a competitor.',
    requestedOn: '2026-06-22',
    lastWorkingDay: '2026-09-20',
    noticePeriodDays: 90,
    status: 'pending-approval',
    approvals: makeSteps(EXIT_CHAIN),
    clearances: pendingClearances(),
    tasks: [
      { id: 't1', name: 'Pipeline handover to successor', owner: 'Reporting Manager', due: 'Before LWD - 30 Day(s)', done: false },
      { id: 't2', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: false },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: null },
      { questionId: 'q2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: null },
      { questionId: 'q3', question: 'Any feedback for your manager or team?', responder: 'Employee', mandatory: false, answer: null },
    ],
    questionnaireSubmitted: false,
    raisedBy: 'Employee',
  },
  {
    id: 'ext-4004',
    employeeName: 'Uma Pillai',
    employeeCode: 'EMP-2140',
    department: 'Operations',
    location: 'Pune',
    positionLevel: 'L3 - Lead',
    exitType: 'Retirement',
    reason: 'Superannuation.',
    requestedOn: '2026-05-02',
    lastWorkingDay: '2026-07-31',
    noticePeriodDays: 90,
    status: 'approved',
    approvals: EXIT_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-05-06',
      note: null,
    })),
    clearances: pendingClearances(),
    tasks: [
      { id: 't1', name: 'Gratuity computation input', owner: 'Finance', due: 'Before LWD - 15 Day(s)', done: false },
      { id: 't2', name: 'Farewell & memento', owner: 'Admin', due: 'Before LWD - 1 Day(s)', done: false },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: null },
    ],
    questionnaireSubmitted: false,
    raisedBy: 'Admin (proxy)',
  },
  {
    id: 'ext-4005',
    employeeName: 'Nikhil Joshi',
    employeeCode: 'EMP-2333',
    department: 'Engineering',
    location: 'Hyderabad',
    positionLevel: 'L2 - Senior',
    exitType: 'Resignation',
    reason: 'Relocation abroad.',
    requestedOn: '2026-06-01',
    lastWorkingDay: '2026-07-31',
    noticePeriodDays: 60,
    status: 'rejected',
    approvals: [
      {
        role: 'Manager',
        approver: 'Vikram Shah',
        status: 'rejected',
        actedOn: '2026-06-03',
        note: 'Asked to discuss retention offer first.',
      },
      { role: 'HR', approver: 'Anita Desai', status: 'pending', actedOn: null, note: null },
    ],
    clearances: pendingClearances(),
    tasks: [],
    questionnaire: [],
    questionnaireSubmitted: false,
    raisedBy: 'Employee',
  },
]
