/**
 * Team view of Time Management (More → Time Management → Team Functions):
 * the Timesheet Utilization Summary a manager reviews per period.
 */
import type { TeamDepartment, EmployeeState } from './travel-team'

export const UTILIZATION_STATUSES = [
  'Pending for submission',
  'Submitted',
  'Approved',
  'Rejected',
] as const
export type UtilizationStatus = (typeof UTILIZATION_STATUSES)[number]

/** One employee-week row of the Timesheet Utilization Summary. */
export interface UtilizationRow {
  id: string
  employee: string
  department: TeamDepartment
  employeeState: EmployeeState
  periodStart: string
  periodEnd: string
  /** Hours planned via allocation for the week. */
  allocatedHours: number
  /** Hours logged on the submitted timesheet. */
  submittedHours: number
  productiveHours: number
  nonProductiveHours: number
  status: UtilizationStatus
}

/** Utilization % = productive hours over allocated hours. */
export function utilizationPct(row: UtilizationRow): number {
  if (row.allocatedHours === 0) return 0
  return Math.round((row.productiveHours / row.allocatedHours) * 100)
}

export const seedUtilizationRows: UtilizationRow[] = [
  { id: 'ut-01', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', periodStart: '2026-07-06', periodEnd: '2026-07-12', allocatedHours: 45, submittedHours: 44.5, productiveHours: 39, nonProductiveHours: 5.5, status: 'Submitted' },
  { id: 'ut-02', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', periodStart: '2026-07-06', periodEnd: '2026-07-12', allocatedHours: 45, submittedHours: 46, productiveHours: 41.5, nonProductiveHours: 4.5, status: 'Submitted' },
  { id: 'ut-03', employee: 'Farhan Ali', department: 'Engineering', employeeState: 'Active', periodStart: '2026-07-06', periodEnd: '2026-07-12', allocatedHours: 45, submittedHours: 0, productiveHours: 0, nonProductiveHours: 0, status: 'Pending for submission' },
  { id: 'ut-04', employee: 'Meera Nair', department: 'Sales', employeeState: 'Active', periodStart: '2026-07-06', periodEnd: '2026-07-12', allocatedHours: 40, submittedHours: 38, productiveHours: 33, nonProductiveHours: 5, status: 'Submitted' },
  { id: 'ut-05', employee: 'Arjun Patel', department: 'Engineering', employeeState: 'Active', periodStart: '2026-06-29', periodEnd: '2026-07-05', allocatedHours: 45, submittedHours: 45, productiveHours: 42, nonProductiveHours: 3, status: 'Approved' },
  { id: 'ut-06', employee: 'Ravi Kumar', department: 'Engineering', employeeState: 'Active', periodStart: '2026-06-29', periodEnd: '2026-07-05', allocatedHours: 45, submittedHours: 44, productiveHours: 38.5, nonProductiveHours: 5.5, status: 'Approved' },
  { id: 'ut-07', employee: 'Deepa Menon', department: 'Finance', employeeState: 'Inactive', periodStart: '2026-06-29', periodEnd: '2026-07-05', allocatedHours: 40, submittedHours: 31, productiveHours: 26, nonProductiveHours: 5, status: 'Rejected' },
  { id: 'ut-08', employee: 'Sneha Iyer', department: 'Delivery', employeeState: 'Active', periodStart: '2026-06-29', periodEnd: '2026-07-05', allocatedHours: 45, submittedHours: 45.5, productiveHours: 40, nonProductiveHours: 5.5, status: 'Approved' },
]
