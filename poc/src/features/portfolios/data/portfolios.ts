import { type Role } from '@/context/role-context'

/**
 * SatelliteHR POC — Portfolio Management (PORT-FR-001…010, PORT-01…PORT-27).
 * Portfolios group companies for shared-services administration. All data is
 * in-memory seed data; hooks mutate copies of these arrays.
 */

export const PORTFOLIO_STATUSES = ['Active', 'Inactive'] as const
export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number]

export interface Company {
  id: string
  name: string
  status: 'active' | 'inactive'
  currency: string
  timeZone: string
  dateFormat: string
  /** Brand colour used by the context indicator (PORT-18). */
  color: string
  /** Reporting metrics used by consolidated portfolio reports (PORT-19). */
  headcount: number
  monthlyPayrollUsd: number
  attritionPct: number
  openPositions: number
}

export const COMPANIES: Company[] = [
  {
    id: 'co-01',
    name: 'Meridian Technologies',
    status: 'active',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    color: '#2563eb',
    headcount: 842,
    monthlyPayrollUsd: 1230000,
    attritionPct: 8.4,
    openPositions: 37,
  },
  {
    id: 'co-02',
    name: 'Northline Logistics',
    status: 'active',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    color: '#0891b2',
    headcount: 415,
    monthlyPayrollUsd: 486000,
    attritionPct: 12.1,
    openPositions: 22,
  },
  {
    id: 'co-03',
    name: 'Cascade Analytics',
    status: 'active',
    currency: 'USD',
    timeZone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    color: '#7c3aed',
    headcount: 190,
    monthlyPayrollUsd: 2140000,
    attritionPct: 6.2,
    openPositions: 14,
  },
  {
    id: 'co-04',
    name: 'BlueGrain Foods',
    status: 'active',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    color: '#16a34a',
    headcount: 620,
    monthlyPayrollUsd: 512000,
    attritionPct: 14.8,
    openPositions: 41,
  },
  {
    id: 'co-05',
    name: 'Helix BioWorks',
    status: 'active',
    currency: 'EUR',
    timeZone: 'Europe/Berlin',
    dateFormat: 'DD.MM.YYYY',
    color: '#db2777',
    headcount: 138,
    monthlyPayrollUsd: 1490000,
    attritionPct: 4.9,
    openPositions: 9,
  },
  {
    id: 'co-06',
    name: 'Zephyr Retail',
    status: 'active',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    color: '#ea580c',
    headcount: 1105,
    monthlyPayrollUsd: 743000,
    attritionPct: 19.3,
    openPositions: 68,
  },
  {
    id: 'co-07',
    name: 'Quanta Finance',
    status: 'active',
    currency: 'SGD',
    timeZone: 'Asia/Singapore',
    dateFormat: 'DD/MM/YYYY',
    color: '#4f46e5',
    headcount: 264,
    monthlyPayrollUsd: 1820000,
    attritionPct: 7.5,
    openPositions: 12,
  },
  {
    id: 'co-08',
    name: 'Sundale Hospitality',
    status: 'active',
    currency: 'AED',
    timeZone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    color: '#ca8a04',
    headcount: 733,
    monthlyPayrollUsd: 654000,
    attritionPct: 16.7,
    openPositions: 55,
  },
  {
    id: 'co-09',
    name: 'IronPeak Manufacturing',
    status: 'inactive',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    color: '#525252',
    headcount: 0,
    monthlyPayrollUsd: 0,
    attritionPct: 0,
    openPositions: 0,
  },
  {
    id: 'co-10',
    name: 'Verdant Energy',
    status: 'active',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    color: '#059669',
    headcount: 342,
    monthlyPayrollUsd: 398000,
    attritionPct: 9.9,
    openPositions: 18,
  },
  {
    id: 'co-11',
    name: 'Atlas Freight',
    status: 'active',
    currency: 'USD',
    timeZone: 'America/Chicago',
    dateFormat: 'MM/DD/YYYY',
    color: '#b91c1c',
    headcount: 508,
    monthlyPayrollUsd: 934000,
    attritionPct: 11.4,
    openPositions: 26,
  },
  {
    id: 'co-12',
    name: 'Corepath Health',
    status: 'active',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    color: '#0d9488',
    headcount: 289,
    monthlyPayrollUsd: 356000,
    attritionPct: 10.2,
    openPositions: 15,
  },
]

export const COMPANY_BY_ID: Record<string, Company> = Object.fromEntries(
  COMPANIES.map((c) => [c.id, c])
)

export function companyName(id: string): string {
  return COMPANY_BY_ID[id]?.name ?? id
}

/** Users assignable as portfolio managers. Only those holding the Portfolio
 * Manager role may be saved as PortfolioManagerId (PORT-04). */
export interface ManagerUser {
  id: string
  name: string
  email: string
  role: string
  isPortfolioManager: boolean
}

export const MANAGER_USERS: ManagerUser[] = [
  {
    id: 'mgr-01',
    name: 'Omar Haddad',
    email: 'omar.haddad@satellitehr.com',
    role: 'Portfolio Manager',
    isPortfolioManager: true,
  },
  {
    id: 'mgr-02',
    name: 'Leena Pillai',
    email: 'leena.pillai@satellitehr.com',
    role: 'Portfolio Manager',
    isPortfolioManager: true,
  },
  {
    id: 'mgr-03',
    name: 'Daniel Osei',
    email: 'daniel.osei@satellitehr.com',
    role: 'Portfolio Manager',
    isPortfolioManager: true,
  },
  {
    id: 'mgr-04',
    name: 'Sofia Mendes',
    email: 'sofia.mendes@satellitehr.com',
    role: 'Portfolio Manager',
    isPortfolioManager: true,
  },
  {
    id: 'mgr-05',
    name: 'Grace Kim',
    email: 'grace.kim@meridiantech.in',
    role: 'Group Company Admin',
    isPortfolioManager: false,
  },
  {
    id: 'mgr-06',
    name: 'Ravi Batra',
    email: 'ravi.batra@bluegrainfoods.in',
    role: 'Company Admin',
    isPortfolioManager: false,
  },
]

export const MANAGER_BY_ID: Record<string, ManagerUser> = Object.fromEntries(
  MANAGER_USERS.map((m) => [m.id, m])
)

/** PortfolioCompany junction record (§4.2.3). */
export interface PortfolioCompanyLink {
  companyId: string
  addedDate: string
  addedBy: string
}

export interface Portfolio {
  id: string
  /** Auto-generated PORT-YYYY-NNN (PORT-01). */
  code: string
  name: string
  description: string
  managerId: string
  status: PortfolioStatus
  createdDate: string
  createdBy: string
  modifiedDate: string | null
  modifiedBy: string | null
  companies: PortfolioCompanyLink[]
}

export const seedPortfolios: Portfolio[] = [
  {
    id: 'pf-01',
    code: 'PORT-2025-001',
    name: 'Shared Services North',
    description:
      'Shared HR services team administering the northern operating companies — payroll, onboarding and compliance run centrally.',
    managerId: 'mgr-01',
    status: 'Active',
    createdDate: '2025-03-14',
    createdBy: 'priya.platform@satellitehr.com',
    modifiedDate: '2026-05-20',
    modifiedBy: 'priya.platform@satellitehr.com',
    companies: [
      {
        companyId: 'co-01',
        addedDate: '2025-03-14',
        addedBy: 'priya.platform@satellitehr.com',
      },
      {
        companyId: 'co-02',
        addedDate: '2025-03-14',
        addedBy: 'priya.platform@satellitehr.com',
      },
      {
        companyId: 'co-06',
        addedDate: '2025-09-02',
        addedBy: 'priya.platform@satellitehr.com',
      },
    ],
  },
  {
    id: 'pf-02',
    code: 'PORT-2025-002',
    name: 'Global Tech Cluster',
    description:
      'US and EU technology subsidiaries sharing recruitment and equity administration.',
    managerId: 'mgr-02',
    status: 'Active',
    createdDate: '2025-06-30',
    createdBy: 'priya.platform@satellitehr.com',
    modifiedDate: null,
    modifiedBy: null,
    companies: [
      {
        companyId: 'co-03',
        addedDate: '2025-06-30',
        addedBy: 'priya.platform@satellitehr.com',
      },
      {
        companyId: 'co-05',
        addedDate: '2025-06-30',
        addedBy: 'priya.platform@satellitehr.com',
      },
    ],
  },
  {
    id: 'pf-03',
    code: 'PORT-2026-001',
    name: 'Finance & Hospitality',
    description:
      'Middle-East and Singapore entities under one shared-services administration.',
    managerId: 'mgr-03',
    status: 'Active',
    createdDate: '2026-01-12',
    createdBy: 'priya.platform@satellitehr.com',
    modifiedDate: '2026-04-03',
    modifiedBy: 'priya.platform@satellitehr.com',
    companies: [
      {
        companyId: 'co-07',
        addedDate: '2026-01-12',
        addedBy: 'priya.platform@satellitehr.com',
      },
      {
        companyId: 'co-08',
        addedDate: '2026-01-12',
        addedBy: 'priya.platform@satellitehr.com',
      },
    ],
  },
  {
    id: 'pf-04',
    code: 'PORT-2026-002',
    name: 'Industrial Holdings',
    description: 'Freight and heavy-industry entities pending consolidation.',
    managerId: 'mgr-04',
    status: 'Inactive',
    createdDate: '2026-02-25',
    createdBy: 'priya.platform@satellitehr.com',
    modifiedDate: '2026-06-10',
    modifiedBy: 'priya.platform@satellitehr.com',
    companies: [
      {
        companyId: 'co-11',
        addedDate: '2026-02-25',
        addedBy: 'priya.platform@satellitehr.com',
      },
    ],
  },
]

/** Persona behind each mock role — used for CreatedBy/ModifiedBy + audit actor. */
export interface Persona {
  name: string
  email: string
  /** Portfolio this persona administers (Portfolio Admin only). */
  managedPortfolioId: string | null
  /** Companies this persona may switch context into (PORT-12/13). */
  authorizedCompanyIds: string[]
}

const ALL_ACTIVE_COMPANY_IDS = COMPANIES.filter(
  (c) => c.status === 'active'
).map((c) => c.id)

export const PERSONAS: Record<Role, Persona> = {
  'Platform Admin': {
    name: 'Priya Sharma',
    email: 'priya.platform@satellitehr.com',
    managedPortfolioId: null,
    // Switch to Any Company is limited to Platform Admin (PORT-13).
    authorizedCompanyIds: ALL_ACTIVE_COMPANY_IDS,
  },
  'Portfolio Admin': {
    name: 'Omar Haddad',
    email: 'omar.haddad@satellitehr.com',
    managedPortfolioId: 'pf-01',
    authorizedCompanyIds: ['co-01', 'co-02', 'co-06'],
  },
  'Group Company Admin': {
    name: 'Grace Kim',
    email: 'grace.kim@meridiantech.in',
    managedPortfolioId: null,
    authorizedCompanyIds: ['co-01', 'co-04', 'co-10'],
  },
  'Company Admin': {
    name: 'Ravi Batra',
    email: 'ravi.batra@bluegrainfoods.in',
    managedPortfolioId: null,
    authorizedCompanyIds: ['co-04'],
  },
  'Employee (User)': {
    name: 'Asha Rao',
    email: 'asha.rao@meridiantech.in',
    managedPortfolioId: null,
    authorizedCompanyIds: ['co-01'],
  },
  'Employee (Non-User)': {
    name: 'Kiran Joshi',
    email: 'kiran.joshi@meridiantech.in',
    managedPortfolioId: null,
    authorizedCompanyIds: ['co-01'],
  },
}

/** Navigation permissions loaded with a company context (PORT-14). */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  'Platform Admin': [
    'portfolios.manage',
    'companies.manage',
    'employees.read',
    'reports.run',
    'audit.read',
  ],
  'Portfolio Admin': [
    'portfolio.companies.manage',
    'employees.read',
    'employees.import',
    'policies.deploy',
    'reports.run',
  ],
  'Group Company Admin': ['employees.read', 'employees.write', 'reports.run'],
  'Company Admin': ['employees.read', 'employees.write', 'leave.approve'],
  'Employee (User)': ['self.profile.read', 'self.leave.request'],
  'Employee (Non-User)': ['self.profile.read'],
}

export const STANDARD_POLICIES = [
  'Leave & Holiday Policy v3.2',
  'Remote Work Policy v2.0',
  'Expense Reimbursement Policy v4.1',
  'Code of Conduct 2026',
  'Data Privacy & Security Policy v1.8',
] as const
