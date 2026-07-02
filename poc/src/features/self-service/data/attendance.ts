export const ATTENDANCE_REQUEST_KINDS = [
  'Out Time',
  'Comp Off',
  'Overtime',
  'Work From Home',
] as const
export type AttendanceRequestKind = (typeof ATTENDANCE_REQUEST_KINDS)[number]

export const ATTENDANCE_REQUEST_STATUSES = [
  'Pending approval',
  'Approved',
  'Taken',
  'Rejected',
  'Cancelled',
] as const
export type AttendanceRequestStatus =
  (typeof ATTENDANCE_REQUEST_STATUSES)[number]

/** Out-time / comp-off / overtime / WFH requests (ESS-18..21). */
export interface AttendanceRequest {
  id: string
  kind: AttendanceRequestKind
  fromDateTime: string
  toDateTime: string
  reason: string
  days: number
  hours: number
  status: AttendanceRequestStatus
  raisedOn: string
  /** Comp-off validity per policy (ESS-19). */
  expiresOn: string | null
  /** Pending step surfaced in the task column (ESS-39). */
  task: string | null
}

export const seedAttendanceRequests: AttendanceRequest[] = [
  { id: 'ar-01', kind: 'Out Time', fromDateTime: '2026-06-26T14:00', toDateTime: '2026-06-26T16:30', reason: 'Bank KYC appointment', days: 0, hours: 2.5, status: 'Pending approval', raisedOn: '2026-06-25', expiresOn: null, task: null },
  { id: 'ar-02', kind: 'Out Time', fromDateTime: '2026-06-12T10:00', toDateTime: '2026-06-12T12:00', reason: 'Passport office visit', days: 0, hours: 2, status: 'Taken', raisedOn: '2026-06-10', expiresOn: null, task: null },
  { id: 'ar-03', kind: 'Comp Off', fromDateTime: '2026-06-07T09:30', toDateTime: '2026-06-07T18:30', reason: 'Worked on release weekend (7 June)', days: 1, hours: 9, status: 'Approved', raisedOn: '2026-06-08', expiresOn: '2026-09-07', task: null },
  { id: 'ar-04', kind: 'Comp Off', fromDateTime: '2026-05-01T09:30', toDateTime: '2026-05-01T18:30', reason: 'Production hotfix on May Day holiday', days: 1, hours: 9, status: 'Pending approval', raisedOn: '2026-06-20', expiresOn: '2026-08-01', task: null },
  { id: 'ar-05', kind: 'Overtime', fromDateTime: '2026-06-18T18:30', toDateTime: '2026-06-18T22:00', reason: 'Client UAT support beyond schedule', days: 0, hours: 3.5, status: 'Approved', raisedOn: '2026-06-19', expiresOn: null, task: null },
  { id: 'ar-06', kind: 'Overtime', fromDateTime: '2026-05-29T18:30', toDateTime: '2026-05-29T21:00', reason: 'Data migration cut-over', days: 0, hours: 2.5, status: 'Rejected', raisedOn: '2026-05-30', expiresOn: null, task: null },
  { id: 'ar-07', kind: 'Work From Home', fromDateTime: '2026-07-06T09:30', toDateTime: '2026-07-08T18:30', reason: 'Home internet installation and family commitment', days: 3, hours: 27, status: 'Pending approval', raisedOn: '2026-06-26', expiresOn: null, task: null },
  { id: 'ar-08', kind: 'Work From Home', fromDateTime: '2026-06-02T09:30', toDateTime: '2026-06-03T18:30', reason: 'Monsoon flooding on commute route', days: 2, hours: 18, status: 'Approved', raisedOn: '2026-05-31', expiresOn: null, task: null },
  { id: 'ar-09', kind: 'Out Time', fromDateTime: '2026-05-15T15:00', toDateTime: '2026-05-15T17:00', reason: 'Parent-teacher meeting', days: 0, hours: 2, status: 'Cancelled', raisedOn: '2026-05-13', expiresOn: null, task: null },
  { id: 'ar-10', kind: 'Overtime', fromDateTime: '2026-06-25T18:30', toDateTime: '2026-06-25T20:30', reason: 'Quarter-end billing reconciliation', days: 0, hours: 2, status: 'Pending approval', raisedOn: '2026-06-26', expiresOn: null, task: null },
]

export const SHIFT_STATUSES = [
  'Assigned',
  'Pending approval',
  'Approved',
  'Rejected',
  'Cancelled',
] as const
export type ShiftStatus = (typeof SHIFT_STATUSES)[number]

/** My shift assignments (ESS-22). */
export interface ShiftAssignment {
  id: string
  shiftName: string
  fromDate: string
  endDate: string
  startTime: string
  endTime: string
  assignedBy: string
  assignedDate: string
  status: ShiftStatus
}

export const seedShiftAssignments: ShiftAssignment[] = [
  { id: 'sh-01', shiftName: 'General shift', fromDate: '2026-06-01', endDate: '2026-06-30', startTime: '09:30', endTime: '18:30', assignedBy: 'Vikram Mehta', assignedDate: '2026-05-25', status: 'Approved' },
  { id: 'sh-02', shiftName: 'US overlap shift', fromDate: '2026-07-01', endDate: '2026-07-31', startTime: '13:00', endTime: '22:00', assignedBy: 'Vikram Mehta', assignedDate: '2026-06-24', status: 'Pending approval' },
  { id: 'sh-03', shiftName: 'Release-week early shift', fromDate: '2026-06-08', endDate: '2026-06-12', startTime: '07:30', endTime: '16:30', assignedBy: 'PMO Scheduler', assignedDate: '2026-06-02', status: 'Assigned' },
  { id: 'sh-04', shiftName: 'Weekend on-call', fromDate: '2026-06-20', endDate: '2026-06-21', startTime: '10:00', endTime: '19:00', assignedBy: 'Ops Rota Bot', assignedDate: '2026-06-15', status: 'Cancelled' },
  { id: 'sh-05', shiftName: 'General shift', fromDate: '2026-05-01', endDate: '2026-05-31', startTime: '09:30', endTime: '18:30', assignedBy: 'Vikram Mehta', assignedDate: '2026-04-26', status: 'Approved' },
]

/** Per-day attendance detail with category breakdown (ESS-23). */
export interface AttendanceDay {
  id: string
  date: string
  plannedWork: string
  actualStart: string
  actualEnd: string
  atWork: string
  breaks: number
  breakDuration: string
  effective: string
  officialVisit: string
  clientLocation: string
  personalOff: string
  workFromHome: string
  status: 'Present' | 'WFH' | 'Half day' | 'Absent'
}

export const seedAttendanceDays: AttendanceDay[] = [
  { id: 'ad-01', date: '2026-06-26', plannedWork: '9h 00m', actualStart: '09:24', actualEnd: '18:41', atWork: '9h 17m', breaks: 3, breakDuration: '0h 52m', effective: '8h 25m', officialVisit: '0h 00m', clientLocation: '0h 00m', personalOff: '0h 00m', workFromHome: '0h 00m', status: 'Present' },
  { id: 'ad-02', date: '2026-06-25', plannedWork: '9h 00m', actualStart: '09:31', actualEnd: '20:34', atWork: '11h 03m', breaks: 4, breakDuration: '1h 05m', effective: '9h 58m', officialVisit: '0h 00m', clientLocation: '0h 00m', personalOff: '0h 00m', workFromHome: '0h 00m', status: 'Present' },
  { id: 'ad-03', date: '2026-06-24', plannedWork: '9h 00m', actualStart: '09:05', actualEnd: '18:20', atWork: '9h 15m', breaks: 2, breakDuration: '0h 45m', effective: '8h 30m', officialVisit: '2h 10m', clientLocation: '0h 00m', personalOff: '0h 00m', workFromHome: '0h 00m', status: 'Present' },
  { id: 'ad-04', date: '2026-06-23', plannedWork: '9h 00m', actualStart: '09:40', actualEnd: '18:35', atWork: '8h 55m', breaks: 3, breakDuration: '0h 58m', effective: '7h 57m', officialVisit: '0h 00m', clientLocation: '3h 30m', personalOff: '0h 00m', workFromHome: '0h 00m', status: 'Present' },
  { id: 'ad-05', date: '2026-06-22', plannedWork: '9h 00m', actualStart: '09:28', actualEnd: '14:05', atWork: '4h 37m', breaks: 1, breakDuration: '0h 20m', effective: '4h 17m', officialVisit: '0h 00m', clientLocation: '0h 00m', personalOff: '4h 23m', workFromHome: '0h 00m', status: 'Half day' },
  { id: 'ad-06', date: '2026-06-19', plannedWork: '9h 00m', actualStart: '09:12', actualEnd: '18:30', atWork: '9h 18m', breaks: 3, breakDuration: '0h 49m', effective: '8h 29m', officialVisit: '0h 00m', clientLocation: '0h 00m', personalOff: '0h 00m', workFromHome: '9h 18m', status: 'WFH' },
  { id: 'ad-07', date: '2026-06-18', plannedWork: '9h 00m', actualStart: '09:33', actualEnd: '22:00', atWork: '12h 27m', breaks: 4, breakDuration: '1h 10m', effective: '11h 17m', officialVisit: '0h 00m', clientLocation: '0h 00m', personalOff: '0h 00m', workFromHome: '0h 00m', status: 'Present' },
  { id: 'ad-08', date: '2026-06-17', plannedWork: '9h 00m', actualStart: '—', actualEnd: '—', atWork: '0h 00m', breaks: 0, breakDuration: '0h 00m', effective: '0h 00m', officialVisit: '0h 00m', clientLocation: '0h 00m', personalOff: '0h 00m', workFromHome: '0h 00m', status: 'Absent' },
]
