/**
 * HR Letters & Certificates — canonical types + seed data.
 * Covers the eight standard HR document types (HLC-01), agreement letters
 * (HLC-28), merge fields (HLC-02), template versioning (HLC-18), and the
 * generated-document lifecycle with versions, distribution tracking, and an
 * immutable audit trail (HLC-03..HLC-11, HLC-17).
 */

export const HR_DOC_TYPES = [
  'Appointment Letter',
  'Confirmation Letter',
  'Transfer Letter',
  'Promotion Letter',
  'Relieving Letter',
  'Experience Certificate',
  'Address Proof',
  'Employment Verification',
] as const
export type HrDocType = (typeof HR_DOC_TYPES)[number]

export const AGREEMENT_TYPES = [
  'Certification Agreement Letter',
  'Training Agreement Letter',
] as const
export type AgreementType = (typeof AGREEMENT_TYPES)[number]

export const ALL_DOC_KINDS = [...HR_DOC_TYPES, ...AGREEMENT_TYPES] as const
export type DocKind = HrDocType | AgreementType

export const WORKFLOW_EVENTS = [
  'Hire',
  'Confirmation',
  'Transfer',
  'Promotion',
  'Relieving',
] as const
export type WorkflowEvent = (typeof WORKFLOW_EVENTS)[number]

/** Which document type an auto-generation workflow event produces (HLC-04). */
export const EVENT_DOC_TYPE: Record<WorkflowEvent, HrDocType> = {
  Hire: 'Appointment Letter',
  Confirmation: 'Confirmation Letter',
  Transfer: 'Transfer Letter',
  Promotion: 'Promotion Letter',
  Relieving: 'Relieving Letter',
}

export const SIGNING_AUTHORITIES = [
  'HR Director — Meera Krishnan',
  'CHRO — Rajiv Malhotra',
  'VP People Ops — Sarah D’Souza',
] as const

export const COMPANY_NAME = 'Kensium Solutions'
export const COMPANY_ADDRESS = 'Plot 12, HITEC City, Hyderabad 500081'

export interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string
  company: string
  hasAppAccess: boolean
  customFields: Record<string, string>
  /** Simulated bad mailbox — email dispatch fails for this person (HLC-09). */
  emailBounces?: boolean
  /** Simulated incomplete record — batch generation reports a failure (HLC-05). */
  recordIncomplete?: boolean
}

/** The signed-in person when the role switcher is "Employee (User)". */
export const ME_USER_ID = 'emp-3'
/** The person represented by the "Employee (Non-User)" role (no app login). */
export const ME_NON_USER_ID = 'emp-6'

export const EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Arjun Mehta', email: 'arjun.mehta@kensium.com', position: 'Senior Software Engineer', department: 'Engineering', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days', grade: 'L4' } },
  { id: 'emp-2', name: 'Priya Sharma', email: 'priya.sharma@kensium.com', position: 'HR Executive', department: 'Human Resources', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '30 days', grade: 'L2' } },
  { id: 'emp-3', name: 'Ananya Iyer', email: 'ananya.iyer@kensium.com', position: 'Product Designer', department: 'Design', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '45 days', grade: 'L3' } },
  { id: 'emp-4', name: 'Rohan Verma', email: 'rohan.verma@kensium.com', position: 'QA Lead', department: 'Quality', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days', grade: 'L4' } },
  { id: 'emp-5', name: 'Kavitha Reddy', email: 'kavitha.reddy@kensium.com', position: 'Finance Analyst', department: 'Finance', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '30 days', grade: 'L2' } },
  { id: 'emp-6', name: 'Suresh Patil', email: 'suresh.patil@kensium.com', position: 'Field Technician', department: 'Operations', company: COMPANY_NAME, hasAppAccess: false, customFields: { noticePeriod: '15 days', grade: 'L1' } },
  { id: 'emp-7', name: 'Neha Gupta', email: 'neha.gupta@kensium.com', position: 'Marketing Manager', department: 'Marketing', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days', grade: 'L5' } },
  { id: 'emp-8', name: 'Vikram Singh', email: 'vikram.singh@kensium.com', position: 'DevOps Engineer', department: 'Engineering', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days' }, recordIncomplete: true },
  { id: 'emp-9', name: 'Fatima Khan', email: 'fatima.khan@kensium.com', position: 'Recruiter', department: 'Talent Acquisition', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '30 days', grade: 'L2' } },
  { id: 'emp-10', name: 'Deepak Nair', email: 'deepak.nair@kensium.com', position: 'Warehouse Associate', department: 'Operations', company: COMPANY_NAME, hasAppAccess: false, customFields: { noticePeriod: '15 days', grade: 'L1' }, emailBounces: true },
]

/* ------------------------------ Merge fields ------------------------------ */

export type MergeFieldSource = 'Employee' | 'Position' | 'Company' | 'Custom'

export interface MergeField {
  token: string
  source: MergeFieldSource
  label: string
}

export const MERGE_FIELDS: MergeField[] = [
  { token: '{{employee.name}}', source: 'Employee', label: 'Employee name' },
  { token: '{{employee.email}}', source: 'Employee', label: 'Employee email' },
  { token: '{{employee.id}}', source: 'Employee', label: 'Employee ID' },
  { token: '{{position.title}}', source: 'Position', label: 'Position title' },
  { token: '{{position.department}}', source: 'Position', label: 'Department' },
  { token: '{{company.name}}', source: 'Company', label: 'Company name' },
  { token: '{{company.address}}', source: 'Company', label: 'Company address' },
  { token: '{{custom.noticePeriod}}', source: 'Custom', label: 'Notice period (custom)' },
  { token: '{{custom.grade}}', source: 'Custom', label: 'Grade (custom)' },
]

export type MissingValueBehavior = 'blank' | 'flagged'

/**
 * Shared render engine (HLC-19): binds each merge field to employee, position,
 * company, and custom-field data. Missing values follow the configured
 * behavior (blank or flagged) instead of leaking the raw token.
 */
export function renderBody(
  body: string,
  employee: Employee,
  behavior: MissingValueBehavior
): string {
  const values: Record<string, string | undefined> = {
    '{{employee.name}}': employee.name,
    '{{employee.email}}': employee.email,
    '{{employee.id}}': employee.id,
    '{{position.title}}': employee.recordIncomplete
      ? undefined
      : employee.position,
    '{{position.department}}': employee.department,
    '{{company.name}}': employee.company,
    '{{company.address}}': COMPANY_ADDRESS,
    '{{custom.noticePeriod}}': employee.customFields['noticePeriod'],
    '{{custom.grade}}': employee.customFields['grade'],
  }
  return body.replace(/\{\{[a-zA-Z.]+\}\}/g, (token) => {
    const value = values[token]
    if (value) return value
    return behavior === 'blank' ? '' : `[MISSING: ${token}]`
  })
}

/* ------------------------------- Templates -------------------------------- */

export const TEMPLATE_LAYOUTS = ['Classic', 'Modern', 'Compact'] as const
export type TemplateLayout = (typeof TEMPLATE_LAYOUTS)[number]

export interface TemplateVersion {
  version: number
  effectiveFrom: string
  editedBy: string
  summary: string
}

export interface LetterTemplate {
  id: string
  docType: DocKind
  name: string
  body: string
  layout: TemplateLayout
  letterhead: boolean
  requiresApproval: boolean
  requiresAcknowledgment: boolean
  signingAuthority: string
  missingValueBehavior: MissingValueBehavior
  currentVersion: number
  versions: TemplateVersion[]
  updatedOn: string
}

const v = (
  version: number,
  effectiveFrom: string,
  summary: string
): TemplateVersion => ({
  version,
  effectiveFrom,
  editedBy: 'Lakshmi Rao (Company Admin)',
  summary,
})

export const seedTemplates: LetterTemplate[] = [
  {
    id: 'tpl-appt',
    docType: 'Appointment Letter',
    name: 'Standard Appointment Letter',
    body: 'Dear {{employee.name}},\n\nWe are pleased to appoint you as {{position.title}} in the {{position.department}} department of {{company.name}}, {{company.address}}. Your notice period is {{custom.noticePeriod}} and your grade is {{custom.grade}}.\n\nWe look forward to a rewarding association.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[1],
    missingValueBehavior: 'flagged',
    currentVersion: 3,
    versions: [
      v(1, '2025-04-01', 'Initial template'),
      v(2, '2025-11-10', 'Added grade merge field'),
      v(3, '2026-03-01', 'Refreshed branding and letterhead'),
    ],
    updatedOn: '2026-03-01',
  },
  {
    id: 'tpl-conf',
    docType: 'Confirmation Letter',
    name: 'Probation Confirmation Letter',
    body: 'Dear {{employee.name}},\n\nWe are happy to confirm your services as {{position.title}} with effect from the confirmation date. Your continued grade is {{custom.grade}}.\n\nCongratulations from {{company.name}}.',
    layout: 'Modern',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    missingValueBehavior: 'flagged',
    currentVersion: 2,
    versions: [
      v(1, '2025-05-15', 'Initial template'),
      v(2, '2026-01-20', 'Simplified confirmation wording'),
    ],
    updatedOn: '2026-01-20',
  },
  {
    id: 'tpl-trans',
    docType: 'Transfer Letter',
    name: 'Internal Transfer Letter',
    body: 'Dear {{employee.name}},\n\nThis letter confirms your transfer within {{company.name}}. You will continue as {{position.title}} reporting to the {{position.department}} leadership at the new location.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    missingValueBehavior: 'blank',
    currentVersion: 1,
    versions: [v(1, '2025-06-01', 'Initial template')],
    updatedOn: '2025-06-01',
  },
  {
    id: 'tpl-promo',
    docType: 'Promotion Letter',
    name: 'Promotion Letter',
    body: 'Dear {{employee.name}},\n\nIn recognition of your performance, {{company.name}} is pleased to promote you. Your revised grade is {{custom.grade}} and your role remains within {{position.department}}.',
    layout: 'Modern',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[1],
    missingValueBehavior: 'flagged',
    currentVersion: 2,
    versions: [
      v(1, '2025-04-01', 'Initial template'),
      v(2, '2025-12-05', 'Added revised-grade merge field'),
    ],
    updatedOn: '2025-12-05',
  },
  {
    id: 'tpl-reliev',
    docType: 'Relieving Letter',
    name: 'Relieving Letter',
    body: 'Dear {{employee.name}},\n\nThis is to confirm that you have been relieved from your duties as {{position.title}} at {{company.name}}. We wish you success in your future endeavours.',
    layout: 'Compact',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    missingValueBehavior: 'blank',
    currentVersion: 1,
    versions: [v(1, '2025-07-10', 'Initial template')],
    updatedOn: '2025-07-10',
  },
  {
    id: 'tpl-exp',
    docType: 'Experience Certificate',
    name: 'Experience Certificate',
    body: 'TO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that {{employee.name}} ({{employee.id}}) worked with {{company.name}} as {{position.title}} in the {{position.department}} department. Their conduct was found to be professional.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    missingValueBehavior: 'flagged',
    currentVersion: 2,
    versions: [
      v(1, '2025-04-01', 'Initial template'),
      v(2, '2026-02-14', 'Standard certification wording'),
    ],
    updatedOn: '2026-02-14',
  },
  {
    id: 'tpl-addr',
    docType: 'Address Proof',
    name: 'Address Proof Letter',
    body: 'TO WHOMSOEVER IT MAY CONCERN\n\nThis certifies that {{employee.name}} is employed with {{company.name}}, {{company.address}}, as {{position.title}}. This letter is issued for address-proof purposes.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[2],
    missingValueBehavior: 'blank',
    currentVersion: 1,
    versions: [v(1, '2025-08-01', 'Initial template')],
    updatedOn: '2025-08-01',
  },
  {
    id: 'tpl-emp-ver',
    docType: 'Employment Verification',
    name: 'Employment Verification Letter',
    body: 'TO WHOMSOEVER IT MAY CONCERN\n\n{{company.name}} verifies that {{employee.name}} ({{employee.email}}) is a current employee holding the position of {{position.title}}, {{position.department}}.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[2],
    missingValueBehavior: 'blank',
    currentVersion: 1,
    versions: [v(1, '2025-08-01', 'Initial template')],
    updatedOn: '2025-08-01',
  },
  {
    id: 'tpl-cert-agr',
    docType: 'Certification Agreement Letter',
    name: 'Certification Agreement',
    body: 'Dear {{employee.name}},\n\n{{company.name}} will sponsor your professional certification. By signing, you agree to serve a minimum of 12 months post-certification or reimburse the sponsorship. Notice period on file: {{custom.noticePeriod}}.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: true,
    signingAuthority: SIGNING_AUTHORITIES[1],
    missingValueBehavior: 'flagged',
    currentVersion: 2,
    versions: [
      v(1, '2025-09-01', 'Initial agreement'),
      v(2, '2026-04-02', 'Updated service-commitment clause'),
    ],
    updatedOn: '2026-04-02',
  },
  {
    id: 'tpl-train-agr',
    docType: 'Training Agreement Letter',
    name: 'Training Agreement',
    body: 'Dear {{employee.name}},\n\nYou have been nominated for sponsored training by {{company.name}}. By acknowledging this agreement you accept the training bond terms applicable to grade {{custom.grade}}.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: true,
    signingAuthority: SIGNING_AUTHORITIES[0],
    missingValueBehavior: 'flagged',
    currentVersion: 1,
    versions: [v(1, '2025-10-01', 'Initial agreement')],
    updatedOn: '2025-10-01',
  },
]

/* --------------------------- Generated documents --------------------------- */

export type DocStatus =
  | 'pending-approval'
  | 'approved'
  | 'rejected'
  | 'distributed'

export type Channel = 'email' | 'in-app' | 'print'
export type DeliveryOutcome = 'sent' | 'delivered' | 'failed'
export type GenerationTrigger = 'manual' | 'auto' | 'batch'

export interface DocVersion {
  version: number
  generatedOn: string
  event: string
  templateVersion: number
  current: boolean
}

export interface Distribution {
  id: string
  channel: Channel
  sentOn: string
  outcome: DeliveryOutcome
  detail: string
}

export interface AuditEntry {
  on: string
  actor: string
  action: string
  detail: string
}

export interface QuestionnaireAnswer {
  question: string
  answer: string
}

export interface HrDocument {
  id: string
  docType: DocKind
  employeeId: string
  employeeName: string
  employeeHasAppAccess: boolean
  status: DocStatus
  trigger: GenerationTrigger
  event: string
  generatedOn: string
  generatedBy: string
  templateId: string
  templateVersion: number
  signingAuthority: string
  requiresAcknowledgment: boolean
  acknowledgedOn: string | null
  retentionUntil: string
  rejectReason: string | null
  versions: DocVersion[]
  distributions: Distribution[]
  audit: AuditEntry[]
  questionnaireAnswers: QuestionnaireAnswer[]
  company: string
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 7-year retention window from the generation date (HLC-11). */
export function retentionUntilFrom(dateIso: string): string {
  const d = new Date(dateIso)
  d.setFullYear(d.getFullYear() + 7)
  return d.toISOString().slice(0, 10)
}

const audit = (
  on: string,
  actor: string,
  action: string,
  detail: string
): AuditEntry => ({ on, actor, action, detail })

export const seedDocuments: HrDocument[] = [
  {
    id: 'hrl-1001',
    docType: 'Appointment Letter',
    employeeId: 'emp-1',
    employeeName: 'Arjun Mehta',
    employeeHasAppAccess: true,
    status: 'distributed',
    trigger: 'auto',
    event: 'Hire',
    generatedOn: '2026-04-06',
    generatedBy: 'Workflow engine',
    templateId: 'tpl-appt',
    templateVersion: 3,
    signingAuthority: SIGNING_AUTHORITIES[1],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-04-06',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-04-06', event: 'Hire', templateVersion: 3, current: true },
    ],
    distributions: [
      { id: 'dst-1', channel: 'email', sentOn: '2026-04-08', outcome: 'delivered', detail: 'arjun.mehta@kensium.com' },
      { id: 'dst-2', channel: 'in-app', sentOn: '2026-04-08', outcome: 'delivered', detail: 'Available in employee portal' },
    ],
    audit: [
      audit('2026-04-06', 'Workflow engine', 'Generated', 'Auto-generated on Hire event, template v3'),
      audit('2026-04-07', 'Lakshmi Rao', 'Approved', 'Single-step approval completed'),
      audit('2026-04-08', 'Notification engine', 'Distributed', 'Email + in-app dispatch'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1002',
    docType: 'Confirmation Letter',
    employeeId: 'emp-4',
    employeeName: 'Rohan Verma',
    employeeHasAppAccess: true,
    status: 'pending-approval',
    trigger: 'auto',
    event: 'Confirmation',
    generatedOn: '2026-06-24',
    generatedBy: 'Workflow engine',
    templateId: 'tpl-conf',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-24',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-24', event: 'Confirmation', templateVersion: 2, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-24', 'Workflow engine', 'Generated', 'Auto-generated on Confirmation event, template v2'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1003',
    docType: 'Promotion Letter',
    employeeId: 'emp-7',
    employeeName: 'Neha Gupta',
    employeeHasAppAccess: true,
    status: 'approved',
    trigger: 'manual',
    event: 'Promotion',
    generatedOn: '2026-06-18',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-promo',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[1],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-18',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-18', event: 'Promotion', templateVersion: 2, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-18', 'Lakshmi Rao', 'Generated', 'Manual generation, template v2'),
      audit('2026-06-20', 'Meera Krishnan', 'Approved', 'Ready for distribution'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1004',
    docType: 'Experience Certificate',
    employeeId: 'emp-2',
    employeeName: 'Priya Sharma',
    employeeHasAppAccess: true,
    status: 'distributed',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-05-11',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-exp',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-05-11',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-05-11', event: 'On request', templateVersion: 2, current: false },
      { version: 2, generatedOn: '2026-05-19', event: 'Reissue — name correction', templateVersion: 2, current: true },
    ],
    distributions: [
      { id: 'dst-3', channel: 'email', sentOn: '2026-05-19', outcome: 'delivered', detail: 'priya.sharma@kensium.com' },
    ],
    audit: [
      audit('2026-05-11', 'Lakshmi Rao', 'Generated', 'Manual generation, template v2'),
      audit('2026-05-19', 'Lakshmi Rao', 'Reissued', 'Version 2 issued for name correction; v1 retained'),
      audit('2026-05-19', 'Notification engine', 'Distributed', 'Email dispatch'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1005',
    docType: 'Address Proof',
    employeeId: 'emp-3',
    employeeName: 'Ananya Iyer',
    employeeHasAppAccess: true,
    status: 'distributed',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-06-02',
    generatedBy: 'Priya Sharma',
    templateId: 'tpl-addr',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[2],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-02',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-02', event: 'On request', templateVersion: 1, current: true },
    ],
    distributions: [
      { id: 'dst-4', channel: 'in-app', sentOn: '2026-06-02', outcome: 'delivered', detail: 'Available in employee portal' },
    ],
    audit: [
      audit('2026-06-02', 'Priya Sharma', 'Generated', 'No approval required — finalized directly'),
      audit('2026-06-02', 'Notification engine', 'Distributed', 'In-app access enabled'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1006',
    docType: 'Employment Verification',
    employeeId: 'emp-3',
    employeeName: 'Ananya Iyer',
    employeeHasAppAccess: true,
    status: 'approved',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-06-25',
    generatedBy: 'Priya Sharma',
    templateId: 'tpl-emp-ver',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[2],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-25',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-25', event: 'On request', templateVersion: 1, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-25', 'Priya Sharma', 'Generated', 'No approval required — finalized directly'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1007',
    docType: 'Transfer Letter',
    employeeId: 'emp-8',
    employeeName: 'Vikram Singh',
    employeeHasAppAccess: true,
    status: 'rejected',
    trigger: 'auto',
    event: 'Transfer',
    generatedOn: '2026-06-15',
    generatedBy: 'Workflow engine',
    templateId: 'tpl-trans',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[0],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-15',
    rejectReason: 'New location details are incorrect — regenerate after data fix.',
    versions: [
      { version: 1, generatedOn: '2026-06-15', event: 'Transfer', templateVersion: 1, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-15', 'Workflow engine', 'Generated', 'Auto-generated on Transfer event, template v1'),
      audit('2026-06-17', 'Meera Krishnan', 'Rejected', 'Originator notified to correct and regenerate'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1008',
    docType: 'Relieving Letter',
    employeeId: 'emp-5',
    employeeName: 'Kavitha Reddy',
    employeeHasAppAccess: true,
    status: 'pending-approval',
    trigger: 'auto',
    event: 'Relieving',
    generatedOn: '2026-06-26',
    generatedBy: 'Workflow engine',
    templateId: 'tpl-reliev',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[0],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-26',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-26', event: 'Relieving', templateVersion: 1, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-26', 'Workflow engine', 'Generated', 'Auto-generated on Relieving event, template v1'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1009',
    docType: 'Appointment Letter',
    employeeId: 'emp-10',
    employeeName: 'Deepak Nair',
    employeeHasAppAccess: false,
    status: 'distributed',
    trigger: 'batch',
    event: 'Hire',
    generatedOn: '2026-05-04',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-appt',
    templateVersion: 3,
    signingAuthority: SIGNING_AUTHORITIES[1],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-05-04',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-05-04', event: 'Hire', templateVersion: 3, current: true },
    ],
    distributions: [
      { id: 'dst-5', channel: 'email', sentOn: '2026-05-06', outcome: 'failed', detail: 'Mailbox unavailable — retry or use another channel' },
      { id: 'dst-6', channel: 'print', sentOn: '2026-05-07', outcome: 'sent', detail: 'Print-ready copy handed to Operations' },
    ],
    audit: [
      audit('2026-05-04', 'Lakshmi Rao', 'Generated', 'Batch generation, template v3'),
      audit('2026-05-05', 'Meera Krishnan', 'Approved', 'Single-step approval completed'),
      audit('2026-05-06', 'Notification engine', 'Delivery failed', 'Email bounced'),
      audit('2026-05-07', 'Notification engine', 'Re-sent', 'Print channel used after email failure'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1010',
    docType: 'Experience Certificate',
    employeeId: 'emp-6',
    employeeName: 'Suresh Patil',
    employeeHasAppAccess: false,
    status: 'distributed',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-06-10',
    generatedBy: 'Priya Sharma',
    templateId: 'tpl-exp',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-10',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-10', event: 'On request', templateVersion: 2, current: true },
    ],
    distributions: [
      { id: 'dst-7', channel: 'email', sentOn: '2026-06-10', outcome: 'delivered', detail: 'suresh.patil@kensium.com' },
    ],
    audit: [
      audit('2026-06-10', 'Priya Sharma', 'Generated', 'Employee has no app access — email channel chosen'),
      audit('2026-06-10', 'Notification engine', 'Distributed', 'Email dispatch, delivery confirmed'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1011',
    docType: 'Certification Agreement Letter',
    employeeId: 'emp-3',
    employeeName: 'Ananya Iyer',
    employeeHasAppAccess: true,
    status: 'distributed',
    trigger: 'manual',
    event: 'Certification sponsorship',
    generatedOn: '2026-06-20',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-cert-agr',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[1],
    requiresAcknowledgment: true,
    acknowledgedOn: null,
    retentionUntil: '2033-06-20',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-20', event: 'Certification sponsorship', templateVersion: 2, current: true },
    ],
    distributions: [
      { id: 'dst-8', channel: 'in-app', sentOn: '2026-06-21', outcome: 'delivered', detail: 'Awaiting employee acknowledgment' },
    ],
    audit: [
      audit('2026-06-20', 'Lakshmi Rao', 'Generated', 'Certification agreement, template v2'),
      audit('2026-06-21', 'Meera Krishnan', 'Approved', 'Released for acknowledgment'),
      audit('2026-06-21', 'Notification engine', 'Distributed', 'In-app dispatch — acknowledgment pending'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1012',
    docType: 'Training Agreement Letter',
    employeeId: 'emp-1',
    employeeName: 'Arjun Mehta',
    employeeHasAppAccess: true,
    status: 'distributed',
    trigger: 'manual',
    event: 'Training nomination',
    generatedOn: '2026-05-25',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-train-agr',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[0],
    requiresAcknowledgment: true,
    acknowledgedOn: '2026-05-28',
    retentionUntil: '2033-05-25',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-05-25', event: 'Training nomination', templateVersion: 1, current: true },
    ],
    distributions: [
      { id: 'dst-9', channel: 'in-app', sentOn: '2026-05-26', outcome: 'delivered', detail: 'Acknowledged in portal' },
    ],
    audit: [
      audit('2026-05-25', 'Lakshmi Rao', 'Generated', 'Training agreement, template v1'),
      audit('2026-05-26', 'Meera Krishnan', 'Approved', 'Released for acknowledgment'),
      audit('2026-05-28', 'Arjun Mehta', 'Acknowledged', 'Employee signed in-app'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1013',
    docType: 'Confirmation Letter',
    employeeId: 'emp-9',
    employeeName: 'Fatima Khan',
    employeeHasAppAccess: true,
    status: 'distributed',
    trigger: 'batch',
    event: 'Confirmation',
    generatedOn: '2026-04-28',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-conf',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-04-28',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-04-28', event: 'Confirmation', templateVersion: 2, current: true },
    ],
    distributions: [
      { id: 'dst-10', channel: 'print', sentOn: '2026-04-30', outcome: 'sent', detail: 'Print-ready copy generated' },
    ],
    audit: [
      audit('2026-04-28', 'Lakshmi Rao', 'Generated', 'Batch generation, template v2'),
      audit('2026-04-29', 'Meera Krishnan', 'Approved', 'Single-step approval completed'),
      audit('2026-04-30', 'Notification engine', 'Distributed', 'Print channel'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
]
