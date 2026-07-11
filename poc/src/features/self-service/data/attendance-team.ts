/**
 * Manager side of Attendance Tracking (More → Attendance Tracking → Team
 * Functions): mass approval of team attendance requests, OT/WFH/comp-off
 * review and pending attendance change requests.
 */
import type { TeamDepartment, EmployeeState } from './travel-team'
import type { AttendanceRequestKind } from './attendance'

export const TEAM_ATTENDANCE_STATUSES = [
  'Pending approval',
  'Approved',
  'Rejected',
] as const
export type TeamAttendanceStatus = (typeof TEAM_ATTENDANCE_STATUSES)[number]

/** Team attendance request awaiting manager action (mass-approval grid). */
export interface TeamAttendanceRequest {
  id: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  kind: AttendanceRequestKind
  fromDateTime: string
  toDateTime: string
  reason: string
  days: number
  hours: number
  raisedOn: string
  status: TeamAttendanceStatus
}

export const seedTeamAttendanceRequests: TeamAttendanceRequest[] = [
  { id: 'tar-01', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', kind: 'Overtime', fromDateTime: '2026-07-08T18:30', toDateTime: '2026-07-08T22:00', reason: 'Release-night deployment support', days: 0, hours: 3.5, raisedOn: '2026-07-09', status: 'Pending approval' },
  { id: 'tar-02', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', kind: 'Work From Home', fromDateTime: '2026-07-13T09:30', toDateTime: '2026-07-15T18:30', reason: 'Client calls from home during apartment repairs', days: 3, hours: 27, raisedOn: '2026-07-10', status: 'Pending approval' },
  { id: 'tar-03', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', kind: 'Comp Off', fromDateTime: '2026-07-05T09:30', toDateTime: '2026-07-05T18:30', reason: 'Worked on DC cut-over Sunday (5 July)', days: 1, hours: 9, raisedOn: '2026-07-06', status: 'Pending approval' },
  { id: 'tar-04', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', kind: 'Out Time', fromDateTime: '2026-07-11T14:00', toDateTime: '2026-07-11T17:00', reason: 'Prospect site visit — Whitefield', days: 0, hours: 3, raisedOn: '2026-07-10', status: 'Pending approval' },
  { id: 'tar-05', employee: 'Arjun Patel', department: 'Engineering', employeeState: 'Active', kind: 'Overtime', fromDateTime: '2026-06-30T18:30', toDateTime: '2026-06-30T21:30', reason: 'Quarter-end data reconciliation', days: 0, hours: 3, raisedOn: '2026-07-01', status: 'Pending approval' },
  { id: 'tar-06', employee: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', kind: 'Work From Home', fromDateTime: '2026-06-24T09:30', toDateTime: '2026-06-24T18:30', reason: 'Audit documentation from home', days: 1, hours: 9, raisedOn: '2026-06-23', status: 'Approved' },
  { id: 'tar-07', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', kind: 'Comp Off', fromDateTime: '2026-06-14T09:30', toDateTime: '2026-06-14T18:30', reason: 'Hotfix on second Saturday', days: 1, hours: 9, raisedOn: '2026-06-15', status: 'Rejected' },
]

export const CHANGE_REQUEST_STATUSES = [
  'Pending approval',
  'Approved',
  'Rejected',
] as const
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number]

/** Attendance-record correction raised by an employee, pending with manager. */
export interface AttendanceChangeRequest {
  id: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  date: string
  field: 'In time' | 'Out time' | 'Day status'
  currentValue: string
  requestedValue: string
  reason: string
  raisedOn: string
  status: ChangeRequestStatus
}

export const seedAttendanceChangeRequests: AttendanceChangeRequest[] = [
  { id: 'acr-01', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', date: '2026-07-07', field: 'Out time', currentValue: '—', requestedValue: '19:45', reason: 'Badge reader failed at exit; left after client call', raisedOn: '2026-07-08', status: 'Pending approval' },
  { id: 'acr-02', employee: 'Arjun Patel', department: 'Engineering', employeeState: 'Active', date: '2026-07-03', field: 'Day status', currentValue: 'Absent', requestedValue: 'Present (client location)', reason: 'Full day at Northwind office — forgot mobile check-in', raisedOn: '2026-07-06', status: 'Pending approval' },
  { id: 'acr-03', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', date: '2026-06-26', field: 'In time', currentValue: '11:20', requestedValue: '09:15', reason: 'Direct customer visit before reaching office', raisedOn: '2026-06-27', status: 'Approved' },
  { id: 'acr-04', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', date: '2026-06-19', field: 'Day status', currentValue: 'Half day', requestedValue: 'Present', reason: 'Worked from DC after lunch — access logs attached', raisedOn: '2026-06-20', status: 'Rejected' },
]
