/**
 * Org reference masters for the Feedback & Grievance module — locations,
 * departments, positions and employees used by the cascading "Applicable
 * location → department → position → employee" pickers (Location Master,
 * Department Master, Position Master prerequisites in the Kensium flow).
 * In-memory for the POC.
 */

export interface OrgEmployee {
  id: string
  name: string
  email: string
  location: string
  department: string
  position: string
  /** Organizational role, used by the Employee-or-Role picker "Roles" cascade. */
  role: string
}

export const ORG_LOCATIONS = [
  'Hyderabad HQ',
  'Chennai Campus',
  'Pune Hub',
] as const

/** Departments populated based on the selected location(s). */
export const ORG_DEPARTMENTS: Record<string, string[]> = {
  'Hyderabad HQ': ['Human Resources', 'Engineering', 'Finance'],
  'Chennai Campus': ['Operations', 'Customer Support'],
  'Pune Hub': ['Engineering', 'Sales', 'Human Resources'],
}

/** Positions populated based on the selected department(s). */
export const ORG_POSITIONS: Record<string, string[]> = {
  'Human Resources': ['HR Manager', 'HR Business Partner', 'HR Executive'],
  Engineering: ['Engineering Manager', 'Senior Engineer', 'QA Lead'],
  Finance: ['Finance Controller', 'Accounts Analyst'],
  Operations: ['Operations Manager', 'Shift Supervisor'],
  'Customer Support': ['Support Lead', 'Support Executive'],
  Sales: ['Sales Manager', 'Account Executive'],
}

export const ORG_EMPLOYEES: OrgEmployee[] = [
  { id: 'emp-01', name: 'Meera Iyer', email: 'meera.iyer@asterretail.example', location: 'Hyderabad HQ', department: 'Human Resources', position: 'HR Manager', role: 'HR Manager' },
  { id: 'emp-02', name: 'Priya Nair', email: 'priya.nair@asterretail.example', location: 'Hyderabad HQ', department: 'Human Resources', position: 'HR Business Partner', role: 'HR Business Partner' },
  { id: 'emp-03', name: 'Leo Grant', email: 'leo.grant@asterretail.example', location: 'Hyderabad HQ', department: 'Human Resources', position: 'HR Executive', role: 'Ethics Officer' },
  { id: 'emp-04', name: 'Devika Rao', email: 'devika.rao@asterretail.example', location: 'Hyderabad HQ', department: 'Human Resources', position: 'HR Executive', role: 'People Ops Lead' },
  { id: 'emp-05', name: 'Riya Sharma', email: 'riya.sharma@asterretail.example', location: 'Hyderabad HQ', department: 'Engineering', position: 'Senior Engineer', role: 'Employee' },
  { id: 'emp-06', name: 'Arjun Mehta', email: 'arjun.mehta@asterretail.example', location: 'Hyderabad HQ', department: 'Engineering', position: 'Engineering Manager', role: 'Department Head' },
  { id: 'emp-07', name: 'Sara Thomas', email: 'sara.thomas@asterretail.example', location: 'Hyderabad HQ', department: 'Finance', position: 'Finance Controller', role: 'Department Head' },
  { id: 'emp-08', name: 'Tomás Rivera', email: 'tomas.rivera@asterlogistics.example', location: 'Chennai Campus', department: 'Operations', position: 'Shift Supervisor', role: 'Employee' },
  { id: 'emp-09', name: 'Harpreet Kaur', email: 'harpreet.kaur@asterlogistics.example', location: 'Chennai Campus', department: 'Operations', position: 'Operations Manager', role: 'Department Head' },
  { id: 'emp-10', name: 'Igor Petrov', email: 'igor.petrov@asterlogistics.example', location: 'Chennai Campus', department: 'Operations', position: 'Shift Supervisor', role: 'Employee' },
  { id: 'emp-11', name: 'Alina Novak', email: 'alina.novak@asterlogistics.example', location: 'Chennai Campus', department: 'Customer Support', position: 'Support Lead', role: 'Employee' },
  { id: 'emp-12', name: 'Ines Duarte', email: 'ines.duarte@asterlogistics.example', location: 'Chennai Campus', department: 'Customer Support', position: 'Support Executive', role: 'Employee' },
  { id: 'emp-13', name: 'Noah Berg', email: 'noah.berg@borealistech.example', location: 'Pune Hub', department: 'Human Resources', position: 'HR Manager', role: 'HR Manager' },
  { id: 'emp-14', name: 'Wei Chen', email: 'wei.chen@borealistech.example', location: 'Pune Hub', department: 'Engineering', position: 'Senior Engineer', role: 'Employee' },
  { id: 'emp-15', name: 'Fatima Al-Amin', email: 'fatima.alamin@borealistech.example', location: 'Pune Hub', department: 'Engineering', position: 'QA Lead', role: 'Employee' },
  { id: 'emp-16', name: 'Marcus Bell', email: 'marcus.bell@borealistech.example', location: 'Pune Hub', department: 'Sales', position: 'Sales Manager', role: 'Department Head' },
]

/** Distinct org roles for the Employee-or-Role picker. */
export const ORG_ROLES: string[] = [
  ...new Set(ORG_EMPLOYEES.map((e) => e.role)),
]

/** Departments available for the selected locations (empty = all). */
export function departmentsForLocations(locations: string[]): string[] {
  const locs = locations.length > 0 ? locations : [...ORG_LOCATIONS]
  return [...new Set(locs.flatMap((l) => ORG_DEPARTMENTS[l] ?? []))]
}

/** Positions available for the selected departments (empty = all). */
export function positionsForDepartments(departments: string[]): string[] {
  const deps =
    departments.length > 0 ? departments : Object.keys(ORG_POSITIONS)
  return [...new Set(deps.flatMap((d) => ORG_POSITIONS[d] ?? []))]
}

/** Employees matching every provided (non-empty) cascade filter. */
export function employeesMatching(filter: {
  locations?: string[]
  departments?: string[]
  positions?: string[]
  roles?: string[]
}): OrgEmployee[] {
  return ORG_EMPLOYEES.filter(
    (e) =>
      (!filter.locations?.length || filter.locations.includes(e.location)) &&
      (!filter.departments?.length ||
        filter.departments.includes(e.department)) &&
      (!filter.positions?.length || filter.positions.includes(e.position)) &&
      (!filter.roles?.length || filter.roles.includes(e.role))
  )
}
