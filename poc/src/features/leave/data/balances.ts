/**
 * Leave balances per employee/type (LVE-14, LVE-34), comp-off credits
 * (LVE-16) and time-off balance adjustments (LVE-42/43).
 */

export interface LeaveBalance {
  employeeId: string
  typeId: string
  /** Credited entitlement for the year in the type's tracking unit. */
  credited: number
  taken: number
  tentative: number
  scheduled: number
  pendingApproval: number
  lopPending: number
  lopApproved: number
  cancelled: number
}

export function remaining(b: LeaveBalance) {
  return b.credited - b.taken - b.scheduled - b.pendingApproval
}

function bal(
  employeeId: string,
  typeId: string,
  credited: number,
  patch: Partial<LeaveBalance> = {}
): LeaveBalance {
  return {
    employeeId,
    typeId,
    credited,
    taken: 0,
    tentative: 0,
    scheduled: 0,
    pendingApproval: 0,
    lopPending: 0,
    lopApproved: 0,
    cancelled: 0,
    ...patch,
  }
}

export const seedBalances: LeaveBalance[] = [
  // Ananya Sharma (current employee persona)
  bal('emp-1001', 'lt-privileged', 18, { taken: 3, pendingApproval: 5 }),
  bal('emp-1001', 'lt-casual', 8, { taken: 2 }),
  bal('emp-1001', 'lt-sick', 96, { taken: 8 }),
  bal('emp-1001', 'lt-compoff', 2, { scheduled: 1 }),
  bal('emp-1001', 'lt-bereavement', 5),
  // Priya Iyer
  bal('emp-1003', 'lt-privileged', 18, { taken: 5, cancelled: 5 }),
  bal('emp-1003', 'lt-casual', 8, { taken: 1 }),
  bal('emp-1003', 'lt-sick', 96, { taken: 12, pendingApproval: 4 }),
  // Vikram Rao
  bal('emp-1004', 'lt-privileged', 18, { taken: 6 }),
  bal('emp-1004', 'lt-casual', 8, {
    taken: 5,
    pendingApproval: 3,
    lopPending: 2,
  }),
  bal('emp-1004', 'lt-sick', 96, { taken: 24 }),
  // Meera Krishnan (probationary — pro-rated)
  bal('emp-1005', 'lt-privileged', 9, { tentative: 5 }),
  bal('emp-1005', 'lt-casual', 4, { taken: 1 }),
  bal('emp-1005', 'lt-sick', 48),
  // Jordan Blake
  bal('emp-1006', 'lt-privileged', 15, { taken: 4 }),
  bal('emp-1006', 'lt-sick', 96, { taken: 10 }),
  bal('emp-1006', 'lt-fmla', 480, { pendingApproval: 120 }),
  // Sunita Patil
  bal('emp-1007', 'lt-privileged', 18, { taken: 2, pendingApproval: 5 }),
  bal('emp-1007', 'lt-casual', 8, { taken: 3 }),
  // Ravi Naik (non-user)
  bal('emp-1008', 'lt-privileged', 15, { taken: 4 }),
  bal('emp-1008', 'lt-casual', 8, { taken: 2 }),
  bal('emp-1008', 'lt-sick', 96, { taken: 16 }),
  // Lakshmi Devi (non-user, contract)
  bal('emp-1009', 'lt-casual', 6, { taken: 2 }),
  // Deepak Kulkarni (inactive — exited 2026-05; shown only when the
  // include-inactive toggle is on, ETOS-05)
  bal('emp-1011', 'lt-privileged', 18, { taken: 11 }),
  bal('emp-1011', 'lt-casual', 8, { taken: 6 }),
  bal('emp-1011', 'lt-sick', 96, { taken: 32 }),
]

export interface CompOffCredit {
  id: string
  employeeId: string
  employeeName: string
  source: string
  earnedOn: string
  expiresOn: string
  status: 'available' | 'used' | 'lapsed'
}

export const seedCompOffCredits: CompOffCredit[] = [
  {
    id: 'co-1',
    employeeId: 'emp-1001',
    employeeName: 'Ananya Sharma',
    source: 'Production incident on-call (Sat 2026-05-09)',
    earnedOn: '2026-05-11',
    expiresOn: '2026-08-09',
    status: 'available',
  },
  {
    id: 'co-2',
    employeeId: 'emp-1001',
    employeeName: 'Ananya Sharma',
    source: 'Quarter-end deployment (Sun 2026-03-29)',
    earnedOn: '2026-03-30',
    expiresOn: '2026-06-28',
    status: 'lapsed',
  },
  {
    id: 'co-3',
    employeeId: 'emp-1001',
    employeeName: 'Ananya Sharma',
    source: 'July release weekend on-call (Sat 2026-06-13)',
    earnedOn: '2026-06-14',
    expiresOn: '2026-09-12',
    status: 'used',
  },
  {
    id: 'co-4',
    employeeId: 'emp-1003',
    employeeName: 'Priya Iyer',
    source: 'Data migration support (Sun 2026-06-07)',
    earnedOn: '2026-06-08',
    expiresOn: '2026-09-06',
    status: 'available',
  },
]

/**
 * Date-of-join reference per employee (Adjust Time Off pointer 3 / bulk
 * pending adjustments pointer 4). Kept here because the shared roster does
 * not carry joining dates.
 */
export const EMPLOYEE_JOIN_DATES: Record<string, string> = {
  'emp-1001': '2019-04-15',
  'emp-1002': '2015-08-01',
  'emp-1003': '2021-02-08',
  'emp-1004': '2023-07-17',
  'emp-1005': '2026-01-12',
  'emp-1006': '2020-10-05',
  'emp-1007': '2018-03-26',
  'emp-1008': '2022-06-20',
  'emp-1009': '2024-09-02',
  'emp-1010': '2020-01-06',
  'emp-1011': '2019-11-11',
}

export function dateOfJoinFor(employeeId: string) {
  return EMPLOYEE_JOIN_DATES[employeeId] ?? '2020-01-01'
}

export interface Adjustment {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  department: string
  employeeClass: string
  typeId: string
  typeName: string
  /** Signed adjustment in the type's tracking unit. */
  delta: number
  currentBalance: number
  reason: string
  requestedBy: string
  status: 'pending' | 'approved' | 'rejected'
  /** Adjust Time Off pointer 3: DOJ of the selected employee. */
  dateOfJoin: string
  /** Pointer 5: mail the employee once the adjustment is approved. */
  sendMailToEmployee: boolean
  /** Pointer 6: time offs already added (this type) in the current year. */
  addedThisYear: number
  /** Pointer 10: total added for the year including this adjustment. */
  totalForYear: number
  /** Pointer 11: uploaded document names. */
  documents: string[]
  /** Pointer 12: coordinator comments. */
  comments: string
  /** Set when approved — the approver who applied the credit. */
  approvedBy?: string | null
}

export const seedAdjustments: Adjustment[] = [
  {
    id: 'adj-1',
    employeeId: 'emp-1004',
    employeeName: 'Vikram Rao',
    employeeCode: 'STI-0250',
    department: 'Engineering',
    employeeClass: 'Regular',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    delta: 2,
    currentBalance: 12,
    reason: 'Attendance regularization — badge system outage on 2026-05-04/05.',
    requestedBy: 'Ananya Sharma',
    status: 'pending',
    dateOfJoin: '2023-07-17',
    sendMailToEmployee: true,
    addedThisYear: 18,
    totalForYear: 20,
    documents: ['badge-outage-incident-report.pdf'],
    comments: 'Facilities confirmed the badge readers were down both days.',
    approvedBy: null,
  },
  {
    id: 'adj-2',
    employeeId: 'emp-1003',
    employeeName: 'Priya Iyer',
    employeeCode: 'STI-0233',
    department: 'Engineering',
    employeeClass: 'Regular',
    typeId: 'lt-sick',
    typeName: 'Sick / Medical Leave',
    delta: -8,
    currentBalance: 80,
    reason: 'Duplicate sick entry credited during payroll migration.',
    requestedBy: 'Sunita Patil',
    status: 'approved',
    dateOfJoin: '2021-02-08',
    sendMailToEmployee: false,
    addedThisYear: 96,
    totalForYear: 88,
    documents: ['payroll-migration-audit.xlsx'],
    comments: 'Reversal of the duplicate credit found in the migration audit.',
    approvedBy: 'Rahul Menon',
  },
]
