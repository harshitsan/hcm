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
}

export const seedCustodians: DocumentCustodian[] = [
  { id: 'dc-1', documentType: 'Appointment letters', custodianPosition: 'HR Manager', applicability: 'All locations' },
  { id: 'dc-2', documentType: 'Statutory registers', custodianPosition: 'Finance Analyst', applicability: 'All locations' },
  { id: 'dc-3', documentType: 'Contract agreements', custodianPosition: 'Operations Lead', applicability: 'Pune Plant, Nagpur Depot' },
  { id: 'dc-4', documentType: 'Training certificates', custodianPosition: 'HR Executive', applicability: 'Bengaluru HQ' },
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
