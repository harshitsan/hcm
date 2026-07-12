export const CURRENT_EMPLOYEE = 'Anika Sharma'
export const CURRENT_TENANT = 'Kensium Solutions Pvt Ltd'

export type FieldMode = 'editable' | 'view-only' | 'hidden'
export type FieldSection = 'Personal' | 'Employment'
export type FieldInputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'textarea'
  | 'dropdown'
  | 'checkbox'
  | 'radio'

/**
 * Metadata-driven field schema (ESS-14/16). The forms engine renders profile
 * view/edit surfaces from these definitions instead of hard-coded forms.
 */
export interface ProfileField {
  id: string
  label: string
  section: FieldSection
  mode: FieldMode
  /** Changes to this field are routed through the approval engine (ESS-15). */
  approvalRequired: boolean
  isUdf: boolean
  inputType: FieldInputType
  /** Configured choices for dropdown / radio fields (UDF option lists). */
  options?: string[]
  /** Mandatory flag from the field definition — saves require a value. */
  required?: boolean
  minLength?: number
  pattern?: string
  patternMessage?: string
  effectiveFrom: string
}

export const seedProfileFields: ProfileField[] = [
  { id: 'fullName', label: 'Legal name', section: 'Personal', mode: 'editable', approvalRequired: true, isUdf: false, inputType: 'text', minLength: 2, effectiveFrom: '2026-01-01' },
  { id: 'preferredName', label: 'Preferred name', section: 'Personal', mode: 'editable', approvalRequired: false, isUdf: false, inputType: 'text', minLength: 2, effectiveFrom: '2026-01-01' },
  { id: 'personalEmail', label: 'Personal email', section: 'Personal', mode: 'editable', approvalRequired: false, isUdf: false, inputType: 'email', effectiveFrom: '2026-01-01' },
  { id: 'mobile', label: 'Mobile number', section: 'Personal', mode: 'editable', approvalRequired: false, isUdf: false, inputType: 'tel', pattern: '^\\+?[0-9 -]{10,15}$', patternMessage: 'Enter a valid phone number', effectiveFrom: '2026-01-01' },
  { id: 'currentAddress', label: 'Current address', section: 'Personal', mode: 'editable', approvalRequired: false, isUdf: false, inputType: 'text', minLength: 10, effectiveFrom: '2026-01-01' },
  { id: 'emergencyContact', label: 'Emergency contact', section: 'Personal', mode: 'editable', approvalRequired: false, isUdf: false, inputType: 'text', minLength: 5, effectiveFrom: '2026-03-01' },
  { id: 'dateOfBirth', label: 'Date of birth', section: 'Personal', mode: 'editable', approvalRequired: true, isUdf: false, inputType: 'date', effectiveFrom: '2026-01-01' },
  { id: 'panNumber', label: 'PAN number', section: 'Personal', mode: 'hidden', approvalRequired: true, isUdf: false, inputType: 'text', effectiveFrom: '2026-01-01' },
  { id: 'bankDetails', label: 'Bank details', section: 'Personal', mode: 'hidden', approvalRequired: true, isUdf: false, inputType: 'text', effectiveFrom: '2026-01-01' },
  { id: 'employeeId', label: 'Employee ID', section: 'Employment', mode: 'view-only', approvalRequired: true, isUdf: false, inputType: 'text', effectiveFrom: '2026-01-01' },
  { id: 'designation', label: 'Designation', section: 'Employment', mode: 'view-only', approvalRequired: true, isUdf: false, inputType: 'text', effectiveFrom: '2026-01-01' },
  { id: 'department', label: 'Department', section: 'Employment', mode: 'view-only', approvalRequired: true, isUdf: false, inputType: 'text', effectiveFrom: '2026-01-01' },
  { id: 'reportingManager', label: 'Reporting manager', section: 'Employment', mode: 'view-only', approvalRequired: true, isUdf: false, inputType: 'text', effectiveFrom: '2026-01-01' },
  { id: 'workLocation', label: 'Work location', section: 'Employment', mode: 'editable', approvalRequired: true, isUdf: false, inputType: 'text', minLength: 3, effectiveFrom: '2026-01-01' },
  { id: 'dateOfJoining', label: 'Date of joining', section: 'Employment', mode: 'view-only', approvalRequired: true, isUdf: false, inputType: 'date', effectiveFrom: '2026-01-01' },
  { id: 'compensationBand', label: 'Compensation band', section: 'Employment', mode: 'hidden', approvalRequired: true, isUdf: false, inputType: 'text', effectiveFrom: '2026-01-01' },
  { id: 'udfTshirtSize', label: 'T-shirt size (UDF)', section: 'Personal', mode: 'editable', approvalRequired: false, isUdf: true, inputType: 'text', minLength: 1, effectiveFrom: '2026-04-01' },
  { id: 'udfCommuteMode', label: 'Commute mode (UDF)', section: 'Employment', mode: 'editable', approvalRequired: false, isUdf: true, inputType: 'text', minLength: 3, effectiveFrom: '2026-05-01' },
  { id: 'udfBusFacility', label: 'Bus facility required (UDF)', section: 'Employment', mode: 'editable', approvalRequired: false, isUdf: true, inputType: 'dropdown', options: ['Yes', 'No'], required: true, effectiveFrom: '2026-06-01' },
  { id: 'udfWorkMode', label: 'Preferred work mode (UDF)', section: 'Employment', mode: 'editable', approvalRequired: false, isUdf: true, inputType: 'radio', options: ['Office', 'Hybrid', 'Remote'], required: true, effectiveFrom: '2026-06-15' },
]

export const seedProfileValues: Record<string, string> = {
  fullName: 'Anika Sharma',
  preferredName: 'Anika',
  personalEmail: 'anika.sharma@gmail.com',
  mobile: '+91 98450 22331',
  currentAddress: '14/2 Lavelle Road, Bengaluru, Karnataka 560001',
  emergencyContact: 'Rohit Sharma — +91 98450 88214',
  dateOfBirth: '1994-08-17',
  panNumber: 'BXKPS4821F',
  bankDetails: 'HDFC Bank — account ending 4821',
  employeeId: 'KEN-0417',
  designation: 'Senior Software Engineer',
  department: 'Product Engineering',
  reportingManager: 'Vikram Mehta',
  workLocation: 'Bengaluru — Tower B',
  dateOfJoining: '2022-02-14',
  compensationBand: 'Band L4',
  udfTshirtSize: 'M',
  udfCommuteMode: 'Company shuttle',
  udfBusFacility: 'Yes',
  udfWorkMode: 'Hybrid',
}

/**
 * Fields that hold compensation data are comp-dark in Phase 1: they never
 * render on any self-service surface and cannot be un-hidden by
 * configuration.
 */
export const COMP_DARK_FIELD_IDS = ['compensationBand'] as const

export type EditPolicy = 'direct' | 'approval' | 'hr-only'

export const EDIT_POLICY_LABELS: Record<EditPolicy, string> = {
  direct: 'Direct edit',
  approval: 'Approval required',
  'hr-only': 'HR only',
}

export const EDIT_POLICY_HELP: Record<EditPolicy, string> = {
  direct: 'Employees update these fields themselves — the change applies immediately and is recorded.',
  approval: 'Employee edits create a change request; the prior value stays in effect until it is approved.',
  'hr-only': 'Employees cannot see or edit these fields — HR maintains them on their behalf.',
}

/**
 * Field groups the Company Admin controls from one place. The group policy
 * drives how the edit rule engine treats each member field: direct edit,
 * approval-routed, or HR only.
 */
export interface ProfileFieldGroup {
  id: string
  label: string
  description: string
  fieldIds: string[]
}

export const PROFILE_FIELD_GROUPS: ProfileFieldGroup[] = [
  { id: 'contact', label: 'Personal contact', description: 'Mobile number, personal email and emergency contact', fieldIds: ['mobile', 'personalEmail', 'emergencyContact'] },
  { id: 'address', label: 'Address', description: 'Current residential address', fieldIds: ['currentAddress'] },
  { id: 'identity', label: 'Legal name & birth details', description: 'Legal name and date of birth', fieldIds: ['fullName', 'dateOfBirth'] },
  { id: 'government-ids', label: 'Government IDs', description: 'PAN and other government identifiers', fieldIds: ['panNumber'] },
  { id: 'bank', label: 'Bank details', description: 'Bank account details', fieldIds: ['bankDetails'] },
  { id: 'work-location', label: 'Work location', description: 'Assigned office or work base', fieldIds: ['workLocation'] },
]

export const seedGroupPolicies: Record<string, EditPolicy> = {
  contact: 'direct',
  address: 'direct',
  identity: 'approval',
  'government-ids': 'hr-only',
  bank: 'hr-only',
  'work-location': 'approval',
}

export type ChangeRequestStatus = 'Pending approval' | 'Approved' | 'Rejected'

/** A self-service edit routed through the workflow/approval engine (ESS-15). */
export interface ChangeRequest {
  id: string
  fieldId: string
  fieldLabel: string
  currentValue: string
  requestedValue: string
  /** Why the employee asked for the change. */
  reason: string
  requestedBy: string
  submittedOn: string
  status: ChangeRequestStatus
  /** Configured approver graph the engine routes through — not hard-coded. */
  approverGraph: string[]
  pendingWith: string | null
  decidedBy: string | null
  decidedOn: string | null
  decisionComment: string | null
}

export const seedChangeRequests: ChangeRequest[] = [
  {
    id: 'cr-2001',
    fieldId: 'workLocation',
    fieldLabel: 'Work location',
    currentValue: 'Bengaluru — Tower B',
    requestedValue: 'Hyderabad — Hitec City',
    reason: 'Relocating to Hyderabad to be closer to family.',
    requestedBy: CURRENT_EMPLOYEE,
    submittedOn: '2026-06-24',
    status: 'Pending approval',
    approverGraph: ['Vikram Mehta', 'HR Partner'],
    pendingWith: 'Vikram Mehta',
    decidedBy: null,
    decidedOn: null,
    decisionComment: null,
  },
  {
    id: 'cr-2002',
    fieldId: 'currentAddress',
    fieldLabel: 'Current address',
    currentValue: '22 MG Road, Bengaluru 560008',
    requestedValue: '14/2 Lavelle Road, Bengaluru, Karnataka 560001',
    reason: 'Moved to a new rented apartment in May.',
    requestedBy: CURRENT_EMPLOYEE,
    submittedOn: '2026-05-11',
    status: 'Approved',
    approverGraph: ['Vikram Mehta'],
    pendingWith: null,
    decidedBy: 'Vikram Mehta',
    decidedOn: '2026-05-12',
    decisionComment: 'Verified against the new rental agreement.',
  },
  {
    id: 'cr-2003',
    fieldId: 'fullName',
    fieldLabel: 'Legal name',
    currentValue: 'Anika Sharma',
    requestedValue: 'Anika S. Sharma',
    reason: 'Match the name printed on my passport.',
    requestedBy: CURRENT_EMPLOYEE,
    submittedOn: '2026-06-02',
    status: 'Rejected',
    approverGraph: ['Vikram Mehta', 'HR Partner'],
    pendingWith: null,
    decidedBy: 'HR Partner',
    decidedOn: '2026-06-10',
    decisionComment: 'Please upload the passport copy to your documents first, then resubmit.',
  },
]

export type VersionKind = 'initial' | 'update' | 'correction'

/** Bitemporal canonical record versions (ESS-12): valid-time + transaction-time. */
export interface RecordVersion {
  id: string
  fieldLabel: string
  value: string
  previousValue: string
  validFrom: string
  recordedAt: string
  changedBy: string
  kind: VersionKind
  tenant: string
  employee: string
}

export const seedRecordVersions: RecordVersion[] = [
  { id: 'rv-01', fieldLabel: 'Current address', value: '22 MG Road, Bengaluru 560008', previousValue: '—', validFrom: '2022-02-14', recordedAt: '2022-02-14 10:02', changedBy: 'HR Onboarding', kind: 'initial', tenant: CURRENT_TENANT, employee: CURRENT_EMPLOYEE },
  { id: 'rv-02', fieldLabel: 'Current address', value: '14/2 Lavelle Road, Bengaluru, Karnataka 560001', previousValue: '22 MG Road, Bengaluru 560008', validFrom: '2026-05-15', recordedAt: '2026-05-12 16:41', changedBy: 'Self-service (approved)', kind: 'update', tenant: CURRENT_TENANT, employee: CURRENT_EMPLOYEE },
  { id: 'rv-03', fieldLabel: 'Mobile number', value: '+91 98450 22331', previousValue: '+91 99010 45512', kind: 'update', validFrom: '2026-03-02', recordedAt: '2026-03-02 09:15', changedBy: 'Self-service', tenant: CURRENT_TENANT, employee: CURRENT_EMPLOYEE },
  { id: 'rv-04', fieldLabel: 'Designation', value: 'Senior Software Engineer', previousValue: 'Software Engineer', validFrom: '2025-04-01', recordedAt: '2025-03-28 11:20', changedBy: 'HR (promotion cycle)', kind: 'update', tenant: CURRENT_TENANT, employee: CURRENT_EMPLOYEE },
  { id: 'rv-05', fieldLabel: 'Emergency contact', value: 'Rohit Sharma — +91 98450 88214', previousValue: 'Rohit Sharma — +91 98450 88213', validFrom: '2026-06-01', recordedAt: '2026-06-03 14:05', changedBy: 'Self-service (correction)', kind: 'correction', tenant: CURRENT_TENANT, employee: CURRENT_EMPLOYEE },
]

/** Leave balances surfaced by the self-service leave section (ESS-05). */
export interface LeaveBalance {
  type: string
  entitled: number
  used: number
}

export const seedLeaveBalances: LeaveBalance[] = [
  { type: 'Earned leave', entitled: 18, used: 7 },
  { type: 'Casual leave', entitled: 8, used: 3 },
  { type: 'Sick leave', entitled: 10, used: 2 },
  { type: 'Comp-off credits', entitled: 3, used: 1 },
]
