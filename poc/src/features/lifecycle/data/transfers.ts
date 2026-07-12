import { makeSteps, type ApprovalStep } from './shared'

/** Transfers (inter-department / location / company) + bitemporal assignments. */

export const TRANSFER_TYPES = [
  'Inter-Department',
  'Inter-Location',
  'Inter-Company',
] as const

export type TransferType = (typeof TRANSFER_TYPES)[number]

export type TransferStatus =
  | 'pending-approval'
  | 'scheduled'
  | 'effective'
  | 'rejected'

export interface LeaveAdjustment {
  leaveType: string
  before: number
  after: number
  note: string
}

export interface TransferImpact {
  assets: string[]
  leaveAdjustments: LeaveAdjustment[]
  policyDiffs: string[]
}

/**
 * Reference to the NEW company-specific employee record created at the
 * destination for an inter-company transfer. Each company keeps its own
 * record of the same person — one person, two companies, two records.
 */
export interface DestinationRecordRef {
  employeeCode: string
  company: string
  createdOn: string
}

/**
 * Company-specific employee code for the destination record — derived
 * deterministically from the source code so the two records of the same
 * person stay visibly related (e.g. EMP-2401 → US-2401).
 */
export function destinationEmployeeCode(
  sourceCode: string,
  toCompany: string
): string {
  const digits = sourceCode.replace(/\D/g, '') || '0000'
  const prefix = toCompany
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
  return `${prefix}-${digits}`
}

export interface TransferRequest {
  id: string
  employeeName: string
  employeeCode: string
  type: TransferType
  fromDepartment: string
  toDepartment: string
  fromLocation: string
  toLocation: string
  fromCompany: string
  toCompany: string
  effectiveDate: string
  reason: string
  status: TransferStatus
  approvals: ApprovalStep[]
  impact: TransferImpact
  submittedOn: string
  balancesReconciled: boolean
  /**
   * Inter-Company only — the new destination-company employee record
   * reference, created once the transfer is fully approved. Display-level in
   * this POC: the employees directory models the same pattern (one person,
   * one record per company).
   */
  destinationRecord?: DestinationRecordRef | null
}

export const TRANSFER_CHAIN = [
  { role: 'Manager', approver: 'Vikram Shah' },
  { role: 'Department Head', approver: 'Elena Petrova' },
  { role: 'HR', approver: 'Anita Desai' },
]

export const GROUP_STEP = { role: 'Group Admin', approver: 'Farah Qureshi' }

export const seedTransfers: TransferRequest[] = [
  {
    id: 'trf-3001',
    employeeName: 'Arjun Rao',
    employeeCode: 'EMP-2415',
    type: 'Inter-Department',
    fromDepartment: 'Engineering',
    toDepartment: 'IT Support',
    fromLocation: 'Hyderabad',
    toLocation: 'Hyderabad',
    fromCompany: 'Aurora Software India',
    toCompany: 'Aurora Software India',
    effectiveDate: '2026-07-15',
    reason: 'Internal mobility — platform support rotation.',
    status: 'pending-approval',
    approvals: makeSteps(TRANSFER_CHAIN),
    impact: {
      assets: ['Laptop re-tagged to IT Support cost centre'],
      leaveAdjustments: [],
      policyDiffs: [],
    },
    submittedOn: '2026-06-25',
    balancesReconciled: false,
  },
  {
    id: 'trf-3002',
    employeeName: 'Kavya Menon',
    employeeCode: 'EMP-2412',
    type: 'Inter-Location',
    fromDepartment: 'Finance',
    toDepartment: 'Finance',
    fromLocation: 'Bengaluru',
    toLocation: 'Pune',
    fromCompany: 'Aurora Software India',
    toCompany: 'Aurora Software India',
    effectiveDate: '2026-08-01',
    reason: 'Relocation request approved by business.',
    status: 'scheduled',
    approvals: TRANSFER_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-06-20',
      note: null,
    })),
    impact: {
      assets: ['Access card reissue at Pune campus'],
      leaveAdjustments: [
        {
          leaveType: 'Casual Leave',
          before: 6,
          after: 6,
          note: 'No policy change',
        },
      ],
      policyDiffs: ['Pune site follows 2nd/4th Saturday off calendar'],
    },
    submittedOn: '2026-06-12',
    balancesReconciled: false,
  },
  {
    id: 'trf-3003',
    employeeName: 'Grace Obi',
    employeeCode: 'EMP-2401',
    type: 'Inter-Company',
    fromDepartment: 'Human Resources',
    toDepartment: 'Human Resources',
    fromLocation: 'Bengaluru',
    toLocation: 'Austin',
    fromCompany: 'Aurora Software India',
    toCompany: 'Aurora Software US',
    effectiveDate: '2026-08-15',
    reason: 'Group HR consolidation — move to US entity.',
    status: 'pending-approval',
    approvals: [
      {
        role: 'Manager',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-06-26',
        note: null,
      },
      {
        role: 'Department Head',
        approver: 'Elena Petrova',
        status: 'approved',
        actedOn: '2026-06-27',
        note: null,
      },
      {
        role: 'HR',
        approver: 'Anita Desai',
        status: 'approved',
        actedOn: '2026-06-28',
        note: null,
      },
      { ...GROUP_STEP, status: 'pending', actedOn: null, note: null },
    ],
    impact: {
      assets: ['Laptop returned to India pool', 'US laptop to be issued'],
      leaveAdjustments: [
        {
          leaveType: 'Earned Leave',
          before: 14,
          after: 10,
          note: 'US PTO plan — 4 days encashed on transfer',
        },
        {
          leaveType: 'Sick Leave',
          before: 8,
          after: 5,
          note: 'Destination cap is 5 days',
        },
      ],
      policyDiffs: [
        'Destination company uses PTO accrual instead of annual grant',
        'US holiday calendar applies from effective date',
      ],
    },
    submittedOn: '2026-06-18',
    balancesReconciled: false,
  },
  {
    id: 'trf-3004',
    employeeName: 'Sara Ali',
    employeeCode: 'EMP-2322',
    type: 'Inter-Department',
    fromDepartment: 'Operations',
    toDepartment: 'Sales',
    fromLocation: 'Pune',
    toLocation: 'Pune',
    fromCompany: 'Aurora Software India',
    toCompany: 'Aurora Software India',
    effectiveDate: '2026-06-01',
    reason: 'Sales ops requirement.',
    status: 'effective',
    approvals: TRANSFER_CHAIN.map((s) => ({
      ...s,
      status: 'approved' as const,
      actedOn: '2026-05-20',
      note: null,
    })),
    impact: {
      assets: ['CRM license issued'],
      leaveAdjustments: [],
      policyDiffs: [],
    },
    submittedOn: '2026-05-12',
    balancesReconciled: true,
  },
  {
    id: 'trf-3005',
    employeeName: 'Peter Novak',
    employeeCode: 'EMP-2308',
    type: 'Inter-Location',
    fromDepartment: 'IT Support',
    toDepartment: 'IT Support',
    fromLocation: 'Pune',
    toLocation: 'Hyderabad',
    fromCompany: 'Aurora Software India',
    toCompany: 'Aurora Software India',
    effectiveDate: '2026-06-10',
    reason: 'Data centre support coverage.',
    status: 'rejected',
    approvals: [
      {
        role: 'Manager',
        approver: 'Vikram Shah',
        status: 'approved',
        actedOn: '2026-05-30',
        note: null,
      },
      {
        role: 'Department Head',
        approver: 'Elena Petrova',
        status: 'rejected',
        actedOn: '2026-06-02',
        note: 'Coverage gap at origin site.',
      },
      {
        role: 'HR',
        approver: 'Anita Desai',
        status: 'pending',
        actedOn: null,
        note: null,
      },
    ],
    impact: { assets: [], leaveAdjustments: [], policyDiffs: [] },
    submittedOn: '2026-05-28',
    balancesReconciled: false,
  },
]

/** Bitemporal assignment record (ELM-18): valid time + transaction time. */
export interface AssignmentRecord {
  id: string
  employeeName: string
  department: string
  location: string
  company: string
  validFrom: string
  validTo: string | null
  /** System/transaction time the row was written. */
  recordedAt: string
  kind: 'original' | 'transfer' | 'correction'
}

export const seedAssignments: AssignmentRecord[] = [
  {
    id: 'asg-01',
    employeeName: 'Sara Ali',
    department: 'Operations',
    location: 'Pune',
    company: 'Aurora Software India',
    validFrom: '2025-11-10',
    validTo: '2026-05-31',
    recordedAt: '2025-11-10T09:00:00Z',
    kind: 'original',
  },
  {
    id: 'asg-02',
    employeeName: 'Sara Ali',
    department: 'Sales',
    location: 'Pune',
    company: 'Aurora Software India',
    validFrom: '2026-06-01',
    validTo: null,
    recordedAt: '2026-06-01T04:30:00Z',
    kind: 'transfer',
  },
  {
    id: 'asg-03',
    employeeName: 'Kavya Menon',
    department: 'Finance',
    location: 'Bengaluru',
    company: 'Aurora Software India',
    validFrom: '2026-06-15',
    validTo: null,
    recordedAt: '2026-06-15T05:00:00Z',
    kind: 'original',
  },
  {
    id: 'asg-04',
    employeeName: 'Grace Obi',
    department: 'Human Resources',
    location: 'Bengaluru',
    company: 'Aurora Software India',
    validFrom: '2026-05-11',
    validTo: null,
    recordedAt: '2026-05-11T06:10:00Z',
    kind: 'original',
  },
  {
    id: 'asg-05',
    employeeName: 'Arjun Rao',
    department: 'Engineering',
    location: 'Hyderabad',
    company: 'Aurora Software India',
    validFrom: '2026-06-01',
    validTo: null,
    recordedAt: '2026-06-01T03:45:00Z',
    kind: 'original',
  },
]
