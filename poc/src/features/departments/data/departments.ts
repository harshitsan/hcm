import { type Role } from '@/context/role-context'

/* ------------------------------------------------------------------ */
/* Tenancy — companies grouped under group companies and a portfolio.  */
/* ------------------------------------------------------------------ */

export interface Company {
  id: string
  name: string
  group: string
  portfolio: string
}

export const COMPANIES: Company[] = [
  {
    id: 'co-aurora-retail',
    name: 'Aurora Retail Ltd',
    group: 'Aurora Group',
    portfolio: 'Helix Portfolio',
  },
  {
    id: 'co-aurora-logistics',
    name: 'Aurora Logistics Pvt Ltd',
    group: 'Aurora Group',
    portfolio: 'Helix Portfolio',
  },
  {
    id: 'co-borealis-foods',
    name: 'Borealis Foods Inc',
    group: 'Borealis Group',
    portfolio: 'Helix Portfolio',
  },
]

/** The tenant the signed-in Company Admin / Employee belongs to. */
export const CURRENT_COMPANY_ID = 'co-aurora-retail'
/** The group the signed-in Group Company Admin governs. */
export const CURRENT_GROUP = 'Aurora Group'

/* ------------------------------------------------------------------ */
/* Departments                                                         */
/* ------------------------------------------------------------------ */

export const DEPARTMENT_STATUSES = ['active', 'inactive'] as const
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number]

export interface Department {
  /** Stable system Department ID, unique within a company (DEPT-23). */
  id: string
  companyId: string
  name: string
  /** Short code shown alongside the name (DEPT-21). */
  acronym: string
  /** Free-text purpose/scope documentation (DEPT-22). */
  description: string
  /** Parent for hierarchical nesting; null = top-level (DEPT-02/03). */
  parentId: string | null
  /** Designated department head — an employee of the company (DEPT-04). */
  headId: string | null
  status: DepartmentStatus
  /** Mapped office locations/sites (DEPT-27). */
  locationIds: string[]
  /** Work areas occupied within mapped locations (DEPT-28). */
  workAreaIds: string[]
  /** Shifts selectable for this department's employees (DEPT-29). */
  shiftIds: string[]
  /** Default shift inherited by members without a specific shift. */
  defaultShiftId: string | null
  /** Roles allowed to view the department's shift roster (DEPT-31). */
  rosterVisibleTo: Role[]
  /** Values captured for tenant-configured custom fields (DEPT-14). */
  customFields: Record<string, string>
}

const ALL_ADMIN_ROLES: Role[] = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
]

const dept = (
  partial: Omit<Department, 'workAreaIds' | 'shiftIds' | 'defaultShiftId' | 'rosterVisibleTo' | 'customFields'> &
    Partial<Department>
): Department => ({
  workAreaIds: [],
  shiftIds: ['sh-1'],
  defaultShiftId: 'sh-1',
  rosterVisibleTo: [...ALL_ADMIN_ROLES, 'Employee (User)'],
  customFields: {},
  ...partial,
})

export const seedDepartments: Department[] = [
  // --- Aurora Retail (current tenant) — 4-level hierarchy ---
  dept({
    id: 'DEP-0001',
    companyId: 'co-aurora-retail',
    name: 'Corporate',
    acronym: 'CORP',
    description: 'Group corporate office covering all central functions.',
    parentId: null,
    headId: 'emp-05',
    status: 'active',
    locationIds: ['loc-1'],
    workAreaIds: ['wa-1'],
    customFields: { 'cf-1': 'CC-1000', 'cf-3': 'Core' },
  }),
  dept({
    id: 'DEP-0002',
    companyId: 'co-aurora-retail',
    name: 'Human Resources',
    acronym: 'HR',
    description: 'People operations, talent and employee experience.',
    parentId: 'DEP-0001',
    headId: 'emp-01',
    status: 'active',
    locationIds: ['loc-1'],
    workAreaIds: ['wa-1'],
    customFields: { 'cf-1': 'CC-1100', 'cf-3': 'Support' },
  }),
  dept({
    id: 'DEP-0003',
    companyId: 'co-aurora-retail',
    name: 'Talent Acquisition',
    acronym: 'TA',
    description: 'Sourcing, interviewing and hiring across all sites.',
    parentId: 'DEP-0002',
    headId: 'emp-02',
    status: 'active',
    locationIds: ['loc-1', 'loc-2'],
    customFields: { 'cf-1': 'CC-1110' },
  }),
  dept({
    id: 'DEP-0004',
    companyId: 'co-aurora-retail',
    name: 'Payroll & Benefits',
    acronym: 'PAY',
    description: 'Payroll processing, statutory compliance and benefits.',
    parentId: 'DEP-0002',
    headId: 'emp-04',
    status: 'active',
    locationIds: ['loc-1'],
    customFields: { 'cf-1': 'CC-1120' },
  }),
  dept({
    id: 'DEP-0005',
    companyId: 'co-aurora-retail',
    name: 'Finance',
    acronym: 'FIN',
    description: 'Financial planning, controllership and treasury.',
    parentId: 'DEP-0001',
    headId: 'emp-05',
    status: 'active',
    locationIds: ['loc-1'],
    customFields: { 'cf-1': 'CC-1200', 'cf-3': 'Core' },
  }),
  dept({
    id: 'DEP-0006',
    companyId: 'co-aurora-retail',
    name: 'Accounts Payable',
    acronym: 'AP',
    description: 'Vendor invoicing and payment runs.',
    parentId: 'DEP-0005',
    headId: 'emp-06',
    status: 'active',
    locationIds: ['loc-1'],
  }),
  dept({
    id: 'DEP-0007',
    companyId: 'co-aurora-retail',
    name: 'Technology',
    acronym: 'TECH',
    description: 'Product engineering, platforms and internal IT.',
    parentId: 'DEP-0001',
    headId: 'emp-07',
    status: 'active',
    locationIds: ['loc-2'],
    workAreaIds: ['wa-3'],
    customFields: { 'cf-1': 'CC-1300', 'cf-3': 'Core' },
  }),
  dept({
    id: 'DEP-0008',
    companyId: 'co-aurora-retail',
    name: 'Engineering',
    acronym: 'ENG',
    description: 'Application development squads.',
    parentId: 'DEP-0007',
    headId: 'emp-08',
    status: 'active',
    locationIds: ['loc-2'],
    workAreaIds: ['wa-3'],
  }),
  dept({
    id: 'DEP-0009',
    companyId: 'co-aurora-retail',
    name: 'Platform Engineering',
    acronym: 'PLAT',
    description: 'Infrastructure, SRE and developer tooling (level-4 nesting).',
    parentId: 'DEP-0008',
    headId: 'emp-09',
    status: 'active',
    locationIds: ['loc-2'],
    shiftIds: ['sh-1', 'sh-3'],
    defaultShiftId: 'sh-1',
  }),
  dept({
    id: 'DEP-0010',
    companyId: 'co-aurora-retail',
    name: 'IT Support',
    acronym: 'ITS',
    description: 'Helpdesk and device management for all offices.',
    parentId: 'DEP-0007',
    headId: 'emp-11',
    status: 'active',
    locationIds: ['loc-1', 'loc-2'],
    shiftIds: ['sh-1', 'sh-2'],
    defaultShiftId: 'sh-1',
  }),
  dept({
    id: 'DEP-0011',
    companyId: 'co-aurora-retail',
    name: 'Operations',
    acronym: 'OPS',
    description: 'Supply chain and distribution operations.',
    parentId: 'DEP-0001',
    headId: 'emp-12',
    status: 'active',
    locationIds: ['loc-3'],
    workAreaIds: ['wa-4'],
    shiftIds: ['sh-1', 'sh-2', 'sh-3'],
    defaultShiftId: 'sh-2',
  }),
  dept({
    id: 'DEP-0012',
    companyId: 'co-aurora-retail',
    name: 'Warehouse',
    acronym: 'WH',
    description: 'Chennai distribution centre floor teams.',
    parentId: 'DEP-0011',
    headId: 'emp-12',
    status: 'active',
    locationIds: ['loc-3'],
    workAreaIds: ['wa-4', 'wa-5'],
    shiftIds: ['sh-2', 'sh-3'],
    defaultShiftId: 'sh-2',
    rosterVisibleTo: ALL_ADMIN_ROLES,
  }),
  dept({
    id: 'DEP-0013',
    companyId: 'co-aurora-retail',
    name: 'Retail Stores',
    acronym: 'RET',
    description: 'Front-of-house store staff across the region.',
    parentId: null,
    headId: null,
    status: 'active',
    locationIds: ['loc-4'],
    shiftIds: ['sh-4'],
    defaultShiftId: 'sh-4',
  }),
  dept({
    id: 'DEP-0014',
    companyId: 'co-aurora-retail',
    name: 'Facilities',
    acronym: 'FAC',
    description: 'Dormant — buildings upkeep merged into Operations in 2025.',
    parentId: 'DEP-0001',
    headId: null,
    status: 'inactive',
    locationIds: ['loc-1'],
  }),

  // --- Aurora Logistics (same group — visible to group oversight) ---
  dept({
    id: 'DEP-0101',
    companyId: 'co-aurora-logistics',
    name: 'Line Haul Operations',
    acronym: 'LHO',
    description: 'Inter-city trucking operations.',
    parentId: null,
    headId: null,
    status: 'active',
    locationIds: ['loc-3'],
  }),
  dept({
    id: 'DEP-0102',
    companyId: 'co-aurora-logistics',
    name: 'Fleet Maintenance',
    acronym: 'FLT',
    description: 'Vehicle servicing and compliance.',
    parentId: 'DEP-0101',
    headId: null,
    status: 'active',
    locationIds: ['loc-3'],
  }),
  dept({
    id: 'DEP-0103',
    companyId: 'co-aurora-logistics',
    name: 'People Operations',
    acronym: 'POPS',
    description: 'HR function for logistics staff.',
    parentId: null,
    headId: null,
    status: 'active',
    locationIds: ['loc-3'],
  }),

  // --- Borealis Foods (different group — portfolio oversight only) ---
  dept({
    id: 'DEP-0201',
    companyId: 'co-borealis-foods',
    name: 'Production',
    acronym: 'PRD',
    description: 'Food manufacturing lines.',
    parentId: null,
    headId: null,
    status: 'active',
    locationIds: [],
  }),
  dept({
    id: 'DEP-0202',
    companyId: 'co-borealis-foods',
    name: 'Quality Assurance',
    acronym: 'QA',
    description: 'FSSAI compliance and lab testing.',
    parentId: 'DEP-0201',
    headId: null,
    status: 'active',
    locationIds: [],
  }),
  dept({
    id: 'DEP-0203',
    companyId: 'co-borealis-foods',
    name: 'Sales & Distribution',
    acronym: 'SND',
    description: 'B2B and modern-trade sales.',
    parentId: null,
    headId: null,
    status: 'active',
    locationIds: [],
  }),
]
