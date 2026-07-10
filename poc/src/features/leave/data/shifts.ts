/**
 * Leave-configuration Shift master (Kensium "Shift" section): location-based
 * shift definitions with scheduled hours, flexi option, tolerance limits,
 * weekly offs and roster visibility.
 *
 * Note: the attendance module keeps its own roster shift patterns in
 * src/features/attendance/data/shifts.ts. This leave shift master is the
 * Kensium-PDF-shaped definition (year start month, flexi hours / tolerance,
 * weekly offs, applicable locations); attendance rosters reference their own
 * patterns and are not affected by this master.
 */

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export const YEAR_START_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export interface ShiftDefinition {
  id: string
  /** #1 Shift name. */
  name: string
  /** #2 Year starts from — month used to track both attendance and leaves. */
  yearStartsFrom: string
  /** #3 Shift starts at (HH:mm). */
  startsAt: string
  /** #4 Shift ends at (HH:mm). */
  endsAt: string
  /** #5 Default shift — assigned to employees with no shift; only one may be default. */
  defaultShift: boolean
  /** #6 Flexi hours — lost hours (late arrival / early departure) are not tracked. */
  flexiHours: boolean
  /** #7 Shift tolerance limit in minutes — must be null for flexi shifts. */
  toleranceMinutes: number | null
  /** #8 Weekly offs for this shift. */
  weeklyOffs: string[]
  /** #9 Applicable locations from the location master. */
  applicableLocations: string[]
  /** Shift roster visibility (days ahead employees can see the roster). */
  rosterVisibilityDays: number
}

export const seedShifts: ShiftDefinition[] = [
  {
    id: 'shf-1',
    name: 'General Shift (9–6)',
    yearStartsFrom: 'April',
    startsAt: '09:00',
    endsAt: '18:00',
    defaultShift: true,
    flexiHours: false,
    toleranceMinutes: 15,
    weeklyOffs: ['Saturday', 'Sunday'],
    applicableLocations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    rosterVisibilityDays: 30,
  },
  {
    id: 'shf-2',
    name: 'Flexi Shift (US)',
    yearStartsFrom: 'January',
    startsAt: '10:00',
    endsAt: '19:00',
    defaultShift: false,
    flexiHours: true,
    // Per the PDF, no tolerance limit is given for flexi-hour shifts.
    toleranceMinutes: null,
    weeklyOffs: ['Saturday', 'Sunday'],
    applicableLocations: ['Austin'],
    rosterVisibilityDays: 14,
  },
  {
    id: 'shf-3',
    name: 'Night & Weekend Support',
    yearStartsFrom: 'April',
    startsAt: '22:00',
    endsAt: '07:00',
    defaultShift: false,
    flexiHours: false,
    toleranceMinutes: 30,
    weeklyOffs: ['Monday', 'Tuesday'],
    applicableLocations: ['Hyderabad', 'Chennai'],
    rosterVisibilityDays: 21,
  },
]
