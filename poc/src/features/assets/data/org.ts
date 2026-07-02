import { type Role } from '@/context/role-context'

/**
 * Tenant hierarchy for the Asset Management POC: one portfolio, two group
 * companies, five companies. Row-level tenant isolation (ASM-18) is mocked by
 * scoping every read to the companies visible to the active role.
 */
export const PORTFOLIO_NAME = 'Northwind Portfolio'

export interface Company {
  id: string
  name: string
  group: string
}

export const COMPANIES: Company[] = [
  { id: 'c-01', name: 'Aster Digital', group: 'Aster Group' },
  { id: 'c-02', name: 'Aster Manufacturing', group: 'Aster Group' },
  { id: 'c-03', name: 'Aster Retail', group: 'Aster Group' },
  { id: 'c-04', name: 'Borealis Labs', group: 'Borealis Group' },
  { id: 'c-05', name: 'Cyan Logistics', group: 'Borealis Group' },
]

/** The tenant that operational (Company Admin) personas act within. */
export const HOME_COMPANY = 'Aster Digital'

/**
 * Authorization boundary per role: which companies' assets the caller may
 * read. Operational transactions stay bounded to the home company —
 * oversight roles (Group/Portfolio/Platform) get read-consistent visibility
 * only (ASM-16, ASM-18, ASM-26).
 */
export function visibleCompanies(role: Role): string[] {
  switch (role) {
    case 'Platform Admin':
    case 'Portfolio Admin':
      return COMPANIES.map((c) => c.name)
    case 'Group Company Admin':
      return COMPANIES.filter((c) => c.group === 'Aster Group').map((c) => c.name)
    default:
      return [HOME_COMPANY]
  }
}

export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Sales',
  'Operations',
] as const

export interface Employee {
  id: string
  code: string
  name: string
  department: string
  designation: string
  dateOfJoining: string
  company: string
  /** Employee (Non-User) workforce members cannot log in (ASM-14, ASM-42). */
  hasSystemAccess: boolean
  active: boolean
}

export const EMPLOYEES: Employee[] = [
  { id: 'e-01', code: 'AD-1001', name: 'Anita Rao', department: 'Engineering', designation: 'Senior Engineer', dateOfJoining: '2022-03-14', company: 'Aster Digital', hasSystemAccess: true, active: true },
  { id: 'e-02', code: 'AD-1002', name: 'Ravi Kumar', department: 'Operations', designation: 'Facilities Executive', dateOfJoining: '2021-08-02', company: 'Aster Digital', hasSystemAccess: false, active: true },
  { id: 'e-03', code: 'AD-1003', name: 'Meera Iyer', department: 'Human Resources', designation: 'HR Business Partner', dateOfJoining: '2020-11-23', company: 'Aster Digital', hasSystemAccess: true, active: true },
  { id: 'e-04', code: 'AD-1004', name: 'Josh Patel', department: 'Sales', designation: 'Account Executive', dateOfJoining: '2023-01-09', company: 'Aster Digital', hasSystemAccess: true, active: true },
  { id: 'e-05', code: 'AD-1005', name: 'Arjun Nair', department: 'Engineering', designation: 'Intern', dateOfJoining: '2026-01-05', company: 'Aster Digital', hasSystemAccess: false, active: true },
  { id: 'e-06', code: 'AD-1006', name: 'Nikhil Bose', department: 'Engineering', designation: 'Platform Engineer', dateOfJoining: '2022-09-19', company: 'Aster Digital', hasSystemAccess: true, active: true },
  { id: 'e-07', code: 'AD-1007', name: 'Priya Sharma', department: 'Human Resources', designation: 'HR Operations Lead', dateOfJoining: '2019-06-17', company: 'Aster Digital', hasSystemAccess: true, active: true },
  { id: 'e-08', code: 'AD-1008', name: 'Divya Menon', department: 'Finance', designation: 'Financial Analyst', dateOfJoining: '2023-05-22', company: 'Aster Digital', hasSystemAccess: true, active: true },
  { id: 'e-09', code: 'AD-1009', name: 'Karan Mehta', department: 'Operations', designation: 'Logistics Manager', dateOfJoining: '2021-02-15', company: 'Aster Digital', hasSystemAccess: true, active: false },
  { id: 'e-10', code: 'AD-1010', name: 'Grace Lin', department: 'Engineering', designation: 'Software Engineer', dateOfJoining: '2026-06-22', company: 'Aster Digital', hasSystemAccess: true, active: true },
  { id: 'e-11', code: 'AM-2001', name: 'Lena Fischer', department: 'Operations', designation: 'Plant Supervisor', dateOfJoining: '2020-04-06', company: 'Aster Manufacturing', hasSystemAccess: true, active: true },
  { id: 'e-12', code: 'AR-3001', name: 'Tom Whelan', department: 'Finance', designation: 'Retail Controller', dateOfJoining: '2021-10-11', company: 'Aster Retail', hasSystemAccess: true, active: true },
  { id: 'e-13', code: 'BL-4001', name: 'Sana Sheikh', department: 'Engineering', designation: 'Research Lead', dateOfJoining: '2022-07-04', company: 'Borealis Labs', hasSystemAccess: true, active: true },
  { id: 'e-14', code: 'CL-5001', name: 'Diego Morales', department: 'Operations', designation: 'Fleet Coordinator', dateOfJoining: '2023-03-27', company: 'Cyan Logistics', hasSystemAccess: true, active: true },
]

/** The signed-in admin persona (acting Company Admin at Aster Digital). */
export const CURRENT_ADMIN = 'Priya Sharma'

/** Persona whose holdings drive the Employee (User) self-service surfaces. */
export const SELF_EMPLOYEE_ID = 'e-01'

export function employeeById(id: string | null): Employee | null {
  if (!id) return null
  return EMPLOYEES.find((e) => e.id === id) ?? null
}

export function employeeName(id: string | null): string {
  return employeeById(id)?.name ?? '—'
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatInr(value: number): string {
  return inr.format(value)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nowIso(): string {
  return new Date().toISOString()
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string | null): string {
  return iso ? dateFmt.format(new Date(iso)) : '—'
}
