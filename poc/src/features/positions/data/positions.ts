/**
 * Positions module — tenancy scaffolding + position catalogue seed data.
 *
 * Tenancy model (POS-06/09/15/16): platform > portfolio > group > company.
 * The active "session" is a Company Admin of Meridian Software unless the
 * role switcher says otherwise.
 */

export const CURRENT_COMPANY_ID = 'co-meridian'
export const CURRENT_GROUP_ID = 'grp-northstar'
export const CURRENT_PORTFOLIO_ID = 'pf-atlas'

export interface Company {
  id: string
  name: string
  groupId: string
  groupName: string
  portfolioId: string
  portfolioName: string
}

export const COMPANIES: Company[] = [
  {
    id: 'co-meridian',
    name: 'Meridian Software',
    groupId: 'grp-northstar',
    groupName: 'Northstar Group',
    portfolioId: 'pf-atlas',
    portfolioName: 'Atlas Portfolio',
  },
  {
    id: 'co-bluepeak',
    name: 'BluePeak Analytics',
    groupId: 'grp-northstar',
    groupName: 'Northstar Group',
    portfolioId: 'pf-atlas',
    portfolioName: 'Atlas Portfolio',
  },
  {
    id: 'co-harborline',
    name: 'Harborline Logistics',
    groupId: 'grp-coastal',
    groupName: 'Coastal Group',
    portfolioId: 'pf-atlas',
    portfolioName: 'Atlas Portfolio',
  },
  {
    id: 'co-suncrest',
    name: 'Suncrest Retail',
    groupId: 'grp-solaris',
    groupName: 'Solaris Group',
    portfolioId: 'pf-vega',
    portfolioName: 'Vega Portfolio',
  },
]

export interface Department {
  id: string
  companyId: string
  name: string
}

export const DEPARTMENTS: Department[] = [
  { id: 'dep-eng', companyId: 'co-meridian', name: 'Engineering' },
  { id: 'dep-acu', companyId: 'co-meridian', name: 'Acumatica Practice' },
  { id: 'dep-qa', companyId: 'co-meridian', name: 'Quality Assurance' },
  { id: 'dep-hr', companyId: 'co-meridian', name: 'Human Resources' },
  { id: 'dep-fin', companyId: 'co-meridian', name: 'Finance' },
  { id: 'dep-bp-data', companyId: 'co-bluepeak', name: 'Data Science' },
  { id: 'dep-bp-ops', companyId: 'co-bluepeak', name: 'Operations' },
  { id: 'dep-hl-fleet', companyId: 'co-harborline', name: 'Fleet' },
  { id: 'dep-sc-store', companyId: 'co-suncrest', name: 'Store Ops' },
]

export const POSITION_STATUSES = ['active', 'inactive'] as const
export type PositionStatus = (typeof POSITION_STATUSES)[number]

/** Governed per-tenant custom-field definitions for positions (POS-13). */
export interface PositionCustomFieldDef {
  id: string
  companyId: string
  label: string
  type: 'text' | 'select'
  options?: string[]
}

export const seedCustomFieldDefs: PositionCustomFieldDef[] = [
  {
    id: 'cf-workmode',
    companyId: 'co-meridian',
    label: 'Work Mode',
    type: 'select',
    options: ['Onsite', 'Hybrid', 'Remote'],
  },
  {
    id: 'cf-costcenter',
    companyId: 'co-meridian',
    label: 'Cost Center',
    type: 'text',
  },
]

export interface Position {
  /** System-generated Position ID from the numbering series (POS-21/35). */
  id: string
  companyId: string
  name: string
  /** Exactly one department, always (POS-02). */
  departmentId: string
  /** Optional seniority tier; blank allowed (POS-19). */
  level: number | null
  status: PositionStatus
  /** Values keyed by PositionCustomFieldDef.id (POS-13). */
  customFields: Record<string, string>
  createdOn: string
}

export const seedPositions: Position[] = [
  // Meridian Software — note "Developer" exists in two departments (POS-43)
  // and two levels of "Developer" in Engineering (POS-19).
  { id: 'POS-MER-0001', companyId: 'co-meridian', name: 'Developer', departmentId: 'dep-eng', level: 1, status: 'active', customFields: { 'cf-workmode': 'Hybrid', 'cf-costcenter': 'CC-110' }, createdOn: '2025-02-03' },
  { id: 'POS-MER-0002', companyId: 'co-meridian', name: 'Developer', departmentId: 'dep-eng', level: 2, status: 'active', customFields: { 'cf-workmode': 'Hybrid', 'cf-costcenter': 'CC-110' }, createdOn: '2025-02-03' },
  { id: 'POS-MER-0003', companyId: 'co-meridian', name: 'Developer', departmentId: 'dep-acu', level: 1, status: 'active', customFields: { 'cf-workmode': 'Onsite', 'cf-costcenter': 'CC-210' }, createdOn: '2025-02-10' },
  { id: 'POS-MER-0004', companyId: 'co-meridian', name: 'Tech Lead', departmentId: 'dep-eng', level: 3, status: 'active', customFields: { 'cf-workmode': 'Hybrid', 'cf-costcenter': 'CC-110' }, createdOn: '2025-02-17' },
  { id: 'POS-MER-0005', companyId: 'co-meridian', name: 'QA Analyst', departmentId: 'dep-qa', level: 1, status: 'active', customFields: { 'cf-workmode': 'Remote', 'cf-costcenter': 'CC-130' }, createdOn: '2025-03-01' },
  { id: 'POS-MER-0006', companyId: 'co-meridian', name: 'QA Automation Engineer', departmentId: 'dep-qa', level: 2, status: 'active', customFields: { 'cf-workmode': 'Remote', 'cf-costcenter': 'CC-130' }, createdOn: '2025-03-01' },
  { id: 'POS-MER-0007', companyId: 'co-meridian', name: 'HR Generalist', departmentId: 'dep-hr', level: 1, status: 'active', customFields: { 'cf-workmode': 'Onsite', 'cf-costcenter': 'CC-300' }, createdOn: '2025-03-12' },
  { id: 'POS-MER-0008', companyId: 'co-meridian', name: 'Payroll Specialist', departmentId: 'dep-fin', level: 2, status: 'active', customFields: { 'cf-workmode': 'Onsite', 'cf-costcenter': 'CC-410' }, createdOn: '2025-03-20' },
  { id: 'POS-MER-0009', companyId: 'co-meridian', name: 'Financial Analyst', departmentId: 'dep-fin', level: null, status: 'active', customFields: { 'cf-workmode': 'Hybrid', 'cf-costcenter': 'CC-410' }, createdOn: '2025-04-02' },
  { id: 'POS-MER-0010', companyId: 'co-meridian', name: 'Acumatica Consultant', departmentId: 'dep-acu', level: 2, status: 'active', customFields: { 'cf-workmode': 'Onsite', 'cf-costcenter': 'CC-210' }, createdOn: '2025-04-15' },
  { id: 'POS-MER-0011', companyId: 'co-meridian', name: 'Release Manager', departmentId: 'dep-eng', level: null, status: 'inactive', customFields: { 'cf-workmode': 'Hybrid', 'cf-costcenter': 'CC-110' }, createdOn: '2025-01-09' },
  { id: 'POS-MER-0012', companyId: 'co-meridian', name: 'Office Coordinator', departmentId: 'dep-hr', level: 1, status: 'inactive', customFields: {}, createdOn: '2024-11-21' },
  // Other tenants — visible only through oversight scopes (POS-06/09/16).
  { id: 'POS-BLP-0001', companyId: 'co-bluepeak', name: 'Data Scientist', departmentId: 'dep-bp-data', level: 2, status: 'active', customFields: {}, createdOn: '2025-05-05' },
  { id: 'POS-BLP-0002', companyId: 'co-bluepeak', name: 'Developer', departmentId: 'dep-bp-data', level: 1, status: 'active', customFields: {}, createdOn: '2025-05-05' },
  { id: 'POS-BLP-0003', companyId: 'co-bluepeak', name: 'Ops Manager', departmentId: 'dep-bp-ops', level: 3, status: 'active', customFields: {}, createdOn: '2025-05-06' },
  { id: 'POS-HRB-0001', companyId: 'co-harborline', name: 'Fleet Supervisor', departmentId: 'dep-hl-fleet', level: 2, status: 'active', customFields: {}, createdOn: '2025-06-01' },
  { id: 'POS-SUN-0001', companyId: 'co-suncrest', name: 'Store Manager', departmentId: 'dep-sc-store', level: 2, status: 'active', customFields: {}, createdOn: '2025-06-10' },
]

/**
 * Bitemporal history rows for position definitions (POS-12/15): effective
 * period (valid time) + recordedAt (transaction time).
 */
export interface PositionHistoryEntry {
  id: string
  companyId: string
  positionId: string
  change: string
  effectiveFrom: string
  effectiveTo: string | null
  recordedAt: string
}

export const seedPositionHistory: PositionHistoryEntry[] = [
  { id: 'ph-1', companyId: 'co-meridian', positionId: 'POS-MER-0001', change: 'Position created in Engineering (Level 1)', effectiveFrom: '2025-02-03', effectiveTo: null, recordedAt: '2025-02-03 10:12' },
  { id: 'ph-2', companyId: 'co-meridian', positionId: 'POS-MER-0004', change: 'Renamed "Senior Developer" → "Tech Lead"', effectiveFrom: '2025-09-01', effectiveTo: null, recordedAt: '2025-08-28 16:40' },
  { id: 'ph-3', companyId: 'co-meridian', positionId: 'POS-MER-0004', change: 'Position created as "Senior Developer" (Level 3)', effectiveFrom: '2025-02-17', effectiveTo: '2025-08-31', recordedAt: '2025-02-17 09:05' },
  { id: 'ph-4', companyId: 'co-meridian', positionId: 'POS-MER-0011', change: 'Deactivated — release process automated', effectiveFrom: '2026-01-15', effectiveTo: null, recordedAt: '2026-01-15 11:30' },
  { id: 'ph-5', companyId: 'co-meridian', positionId: 'POS-MER-0012', change: 'Deactivated — role merged into HR Generalist', effectiveFrom: '2025-12-01', effectiveTo: null, recordedAt: '2025-11-28 14:22' },
]
