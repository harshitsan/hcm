/**
 * Knowledge Transfer — handover tasks raised when an employee exits or moves,
 * tracked from assignment through receipt with a day-wise weekly plan.
 */

export const KT_STATUSES = [
  'Assigned',
  'Initiated',
  'Reassigned',
  'Received',
  'Pre Closed',
  'Withdrawn',
] as const

export type KtStatus = (typeof KT_STATUSES)[number]

/** Planned hours per weekday, Sunday through Saturday. */
export type WeekPlan = [number, number, number, number, number, number, number]

export const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export interface KtTask {
  id: string
  task: string
  /** Employee handing the knowledge over. */
  provider: string
  providerActive: boolean
  /** Employee receiving the knowledge. */
  receiver: string
  receiverActive: boolean
  department: string
  startDate: string
  endDate: string
  status: KtStatus
  week: WeekPlan
}

export const seedKtTasks: KtTask[] = [
  {
    id: 'kt-101',
    task: 'Payments service runbook & on-call handover',
    provider: 'Rohan Verma',
    providerActive: true,
    receiver: 'Kavya Menon',
    receiverActive: true,
    department: 'Engineering',
    startDate: '2026-06-22',
    endDate: '2026-07-10',
    status: 'Initiated',
    week: [0, 2, 2, 1, 2, 1, 0],
  },
  {
    id: 'kt-102',
    task: 'Quarterly close checklist walkthrough',
    provider: 'Dev Malhotra',
    providerActive: true,
    receiver: 'Rohan Verma',
    receiverActive: true,
    department: 'Finance',
    startDate: '2026-06-15',
    endDate: '2026-07-05',
    status: 'Assigned',
    week: [0, 1, 0, 2, 0, 1, 0],
  },
  {
    id: 'kt-103',
    task: 'Vendor escalation contacts & SLA matrix',
    provider: 'Ritika Bansal',
    providerActive: false,
    receiver: 'Anita Desai',
    receiverActive: true,
    department: 'Human Resources',
    startDate: '2026-04-10',
    endDate: '2026-04-30',
    status: 'Received',
    week: [0, 1, 1, 1, 1, 1, 0],
  },
  {
    id: 'kt-104',
    task: 'CRM pipeline hygiene & renewal playbook',
    provider: 'Meghna Iyer',
    providerActive: true,
    receiver: 'Arjun Rao',
    receiverActive: true,
    department: 'Sales',
    startDate: '2026-06-28',
    endDate: '2026-07-18',
    status: 'Reassigned',
    week: [0, 0, 2, 2, 2, 0, 0],
  },
  {
    id: 'kt-105',
    task: 'Warehouse intake process documentation',
    provider: 'Sara Ali',
    providerActive: true,
    receiver: 'Rohan Verma',
    receiverActive: true,
    department: 'Operations',
    startDate: '2026-07-01',
    endDate: '2026-07-20',
    status: 'Initiated',
    week: [0, 2, 0, 2, 0, 2, 1],
  },
  {
    id: 'kt-106',
    task: 'Laptop imaging & asset tagging procedure',
    provider: 'Peter Novak',
    providerActive: true,
    receiver: 'Sunil Patil',
    receiverActive: true,
    department: 'IT Support',
    startDate: '2026-05-18',
    endDate: '2026-06-05',
    status: 'Pre Closed',
    week: [0, 1, 1, 0, 1, 1, 0],
  },
  {
    id: 'kt-107',
    task: 'Release pipeline secrets rotation guide',
    provider: 'Rohan Verma',
    providerActive: true,
    receiver: 'Harold Kim',
    receiverActive: true,
    department: 'Engineering',
    startDate: '2026-07-06',
    endDate: '2026-07-24',
    status: 'Assigned',
    week: [0, 2, 1, 2, 1, 2, 0],
  },
  {
    id: 'kt-108',
    task: 'Legacy billing reconciliation scripts',
    provider: 'Ishaan Gupta',
    providerActive: false,
    receiver: 'Rohan Verma',
    receiverActive: true,
    department: 'Engineering',
    startDate: '2026-05-02',
    endDate: '2026-05-25',
    status: 'Withdrawn',
    week: [0, 1, 1, 1, 0, 0, 0],
  },
]
