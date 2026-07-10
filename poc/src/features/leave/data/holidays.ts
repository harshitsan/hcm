/**
 * Holiday calendars per location and year (LVE-40), the employee-facing
 * holiday list with optional-holiday confirmation and swap (LVE-33), and
 * manager review of optional-holiday requests (LVE-46).
 *
 * Calendars are built on shifts (Kensium Holiday Calendar section): the
 * applicable locations derive from the selected shifts, and a calendar can
 * hold regular holidays, optional holidays and recurring weekly offs.
 */

/** Recurring-weekly-off definition (Kensium: day, recur on every "X" week, full/half day). */
export interface WeeklyOffRule {
  /** Weekday of the recurring off, e.g. 'Saturday'. */
  day: string
  /** Which week of the month it recurs on ('all' = every week, 1..4). */
  recurEveryWeek: number | 'all'
  duration: 'full-day' | 'half-day'
}

export interface Holiday {
  id: string
  name: string
  /** Empty for recurring weekly offs — the recurrence rule applies instead. */
  date: string
  day: string
  kind: 'fixed' | 'optional' | 'weekly-off'
  /** Brief description of the holiday / weekly off (optional in the PDF). */
  description: string
  /** Another optional holiday this one can be exchanged with (LVE-33). */
  swapWith: string | null
  /** Set only when kind === 'weekly-off'. */
  weeklyOff?: WeeklyOffRule | null
}

export interface HolidayCalendar {
  id: string
  name: string
  /** Shifts (from the leave shift master) the calendar is built on. */
  shiftIds: string[]
  /** Derived from the applicable locations of the selected shifts. */
  locations: string[]
  year: number
  status: 'draft' | 'published'
  /** "Notify employees" — share this calendar with employees. */
  notifyEmployees: boolean
  holidays: Holiday[]
}

/** Max optional holidays an employee may confirm per year, per policy. */
export const MAX_OPTIONAL_HOLIDAYS = 2

export const seedHolidayCalendars: HolidayCalendar[] = [
  {
    id: 'hc-1',
    name: 'India Holidays 2026',
    shiftIds: ['shf-1', 'shf-3'],
    locations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    year: 2026,
    status: 'published',
    notifyEmployees: true,
    holidays: [
      { id: 'h-01', name: 'Republic Day', date: '2026-01-26', day: 'Monday', kind: 'fixed', description: 'National holiday — Republic Day of India.', swapWith: null },
      { id: 'h-02', name: 'Holi', date: '2026-03-04', day: 'Wednesday', kind: 'fixed', description: 'Festival of colours.', swapWith: null },
      { id: 'h-03', name: 'Ugadi', date: '2026-03-19', day: 'Thursday', kind: 'optional', description: 'Telugu & Kannada new year — optional, swappable.', swapWith: 'Onam' },
      { id: 'h-04', name: 'Independence Day', date: '2026-08-15', day: 'Saturday', kind: 'fixed', description: 'National holiday — Independence Day of India.', swapWith: null },
      { id: 'h-05', name: 'Onam', date: '2026-08-26', day: 'Wednesday', kind: 'optional', description: 'Kerala harvest festival — optional, swappable.', swapWith: 'Ugadi' },
      { id: 'h-06', name: 'Gandhi Jayanti', date: '2026-10-02', day: 'Friday', kind: 'fixed', description: 'National holiday — birth anniversary of Mahatma Gandhi.', swapWith: null },
      { id: 'h-07', name: 'Diwali', date: '2026-11-08', day: 'Sunday', kind: 'fixed', description: 'Festival of lights.', swapWith: null },
      { id: 'h-08', name: 'Karthigai Deepam', date: '2026-11-24', day: 'Tuesday', kind: 'optional', description: 'Tamil festival of lamps — optional, swappable.', swapWith: 'Christmas Eve' },
      { id: 'h-09', name: 'Christmas Eve', date: '2026-12-24', day: 'Thursday', kind: 'optional', description: 'Optional holiday ahead of Christmas.', swapWith: 'Karthigai Deepam' },
      { id: 'h-10', name: 'Christmas', date: '2026-12-25', day: 'Friday', kind: 'fixed', description: 'Christmas Day.', swapWith: null },
      // Recurring weekly offs (Kensium: e.g. 2nd & 4th Saturdays of every month).
      { id: 'h-w1', name: '2nd Saturday off', date: '', day: 'Saturday', kind: 'weekly-off', description: 'Second Saturday of every month is a full-day off.', swapWith: null, weeklyOff: { day: 'Saturday', recurEveryWeek: 2, duration: 'full-day' } },
      { id: 'h-w2', name: '4th Saturday off', date: '', day: 'Saturday', kind: 'weekly-off', description: 'Fourth Saturday of every month is a full-day off.', swapWith: null, weeklyOff: { day: 'Saturday', recurEveryWeek: 4, duration: 'full-day' } },
      { id: 'h-w3', name: '1st Saturday half day', date: '', day: 'Saturday', kind: 'weekly-off', description: 'First Saturday of every month is a half-day.', swapWith: null, weeklyOff: { day: 'Saturday', recurEveryWeek: 1, duration: 'half-day' } },
    ],
  },
  {
    id: 'hc-2',
    name: 'US Holidays 2026',
    shiftIds: ['shf-2'],
    locations: ['Austin'],
    year: 2026,
    status: 'published',
    notifyEmployees: true,
    holidays: [
      { id: 'h-11', name: 'New Year’s Day', date: '2026-01-01', day: 'Thursday', kind: 'fixed', description: 'Federal holiday — New Year’s Day.', swapWith: null },
      { id: 'h-12', name: 'Independence Day (observed)', date: '2026-07-03', day: 'Friday', kind: 'fixed', description: 'Federal holiday observed — 4 July falls on a Saturday.', swapWith: null },
      { id: 'h-13', name: 'Labor Day', date: '2026-09-07', day: 'Monday', kind: 'fixed', description: 'Federal holiday — Labor Day.', swapWith: null },
      { id: 'h-14', name: 'Thanksgiving', date: '2026-11-26', day: 'Thursday', kind: 'fixed', description: 'Federal holiday — Thanksgiving Day.', swapWith: null },
      { id: 'h-15', name: 'Day after Thanksgiving', date: '2026-11-27', day: 'Friday', kind: 'optional', description: 'Optional holiday — swappable with Christmas Eve.', swapWith: 'Christmas Eve (US)' },
      { id: 'h-16', name: 'Christmas Eve (US)', date: '2026-12-24', day: 'Thursday', kind: 'optional', description: 'Optional holiday — swappable with the day after Thanksgiving.', swapWith: 'Day after Thanksgiving' },
      { id: 'h-17', name: 'Christmas Day', date: '2026-12-25', day: 'Friday', kind: 'fixed', description: 'Federal holiday — Christmas Day.', swapWith: null },
    ],
  },
  {
    id: 'hc-3',
    name: 'India Holidays 2027 (draft)',
    shiftIds: ['shf-1', 'shf-3'],
    locations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    year: 2027,
    status: 'draft',
    notifyEmployees: false,
    holidays: [
      { id: 'h-18', name: 'Republic Day', date: '2027-01-26', day: 'Tuesday', kind: 'fixed', description: 'National holiday — Republic Day of India.', swapWith: null },
      { id: 'h-w4', name: '2nd Saturday off', date: '', day: 'Saturday', kind: 'weekly-off', description: 'Second Saturday of every month is a full-day off.', swapWith: null, weeklyOff: { day: 'Saturday', recurEveryWeek: 2, duration: 'full-day' } },
    ],
  },
]

/** Human-readable recurrence, e.g. "Every 2nd Saturday · full day". */
export function fmtWeeklyOff(rule: WeeklyOffRule) {
  const ordinal =
    rule.recurEveryWeek === 'all'
      ? `Every ${rule.day}`
      : `Every ${rule.recurEveryWeek}${['st', 'nd', 'rd', 'th'][Math.min(Number(rule.recurEveryWeek), 4) - 1]} ${rule.day}`
  return `${ordinal} · ${rule.duration === 'full-day' ? 'full day' : 'half day'}`
}

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
