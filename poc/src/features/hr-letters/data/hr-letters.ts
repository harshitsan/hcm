/**
 * HR Letters & Certificates — canonical types + seed data.
 * Covers the 18 standard Kensium template types across four categories
 * (Letters / Certificates / Offers & joining / Email templates), agreement
 * letters (HLC-28), merge fields (HLC-02), template versioning (HLC-18), and
 * the generated-letter lifecycle: Draft → Pending approval → Approved →
 * Issued, with signing-authority tracking, reissue as a linked record,
 * distribution tracking, 7-year retention, and an immutable audit trail.
 */

export const LETTER_TYPES = [
  'Appointment Letter',
  'Confirmation Letter',
  'Transfer Letter',
  'Promotion Letter',
  'Relieving Letter',
] as const

export const CERTIFICATE_TYPES = [
  'Experience Certificate',
  'Address Proof',
  'Employment Verification',
] as const

export const OFFER_JOINING_TYPES = [
  'Offer Letter',
  'Joining Letter',
  'Appointment Order',
] as const

export const EMAIL_DOC_TYPES = [
  'Interview Invite Email',
  'Offer Email',
  'Onboarding Welcome Email',
  'Probation Reminder Email',
  'Exit Acknowledgement Email',
  'Birthday & Anniversary Greeting',
  'Policy Update Notice',
] as const

/** The original eight letter/certificate types (HLC-01). */
export const HR_DOC_TYPES = [...LETTER_TYPES, ...CERTIFICATE_TYPES] as const
export type HrDocType = (typeof HR_DOC_TYPES)[number]

export const AGREEMENT_TYPES = [
  'Certification Agreement Letter',
  'Training Agreement Letter',
] as const
export type AgreementType = (typeof AGREEMENT_TYPES)[number]

/**
 * Contract agreements (O10) — generated from these templates and tracked as
 * agreement records in the Documents module with validity and expiry rules.
 */
export const CONTRACT_AGREEMENT_TYPES = [
  'Employment agreement',
  'Service bond',
  'Non-disclosure agreement',
  'Non-compete agreement',
] as const
export type ContractAgreementType = (typeof CONTRACT_AGREEMENT_TYPES)[number]

export const ALL_DOC_KINDS = [
  ...LETTER_TYPES,
  ...CERTIFICATE_TYPES,
  ...OFFER_JOINING_TYPES,
  ...EMAIL_DOC_TYPES,
  ...AGREEMENT_TYPES,
  ...CONTRACT_AGREEMENT_TYPES,
] as const
export type DocKind = (typeof ALL_DOC_KINDS)[number]

/* ------------------------- Template categories ------------------------- */

export const TEMPLATE_CATEGORIES = [
  'Letters',
  'Certificates',
  'Offers & joining',
  'Email templates',
  'Agreements',
] as const
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

/** Which of the four catalog categories a document type belongs to. */
export function categoryOfDocType(docType: DocKind): TemplateCategory {
  if ((CERTIFICATE_TYPES as readonly string[]).includes(docType))
    return 'Certificates'
  if ((OFFER_JOINING_TYPES as readonly string[]).includes(docType))
    return 'Offers & joining'
  if ((EMAIL_DOC_TYPES as readonly string[]).includes(docType))
    return 'Email templates'
  if ((CONTRACT_AGREEMENT_TYPES as readonly string[]).includes(docType))
    return 'Agreements'
  // Standard letters and agreement letters both sit under Letters.
  return 'Letters'
}

export const WORKFLOW_EVENTS = [
  'Hire',
  'Confirmation',
  'Transfer',
  'Promotion',
  'Relieving',
  'Offer accepted',
] as const
export type WorkflowEvent = (typeof WORKFLOW_EVENTS)[number]

/** Which document type an auto-generation workflow event produces (HLC-04). */
export const EVENT_DOC_TYPE: Record<WorkflowEvent, DocKind> = {
  Hire: 'Appointment Letter',
  Confirmation: 'Confirmation Letter',
  Transfer: 'Transfer Letter',
  Promotion: 'Promotion Letter',
  Relieving: 'Relieving Letter',
  'Offer accepted': 'Offer Letter',
}

export const SIGNING_AUTHORITIES = [
  'HR Director — Meera Krishnan',
  'CHRO — Rajiv Malhotra',
  'VP People Ops — Sarah D’Souza',
] as const

/** People authorised to sign issued letters (name + title). */
export interface Signatory {
  name: string
  title: string
}

export const SIGNATORIES: Signatory[] = [
  { name: 'Meera Krishnan', title: 'HR Head' },
  { name: 'Rajiv Malhotra', title: 'Managing Director' },
  { name: 'Sunita Rao', title: 'Company Secretary' },
]

export const COMPANY_NAME = 'Kensium Solutions'
export const COMPANY_LEGAL_NAME = 'Kensium Solutions Private Limited'
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
  /** Simulated incomplete record — position data missing, generation blocked. */
  recordIncomplete?: boolean
}

/** The signed-in person when the role switcher is "Employee (User)". */
export const ME_USER_ID = 'emp-3'
/** The person represented by the "Employee (Non-User)" role (no app login). */
export const ME_NON_USER_ID = 'emp-6'

export const EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Arjun Mehta', email: 'arjun.mehta@kensium.com', position: 'Senior Software Engineer', department: 'Engineering', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days', grade: 'L4', bankBranch: 'HDFC Bank — HITEC City' } },
  { id: 'emp-2', name: 'Priya Sharma', email: 'priya.sharma@kensium.com', position: 'HR Executive', department: 'Human Resources', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '30 days', grade: 'L2', bankBranch: 'ICICI Bank — Madhapur' } },
  { id: 'emp-3', name: 'Ananya Iyer', email: 'ananya.iyer@kensium.com', position: 'Product Designer', department: 'Design', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '45 days', grade: 'L3', bankBranch: 'HDFC Bank — Gachibowli' } },
  { id: 'emp-4', name: 'Rohan Verma', email: 'rohan.verma@kensium.com', position: 'QA Lead', department: 'Quality', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days', grade: 'L4', bankBranch: 'SBI — Kondapur' } },
  { id: 'emp-5', name: 'Kavitha Reddy', email: 'kavitha.reddy@kensium.com', position: 'Finance Analyst', department: 'Finance', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '30 days', grade: 'L2', bankBranch: 'Axis Bank — Jubilee Hills' } },
  { id: 'emp-6', name: 'Suresh Patil', email: 'suresh.patil@kensium.com', position: 'Field Technician', department: 'Operations', company: COMPANY_NAME, hasAppAccess: false, customFields: { noticePeriod: '15 days', grade: 'L1', bankBranch: 'SBI — Ameerpet' } },
  { id: 'emp-7', name: 'Neha Gupta', email: 'neha.gupta@kensium.com', position: 'Marketing Manager', department: 'Marketing', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days', grade: 'L5', bankBranch: 'HDFC Bank — Banjara Hills' } },
  // Vikram's record is deliberately incomplete: no position data, no grade,
  // no bank branch — generation for him is blocked with a gap list.
  { id: 'emp-8', name: 'Vikram Singh', email: 'vikram.singh@kensium.com', position: 'DevOps Engineer', department: 'Engineering', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '60 days' }, recordIncomplete: true },
  { id: 'emp-9', name: 'Fatima Khan', email: 'fatima.khan@kensium.com', position: 'Recruiter', department: 'Talent Acquisition', company: COMPANY_NAME, hasAppAccess: true, customFields: { noticePeriod: '30 days', grade: 'L2', bankBranch: 'ICICI Bank — Kukatpally' } },
  // Deepak's bank branch was never captured — letters that need it are blocked.
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
  { token: '{{employee.fullName}}', source: 'Employee', label: 'Employee full name' },
  { token: '{{employee.name}}', source: 'Employee', label: 'Employee name' },
  { token: '{{employee.email}}', source: 'Employee', label: 'Employee email' },
  { token: '{{employee.id}}', source: 'Employee', label: 'Employee ID' },
  { token: '{{position.title}}', source: 'Position', label: 'Position title' },
  { token: '{{position.department}}', source: 'Position', label: 'Department' },
  { token: '{{company.name}}', source: 'Company', label: 'Company name' },
  { token: '{{company.legalName}}', source: 'Company', label: 'Company legal name' },
  { token: '{{company.address}}', source: 'Company', label: 'Company address' },
  { token: '{{letter.date}}', source: 'Company', label: 'Letter date' },
  { token: '{{custom.noticePeriod}}', source: 'Custom', label: 'Notice period (custom)' },
  { token: '{{custom.grade}}', source: 'Custom', label: 'Grade (custom)' },
  { token: '{{custom.bankBranch}}', source: 'Custom', label: 'Bank branch (custom)' },
  { token: '{{custom.badgeId}}', source: 'Custom', label: 'Badge ID (custom)' },
]

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
  /* ------------------------------- Letters ------------------------------- */
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
    currentVersion: 1,
    versions: [v(1, '2025-07-10', 'Initial template')],
    updatedOn: '2025-07-10',
  },
  /* ----------------------------- Certificates ---------------------------- */
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
    currentVersion: 1,
    versions: [v(1, '2025-08-01', 'Initial template')],
    updatedOn: '2025-08-01',
  },
  /* --------------------------- Offers & joining -------------------------- */
  {
    id: 'tpl-offer',
    docType: 'Offer Letter',
    name: 'Offer of Employment',
    body: 'Dear {{employee.fullName}},\n\nFollowing your interviews, {{company.legalName}} is delighted to offer you the position of {{position.title}} in our {{position.department}} team. Your grade will be {{custom.grade}} and your notice period {{custom.noticePeriod}}. Salary will be credited to your bank branch on record: {{custom.bankBranch}}.\n\nPlease confirm your acceptance within 7 days of this letter dated {{letter.date}}.',
    layout: 'Modern',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[1],
    currentVersion: 2,
    versions: [
      v(1, '2025-09-15', 'Initial template'),
      v(2, '2026-04-20', 'Added bank branch and acceptance window'),
    ],
    updatedOn: '2026-04-20',
  },
  {
    id: 'tpl-join',
    docType: 'Joining Letter',
    name: 'Joining Letter',
    body: 'Dear {{employee.fullName}},\n\nWelcome to {{company.legalName}}. This letter confirms your joining as {{position.title}} in the {{position.department}} department at {{company.address}}. Your access badge ({{custom.badgeId}}) will be issued on your first day.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-09-15', 'Initial template')],
    updatedOn: '2025-09-15',
  },
  {
    id: 'tpl-appt-order',
    docType: 'Appointment Order',
    name: 'Appointment Order',
    body: 'APPOINTMENT ORDER\n\n{{employee.fullName}} ({{employee.id}}) is hereby appointed as {{position.title}} in the {{position.department}} department of {{company.legalName}}. Grade: {{custom.grade}}. This order takes effect from the date of issue: {{letter.date}}.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[1],
    currentVersion: 1,
    versions: [v(1, '2025-10-01', 'Initial template')],
    updatedOn: '2025-10-01',
  },
  /* --------------------------- Email templates --------------------------- */
  {
    id: 'tpl-eml-interview',
    docType: 'Interview Invite Email',
    name: 'Interview Invite',
    body: 'Dear {{employee.fullName}},\n\nYou are invited to an interview for the {{position.title}} role at {{company.name}}. Our team will meet you at {{company.address}}. Please carry a photo ID and reach 15 minutes early.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-10-05', 'Initial template')],
    updatedOn: '2025-10-05',
  },
  {
    id: 'tpl-eml-offer',
    docType: 'Offer Email',
    name: 'Offer Email',
    body: 'Dear {{employee.fullName}},\n\nCongratulations! Your offer letter for the {{position.title}} position at {{company.legalName}} is attached. Kindly reply with your acceptance so we can plan your onboarding.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 2,
    versions: [
      v(1, '2025-10-05', 'Initial template'),
      v(2, '2026-02-02', 'Warmer congratulations wording'),
    ],
    updatedOn: '2026-02-02',
  },
  {
    id: 'tpl-eml-welcome',
    docType: 'Onboarding Welcome Email',
    name: 'Onboarding Welcome',
    body: 'Dear {{employee.fullName}},\n\nWelcome to {{company.name}}! You join the {{position.department}} team as {{position.title}}. Your access badge {{custom.badgeId}} and workstation will be ready on day one.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-10-05', 'Initial template')],
    updatedOn: '2025-10-05',
  },
  {
    id: 'tpl-eml-probation',
    docType: 'Probation Reminder Email',
    name: 'Probation Review Reminder',
    body: 'Dear {{employee.fullName}},\n\nA reminder that your probation review is coming up. Your manager will share feedback on your work as {{position.title}}, {{position.department}}, and HR will confirm the outcome in writing.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-11-12', 'Initial template')],
    updatedOn: '2025-11-12',
  },
  {
    id: 'tpl-eml-exit',
    docType: 'Exit Acknowledgement Email',
    name: 'Exit Acknowledgement',
    body: 'Dear {{employee.fullName}},\n\nWe acknowledge your resignation. Your notice period of {{custom.noticePeriod}} applies, and HR will guide you through the exit steps at {{company.name}}. Thank you for your contribution.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-11-12', 'Initial template')],
    updatedOn: '2025-11-12',
  },
  {
    id: 'tpl-eml-greet',
    docType: 'Birthday & Anniversary Greeting',
    name: 'Birthday & Anniversary Greeting',
    body: 'Dear {{employee.fullName}},\n\nWarm wishes from everyone at {{company.name}}! Thank you for everything you do for the {{position.department}} team. Have a wonderful celebration.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-12-01', 'Initial template')],
    updatedOn: '2025-12-01',
  },
  {
    id: 'tpl-eml-policy',
    docType: 'Policy Update Notice',
    name: 'Policy Update Notice',
    body: 'Dear {{employee.fullName}},\n\nAn HR policy applicable to your role ({{position.title}}) has been updated at {{company.legalName}}. Please review the updated policy in the portal and reach out to HR with questions.',
    layout: 'Compact',
    letterhead: false,
    requiresApproval: false,
    requiresAcknowledgment: false,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-12-01', 'Initial template')],
    updatedOn: '2025-12-01',
  },
  /* ------------------------------ Agreements ------------------------------ */
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
    currentVersion: 1,
    versions: [v(1, '2025-10-01', 'Initial agreement')],
    updatedOn: '2025-10-01',
  },
  /* ------------------------ Contract agreements (O10) ------------------------ */
  {
    id: 'tpl-agr-employment',
    docType: 'Employment agreement',
    name: 'Standard Employment Agreement',
    body: 'EMPLOYMENT AGREEMENT\n\nThis agreement is made between {{company.legalName}}, {{company.address}}, and {{employee.fullName}} ({{employee.id}}).\n\nThe employee is engaged as {{position.title}} in the {{position.department}} department with effect from {{agreement.validFrom}}. The applicable notice period is {{custom.noticePeriod}}.\n\nThis agreement remains in force until {{agreement.validUntil}}, unless terminated earlier under its terms. It was executed on {{agreement.executedOn}}.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: true,
    signingAuthority: SIGNING_AUTHORITIES[1],
    currentVersion: 2,
    versions: [
      v(1, '2025-11-01', 'Initial agreement template'),
      v(2, '2026-03-15', 'Clarified notice-period clause'),
    ],
    updatedOn: '2026-03-15',
  },
  {
    id: 'tpl-agr-bond',
    docType: 'Service bond',
    name: 'Service Bond',
    body: 'SERVICE BOND\n\n{{employee.fullName}} ({{employee.id}}), serving as {{position.title}} in the {{position.department}} department, agrees to remain in the service of {{company.legalName}} from {{agreement.validFrom}} until {{agreement.validUntil}}.\n\nShould the employee leave before the bond period ends, the training and onboarding investment becomes repayable as set out in this bond. Notice period on record: {{custom.noticePeriod}}. Executed on {{agreement.executedOn}}.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: true,
    signingAuthority: SIGNING_AUTHORITIES[1],
    currentVersion: 1,
    versions: [v(1, '2025-11-01', 'Initial agreement template')],
    updatedOn: '2025-11-01',
  },
  {
    id: 'tpl-agr-nda',
    docType: 'Non-disclosure agreement',
    name: 'Non-Disclosure Agreement',
    body: 'NON-DISCLOSURE AGREEMENT\n\n{{employee.fullName}}, {{position.title}} at {{company.legalName}}, agrees to hold in strict confidence all business, technical and customer information received in the course of employment, and to use it only for the benefit of {{company.name}}.\n\nThis obligation applies from {{agreement.validFrom}} and remains binding until {{agreement.validUntil}}. Executed on {{agreement.executedOn}}.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: true,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 2,
    versions: [
      v(1, '2025-11-01', 'Initial agreement template'),
      v(2, '2026-02-10', 'Extended confidential-information definition'),
    ],
    updatedOn: '2026-02-10',
  },
  {
    id: 'tpl-agr-noncompete',
    docType: 'Non-compete agreement',
    name: 'Non-Compete Agreement',
    body: 'NON-COMPETE AGREEMENT\n\n{{employee.fullName}} ({{employee.id}}), engaged as {{position.title}} in the {{position.department}} department, agrees not to join or start a competing business within the agreed territory while employed by {{company.legalName}}, and for the restraint period ending {{agreement.validUntil}}.\n\nThis agreement takes effect from {{agreement.validFrom}} and was executed on {{agreement.executedOn}}.',
    layout: 'Classic',
    letterhead: true,
    requiresApproval: true,
    requiresAcknowledgment: true,
    signingAuthority: SIGNING_AUTHORITIES[0],
    currentVersion: 1,
    versions: [v(1, '2025-11-01', 'Initial agreement template')],
    updatedOn: '2025-11-01',
  },
]

/* --------------------------- Generated documents --------------------------- */

export type DocStatus =
  | 'draft'
  | 'pending-approval'
  | 'approved'
  | 'issued'
  | 'rejected'

export type Channel = 'email' | 'in-app' | 'print' | 'handover'
export type DeliveryOutcome = 'sent' | 'delivered' | 'failed'
export type GenerationTrigger = 'manual' | 'auto' | 'batch'

/** Display labels for every distribution channel. */
export const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  'in-app': 'In-app',
  print: 'Print',
  handover: 'Handover to employee',
}

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
  /** Other employees copied on the communication. */
  ccRecipients?: string[]
  /** Who physically handed the document over (handover channel only). */
  handedOverBy?: string
  /** Date the physical handover happened (handover channel only). */
  handoverDate?: string
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
  /** Who approved the letter, once approved. */
  approvedBy: string | null
  approvedOn: string | null
  /** The signatory recorded at approval — shown on the signature block. */
  signedBy: Signatory | null
  /** Set when this letter is a reissue of an earlier one. */
  reissueOf: string | null
  /** Set on the original when a reissue has been created from it. */
  reissuedAs: string | null
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
    status: 'issued',
    trigger: 'auto',
    event: 'Hire',
    generatedOn: '2026-04-06',
    generatedBy: 'Workflow engine',
    templateId: 'tpl-appt',
    templateVersion: 3,
    signingAuthority: SIGNING_AUTHORITIES[1],
    approvedBy: 'Lakshmi Rao (Company Admin)',
    approvedOn: '2026-04-07',
    signedBy: SIGNATORIES[1],
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-04-06',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-04-06', event: 'Hire', templateVersion: 3, current: true },
    ],
    distributions: [
      { id: 'dst-1', channel: 'email', sentOn: '2026-04-08', outcome: 'delivered', detail: 'arjun.mehta@kensium.com', ccRecipients: ['Priya Sharma', 'Neha Gupta'] },
      { id: 'dst-2', channel: 'in-app', sentOn: '2026-04-08', outcome: 'delivered', detail: 'Available in employee portal' },
    ],
    audit: [
      audit('2026-04-06', 'Workflow engine', 'Generated', 'Generated automatically — Hire event, template v3'),
      audit('2026-04-07', 'Lakshmi Rao', 'Approved', 'Approved — signed by Rajiv Malhotra, Managing Director'),
      audit('2026-04-08', 'Notification engine', 'Issued', 'Email + in-app dispatch'),
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
    approvedBy: null,
    approvedOn: null,
    signedBy: null,
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-24',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-24', event: 'Confirmation', templateVersion: 2, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-24', 'Workflow engine', 'Generated', 'Generated automatically — Confirmation event, template v2'),
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
    approvedBy: 'Meera Krishnan',
    approvedOn: '2026-06-20',
    signedBy: SIGNATORIES[1],
    reissueOf: null,
    reissuedAs: null,
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
      audit('2026-06-20', 'Meera Krishnan', 'Approved', 'Approved — signed by Rajiv Malhotra, Managing Director'),
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
    status: 'issued',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-05-11',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-exp',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    approvedBy: 'Lakshmi Rao (Company Admin)',
    approvedOn: '2026-05-11',
    signedBy: SIGNATORIES[0],
    reissueOf: null,
    reissuedAs: 'hrl-1016',
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-05-11',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-05-11', event: 'On request', templateVersion: 2, current: true },
    ],
    distributions: [
      { id: 'dst-3', channel: 'email', sentOn: '2026-05-19', outcome: 'delivered', detail: 'priya.sharma@kensium.com' },
    ],
    audit: [
      audit('2026-05-11', 'Lakshmi Rao', 'Generated', 'Manual generation, template v2'),
      audit('2026-05-19', 'Notification engine', 'Issued', 'Email dispatch'),
      audit('2026-07-06', 'Lakshmi Rao', 'Reissued', 'Reissued as hrl-1016 for a name correction — fresh approval cycle'),
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
    status: 'issued',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-06-02',
    generatedBy: 'Priya Sharma',
    templateId: 'tpl-addr',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[2],
    approvedBy: null,
    approvedOn: null,
    signedBy: SIGNATORIES[2],
    reissueOf: null,
    reissuedAs: null,
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
      audit('2026-06-02', 'Notification engine', 'Issued', 'In-app access enabled'),
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
    approvedBy: null,
    approvedOn: null,
    signedBy: SIGNATORIES[2],
    reissueOf: null,
    reissuedAs: null,
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
    approvedBy: null,
    approvedOn: null,
    signedBy: null,
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-15',
    rejectReason: 'New location details are incorrect — regenerate after data fix.',
    versions: [
      { version: 1, generatedOn: '2026-06-15', event: 'Transfer', templateVersion: 1, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-15', 'Workflow engine', 'Generated', 'Generated automatically — Transfer event, template v1'),
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
    approvedBy: null,
    approvedOn: null,
    signedBy: null,
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-26',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-26', event: 'Relieving', templateVersion: 1, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-06-26', 'Workflow engine', 'Generated', 'Generated automatically — Relieving event, template v1'),
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
    status: 'issued',
    trigger: 'batch',
    event: 'Hire',
    generatedOn: '2026-05-04',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-appt',
    templateVersion: 3,
    signingAuthority: SIGNING_AUTHORITIES[1],
    approvedBy: 'Meera Krishnan',
    approvedOn: '2026-05-05',
    signedBy: SIGNATORIES[1],
    reissueOf: null,
    reissuedAs: null,
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
      audit('2026-05-05', 'Meera Krishnan', 'Approved', 'Approved — signed by Rajiv Malhotra, Managing Director'),
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
    status: 'issued',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-06-10',
    generatedBy: 'Priya Sharma',
    templateId: 'tpl-exp',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    approvedBy: null,
    approvedOn: null,
    signedBy: SIGNATORIES[0],
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-10',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-10', event: 'On request', templateVersion: 2, current: true },
    ],
    distributions: [
      { id: 'dst-7', channel: 'email', sentOn: '2026-06-10', outcome: 'delivered', detail: 'suresh.patil@kensium.com' },
      { id: 'dst-7b', channel: 'handover', sentOn: '2026-06-12', outcome: 'delivered', detail: 'Physical copy handed over at the Operations desk', handedOverBy: 'Priya Sharma', handoverDate: '2026-06-12' },
    ],
    audit: [
      audit('2026-06-10', 'Priya Sharma', 'Generated', 'Employee has no app access — email channel chosen'),
      audit('2026-06-10', 'Notification engine', 'Issued', 'Email dispatch, delivery confirmed'),
      audit('2026-06-12', 'Priya Sharma', 'Handed over', 'Physical copy handed over to the employee in person'),
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
    status: 'issued',
    trigger: 'manual',
    event: 'Certification sponsorship',
    generatedOn: '2026-06-20',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-cert-agr',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[1],
    approvedBy: 'Meera Krishnan',
    approvedOn: '2026-06-21',
    signedBy: SIGNATORIES[1],
    reissueOf: null,
    reissuedAs: null,
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
      audit('2026-06-21', 'Meera Krishnan', 'Approved', 'Approved — signed by Rajiv Malhotra, Managing Director'),
      audit('2026-06-21', 'Notification engine', 'Issued', 'In-app dispatch — acknowledgment pending'),
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
    status: 'issued',
    trigger: 'manual',
    event: 'Training nomination',
    generatedOn: '2026-05-25',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-train-agr',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[0],
    approvedBy: 'Meera Krishnan',
    approvedOn: '2026-05-26',
    signedBy: SIGNATORIES[0],
    reissueOf: null,
    reissuedAs: null,
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
      audit('2026-05-26', 'Meera Krishnan', 'Approved', 'Approved — signed by Meera Krishnan, HR Head'),
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
    status: 'issued',
    trigger: 'batch',
    event: 'Confirmation',
    generatedOn: '2026-04-28',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-conf',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    approvedBy: 'Meera Krishnan',
    approvedOn: '2026-04-29',
    signedBy: SIGNATORIES[0],
    reissueOf: null,
    reissuedAs: null,
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
      audit('2026-04-29', 'Meera Krishnan', 'Approved', 'Approved — signed by Meera Krishnan, HR Head'),
      audit('2026-04-30', 'Notification engine', 'Issued', 'Print channel'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1014',
    docType: 'Offer Letter',
    employeeId: 'emp-9',
    employeeName: 'Fatima Khan',
    employeeHasAppAccess: true,
    status: 'issued',
    trigger: 'auto',
    event: 'Offer accepted',
    generatedOn: '2026-06-30',
    generatedBy: 'Workflow engine',
    templateId: 'tpl-offer',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[1],
    approvedBy: 'Lakshmi Rao (Company Admin)',
    approvedOn: '2026-07-01',
    signedBy: SIGNATORIES[1],
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-06-30',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-06-30', event: 'Offer accepted', templateVersion: 2, current: true },
    ],
    distributions: [
      { id: 'dst-11', channel: 'email', sentOn: '2026-07-01', outcome: 'delivered', detail: 'fatima.khan@kensium.com' },
    ],
    audit: [
      audit('2026-06-30', 'Workflow engine', 'Generated', 'Generated automatically — Offer accepted, template v2'),
      audit('2026-07-01', 'Lakshmi Rao', 'Approved', 'Approved — signed by Rajiv Malhotra, Managing Director'),
      audit('2026-07-01', 'Notification engine', 'Issued', 'Email dispatch'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1015',
    docType: 'Onboarding Welcome Email',
    employeeId: 'emp-2',
    employeeName: 'Priya Sharma',
    employeeHasAppAccess: true,
    status: 'issued',
    trigger: 'auto',
    event: 'Joining confirmed',
    generatedOn: '2026-07-02',
    generatedBy: 'Workflow engine',
    templateId: 'tpl-eml-welcome',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[0],
    approvedBy: null,
    approvedOn: null,
    signedBy: SIGNATORIES[0],
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-07-02',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-07-02', event: 'Joining confirmed', templateVersion: 1, current: true },
    ],
    distributions: [
      { id: 'dst-12', channel: 'email', sentOn: '2026-07-02', outcome: 'delivered', detail: 'priya.sharma@kensium.com' },
    ],
    audit: [
      audit('2026-07-02', 'Workflow engine', 'Generated', 'Generated automatically — Joining confirmed, template v1'),
      audit('2026-07-02', 'Notification engine', 'Issued', 'Email dispatch'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1016',
    docType: 'Experience Certificate',
    employeeId: 'emp-2',
    employeeName: 'Priya Sharma',
    employeeHasAppAccess: true,
    status: 'pending-approval',
    trigger: 'manual',
    event: 'Reissue of hrl-1004',
    generatedOn: '2026-07-06',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-exp',
    templateVersion: 2,
    signingAuthority: SIGNING_AUTHORITIES[0],
    approvedBy: null,
    approvedOn: null,
    signedBy: null,
    reissueOf: 'hrl-1004',
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-07-06',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-07-06', event: 'Reissue of hrl-1004', templateVersion: 2, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-07-06', 'Lakshmi Rao', 'Generated', 'Reissue of hrl-1004 (name correction) — fresh approval cycle'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
  {
    id: 'hrl-1017',
    docType: 'Joining Letter',
    employeeId: 'emp-3',
    employeeName: 'Ananya Iyer',
    employeeHasAppAccess: true,
    status: 'draft',
    trigger: 'manual',
    event: 'On request',
    generatedOn: '2026-07-08',
    generatedBy: 'Lakshmi Rao',
    templateId: 'tpl-join',
    templateVersion: 1,
    signingAuthority: SIGNING_AUTHORITIES[0],
    approvedBy: null,
    approvedOn: null,
    signedBy: null,
    reissueOf: null,
    reissuedAs: null,
    requiresAcknowledgment: false,
    acknowledgedOn: null,
    retentionUntil: '2033-07-08',
    rejectReason: null,
    versions: [
      { version: 1, generatedOn: '2026-07-08', event: 'On request', templateVersion: 1, current: true },
    ],
    distributions: [],
    audit: [
      audit('2026-07-08', 'Lakshmi Rao', 'Generated', 'Manual generation, template v1 — saved as draft'),
    ],
    questionnaireAnswers: [],
    company: COMPANY_NAME,
  },
]
