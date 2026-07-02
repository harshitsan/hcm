export const SCHEDULE_FREQUENCIES = ['Daily', 'Weekly', 'Monthly'] as const
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number]

export const SCHEDULE_FORMATS = ['PDF', 'XLSX', 'CSV'] as const
export type ScheduleFormat = (typeof SCHEDULE_FORMATS)[number]

export type ScheduleStatus = 'active' | 'paused' | 'cancelled'

/** Email delivery schedule for a report (RPT-09). */
export interface ReportSchedule {
  id: string
  reportName: string
  frequency: ScheduleFrequency
  /** 24h delivery time, e.g. "07:00". */
  time: string
  recipients: string[]
  format: ScheduleFormat
  status: ScheduleStatus
  nextRun: string
  createdBy: string
  /** Company scope stamped from the creator's access at creation time. */
  scope: string
}

export const seedSchedules: ReportSchedule[] = [
  {
    id: 'sch-01',
    reportName: 'Defaulters Attendance Report',
    frequency: 'Daily',
    time: '07:00',
    recipients: ['hr-ops@aurora.example', 'sunita.patil@aurora.example'],
    format: 'XLSX',
    status: 'active',
    nextRun: '2026-07-03 07:00',
    createdBy: 'Sunita Patil',
    scope: 'Aurora Software',
  },
  {
    id: 'sch-02',
    reportName: 'LOP Report',
    frequency: 'Monthly',
    time: '09:00',
    recipients: ['payroll@aurora.example'],
    format: 'CSV',
    status: 'active',
    nextRun: '2026-07-25 09:00',
    createdBy: 'Sunita Patil',
    scope: 'Aurora Software',
  },
  {
    id: 'sch-03',
    reportName: 'Attrition Report',
    frequency: 'Weekly',
    time: '08:30',
    recipients: ['devika.rao@satellitehr.example', 'cxo@satellitehr.example'],
    format: 'PDF',
    status: 'active',
    nextRun: '2026-07-06 08:30',
    createdBy: 'Devika Rao',
    scope: 'Portfolio (3 companies)',
  },
  {
    id: 'sch-04',
    reportName: 'Resource Utilization Report',
    frequency: 'Weekly',
    time: '18:00',
    recipients: ['pmo@aurora.example'],
    format: 'XLSX',
    status: 'paused',
    nextRun: '—',
    createdBy: 'Sunita Patil',
    scope: 'Aurora Software',
  },
  {
    id: 'sch-05',
    reportName: 'Employee Monthly TDS Report',
    frequency: 'Monthly',
    time: '10:00',
    recipients: ['finance@aurora.example', 'tax@aurora.example'],
    format: 'CSV',
    status: 'cancelled',
    nextRun: '—',
    createdBy: 'Sunita Patil',
    scope: 'Aurora Software',
  },
]

export type DeliveryOutcome = 'delivered' | 'failed' | 'retried-delivered'

/** Notification/Template engine delivery log entry (RPT-24). */
export interface DeliveryLogEntry {
  id: string
  reportName: string
  ranAt: string
  outcome: DeliveryOutcome
  attempts: number
  detail: string
}

export const seedDeliveries: DeliveryLogEntry[] = [
  {
    id: 'dl-01',
    reportName: 'Defaulters Attendance Report',
    ranAt: '2026-07-02 07:00',
    outcome: 'delivered',
    attempts: 1,
    detail: 'Rendered with template “Daily Ops Digest” · 2 recipients',
  },
  {
    id: 'dl-02',
    reportName: 'Attrition Report',
    ranAt: '2026-06-29 08:30',
    outcome: 'retried-delivered',
    attempts: 2,
    detail: 'SMTP timeout on attempt 1 · engine retry succeeded after 5 min',
  },
  {
    id: 'dl-03',
    reportName: 'Defaulters Attendance Report',
    ranAt: '2026-07-01 07:00',
    outcome: 'delivered',
    attempts: 1,
    detail: 'Rendered with template “Daily Ops Digest” · 2 recipients',
  },
  {
    id: 'dl-04',
    reportName: 'LOP Report',
    ranAt: '2026-06-25 09:00',
    outcome: 'failed',
    attempts: 3,
    detail: 'Recipient mailbox full · retries exhausted, outcome recorded',
  },
  {
    id: 'dl-05',
    reportName: 'Resource Utilization Report',
    ranAt: '2026-06-22 18:00',
    outcome: 'delivered',
    attempts: 1,
    detail: 'Rendered with template “Weekly PMO Pack” · 1 recipient',
  },
]

/** Naive next-run computation for the in-memory store. */
export function computeNextRun(
  frequency: ScheduleFrequency,
  time: string
): string {
  switch (frequency) {
    case 'Daily':
      return `2026-07-03 ${time}`
    case 'Weekly':
      return `2026-07-06 ${time}`
    case 'Monthly':
      return `2026-07-25 ${time}`
  }
}
