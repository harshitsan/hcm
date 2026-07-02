/**
 * Shared reference data for the Leave Management module.
 * The POC has no backend, so the org structure is a small hand-written
 * roster covering self-service employees, non-user employees, and a team
 * reporting to the "current" employee persona.
 */

export const LOCATIONS = ['Hyderabad', 'Bengaluru', 'Chennai', 'Austin'] as const
export type Location = (typeof LOCATIONS)[number]

export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Operations',
  'Sales',
] as const

export const EMPLOYEE_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
] as const

export const EMPLOYEE_CLASSES = [
  'Regular',
  'Probationary',
  'Contractor',
  'Executive',
] as const

export const POSITION_LEVELS = [
  'L1 - Associate',
  'L2 - Senior',
  'L3 - Manager',
  'L4 - Director',
  'L5 - VP',
] as const

export const JURISDICTIONS = ['India', 'USA'] as const

export const COMPANIES = [
  'Satellite Tech India',
  'Satellite Tech USA',
  'Orbital Services',
] as const

export const GROUP_COMPANIES = ['Satellite Group', 'Orbital Group'] as const

export interface Employee {
  id: string
  code: string
  name: string
  department: string
  location: Location
  employeeType: (typeof EMPLOYEE_TYPES)[number]
  employeeClass: (typeof EMPLOYEE_CLASSES)[number]
  positionLevel: (typeof POSITION_LEVELS)[number]
  company: (typeof COMPANIES)[number]
  /** False for Employee (Non-User) — no portal login; HR records on their behalf. */
  selfService: boolean
  managerId: string | null
  active: boolean
}

/** The signed-in persona used for Employee (User) / manager flows. */
export const CURRENT_EMPLOYEE_ID = 'emp-1001'
/** The persona shown when the role switcher is on Employee (Non-User). */
export const NON_USER_EMPLOYEE_ID = 'emp-1008'

export const EMPLOYEES: Employee[] = [
  {
    id: 'emp-1001',
    code: 'STI-0142',
    name: 'Ananya Sharma',
    department: 'Engineering',
    location: 'Hyderabad',
    employeeType: 'Full-time',
    employeeClass: 'Regular',
    positionLevel: 'L3 - Manager',
    company: 'Satellite Tech India',
    selfService: true,
    managerId: 'emp-1002',
    active: true,
  },
  {
    id: 'emp-1002',
    code: 'STI-0021',
    name: 'Rahul Menon',
    department: 'Engineering',
    location: 'Hyderabad',
    employeeType: 'Full-time',
    employeeClass: 'Executive',
    positionLevel: 'L4 - Director',
    company: 'Satellite Tech India',
    selfService: true,
    managerId: null,
    active: true,
  },
  {
    id: 'emp-1003',
    code: 'STI-0233',
    name: 'Priya Iyer',
    department: 'Engineering',
    location: 'Hyderabad',
    employeeType: 'Full-time',
    employeeClass: 'Regular',
    positionLevel: 'L2 - Senior',
    company: 'Satellite Tech India',
    selfService: true,
    managerId: 'emp-1001',
    active: true,
  },
  {
    id: 'emp-1004',
    code: 'STI-0250',
    name: 'Vikram Rao',
    department: 'Engineering',
    location: 'Bengaluru',
    employeeType: 'Full-time',
    employeeClass: 'Regular',
    positionLevel: 'L1 - Associate',
    company: 'Satellite Tech India',
    selfService: true,
    managerId: 'emp-1001',
    active: true,
  },
  {
    id: 'emp-1005',
    code: 'STI-0261',
    name: 'Meera Krishnan',
    department: 'Engineering',
    location: 'Chennai',
    employeeType: 'Full-time',
    employeeClass: 'Probationary',
    positionLevel: 'L1 - Associate',
    company: 'Satellite Tech India',
    selfService: true,
    managerId: 'emp-1001',
    active: true,
  },
  {
    id: 'emp-1006',
    code: 'STU-0034',
    name: 'Jordan Blake',
    department: 'Sales',
    location: 'Austin',
    employeeType: 'Full-time',
    employeeClass: 'Regular',
    positionLevel: 'L2 - Senior',
    company: 'Satellite Tech USA',
    selfService: true,
    managerId: 'emp-1002',
    active: true,
  },
  {
    id: 'emp-1007',
    code: 'STI-0301',
    name: 'Sunita Patil',
    department: 'Human Resources',
    location: 'Hyderabad',
    employeeType: 'Full-time',
    employeeClass: 'Regular',
    positionLevel: 'L3 - Manager',
    company: 'Satellite Tech India',
    selfService: true,
    managerId: 'emp-1002',
    active: true,
  },
  {
    id: 'emp-1008',
    code: 'OSV-0412',
    name: 'Ravi Naik',
    department: 'Operations',
    location: 'Chennai',
    employeeType: 'Full-time',
    employeeClass: 'Regular',
    positionLevel: 'L1 - Associate',
    company: 'Orbital Services',
    selfService: false,
    managerId: 'emp-1001',
    active: true,
  },
  {
    id: 'emp-1009',
    code: 'OSV-0428',
    name: 'Lakshmi Devi',
    department: 'Operations',
    location: 'Chennai',
    employeeType: 'Contract',
    employeeClass: 'Contractor',
    positionLevel: 'L1 - Associate',
    company: 'Orbital Services',
    selfService: false,
    managerId: 'emp-1001',
    active: true,
  },
  {
    id: 'emp-1010',
    code: 'STI-0097',
    name: 'Arjun Nair',
    department: 'Finance',
    location: 'Bengaluru',
    employeeType: 'Full-time',
    employeeClass: 'Regular',
    positionLevel: 'L2 - Senior',
    company: 'Satellite Tech India',
    selfService: true,
    managerId: 'emp-1002',
    active: false,
  },
]

export function employeeById(id: string): Employee | undefined {
  return EMPLOYEES.find((e) => e.id === id)
}

export function shortId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return dateFmt.format(new Date(iso))
}

/** Inclusive day count between two ISO dates. */
export function daySpan(from: string, to: string) {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

/** True when two inclusive ISO date ranges overlap. */
export function rangesOverlap(
  aFrom: string,
  aTo: string,
  bFrom: string,
  bTo: string
) {
  return aFrom <= bTo && bFrom <= aTo
}
