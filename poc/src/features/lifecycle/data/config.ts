import { type OnboardingStage } from './onboarding'
import { type ProbationOutcome } from './probation'

/**
 * Governed lifecycle configuration — versioned, effective-dated metadata that
 * the (mock) workflow / rules / forms engines read at runtime.
 */

export interface LifecycleSettings {
  exitManagementEnabled: boolean
  exitQuestionnaireEnabled: boolean
  confirmationModuleEnabled: boolean
  confirmationQuestionnaireEnabled: boolean
  layoffMinEmployees: number
}

export const seedSettings: LifecycleSettings = {
  exitManagementEnabled: true,
  exitQuestionnaireEnabled: true,
  confirmationModuleEnabled: true,
  confirmationQuestionnaireEnabled: true,
  layoffMinEmployees: 10,
}

/* ---------------------------------- Onboarding template ------------------ */

export interface OnboardingTaskDef {
  id: string
  name: string
  assigneeRole: string
  mandatory: boolean
  requiredDocs: string[]
  completionCriteria: string
}

export interface OnboardingStageDef {
  stage: OnboardingStage
  tasks: OnboardingTaskDef[]
}

export interface OnboardingTemplate {
  id: string
  name: string
  version: string
  effectiveFrom: string
  status: 'published' | 'superseded'
  stages: OnboardingStageDef[]
}

const templateStages = (v: string): OnboardingStageDef[] => [
  {
    stage: 'Offer Acceptance',
    tasks: [
      {
        id: `${v}-t1`,
        name: 'Accept offer letter',
        assigneeRole: 'Employee',
        mandatory: true,
        requiredDocs: [],
        completionCriteria: 'Digital acceptance recorded',
      },
    ],
  },
  {
    stage: 'Document Submission',
    tasks: [
      {
        id: `${v}-t2`,
        name: 'Upload joining documents',
        assigneeRole: 'Employee',
        mandatory: true,
        requiredDocs: [
          'Signed offer letter',
          'Government ID proof',
          'Education certificates',
        ],
        completionCriteria: 'All required documents submitted',
      },
    ],
  },
  {
    stage: 'Document Verification',
    tasks: [
      {
        id: `${v}-t3`,
        name: 'Verify submitted documents',
        assigneeRole: 'HR',
        mandatory: true,
        requiredDocs: [],
        completionCriteria: 'Every required document verified',
      },
    ],
  },
  {
    stage: 'Asset Assignment',
    tasks: [
      {
        id: `${v}-t4`,
        name: 'Issue laptop, access card & HRMS account',
        assigneeRole: 'IT Support',
        mandatory: true,
        requiredDocs: [],
        completionCriteria: 'All assets marked assigned',
      },
    ],
  },
  {
    stage: 'Induction Completion',
    tasks: [
      {
        id: `${v}-t5`,
        name: 'Attend induction & policy walkthrough',
        assigneeRole: 'HR',
        mandatory: true,
        requiredDocs: [],
        completionCriteria: 'Induction sign-off recorded',
      },
    ],
  },
]

export const seedTemplates: OnboardingTemplate[] = [
  {
    id: 'tpl-v2',
    name: 'Standard Joiner Checklist',
    version: 'v2',
    effectiveFrom: '2026-06-20',
    status: 'published',
    stages: templateStages('v2'),
  },
  {
    id: 'tpl-v1',
    name: 'Standard Joiner Checklist',
    version: 'v1',
    effectiveFrom: '2025-11-01',
    status: 'superseded',
    stages: templateStages('v1'),
  },
]

/* ---------------------------------- Probation decision table ------------- */

export interface DecisionRow {
  id: string
  minScore: number
  maxScore: number
  outcome: ProbationOutcome
}

export interface ProbationDecisionTable {
  version: string
  effectiveFrom: string
  rows: DecisionRow[]
}

export const seedDecisionTable: ProbationDecisionTable = {
  version: 'v3',
  effectiveFrom: '2026-05-01',
  rows: [
    { id: 'dr1', minScore: 4, maxScore: 5, outcome: 'Confirm' },
    { id: 'dr2', minScore: 2.5, maxScore: 3.99, outcome: 'Extend' },
    { id: 'dr3', minScore: 1, maxScore: 2.49, outcome: 'Initiate Separation' },
  ],
}

/* ---------------------------------- Approver graphs ---------------------- */

export interface ApproverGraphStep {
  order: number
  role: string
  parallel: boolean
  condition: string | null
}

export interface ApproverGraph {
  id: string
  workflow: 'Onboarding' | 'Probation' | 'Transfer' | 'Exit'
  version: string
  effectiveFrom: string
  steps: ApproverGraphStep[]
}

export const seedApproverGraphs: ApproverGraph[] = [
  {
    id: 'gr-onb',
    workflow: 'Onboarding',
    version: 'v1',
    effectiveFrom: '2025-11-01',
    steps: [{ order: 1, role: 'HR', parallel: false, condition: null }],
  },
  {
    id: 'gr-prb',
    workflow: 'Probation',
    version: 'v2',
    effectiveFrom: '2026-01-01',
    steps: [
      { order: 1, role: 'Manager', parallel: false, condition: null },
      { order: 2, role: 'Department Head', parallel: false, condition: null },
      { order: 3, role: 'HR', parallel: false, condition: null },
    ],
  },
  {
    id: 'gr-trf',
    workflow: 'Transfer',
    version: 'v3',
    effectiveFrom: '2026-04-01',
    steps: [
      { order: 1, role: 'Manager', parallel: false, condition: null },
      { order: 2, role: 'Department Head', parallel: false, condition: null },
      { order: 3, role: 'HR', parallel: false, condition: null },
      {
        order: 4,
        role: 'Group Admin',
        parallel: false,
        condition: 'Only for Inter-Company transfers',
      },
    ],
  },
  {
    id: 'gr-ext',
    workflow: 'Exit',
    version: 'v2',
    effectiveFrom: '2026-02-01',
    steps: [
      { order: 1, role: 'Manager', parallel: false, condition: null },
      { order: 2, role: 'HR', parallel: false, condition: null },
    ],
  },
]

/* ---------------------------------- Exit configuration ------------------- */

export interface ExitTypeDef {
  id: string
  name: string
  category: 'Voluntary' | 'Involuntary' | 'Retirement'
  employeeClassSpecific: boolean
}

export const seedExitTypes: ExitTypeDef[] = [
  { id: 'xt1', name: 'Resignation', category: 'Voluntary', employeeClassSpecific: false },
  { id: 'xt2', name: 'Probation Separation', category: 'Involuntary', employeeClassSpecific: false },
  { id: 'xt3', name: 'Retirement', category: 'Retirement', employeeClassSpecific: true },
  { id: 'xt4', name: 'Contract End', category: 'Voluntary', employeeClassSpecific: true },
  { id: 'xt5', name: 'Termination', category: 'Involuntary', employeeClassSpecific: false },
]

export interface ExitApproverGroup {
  id: string
  name: string
  exitType: string
  locations: string[]
  departments: string[]
  approvers: string[]
}

export const seedExitApproverGroups: ExitApproverGroup[] = [
  {
    id: 'xg1',
    name: 'India voluntary exits',
    exitType: 'Resignation',
    locations: ['Hyderabad', 'Bengaluru', 'Pune'],
    departments: ['Engineering', 'Finance', 'Human Resources', 'Sales'],
    approvers: ['Vikram Shah', 'Anita Desai'],
  },
  {
    id: 'xg2',
    name: 'US exits',
    exitType: 'Resignation',
    locations: ['Austin'],
    departments: ['Sales', 'Finance'],
    approvers: ['Elena Petrova', 'Anita Desai'],
  },
  {
    id: 'xg3',
    name: 'Retirements — all sites',
    exitType: 'Retirement',
    locations: ['Hyderabad', 'Bengaluru', 'Pune', 'Austin'],
    departments: ['Operations', 'Engineering'],
    approvers: ['Anita Desai'],
  },
]

export interface ClearanceApproverChain {
  id: string
  functionName: string
  hierarchy: string[]
}

export const seedClearanceChains: ClearanceApproverChain[] = [
  { id: 'cc1', functionName: 'IT', hierarchy: ['Tomás Silva', 'Elena Petrova'] },
  { id: 'cc2', functionName: 'Finance', hierarchy: ['Kavya Menon'] },
  { id: 'cc3', functionName: 'HR', hierarchy: ['Anita Desai'] },
  { id: 'cc4', functionName: 'Admin', hierarchy: ['Sunil Patil', 'Anita Desai'] },
]

export const QUESTION_TYPES = [
  'Text',
  'Rating',
  'Yes/No',
  'Multiple Choice',
] as const

export interface ExitQuestionDef {
  id: string
  text: string
  type: (typeof QUESTION_TYPES)[number]
  exitTypes: string[]
  responder: 'Employee' | 'Manager'
  mandatory: boolean
}

export const seedExitQuestions: ExitQuestionDef[] = [
  {
    id: 'xq1',
    text: 'What is your primary reason for leaving?',
    type: 'Text',
    exitTypes: ['Resignation', 'Contract End'],
    responder: 'Employee',
    mandatory: true,
  },
  {
    id: 'xq2',
    text: 'Would you recommend the company as a place to work?',
    type: 'Yes/No',
    exitTypes: ['Resignation', 'Retirement', 'Contract End'],
    responder: 'Employee',
    mandatory: true,
  },
  {
    id: 'xq3',
    text: 'Any feedback for your manager or team?',
    type: 'Text',
    exitTypes: ['Resignation', 'Retirement'],
    responder: 'Employee',
    mandatory: false,
  },
  {
    id: 'xq4',
    text: 'Was a retention conversation held?',
    type: 'Yes/No',
    exitTypes: ['Resignation'],
    responder: 'Manager',
    mandatory: true,
  },
]

export interface ExitTaskDef {
  id: string
  name: string
  exitTypes: string[]
  responsible: string
  /** LWD-relative timing, e.g. "Before LWD - 3 Day(s)". */
  timing: string
}

export const seedExitTaskDefs: ExitTaskDef[] = [
  {
    id: 'xtk1',
    name: 'Knowledge transfer sessions',
    exitTypes: ['Resignation', 'Retirement'],
    responsible: 'Reporting Manager',
    timing: 'Before LWD - 15 Day(s)',
  },
  {
    id: 'xtk2',
    name: 'Revoke system access',
    exitTypes: ['Resignation', 'Termination', 'Probation Separation', 'Retirement', 'Contract End'],
    responsible: 'IT Support',
    timing: 'Before LWD - 0 Day(s)',
  },
  {
    id: 'xtk3',
    name: 'Full & final settlement input',
    exitTypes: ['Resignation', 'Retirement', 'Termination'],
    responsible: 'Finance',
    timing: 'After LWD - 7 Day(s)',
  },
  {
    id: 'xtk4',
    name: 'Issue relieving letter',
    exitTypes: ['Resignation', 'Retirement', 'Contract End'],
    responsible: 'HR',
    timing: 'After LWD - 3 Day(s)',
  },
]

export interface NoticeRule {
  id: string
  name: string
  durationDays: number
  employeeClassSpecific: boolean
  locations: string[]
  departments: string[]
  positionLevels: string[]
}

export const seedNoticeRules: NoticeRule[] = [
  {
    id: 'nr1',
    name: 'India standard notice',
    durationDays: 60,
    employeeClassSpecific: false,
    locations: ['Hyderabad', 'Bengaluru', 'Pune'],
    departments: ['Engineering', 'Finance', 'Human Resources', 'IT Support', 'Operations'],
    positionLevels: ['L1 - Associate', 'L2 - Senior', 'L3 - Lead'],
  },
  {
    id: 'nr2',
    name: 'Leadership notice',
    durationDays: 90,
    employeeClassSpecific: false,
    locations: ['Hyderabad', 'Bengaluru', 'Pune', 'Austin'],
    departments: ['Engineering', 'Finance', 'Human Resources', 'Sales', 'Operations', 'IT Support'],
    positionLevels: ['L4 - Manager'],
  },
  {
    id: 'nr3',
    name: 'US at-will notice',
    durationDays: 14,
    employeeClassSpecific: false,
    locations: ['Austin'],
    departments: ['Sales', 'Finance'],
    positionLevels: ['L1 - Associate', 'L2 - Senior', 'L3 - Lead'],
  },
  {
    id: 'nr4',
    name: 'Contract staff notice',
    durationDays: 30,
    employeeClassSpecific: true,
    locations: ['Hyderabad', 'Pune'],
    departments: ['Operations', 'IT Support'],
    positionLevels: ['L1 - Associate'],
  },
]

export interface LayoffApprover {
  id: string
  location: string
  approver: string
}

export const seedLayoffApprovers: LayoffApprover[] = [
  { id: 'la1', location: 'Hyderabad', approver: 'Farah Qureshi' },
  { id: 'la2', location: 'Austin', approver: 'Elena Petrova' },
]

/* ---------------------------------- Letter / message templates ----------- */

export interface LetterTemplate {
  id: string
  category: 'Exit' | 'Confirmation' | 'Disciplinary'
  kind: 'Letter' | 'Email' | 'Notification'
  letterType: string
  description: string
  body: string
}

export const seedLetterTemplates: LetterTemplate[] = [
  {
    id: 'lt1',
    category: 'Exit',
    kind: 'Letter',
    letterType: 'Relieving Letter',
    description: 'Issued after exit finalization.',
    body: 'Dear {{employee_name}},\n\nThis is to confirm that you have been relieved from your duties at {{company}} effective {{last_working_day}}. We thank you for your contributions.\n\nSincerely,\nHuman Resources',
  },
  {
    id: 'lt2',
    category: 'Exit',
    kind: 'Letter',
    letterType: 'Experience Letter',
    description: 'Summarizes tenure and role.',
    body: 'To whomsoever it may concern,\n\n{{employee_name}} ({{employee_code}}) was employed with {{company}} from {{join_date}} to {{last_working_day}} as {{designation}}.',
  },
  {
    id: 'lt3',
    category: 'Exit',
    kind: 'Email',
    letterType: 'Exit Approval Email',
    description: 'Sent when an exit request is approved.',
    body: 'Hi {{employee_name}}, your exit request has been approved. Last working day: {{last_working_day}}.',
  },
  {
    id: 'lt4',
    category: 'Confirmation',
    kind: 'Letter',
    letterType: 'Employee Confirmation',
    description: 'Issued when probation outcome is Confirm.',
    body: 'Dear {{employee_name}},\n\nWe are pleased to confirm your employment with {{company}} effective {{confirmation_date}}.',
  },
  {
    id: 'lt5',
    category: 'Confirmation',
    kind: 'Letter',
    letterType: 'Probation Extension',
    description: 'Issued when probation outcome is Extend.',
    body: 'Dear {{employee_name}},\n\nYour probation period has been extended until {{extended_to}}. A fresh evaluation cycle has been scheduled.',
  },
  {
    id: 'lt6',
    category: 'Confirmation',
    kind: 'Notification',
    letterType: 'Confirmation Review Due',
    description: 'In-app nudge to the reviewing manager.',
    body: 'Confirmation review for {{employee_name}} is due on {{due_date}}.',
  },
  {
    id: 'lt7',
    category: 'Disciplinary',
    kind: 'Letter',
    letterType: 'Warning Letter',
    description: 'Formal warning issued on approval.',
    body: 'Dear {{employee_name}},\n\nThis letter serves as a formal warning regarding {{reason}}. Further violations may lead to stricter action.',
  },
  {
    id: 'lt8',
    category: 'Disciplinary',
    kind: 'Letter',
    letterType: 'Show-Cause Notice',
    description: 'Requires written explanation within 48 hours.',
    body: 'Dear {{employee_name}},\n\nYou are required to explain in writing within 48 hours why disciplinary action should not be taken regarding {{reason}}.',
  },
  {
    id: 'lt9',
    category: 'Disciplinary',
    kind: 'Email',
    letterType: 'Disciplinary Outcome Email',
    description: 'Notifies the employee of the approved action.',
    body: 'Hi {{employee_name}}, a disciplinary action ({{action_type}}) has been recorded. Please check the attached letter.',
  },
]

/* ---------------------------------- Confirmation configuration ----------- */

export interface ConfirmationApproverGroup {
  id: string
  locations: string[]
  departments: string[]
  positionLevels: string[]
  approvers: string[]
  applicability: string
}

export const seedConfirmationApprovers: ConfirmationApproverGroup[] = [
  {
    id: 'cg1',
    locations: ['Hyderabad', 'Bengaluru'],
    departments: ['Engineering', 'IT Support'],
    positionLevels: ['L1 - Associate', 'L2 - Senior'],
    approvers: ['Vikram Shah', 'Elena Petrova', 'Anita Desai'],
    applicability: 'India tech staff',
  },
  {
    id: 'cg2',
    locations: ['Pune'],
    departments: ['Operations', 'Finance'],
    positionLevels: ['L1 - Associate', 'L2 - Senior', 'L3 - Lead'],
    approvers: ['Elena Petrova', 'Anita Desai'],
    applicability: 'Pune back office',
  },
  {
    id: 'cg3',
    locations: ['Austin'],
    departments: ['Sales'],
    positionLevels: ['L1 - Associate', 'L2 - Senior', 'L3 - Lead', 'L4 - Manager'],
    approvers: ['Carlos Mendes', 'Anita Desai'],
    applicability: 'US sales org',
  },
]

export const CONFIRMATION_QUESTION_USES = [
  'Confirmation',
  'Peer Review',
  'Periodic',
] as const

export type ConfirmationQuestionUse =
  (typeof CONFIRMATION_QUESTION_USES)[number]

export interface ConfirmationQuestion {
  id: string
  text: string
  type: (typeof QUESTION_TYPES)[number]
  options: string[]
  score: number
  order: number
  mandatory: boolean
  usedIn: ConfirmationQuestionUse[]
}

export const seedConfirmationQuestions: ConfirmationQuestion[] = [
  {
    id: 'cq1',
    text: 'Rate the overall quality of work delivered.',
    type: 'Rating',
    options: ['1', '2', '3', '4', '5'],
    score: 5,
    order: 1,
    mandatory: true,
    usedIn: ['Confirmation', 'Periodic'],
  },
  {
    id: 'cq2',
    text: 'Does the employee collaborate effectively with the team?',
    type: 'Yes/No',
    options: ['Yes', 'No'],
    score: 3,
    order: 2,
    mandatory: true,
    usedIn: ['Confirmation', 'Peer Review'],
  },
  {
    id: 'cq3',
    text: 'Describe one strength and one improvement area.',
    type: 'Text',
    options: [],
    score: 0,
    order: 3,
    mandatory: false,
    usedIn: ['Peer Review'],
  },
  {
    id: 'cq4',
    text: 'Attendance and punctuality during the review period.',
    type: 'Multiple Choice',
    options: ['Excellent', 'Good', 'Needs improvement'],
    score: 2,
    order: 4,
    mandatory: true,
    usedIn: ['Confirmation', 'Periodic'],
  },
]

/* ---------------------------------- Disciplinary approvers --------------- */

export interface DisciplinaryApproverGroup {
  id: string
  groupCode: string
  locations: string[]
  approvers: string[]
}

export const seedDisciplinaryApprovers: DisciplinaryApproverGroup[] = [
  {
    id: 'da1',
    groupCode: 'DA-HYD',
    locations: ['Hyderabad'],
    approvers: ['Vikram Shah'],
  },
  {
    id: 'da2',
    groupCode: 'DA-PUN',
    locations: ['Pune', 'Bengaluru'],
    approvers: ['Elena Petrova'],
  },
  {
    id: 'da3',
    groupCode: 'DA-AUS',
    locations: ['Austin'],
    approvers: ['Carlos Mendes'],
  },
]
