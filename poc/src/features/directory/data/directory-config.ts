import { type DirectoryFilters } from './filters'

/**
 * Governed directory configuration (DIR-10/11/15/19/20/21):
 * platform-default field policies, company overrides (versioned +
 * effective-dated), per-company hard restrictions and custom-field schema.
 */

export const DIRECTORY_FIELD_KEYS = [
  'photo',
  'position',
  'department',
  'location',
  'workEmail',
  'workPhone',
  'personalEmail',
  'salaryBand',
] as const
export type DirectoryFieldKey = (typeof DIRECTORY_FIELD_KEYS)[number]

export const FIELD_LABELS: Record<DirectoryFieldKey, string> = {
  photo: 'Photo',
  position: 'Position',
  department: 'Department',
  location: 'Location',
  workEmail: 'Work email',
  workPhone: 'Work phone',
  personalEmail: 'Personal email',
  salaryBand: 'Salary band',
}

/**
 * Field access levels evaluated by the rules engine (DIR-21):
 * - everyone      → all roles see the field
 * - admins-only   → only admin roles see it (explicit permission)
 * - restricted    → sensitive; excluded from every surface for every role
 */
export const FIELD_ACCESS_LEVELS = [
  'everyone',
  'admins-only',
  'restricted',
] as const
export type FieldAccess = (typeof FIELD_ACCESS_LEVELS)[number]

export const ACCESS_LABELS: Record<FieldAccess, string> = {
  everyone: 'Everyone',
  'admins-only': 'Admins only',
  restricted: 'Restricted (sensitive)',
}

/**
 * Phase 1 structural exclusions: personal contact details and anything
 * compensation-adjacent never render in the directory — on any surface, for
 * any role — and no platform default or company override can re-enable them.
 * The rules engine short-circuits these keys before any configured rule runs.
 */
export const PHASE1_EXCLUDED_FIELDS: DirectoryFieldKey[] = [
  'personalEmail',
  'salaryBand',
]

/** Platform-wide defaults set by the Platform Admin (DIR-11). */
export const seedPlatformRules: Record<DirectoryFieldKey, FieldAccess> = {
  photo: 'everyone',
  position: 'everyone',
  department: 'everyone',
  location: 'everyone',
  workEmail: 'everyone',
  workPhone: 'admins-only',
  personalEmail: 'restricted',
  salaryBand: 'restricted',
}

/** A versioned, effective-dated company override of the defaults (DIR-19). */
export interface CompanyPolicyVersion {
  version: number
  effectiveFrom: string
  changedBy: string
  note: string
  overrides: Partial<Record<DirectoryFieldKey, FieldAccess>>
}

export const seedCompanyPolicyVersions: CompanyPolicyVersion[] = [
  {
    version: 1,
    effectiveFrom: '2025-11-01',
    changedBy: 'System import',
    note: 'Initial configuration — inherit all platform defaults.',
    overrides: {},
  },
  {
    version: 2,
    effectiveFrom: '2026-02-15',
    changedBy: 'Meera Iyer (Company Admin)',
    note: 'Opened work phone to all employees for on-call reachability.',
    overrides: { workPhone: 'everyone' },
  },
]

/**
 * Per-company hard restrictions applied to that company's own records even in
 * group/portfolio results (DIR-15). A restricted field is omitted entirely.
 */
export const COMPANY_FIELD_RESTRICTIONS: Record<string, DirectoryFieldKey[]> = {
  'co-northwind': ['workPhone'],
}

/** Company-defined custom fields (UDFs) surfaced in directory/search (DIR-20/22). */
export interface CustomFieldDef {
  id: string
  label: string
  type: 'text' | 'select'
  options?: string[]
  showInDirectory: boolean
  searchable: boolean
  sensitive: boolean
  version: number
  effectiveFrom: string
}

export const seedCustomFields: CustomFieldDef[] = [
  {
    id: 'cf-skill',
    label: 'Primary skill',
    type: 'select',
    options: [
      'Leadership',
      'React',
      '.NET',
      'Acumatica',
      'QA Automation',
      'Recruiting',
      'Accounting',
      'Facilities',
      'Data Analytics',
      'Research',
      'Retail Ops',
    ],
    showInDirectory: true,
    searchable: true,
    sensitive: false,
    version: 2,
    effectiveFrom: '2026-01-10',
  },
  {
    id: 'cf-desk',
    label: 'Desk / seat',
    type: 'text',
    showInDirectory: true,
    searchable: false,
    sensitive: false,
    version: 1,
    effectiveFrom: '2025-11-01',
  },
  {
    id: 'cf-shift',
    label: 'Shift window',
    type: 'select',
    options: ['IST Day', 'US Overlap', 'Flexible'],
    showInDirectory: false,
    searchable: true,
    sensitive: false,
    version: 1,
    effectiveFrom: '2025-11-01',
  },
  {
    id: 'cf-medical',
    label: 'Medical notes',
    type: 'text',
    showInDirectory: false,
    searchable: false,
    sensitive: true,
    version: 1,
    effectiveFrom: '2025-11-01',
  },
]

/** A named, reusable set of advanced-search criteria (DIR-07). */
export interface SavedSearch {
  id: string
  name: string
  createdAt: string
  filters: DirectoryFilters
}

export const seedSavedSearches: SavedSearch[] = [
  {
    id: 'ss-1',
    name: 'Chennai engineers',
    createdAt: '2026-03-04',
    filters: {
      query: '',
      department: 'Engineering',
      position: 'all',
      location: 'Chennai HQ',
      workGroup: 'all',
      employmentStatus: 'all',
      companyId: 'all',
      custom: {},
    },
  },
  {
    id: 'ss-2',
    name: 'Staff on leave',
    createdAt: '2026-05-19',
    filters: {
      query: '',
      department: 'all',
      position: 'all',
      location: 'all',
      workGroup: 'all',
      employmentStatus: 'on-leave',
      companyId: 'all',
      custom: {},
    },
  },
]
