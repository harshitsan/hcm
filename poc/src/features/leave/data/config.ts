/**
 * Workflow, approver, FMLA, employee-class, closure, template and platform
 * configuration seeds (LVE-04..06, LVE-37..42, LVE-44/45, LVE-47/48,
 * LVE-20/22/23/24..28).
 */

export interface WorkflowLevel {
  seq: number
  name: string
  mode: 'sequential' | 'parallel'
  rule: 'all' | 'any'
  approvers: string[]
  slaHours: number
  escalateTo: string
}

export interface Workflow {
  id: string
  name: string
  appliesTo: string
  levels: WorkflowLevel[]
}

export const seedWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Standard Paid Leave',
    appliesTo: 'Paid leave types',
    levels: [
      {
        seq: 1,
        name: 'Reporting Manager',
        mode: 'sequential',
        rule: 'all',
        approvers: ['Immediate supervisor'],
        slaHours: 48,
        escalateTo: 'Department Head',
      },
      {
        seq: 2,
        name: 'HR Partner',
        mode: 'parallel',
        rule: 'any',
        approvers: ['Sunita Patil', 'HR Ops Desk'],
        slaHours: 72,
        escalateTo: 'HR Director',
      },
    ],
  },
  {
    id: 'wf-2',
    name: 'Loss of Pay',
    appliesTo: 'Requests with an LOP portion',
    levels: [
      {
        seq: 1,
        name: 'Reporting Manager',
        mode: 'sequential',
        rule: 'all',
        approvers: ['Immediate supervisor'],
        slaHours: 48,
        escalateTo: 'Department Head',
      },
      {
        seq: 2,
        name: 'Loss-of-Pay Approver',
        mode: 'sequential',
        rule: 'all',
        approvers: ['Location LOP approver'],
        slaHours: 72,
        escalateTo: 'HR Director',
      },
    ],
  },
  {
    id: 'wf-3',
    name: 'FMLA',
    appliesTo: 'FMLA-flagged leave types',
    levels: [
      {
        seq: 1,
        name: 'FMLA Approver',
        mode: 'parallel',
        rule: 'any',
        approvers: ['Location FMLA approvers'],
        slaHours: 72,
        escalateTo: 'Compliance Officer',
      },
    ],
  },
  {
    id: 'wf-4',
    name: 'Balance Adjustment',
    appliesTo: 'Time-off adjustments',
    levels: [
      {
        seq: 1,
        name: 'Adjustment Approver',
        mode: 'sequential',
        rule: 'all',
        approvers: ['Location adjustment approver'],
        slaHours: 96,
        escalateTo: 'HR Director',
      },
    ],
  },
]

export interface Delegation {
  id: string
  from: string
  to: string
  fromDate: string
  toDate: string
}

export const seedDelegations: Delegation[] = [
  {
    id: 'dg-1',
    from: 'Rahul Menon',
    to: 'Sunita Patil',
    fromDate: '2026-06-15',
    toDate: '2026-07-05',
  },
]

/** Generic location → approvers mapping used by three config screens. */
export interface ApproverMapping {
  id: string
  locations: string[]
  approvers: string[]
  /** Only for the time-off approver screen (LVE-41). */
  lopApprovers: string[]
}

export const seedTimeOffApprovers: ApproverMapping[] = [
  {
    id: 'toa-1',
    locations: ['Hyderabad', 'Bengaluru'],
    approvers: ['Rahul Menon', 'Sunita Patil'],
    lopApprovers: ['Sunita Patil'],
  },
  {
    id: 'toa-2',
    locations: ['Chennai'],
    approvers: ['Ananya Sharma'],
    lopApprovers: ['Sunita Patil'],
  },
]

export const seedAdjustmentApprovers: ApproverMapping[] = [
  {
    id: 'aja-1',
    locations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    approvers: ['Sunita Patil'],
    lopApprovers: [],
  },
]

export const seedFmlaApprovers: ApproverMapping[] = [
  {
    id: 'fma-1',
    locations: ['Austin'],
    approvers: ['Dana Willis'],
    lopApprovers: [],
  },
]

export interface FmlaReason {
  id: string
  fmlaType: string
  reason: string
  kind: 'qualifying' | 'rejection'
}

export const seedFmlaReasons: FmlaReason[] = [
  { id: 'fq-1', fmlaType: 'Family Care', reason: 'Care for spouse with a serious health condition', kind: 'qualifying' },
  { id: 'fq-2', fmlaType: 'Family Care', reason: 'Care for child or parent with a serious health condition', kind: 'qualifying' },
  { id: 'fq-3', fmlaType: 'Own Health', reason: 'Employee’s own serious health condition', kind: 'qualifying' },
  { id: 'fq-4', fmlaType: 'Bonding', reason: 'Birth, adoption or foster placement of a child', kind: 'qualifying' },
  { id: 'fq-5', fmlaType: 'Military', reason: 'Qualifying exigency for covered military duty', kind: 'qualifying' },
  { id: 'fr-1', fmlaType: 'Eligibility', reason: 'Employee has not met the 12-month service requirement', kind: 'rejection' },
  { id: 'fr-2', fmlaType: 'Eligibility', reason: 'FMLA entitlement (480 hours) already exhausted', kind: 'rejection' },
  { id: 'fr-3', fmlaType: 'Documentation', reason: 'Medical certification not provided within 15 days', kind: 'rejection' },
]

export interface EmployeeClassRule {
  id: string
  employeeClass: string
  calcStartMonth: string
  /** Max time-offs (days) an immediate supervisor may approve (LVE-44). */
  maxSupervisorApproval: number
  accrualNote: string
}

export const seedClassRules: EmployeeClassRule[] = [
  {
    id: 'ecr-1',
    employeeClass: 'Regular',
    calcStartMonth: 'April',
    maxSupervisorApproval: 5,
    accrualNote: '1.5 PL / month, carry-forward per policy',
  },
  {
    id: 'ecr-2',
    employeeClass: 'Probationary',
    calcStartMonth: 'Joining month',
    maxSupervisorApproval: 2,
    accrualNote: 'Pro-rated 50% until confirmation',
  },
  {
    id: 'ecr-3',
    employeeClass: 'Contractor',
    calcStartMonth: 'January',
    maxSupervisorApproval: 3,
    accrualNote: 'Casual leave only, quarterly accrual',
  },
  {
    id: 'ecr-4',
    employeeClass: 'Executive',
    calcStartMonth: 'April',
    maxSupervisorApproval: 10,
    accrualNote: 'Annual grant on 1 April',
  },
]

export interface OfficeClosure {
  id: string
  reason: string
  from: string
  to: string
  locations: string[]
  departments: string[]
}

export const seedClosures: OfficeClosure[] = [
  {
    id: 'oc-1',
    reason: 'Cyclone advisory — Chennai campus closed',
    from: '2026-11-02',
    to: '2026-11-03',
    locations: ['Chennai'],
    departments: ['Engineering', 'Operations'],
  },
  {
    id: 'oc-2',
    reason: 'Year-end shutdown',
    from: '2026-12-28',
    to: '2026-12-31',
    locations: ['Hyderabad', 'Bengaluru', 'Chennai'],
    departments: ['Engineering', 'Finance', 'Human Resources', 'Operations', 'Sales'],
  },
]

export const TEMPLATE_EVENTS = [
  'Submitted',
  'Approved',
  'Rejected',
  'Escalated',
  'Cancelled',
  'Adjusted',
] as const

export interface NotificationTemplate {
  id: string
  event: (typeof TEMPLATE_EVENTS)[number]
  channel: 'Email' | 'In-app'
  subject: string
  body: string
}

export const seedTemplates: NotificationTemplate[] = TEMPLATE_EVENTS.flatMap(
  (event, i) => [
    {
      id: `tpl-e-${i}`,
      event,
      channel: 'Email' as const,
      subject: `Leave ${event.toLowerCase()}: {{employee}} — {{leaveType}}`,
      body: `Hi {{recipient}}, the leave request of {{employee}} ({{leaveType}}, {{from}} to {{to}}) is now ${event.toLowerCase()}. Status: {{status}}.`,
    },
    {
      id: `tpl-n-${i}`,
      event,
      channel: 'In-app' as const,
      subject: `Leave ${event.toLowerCase()}`,
      body: `{{employee}} · {{leaveType}} · {{from}}–{{to}} · {{status}}`,
    },
  ]
)

/** Platform-wide defaults inherited by new tenants (LVE-20). */
export interface PlatformDefaults {
  leaveModuleAvailable: boolean
  defaultSlaHours: number
  escalationEnabled: boolean
  auditRetentionYears: number
  bitemporalStorage: boolean
  rlsEnforced: boolean
}

export const seedPlatformDefaults: PlatformDefaults = {
  leaveModuleAvailable: true,
  defaultSlaHours: 48,
  escalationEnabled: true,
  auditRetentionYears: 7,
  bitemporalStorage: true,
  rlsEnforced: true,
}

export interface Tenant {
  id: string
  name: string
  leaveRows: number
  isolated: boolean
}

export const seedTenants: Tenant[] = [
  { id: 'tn-1', name: 'Satellite Group', leaveRows: 18420, isolated: true },
  { id: 'tn-2', name: 'Orbital Group', leaveRows: 6112, isolated: true },
  { id: 'tn-3', name: 'Nimbus Holdings', leaveRows: 24980, isolated: true },
]

/**
 * Calendar accessibility configuration (CAL-01..05, Configure Calendar) —
 * who may view an employee's calendar events and whether event-based
 * announcements surface on the calendar.
 */
export interface CalendarAccessConfig {
  /** CAL-01: employees can add and view other employees' calendars. */
  peerCalendars: boolean
  /** CAL-02: the reporting-manager hierarchy can view calendar events. */
  managerHierarchy: boolean
  /** CAL-03: HR can view any employee's calendar events. */
  hrVisibility: boolean
  /** CAL-04: event-based announcements are shown on the calendar. */
  eventAnnouncements: boolean
}

export const seedCalendarAccess: CalendarAccessConfig = {
  peerCalendars: false,
  managerHierarchy: true,
  hrVisibility: true,
  eventAnnouncements: true,
}

/** Event-based announcements surfaced on the calendar when enabled (CAL-04). */
export interface CalendarAnnouncement {
  id: string
  date: string
  title: string
  detail: string
}

export const seedCalendarAnnouncements: CalendarAnnouncement[] = [
  {
    id: 'ca-1',
    date: '2026-07-10',
    title: 'Quarterly Town Hall',
    detail: 'All-hands at 4:00 PM IST — auditorium & livestream. Attendance encouraged.',
  },
  {
    id: 'ca-2',
    date: '2026-07-15',
    title: 'Benefits Enrollment Window Opens',
    detail: 'Annual benefits enrollment runs 15–31 July. Complete elections in the portal.',
  },
  {
    id: 'ca-3',
    date: '2026-08-15',
    title: 'Independence Day Celebration',
    detail: 'Flag hoisting at 9:00 AM at all India offices; cultural events follow.',
  },
]

export interface IntegrityConstraint {
  id: string
  name: string
  rule: string
  enforcement: string
}

export const INTEGRITY_CONSTRAINTS: IntegrityConstraint[] = [
  {
    id: 'ic-1',
    name: 'Referential integrity',
    rule: 'leave_request.employee_id → employee.id, leave_request.type_id → leave_type.id, leave_request.policy_id → policy.id',
    enforcement: 'FK constraints — a request cannot reference a non-existent employee, type or policy.',
  },
  {
    id: 'ic-2',
    name: 'Overlap exclusion',
    rule: 'EXCLUDE USING gist (employee_id WITH =, daterange(from, to) WITH &&)',
    enforcement: 'Duplicate or conflicting bookings for the same employee are rejected at persistence.',
  },
  {
    id: 'ic-3',
    name: 'Balance floor',
    rule: 'CHECK (credited - taken - scheduled - pending >= 0) unless LOP-flagged',
    enforcement: 'Deductions that would breach policy limits are blocked.',
  },
  {
    id: 'ic-4',
    name: 'Concurrency / no double-spend',
    rule: 'SERIALIZABLE transactions + optimistic version on balance rows',
    enforcement: 'Concurrent requests against the same balance commit without double-spend.',
  },
]
