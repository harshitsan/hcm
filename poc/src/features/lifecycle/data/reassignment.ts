/**
 * Reassignment of an exiting employee's Roles, Direct Reports and Tasks
 * (Exit Management — only the assigned manager can perform it; the newly
 * assigned employees receive an email notification, simulated with toasts).
 */

/** Fixed "today" used across the POC for deterministic dates. */
export const REASSIGNMENT_TODAY = '2026-07-09'

export type ReassignItemType = 'role' | 'report' | 'task'

export interface SubjectRole {
  id: string
  role: string
}

export interface SubjectDirectReport {
  id: string
  name: string
  position: string
}

export interface SubjectTask {
  id: string
  task: string
}

/** An exiting employee whose roles / reports / tasks must be handed over. */
export interface ReassignmentSubject {
  id: string
  name: string
  employeeCode: string
  department: string
  position: string
  location: string
  lastWorkingDay: string
  /** The assigned manager — the only person who can perform reassignment. */
  reportingManager: string
  currentRoles: SubjectRole[]
  directReports: SubjectDirectReport[]
  tasks: SubjectTask[]
}

/** One completed reassignment of a single role / report / task. */
export interface ReassignmentRecord {
  id: string
  subjectId: string
  itemType: ReassignItemType
  itemId: string
  itemLabel: string
  effectiveFrom: string
  toDepartment: string
  toPosition: string
  toEmployee: string
  reassignedOn: string
}

/* ── Department → Position → Employee lookup for the target cascade ──── */

export const REASSIGN_DEPARTMENTS = [
  'Engineering',
  'Operations',
  'Sales',
  'Quality Assurance',
] as const

export const REASSIGN_POSITIONS: Record<string, string[]> = {
  Engineering: [
    'Software Engineer',
    'Senior Software Engineer',
    'Engineering Manager',
  ],
  Operations: ['Operations Lead', 'Operations Manager'],
  Sales: ['Sales Executive', 'Sales Manager'],
  'Quality Assurance': ['QA Engineer', 'QA Lead'],
}

export const REASSIGN_EMPLOYEES: Record<string, string[]> = {
  'Software Engineer': ['Aditya Sharma', 'Sneha Patil', 'Karan Malhotra'],
  'Senior Software Engineer': ['Ritika Bansal', 'Alok Mishra'],
  'Engineering Manager': ['Deepa Raghavan'],
  'Operations Lead': ['Vikram Shetty', 'Lakshmi Menon'],
  'Operations Manager': ['Imran Qureshi'],
  'Sales Executive': ['Sonal Mehta', 'Rahul Khanna'],
  'Sales Manager': ['Gayatri Kamat'],
  'QA Engineer': ['Kavya Reddy', 'Irfan Shaikh'],
  'QA Lead': ['Swati Deshmukh'],
}

/* ── Seeds — two exiting employees ───────────────────────────────────── */

export const seedReassignmentSubjects: ReassignmentSubject[] = [
  {
    id: 'rs-1',
    name: 'Nilesh Kadam',
    employeeCode: 'MLG-0112',
    department: 'Operations',
    position: 'Operations Lead',
    location: 'Pune Plant',
    lastWorkingDay: '2026-09-04',
    reportingManager: 'Deepa Raghavan',
    currentRoles: [
      { id: 'rs-1-role-1', role: 'Warehouse Dispatch Approver' },
      { id: 'rs-1-role-2', role: 'Vendor Gate-pass Authoriser' },
      { id: 'rs-1-role-3', role: 'Shift Roster Owner — Pune Plant' },
    ],
    directReports: [
      { id: 'rs-1-rep-1', name: 'Manoj Tiwari', position: 'Warehouse Supervisor' },
      { id: 'rs-1-rep-2', name: 'Rekha Chauhan', position: 'Warehouse Supervisor' },
      { id: 'rs-1-rep-3', name: 'Dinesh Gowda', position: 'Warehouse Supervisor' },
    ],
    tasks: [
      { id: 'rs-1-task-1', task: 'Close Q3 depot stock reconciliation' },
      { id: 'rs-1-task-2', task: 'Renew forklift maintenance contract' },
      { id: 'rs-1-task-3', task: 'Complete safety audit corrective actions' },
    ],
  },
  {
    id: 'rs-2',
    name: 'Pooja Hegde',
    employeeCode: 'AUR-0264',
    department: 'Engineering',
    position: 'Software Engineer',
    location: 'Bengaluru HQ',
    lastWorkingDay: '2026-08-21',
    reportingManager: 'Rohit Menon',
    currentRoles: [
      { id: 'rs-2-role-1', role: 'Payments Service Code Owner' },
      { id: 'rs-2-role-2', role: 'On-call Rotation Lead — Checkout' },
    ],
    directReports: [
      { id: 'rs-2-rep-1', name: 'Karan Malhotra', position: 'Software Engineer' },
      { id: 'rs-2-rep-2', name: 'Sneha Patil', position: 'Software Engineer' },
    ],
    tasks: [
      { id: 'rs-2-task-1', task: 'Finish UPI mandate integration (phase 2)' },
      { id: 'rs-2-task-2', task: 'Document checkout-service runbook' },
      { id: 'rs-2-task-3', task: 'Hand over pending code reviews' },
    ],
  },
]

/** One role of subject 1 has already been handed over. */
export const seedReassignmentRecords: ReassignmentRecord[] = [
  {
    id: 'rr-1',
    subjectId: 'rs-1',
    itemType: 'role',
    itemId: 'rs-1-role-1',
    itemLabel: 'Warehouse Dispatch Approver',
    effectiveFrom: '2026-07-15',
    toDepartment: 'Operations',
    toPosition: 'Operations Lead',
    toEmployee: 'Vikram Shetty',
    reassignedOn: '2026-07-05',
  },
]

export const ITEM_TYPE_LABELS: Record<ReassignItemType, string> = {
  role: 'Role',
  report: 'Direct report',
  task: 'Task',
}
