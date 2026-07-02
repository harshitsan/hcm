// ---------------------------------------------------------------------------
// Recruitment configuration metadata (TA-15/16/25/26/35/37/38/40/41/43/46/48/
// 51/52/53/54/55/56) — versioned, effective-dated config the engines read.
// ---------------------------------------------------------------------------

export const LETTER_TYPES = [
  'Offer',
  'Appointment',
  'Joining',
  'Cancel Offer',
] as const
export type LetterType = (typeof LETTER_TYPES)[number]

/** Offer/appointment/joining/cancel-offer letter template (TA-15, TA-48). */
export interface LetterTemplate {
  id: string
  letterType: LetterType
  name: string
  description: string
  content: string
  mergeFields: string[]
  active: boolean
  version: number
}

export const seedLetterTemplates: LetterTemplate[] = [
  {
    id: 'tpl-offer-std',
    letterType: 'Offer',
    name: 'Standard Offer Letter',
    description: 'Default offer letter for all employee classes',
    content:
      'Dear {{candidate_name}}, we are pleased to offer you the position of {{position}} at {{location}} with an annual CTC of {{ctc}}. Please respond by {{deadline}}.',
    mergeFields: ['candidate_name', 'position', 'location', 'ctc', 'deadline'],
    active: true,
    version: 3,
  },
  {
    id: 'tpl-offer-intern',
    letterType: 'Offer',
    name: 'Internship Offer Letter',
    description: 'Offer letter for intern employee class',
    content:
      'Dear {{candidate_name}}, we are pleased to offer you an internship as {{position}} for {{duration}} months.',
    mergeFields: ['candidate_name', 'position', 'duration'],
    active: false,
    version: 1,
  },
  {
    id: 'tpl-joining',
    letterType: 'Joining',
    name: 'Joining Letter',
    description: 'Issued after offer acceptance, before start date',
    content:
      'Dear {{candidate_name}}, your joining date is {{joining_date}}. Please report to {{location}} with the listed documents.',
    mergeFields: ['candidate_name', 'joining_date', 'location'],
    active: true,
    version: 2,
  },
  {
    id: 'tpl-appointment',
    letterType: 'Appointment',
    name: 'Appointment Letter',
    description: 'Formal appointment letter issued once status is Joined',
    content:
      'Dear {{employee_name}}, this confirms your appointment as {{position}} effective {{effective_date}}.',
    mergeFields: ['employee_name', 'position', 'effective_date'],
    active: true,
    version: 2,
  },
  {
    id: 'tpl-cancel',
    letterType: 'Cancel Offer',
    name: 'Offer Cancellation Letter',
    description: 'Issued when a released offer is withdrawn by the company',
    content:
      'Dear {{candidate_name}}, we regret to inform you that the offer for {{position}} has been withdrawn.',
    mergeFields: ['candidate_name', 'position'],
    active: true,
    version: 1,
  },
]

/** Scorecard evaluation criterion (TA-09, TA-16). */
export interface ScorecardCriterion {
  id: string
  name: string
  scaleMax: number
  weight: number
  active: boolean
}

export const seedScorecardCriteria: ScorecardCriterion[] = [
  { id: 'cr-1', name: 'Technical depth', scaleMax: 5, weight: 35, active: true },
  { id: 'cr-2', name: 'Problem solving', scaleMax: 5, weight: 30, active: true },
  { id: 'cr-3', name: 'Communication', scaleMax: 5, weight: 20, active: true },
  { id: 'cr-4', name: 'Culture add', scaleMax: 5, weight: 15, active: true },
]

/** Interview panel (TA-07). */
export interface InterviewPanel {
  id: string
  name: string
  members: string[]
}

export const seedPanels: InterviewPanel[] = [
  { id: 'pn-1', name: 'Backend Panel', members: ['Ananya Sharma', 'Dev Patel', 'Ritu Saxena'] },
  { id: 'pn-2', name: 'Design Panel', members: ['Divya Menon', 'Tara Bhatt'] },
  { id: 'pn-3', name: 'Sales Panel', members: ['Karthik Rao', 'Nilesh Shah'] },
  { id: 'pn-4', name: 'Leadership Panel', members: ['Sunita Patil', 'Ananya Sharma'] },
]

/** Sequential interview rounds mapped to panels (TA-41). */
export interface RoundsConfig {
  id: string
  name: string
  employeeClass: string
  location: string
  department: string
  position: string
  rounds: Array<{ round: number; name: string; panelId: string }>
}

export const seedRoundsConfigs: RoundsConfig[] = [
  {
    id: 'rc-1',
    name: 'Engineering Hiring Loop',
    employeeClass: 'Full-time',
    location: 'All',
    department: 'Engineering',
    position: 'All',
    rounds: [
      { round: 1, name: 'Technical Screen', panelId: 'pn-1' },
      { round: 2, name: 'System Design', panelId: 'pn-1' },
      { round: 3, name: 'Leadership & Values', panelId: 'pn-4' },
    ],
  },
  {
    id: 'rc-2',
    name: 'Sales Hiring Loop',
    employeeClass: 'All',
    location: 'All',
    department: 'Sales',
    position: 'All',
    rounds: [
      { round: 1, name: 'Role Play', panelId: 'pn-3' },
      { round: 2, name: 'Manager Round', panelId: 'pn-4' },
    ],
  },
]

/** Weighted pre-interview questionnaire item (TA-43). */
export interface PreInterviewQuestion {
  id: string
  category: string
  question: string
  questionType: 'Objective' | 'Subjective'
  fieldType: 'Text' | 'Number' | 'Yes/No' | 'Choice'
  positionLevel: string
  employeeClass: string
  value: number
  score: number
  mandatory: boolean
  weightage: number
}

export const seedPreInterviewQuestions: PreInterviewQuestion[] = [
  {
    id: 'pq-1',
    category: 'Experience',
    question: 'Years of relevant experience',
    questionType: 'Objective',
    fieldType: 'Number',
    positionLevel: 'Senior',
    employeeClass: 'Full-time',
    value: 6,
    score: 10,
    mandatory: true,
    weightage: 40,
  },
  {
    id: 'pq-2',
    category: 'Availability',
    question: 'Notice period (days)',
    questionType: 'Objective',
    fieldType: 'Number',
    positionLevel: 'All',
    employeeClass: 'All',
    value: 30,
    score: 5,
    mandatory: true,
    weightage: 25,
  },
  {
    id: 'pq-3',
    category: 'Compensation',
    question: 'Expected CTC within band?',
    questionType: 'Objective',
    fieldType: 'Yes/No',
    positionLevel: 'All',
    employeeClass: 'All',
    value: 1,
    score: 5,
    mandatory: false,
    weightage: 35,
  },
]

/** Posting channel master (TA-37). */
export interface PostingChannel {
  id: string
  name: string
  channel: string
  type: 'Job Board' | 'Social' | 'Internal' | 'Agency'
  postingMode: 'Internal' | 'External' | 'Both'
  applicability: string
  active: boolean
}

export const seedPostingChannels: PostingChannel[] = [
  { id: 'ch-01', name: 'LinkedIn Jobs', channel: 'linkedin.com', type: 'Social', postingMode: 'External', applicability: 'All departments', active: true },
  { id: 'ch-02', name: 'Naukri', channel: 'naukri.com', type: 'Job Board', postingMode: 'External', applicability: 'All departments', active: true },
  { id: 'ch-03', name: 'Company Careers Site', channel: 'careers.satellitehr.in', type: 'Internal', postingMode: 'Both', applicability: 'All departments', active: true },
  { id: 'ch-04', name: 'TalentEdge Agency', channel: 'agency', type: 'Agency', postingMode: 'External', applicability: 'Leadership roles', active: false },
]

/** Posting-source approver rule (TA-38). */
export interface PostingApproverRule {
  id: string
  postingMode: 'Internal' | 'External' | 'Both'
  employeeClass: string
  location: string
  approvers: string[]
}

export const seedPostingApproverRules: PostingApproverRule[] = [
  { id: 'pa-1', postingMode: 'External', employeeClass: 'All', location: 'All', approvers: ['Sunita Patil'] },
  { id: 'pa-2', postingMode: 'Internal', employeeClass: 'All', location: 'All', approvers: ['Divya Menon'] },
]

export const ASSIGNMENT_METHODS = ['manual', 'round-robin', 'workload'] as const
export type AssignmentMethod = (typeof ASSIGNMENT_METHODS)[number]

/** Location-based offer approver rule + out-of-band approver (TA-46). */
export interface OfferApproverRule {
  id: string
  locations: string[]
  employeeClass: string
  approvers: string[]
}

export const seedOfferApproverRules: OfferApproverRule[] = [
  { id: 'oa-1', locations: ['Bengaluru'], employeeClass: 'All', approvers: ['Sunita Patil'] },
  { id: 'oa-2', locations: ['Pune', 'Mumbai'], employeeClass: 'All', approvers: ['Divya Menon', 'Farhan Ali'] },
  { id: 'oa-3', locations: ['Hyderabad', 'Remote — India'], employeeClass: 'All', approvers: ['Karthik Rao'] },
]

/** Resource-requisition approver rule (TA-52). */
export interface RequisitionApproverRule {
  id: string
  template: string
  employeeClass: string
  location: string
  department: string
  position: string
  approvers: string[]
}

export const seedRequisitionApproverRules: RequisitionApproverRule[] = [
  {
    id: 'ra-1',
    template: 'Standard 2-level',
    employeeClass: 'All',
    location: 'All',
    department: 'All',
    position: 'All',
    approvers: ['Sunita Patil', 'Rohit Bansal'],
  },
  {
    id: 'ra-2',
    template: 'Engineering fast-track',
    employeeClass: 'Full-time',
    location: 'Bengaluru',
    department: 'Engineering',
    position: 'All',
    approvers: ['Ananya Sharma', 'Rohit Bansal'],
  },
]

/** Stage-based required candidate document (TA-54). */
export interface RequiredDocument {
  id: string
  name: string
  docType: 'Identity' | 'Education' | 'Employment' | 'Compensation'
  employeeClass: string
  requiredAtStage: string
}

export const seedRequiredDocuments: RequiredDocument[] = [
  { id: 'doc-1', name: 'PAN Card', docType: 'Identity', employeeClass: 'All', requiredAtStage: 'offer' },
  { id: 'doc-2', name: 'Degree Certificate', docType: 'Education', employeeClass: 'Full-time', requiredAtStage: 'reference-check' },
  { id: 'doc-3', name: 'Last 3 Payslips', docType: 'Compensation', employeeClass: 'Full-time', requiredAtStage: 'offer' },
  { id: 'doc-4', name: 'Relieving Letter', docType: 'Employment', employeeClass: 'All', requiredAtStage: 'hired' },
]

/** Rehire carry-over configuration tabs (TA-55). */
export const REHIRE_TABS = [
  { tab: 'Personal Details', fields: ['Name & DOB', 'Marital status', 'Nationality', 'Photo'] },
  { tab: 'Contact Details', fields: ['Permanent address', 'Emergency contacts', 'Personal email'] },
  { tab: 'Academic Details', fields: ['Degrees', 'Certifications'] },
  { tab: 'Work Experience', fields: ['Prior employers', 'Internal tenure history'] },
  { tab: 'Skills', fields: ['Skill matrix', 'Languages'] },
  { tab: 'Employee Verification', fields: ['Background check result', 'Reference outcomes'] },
  { tab: 'Orientation', fields: ['Policy acknowledgements', 'Compliance trainings'] },
] as const

export const defaultRehireSelections: Record<string, string[]> = {
  'Personal Details': ['Name & DOB', 'Nationality'],
  'Contact Details': ['Permanent address'],
  'Academic Details': ['Degrees', 'Certifications'],
  'Work Experience': ['Prior employers', 'Internal tenure history'],
  Skills: ['Skill matrix'],
  'Employee Verification': [],
  Orientation: [],
}

/** Recruiter strengths profile (TA-56). */
export interface RecruiterStrength {
  id: string
  recruiter: string
  strengths: string
  applicability: string
}

export const seedRecruiterStrengths: RecruiterStrength[] = [
  { id: 'rs-1', recruiter: 'Meera Iyer', strengths: 'Backend & platform engineering', applicability: 'Engineering' },
  { id: 'rs-2', recruiter: 'Sana Qureshi', strengths: 'High-volume sales hiring', applicability: 'Sales, Customer Support' },
  { id: 'rs-3', recruiter: 'Vikram Joshi', strengths: 'Data & analytics roles', applicability: 'Engineering, Product' },
]

/** Talent-pool mailbox import settings (TA-40). */
export interface MailboxSettings {
  enabled: boolean
  server: string
  username: string
  port: number
  encryption: 'SSL' | 'TLS' | 'None'
  checkingIntervalMins: number
  timeoutSecs: number
  deleteAfterImport: boolean
  notifyNonShortlisted: boolean
}

export const defaultMailboxSettings: MailboxSettings = {
  enabled: true,
  server: 'imap.satellitehr.in',
  username: 'applications@satellitehr.in',
  port: 993,
  encryption: 'SSL',
  checkingIntervalMins: 15,
  timeoutSecs: 60,
  deleteAfterImport: true,
  notifyNonShortlisted: false,
}

/** Pre-onboarding checklist question (TA-51). */
export interface ChecklistQuestion {
  id: string
  responseFrom: 'Candidate' | 'HR' | 'IT'
  question: string
  questionType: 'Objective' | 'Subjective'
  fieldType: 'Text' | 'Yes/No' | 'Date'
  displayType: 'Input' | 'Dropdown' | 'Checkbox'
  value: string
  mandatory: boolean
}

export const seedChecklistQuestions: ChecklistQuestion[] = [
  {
    id: 'cq-1',
    responseFrom: 'Candidate',
    question: 'Background verification consent received?',
    questionType: 'Objective',
    fieldType: 'Yes/No',
    displayType: 'Checkbox',
    value: 'Yes',
    mandatory: true,
  },
  {
    id: 'cq-2',
    responseFrom: 'HR',
    question: 'Identity documents collected',
    questionType: 'Subjective',
    fieldType: 'Text',
    displayType: 'Input',
    value: '',
    mandatory: true,
  },
  {
    id: 'cq-3',
    responseFrom: 'IT',
    question: 'Laptop & network access requested',
    questionType: 'Objective',
    fieldType: 'Yes/No',
    displayType: 'Checkbox',
    value: '',
    mandatory: false,
  },
]

/** Tenant-defined custom field (TA-26, TA-30). */
export interface CustomFieldDef {
  id: string
  entity: 'requisition' | 'candidate' | 'application'
  label: string
  fieldType: 'text' | 'number' | 'select'
  options?: string[]
  mandatory: boolean
  active: boolean
  version: number
  effectiveFrom: string
}

export const seedCustomFields: CustomFieldDef[] = [
  {
    id: 'cf-band',
    entity: 'requisition',
    label: 'Compensation band',
    fieldType: 'select',
    options: ['B1', 'B2', 'B3', 'B4'],
    mandatory: false,
    active: true,
    version: 2,
    effectiveFrom: '2026-04-01',
  },
  {
    id: 'cf-visa',
    entity: 'candidate',
    label: 'Work authorization',
    fieldType: 'text',
    mandatory: false,
    active: true,
    version: 1,
    effectiveFrom: '2026-01-01',
  },
  {
    id: 'cf-notice',
    entity: 'application',
    label: 'Notice period (days)',
    fieldType: 'number',
    mandatory: true,
    active: true,
    version: 1,
    effectiveFrom: '2026-01-01',
  },
]

/** Versioned approver-graph publications (TA-25). */
export interface ApproverGraphVersion {
  version: number
  author: string
  effectiveFrom: string
  summary: string
  status: 'active' | 'superseded' | 'draft'
}

export const seedApproverGraphVersions: ApproverGraphVersion[] = [
  {
    version: 1,
    author: 'Sunita Patil',
    effectiveFrom: '2026-01-01',
    summary: 'Single-level HR approval for all requisitions',
    status: 'superseded',
  },
  {
    version: 2,
    author: 'Sunita Patil',
    effectiveFrom: '2026-04-01',
    summary: 'Added Finance level; non-budgeted positions route to Priya Deshmukh',
    status: 'active',
  },
]

/** Platform-admin tenant provisioning (TA-21, TA-23). */
export interface Tenant {
  id: string
  name: string
  moduleEnabled: boolean
  calendarIntegration: boolean
  onboardingIntegration: boolean
  rlsActive: boolean
}

export const seedTenants: Tenant[] = [
  { id: 't-1', name: 'Aurora Retail Pvt Ltd', moduleEnabled: true, calendarIntegration: true, onboardingIntegration: true, rlsActive: true },
  { id: 't-2', name: 'Bluegrid Logistics', moduleEnabled: true, calendarIntegration: false, onboardingIntegration: true, rlsActive: true },
  { id: 't-3', name: 'Crestline Finserv', moduleEnabled: false, calendarIntegration: false, onboardingIntegration: false, rlsActive: true },
]

/** Shared-engine log entry (TA-27, TA-28, TA-29, TA-30). */
export interface EngineLogEntry {
  id: string
  at: string
  engine: 'workflow' | 'rules' | 'notification' | 'forms'
  event: string
  detail: string
  actor: string
}

export const seedEngineLog: EngineLogEntry[] = [
  {
    id: 'el-1',
    at: '2026-06-24T10:02:00Z',
    engine: 'workflow',
    event: 'Offer OFR-503 routed',
    detail: 'Out-of-band CTC matched rule oa-3 + out-of-band approver — routed to Rohit Bansal (L2)',
    actor: 'Workflow Engine',
  },
  {
    id: 'el-2',
    at: '2026-06-20T09:31:00Z',
    engine: 'notification',
    event: 'Offer released',
    detail: 'Template "Offer Released" v3 rendered and dispatched to kiran.rao@gmail.com (Email)',
    actor: 'Notification Engine',
  },
  {
    id: 'el-3',
    at: '2026-06-18T14:12:00Z',
    engine: 'rules',
    event: 'Stage gate evaluated',
    detail: 'app-01 → offer: 2/2 scorecards complete, 2/2 references complete — ALLOW',
    actor: 'Rules Engine',
  },
  {
    id: 'el-4',
    at: '2026-06-10T08:00:00Z',
    engine: 'forms',
    event: 'Requisition form rendered',
    detail: 'Rendered v2 field metadata (custom field "Compensation band" included)',
    actor: 'Forms Engine',
  },
]

/** Group-company governance standards (TA-19). */
export interface GroupStandard {
  id: string
  area: string
  standard: string
  override: 'not-allowed' | 'within-limits' | 'free'
}

export const seedGroupStandards: GroupStandard[] = [
  {
    id: 'gs-1',
    area: 'Requisition approvals',
    standard: 'Minimum 2 approval levels; Finance sign-off mandatory',
    override: 'not-allowed',
  },
  {
    id: 'gs-2',
    area: 'Offer templates',
    standard: 'Group master offer template v3 with statutory clauses',
    override: 'within-limits',
  },
  {
    id: 'gs-3',
    area: 'Scorecard criteria',
    standard: '4 core criteria with fixed weightings',
    override: 'within-limits',
  },
]

/** Portfolio-level company metrics (TA-20). */
export interface CompanyMetrics {
  company: string
  openRequisitions: number
  activeCandidates: number
  offersExtended: number
  offerAcceptanceRate: number
  avgTimeToHireDays: number
}

export const seedPortfolioMetrics: CompanyMetrics[] = [
  { company: 'Aurora Retail Pvt Ltd', openRequisitions: 14, activeCandidates: 86, offersExtended: 9, offerAcceptanceRate: 78, avgTimeToHireDays: 34 },
  { company: 'Bluegrid Logistics', openRequisitions: 6, activeCandidates: 31, offersExtended: 4, offerAcceptanceRate: 50, avgTimeToHireDays: 41 },
  { company: 'Crestline Finserv', openRequisitions: 9, activeCandidates: 44, offersExtended: 6, offerAcceptanceRate: 83, avgTimeToHireDays: 28 },
]

export const APPROVER_DIRECTORY = [
  'Sunita Patil',
  'Rohit Bansal',
  'Priya Deshmukh',
  'Divya Menon',
  'Karthik Rao',
  'Farhan Ali',
  'Ananya Sharma',
] as const
