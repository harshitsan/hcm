/** Onboarding cases — task-driven workflow with 5 mandatory ordered stages. */

export const ONBOARDING_STAGES = [
  'Offer Acceptance',
  'Document Submission',
  'Document Verification',
  'Asset Assignment',
  'Induction Completion',
] as const

export type OnboardingStage = (typeof ONBOARDING_STAGES)[number]

export type DocumentStatus =
  | 'missing'
  | 'submitted'
  | 'correction-requested'
  | 'verified'

export interface OnboardingDocument {
  id: string
  name: string
  required: boolean
  status: DocumentStatus
}

export interface OnboardingAsset {
  id: string
  name: string
  assigned: boolean
}

export type OnboardingStatus = 'in-progress' | 'completed'

export interface OnboardingCase {
  id: string
  employeeName: string
  employeeCode: string
  department: string
  location: string
  company: string
  /** False = Employee (Non-User): admin records actions on their behalf. */
  portalUser: boolean
  startDate: string
  /** Template version the workflow was instantiated from (kept for in-flight cases). */
  templateVersion: string
  currentStage: OnboardingStage
  status: OnboardingStatus
  offerAccepted: boolean
  documents: OnboardingDocument[]
  assets: OnboardingAsset[]
  inductionComplete: boolean
}

const docs = (
  entries: [string, boolean, DocumentStatus][]
): OnboardingDocument[] =>
  entries.map(([name, required, status], i) => ({
    id: `d${i + 1}`,
    name,
    required,
    status,
  }))

const assets = (entries: [string, boolean][]): OnboardingAsset[] =>
  entries.map(([name, assigned], i) => ({ id: `a${i + 1}`, name, assigned }))

export const STANDARD_DOCS: [string, boolean][] = [
  ['Signed offer letter', true],
  ['Government ID proof', true],
  ['Education certificates', true],
  ['Previous employer relieving letter', false],
]

export const STANDARD_ASSETS = ['Laptop', 'Access card', 'HRMS account']

export const seedOnboarding: OnboardingCase[] = [
  {
    id: 'onb-1001',
    employeeName: 'Rohan Verma',
    employeeCode: 'EMP-2411',
    department: 'Engineering',
    location: 'Hyderabad',
    company: 'Aurora Software India',
    portalUser: true,
    startDate: '2026-06-22',
    templateVersion: 'v2',
    currentStage: 'Document Submission',
    status: 'in-progress',
    offerAccepted: true,
    documents: docs([
      ['Signed offer letter', true, 'submitted'],
      ['Government ID proof', true, 'missing'],
      ['Education certificates', true, 'missing'],
      ['Previous employer relieving letter', false, 'missing'],
    ]),
    assets: assets([
      ['Laptop', false],
      ['Access card', false],
      ['HRMS account', false],
    ]),
    inductionComplete: false,
  },
  {
    id: 'onb-1002',
    employeeName: 'Kavya Menon',
    employeeCode: 'EMP-2412',
    department: 'Finance',
    location: 'Bengaluru',
    company: 'Aurora Software India',
    portalUser: true,
    startDate: '2026-06-15',
    templateVersion: 'v2',
    currentStage: 'Document Verification',
    status: 'in-progress',
    offerAccepted: true,
    documents: docs([
      ['Signed offer letter', true, 'verified'],
      ['Government ID proof', true, 'submitted'],
      ['Education certificates', true, 'correction-requested'],
      ['Previous employer relieving letter', false, 'submitted'],
    ]),
    assets: assets([
      ['Laptop', false],
      ['Access card', false],
      ['HRMS account', false],
    ]),
    inductionComplete: false,
  },
  {
    id: 'onb-1003',
    employeeName: 'Sunil Patil',
    employeeCode: 'EMP-2413',
    department: 'Operations',
    location: 'Pune',
    company: 'Helix Manufacturing',
    portalUser: false,
    startDate: '2026-06-29',
    templateVersion: 'v2',
    currentStage: 'Offer Acceptance',
    status: 'in-progress',
    offerAccepted: false,
    documents: docs([
      ['Signed offer letter', true, 'missing'],
      ['Government ID proof', true, 'missing'],
      ['Education certificates', true, 'missing'],
      ['Previous employer relieving letter', false, 'missing'],
    ]),
    assets: assets([
      ['Safety kit', false],
      ['Access card', false],
      ['HRMS account', false],
    ]),
    inductionComplete: false,
  },
  {
    id: 'onb-1004',
    employeeName: 'Lena Fischer',
    employeeCode: 'EMP-2414',
    department: 'Sales',
    location: 'Austin',
    company: 'Aurora Software US',
    portalUser: true,
    startDate: '2026-06-08',
    templateVersion: 'v1',
    currentStage: 'Asset Assignment',
    status: 'in-progress',
    offerAccepted: true,
    documents: docs([
      ['Signed offer letter', true, 'verified'],
      ['Government ID proof', true, 'verified'],
      ['Education certificates', true, 'verified'],
      ['Previous employer relieving letter', false, 'verified'],
    ]),
    assets: assets([
      ['Laptop', true],
      ['Access card', false],
      ['HRMS account', false],
    ]),
    inductionComplete: false,
  },
  {
    id: 'onb-1005',
    employeeName: 'Arjun Rao',
    employeeCode: 'EMP-2415',
    department: 'Engineering',
    location: 'Hyderabad',
    company: 'Aurora Software India',
    portalUser: true,
    startDate: '2026-06-01',
    templateVersion: 'v1',
    currentStage: 'Induction Completion',
    status: 'in-progress',
    offerAccepted: true,
    documents: docs([
      ['Signed offer letter', true, 'verified'],
      ['Government ID proof', true, 'verified'],
      ['Education certificates', true, 'verified'],
      ['Previous employer relieving letter', false, 'verified'],
    ]),
    assets: assets([
      ['Laptop', true],
      ['Access card', true],
      ['HRMS account', true],
    ]),
    inductionComplete: false,
  },
  {
    id: 'onb-1006',
    employeeName: 'Grace Obi',
    employeeCode: 'EMP-2401',
    department: 'Human Resources',
    location: 'Bengaluru',
    company: 'Aurora Software India',
    portalUser: true,
    startDate: '2026-05-11',
    templateVersion: 'v1',
    currentStage: 'Induction Completion',
    status: 'completed',
    offerAccepted: true,
    documents: docs([
      ['Signed offer letter', true, 'verified'],
      ['Government ID proof', true, 'verified'],
      ['Education certificates', true, 'verified'],
      ['Previous employer relieving letter', false, 'verified'],
    ]),
    assets: assets([
      ['Laptop', true],
      ['Access card', true],
      ['HRMS account', true],
    ]),
    inductionComplete: true,
  },
  {
    id: 'onb-1007',
    employeeName: 'Tomás Silva',
    employeeCode: 'EMP-2416',
    department: 'IT Support',
    location: 'Pune',
    company: 'Aurora Software India',
    portalUser: false,
    startDate: '2026-06-25',
    templateVersion: 'v2',
    currentStage: 'Document Submission',
    status: 'in-progress',
    offerAccepted: true,
    documents: docs([
      ['Signed offer letter', true, 'submitted'],
      ['Government ID proof', true, 'submitted'],
      ['Education certificates', true, 'missing'],
      ['Previous employer relieving letter', false, 'missing'],
    ]),
    assets: assets([
      ['Laptop', false],
      ['Access card', false],
      ['HRMS account', false],
    ]),
    inductionComplete: false,
  },
  {
    id: 'onb-1008',
    employeeName: 'Nadia Rahman',
    employeeCode: 'EMP-2417',
    department: 'Finance',
    location: 'Austin',
    company: 'Aurora Software US',
    portalUser: true,
    startDate: '2026-07-06',
    templateVersion: 'v2',
    currentStage: 'Offer Acceptance',
    status: 'in-progress',
    offerAccepted: false,
    documents: docs([
      ['Signed offer letter', true, 'missing'],
      ['Government ID proof', true, 'missing'],
      ['Education certificates', true, 'missing'],
      ['Previous employer relieving letter', false, 'missing'],
    ]),
    assets: assets([
      ['Laptop', false],
      ['Access card', false],
      ['HRMS account', false],
    ]),
    inductionComplete: false,
  },
]
