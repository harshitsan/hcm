/**
 * Time Off Management global settings (the 20-pointer Configuration →
 * Time Off Management screen) and Time Off Admin role assignments
 * (Configuration → Organization → Role).
 *
 * Reference "today" across the POC is 2026-07-09.
 */

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/**
 * Organization-level Time Off Management settings — policy applicability,
 * calculation/credit periods, approval thresholds, payout rules, payroll
 * reminders and notification rules (pointers 1–20).
 */
export interface TimeOffGlobalSettings {
  /** 1: location based time off policies supported. */
  supportLocationBasedPolicies: boolean
  /** 2: department based time off policies supported. */
  supportDepartmentBasedPolicies: boolean
  /** 3: position based time off policies supported. */
  supportPositionBasedPolicies: boolean
  /** 4: month the time-off calculation cycle starts from. */
  calculationStartMonth: string
  /** 5: day of the month on which time-off credits occur (1–28). */
  creditDayOfMonth: number
  /** 6: cap on total time-off days allotted per employee per year. */
  maxTimeOffDaysPerYear: number
  /** 7: max days an immediate supervisor may approve before escalation. */
  maxSupervisorApprovableDays: number
  /** 8: leaves longer than this require handing over roles/responsibilities. */
  handoverThresholdDays: number
  /** 9: day of month after which time offs require additional approval. */
  payrollCutoffDay: number
  /** 10: organization supports time-off payout. */
  payoutEnabled: boolean
  /** 11: employees may raise payout requests themselves. */
  allowEmployeePayoutRequest: boolean
  /** 12: force payout of excess time offs. */
  forcePayoutExcess: boolean
  /** 13: month during which the forced payout process is initiated. */
  forcePayoutMonth: string
  /** 14: first reminder to managers, days before the payroll period. */
  firstReminderDaysBeforePayroll: number
  /** 15: second reminder to managers, days before the payroll period. */
  secondReminderDaysBeforePayroll: number
  /** 16: notifications for time-off applications supported. */
  notificationsEnabled: boolean
  /** 17: notify peers as soon as an application is approved. */
  notifyPeersOnApproval: boolean
  /** 18: notify peers this many days before the approved leave starts. */
  notifyPeersBeforeLeaveDays: number
  /** 19: notify approver(s)/admin this many days before the leave. */
  notifyApproversBeforeDays: number
  /** 20: notify the employee as soon as time offs are credited. */
  notifyOnCredit: boolean
}

export const seedGlobalSettings: TimeOffGlobalSettings = {
  supportLocationBasedPolicies: true,
  supportDepartmentBasedPolicies: true,
  supportPositionBasedPolicies: false,
  calculationStartMonth: 'April',
  creditDayOfMonth: 1,
  maxTimeOffDaysPerYear: 36,
  maxSupervisorApprovableDays: 5,
  handoverThresholdDays: 10,
  payrollCutoffDay: 25,
  payoutEnabled: true,
  allowEmployeePayoutRequest: true,
  forcePayoutExcess: true,
  forcePayoutMonth: 'March',
  firstReminderDaysBeforePayroll: 5,
  secondReminderDaysBeforePayroll: 2,
  notificationsEnabled: true,
  notifyPeersOnApproval: true,
  notifyPeersBeforeLeaveDays: 3,
  notifyApproversBeforeDays: 3,
  notifyOnCredit: true,
}

export const ROLE_TYPES = [
  'Time Off Admin',
  'Time Off Coordinator',
  'HR Admin',
] as const

/**
 * A role assignment created on the Configuration → Organization → Role
 * screen: which employee holds a time-off role and for which
 * locations/departments/positions the role applies.
 */
export interface TimeOffAdminAssignment {
  id: string
  roleName: string
  roleType: (typeof ROLE_TYPES)[number]
  description: string
  applicableLocations: string[]
  applicableDepartments: string[]
  applicablePositions: string[]
  /** Employee to whom the role is assigned. */
  assignedEmployee: string
}

export const seedTimeOffAdmins: TimeOffAdminAssignment[] = [
  {
    id: 'toadm-1',
    roleName: 'India Time Off Admin',
    roleType: 'Time Off Admin',
    description:
      'Adds and assigns time offs, receives all employee time-off emails and can approve, reject or assign time off for any employee across the India campuses.',
    applicableLocations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    applicableDepartments: ['Human Resources'],
    applicablePositions: ['L3 - Manager'],
    assignedEmployee: 'Sunita Patil',
  },
  {
    id: 'toadm-2',
    roleName: 'US Time Off Coordinator',
    roleType: 'Time Off Coordinator',
    description:
      'Coordinates time-off scheduling and handover for the Austin office; escalates approvals beyond supervisor limits to the Time Off Admin.',
    applicableLocations: ['Austin'],
    applicableDepartments: ['Sales'],
    applicablePositions: ['L2 - Senior'],
    assignedEmployee: 'Jordan Blake',
  },
]
