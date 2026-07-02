import { type ApprovalStep } from './shared'

/** Disciplinary actions routed to location-specific approvers. */

export const DISCIPLINARY_ACTION_TYPES = [
  'Verbal Warning',
  'Warning Letter',
  'Show-Cause Notice',
  'Suspension',
] as const

export type DisciplinaryActionType = (typeof DISCIPLINARY_ACTION_TYPES)[number]

export type DisciplinaryStatus =
  | 'pending-approval'
  | 'approved'
  | 'letter-issued'
  | 'rejected'

export interface DisciplinaryCase {
  id: string
  employeeName: string
  employeeCode: string
  department: string
  location: string
  actionType: DisciplinaryActionType
  reason: string
  initiatedBy: string
  initiatedOn: string
  status: DisciplinaryStatus
  approvals: ApprovalStep[]
}

export const seedDisciplinary: DisciplinaryCase[] = [
  {
    id: 'dsc-5001',
    employeeName: 'Nikhil Joshi',
    employeeCode: 'EMP-2333',
    department: 'Engineering',
    location: 'Hyderabad',
    actionType: 'Warning Letter',
    reason: 'Repeated late submissions of timesheets after two reminders.',
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-05',
    status: 'letter-issued',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-06-07',
        note: null,
      },
    ],
  },
  {
    id: 'dsc-5002',
    employeeName: 'Sara Ali',
    employeeCode: 'EMP-2322',
    department: 'Sales',
    location: 'Pune',
    actionType: 'Show-Cause Notice',
    reason: 'Unapproved absence for three consecutive days.',
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-20',
    status: 'pending-approval',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Elena Petrova',
        status: 'pending',
        actedOn: null,
        note: null,
      },
    ],
  },
  {
    id: 'dsc-5003',
    employeeName: 'Harold Kim',
    employeeCode: 'EMP-2385',
    department: 'Engineering',
    location: 'Hyderabad',
    actionType: 'Verbal Warning',
    reason: 'Code of conduct reminder after client call escalation.',
    initiatedBy: 'Vikram Shah',
    initiatedOn: '2026-05-15',
    status: 'approved',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-05-16',
        note: null,
      },
    ],
  },
  {
    id: 'dsc-5004',
    employeeName: 'Tomás Silva',
    employeeCode: 'EMP-2416',
    department: 'IT Support',
    location: 'Pune',
    actionType: 'Warning Letter',
    reason: 'Security policy breach — shared admin credentials.',
    initiatedBy: 'Anita Desai',
    initiatedOn: '2026-06-24',
    status: 'rejected',
    approvals: [
      {
        role: 'Location Approver',
        approver: 'Elena Petrova',
        status: 'rejected',
        actedOn: '2026-06-25',
        note: 'Insufficient evidence; retrain instead.',
      },
    ],
  },
]
