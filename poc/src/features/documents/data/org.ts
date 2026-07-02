import { type Role } from '@/context/role-context'

/**
 * Org fixture for the Documents module. The POC has no backend, so tenant /
 * group / portfolio scoping is modelled with a small static company tree and
 * a helper that mirrors row-level tenant isolation per role.
 */
export interface Company {
  name: string
  group: string
}

export const COMPANIES: Company[] = [
  { name: 'Meridian Retail', group: 'Meridian Group' },
  { name: 'Meridian Logistics', group: 'Meridian Group' },
  { name: 'Northwind Foods', group: 'Northwind Group' },
  { name: 'Northwind Dairy', group: 'Northwind Group' },
]

/** The tenant the signed-in Company Admin / Employee belongs to. */
export const HOME_COMPANY = 'Meridian Retail'
export const HOME_GROUP = 'Meridian Group'

export const CURRENT_ADMIN = 'Dana Whitfield'

export const CURRENT_EMPLOYEE = {
  name: 'Ravi Menon',
  company: HOME_COMPANY,
  department: 'Finance',
  location: 'Chennai',
  positionLevel: 'L3',
  employeeClass: 'Full-time',
} as const

/**
 * Companies visible to a role — Company Admin sees only their tenant, Group
 * Company Admin their group, Portfolio/Platform Admin the whole portfolio.
 */
export function companiesForRole(role: Role): string[] {
  if (role === 'Platform Admin' || role === 'Portfolio Admin') {
    return COMPANIES.map((c) => c.name)
  }
  if (role === 'Group Company Admin') {
    return COMPANIES.filter((c) => c.group === HOME_GROUP).map((c) => c.name)
  }
  return [HOME_COMPANY]
}

export const LOCATIONS = ['Chennai', 'Bengaluru', 'Mumbai', 'Remote'] as const

export const DEPARTMENTS = [
  'Finance',
  'Human Resources',
  'Engineering',
  'Operations',
  'Sales',
] as const

export const CUSTODIAN_POSITIONS = [
  'HR Manager',
  'Finance Controller',
  'Team Lead',
  'Operations Head',
  'Recruiter',
] as const

export const EMPLOYEE_CLASSES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
] as const

export const POSITION_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const

export const MODULES = [
  'Employee Management',
  'Organization',
  'Talent Acquisition',
  'Payroll',
  'Compliance',
] as const

export type ModuleName = (typeof MODULES)[number]

export const todayIso = () => new Date().toISOString().slice(0, 10)
