/**
 * Attendance rules-engine + audit configuration (WFE-31 … WFE-34) and the
 * alerts module settings (WFE-40, WFE-41).
 */

export interface AttendanceRule {
  id: string
  name: string
  expression: string
  timePeriod: string
  color: string
  applicability: string
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface AuditRecurrencePattern {
  id: string
  pattern: string
  location: string
  workArea: string
  nextRun: string
  updatedAt: string
}

export interface AuditSettings {
  enabled: boolean
  sampleMethod: 'Random' | 'Stratified' | 'Full population'
  includeHabitualViolators: boolean
  historyMonths: number
  minReprimands: number
  rescheduleLimit: number
  listGenMinutesBefore: number
}

export interface AuditorPanel {
  id: string
  name: string
  description: string
  location: string
  members: string[]
  updatedAt: string
}

export interface AlertSettings {
  moduleEnabled: boolean
  attendanceNotRecorded: boolean
  announcements: boolean
  pendingTask: boolean
  overdueTask: boolean
}

export const seedAttendanceRules: AttendanceRule[] = [
  {
    id: 'rule-01',
    name: 'Late Coming — Grace 15m',
    expression: 'check_in > shift_start + 15m',
    timePeriod: 'Daily',
    color: '#E8590C',
    applicability: 'All locations · Operations',
    status: 'active',
    updatedAt: '2026-05-08',
  },
  {
    id: 'rule-02',
    name: 'Early Leaving',
    expression: 'check_out < shift_end - 30m',
    timePeriod: 'Daily',
    color: '#C92A2A',
    applicability: 'Chennai, Hyderabad · All departments',
    status: 'active',
    updatedAt: '2026-05-08',
  },
  {
    id: 'rule-03',
    name: 'Missed Punch',
    expression: 'check_in = null OR check_out = null',
    timePeriod: 'Daily',
    color: '#862E9C',
    applicability: 'All locations · All departments',
    status: 'active',
    updatedAt: '2026-04-22',
  },
  {
    id: 'rule-04',
    name: 'Short Week — under 40h',
    expression: 'sum(worked_hours, week) < 40',
    timePeriod: 'Weekly',
    color: '#1864AB',
    applicability: 'Corporate offices only',
    status: 'inactive',
    updatedAt: '2026-03-15',
  },
]

export const seedRecurrencePatterns: AuditRecurrencePattern[] = [
  {
    id: 'rec-01',
    pattern: 'Weekly — every Monday 10:00',
    location: 'Chennai',
    workArea: 'Packaging Line A',
    nextRun: '2026-07-06',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rec-02',
    pattern: 'Monthly — 1st working day',
    location: 'Hyderabad',
    workArea: 'Corporate Tower',
    nextRun: '2026-08-03',
    updatedAt: '2026-06-01',
  },
  {
    id: 'rec-03',
    pattern: 'Fortnightly — alternate Fridays',
    location: 'Pune',
    workArea: 'Sales Hub',
    nextRun: '2026-07-10',
    updatedAt: '2026-05-20',
  },
]

export const defaultAuditSettings: AuditSettings = {
  enabled: true,
  sampleMethod: 'Random',
  includeHabitualViolators: true,
  historyMonths: 6,
  minReprimands: 3,
  rescheduleLimit: 2,
  listGenMinutesBefore: 30,
}

export const seedAuditorPanels: AuditorPanel[] = [
  {
    id: 'pan-01',
    name: 'Plant Audit Panel',
    description: 'Shift-floor attendance audits for manufacturing lines',
    location: 'Chennai',
    members: ['Rohit Verma', 'Elena Garcia'],
    updatedAt: '2026-04-11',
  },
  {
    id: 'pan-02',
    name: 'Corporate Audit Panel',
    description: 'Monthly attendance audits for corporate staff',
    location: 'Hyderabad',
    members: ['Priya Menon', 'Elena Garcia', 'David Kim'],
    updatedAt: '2026-04-11',
  },
]

export const defaultAlertSettings: AlertSettings = {
  moduleEnabled: true,
  attendanceNotRecorded: true,
  announcements: true,
  pendingTask: true,
  overdueTask: false,
}
