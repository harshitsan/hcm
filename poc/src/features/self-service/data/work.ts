/** Day-wise project allocation entries (ESS-37). */
export interface AllocationEntry {
  id: string
  date: string
  projectCode: string
  project: string
  hours: number
}

export const seedAllocations: AllocationEntry[] = [
  { id: 'al-01', date: '2026-06-26', projectCode: 'ACM-101', project: 'Acme storefront revamp', hours: 6 },
  { id: 'al-02', date: '2026-06-26', projectCode: 'INT-042', project: 'Internal platform tooling', hours: 2 },
  { id: 'al-03', date: '2026-06-25', projectCode: 'ACM-101', project: 'Acme storefront revamp', hours: 7 },
  { id: 'al-04', date: '2026-06-25', projectCode: 'NWB-207', project: 'Northwind core banking', hours: 1.5 },
  { id: 'al-05', date: '2026-06-24', projectCode: 'ACM-101', project: 'Acme storefront revamp', hours: 5 },
  { id: 'al-06', date: '2026-06-24', projectCode: 'INT-042', project: 'Internal platform tooling', hours: 3 },
  { id: 'al-07', date: '2026-06-23', projectCode: 'ACM-101', project: 'Acme storefront revamp', hours: 8 },
  { id: 'al-08', date: '2026-06-22', projectCode: 'NWB-207', project: 'Northwind core banking', hours: 4 },
  { id: 'al-09', date: '2026-06-22', projectCode: 'ACM-101', project: 'Acme storefront revamp', hours: 4 },
  { id: 'al-10', date: '2026-06-19', projectCode: 'INT-042', project: 'Internal platform tooling', hours: 8 },
]

export const KT_STATUSES = [
  'Assigned',
  'Initiated',
  'Reassigned',
  'Received',
  'Pre closed',
  'Withdrawn',
] as const
export type KtStatus = (typeof KT_STATUSES)[number]

export type KtDirection = 'provide' | 'receive'

/** Knowledge-transfer obligations (ESS-38). */
export interface KtTask {
  id: string
  direction: KtDirection
  provider: string
  receiver: string
  assigner: string
  project: string
  department: string
  startDate: string
  dueDate: string
  status: KtStatus
}

export const seedKtTasks: KtTask[] = [
  { id: 'kt-01', direction: 'provide', provider: 'Anika Sharma', receiver: 'Dev Patel', assigner: 'Vikram Mehta', project: 'Acme storefront revamp', department: 'Product Engineering', startDate: '2026-06-20', dueDate: '2026-07-04', status: 'Initiated' },
  { id: 'kt-02', direction: 'provide', provider: 'Anika Sharma', receiver: 'Meera Iyer', assigner: 'Vikram Mehta', project: 'Internal platform tooling', department: 'Product Engineering', startDate: '2026-07-01', dueDate: '2026-07-15', status: 'Assigned' },
  { id: 'kt-03', direction: 'provide', provider: 'Anika Sharma', receiver: 'Arjun Rao', assigner: 'PMO', project: 'Northwind core banking', department: 'Delivery', startDate: '2026-05-10', dueDate: '2026-05-24', status: 'Received' },
  { id: 'kt-04', direction: 'receive', provider: 'Sanjay Kulkarni', receiver: 'Anika Sharma', assigner: 'Vikram Mehta', project: 'Northwind core banking', department: 'Delivery', startDate: '2026-06-24', dueDate: '2026-07-08', status: 'Initiated' },
  { id: 'kt-05', direction: 'receive', provider: 'Meera Iyer', receiver: 'Anika Sharma', assigner: 'PMO', project: 'Payments gateway v2', department: 'Product Engineering', startDate: '2026-05-02', dueDate: '2026-05-16', status: 'Received' },
  { id: 'kt-06', direction: 'receive', provider: 'Farhan Ali', receiver: 'Anika Sharma', assigner: 'PMO', project: 'Legacy CRM sunset', department: 'Delivery', startDate: '2026-04-01', dueDate: '2026-04-20', status: 'Withdrawn' },
]
