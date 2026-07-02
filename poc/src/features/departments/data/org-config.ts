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
