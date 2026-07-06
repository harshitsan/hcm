/**
 * Attendance Tracking & Time Management reference data (EAS/ECO/EOT/EOV/ESA/
 * WFH/PCR/TMD/TUS stories): per-employee hours summaries, pending change
 * requests, timesheet entries and weekly utilization breakdowns. Everything is
 * generated deterministically so the POC behaves the same on every load.
 */
import {
  EMPLOYEES,
  todayIso,
  type Employee,
} from './shared'
import type {
  CompOffRequest,
  OutTimeRequest,
  OvertimeRequest,
  WfhRequest,
} from './requests'

/* ------------------------------------------------------------------ */
/* Active / inactive roster (EAS-02, ECO-06, EOV-05, WFH-06)           */
/* ------------------------------------------------------------------ */

export interface TrackedEmployee extends Employee {
  active: boolean
  /** Last working day for former staff. */
  exitDate: string | null
}

/** Former staff kept for historical reporting — excluded by default. */
const FORMER_EMPLOYEES: TrackedEmployee[] = [
  {
    id: 'emp-90', code: 'ST-0921', name: 'Pooja Reddy', department: 'Sales',
    position: 'Associate', location: 'Pune', employeeClass: 'Regular',
    workerCategory: 'Staff', selfService: true, supervisor: 'Divya Pillai',
    active: false, exitDate: '2026-05-31',
  },
  {
    id: 'emp-91', code: 'ST-0876', name: 'Aditya Kapoor', department: 'Engineering',
    position: 'Senior Associate', location: 'Hyderabad', employeeClass: 'Regular',
    workerCategory: 'Staff', selfService: true, supervisor: 'Sunita Patil',
    active: false, exitDate: '2026-06-15',
  },
]

export const TRACKED_EMPLOYEES: TrackedEmployee[] = [
  ...EMPLOYEES.map((e) => ({ ...e, active: true, exitDate: null })),
  ...FORMER_EMPLOYEES,
]

const INACTIVE_IDS = new Set(FORMER_EMPLOYEES.map((e) => e.id))

export function isInactiveEmployee(id: string) {
  return INACTIVE_IDS.has(id)
}

export function trackedEmployeeName(id: string) {
  return TRACKED_EMPLOYEES.find((e) => e.id === id)?.name ?? id
}

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random helper                                  */
/* ------------------------------------------------------------------ */

function seedNum(key: string) {
  let h = 7
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/* ------------------------------------------------------------------ */
/* Employee Attendance Summary rows (EAS-01 … EAS-07)                  */
/* ------------------------------------------------------------------ */

export interface AttendanceSummaryRow {
  employeeId: string
  date: string
  shiftId: string
  scheduledHours: number
  leaveHours: number
  officialVisitHours: number
  clientLocationHours: number
  personalOutHours: number
  wfhHours: number
  breakHours: number
  totalHours: number
  effectiveHours: number
}

/** Fixed shift allocation used by the summary + utilization generators. */
const SHIFT_BY_EMPLOYEE: Record<string, string> = {
  'emp-01': 'shift-01', 'emp-02': 'shift-01', 'emp-03': 'shift-01',
  'emp-04': 'shift-03', 'emp-05': 'shift-01', 'emp-06': 'shift-01',
  'emp-07': 'shift-01', 'emp-08': 'shift-01', 'emp-09': 'shift-02',
  'emp-10': 'shift-02', 'emp-11': 'shift-01', 'emp-12': 'shift-01',
  'emp-90': 'shift-01', 'emp-91': 'shift-01',
}

export function shiftForEmployee(employeeId: string) {
  return SHIFT_BY_EMPLOYEE[employeeId] ?? 'shift-01'
}

/** Local-timezone-safe YYYY-MM-DD (toISOString would shift the day). */
function localIso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function* workingDays(fromIso: string, toIso: string) {
  const d = new Date(`${fromIso}T00:00:00`)
  const end = new Date(`${toIso}T00:00:00`)
  while (d <= end) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) yield localIso(d)
    d.setDate(d.getDate() + 1)
  }
}

/**
 * Generates one attendance-summary row per employee per working day in the
 * range. Values are derived from a hash of employee+date so the summary is
 * stable across renders and reloads.
 */
export function buildSummaryRows(fromIso: string, toIso: string): AttendanceSummaryRow[] {
  const rows: AttendanceSummaryRow[] = []
  for (const emp of TRACKED_EMPLOYEES) {
    for (const date of workingDays(fromIso, toIso)) {
      // Former staff have no attendance after their exit date.
      if (emp.exitDate && date > emp.exitDate) continue
      const h = seedNum(`${emp.id}|${date}`)
      const scheduledHours = 8
      if (h % 17 === 0) {
        rows.push({
          employeeId: emp.id, date, shiftId: shiftForEmployee(emp.id),
          scheduledHours, leaveHours: 8, officialVisitHours: 0,
          clientLocationHours: 0, personalOutHours: 0, wfhHours: 0,
          breakHours: 0, totalHours: 0, effectiveHours: 0,
        })
        continue
      }
      const wfhDay = h % 9 === 0
      const officialVisitHours = !wfhDay && h % 11 === 0 ? 2 : 0
      const clientLocationHours = !wfhDay && h % 13 === 0 ? 4 : 0
      const personalOutHours = h % 7 === 0 ? round2(0.5 + (h % 3) * 0.25) : 0
      const breakHours = round2(0.75 + (h % 4) * 0.25)
      const overrun = round2(((h % 5) - 2) * 0.25)
      const totalHours = round2(scheduledHours + overrun)
      const effectiveHours = round2(
        Math.max(0, totalHours - breakHours - personalOutHours)
      )
      rows.push({
        employeeId: emp.id, date, shiftId: shiftForEmployee(emp.id),
        scheduledHours, leaveHours: 0, officialVisitHours, clientLocationHours,
        personalOutHours, wfhHours: wfhDay ? totalHours : 0, breakHours,
        totalHours, effectiveHours,
      })
    }
  }
  return rows
}

export const SUMMARY_DEFAULT_FROM = '2026-06-22'

export function summaryDefaultTo() {
  return todayIso()
}

/* ------------------------------------------------------------------ */
/* Historical requests from former staff (toggle fodder)               */
/* ------------------------------------------------------------------ */

export const inactiveCompOff: CompOffRequest[] = [
  { id: 'co-90', employeeId: 'emp-90', compOffDate: '2026-05-20', days: 1, earnedFrom: 'Weekend release support 17 May', status: 'approved', submittedOn: '2026-05-18' },
  { id: 'co-91', employeeId: 'emp-91', compOffDate: '2026-06-05', days: 0.5, earnedFrom: 'Late-night deployment 29 May', status: 'approved', submittedOn: '2026-06-01' },
]

export const inactiveOvertime: OvertimeRequest[] = [
  { id: 'ot-90', employeeId: 'emp-91', date: '2026-06-10', recordedHours: 2, approvedHours: 2, category: 'normal', status: 'approved', needsHigherApproval: false, approver: 'Sunita Patil', submittedOn: '2026-06-11' },
  { id: 'ot-91', employeeId: 'emp-90', date: '2026-05-24', recordedHours: 4.5, approvedHours: 4, category: 'holiday', status: 'approved', needsHigherApproval: true, approver: 'Arjun Mehta (above cap)', submittedOn: '2026-05-25' },
]

export const inactiveOutTime: OutTimeRequest[] = [
  { id: 'out-90', employeeId: 'emp-90', type: 'Official', fromDateTime: '2026-05-14T11:00', toDateTime: '2026-05-14T13:00', hours: 2, status: 'approved', policyNote: null, submittedOn: '2026-05-13' },
]

export const inactiveWfh: WfhRequest[] = [
  { id: 'wfh-90', employeeId: 'emp-90', fromDate: '2026-05-12', toDate: '2026-05-13', days: 2, hours: 16, status: 'approved', policyNote: null, submittedOn: '2026-05-10' },
  { id: 'wfh-91', employeeId: 'emp-91', fromDate: '2026-06-08', toDate: '2026-06-08', days: 1, hours: 8, status: 'approved', policyNote: null, submittedOn: '2026-06-05' },
]

/* ------------------------------------------------------------------ */
/* Pending Change Requests (PCR-06)                                    */
/* ------------------------------------------------------------------ */

export const CHANGE_FIELDS = ['Punch In', 'Punch Out', 'Shift', 'Break Duration'] as const
export type ChangeField = (typeof CHANGE_FIELDS)[number]

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'

export interface PendingChangeRequest {
  id: string
  employeeId: string
  date: string
  field: ChangeField
  currentValue: string
  requestedValue: string
  reason: string
  requestedOn: string
  status: ChangeRequestStatus
}

export const seedChangeRequests: PendingChangeRequest[] = [
  { id: 'pcr-01', employeeId: 'emp-02', date: '2026-07-01', field: 'Punch In', currentValue: '09:42', requestedValue: '09:10', reason: 'Badge reader retried thrice at HYD Gate 2', requestedOn: '2026-07-02', status: 'pending' },
  { id: 'pcr-02', employeeId: 'emp-05', date: '2026-06-30', field: 'Punch Out', currentValue: '—', requestedValue: '18:20', reason: 'Left with client team, forgot exit punch', requestedOn: '2026-07-01', status: 'pending' },
  { id: 'pcr-03', employeeId: 'emp-04', date: '2026-06-28', field: 'Shift', currentValue: 'Night 10–7', requestedValue: 'Early 7–4', reason: 'Swapped floors for maintenance window', requestedOn: '2026-06-29', status: 'pending' },
  { id: 'pcr-04', employeeId: 'emp-12', date: '2026-06-26', field: 'Break Duration', currentValue: '90m', requestedValue: '60m', reason: 'Cafeteria punch double-counted', requestedOn: '2026-06-27', status: 'pending' },
  { id: 'pcr-05', employeeId: 'emp-07', date: '2026-06-20', field: 'Punch Out', currentValue: '16:05', requestedValue: '18:00', reason: 'Worked from HR records room without badge access', requestedOn: '2026-06-21', status: 'approved' },
  { id: 'pcr-06', employeeId: 'emp-11', date: '2026-06-18', field: 'Punch In', currentValue: '10:20', requestedValue: '09:30', reason: 'Client call ran over at home before commute', requestedOn: '2026-06-19', status: 'rejected' },
]

/* ------------------------------------------------------------------ */
/* My Timesheet Details (TMD-06)                                       */
/* ------------------------------------------------------------------ */

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface TimesheetEntry {
  id: string
  date: string
  project: string
  task: string
  hours: number
  billable: boolean
  status: TimesheetStatus
  lastUpdated: string
}

export const seedTimesheet: TimesheetEntry[] = [
  { id: 'ts-01', date: '2026-07-03', project: 'Orbital ERP Rollout', task: 'Sprint 14 — API integration', hours: 6.5, billable: true, status: 'submitted', lastUpdated: '2026-07-03 18:12' },
  { id: 'ts-02', date: '2026-07-03', project: 'Internal', task: 'Team standup + retro', hours: 1.5, billable: false, status: 'submitted', lastUpdated: '2026-07-03 18:12' },
  { id: 'ts-03', date: '2026-07-02', project: 'Orbital ERP Rollout', task: 'Sprint 14 — payroll connector', hours: 7, billable: true, status: 'approved', lastUpdated: '2026-07-02 19:05' },
  { id: 'ts-04', date: '2026-07-01', project: 'Nimbus Portal', task: 'UAT defect triage', hours: 4, billable: true, status: 'approved', lastUpdated: '2026-07-01 17:40' },
  { id: 'ts-05', date: '2026-07-01', project: 'Internal', task: 'Security training', hours: 2, billable: false, status: 'approved', lastUpdated: '2026-07-01 17:40' },
  { id: 'ts-06', date: '2026-06-30', project: 'Nimbus Portal', task: 'Release notes draft', hours: 3, billable: true, status: 'draft', lastUpdated: '2026-06-30 16:22' },
]

/** Entries the "server" has that the stale list hasn't picked up yet. */
export const refreshedTimesheetExtras: TimesheetEntry[] = [
  { id: 'ts-07', date: '2026-07-04', project: 'Orbital ERP Rollout', task: 'Sprint 14 — code review', hours: 5, billable: true, status: 'submitted', lastUpdated: '2026-07-04 12:30' },
  { id: 'ts-08', date: '2026-07-04', project: 'Internal', task: 'KT session — attendance engine', hours: 2, billable: false, status: 'draft', lastUpdated: '2026-07-04 12:30' },
]

/* ------------------------------------------------------------------ */
/* Timesheet Utilization Summary (TUS-06 / TUS-07)                     */
/* ------------------------------------------------------------------ */

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export interface DayUtilization {
  productive: number
  nonProductive: number
}

export interface UtilizationRow {
  employeeId: string
  /** Index 0 = Sunday … 6 = Saturday. */
  days: DayUtilization[]
  productiveTotal: number
  nonProductiveTotal: number
  /** Productive hours vs a 40h utilization base, in percent. */
  utilizationPct: number
  nonUtilizationPct: number
}

export const UTILIZATION_WEEKS = [
  { value: '2026-06-28', label: 'Week of 28 Jun – 04 Jul' },
  { value: '2026-06-21', label: 'Week of 21 – 27 Jun' },
  { value: '2026-06-14', label: 'Week of 14 – 20 Jun' },
] as const

const UTILIZATION_BASE_HOURS = 40

/**
 * Deterministic per-employee productive vs non-productive hours for each
 * weekday of the selected week (TUS-07).
 */
export function buildUtilizationRows(weekStartIso: string): UtilizationRow[] {
  return TRACKED_EMPLOYEES.filter((e) => e.active).map((emp) => {
    const days: DayUtilization[] = WEEKDAY_LABELS.map((label, idx) => {
      const h = seedNum(`${emp.id}|${weekStartIso}|${label}`)
      if (idx === 0 || idx === 6) {
        // Weekend: occasional support hours only.
        return h % 8 === 0
          ? { productive: round2(2 + (h % 3)), nonProductive: 0 }
          : { productive: 0, nonProductive: 0 }
      }
      if (h % 15 === 0) return { productive: 0, nonProductive: 0 } // leave day
      const productive = round2(4.5 + (h % 7) * 0.5)
      const nonProductive = round2(0.5 + (h % 5) * 0.5)
      return { productive, nonProductive }
    })
    const productiveTotal = round2(days.reduce((s, d) => s + d.productive, 0))
    const nonProductiveTotal = round2(days.reduce((s, d) => s + d.nonProductive, 0))
    const utilizationPct = Math.min(
      100,
      Math.round((productiveTotal / UTILIZATION_BASE_HOURS) * 100)
    )
    return {
      employeeId: emp.id,
      days,
      productiveTotal,
      nonProductiveTotal,
      utilizationPct,
      nonUtilizationPct: 100 - utilizationPct,
    }
  })
}
