/**
 * Shared reference data for the Time & Attendance module.
 * The POC has no backend — a small hand-written roster covers self-service
 * employees, non-user employees (no login) and the "current" employee persona.
 */

export const LOCATIONS = ['Hyderabad', 'Bengaluru', 'Chennai', 'Pune'] as const
export type Location = (typeof LOCATIONS)[number]

export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Operations',
  'Sales',
] as const

export const POSITIONS = [
  'Associate',
  'Senior Associate',
  'Manager',
  'Director',
] as const

export const EMPLOYEE_CLASSES = [
  'Regular',
  'Probationary',
  'Contractor',
  'Executive',
] as const
export type EmployeeClass = (typeof EMPLOYEE_CLASSES)[number]

export const WORKER_CATEGORIES = ['Workman', 'Staff', 'Management'] as const
export type WorkerCategory = (typeof WORKER_CATEGORIES)[number]

export const GROUP_COMPANIES = [
  'Satellite Tech India',
  'Orbital Services',
  'Nimbus Logistics',
] as const

export interface Employee {
  id: string
  code: string
  name: string
  department: (typeof DEPARTMENTS)[number]
  position: (typeof POSITIONS)[number]
  location: Location
  employeeClass: EmployeeClass
  workerCategory: WorkerCategory
  /** False = Employee (Non-User): no self-service login, HR manages records. */
  selfService: boolean
  supervisor: string
}

export const EMPLOYEES: Employee[] = [
  { id: 'emp-01', code: 'ST-1001', name: 'Ananya Sharma', department: 'Engineering', position: 'Senior Associate', location: 'Hyderabad', employeeClass: 'Regular', workerCategory: 'Staff', selfService: true, supervisor: 'Sunita Patil' },
  { id: 'emp-02', code: 'ST-1002', name: 'Rohan Verma', department: 'Engineering', position: 'Associate', location: 'Hyderabad', employeeClass: 'Probationary', workerCategory: 'Staff', selfService: true, supervisor: 'Sunita Patil' },
  { id: 'emp-03', code: 'ST-1003', name: 'Meera Iyer', department: 'Finance', position: 'Manager', location: 'Bengaluru', employeeClass: 'Regular', workerCategory: 'Management', selfService: true, supervisor: 'Arjun Mehta' },
  { id: 'emp-04', code: 'ST-1004', name: 'Kabir Anand', department: 'Operations', position: 'Associate', location: 'Chennai', employeeClass: 'Regular', workerCategory: 'Workman', selfService: true, supervisor: 'Meera Iyer' },
  { id: 'emp-05', code: 'ST-1005', name: 'Divya Pillai', department: 'Sales', position: 'Senior Associate', location: 'Pune', employeeClass: 'Regular', workerCategory: 'Staff', selfService: true, supervisor: 'Arjun Mehta' },
  { id: 'emp-06', code: 'ST-1006', name: 'Farhan Qureshi', department: 'Engineering', position: 'Associate', location: 'Hyderabad', employeeClass: 'Contractor', workerCategory: 'Workman', selfService: true, supervisor: 'Sunita Patil' },
  { id: 'emp-07', code: 'ST-1007', name: 'Lakshmi Menon', department: 'Human Resources', position: 'Manager', location: 'Bengaluru', employeeClass: 'Regular', workerCategory: 'Management', selfService: true, supervisor: 'Arjun Mehta' },
  { id: 'emp-08', code: 'ST-1008', name: 'Vikram Rathore', department: 'Operations', position: 'Director', location: 'Chennai', employeeClass: 'Executive', workerCategory: 'Management', selfService: true, supervisor: 'Arjun Mehta' },
  { id: 'emp-09', code: 'ST-1009', name: 'Ravi Naik', department: 'Operations', position: 'Associate', location: 'Chennai', employeeClass: 'Regular', workerCategory: 'Workman', selfService: false, supervisor: 'Vikram Rathore' },
  { id: 'emp-10', code: 'ST-1010', name: 'Gita Kulkarni', department: 'Operations', position: 'Associate', location: 'Pune', employeeClass: 'Regular', workerCategory: 'Workman', selfService: false, supervisor: 'Vikram Rathore' },
  { id: 'emp-11', code: 'ST-1011', name: 'Sanjay Dutt', department: 'Sales', position: 'Associate', location: 'Pune', employeeClass: 'Probationary', workerCategory: 'Staff', selfService: true, supervisor: 'Divya Pillai' },
  { id: 'emp-12', code: 'ST-1012', name: 'Neha Bhatt', department: 'Finance', position: 'Associate', location: 'Bengaluru', employeeClass: 'Regular', workerCategory: 'Staff', selfService: true, supervisor: 'Meera Iyer' },
]

/** Persona used when the role switcher is on Employee (User). */
export const CURRENT_EMPLOYEE_ID = 'emp-01'

export function employeeName(id: string | null) {
  if (!id) return 'Unmatched'
  return EMPLOYEES.find((e) => e.id === id)?.name ?? id
}

export function employeeById(id: string | null) {
  return EMPLOYEES.find((e) => e.id === id) ?? null
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return dateFmt.format(new Date(`${iso}T00:00:00`))
}

/** "09:15" + "18:40" → decimal hours worked (handles overnight spans). */
export function hoursBetween(punchIn: string, punchOut: string) {
  const [ih, im] = punchIn.split(':').map(Number)
  const [oh, om] = punchOut.split(':').map(Number)
  let mins = oh * 60 + om - (ih * 60 + im)
  if (mins < 0) mins += 24 * 60
  return Math.round((mins / 60) * 100) / 100
}

export function fmtHours(hours: number) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
