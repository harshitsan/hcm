/**
 * Employees module — governed configuration (L2) and engine (L3) data:
 * jurisdiction rule-packs, statutory field schemas, duplicate-detection rules,
 * lifecycle stage config, notification templates, dependant/life-event types,
 * verifications, document custodians, timeline events, access matrix and
 * directory grid metadata.
 */

export interface RulePack {
  id: string
  jurisdiction: string
  version: number
  effectiveFrom: string
  status: 'Published' | 'Draft'
  esiWageCeiling: number
  pfApplicable: boolean
  ptSlab: string
  lwfApplicable: boolean
  maternityWeeks: number
  gratuityMinYears: number
  earnedLeavePerYear: number
  casualLeavePerYear: number
  sickLeavePerYear: number
}

export const seedRulePacks: RulePack[] = [
  {
    id: 'rp-1',
    jurisdiction: 'India — Karnataka',
    version: 3,
    effectiveFrom: '2026-04-01',
    status: 'Published',
    esiWageCeiling: 21000,
    pfApplicable: true,
    ptSlab: '₹200/month above ₹25,000',
    lwfApplicable: true,
    maternityWeeks: 26,
    gratuityMinYears: 5,
    earnedLeavePerYear: 18,
    casualLeavePerYear: 12,
    sickLeavePerYear: 12,
  },
  {
    id: 'rp-2',
    jurisdiction: 'India — Maharashtra',
    version: 2,
    effectiveFrom: '2026-01-01',
    status: 'Published',
    esiWageCeiling: 21000,
    pfApplicable: true,
    ptSlab: '₹300 Feb / ₹200 other months above ₹10,000',
    lwfApplicable: true,
    maternityWeeks: 26,
    gratuityMinYears: 5,
    earnedLeavePerYear: 21,
    casualLeavePerYear: 12,
    sickLeavePerYear: 12,
  },
  {
    id: 'rp-3',
    jurisdiction: 'India — Telangana',
    version: 1,
    effectiveFrom: '2025-07-01',
    status: 'Published',
    esiWageCeiling: 21000,
    pfApplicable: true,
    ptSlab: '₹200/month above ₹20,000',
    lwfApplicable: false,
    maternityWeeks: 26,
    gratuityMinYears: 5,
    earnedLeavePerYear: 15,
    casualLeavePerYear: 12,
    sickLeavePerYear: 12,
  },
]

export interface SchemaField {
  id: string
  jurisdiction: string
  label: string
  dataType: 'text' | 'number' | 'date' | 'boolean'
  required: boolean
  order: number
  validation: string
}

export const seedSchemaFields: SchemaField[] = [
  { id: 'sf-1', jurisdiction: 'India — Karnataka', label: 'UAN', dataType: 'text', required: true, order: 1, validation: '12 digits' },
  { id: 'sf-2', jurisdiction: 'India — Karnataka', label: 'ESIC Number', dataType: 'text', required: false, order: 2, validation: '10 digits when ESI-eligible' },
  { id: 'sf-3', jurisdiction: 'India — Karnataka', label: 'PT Registration', dataType: 'boolean', required: true, order: 3, validation: '—' },
  { id: 'sf-4', jurisdiction: 'India — Karnataka', label: 'LWF Applicability', dataType: 'boolean', required: true, order: 4, validation: '—' },
  { id: 'sf-5', jurisdiction: 'India — Maharashtra', label: 'UAN', dataType: 'text', required: true, order: 1, validation: '12 digits' },
  { id: 'sf-6', jurisdiction: 'India — Maharashtra', label: 'ESIC Number', dataType: 'text', required: true, order: 2, validation: '10 digits' },
  { id: 'sf-7', jurisdiction: 'India — Maharashtra', label: 'MLWF Contribution Date', dataType: 'date', required: true, order: 3, validation: 'June / December cycle' },
  { id: 'sf-8', jurisdiction: 'India — Telangana', label: 'UAN', dataType: 'text', required: true, order: 1, validation: '12 digits' },
  { id: 'sf-9', jurisdiction: 'India — Telangana', label: 'TS PT Enrollment ID', dataType: 'text', required: false, order: 2, validation: 'Alphanumeric' },
]

export type DedupScope = 'Within company' | 'Cross-company'

export interface DedupRule {
  id: string
  field: 'Aadhar' | 'PAN' | 'Passport'
  enforceUnique: boolean
  scope: DedupScope
}

export const seedDedupRules: DedupRule[] = [
  { id: 'dr-1', field: 'Aadhar', enforceUnique: true, scope: 'Within company' },
  { id: 'dr-2', field: 'PAN', enforceUnique: true, scope: 'Within company' },
  { id: 'dr-3', field: 'Passport', enforceUnique: true, scope: 'Within company' },
]

export interface LifecycleStageConfig {
  id: string
  stage: string
  parameter: string
  value: string
  effectiveFrom: string
  version: number
}

export const seedLifecycleConfig: LifecycleStageConfig[] = [
  { id: 'ls-1', stage: 'Onboarding', parameter: 'Joining checklist', value: '5 mandatory tasks', effectiveFrom: '2026-01-01', version: 2 },
  { id: 'ls-2', stage: 'Probation', parameter: 'Duration', value: '6 months', effectiveFrom: '2026-01-01', version: 2 },
  { id: 'ls-3', stage: 'Probation', parameter: 'Extension allowed', value: 'Once, up to 3 months', effectiveFrom: '2026-01-01', version: 2 },
  { id: 'ls-4', stage: 'Transfer', parameter: 'Checklist', value: 'Asset handover + access re-provisioning', effectiveFrom: '2025-06-01', version: 1 },
  { id: 'ls-5', stage: 'Exit', parameter: 'Notice period', value: '90 days (Permanent), 30 days (others)', effectiveFrom: '2026-01-01', version: 2 },
  { id: 'ls-6', stage: 'Exit', parameter: 'Clearance departments', value: 'IT, Finance, Admin, HR', effectiveFrom: '2026-01-01', version: 2 },
]

export interface NotificationTemplate {
  id: string
  event: string
  audience: string
  template: string
  enabled: boolean
}

export const seedNotificationTemplates: NotificationTemplate[] = [
  {
    id: 'nt-1',
    event: 'Probation ending',
    audience: 'Employee + Primary manager + HR',
    template: 'Hi {{name}}, your probation ends on {{date}}. Confirmation review is scheduled.',
    enabled: true,
  },
  {
    id: 'nt-2',
    event: 'Transfer effective',
    audience: 'Employee + Old & new managers',
    template: '{{name}} transfers to {{department}} effective {{date}}.',
    enabled: true,
  },
  {
    id: 'nt-3',
    event: 'Manager change effective',
    audience: 'Employee + Impacted managers',
    template: 'Reporting change: {{name}} now reports to {{manager}} from {{date}}.',
    enabled: true,
  },
  {
    id: 'nt-4',
    event: 'Exit processed',
    audience: 'Employee + Manager + HR + Finance',
    template: 'Exit for {{name}} is processed. FFS timeline: {{ffsDate}}.',
    enabled: false,
  },
  { id: 'nt-5', event: 'Joining welcome', audience: 'Employee', template: 'Welcome aboard {{name}}! Your journey starts on {{date}}.', enabled: true },
  { id: 'nt-6', event: 'Joining checklist assigned', audience: 'Task owners', template: 'Joining tasks for {{name}} are due by {{date}}.', enabled: true },
  { id: 'nt-7', event: 'Probation confirmed', audience: 'Employee + Manager', template: 'Congratulations {{name}} — you are confirmed effective {{date}}.', enabled: true },
  { id: 'nt-8', event: 'Probation extended', audience: 'Employee + Manager + HR', template: 'Probation for {{name}} is extended until {{date}}.', enabled: true },
  { id: 'nt-9', event: 'Transfer initiated', audience: 'Employee + Managers + HR', template: 'Transfer of {{name}} to {{department}} initiated for {{date}}.', enabled: true },
  { id: 'nt-10', event: 'Delegation starting', audience: 'Delegate + HR', template: '{{manager}} acts for {{name}} from {{date}}.', enabled: true },
  { id: 'nt-11', event: 'Delegation ending', audience: 'Delegate + HR', template: 'Acting-manager window for {{manager}} ends on {{date}}.', enabled: true },
  { id: 'nt-12', event: 'Birthday greeting', audience: 'Employee', template: 'Happy birthday {{name}}! Have a wonderful year ahead.', enabled: true },
  { id: 'nt-13', event: 'Work anniversary', audience: 'Employee + Manager', template: '{{name}} completes {{years}} years with us on {{date}}.', enabled: true },
  { id: 'nt-14', event: 'Document expiring', audience: 'Employee + HR', template: 'Your {{document}} expires on {{date}} — please renew.', enabled: true },
  { id: 'nt-15', event: 'Verification due', audience: 'HR', template: '{{verification}} for {{name}} is due on {{date}}.', enabled: true },
  { id: 'nt-16', event: 'Life event recorded', audience: 'HR', template: '{{name}} recorded a {{event}} life event on {{date}}.', enabled: true },
  { id: 'nt-17', event: 'Dependant added', audience: 'HR', template: '{{name}} registered a new dependant ({{relation}}).', enabled: false },
  { id: 'nt-18', event: 'Class change approved', audience: 'Employee + Manager + HR', template: 'Employee class of {{name}} changes to {{class}} from {{date}}.', enabled: true },
  { id: 'nt-19', event: 'Acknowledgement pending', audience: 'Employee', template: 'Please acknowledge your {{document}} by {{date}}.', enabled: true },
  { id: 'nt-20', event: 'Acknowledgement received', audience: 'HR', template: '{{name}} acknowledged the {{document}} on {{date}}.', enabled: true },
  { id: 'nt-21', event: 'Resignation submitted', audience: 'Manager + HR', template: '{{name}} submitted resignation; last working day {{date}}.', enabled: true },
  { id: 'nt-22', event: 'Clearance pending', audience: 'Clearance departments', template: 'Exit clearance for {{name}} pending with {{department}}.', enabled: true },
  { id: 'nt-23', event: 'Rehire approved', audience: 'HR + Manager', template: 'Rehire of {{name}} approved — joining on {{date}}.', enabled: false },
  { id: 'nt-24', event: 'Bench report published', audience: 'Resource managers', template: 'The bench report for {{month}} is available.', enabled: true },
]

export interface DependantType {
  id: string
  name: string
  description: string
}

export const seedDependantTypes: DependantType[] = [
  { id: 'dt-1', name: 'Spouse', description: 'Husband or wife of the employee' },
  { id: 'dt-2', name: 'Son', description: 'Male child, natural or adopted' },
  { id: 'dt-3', name: 'Daughter', description: 'Female child, natural or adopted' },
  { id: 'dt-4', name: 'Father', description: 'Father of the employee' },
  { id: 'dt-5', name: 'Mother', description: 'Mother of the employee' },
]

export const LIFE_EVENT_TYPES = ['Marriage', 'Birth', 'Adoption', 'Bereavement'] as const

export interface LifeEventType {
  id: string
  name: string
  description: string
}

export const seedLifeEventTypes: LifeEventType[] = [
  { id: 'le-1', name: 'Marriage', description: 'Employee marriage — enables spouse dependant registration' },
  { id: 'le-2', name: 'Birth', description: 'Birth of a child — enables child dependant registration' },
  { id: 'le-3', name: 'Adoption', description: 'Legal adoption of a child' },
  { id: 'le-4', name: 'Bereavement', description: 'Death of a registered dependant or immediate family member' },
]

export interface VerificationCheck {
  id: string
  name: string
  applicableAt: string
  recurring: boolean
  applicability: string
}

export const seedVerifications: VerificationCheck[] = [
  { id: 'vc-1', name: 'Background verification', applicableAt: 'Pre-joining', recurring: false, applicability: 'All employees' },
  { id: 'vc-2', name: 'Address verification', applicableAt: 'On joining', recurring: false, applicability: 'All employees' },
  { id: 'vc-3', name: 'Driving licence validity', applicableAt: 'On joining', recurring: true, applicability: 'Field Staff group' },
  { id: 'vc-4', name: 'Health & fitness certificate', applicableAt: 'Annual', recurring: true, applicability: 'Plant & depot staff' },
]

export interface DocumentCustodian {
  id: string
  documentType: string
  custodianPosition: string
  applicability: string
  location: string
  department: string
  employeeClass: string
}

export const seedCustodians: DocumentCustodian[] = [
  { id: 'dc-1', documentType: 'Appointment letters', custodianPosition: 'HR Manager', applicability: 'All locations', location: 'Bengaluru HQ', department: 'Human Resources', employeeClass: 'Permanent' },
  { id: 'dc-2', documentType: 'Statutory registers', custodianPosition: 'Finance Analyst', applicability: 'All locations', location: 'Mumbai Office', department: 'Finance', employeeClass: 'Permanent' },
  { id: 'dc-3', documentType: 'Contract agreements', custodianPosition: 'Operations Lead', applicability: 'Pune Plant, Nagpur Depot', location: 'Pune Plant', department: 'Operations', employeeClass: 'Contract' },
  { id: 'dc-4', documentType: 'Training certificates', custodianPosition: 'HR Executive', applicability: 'Bengaluru HQ', location: 'Bengaluru HQ', department: 'Human Resources', employeeClass: 'Trainee' },
]

export interface TimelineEventConfig {
  id: string
  module: string
  parentEvent: string
  event: string
  description: string
  color: string
  document: string | null
}

export const seedTimelineEvents: TimelineEventConfig[] = [
  { id: 'te-1', module: 'Employees', parentEvent: 'Lifecycle', event: 'Joined', description: 'Date of joining milestone', color: '#2563eb', document: null },
  { id: 'te-2', module: 'Employees', parentEvent: 'Lifecycle', event: 'Confirmed', description: 'Probation confirmation', color: '#16a34a', document: 'Confirmation letter' },
  { id: 'te-3', module: 'Employees', parentEvent: 'Reporting', event: 'Manager change', description: 'Primary manager change effective', color: '#9333ea', document: null },
  { id: 'te-4', module: 'Employees', parentEvent: 'Lifecycle', event: 'Exit', description: 'Last working day', color: '#dc2626', document: 'Relieving letter' },
  { id: 'te-5', module: 'Employees', parentEvent: 'Lifecycle', event: 'Probation extended', description: 'Probation extension recorded', color: '#f59e0b', document: 'Extension letter' },
  { id: 'te-6', module: 'Employees', parentEvent: 'Lifecycle', event: 'Transferred', description: 'Inter-location / department transfer effective', color: '#0891b2', document: 'Transfer letter' },
  { id: 'te-7', module: 'Employees', parentEvent: 'Compensation', event: 'Promotion', description: 'Position / band change effective', color: '#7c3aed', document: 'Promotion letter' },
  { id: 'te-8', module: 'Employees', parentEvent: 'Lifecycle', event: 'Rehired', description: 'Rejoined after prior exit — history linked', color: '#059669', document: null },
]

export const ACCESS_SECTIONS = [
  'General Information',
  'Personal Details',
  'Documents',
  'Employee Status',
] as const
export type AccessSection = (typeof ACCESS_SECTIONS)[number]

export const ACCESS_ACTORS = ['HR', 'Reporting Manager', 'Employee'] as const
export type AccessActor = (typeof ACCESS_ACTORS)[number]

export interface FieldPermission {
  field: string
  section: AccessSection
  /** permissions[actor] = { view, edit } */
  permissions: Record<AccessActor, { view: boolean; edit: boolean }>
}

const perm = (
  hr: [boolean, boolean],
  rm: [boolean, boolean],
  emp: [boolean, boolean]
): FieldPermission['permissions'] => ({
  HR: { view: hr[0], edit: hr[1] },
  'Reporting Manager': { view: rm[0], edit: rm[1] },
  Employee: { view: emp[0], edit: emp[1] },
})

export const seedFieldPermissions: FieldPermission[] = [
  { field: 'Employee name', section: 'General Information', permissions: perm([true, true], [true, false], [true, false]) },
  { field: 'Department & position', section: 'General Information', permissions: perm([true, true], [true, false], [true, false]) },
  { field: 'Work location', section: 'General Information', permissions: perm([true, true], [true, false], [true, false]) },
  { field: 'Date of birth', section: 'Personal Details', permissions: perm([true, true], [false, false], [true, true]) },
  { field: 'Contact & address', section: 'Personal Details', permissions: perm([true, true], [false, false], [true, true]) },
  { field: 'Government IDs', section: 'Personal Details', permissions: perm([true, true], [false, false], [true, false]) },
  { field: 'Offer / appointment letters', section: 'Documents', permissions: perm([true, true], [false, false], [true, false]) },
  { field: 'Certificates', section: 'Documents', permissions: perm([true, true], [true, false], [true, true]) },
  { field: 'Lifecycle stage', section: 'Employee Status', permissions: perm([true, true], [true, false], [true, false]) },
  { field: 'Statutory eligibility flags', section: 'Employee Status', permissions: perm([true, true], [false, false], [true, false]) },
]

export interface GridColumnConfig {
  id: string
  label: string
  visible: boolean
  filterable: boolean
}

export const seedGridColumns: GridColumnConfig[] = [
  { id: 'gc-1', label: 'Company', visible: true, filterable: true },
  { id: 'gc-2', label: 'Jurisdiction', visible: true, filterable: true },
  { id: 'gc-3', label: 'Departments', visible: true, filterable: true },
  { id: 'gc-4', label: 'Position', visible: true, filterable: true },
  { id: 'gc-5', label: 'Groups', visible: false, filterable: true },
  { id: 'gc-6', label: 'Locations', visible: true, filterable: true },
  { id: 'gc-7', label: 'Primary manager', visible: true, filterable: true },
  { id: 'gc-8', label: 'Lifecycle stage', visible: true, filterable: true },
]

/** EAP-05 — access-permission configuration questions answered per class + location. */
export interface AccessQuestion {
  id: string
  question: string
  hint: string
  answer: boolean
}

export const seedAccessQuestions: AccessQuestion[] = [
  { id: 'aq-1', question: 'Include employee on the bench report?', hint: 'Unassigned employees surface on the resource bench report', answer: true },
  { id: 'aq-2', question: 'Is the employee billable?', hint: 'Drives billable-utilization reporting downstream', answer: true },
  { id: 'aq-3', question: 'Can the employee be created in Wrike?', hint: 'Provisions a linked Wrike account for project tracking', answer: false },
]

/** BEN-01/02/03 — benefit management module setup. */
export interface BenefitsSetup {
  moduleEnabled: boolean
}

export const seedBenefitsSetup: BenefitsSetup = { moduleEnabled: false }

/** COMP-01..04 — salary slabs (compensation metrics) + tolerance settings. */
export interface SalarySlab {
  id: string
  name: string
  classSpecific: boolean
  employeeClass: string | null
  rangeMin: number
  rangeMax: number
}

export const seedSalarySlabs: SalarySlab[] = [
  { id: 'sl-1', name: 'Entry band', classSpecific: true, employeeClass: 'Trainee', rangeMin: 240000, rangeMax: 420000 },
  { id: 'sl-2', name: 'Probation band', classSpecific: true, employeeClass: 'Probationer', rangeMin: 360000, rangeMax: 640000 },
  { id: 'sl-3', name: 'Associate band', classSpecific: true, employeeClass: 'Permanent', rangeMin: 600000, rangeMax: 1200000 },
  { id: 'sl-4', name: 'Senior band', classSpecific: true, employeeClass: 'Permanent', rangeMin: 1200000, rangeMax: 2400000 },
  { id: 'sl-5', name: 'Leadership band', classSpecific: false, employeeClass: null, rangeMin: 2400000, rangeMax: 4800000 },
  { id: 'sl-6', name: 'Contractor band', classSpecific: true, employeeClass: 'Contract', rangeMin: 480000, rangeMax: 1800000 },
  { id: 'sl-7', name: 'Executive band', classSpecific: false, employeeClass: null, rangeMin: 4800000, rangeMax: 9600000 },
]

export interface CompensationSettings {
  acceptedSalaryDifference: number
}

export const seedCompensationSettings: CompensationSettings = {
  acceptedSalaryDifference: 500,
}

/** COMP-06 — expense heads configured alongside compensation. */
export interface ExpenseHead {
  id: string
  name: string
  category: string
  active: boolean
}

export const seedExpenseHeads: ExpenseHead[] = [
  { id: 'eh-1', name: 'Basic', category: 'Earning', active: true },
  { id: 'eh-2', name: 'House Rent Allowance', category: 'Earning', active: true },
  { id: 'eh-3', name: 'Special Allowance', category: 'Earning', active: true },
  { id: 'eh-4', name: 'Professional Tax', category: 'Deduction', active: true },
  { id: 'eh-5', name: 'Provident Fund', category: 'Deduction', active: false },
]

/** COMP-06 — rehire settings tab next to Compensation / Expense Head. */
export interface RehireSettings {
  allowRehire: boolean
  coolingPeriodMonths: number
  requireApproval: boolean
}

export const seedRehireSettings: RehireSettings = {
  allowRehire: true,
  coolingPeriodMonths: 6,
  requireApproval: true,
}

/** CLM-01/02 — client master used for resource assignments. */
export interface ClientRecord {
  id: string
  name: string
  createdOn: string
  billable: boolean
  email: string
  address: string
}

export const seedClients: ClientRecord[] = [
  { id: 'cl-1', name: 'Northwind Retail', createdOn: '2025-11-12', billable: true, email: 'accounts@northwind.example', address: '12 Market Street, Mumbai' },
  { id: 'cl-2', name: 'Contoso Logistics', createdOn: '2026-01-08', billable: true, email: 'finance@contoso.example', address: 'Plot 4, MIDC, Pune' },
  { id: 'cl-3', name: 'Fabrikam Foods', createdOn: '2026-03-21', billable: false, email: 'ops@fabrikam.example', address: '88 Residency Road, Bengaluru' },
]

/** ACK-01..05 — acknowledgement terms mapped to document template types. */
export const ACK_TEMPLATE_TYPES = [
  'Offer Letter',
  'Joining Letter',
  'Appointment Letter',
  'Policy Document',
] as const
export type AckTemplateType = (typeof ACK_TEMPLATE_TYPES)[number]

export interface AcknowledgementConfig {
  id: string
  locations: string[]
  templateType: AckTemplateType
  terms: string
  active: boolean
}

export const seedAcknowledgementConfigs: AcknowledgementConfig[] = [
  { id: 'ak-1', locations: ['Bengaluru HQ', 'Hyderabad Hub'], templateType: 'Offer Letter', terms: 'I accept the offered terms of employment.', active: true },
  { id: 'ak-2', locations: ['Bengaluru HQ', 'Mumbai Office', 'Hyderabad Hub', 'Pune Plant', 'Nagpur Depot'], templateType: 'Policy Document', terms: 'I have read and agree to abide by the company policies.', active: true },
  { id: 'ak-3', locations: ['Pune Plant', 'Nagpur Depot'], templateType: 'Appointment Letter', terms: 'I acknowledge receipt of my appointment letter.', active: true },
  { id: 'ak-4', locations: ['Mumbai Office'], templateType: 'Joining Letter', terms: 'I confirm my date of joining and reporting details.', active: false },
]

/* ------------------------------------------------------------------ */
/* Employee code generation series (EMP master)                        */
/* ------------------------------------------------------------------ */

export interface EmployeeCodeSeries {
  autoGenerate: boolean
  prefix: string
  nextNumber: number
  paddingLength: number
}

export const seedEmployeeCodeSeries: EmployeeCodeSeries = {
  autoGenerate: true,
  prefix: 'EMP',
  nextNumber: 147,
  paddingLength: 5,
}

/**
 * Module-level mirror of the code series so the employees store (a separate
 * hook instance on another page) always reads the latest saved config.
 */
let currentCodeSeries: EmployeeCodeSeries = { ...seedEmployeeCodeSeries }

export function getEmployeeCodeSeries(): EmployeeCodeSeries {
  return currentCodeSeries
}

export function setEmployeeCodeSeries(next: EmployeeCodeSeries) {
  currentCodeSeries = { ...next }
}

/** Formats a series number, e.g. { EMP, 147, 5 } → EMP-00147. */
export function formatEmployeeCode(
  series: EmployeeCodeSeries,
  n: number = series.nextNumber
): string {
  return `${series.prefix}-${String(n).padStart(series.paddingLength, '0')}`
}

/** Returns the next code from the series and increments the counter. */
export function consumeNextEmployeeCode(): string {
  const code = formatEmployeeCode(currentCodeSeries)
  currentCodeSeries = {
    ...currentCodeSeries,
    nextNumber: currentCodeSeries.nextNumber + 1,
  }
  return code
}

/** Self-service edit settings — HR notification on employee self-edits. */
export interface SelfServiceSettings {
  notifyHrOnSelfEdit: boolean
}

export const seedSelfServiceSettings: SelfServiceSettings = {
  notifyHrOnSelfEdit: true,
}

/** CCA-01/03/04 — class change approvers configured per location. */
export interface ClassChangeApproverMapping {
  id: string
  location: string
  approvers: string[]
}

export const seedClassChangeApprovers: ClassChangeApproverMapping[] = [
  { id: 'cc-1', location: 'Bengaluru HQ', approvers: ['Meera Nair (HR Manager)', 'Arjun Rao (Engineering Manager)'] },
  { id: 'cc-2', location: 'Mumbai Office', approvers: ['Farhan Sheikh (HR Executive)'] },
  { id: 'cc-3', location: 'Pune Plant', approvers: ['Sunita Kulkarni (Operations Lead)', 'Meera Nair (HR Manager)'] },
]
