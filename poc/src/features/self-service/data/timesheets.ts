export const TIMESHEET_STATUSES = [
  'Pending for submission',
  'Submitted',
  'Approved',
  'Rejected',
] as const
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number]

export const WORK_TYPES = [
  'Development',
  'Code review',
  'Meetings',
  'Support',
  'Documentation',
  'Training',
] as const
export type WorkType = (typeof WORK_TYPES)[number]

export const TS_CLIENTS = ['Acme Retail', 'Northwind Bank', 'Internal'] as const
export const TS_PROJECTS = [
  'Acme storefront revamp',
  'Northwind core banking',
  'Internal platform tooling',
] as const
export const TS_TASKS = [
  'Feature build',
  'Bug fixes',
  'Sprint ceremonies',
  'UAT support',
  'Tech design',
] as const

export const WEEKDAY_LABELS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const

/** One row of a weekly timesheet (ESS-24/25). */
export interface TimesheetEntry {
  id: string
  client: string
  project: string
  task: string
  typeOfWork: WorkType
  productive: boolean
  nonProductiveReason: string
  /** Hours per weekday, Mon..Sun. */
  hours: number[]
  comment: string
}

export interface Timesheet {
  id: string
  periodStart: string
  periodEnd: string
  status: TimesheetStatus
  entries: TimesheetEntry[]
}

export const seedTimesheets: Timesheet[] = [
  {
    id: 'ts-01',
    periodStart: '2026-06-22',
    periodEnd: '2026-06-28',
    status: 'Pending for submission',
    entries: [
      { id: 'te-01', client: 'Acme Retail', project: 'Acme storefront revamp', task: 'Feature build', typeOfWork: 'Development', productive: true, nonProductiveReason: '', hours: [6, 5.5, 6, 4, 5, 0, 0], comment: 'Checkout service rewrite' },
      { id: 'te-02', client: 'Acme Retail', project: 'Acme storefront revamp', task: 'Sprint ceremonies', typeOfWork: 'Meetings', productive: false, nonProductiveReason: 'Recurring ceremonies', hours: [1, 1.5, 1, 1, 1, 0, 0], comment: '' },
      { id: 'te-03', client: 'Internal', project: 'Internal platform tooling', task: 'Tech design', typeOfWork: 'Documentation', productive: true, nonProductiveReason: '', hours: [1, 1, 1, 3, 2, 0, 0], comment: 'CI pipeline RFC' },
    ],
  },
  {
    id: 'ts-02',
    periodStart: '2026-06-15',
    periodEnd: '2026-06-21',
    status: 'Submitted',
    entries: [
      { id: 'te-04', client: 'Acme Retail', project: 'Acme storefront revamp', task: 'Feature build', typeOfWork: 'Development', productive: true, nonProductiveReason: '', hours: [7, 6, 6.5, 6, 5, 0, 0], comment: '' },
      { id: 'te-05', client: 'Northwind Bank', project: 'Northwind core banking', task: 'UAT support', typeOfWork: 'Support', productive: true, nonProductiveReason: '', hours: [1, 2, 1.5, 2, 3, 0, 0], comment: 'Cycle 2 defect triage' },
    ],
  },
  {
    id: 'ts-03',
    periodStart: '2026-06-08',
    periodEnd: '2026-06-14',
    status: 'Approved',
    entries: [
      { id: 'te-06', client: 'Acme Retail', project: 'Acme storefront revamp', task: 'Bug fixes', typeOfWork: 'Development', productive: true, nonProductiveReason: '', hours: [8, 7, 7, 6, 6, 0, 0], comment: 'Release-week fixes' },
    ],
  },
  {
    id: 'ts-04',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-07',
    status: 'Rejected',
    entries: [
      { id: 'te-07', client: 'Internal', project: 'Internal platform tooling', task: 'Feature build', typeOfWork: 'Development', productive: true, nonProductiveReason: '', hours: [8, 8, 8, 8, 8, 0, 0], comment: 'Hours mismatch with allocation — resubmit' },
    ],
  },
]

export function timesheetTotal(sheet: Timesheet): number {
  return sheet.entries.reduce(
    (sum, entry) => sum + entry.hours.reduce((a, b) => a + b, 0),
    0
  )
}
