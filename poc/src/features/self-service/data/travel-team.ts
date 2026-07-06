/**
 * Manager / Travel Coordinator side of Travel Management:
 * employee travel requests, actual expenses, advance expenses and trip
 * details across the team (EAE-01..06, EE-01..07, ETR-01..07, TD-01..07).
 */

export const TEAM_DEPARTMENTS = [
  'Engineering',
  'Delivery',
  'Sales',
  'Finance',
  'Human Resources',
] as const
export type TeamDepartment = (typeof TEAM_DEPARTMENTS)[number]

export const EMPLOYEE_STATES = ['Active', 'Inactive'] as const
export type EmployeeState = (typeof EMPLOYEE_STATES)[number]

export const TRAVEL_HANDLERS = [
  'Anita Rao (Travel Coordinator)',
  'Vikram Shetty (Travel Coordinator)',
  'Global Travel Desk',
] as const

export const TEAM_TRAVEL_STATUSES = [
  'Pending Approval',
  'Approved',
  'Initiated',
  'Travel Coordinator Confirmed',
  'Completed',
  'Settlement Pending',
  'Settled and Closed',
  'Rejected',
  'Cancelled',
] as const
export type TeamTravelStatus = (typeof TEAM_TRAVEL_STATUSES)[number]

/** Employee travel request as reviewed by a manager (ETR-01). */
export interface TeamTravelRequest {
  id: string
  title: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  /** Trip details: destination + travel window summary. */
  tripDetails: string
  fromDate: string
  requestedAdvance: number
  status: TeamTravelStatus
  /** Handler the request is routed to (ETR-06). */
  assignedTo: string | null
}

export const seedTeamTravelRequests: TeamTravelRequest[] = [
  { id: 'ttr-01', title: 'Acme retail — go-live support', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', tripDetails: 'Mumbai · 14–18 Jul 2026', fromDate: '2026-07-14', requestedAdvance: 28000, status: 'Pending Approval', assignedTo: null },
  { id: 'ttr-02', title: 'Northwind quarterly review', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', tripDetails: 'Singapore · 27–30 Jul 2026', fromDate: '2026-07-27', requestedAdvance: 85000, status: 'Approved', assignedTo: 'Anita Rao (Travel Coordinator)' },
  { id: 'ttr-03', title: 'Hyderabad DC migration', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', tripDetails: 'Hyderabad · 9–11 Jun 2026', fromDate: '2026-06-09', requestedAdvance: 15000, status: 'Settlement Pending', assignedTo: 'Vikram Shetty (Travel Coordinator)' },
  { id: 'ttr-04', title: 'BFSI prospect demo', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', tripDetails: 'Pune · 19–20 May 2026', fromDate: '2026-05-19', requestedAdvance: 9000, status: 'Settled and Closed', assignedTo: 'Global Travel Desk' },
  { id: 'ttr-05', title: 'Kensium tech summit', employee: 'Arjun Patel', department: 'Engineering', employeeState: 'Active', tripDetails: 'Chennai · 5–7 Aug 2026', fromDate: '2026-08-05', requestedAdvance: 12000, status: 'Travel Coordinator Confirmed', assignedTo: 'Anita Rao (Travel Coordinator)' },
  { id: 'ttr-06', title: 'Vendor audit — logistics', employee: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', tripDetails: 'Bengaluru · 2–3 Apr 2026', fromDate: '2026-04-02', requestedAdvance: 6000, status: 'Completed', assignedTo: 'Global Travel Desk' },
]

export const TEAM_EXPENSE_STATUSES = [
  'Pending Acknowledgement',
  'Settlement Pending',
  'Approved',
  'Settled and Closed',
] as const
export type TeamExpenseStatus = (typeof TEAM_EXPENSE_STATUSES)[number]

/** Actual employee expense as reviewed by a manager (EE-01). */
export interface TeamExpense {
  id: string
  addedOn: string
  title: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  /** Expense line summary. */
  expenses: string
  amount: number
  status: TeamExpenseStatus
}

export const seedTeamExpenses: TeamExpense[] = [
  { id: 'tex-01', addedOn: '2026-06-13', title: 'Hyderabad DC migration — hotel & cabs', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', expenses: 'Hotel (3 nights) + airport transfers', amount: 13450, status: 'Pending Acknowledgement' },
  { id: 'tex-02', addedOn: '2026-06-13', title: 'Hyderabad DC migration — meals', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', expenses: 'Per-diem overage with bills', amount: 2680, status: 'Settlement Pending' },
  { id: 'tex-03', addedOn: '2026-05-22', title: 'Client workshop supplies', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', expenses: 'Printing and workshop material', amount: 1890, status: 'Settled and Closed' },
  { id: 'tex-04', addedOn: '2026-05-21', title: 'Pune demo — travel', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', expenses: 'Flight + one hotel night', amount: 7420, status: 'Approved' },
  { id: 'tex-05', addedOn: '2026-04-05', title: 'Vendor audit — local conveyance', employee: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', expenses: 'Cabs across vendor sites', amount: 2140, status: 'Settled and Closed' },
]

export const TEAM_ADVANCE_STATUSES = [
  'Pending with me',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Cancelled',
] as const
export type TeamAdvanceStatus = (typeof TEAM_ADVANCE_STATUSES)[number]

/** Employee advance request as reviewed by a manager (EAE-01). */
export interface TeamAdvance {
  id: string
  addedOn: string
  title: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  /** Additional expenses reconciled against the advance. */
  additionalExpenses: number
  requestedAdvance: number
  status: TeamAdvanceStatus
}

export const seedTeamAdvances: TeamAdvance[] = [
  { id: 'tad-01', addedOn: '2026-06-25', title: 'Advance — Mumbai go-live trip', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', additionalExpenses: 0, requestedAdvance: 28000, status: 'Pending with me' },
  { id: 'tad-02', addedOn: '2026-06-18', title: 'Advance — Singapore QBR', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', additionalExpenses: 0, requestedAdvance: 85000, status: 'Pending Approval' },
  { id: 'tad-03', addedOn: '2026-05-28', title: 'Advance — Hyderabad DC migration', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', additionalExpenses: 1130, requestedAdvance: 15000, status: 'Approved' },
  { id: 'tad-04', addedOn: '2026-05-12', title: 'Advance — Pune demo', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', additionalExpenses: 0, requestedAdvance: 9000, status: 'Rejected' },
  { id: 'tad-05', addedOn: '2026-04-01', title: 'Advance — vendor audit travel', employee: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', additionalExpenses: 0, requestedAdvance: 6000, status: 'Cancelled' },
]

export const TRIP_STATUSES = [
  'Pending for Vendor Confirmation',
  'Travel Coordinator Process Initiated',
  'Confirmed',
  'Completed',
] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export const TRIP_MODES = ['Flight', 'Train', 'Bus', 'Cab'] as const
export type TripMode = (typeof TRIP_MODES)[number]

/** Approved trip managed by the travel coordinator (TD-01). */
export interface TripDetail {
  id: string
  title: string
  /** Travelling employee name. */
  name: string
  department: TeamDepartment
  employeeState: EmployeeState
  departureCity: string
  destinationCity: string
  departureDate: string
  mode: TripMode
  vendor: string
  status: TripStatus
}

export const seedTripDetails: TripDetail[] = [
  { id: 'trip-01', title: 'Northwind quarterly review', name: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', departureCity: 'Chennai', destinationCity: 'Singapore', departureDate: '2026-07-27', mode: 'Flight', vendor: 'Thomas Cook Corporate', status: 'Pending for Vendor Confirmation' },
  { id: 'trip-02', title: 'Kensium tech summit', name: 'Arjun Patel', department: 'Engineering', employeeState: 'Active', departureCity: 'Hyderabad', destinationCity: 'Chennai', departureDate: '2026-08-05', mode: 'Train', vendor: 'IRCTC Corporate Desk', status: 'Travel Coordinator Process Initiated' },
  { id: 'trip-03', title: 'Acme retail — go-live support', name: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', departureCity: 'Chennai', destinationCity: 'Mumbai', departureDate: '2026-07-14', mode: 'Flight', vendor: 'MakeMyTrip Business', status: 'Confirmed' },
  { id: 'trip-04', title: 'Hyderabad DC migration', name: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', departureCity: 'Chennai', destinationCity: 'Hyderabad', departureDate: '2026-06-09', mode: 'Cab', vendor: 'Savaari Rentals', status: 'Completed' },
  { id: 'trip-05', title: 'Vendor audit — logistics', name: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', departureCity: 'Chennai', destinationCity: 'Bengaluru', departureDate: '2026-04-02', mode: 'Bus', vendor: 'RedBus Corporate', status: 'Completed' },
]
