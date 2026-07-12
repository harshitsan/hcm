import { makeSteps, type ApprovalStep } from './shared'
import { type DocumentCollectWhen } from './config'

/** Exit management — requests, approvals, notice period, parallel clearance. */

export type ExitStatus =
  | 'exit-enabled'
  | 'pending-approval'
  | 'approved'
  | 'clearance-in-progress'
  | 'finalized'
  | 'rejected'
  | 'disabled'
  | 'withdrawn'
  | 'closed'

export type ClearanceStatus = 'pending' | 'cleared' | 'rejected'

export interface ClearanceItem {
  functionName: string
  owner: string
  status: ClearanceStatus
  note: string | null
}

export type ExitTaskTiming = 'before-lwd' | 'after-exit-approval'

export type ExitTaskAssignMode = 'role' | 'reporting-manager' | 'position-level'

export interface ExitTaskItem {
  id: string
  name: string
  owner: string
  /** LWD-relative label, e.g. "Before LWD - 3 Day(s)". */
  due: string
  done: boolean
  description?: string
  timing?: ExitTaskTiming
  daysAfterApproval?: number | null
  assignedVia?: ExitTaskAssignMode
}

export interface QuestionnaireAnswer {
  questionId: string
  question: string
  responder: string
  mandatory: boolean
  answer: string | null
}

export type ExitConditionStatus = 'open' | 'closed' | 'not-required'

/** Condition an approver/RM attaches to the exit (e.g. handover items). */
export interface ExitCondition {
  id: string
  description: string
  dueDate: string
  status: ExitConditionStatus
  addedBy: string
  addedOn: string
}

/** "Need clarification" entry — who asked whom, and the eventual reply. */
export interface ExitClarification {
  id: string
  askedBy: string
  askedTo: string
  question: string
  askedOn: string
  reply: string | null
  repliedOn: string | null
}

/** LWD an approver recommends at their step; the final approver's wins. */
export interface ExitLwdRecommendation {
  role: string
  approver: string
  lwd: string
  on: string
}

/** Supporting document uploaded onto the case (file-name entry only). */
export interface ExitCaseDocument {
  id: string
  name: string
  uploadedBy: string
  uploadedOn: string
}

/** Document HR tracks for collection from the employee. */
export interface ExitTrackedDocument {
  id: string
  name: string
  collectWhen: DocumentCollectWhen
  status: 'pending' | 'submitted'
}

export type ExitCommentVisibility = 'everyone' | 'hr-managers'

export interface ExitComment {
  id: string
  author: string
  text: string
  visibility: ExitCommentVisibility
  on: string
}

export type SuspensionReviewOutcome = 'revoked' | 'continued' | 'terminated'

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
  /* --- Enable-exit / resignation form (all additive) --- */
  /** Resignation date captured by the exit coordinator (backdatable). */
  resignationDate?: string | null
  /** Resignation date + notice days. */
  defaultLwd?: string | null
  /** "LWD as per policy" shown on the Enable Exit form (display-only). */
  policyLwd?: string | null
  /** LWD the employee requested (modifiable on the resignation form). */
  requestedLwd?: string | null
  /** Final LWD once the approval chain completes. */
  approvedLwd?: string | null
  /** True once the employee submitted the formal resignation form. */
  resignationSubmitted?: boolean
  /** Employee note visible to HR/managers only. */
  messageToHr?: string | null
  /** Mandatory reason recorded when the coordinator disables the exit. */
  disabledReason?: string | null
  /** True while a post-approval withdrawal re-runs the approval chain. */
  isWithdrawalRequest?: boolean
  /** True while a post-approval revoke re-runs the approval chain. */
  revokeInProgress?: boolean
  lwdRecommendations?: ExitLwdRecommendation[]
  conditions?: ExitCondition[]
  clarifications?: ExitClarification[]
  supportingDocuments?: ExitCaseDocument[]
  trackedDocuments?: ExitTrackedDocument[]
  comments?: ExitComment[]
  /* --- Termination-type extras --- */
  policiesDeviated?: string[]
  abscondingDate?: string | null
  suspensionFrom?: string | null
  suspensionTill?: string | null
  suspensionWithPay?: boolean
  suspensionReview?: SuspensionReviewOutcome | null
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

/* ------------------------------------------------------------------------ */
/* Local per-exit-type behaviour (POC constants — not part of config.ts)     */
/* ------------------------------------------------------------------------ */

/** Fixed "today" used by exit transaction screens. */
export const EXIT_TODAY = '2026-07-09'

/** Cap for backdating a resignation date when no per-type cap is configured. */
export const MAX_BACKDATE_DAYS = 30

/** Exit types an admin can initiate from the Terminate flow. */
export const TERMINATION_EXIT_TYPES = [
  'Termination',
  'Policy Deviation',
  'Absconding',
  'Suspension',
  'Employee Death',
  'Retirement',
  'Medical Reasons',
  'Poor Performance',
] as const

export type TerminationExitType = (typeof TERMINATION_EXIT_TYPES)[number]

/** Multi-select options for a Policy Deviation termination. */
export const POLICY_DEVIATION_OPTIONS = [
  'Code of Conduct',
  'Data Security Policy',
  'Attendance Policy',
  'Expense & Reimbursement Policy',
  'IT Acceptable Use Policy',
]

/** HR-answered inline questionnaire shown on the Terminate form. */
export const TERMINATION_QUESTIONS = [
  'Were prior warnings or counselling sessions issued to the employee?',
  'Has all supporting evidence been reviewed and attached?',
]

export interface ExitEmployeeRef {
  name: string
  code: string
  department: string
  location: string
  positionLevel: string
}

/** Mock employee directory for the exit pickers and cascades. */
export const EXIT_EMPLOYEE_DIRECTORY: ExitEmployeeRef[] = [
  { name: 'Priya Nair', code: 'EMP-2288', department: 'Engineering', location: 'Bengaluru', positionLevel: 'L2 - Senior' },
  { name: 'Rohan Verma', code: 'EMP-2411', department: 'Engineering', location: 'Hyderabad', positionLevel: 'L1 - Associate' },
  { name: 'Arjun Rao', code: 'EMP-2302', department: 'Sales', location: 'Austin', positionLevel: 'L3 - Lead' },
  { name: 'Sneha Kulkarni', code: 'EMP-2199', department: 'Finance', location: 'Pune', positionLevel: 'L2 - Senior' },
  { name: 'Imran Khan', code: 'EMP-2255', department: 'Operations', location: 'Hyderabad', positionLevel: 'L1 - Associate' },
  { name: 'Leah Fernandes', code: 'EMP-2178', department: 'Human Resources', location: 'Bengaluru', positionLevel: 'L3 - Lead' },
]

/** Role → employees mapping for the task assignment dialog. */
export const EXIT_ROLE_DIRECTORY: Record<string, string[]> = {
  HR: ['Anita Desai', 'Leah Fernandes'],
  'IT Support': ['Tomás Silva'],
  Finance: ['Kavya Menon'],
  Admin: ['Sunil Patil'],
  'Reporting Manager': ['Vikram Shah'],
}

/** Name of the reporting manager persona used across exit flows. */
export const EXIT_REPORTING_MANAGER = 'Vikram Shah'

/** Mock "open tasks assigned to the employee" note for the Enable Exit form. */
export const EMPLOYEE_OPEN_TASKS: Record<string, string[]> = {
  'Priya Nair': ['Q3 release readiness checklist', 'Peer review — Rohan Verma'],
  'Rohan Verma': ['Quarterly compliance training'],
  'Sneha Kulkarni': ['Vendor reconciliation for June'],
}

/** Placeholder body for the "View policy document" action. */
export const POLICY_DOCUMENT_PLACEHOLDER =
  'Exit Policy (placeholder) — notice period, last-working-day derivation and clearance obligations apply as per the configured policy for the employee’s location, department and position. Contact HR for the signed copy.'

/** Formal Resignation cases cannot be rejected by approvers. */
export function isFormalResignation(exitType: string) {
  return exitType === 'Resignation'
}

/**
 * Experience Letter gate — every exit condition must be closed or
 * not-required. Returns a blocking message, or null when clear.
 */
export function experienceLetterBlocker(e: ExitCase): string | null {
  const open = (e.conditions ?? []).filter((c) => c.status === 'open')
  if (open.length === 0) return null
  return `Experience Letter blocked — ${open.length} exit condition(s) still open`
}

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
    resignationDate: '2026-06-10',
    defaultLwd: '2026-08-09',
    policyLwd: '2026-08-09',
    requestedLwd: '2026-08-09',
    approvedLwd: '2026-08-09',
    resignationSubmitted: true,
    lwdRecommendations: [
      { role: 'HR', approver: 'Anita Desai', lwd: '2026-08-09', on: '2026-06-14' },
    ],
    conditions: [
      { id: 'xc1', description: 'Complete FFS input checklist with Finance', dueDate: '2026-08-05', status: 'closed', addedBy: 'Anita Desai', addedOn: '2026-06-14' },
      { id: 'xc2', description: 'Archive reconciliation workbooks to shared drive', dueDate: '2026-08-01', status: 'open', addedBy: 'Vikram Shah', addedOn: '2026-06-20' },
    ],
    trackedDocuments: [
      { id: 'xd1', name: 'Resignation acceptance letter', collectWhen: 'before-exit', status: 'submitted' },
      { id: 'xd2', name: 'Asset handover form', collectWhen: 'on-lwd', status: 'pending' },
    ],
    comments: [
      { id: 'xm1', author: 'Anita Desai', text: 'Retention discussion held on 12 Jun — employee is firm on higher studies.', visibility: 'hr-managers', on: '2026-06-13' },
      { id: 'xm2', author: 'Dev Malhotra', text: 'Will complete all handover items before 01 Aug.', visibility: 'everyone', on: '2026-06-15' },
    ],
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
    approvedLwd: '2026-05-18',
    resignationSubmitted: true,
    trackedDocuments: [
      { id: 'xd1', name: 'Separation memo', collectWhen: 'before-exit', status: 'submitted' },
      { id: 'xd2', name: 'Company ID card', collectWhen: 'on-lwd', status: 'submitted' },
    ],
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
    approvals: [
      {
        role: 'Manager',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-06-25',
        note: 'Recommended LWD 30 Sep to close the quarter.',
      },
      { role: 'HR', approver: 'Anita Desai', status: 'pending', actedOn: null, note: null },
    ],
    clearances: pendingClearances(),
    tasks: [
      { id: 't1', name: 'Pipeline handover to successor', owner: 'Reporting Manager', due: 'Before LWD - 30 Day(s)', done: false },
      { id: 't2', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: false },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: 'Offer from a competitor.' },
      { questionId: 'q2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: 'Yes' },
      { questionId: 'q3', question: 'Any feedback for your manager or team?', responder: 'Employee', mandatory: false, answer: null },
    ],
    questionnaireSubmitted: false,
    raisedBy: 'Employee',
    resignationDate: '2026-06-22',
    defaultLwd: '2026-09-20',
    policyLwd: '2026-09-20',
    requestedLwd: '2026-09-05',
    approvedLwd: null,
    resignationSubmitted: true,
    messageToHr: 'Would appreciate an early release if handover completes ahead of schedule.',
    lwdRecommendations: [
      { role: 'Manager', approver: 'Vikram Shah', lwd: '2026-09-30', on: '2026-06-25' },
    ],
    conditions: [
      { id: 'xc1', description: 'Hand over key accounts (top 12 pipeline deals) to successor', dueDate: '2026-08-31', status: 'open', addedBy: 'Vikram Shah', addedOn: '2026-06-25' },
    ],
    clarifications: [
      {
        id: 'xq1',
        askedBy: 'Vikram Shah',
        askedTo: 'Carlos Mendes',
        question: 'Can you confirm whether the Q3 renewal negotiations can be closed before your requested LWD?',
        askedOn: '2026-06-26',
        reply: null,
        repliedOn: null,
      },
    ],
    supportingDocuments: [
      { id: 'sd1', name: 'resignation-letter-carlos.pdf', uploadedBy: 'Carlos Mendes', uploadedOn: '2026-06-22' },
    ],
    comments: [
      { id: 'xm1', author: 'Vikram Shah', text: 'Counter-offer under discussion with leadership.', visibility: 'hr-managers', on: '2026-06-25' },
    ],
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
    approvedLwd: '2026-07-31',
    resignationSubmitted: true,
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
  {
    id: 'ext-4006',
    employeeName: 'Priya Nair',
    employeeCode: 'EMP-2288',
    department: 'Engineering',
    location: 'Bengaluru',
    positionLevel: 'L2 - Senior',
    exitType: 'Resignation',
    reason: 'Relocating closer to family.',
    requestedOn: '2026-07-06',
    lastWorkingDay: '2026-09-03',
    noticePeriodDays: 60,
    status: 'exit-enabled',
    approvals: makeSteps(EXIT_CHAIN),
    clearances: pendingClearances(),
    tasks: [
      { id: 't1', name: 'Knowledge transfer sessions', owner: 'Reporting Manager', due: 'Before LWD - 15 Day(s)', done: false },
      { id: 't2', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: false },
    ],
    questionnaire: [
      { questionId: 'xq1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: null },
      { questionId: 'xq2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: null },
      { questionId: 'xq3', question: 'Any feedback for your manager or team?', responder: 'Employee', mandatory: false, answer: null },
    ],
    questionnaireSubmitted: false,
    raisedBy: 'Admin (proxy)',
    resignationDate: '2026-07-05',
    defaultLwd: '2026-09-03',
    policyLwd: '2026-09-03',
    requestedLwd: '2026-08-14',
    approvedLwd: null,
    resignationSubmitted: false,
    supportingDocuments: [
      { id: 'sd1', name: 'email-intent-to-resign.eml', uploadedBy: 'Anita Desai', uploadedOn: '2026-07-06' },
    ],
    trackedDocuments: [
      { id: 'xd1', name: 'Resignation acceptance letter', collectWhen: 'before-exit', status: 'pending' },
      { id: 'xd2', name: 'Asset handover form', collectWhen: 'on-lwd', status: 'pending' },
    ],
  },
  {
    id: 'ext-4007',
    employeeName: 'Imran Khan',
    employeeCode: 'EMP-2255',
    department: 'Operations',
    location: 'Hyderabad',
    positionLevel: 'L1 - Associate',
    exitType: 'Suspension',
    reason: 'Suspension pending inquiry into warehouse stock discrepancies.',
    requestedOn: '2026-07-02',
    lastWorkingDay: '2026-07-24',
    noticePeriodDays: 0,
    status: 'approved',
    approvals: EXIT_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-07-04',
      note: null,
    })),
    clearances: pendingClearances(),
    tasks: [],
    questionnaire: [
      { questionId: 'tq1', question: 'Were prior warnings or counselling sessions issued to the employee?', responder: 'HR', mandatory: true, answer: 'Yes — written warning issued on 20 Jun 2026.' },
      { questionId: 'tq2', question: 'Has all supporting evidence been reviewed and attached?', responder: 'HR', mandatory: true, answer: 'Yes — stock audit report attached.' },
    ],
    questionnaireSubmitted: true,
    raisedBy: 'Admin (proxy)',
    resignationSubmitted: true,
    suspensionFrom: '2026-07-10',
    suspensionTill: '2026-07-24',
    suspensionWithPay: false,
    suspensionReview: null,
    supportingDocuments: [
      { id: 'sd1', name: 'stock-audit-report-june.pdf', uploadedBy: 'Anita Desai', uploadedOn: '2026-07-02' },
    ],
    comments: [
      { id: 'xm0', author: 'System', text: 'Opened from disciplinary case dsc-5006 — see the Disciplinary tab for the originating record and its history.', visibility: 'hr-managers', on: '2026-07-02' },
      { id: 'xm1', author: 'Anita Desai', text: 'Inquiry committee constituted; findings expected by 22 Jul.', visibility: 'hr-managers', on: '2026-07-04' },
    ],
  },
  /* --- W8 seeds — exits tracked in the asset register (Aster Digital) --- */
  {
    // Karan Mehta holds a ThinkPad (asset register e-09) — every functional
    // clearance is done, so only the unreturned asset blocks finalization.
    id: 'ext-4008',
    employeeName: 'Karan Mehta',
    employeeCode: 'AD-1009',
    department: 'Operations',
    location: 'Pune',
    positionLevel: 'L4 - Manager',
    exitType: 'Resignation',
    reason: 'Moving to a family logistics business.',
    requestedOn: '2026-05-01',
    lastWorkingDay: '2026-06-30',
    noticePeriodDays: 60,
    status: 'clearance-in-progress',
    approvals: EXIT_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-05-05',
      note: null,
    })),
    clearances: DEFAULT_CLEARANCES.map((c) => ({
      ...c,
      status: 'cleared' as const,
      note: null,
    })),
    tasks: [
      { id: 't1', name: 'Warehouse handover walkthrough', owner: 'Reporting Manager', due: 'Before LWD - 10 Day(s)', done: true },
      { id: 't2', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: true },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: 'Joining the family business.' },
      { questionId: 'q2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: 'Yes' },
    ],
    questionnaireSubmitted: true,
    raisedBy: 'Employee',
    resignationDate: '2026-05-01',
    approvedLwd: '2026-06-30',
    resignationSubmitted: true,
    comments: [
      { id: 'xm1', author: 'Anita Desai', text: 'LWD has passed — closure held only by the unreturned laptop tracked in the asset register.', visibility: 'hr-managers', on: '2026-07-02' },
    ],
  },
  {
    // Josh Patel (asset register e-04) still has a projector out on loan —
    // functional clearance is mid-flight and the asset also blocks finalize.
    id: 'ext-4009',
    employeeName: 'Josh Patel',
    employeeCode: 'AD-1004',
    department: 'Sales',
    location: 'Austin',
    positionLevel: 'L2 - Senior',
    exitType: 'Resignation',
    reason: 'Relocating for a partner opportunity.',
    requestedOn: '2026-06-01',
    lastWorkingDay: '2026-07-31',
    noticePeriodDays: 60,
    status: 'clearance-in-progress',
    approvals: EXIT_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-06-04',
      note: null,
    })),
    clearances: [
      { functionName: 'IT', owner: 'Tomás Silva', status: 'pending', note: 'Projector on loan still out with the employee.' },
      { functionName: 'Finance', owner: 'Kavya Menon', status: 'cleared', note: null },
      { functionName: 'HR', owner: 'Anita Desai', status: 'pending', note: null },
      { functionName: 'Admin', owner: 'Sunil Patil', status: 'cleared', note: null },
    ],
    tasks: [
      { id: 't1', name: 'Key account handover', owner: 'Reporting Manager', due: 'Before LWD - 20 Day(s)', done: false },
      { id: 't2', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: false },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: 'Relocation.' },
      { questionId: 'q2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: 'Yes' },
    ],
    questionnaireSubmitted: false,
    raisedBy: 'Employee',
    resignationDate: '2026-06-01',
    approvedLwd: '2026-07-31',
    resignationSubmitted: true,
  },
  {
    // Nikhil Bose (asset register e-06) returned his access key on 18 Jun —
    // assets are cleared, so this exit can be finalized once shown.
    id: 'ext-4010',
    employeeName: 'Nikhil Bose',
    employeeCode: 'AD-1006',
    department: 'Engineering',
    location: 'Bengaluru',
    positionLevel: 'L2 - Senior',
    exitType: 'Resignation',
    reason: 'Startup founding opportunity.',
    requestedOn: '2026-05-15',
    lastWorkingDay: '2026-07-15',
    noticePeriodDays: 60,
    status: 'clearance-in-progress',
    approvals: EXIT_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-05-18',
      note: null,
    })),
    clearances: DEFAULT_CLEARANCES.map((c) => ({
      ...c,
      status: 'cleared' as const,
      note: null,
    })),
    tasks: [
      { id: 't1', name: 'Platform runbook handover', owner: 'Reporting Manager', due: 'Before LWD - 15 Day(s)', done: true },
      { id: 't2', name: 'Revoke system access', owner: 'IT Support', due: 'Before LWD - 0 Day(s)', done: false },
    ],
    questionnaire: [
      { questionId: 'q1', question: 'What is your primary reason for leaving?', responder: 'Employee', mandatory: true, answer: 'Starting up.' },
      { questionId: 'q2', question: 'Would you recommend the company as a place to work?', responder: 'Employee', mandatory: true, answer: 'Yes' },
    ],
    questionnaireSubmitted: true,
    raisedBy: 'Employee',
    resignationDate: '2026-05-15',
    approvedLwd: '2026-07-15',
    resignationSubmitted: true,
  },
]
