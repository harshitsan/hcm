/**
 * Add-a-Company onboarding wizard — data model.
 *
 * One flat SetupState holds every step's slice; the orchestrator owns it and each
 * step reads/writes through `update(patch)`. Everything here is client-only mock
 * data (this is a prototype) — templates seed it, the operator adjusts it.
 */
import { companies } from '../../data/mock'

/* ----------------------------------------------------------------- row id */
let _seq = 0
/** Stable-enough unique id for editable rows (client-only; no persistence). */
export const rid = (prefix = 'r') => `${prefix}-${(++_seq).toString(36)}`

/* ----------------------------------------------------------------- row types */
export type LocationKind = 'HQ' | 'Branch' | 'Plant' | 'Store' | 'Remote'
export type Location = { id: string; name: string; kind: LocationKind; city: string; state: string; headcount: number }

export type Dept = { id: string; name: string; head: string; parent: string }
export type Position = { id: string; title: string; dept: string; band: string }
export type PeopleGroup = { id: string; name: string; kind: 'Function' | 'Project' | 'Location' | 'Custom'; members: number }

export type Holiday = { id: string; name: string; date: string; kind: 'Public' | 'Restricted' }
export type Shift = { id: string; name: string; start: string; end: string; days: string }

export type FieldEntity = 'Employee' | 'Department' | 'Asset'
export type FieldType = 'Text' | 'Number' | 'Date' | 'Select' | 'Yes / No'
export type CustomField = { id: string; label: string; entity: FieldEntity; type: FieldType; required: boolean }

export type AccessRow = { id: string; role: string; scope: string; assignees: string }

export type Applicability = 'Company' | 'Location' | 'Department' | 'Group' | 'Employment type'
export type LeaveType = { id: string; name: string; days: number; accrual: 'Annual' | 'Monthly'; carryForward: number; applicability: Applicability }
export type AttendanceRule = { id: string; name: string; value: string; applicability: Applicability }

export type WorkflowTrigger = 'Leave' | 'Onboarding' | 'Exit' | 'Regularization'
export type Workflow = { id: string; name: string; trigger: WorkflowTrigger; chain: string; sla: string; escalation: string }

export type TemplateKind = 'Letter' | 'Notification'
export type DocTemplate = { id: string; name: string; kind: TemplateKind; channel: string }

export type AssetCategory = { id: string; name: string; tracked: boolean; depreciation: string }

export type Person = { id: string; name: string; email: string; dept: string; position: string; manager: string; location: string }

/* ----------------------------------------------------------------- the state */
export type SetupState = {
  templateId: string | null
  // 1 — company profile
  legalName: string
  tradeName: string
  website: string
  regType: string
  regNumber: string
  incorpDate: string
  jurisdictions: string[]
  currency: string
  timeZone: string
  language: string
  adminName: string
  adminEmail: string
  // 2 — locations
  locations: Location[]
  // 3 — org structure
  departments: Dept[]
  positions: Position[]
  groups: PeopleGroup[]
  // 4 — calendars
  holidays: Holiday[]
  shifts: Shift[]
  // 5 — custom fields
  customFields: CustomField[]
  // 6 — access model
  access: AccessRow[]
  // 7 — policies
  leaveTypes: LeaveType[]
  attendanceRules: AttendanceRule[]
  // 8 — workflows
  workflows: Workflow[]
  // 9 — templates
  templates: DocTemplate[]
  // 10 — asset categories
  assetCategories: AssetCategory[]
  // 11 — people
  people: Person[]
  // 12 — provision access & onboarding
  kickoffOnboarding: boolean
  defaultRole: string
  // 13 — distribute policies
  distributePolicies: string[]
  ackDeadlineDays: number
  reminderCadence: string
}

/* ----------------------------------------------------------------- catalogs */
export const INDIAN_STATES = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'Gujarat', 'West Bengal', 'Haryana'] as const
export const CURRENCIES = ['INR — Indian Rupee', 'USD — US Dollar', 'EUR — Euro', 'GBP — Pound Sterling', 'LKR — Sri Lankan Rupee'] as const
export const TIME_ZONES = ['Asia/Kolkata (GMT+5:30)', 'Asia/Colombo (GMT+5:30)', 'Asia/Dubai (GMT+4)', 'Europe/London (GMT+0)', 'America/New_York (GMT-5)'] as const
export const LANGUAGES = ['English', 'हिन्दी (Hindi)', 'Français', 'Español'] as const
export const REG_TYPES = ['GSTN', 'CIN', 'EIN', 'CRN', 'Custom'] as const

export const LOCATION_KINDS: readonly LocationKind[] = ['HQ', 'Branch', 'Plant', 'Store', 'Remote']
export const GROUP_KINDS: readonly PeopleGroup['kind'][] = ['Function', 'Project', 'Location', 'Custom']
export const HOLIDAY_KINDS: readonly Holiday['kind'][] = ['Public', 'Restricted']
export const FIELD_ENTITIES: readonly FieldEntity[] = ['Employee', 'Department', 'Asset']
export const FIELD_TYPES: readonly FieldType[] = ['Text', 'Number', 'Date', 'Select', 'Yes / No']
export const APPLICABILITY: readonly Applicability[] = ['Company', 'Location', 'Department', 'Group', 'Employment type']
export const ACCRUALS: readonly LeaveType['accrual'][] = ['Annual', 'Monthly']
export const WORKFLOW_TRIGGERS: readonly WorkflowTrigger[] = ['Leave', 'Onboarding', 'Exit', 'Regularization']
export const TEMPLATE_KINDS: readonly TemplateKind[] = ['Letter', 'Notification']
export const REMINDER_CADENCES = ['Daily', 'Every 3 days', 'Weekly'] as const

/** The 5 runtime roles, as labels the access-model step works with. */
export const ROLE_CATALOG = [
  'Company HR Admin',
  'People Manager',
  'Employee',
  'Portfolio Manager',
  'Provider Admin',
] as const

/* ----------------------------------------------------------------- blank state */
export const blankState: SetupState = {
  templateId: null,
  legalName: '',
  tradeName: '',
  website: '',
  regType: 'GSTN',
  regNumber: '',
  incorpDate: '',
  jurisdictions: ['Maharashtra'],
  currency: CURRENCIES[0],
  timeZone: TIME_ZONES[0],
  language: 'English',
  adminName: '',
  adminEmail: '',
  locations: [],
  departments: [],
  positions: [],
  groups: [],
  holidays: [],
  shifts: [],
  customFields: [],
  access: [],
  leaveTypes: [],
  attendanceRules: [],
  workflows: [],
  templates: [],
  assetCategories: [],
  people: [],
  kickoffOnboarding: true,
  defaultRole: 'Employee',
  distributePolicies: [],
  ackDeadlineDays: 14,
  reminderCadence: 'Weekly',
}

/**
 * Next company code, derived from the highest existing sequence (not array length)
 * so a new company always sorts after existing ones. Mirrors the old wizard.
 */
export function nextCompanyCode(): string {
  const maxSeq = companies.reduce((max, c) => {
    const seq = Number(c.code.split('-').pop())
    return Number.isFinite(seq) && seq > max ? seq : max
  }, 0)
  return `COMP-2026-${String(maxSeq + 1).padStart(4, '0')}`
}
