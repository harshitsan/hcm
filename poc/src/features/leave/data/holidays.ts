/**
 * Holiday calendars per location and year (LVE-40), the employee-facing
 * holiday list with optional-holiday confirmation and swap (LVE-33), and
 * manager review of optional-holiday requests (LVE-46).
 */

export interface Holiday {
  id: string
  name: string
  date: string
  day: string
  kind: 'fixed' | 'optional'
  /** Another optional holiday this one can be exchanged with (LVE-33). */
  swapWith: string | null
}

export interface HolidayCalendar {
  id: string
  name: string
  locations: string[]
  year: number
  status: 'draft' | 'published'
  holidays: Holiday[]
}

/** Max optional holidays an employee may confirm per year, per policy. */
export const MAX_OPTIONAL_HOLIDAYS = 2

export const seedHolidayCalendars: HolidayCalendar[] = [
  {
    id: 'hc-1',
    name: 'India Holidays 2026',
    locations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    year: 2026,
    status: 'published',
    holidays: [
      { id: 'h-01', name: 'Republic Day', date: '2026-01-26', day: 'Monday', kind: 'fixed', swapWith: null },
      { id: 'h-02', name: 'Holi', date: '2026-03-04', day: 'Wednesday', kind: 'fixed', swapWith: null },
      { id: 'h-03', name: 'Ugadi', date: '2026-03-19', day: 'Thursday', kind: 'optional', swapWith: 'Onam' },
      { id: 'h-04', name: 'Independence Day', date: '2026-08-15', day: 'Saturday', kind: 'fixed', swapWith: null },
      { id: 'h-05', name: 'Onam', date: '2026-08-26', day: 'Wednesday', kind: 'optional', swapWith: 'Ugadi' },
      { id: 'h-06', name: 'Gandhi Jayanti', date: '2026-10-02', day: 'Friday', kind: 'fixed', swapWith: null },
      { id: 'h-07', name: 'Diwali', date: '2026-11-08', day: 'Sunday', kind: 'fixed', swapWith: null },
      { id: 'h-08', name: 'Karthigai Deepam', date: '2026-11-24', day: 'Tuesday', kind: 'optional', swapWith: 'Christmas Eve' },
      { id: 'h-09', name: 'Christmas Eve', date: '2026-12-24', day: 'Thursday', kind: 'optional', swapWith: 'Karthigai Deepam' },
      { id: 'h-10', name: 'Christmas', date: '2026-12-25', day: 'Friday', kind: 'fixed', swapWith: null },
    ],
  },
  {
    id: 'hc-2',
    name: 'US Holidays 2026',
    locations: ['Austin'],
    year: 2026,
    status: 'published',
    holidays: [
      { id: 'h-11', name: 'New Year’s Day', date: '2026-01-01', day: 'Thursday', kind: 'fixed', swapWith: null },
      { id: 'h-12', name: 'Independence Day (observed)', date: '2026-07-03', day: 'Friday', kind: 'fixed', swapWith: null },
      { id: 'h-13', name: 'Labor Day', date: '2026-09-07', day: 'Monday', kind: 'fixed', swapWith: null },
      { id: 'h-14', name: 'Thanksgiving', date: '2026-11-26', day: 'Thursday', kind: 'fixed', swapWith: null },
      { id: 'h-15', name: 'Day after Thanksgiving', date: '2026-11-27', day: 'Friday', kind: 'optional', swapWith: 'Christmas Eve (US)' },
      { id: 'h-16', name: 'Christmas Eve (US)', date: '2026-12-24', day: 'Thursday', kind: 'optional', swapWith: 'Day after Thanksgiving' },
      { id: 'h-17', name: 'Christmas Day', date: '2026-12-25', day: 'Friday', kind: 'fixed', swapWith: null },
    ],
  },
  {
    id: 'hc-3',
    name: 'India Holidays 2027 (draft)',
    locations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    year: 2027,
    status: 'draft',
    holidays: [
      { id: 'h-18', name: 'Republic Day', date: '2027-01-26', day: 'Tuesday', kind: 'fixed', swapWith: null },
    ],
  },
]

export interface OptionalHolidayRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeClass: string
  holidayName: string
  date: string
  day: string
  status: 'pending' | 'approved' | 'rejected'
  employeeActive: boolean
}

export const seedOptionalRequests: OptionalHolidayRequest[] = [
  {
    id: 'ohr-1',
    employeeId: 'emp-1003',
    employeeName: 'Priya Iyer',
    employeeClass: 'Regular',
    holidayName: 'Onam',
    date: '2026-08-26',
    day: 'Wednesday',
    status: 'pending',
    employeeActive: true,
  },
  {
    id: 'ohr-2',
    employeeId: 'emp-1004',
    employeeName: 'Vikram Rao',
    employeeClass: 'Regular',
    holidayName: 'Karthigai Deepam',
    date: '2026-11-24',
    day: 'Tuesday',
    status: 'pending',
    employeeActive: true,
  },
  {
    id: 'ohr-3',
    employeeId: 'emp-1005',
    employeeName: 'Meera Krishnan',
    employeeClass: 'Probationary',
    holidayName: 'Ugadi',
    date: '2026-03-19',
    day: 'Thursday',
    status: 'approved',
    employeeActive: true,
  },
  {
    id: 'ohr-4',
    employeeId: 'emp-1010',
    employeeName: 'Arjun Nair',
    employeeClass: 'Regular',
    holidayName: 'Christmas Eve',
    date: '2026-12-24',
    day: 'Thursday',
    status: 'rejected',
    employeeActive: false,
  },
]
