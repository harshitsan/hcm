/**
 * Employees module — recognition, ratings, requests & compliance workflows
 * (Appreciations, Quadrant Ratings, Salary Revisions, Class Changes,
 * Disciplinary Actions, Acknowledgements).
 */

export interface AppreciationCategory {
  id: string
  name: string
  description: string
  points: number
}

export const seedAppreciationCategories: AppreciationCategory[] = [
  { id: 'ac-1', name: 'Customer Delight', description: 'Went above and beyond for a customer', points: 20 },
  { id: 'ac-2', name: 'Team Player', description: 'Outstanding collaboration across teams', points: 10 },
  { id: 'ac-3', name: 'Innovation', description: 'Proposed or shipped a novel improvement', points: 25 },
  { id: 'ac-4', name: 'Mentorship', description: 'Coached and grew a colleague', points: 15 },
]

export interface Appreciation {
  id: string
  employee: string
  department: string
  appreciatedBy: string
  category: string
  feedback: string
  points: number
  date: string
}

export const seedAppreciations: Appreciation[] = [
  {
    id: 'ap-1',
    employee: 'Rohit Menon',
    department: 'Engineering',
    appreciatedBy: 'Ananya Krishnan',
    category: 'Innovation',
    feedback: 'Automated the payroll reconciliation checks — saved 2 days/month.',
    points: 25,
    date: '2026-06-12',
  },
  {
    id: 'ap-2',
    employee: 'Sneha Patil',
    department: 'Engineering',
    appreciatedBy: 'Rohit Menon',
    category: 'Team Player',
    feedback: 'Jumped on the release hotfix over the weekend.',
    points: 10,
    date: '2026-06-18',
  },
  {
    id: 'ap-3',
    employee: 'Imran Qureshi',
    department: 'Operations',
    appreciatedBy: 'Vikram Shetty',
    category: 'Customer Delight',
    feedback: 'Turned around the Nagpur dispatch backlog in 48 hours.',
    points: 20,
    date: '2026-05-30',
  },
  {
    id: 'ap-4',
    employee: 'Rohit Menon',
    department: 'Engineering',
    appreciatedBy: 'Sneha Patil',
    category: 'Mentorship',
    feedback: 'Weekly pairing sessions made my probation so much smoother.',
    points: 15,
    date: '2026-04-25',
  },
]

export interface AppreciationSettings {
  notifyDayOfMonth: number
  scoreCalculationStart: string
}

export const QUADRANTS = [
  'Key Members',
  'High Skill / Low Attitude',
  'High Attitude / Low Skill',
  'Bad Performers',
] as const
export type Quadrant = (typeof QUADRANTS)[number]

export interface QuadrantRating {
  id: string
  employee: string
  manager: string
  month: string
  quadrant: Quadrant
  comment: string
}

export const seedQuadrantRatings: QuadrantRating[] = [
  {
    id: 'qr-1',
    employee: 'Rohit Menon',
    manager: 'Ananya Krishnan',
    month: '2026-05',
    quadrant: 'Key Members',
    comment: 'Consistently dependable; owns releases end-to-end.',
  },
  {
    id: 'qr-2',
    employee: 'Sneha Patil',
    manager: 'Rohit Menon',
    month: '2026-05',
    quadrant: 'High Attitude / Low Skill',
    comment: 'Great energy, ramping up on the codebase.',
  },
  {
    id: 'qr-3',
    employee: 'Grace D’Souza',
    manager: 'Ananya Krishnan',
    month: '2026-05',
    quadrant: 'High Attitude / Low Skill',
    comment: 'Eager learner, needs process depth.',
  },
]

export interface QuadrantConfig {
  frequency: 'Monthly' | 'Quarterly'
  periodStartDay: number
  reminderAfterDays: number
  completionDeadlineDays: number
}

export const SALARY_REVISION_STATUSES = [
  'Pending submission',
  'Pending approval',
  'Approved',
  'Need clarification',
] as const
export type SalaryRevisionStatus = (typeof SALARY_REVISION_STATUSES)[number]

export interface SalaryRevision {
  id: string
  employee: string
  department: string
  position: string
  revisionPeriod: string
  revisionDueDate: string
  status: SalaryRevisionStatus
  activeEmployee: boolean
}

export const seedSalaryRevisions: SalaryRevision[] = [
  {
    id: 'sr-1',
    employee: 'Rohit Menon',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    revisionPeriod: 'FY 2026-27 (April cycle)',
    revisionDueDate: '2026-07-15',
    status: 'Pending approval',
    activeEmployee: true,
  },
  {
    id: 'sr-2',
    employee: 'Imran Qureshi',
    department: 'Operations',
    position: 'Warehouse Supervisor',
    revisionPeriod: 'FY 2026-27 (April cycle)',
    revisionDueDate: '2026-07-20',
    status: 'Pending submission',
    activeEmployee: true,
  },
  {
    id: 'sr-3',
    employee: 'Kavya Reddy',
    department: 'Quality Assurance',
    position: 'QA Engineer',
    revisionPeriod: 'Confirmation revision',
    revisionDueDate: '2026-12-15',
    status: 'Pending submission',
    activeEmployee: true,
  },
  {
    id: 'sr-4',
    employee: 'Tarun Bhalla',
    department: 'Sales',
    position: 'Sales Executive',
    revisionPeriod: 'FY 2025-26 (April cycle)',
    revisionDueDate: '2025-07-15',
    status: 'Approved',
    activeEmployee: false,
  },
]

export const CLASS_CHANGE_STATUSES = [
  'Pending approval',
  'Approved',
  'Rejected',
  'Cancelled',
] as const
export type ClassChangeStatus = (typeof CLASS_CHANGE_STATUSES)[number]

export interface ClassChangeRequest {
  id: string
  employee: string
  originalClass: string
  destinationClass: string
  oldDepartment: string
  newDepartment: string
  oldPosition: string
  newPosition: string
  requestedOn: string
  status: ClassChangeStatus
}

export const seedClassChanges: ClassChangeRequest[] = [
  {
    id: 'cc-1',
    employee: 'Sneha Patil',
    originalClass: 'Probationer',
    destinationClass: 'Permanent',
    oldDepartment: 'Engineering',
    newDepartment: 'Engineering',
    oldPosition: 'Software Engineer',
    newPosition: 'Software Engineer',
    requestedOn: '2026-06-20',
    status: 'Pending approval',
  },
  {
    id: 'cc-2',
    employee: 'Imran Qureshi',
    originalClass: 'Contract',
    destinationClass: 'Permanent',
    oldDepartment: 'Operations',
    newDepartment: 'Supply Chain',
    oldPosition: 'Warehouse Supervisor',
    newPosition: 'Operations Lead',
    requestedOn: '2026-05-11',
    status: 'Pending approval',
  },
  {
    id: 'cc-3',
    employee: 'Grace D’Souza',
    originalClass: 'Trainee',
    destinationClass: 'Probationer',
    oldDepartment: 'Human Resources',
    newDepartment: 'Human Resources',
    oldPosition: 'HR Executive',
    newPosition: 'HR Executive',
    requestedOn: '2026-04-02',
    status: 'Approved',
  },
]

export interface ClassChangeApproverRule {
  id: string
  location: string
  approvers: string
  offerApprover: string
}

export const seedApproverRules: ClassChangeApproverRule[] = [
  {
    id: 'ar-1',
    location: 'Bengaluru HQ',
    approvers: 'Ananya Krishnan, Vikram Shetty',
    offerApprover: 'Vikram Shetty',
  },
  {
    id: 'ar-2',
    location: 'Hyderabad Hub',
    approvers: 'Deepa Raghavan',
    offerApprover: 'Deepa Raghavan',
  },
  {
    id: 'ar-3',
    location: 'Pune Plant',
    approvers: 'Nilesh Kadam, Deepa Raghavan',
    offerApprover: 'Deepa Raghavan',
  },
]

export const DISCIPLINARY_STATUSES = [
  'Pending approval',
  'Approved',
  'Letter generated',
  'Rejected',
  'Withdrawn',
] as const
export type DisciplinaryStatus = (typeof DISCIPLINARY_STATUSES)[number]

export interface DisciplinaryAction {
  id: string
  employee: string
  department: string
  actionType: string
  details: string
  raisedOn: string
  status: DisciplinaryStatus
  activeEmployee: boolean
}

export const seedDisciplinaryActions: DisciplinaryAction[] = [
  {
    id: 'da-1',
    employee: 'Tarun Bhalla',
    department: 'Sales',
    actionType: 'Written warning',
    details: 'Repeated late submission of expense reports despite reminders.',
    raisedOn: '2026-02-14',
    status: 'Letter generated',
    activeEmployee: false,
  },
  {
    id: 'da-2',
    employee: 'Imran Qureshi',
    department: 'Operations',
    actionType: 'Counselling note',
    details: 'Safety-gear compliance lapse at Nagpur depot on 2026-06-02.',
    raisedOn: '2026-06-04',
    status: 'Pending approval',
    activeEmployee: true,
  },
]

export const ACK_STATUSES = ['Pending', 'Acknowledged', 'Expired'] as const
export type AckStatus = (typeof ACK_STATUSES)[number]

export const ACK_TEMPLATE_TYPES = [
  'Offer',
  'Joining',
  'Appointment',
  'Policy Document',
] as const
export type AckTemplateType = (typeof ACK_TEMPLATE_TYPES)[number]

export interface Acknowledgement {
  id: string
  document: string
  templateType: AckTemplateType
  department: string
  issuedOn: string
  expiresOn: string
  acknowledgedOn: string | null
  status: AckStatus
}

export const seedAcknowledgements: Acknowledgement[] = [
  {
    id: 'ack-1',
    document: 'POSH Policy 2026',
    templateType: 'Policy Document',
    department: 'Engineering',
    issuedOn: '2026-06-10',
    expiresOn: '2026-07-10',
    acknowledgedOn: null,
    status: 'Pending',
  },
  {
    id: 'ack-2',
    document: 'Appointment Letter — Senior Software Engineer',
    templateType: 'Appointment',
    department: 'Engineering',
    issuedOn: '2026-01-05',
    expiresOn: '2026-02-05',
    acknowledgedOn: '2026-01-06',
    status: 'Acknowledged',
  },
  {
    id: 'ack-3',
    document: 'Remote Work Policy v4',
    templateType: 'Policy Document',
    department: 'Engineering',
    issuedOn: '2026-03-01',
    expiresOn: '2026-04-01',
    acknowledgedOn: null,
    status: 'Expired',
  },
  {
    id: 'ack-4',
    document: 'Code of Conduct 2026',
    templateType: 'Policy Document',
    department: 'Human Resources',
    issuedOn: '2026-06-25',
    expiresOn: '2026-07-25',
    acknowledgedOn: null,
    status: 'Pending',
  },
]

export interface AckConfig {
  id: string
  locations: string
  templateType: AckTemplateType
}

export const seedAckConfigs: AckConfig[] = [
  { id: 'akc-1', locations: 'All locations', templateType: 'Policy Document' },
  { id: 'akc-2', locations: 'Bengaluru HQ, Mumbai Office', templateType: 'Appointment' },
  { id: 'akc-3', locations: 'All locations', templateType: 'Offer' },
]
