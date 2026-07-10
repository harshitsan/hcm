/* Locations, work areas and shifts referenced by departments. */

export interface OfficeLocation {
  id: string
  name: string
  city: string
  /** Retired sites flag dependent departments for reassignment (DEPT-27). */
  retired: boolean
}

export const LOCATIONS: OfficeLocation[] = [
  { id: 'loc-1', name: 'Hyderabad HQ', city: 'Hyderabad', retired: false },
  { id: 'loc-2', name: 'Bengaluru Tech Office', city: 'Bengaluru', retired: false },
  { id: 'loc-3', name: 'Chennai Distribution Centre', city: 'Chennai', retired: false },
  { id: 'loc-4', name: 'Pune Regional Office', city: 'Pune', retired: true },
]

export interface WorkArea {
  id: string
  name: string
  locationId: string
}

export const WORK_AREAS: WorkArea[] = [
  { id: 'wa-1', name: 'Floor 3 — East Wing', locationId: 'loc-1' },
  { id: 'wa-2', name: 'Floor 2 — Interview Suites', locationId: 'loc-1' },
  { id: 'wa-3', name: 'Tower B — Engineering Bays', locationId: 'loc-2' },
  { id: 'wa-4', name: 'Dock A — Inbound', locationId: 'loc-3' },
  { id: 'wa-5', name: 'Cold Storage Block', locationId: 'loc-3' },
  { id: 'wa-6', name: 'Shop Floor — Front of House', locationId: 'loc-4' },
]

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type WeekDay = (typeof WEEK_DAYS)[number]

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  durationHours: number
  /** Weekly off / rest days for the shift (DEPT-30). */
  weeklyOffs: WeekDay[]
}

/** Duration in hours between two HH:mm times (overnight shifts wrap past midnight). */
export const shiftDurationHours = (start: string, end: string): number => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const minutes = (eh * 60 + em - (sh * 60 + sm) + 24 * 60) % (24 * 60)
  return Math.round((minutes === 0 ? 24 * 60 : minutes) / 30) / 2
}

export const SHIFTS: Shift[] = [
  {
    id: 'sh-1',
    name: 'General Shift',
    startTime: '09:00',
    endTime: '18:00',
    durationHours: 9,
    weeklyOffs: ['Sat', 'Sun'],
  },
  {
    id: 'sh-2',
    name: 'Early Shift',
    startTime: '06:00',
    endTime: '14:00',
    durationHours: 8,
    weeklyOffs: ['Sun'],
  },
  {
    id: 'sh-3',
    name: 'Night Shift',
    startTime: '22:00',
    endTime: '06:00',
    durationHours: 8,
    weeklyOffs: ['Sun', 'Mon'],
  },
  {
    id: 'sh-4',
    name: 'Retail Shift',
    startTime: '11:00',
    endTime: '20:00',
    durationHours: 9,
    weeklyOffs: ['Wed'],
  },
]

/**
 * Remaining shift definitions (Kensium parity: 31 shifts total, SHFT-07).
 * Tuples of [name, startTime, endTime, weeklyOffs].
 */
const EXTRA_SHIFT_DEFS: ReadonlyArray<
  readonly [string, string, string, ReadonlyArray<WeekDay>]
> = [
  ['Morning A', '05:00', '13:00', ['Sun']],
  ['Morning B', '07:00', '15:00', ['Sun']],
  ['Evening A', '14:00', '22:00', ['Mon']],
  ['Evening B', '15:00', '23:00', ['Tue']],
  ['US East Support', '18:30', '03:30', ['Sat', 'Sun']],
  ['US West Support', '21:30', '06:30', ['Sat', 'Sun']],
  ['EU Coverage', '12:30', '21:30', ['Sat', 'Sun']],
  ['APAC Coverage', '04:30', '13:30', ['Sat', 'Sun']],
  ['NOC Graveyard', '00:00', '08:00', ['Wed']],
  ['Warehouse Inbound Early', '04:00', '12:00', ['Sun']],
  ['Warehouse Outbound Late', '16:00', '00:00', ['Mon']],
  ['Cold Storage Rotation', '08:00', '16:00', ['Thu']],
  ['Dock Weekend', '08:00', '20:00', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']],
  ['Retail Weekend', '10:00', '19:00', ['Mon', 'Tue']],
  ['Security Day', '06:00', '18:00', ['Wed', 'Thu']],
  ['Security Night', '18:00', '06:00', ['Mon', 'Tue']],
  ['Facilities Day', '08:30', '17:30', ['Sat', 'Sun']],
  ['Cafeteria Service', '06:30', '15:30', ['Sun']],
  ['IT On-Call Rotation', '10:00', '19:00', ['Sat']],
  ['Payroll Close Support', '09:30', '18:30', ['Sat', 'Sun']],
  ['HR Front Desk', '08:00', '17:00', ['Sat', 'Sun']],
  ['Finance Quarter Close', '09:00', '20:00', ['Sun']],
  ['Split AM', '06:00', '10:00', ['Sun']],
  ['Split PM', '16:00', '20:00', ['Sun']],
  ['Driver Long Haul', '03:00', '15:00', ['Fri', 'Sat']],
  ['Customer Success EMEA', '11:00', '20:00', ['Sat', 'Sun']],
  ['QA Weekend Sweep', '09:00', '17:00', ['Mon', 'Tue', 'Wed']],
]

/** Full editable shift catalog (31 shifts) seeding the departments store (SHFT-06/07). */
export const seedShifts: Shift[] = [
  ...SHIFTS,
  ...EXTRA_SHIFT_DEFS.map(([name, startTime, endTime, weeklyOffs], i) => ({
    id: `sh-${i + 5}`,
    name,
    startTime,
    endTime,
    durationHours: shiftDurationHours(startTime, endTime),
    weeklyOffs: [...weeklyOffs],
  })),
]
