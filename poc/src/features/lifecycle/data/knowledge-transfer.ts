/**
 * Knowledge Transfer — handover tasks raised when an employee exits or moves,
 * tracked from assignment through receipt with a day-wise weekly plan.
 */

export const KT_STATUSES = [
  'Assigned',
  'Initiated',
  'Pending for Receive',
  'Reassigned',
  'Received',
  'Pre Closed',
  'Withdrawn',
] as const

export type KtStatus = (typeof KT_STATUSES)[number]

/** Fixed reference "today" used across the POC for overdue calculations. */
export const KT_TODAY = '2026-07-09'

/** Exit types the KT-while-exit process can be scoped to. */
export const KT_EXIT_TYPES = [
  'Resignation',
  'Termination',
  'Retirement',
  'Medical Reasons',
  'Absconding',
] as const

/** Actors who may be allowed to assign KT tasks. */
export const KT_ASSIGNERS = [
  'Admin',
  'Reporting Manager',
  'Exit Coordinator',
] as const

export const KT_NOTIFICATION_FREQUENCIES = ['Daily', 'Weekly', 'Once'] as const

export type KtNotificationFrequency =
  (typeof KT_NOTIFICATION_FREQUENCIES)[number]

/** One line of the per-task action history (who did what, when). */
export interface KtActionEntry {
  actor: string
  action: string
  date: string
  comment: string | null
}

/** Read-only exit details pre-populated on an exit KT task. */
export interface KtExitContext {
  employee: string
  exitType: string
  dateOfJoining: string
  exitInitiatedDate: string
  tentativeLwd: string
}

/** Leave entry surfaced beside the KT task form for planning. */
export interface KtLeaveEntry {
  employee: string
  from: string
  to: string
  type: string
  status: 'Approved' | 'Pending'
}

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
  /** Due date for the handover (labelled "Due date" in the KT forms). */
  endDate: string
  status: KtStatus
  week: WeekPlan
  // ---- Optional detail fields (Kensium KT spec) ----
  description?: string
  project?: string
  /** Document attached while assigning the task. */
  documentName?: string | null
  notificationRequired?: boolean
  notifyBeforeDays?: number
  peopleToNotify?: string[]
  notificationFrequency?: KtNotificationFrequency
  comments?: string
  /** KT material uploaded by the provider on initiation. */
  ktMaterial?: string | null
  /** Exit KT variant — read-only exit details shown on the task. */
  isExit?: boolean
  exitType?: string
  dateOfJoining?: string
  exitInitiatedDate?: string
  tentativeLwd?: string
  /** Chronological action history (assignment → initiation → receipt). */
  history?: KtActionEntry[]
}

/** Employee directory used by the KT provider / receiver pickers. */
export const KT_EMPLOYEES = [
  'Rohan Verma',
  'Kavya Menon',
  'Dev Malhotra',
  'Anita Desai',
  'Meghna Iyer',
  'Arjun Rao',
  'Sara Ali',
  'Peter Novak',
  'Sunil Patil',
  'Harold Kim',
  'Vikram Shah',
  'Tomás Silva',
] as const

/** Exiting employees for whom an Exit KT task can be raised. */
export const KT_EXIT_CONTEXTS: KtExitContext[] = [
  {
    employee: 'Dev Malhotra',
    exitType: 'Resignation',
    dateOfJoining: '2021-03-15',
    exitInitiatedDate: '2026-06-10',
    tentativeLwd: '2026-08-09',
  },
  {
    employee: 'Peter Novak',
    exitType: 'Retirement',
    dateOfJoining: '2010-01-05',
    exitInitiatedDate: '2026-05-01',
    tentativeLwd: '2026-07-31',
  },
]

/** Plausible leave calendar around the reference "today" (2026-07-09). */
export const seedKtLeaves: KtLeaveEntry[] = [
  { employee: 'Rohan Verma', from: '2026-07-13', to: '2026-07-14', type: 'Casual Leave', status: 'Approved' },
  { employee: 'Kavya Menon', from: '2026-07-10', to: '2026-07-11', type: 'Sick Leave', status: 'Approved' },
  { employee: 'Dev Malhotra', from: '2026-07-16', to: '2026-07-17', type: 'Earned Leave', status: 'Pending' },
  { employee: 'Harold Kim', from: '2026-07-20', to: '2026-07-24', type: 'Earned Leave', status: 'Approved' },
  { employee: 'Sunil Patil', from: '2026-07-08', to: '2026-07-09', type: 'Casual Leave', status: 'Approved' },
  { employee: 'Meghna Iyer', from: '2026-07-15', to: '2026-07-15', type: 'Casual Leave', status: 'Approved' },
]

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
    description:
      'Walk through the payments service runbook, alert playbooks and the weekly on-call rotation.',
    project: 'Payments Platform',
    documentName: 'payments-runbook.pdf',
    notificationRequired: true,
    notifyBeforeDays: 3,
    peopleToNotify: ['Anita Desai', 'Vikram Shah'],
    notificationFrequency: 'Daily',
    comments: 'Prioritise the incident escalation matrix first.',
    ktMaterial: null,
    isExit: false,
    history: [
      { actor: 'Anita Desai', action: 'Assigned', date: '2026-06-20', comment: 'Assigned ahead of on-call rotation change.' },
      { actor: 'Rohan Verma', action: 'Initiated', date: '2026-06-24', comment: 'First two sessions scheduled.' },
    ],
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
    description:
      'Hand over the quarterly close checklist, journal templates and sign-off tracker.',
    project: 'Finance Operations',
    notificationRequired: true,
    notifyBeforeDays: 5,
    peopleToNotify: ['Anita Desai'],
    notificationFrequency: 'Weekly',
    isExit: true,
    exitType: 'Resignation',
    dateOfJoining: '2021-03-15',
    exitInitiatedDate: '2026-06-10',
    tentativeLwd: '2026-08-09',
    history: [
      { actor: 'Anita Desai', action: 'Assigned', date: '2026-06-14', comment: 'Raised from the exit list for Dev Malhotra.' },
    ],
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
    description: 'Vendor escalation contacts, renewal calendar and SLA matrix.',
    project: 'HR Vendor Management',
    ktMaterial: 'vendor-sla-matrix.xlsx',
    comments: 'Handover completed before last working day.',
    isExit: false,
    history: [
      { actor: 'Anita Desai', action: 'Assigned', date: '2026-04-08', comment: null },
      { actor: 'Ritika Bansal', action: 'Initiated', date: '2026-04-12', comment: 'KT material uploaded.' },
      { actor: 'Anita Desai', action: 'Received', date: '2026-04-29', comment: 'All escalation contacts verified.' },
    ],
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
    description: 'Secrets rotation runbook for the release pipeline, including vault policies.',
    project: 'DevOps Tooling',
    notificationRequired: true,
    notifyBeforeDays: 2,
    peopleToNotify: ['Vikram Shah'],
    notificationFrequency: 'Once',
    isExit: false,
    history: [
      { actor: 'Anita Desai', action: 'Assigned', date: '2026-07-03', comment: null },
    ],
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
  {
    id: 'kt-109',
    task: 'AP reconciliation & vendor payment approvals',
    provider: 'Dev Malhotra',
    providerActive: true,
    receiver: 'Rohan Verma',
    receiverActive: true,
    department: 'Finance',
    startDate: '2026-06-20',
    endDate: '2026-07-08',
    status: 'Pending for Receive',
    week: [0, 1, 1, 1, 1, 0, 0],
    description:
      'Accounts payable reconciliation workflow and the vendor payment approval chain.',
    project: 'Finance Operations',
    documentName: 'ap-process-notes.docx',
    notificationRequired: true,
    notifyBeforeDays: 3,
    peopleToNotify: ['Anita Desai', 'Vikram Shah'],
    notificationFrequency: 'Daily',
    ktMaterial: 'ap-reconciliation-handbook.xlsx',
    comments: 'Must complete well before the tentative LWD.',
    isExit: true,
    exitType: 'Resignation',
    dateOfJoining: '2021-03-15',
    exitInitiatedDate: '2026-06-10',
    tentativeLwd: '2026-08-09',
    history: [
      { actor: 'Anita Desai', action: 'Assigned', date: '2026-06-18', comment: 'Exit KT raised by the exit coordinator.' },
      { actor: 'Dev Malhotra', action: 'Initiated', date: '2026-06-25', comment: 'Sessions booked; handbook uploaded.' },
      { actor: 'Dev Malhotra', action: 'KT material uploaded', date: '2026-06-25', comment: 'ap-reconciliation-handbook.xlsx' },
    ],
  },
  {
    id: 'kt-110',
    task: 'Data-centre access & vendor contract handover',
    provider: 'Peter Novak',
    providerActive: true,
    receiver: 'Sunil Patil',
    receiverActive: true,
    department: 'IT Support',
    startDate: '2026-07-06',
    endDate: '2026-07-20',
    status: 'Assigned',
    week: [0, 1, 0, 1, 0, 1, 0],
    description:
      'Badge access procedures, DC vendor contracts and the renewal calendar ahead of retirement.',
    project: 'IT Infrastructure',
    notificationRequired: true,
    notifyBeforeDays: 5,
    peopleToNotify: ['Anita Desai'],
    notificationFrequency: 'Weekly',
    isExit: true,
    exitType: 'Retirement',
    dateOfJoining: '2010-01-05',
    exitInitiatedDate: '2026-05-01',
    tentativeLwd: '2026-07-31',
    history: [
      { actor: 'Anita Desai', action: 'Assigned', date: '2026-07-05', comment: 'Retirement handover kick-off.' },
    ],
  },
]
