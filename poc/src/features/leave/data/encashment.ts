/**
 * Leave encashment (payout) requests — the employee-facing flow behind the
 * payout rules configured in Time Off Management global settings
 * (config-global "Payout" section) and the registry event
 * "Leave encashment requested" (module-registry.ts).
 */

export type EncashmentStatus = 'pending' | 'approved' | 'rejected'

export interface EncashmentRequest {
  id: string
  employeeId: string
  employeeName: string
  typeId: string
  typeName: string
  /** Units to encash, in the leave type's tracking unit. */
  units: number
  unit: 'days' | 'hours'
  reason: string
  status: EncashmentStatus
  requestedOn: string
  decidedBy: string | null
  decidedOn: string | null
  decisionNote: string | null
}

export const seedEncashments: EncashmentRequest[] = [
  {
    id: 'enc-3001',
    employeeId: 'emp-1003',
    employeeName: 'Priya Iyer',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    units: 4,
    unit: 'days',
    reason: 'Excess carry-forward balance — payout per the annual policy.',
    status: 'pending',
    requestedOn: '2026-06-24',
    decidedBy: null,
    decidedOn: null,
    decisionNote: null,
  },
  {
    id: 'enc-3002',
    employeeId: 'emp-1001',
    employeeName: 'Ananya Sharma',
    typeId: 'lt-privileged',
    typeName: 'Privileged / Annual Leave',
    units: 3,
    unit: 'days',
    reason: 'Unused balance above the carry-forward cap.',
    status: 'approved',
    requestedOn: '2026-05-30',
    decidedBy: 'Sunita Patil',
    decidedOn: '2026-06-02',
    decisionNote: 'Within the configured payout limit.',
  },
]
