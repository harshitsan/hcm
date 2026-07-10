/**
 * Tasks / Notifications / Messages — shared org reference data.
 *
 * Self-contained location → department → position cascade plus a small
 * employee directory used by the manual-task and message assignment forms
 * (Kensium "General Features": Task Assigned by Me, Messages). The signed-in
 * persona is fixed for the POC.
 */

/** Fixed reference "today" for the POC. */
export const TODAY = '2026-07-09'

/** Signed-in persona used across Tasks / Notifications / Messages. */
export const CURRENT_USER = 'Dana Whitfield'
export const CURRENT_USER_MANAGER = 'Rachel Kim'

export const LOCATIONS = ['Hyderabad', 'Austin', 'London'] as const
export type LocationId = (typeof LOCATIONS)[number]

/** Location → departments (Department Master scoped by Location Master). */
export const DEPARTMENTS_BY_LOCATION: Record<LocationId, string[]> = {
  Hyderabad: ['Engineering', 'Human Resources'],
  Austin: ['Sales', 'Support'],
  London: ['Finance', 'Engineering'],
}

/** Department → positions (Position Master). */
export const POSITIONS_BY_DEPARTMENT: Record<string, string[]> = {
  Engineering: ['Software Engineer', 'QA Analyst', 'Engineering Manager'],
  'Human Resources': ['HR Executive', 'HR Manager'],
  Sales: ['Account Executive', 'Sales Manager'],
  Support: ['Support Specialist', 'Support Lead'],
  Finance: ['Accountant', 'Finance Manager'],
}

export interface OrgEmployee {
  id: string
  name: string
  location: LocationId
  department: string
  position: string
  reportingManager: string
}

export const EMPLOYEES: OrgEmployee[] = [
  { id: 'emp-01', name: 'Priya Nair', location: 'Hyderabad', department: 'Engineering', position: 'Software Engineer', reportingManager: 'Dana Whitfield' },
  { id: 'emp-02', name: 'Theo Brooks', location: 'Hyderabad', department: 'Engineering', position: 'QA Analyst', reportingManager: 'Dana Whitfield' },
  { id: 'emp-03', name: 'Liam Patel', location: 'Hyderabad', department: 'Human Resources', position: 'HR Executive', reportingManager: 'Dana Whitfield' },
  { id: 'emp-04', name: 'Marcus Lane', location: 'Austin', department: 'Sales', position: 'Account Executive', reportingManager: 'Dana Whitfield' },
  { id: 'emp-05', name: 'Elena Petrova', location: 'Austin', department: 'Sales', position: 'Sales Manager', reportingManager: 'Rachel Kim' },
  { id: 'emp-06', name: 'Sofia Reyes', location: 'Austin', department: 'Support', position: 'Support Specialist', reportingManager: 'Marcus Lane' },
  { id: 'emp-07', name: 'Amara Okafor', location: 'London', department: 'Engineering', position: 'Software Engineer', reportingManager: 'Rachel Kim' },
  { id: 'emp-08', name: 'Yuki Tanaka', location: 'London', department: 'Finance', position: 'Accountant', reportingManager: 'Rachel Kim' },
  { id: 'emp-09', name: 'Rachel Kim', location: 'London', department: 'Finance', position: 'Finance Manager', reportingManager: '—' },
  { id: 'emp-10', name: 'Dana Whitfield', location: 'Hyderabad', department: 'Engineering', position: 'Engineering Manager', reportingManager: 'Rachel Kim' },
]

/**
 * Assignee context shown while assigning a task (PDF pointers 14–16):
 * leave details and out-time-off requests that fall in the task window.
 * Pending tasks come from the live task store.
 */
export const LEAVE_DETAILS_BY_EMPLOYEE: Record<string, string[]> = {
  'Priya Nair': ['Casual leave · 14–16 Jul 2026 · Approved'],
  'Theo Brooks': ['Sick leave · 10 Jul 2026 · Pending approval'],
  'Liam Patel': [],
  'Marcus Lane': ['Earned leave · 21–25 Jul 2026 · Pending approval'],
  'Elena Petrova': [],
  'Sofia Reyes': [],
  'Amara Okafor': ['Casual leave · 13 Jul 2026 · Approved'],
  'Yuki Tanaka': [],
  'Rachel Kim': [],
  'Dana Whitfield': [],
}

export const OUT_TIME_OFF_BY_EMPLOYEE: Record<string, string[]> = {
  'Priya Nair': ['Out time off · 11 Jul 2026, 2:00–4:00 PM (client visit) · Pending'],
  'Theo Brooks': [],
  'Liam Patel': ['Out time off · 10 Jul 2026, 9:00–11:00 AM (campus drive) · Approved'],
  'Marcus Lane': [],
  'Elena Petrova': ['Out time off · 15 Jul 2026, 3:00–5:00 PM (partner meeting) · Approved'],
  'Sofia Reyes': [],
  'Amara Okafor': [],
  'Yuki Tanaka': [],
  'Rachel Kim': [],
  'Dana Whitfield': [],
}

/** Direct reports of the signed-in persona (reporting-manager views). */
export const MY_DIRECT_REPORTS = EMPLOYEES.filter(
  (e) => e.reportingManager === CURRENT_USER
).map((e) => e.name)
