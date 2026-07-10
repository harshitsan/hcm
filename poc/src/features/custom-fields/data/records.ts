import { type SupportedEntity } from './custom-fields'

/** A stored custom field value: strings for scalars, arrays for multi-select. */
export type FieldValue = string | boolean | string[] | null

/**
 * Sample host-entity records that custom field values attach to.
 * `relationship` is relative to the signed-in demo employee (Rohan Mehta).
 */
export interface EntityRecord {
  id: string
  entity: SupportedEntity
  name: string
  subtitle: string
  relationship: 'self' | 'direct-report' | 'org'
  /** False for employees who never log in (Employee Non-User). */
  isUser: boolean
  tenant: string
  values: Record<string, FieldValue>
}

export const seedRecords: EntityRecord[] = [
  {
    id: 'rec-self',
    entity: 'Employees',
    name: 'Rohan Mehta',
    subtitle: 'Production Manager · Assembly',
    relationship: 'self',
    isUser: true,
    tenant: 'Acme Manufacturing',
    values: {
      'cf-001': 'ACM-1042',
      'cf-002': 'L',
      'cf-003': ['English', 'Hindi', 'Marathi'],
      'cf-004': '+91 98220 44551',
      'cf-006': 'nda-rohan-mehta.pdf',
      'cf-007': 'Assembly',
      'cf-008': '4500',
      'cf-009': false,
      'cf-010': 'https://linkedin.com/in/rohan-mehta',
      'cf-011': '18',
      'cf-012': 'rohan.m@gmail.com',
      'cf-013': '12.5',
      'cf-014': 'Completed plant induction week 1.',
      'cf-019': 'Yes',
      'cf-020': true,
    },
  },
  {
    id: 'rec-anita',
    entity: 'Employees',
    name: 'Anita Desai',
    subtitle: 'Line Supervisor · Assembly',
    relationship: 'direct-report',
    isUser: true,
    tenant: 'Acme Manufacturing',
    values: {
      'cf-001': 'ACM-2210',
      'cf-002': 'M',
      'cf-003': ['English', 'Hindi'],
      'cf-004': '+91 98811 20933',
      'cf-005': '2027-03-31',
      'cf-006': 'nda-anita-desai.pdf',
      'cf-007': 'Assembly',
      'cf-009': true,
      'cf-011': '12',
      'cf-012': 'anita.desai@yahoo.com',
    },
  },
  {
    id: 'rec-vikram',
    entity: 'Employees',
    name: 'Vikram Rao',
    subtitle: 'Machine Operator · Assembly (no login)',
    relationship: 'direct-report',
    isUser: false,
    tenant: 'Acme Manufacturing',
    values: {
      'cf-001': 'ACM-3305',
      'cf-002': 'XL',
      'cf-003': ['Hindi', 'Marathi'],
      'cf-004': '+91 90040 78812',
      'cf-006': 'nda-vikram-rao.pdf',
      'cf-007': 'Assembly',
      'cf-009': true,
      'cf-011': '8',
    },
  },
  {
    id: 'rec-leela',
    entity: 'Employees',
    name: 'Leela Krishnan',
    subtitle: 'Quality Analyst · Quality Assurance',
    relationship: 'org',
    isUser: true,
    tenant: 'Acme Manufacturing',
    values: {
      'cf-001': 'ACM-4118',
      'cf-002': 'S',
      'cf-003': ['English', 'Tamil'],
      'cf-004': '+91 98450 11207',
      'cf-006': 'nda-leela-krishnan.pdf',
      'cf-007': 'Quality Assurance',
      'cf-009': false,
      'cf-011': '10',
      'cf-012': 'leelak@outlook.com',
    },
  },
  {
    id: 'rec-tomas',
    entity: 'Employees',
    name: 'Tomas Berger',
    subtitle: 'Automation Engineer · Maintenance',
    relationship: 'org',
    isUser: true,
    tenant: 'Acme Manufacturing',
    values: {
      'cf-001': 'ACM-5522',
      'cf-002': 'XL',
      'cf-003': ['English', 'German'],
      'cf-004': '+49 171 5566021',
      'cf-005': '2026-11-30',
      'cf-006': 'nda-tomas-berger.pdf',
      'cf-007': 'Maintenance',
      'cf-009': false,
      'cf-011': '15',
    },
  },
  {
    id: 'rec-dept-asm',
    entity: 'Departments',
    name: 'Assembly',
    subtitle: 'Pune Plant · 142 employees',
    relationship: 'org',
    isUser: false,
    tenant: 'Acme Manufacturing',
    values: {},
  },
  {
    id: 'rec-dept-qa',
    entity: 'Departments',
    name: 'Quality Assurance',
    subtitle: 'Pune Plant · 38 employees',
    relationship: 'org',
    isUser: false,
    tenant: 'Acme Manufacturing',
    values: {},
  },
  {
    id: 'rec-dept-mnt',
    entity: 'Departments',
    name: 'Maintenance',
    subtitle: 'Pune Plant · 27 employees',
    relationship: 'org',
    isUser: false,
    tenant: 'Acme Manufacturing',
    values: {},
  },
  {
    id: 'rec-loc-pune',
    entity: 'Locations',
    name: 'Pune Plant',
    subtitle: 'Chakan Industrial Belt, MH',
    relationship: 'org',
    isUser: false,
    tenant: 'Acme Manufacturing',
    values: { 'cf-017': '450' },
  },
  {
    id: 'rec-comp-acme',
    entity: 'Companies',
    name: 'Acme Manufacturing',
    subtitle: 'Acme Group · India',
    relationship: 'org',
    isUser: false,
    tenant: 'Acme Manufacturing',
    values: { 'cf-016': '804467210' },
  },
  {
    id: 'rec-pos-line',
    entity: 'Positions',
    name: 'Line Supervisor',
    subtitle: 'Assembly · Grade M2',
    relationship: 'org',
    isUser: false,
    tenant: 'Acme Manufacturing',
    values: { 'cf-018': 'Level 3 (Supervisor)' },
  },
]

/** Bitemporal history of custom field VALUE changes (L1 history). */
export interface ValueHistoryEntry {
  id: string
  recordId: string
  recordName: string
  fieldId: string
  fieldName: string
  priorValue: string
  newValue: string
  effectiveDate: string
  changedAt: string
  changedBy: string
  kind: 'change' | 'correction'
}

export const seedValueHistory: ValueHistoryEntry[] = [
  {
    id: 'vh-01',
    recordId: 'rec-anita',
    recordName: 'Anita Desai',
    fieldId: 'cf-004',
    fieldName: 'Emergency Contact Phone',
    priorValue: '—',
    newValue: '+91 98200 11002',
    effectiveDate: '2026-01-05',
    changedAt: '2026-01-05',
    changedBy: 'Company Admin',
    kind: 'change',
  },
  {
    id: 'vh-02',
    recordId: 'rec-anita',
    recordName: 'Anita Desai',
    fieldId: 'cf-004',
    fieldName: 'Emergency Contact Phone',
    priorValue: '+91 98200 11002',
    newValue: '+91 98811 20933',
    effectiveDate: '2026-04-20',
    changedAt: '2026-04-21',
    changedBy: 'Anita Desai',
    kind: 'change',
  },
  {
    id: 'vh-03',
    recordId: 'rec-self',
    recordName: 'Rohan Mehta',
    fieldId: 'cf-011',
    fieldName: 'Annual Bonus Target',
    priorValue: '15%',
    newValue: '18%',
    effectiveDate: '2026-04-01',
    changedAt: '2026-03-22',
    changedBy: 'Company Admin',
    kind: 'change',
  },
  {
    id: 'vh-04',
    recordId: 'rec-vikram',
    recordName: 'Vikram Rao',
    fieldId: 'cf-001',
    fieldName: 'Badge ID',
    priorValue: 'ACM-3035',
    newValue: 'ACM-3305',
    effectiveDate: '2026-02-11',
    changedAt: '2026-02-14',
    changedBy: 'Company Admin',
    kind: 'correction',
  },
  {
    id: 'vh-05',
    recordId: 'rec-anita',
    recordName: 'Anita Desai',
    fieldId: 'cf-005',
    fieldName: 'Visa Expiry',
    priorValue: '2026-09-30',
    newValue: '2027-03-31',
    effectiveDate: '2026-05-02',
    changedAt: '2026-05-02',
    changedBy: 'Company Admin',
    kind: 'change',
  },
  {
    id: 'vh-06',
    recordId: 'rec-tomas',
    recordName: 'Tomas Berger',
    fieldId: 'cf-007',
    fieldName: 'Cost Center',
    priorValue: 'Assembly',
    newValue: 'Maintenance',
    effectiveDate: '2026-03-01',
    changedAt: '2026-02-26',
    changedBy: 'Group Company Admin',
    kind: 'change',
  },
  {
    id: 'vh-07',
    recordId: 'rec-self',
    recordName: 'Rohan Mehta',
    fieldId: 'cf-002',
    fieldName: 'T-Shirt Size',
    priorValue: 'M',
    newValue: 'L',
    effectiveDate: '2026-06-10',
    changedAt: '2026-06-10',
    changedBy: 'Rohan Mehta',
    kind: 'change',
  },
]

/** Portfolio-wide view of how field definitions are applied per company. */
export interface PortfolioCompanyStatus {
  id: string
  company: string
  group: string
  companyFieldCount: number
  platformFieldsApplied: number
  platformFieldsTotal: number
  deviations: string[]
}

export const seedPortfolio: PortfolioCompanyStatus[] = [
  {
    id: 'pc-01',
    company: 'Acme Manufacturing',
    group: 'Acme Group',
    companyFieldCount: 11,
    platformFieldsApplied: 4,
    platformFieldsTotal: 4,
    deviations: [],
  },
  {
    id: 'pc-02',
    company: 'Acme Components',
    group: 'Acme Group',
    companyFieldCount: 6,
    platformFieldsApplied: 4,
    platformFieldsTotal: 4,
    deviations: ['Cost Center options differ from group standard'],
  },
  {
    id: 'pc-03',
    company: 'Northwind Retail',
    group: 'Northwind Holdings',
    companyFieldCount: 9,
    platformFieldsApplied: 3,
    platformFieldsTotal: 4,
    deviations: ['DUNS Number not yet populated on 2 company records'],
  },
  {
    id: 'pc-04',
    company: 'Northwind Logistics',
    group: 'Northwind Holdings',
    companyFieldCount: 4,
    platformFieldsApplied: 4,
    platformFieldsTotal: 4,
    deviations: [],
  },
  {
    id: 'pc-05',
    company: 'Zephyr Logistics',
    group: 'Independent',
    companyFieldCount: 13,
    platformFieldsApplied: 4,
    platformFieldsTotal: 4,
    deviations: [
      'Badge ID duplicate: local field overlaps platform naming standard',
    ],
  },
]

export const CONDITION_OPERATORS = [
  'equals',
  'contains',
  'greater-than',
  'less-than',
  'is-true',
  'is-false',
  'before',
  'after',
  'includes',
] as const

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number]

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'equals',
  contains: 'contains',
  'greater-than': 'is greater than',
  'less-than': 'is less than',
  'is-true': 'is true',
  'is-false': 'is false',
  before: 'is before',
  after: 'is after',
  includes: 'includes',
}

/** Workflow / rules conditions that read custom fields at runtime. */
export interface WorkflowCondition {
  id: string
  name: string
  fieldId: string
  operator: ConditionOperator
  value: string
  action: string
  enabled: boolean
}

export const seedConditions: WorkflowCondition[] = [
  {
    id: 'wc-01',
    name: 'Visa renewal escalation',
    fieldId: 'cf-005',
    operator: 'before',
    value: '2027-01-01',
    action: 'Route case to HR Ops queue',
    enabled: true,
  },
  {
    id: 'wc-02',
    name: 'High bonus approval',
    fieldId: 'cf-011',
    operator: 'greater-than',
    value: '15',
    action: 'Require CFO approval step',
    enabled: true,
  },
  {
    id: 'wc-03',
    name: 'Union onboarding task',
    fieldId: 'cf-009',
    operator: 'is-true',
    value: '',
    action: 'Assign union-representative intro task',
    enabled: true,
  },
  {
    id: 'wc-04',
    name: 'Legacy shift rule',
    fieldId: 'cf-999',
    operator: 'equals',
    value: 'Night',
    action: 'Add shift allowance',
    enabled: false,
  },
]
