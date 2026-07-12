/**
 * Data Management catalog — governed metadata for the import/export engine.
 * Entities are classified into dependency tiers (FR 6.24.3) and imports are
 * routed by module → function (Kensium Data Import routing).
 */

export const FILE_FORMATS = ['CSV', 'XLS', 'XLSX', 'JSON'] as const
export type FileFormat = (typeof FILE_FORMATS)[number]

/** Formats offered for data export (FR 6.24.2). */
export const EXPORT_FORMATS = ['CSV', 'XLSX', 'JSON'] as const satisfies
  readonly FileFormat[]

export const FILE_TYPES = ['Excel', 'Flat file', 'Xml'] as const
export type FileType = (typeof FILE_TYPES)[number]

export const DELIMITERS = [
  'Comma (,)',
  'Tab',
  'Pipe (|)',
  'Semicolon (;)',
] as const

export const TEXT_QUALIFIERS = [
  'Double quote (")',
  "Single quote (')",
  'None',
] as const

export const HEADER_FORMATS = ['First row', 'Not present'] as const
export type HeaderFormat = (typeof HEADER_FORMATS)[number]

/** Dependency tiers, in mandatory import order (FR 6.24.3). */
export const TIERS = [
  'Foundation',
  'Organizational',
  'Workforce',
  'Transactional',
] as const
export type Tier = (typeof TIERS)[number]

/** Plain-language tier headings shown in the import entity picker. */
export const TIER_HEADINGS: Record<Tier, string> = {
  Foundation: 'Tier 1 — Foundation masters',
  Organizational: 'Tier 2 — Organization masters',
  Workforce: 'Tier 3 — Workforce masters',
  Transactional: 'Tier 4 — Transactional data',
}

export function tierIndex(tier: Tier): number {
  return TIERS.indexOf(tier)
}

export const DUPLICATE_HANDLING = [
  'Ignore duplicates',
  'Overwrite duplicates',
] as const
export type DuplicateHandling = (typeof DUPLICATE_HANDLING)[number]

export const PROCESS_TYPES = [
  'All valid records',
  'No records if error occurred',
] as const
export type ProcessType = (typeof PROCESS_TYPES)[number]

/** Governed platform limits (FR 6.24.2). */
export const MAX_FILE_SIZE_MB = 50
export const MAX_BATCH_RECORDS = 10000

export interface DataEntity {
  id: string
  name: string
  kind: 'Master' | 'Transactional'
  tier: Tier
}

export const DATA_ENTITIES: DataEntity[] = [
  { id: 'company', name: 'Company', kind: 'Master', tier: 'Foundation' },
  {
    id: 'location',
    name: 'Location',
    kind: 'Master',
    tier: 'Organizational',
  },
  {
    id: 'department',
    name: 'Department',
    kind: 'Master',
    tier: 'Organizational',
  },
  { id: 'group', name: 'Group', kind: 'Master', tier: 'Organizational' },
  { id: 'employee', name: 'Employee', kind: 'Master', tier: 'Workforce' },
  {
    id: 'leaves',
    name: 'Leaves',
    kind: 'Transactional',
    tier: 'Transactional',
  },
  {
    id: 'attendance',
    name: 'Attendance',
    kind: 'Transactional',
    tier: 'Transactional',
  },
]

export const IMPORT_MODULES = [
  'Organization',
  'Employee',
  'Time Management',
  'Payroll',
] as const

export interface ImportFunction {
  id: string
  module: (typeof IMPORT_MODULES)[number]
  name: string
  entityId: string
  /** Field auto-assigned from a number series when left to the system. */
  numberSeriesField?: string
  requiredFields: string[]
  fields: string[]
  /** Dynamic/custom fields defined for the entity (DM-20). */
  customFields: string[]
}

export const IMPORT_FUNCTIONS: ImportFunction[] = [
  {
    id: 'fn-company',
    module: 'Organization',
    name: 'Company Master',
    entityId: 'company',
    numberSeriesField: 'Company Code',
    requiredFields: ['Company Code', 'Company Name', 'Country'],
    fields: ['Currency', 'Time Zone', 'Address'],
    customFields: ['Registration Id'],
  },
  {
    id: 'fn-location',
    module: 'Organization',
    name: 'Location Master',
    entityId: 'location',
    requiredFields: ['Location Code', 'Location Name', 'Parent Company'],
    fields: ['City', 'State', 'Country'],
    customFields: [],
  },
  {
    id: 'fn-department',
    module: 'Organization',
    name: 'Department Master',
    entityId: 'department',
    numberSeriesField: 'Department Code',
    requiredFields: ['Department Code', 'Department Name', 'Parent Company'],
    fields: ['Cost Center', 'Department Head'],
    customFields: ['Floor Zone'],
  },
  {
    id: 'fn-group',
    module: 'Organization',
    name: 'Group Master',
    entityId: 'group',
    requiredFields: ['Group Code', 'Group Name'],
    fields: ['Description'],
    customFields: [],
  },
  {
    id: 'fn-employee',
    module: 'Employee',
    name: 'Employee Master',
    entityId: 'employee',
    numberSeriesField: 'Employee Id',
    requiredFields: [
      'Employee Id',
      'First Name',
      'Last Name',
      'Department',
      'Joining Date',
    ],
    fields: ['Email', 'Designation', 'Location', 'Effective From'],
    customFields: ['T-Shirt Size', 'Transit Route'],
  },
  {
    id: 'fn-employee-docs',
    module: 'Employee',
    name: 'Employee Documents',
    entityId: 'employee',
    requiredFields: ['Employee Id', 'Document Type', 'File Name'],
    fields: ['Issue Date', 'Expiry Date'],
    customFields: [],
  },
  {
    id: 'fn-leave-balance',
    module: 'Time Management',
    name: 'Leave Balance',
    entityId: 'leaves',
    requiredFields: ['Employee Id', 'Leave Type', 'Balance', 'Effective From'],
    fields: ['Accrual Rate', 'Carry Forward'],
    customFields: [],
  },
  {
    id: 'fn-attendance',
    module: 'Time Management',
    name: 'Attendance Records',
    entityId: 'attendance',
    requiredFields: ['Employee Id', 'Date', 'Check In', 'Check Out'],
    fields: ['Shift', 'Source Device'],
    customFields: [],
  },
  {
    id: 'fn-timesheet',
    module: 'Time Management',
    name: 'Assign Timesheet',
    entityId: 'attendance',
    requiredFields: ['Employee Id', 'Timesheet Template', 'Effective From'],
    fields: ['Project Name'],
    customFields: [],
  },
  {
    id: 'fn-salary',
    module: 'Payroll',
    name: 'Salary Structure',
    entityId: 'employee',
    requiredFields: ['Employee Id', 'Structure Code', 'Effective From'],
    fields: ['Basic', 'HRA', 'Allowances'],
    customFields: [],
  },
]

export interface CompanyRef {
  id: string
  name: string
  group: string
  portfolio: string
}

export const COMPANIES: CompanyRef[] = [
  {
    id: 'co-01',
    name: 'Aurora Software Ltd',
    group: 'Aurora Group',
    portfolio: 'Northwind Portfolio',
  },
  {
    id: 'co-02',
    name: 'Aurora Analytics Pvt Ltd',
    group: 'Aurora Group',
    portfolio: 'Northwind Portfolio',
  },
  {
    id: 'co-03',
    name: 'Aurora Field Services',
    group: 'Aurora Group',
    portfolio: 'Northwind Portfolio',
  },
  {
    id: 'co-04',
    name: 'Beacon Logistics Inc',
    group: 'Beacon Group',
    portfolio: 'Northwind Portfolio',
  },
  {
    id: 'co-05',
    name: 'Beacon Freight LLC',
    group: 'Beacon Group',
    portfolio: 'Northwind Portfolio',
  },
  {
    id: 'co-06',
    name: 'Crestline Retail Co',
    group: 'Crestline Group',
    portfolio: 'Southbridge Portfolio',
  },
  {
    id: 'co-07',
    name: 'Crestline Foods Ltd',
    group: 'Crestline Group',
    portfolio: 'Southbridge Portfolio',
  },
]

/** Tenant context of the signed-in demo persona. */
export const HOME_COMPANY_ID = 'co-01'
export const HOME_GROUP = 'Aurora Group'
export const HOME_PORTFOLIO = 'Northwind Portfolio'

export function entityById(id: string): DataEntity | undefined {
  return DATA_ENTITIES.find((e) => e.id === id)
}

export function functionById(id: string): ImportFunction | undefined {
  return IMPORT_FUNCTIONS.find((f) => f.id === id)
}
