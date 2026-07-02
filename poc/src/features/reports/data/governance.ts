import { type Role } from '@/context/role-context'
import { type DashboardLayout } from './dashboards'
import { COMPANIES, type Company } from './report-catalog'

/**
 * Company-access scope per canonical role (RPT-12, RPT-17, RPT-18, RPT-20).
 * Stands in for row-level security grants enforced at the data layer.
 */
export const ROLE_COMPANY_ACCESS: Record<Role, Company[]> = {
  'Platform Admin': [...COMPANIES],
  'Portfolio Admin': [
    'Aurora Software',
    'Northwind Retail',
    'Zenith Manufacturing',
  ],
  'Group Company Admin': ['Aurora Software', 'Helios Energy'],
  'Company Admin': ['Aurora Software'],
  'Employee (User)': ['Aurora Software'],
  'Employee (Non-User)': [],
}

/** RLS grant rows shown on the Platform Admin governance surface (RPT-20). */
export interface AccessGrant {
  id: string
  grantee: string
  role: Role
  companies: Company[]
  status: 'active' | 'revoked'
  grantedOn: string
}

export const seedAccessGrants: AccessGrant[] = [
  {
    id: 'gr-01',
    grantee: 'Sunita Patil',
    role: 'Company Admin',
    companies: ['Aurora Software'],
    status: 'active',
    grantedOn: '2025-04-01',
  },
  {
    id: 'gr-02',
    grantee: 'Devika Rao',
    role: 'Portfolio Admin',
    companies: ['Aurora Software', 'Northwind Retail', 'Zenith Manufacturing'],
    status: 'active',
    grantedOn: '2025-04-01',
  },
  {
    id: 'gr-03',
    grantee: 'Arjun Mehta',
    role: 'Group Company Admin',
    companies: ['Aurora Software', 'Helios Energy'],
    status: 'active',
    grantedOn: '2025-06-15',
  },
  {
    id: 'gr-04',
    grantee: 'Ananya Rao',
    role: 'Employee (User)',
    companies: ['Aurora Software'],
    status: 'active',
    grantedOn: '2025-04-01',
  },
  {
    id: 'gr-05',
    grantee: 'Former Admin — R. Bhasin',
    role: 'Company Admin',
    companies: ['Northwind Retail'],
    status: 'revoked',
    grantedOn: '2024-11-02',
  },
]

/** Versioned, effective-dated role → default dashboard mapping (RPT-05, RPT-22). */
export interface RoleDashboardMapping {
  role: Role
  layout: DashboardLayout
  version: number
  effectiveFrom: string
}

export const seedRoleDashboards: RoleDashboardMapping[] = [
  {
    role: 'Platform Admin',
    layout: 'Operations Overview',
    version: 2,
    effectiveFrom: '2026-01-01',
  },
  {
    role: 'Portfolio Admin',
    layout: 'Consolidated Portfolio',
    version: 1,
    effectiveFrom: '2025-04-01',
  },
  {
    role: 'Group Company Admin',
    layout: 'Consolidated Group',
    version: 1,
    effectiveFrom: '2025-04-01',
  },
  {
    role: 'Company Admin',
    layout: 'Workforce Analytics',
    version: 3,
    effectiveFrom: '2026-04-01',
  },
  {
    role: 'Employee (User)',
    layout: 'Self-Service (My Data)',
    version: 1,
    effectiveFrom: '2025-04-01',
  },
  {
    role: 'Employee (Non-User)',
    layout: 'Self-Service (My Data)',
    version: 1,
    effectiveFrom: '2025-04-01',
  },
]
