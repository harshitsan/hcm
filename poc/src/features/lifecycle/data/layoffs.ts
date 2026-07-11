import { makeSteps, type ApprovalStep } from './shared'

/**
 * Layoff management — bulk initiation batches routed through the location
 * approvers seeded in Configuration → Exit (Layoff exit type). A batch cannot
 * be initiated when the remaining headcount at the location would fall below
 * the configured minimum employees.
 */

export type LayoffStatus =
  | 'pending-approval'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'exited'

export interface LayoffEmployee {
  name: string
  code: string
  department: string
  positionLevel: string
  location: string
}

export interface LayoffBatch {
  id: string
  /** Batch label, e.g. "Austin Sales restructuring — Wave 1". */
  name: string
  location: string
  initiatedOn: string
  initiatedBy: string
  reason: string
  employees: LayoffEmployee[]
  status: LayoffStatus
  /** Location approver (seeded per location in config) → HR. */
  approvals: ApprovalStep[]
}

/** Active headcount per location used by the min-employee guard. */
export const LOCATION_HEADCOUNT: Record<string, number> = {
  Hyderabad: 18,
  Bengaluru: 20,
  Pune: 9,
  Austin: 12,
}

/** Mock employee pool selectable for layoff initiation. */
export const LAYOFF_EMPLOYEE_POOL: LayoffEmployee[] = [
  { name: 'Rohan Verma', code: 'EMP-2411', department: 'Engineering', positionLevel: 'L1 - Associate', location: 'Hyderabad' },
  { name: 'Imran Khan', code: 'EMP-2255', department: 'Operations', positionLevel: 'L1 - Associate', location: 'Hyderabad' },
  { name: 'Sana Sheikh', code: 'EMP-2260', department: 'IT Support', positionLevel: 'L1 - Associate', location: 'Hyderabad' },
  { name: 'Manoj Pillai', code: 'EMP-2264', department: 'Operations', positionLevel: 'L2 - Senior', location: 'Hyderabad' },
  { name: 'Deepa Reddy', code: 'EMP-2271', department: 'Engineering', positionLevel: 'L2 - Senior', location: 'Hyderabad' },
  { name: 'Kiran Kumar', code: 'EMP-2279', department: 'Sales', positionLevel: 'L1 - Associate', location: 'Hyderabad' },
  { name: 'Priya Nair', code: 'EMP-2288', department: 'Engineering', positionLevel: 'L2 - Senior', location: 'Bengaluru' },
  { name: 'Leah Fernandes', code: 'EMP-2178', department: 'Human Resources', positionLevel: 'L3 - Lead', location: 'Bengaluru' },
  { name: 'Dev Malhotra', code: 'EMP-2350', department: 'Finance', positionLevel: 'L1 - Associate', location: 'Bengaluru' },
  { name: 'Ananya Bose', code: 'EMP-2361', department: 'Finance', positionLevel: 'L2 - Senior', location: 'Bengaluru' },
  { name: 'Sneha Kulkarni', code: 'EMP-2199', department: 'Finance', positionLevel: 'L2 - Senior', location: 'Pune' },
  { name: 'Sunil Patil', code: 'EMP-2413', department: 'Operations', positionLevel: 'L1 - Associate', location: 'Pune' },
  { name: 'Arjun Rao', code: 'EMP-2302', department: 'Sales', positionLevel: 'L3 - Lead', location: 'Austin' },
  { name: 'Lena Fischer', code: 'EMP-2414', department: 'Sales', positionLevel: 'L2 - Senior', location: 'Austin' },
  { name: 'Nadia Rahman', code: 'EMP-2417', department: 'Finance', positionLevel: 'L1 - Associate', location: 'Austin' },
  { name: 'Mark Jensen', code: 'EMP-2420', department: 'Sales', positionLevel: 'L1 - Associate', location: 'Austin' },
]

/** Fallback approver when a location has no seeded layoff approver. */
export const LAYOFF_FALLBACK_APPROVER = 'Farah Qureshi'

/** HR step appended after the location approver on every layoff batch. */
export const LAYOFF_HR_APPROVER = 'Anita Desai'

export const seedLayoffs: LayoffBatch[] = [
  {
    id: 'lay-3001',
    name: 'Austin Sales restructuring — Wave 1',
    location: 'Austin',
    initiatedOn: '2026-05-20',
    initiatedBy: 'Anita Desai',
    reason: 'Territory consolidation after the Q1 portfolio review.',
    employees: [
      { name: 'Owen Brooks', code: 'EMP-2405', department: 'Sales', positionLevel: 'L1 - Associate', location: 'Austin' },
      { name: 'Tara Whitman', code: 'EMP-2407', department: 'Sales', positionLevel: 'L2 - Senior', location: 'Austin' },
    ],
    status: 'exited',
    approvals: [
      { role: 'Location Approver', approver: 'Elena Petrova', status: 'approved', actedOn: '2026-05-23', note: null },
      { role: 'HR', approver: LAYOFF_HR_APPROVER, status: 'approved', actedOn: '2026-05-24', note: null },
    ],
  },
  {
    id: 'lay-3002',
    name: 'Hyderabad support consolidation',
    location: 'Hyderabad',
    initiatedOn: '2026-07-01',
    initiatedBy: 'Anita Desai',
    reason: 'Shift-left support model reduces the L1 support bench.',
    employees: [
      { name: 'Sana Sheikh', code: 'EMP-2260', department: 'IT Support', positionLevel: 'L1 - Associate', location: 'Hyderabad' },
      { name: 'Manoj Pillai', code: 'EMP-2264', department: 'Operations', positionLevel: 'L2 - Senior', location: 'Hyderabad' },
      { name: 'Kiran Kumar', code: 'EMP-2279', department: 'Sales', positionLevel: 'L1 - Associate', location: 'Hyderabad' },
    ],
    status: 'pending-approval',
    approvals: makeSteps([
      { role: 'Location Approver', approver: 'Farah Qureshi' },
      { role: 'HR', approver: LAYOFF_HR_APPROVER },
    ]),
  },
]
