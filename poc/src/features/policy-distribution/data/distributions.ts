import { type AckType, type Criticality } from './policies'

/** Distribution scope, method, due-date and assignment tracking types. */

export const AUDIENCE_FIELDS = [
  'company',
  'location',
  'department',
  'group',
  'employmentType',
  'employee',
] as const
export type AudienceField = (typeof AUDIENCE_FIELDS)[number]

export interface AudienceCriterion {
  field: AudienceField
  values: string[]
}

export interface Audience {
  /** How multiple criteria combine when resolving recipients. */
  logic: 'AND' | 'OR'
  criteria: AudienceCriterion[]
}

export const DISTRIBUTION_METHODS = [
  'Manual',
  'Scheduled',
  'Event-triggered',
] as const
export type DistributionMethod = (typeof DISTRIBUTION_METHODS)[number]

export const LIFECYCLE_EVENTS = [
  'Onboarding',
  'Transfer',
  'Role change',
] as const
export type LifecycleEvent = (typeof LIFECYCLE_EVENTS)[number]

/**
 * Why an acknowledgment was requested. 'Initial' is the first ask; every
 * other value is a re-acknowledgment reason (content change, periodic
 * renewal, transfer, role change or regulatory update).
 */
export const ASSIGNMENT_TRIGGERS = [
  'Initial',
  'Content change',
  'Periodic renewal',
  'Transfer',
  'Role change',
  'Regulatory update',
] as const
export type AssignmentTrigger = (typeof ASSIGNMENT_TRIGGERS)[number]

export const DUE_RULE_TYPES = [
  'Fixed',
  'Relative',
  'Hire-based',
  'Periodic renewal',
] as const
export type DueRuleType = (typeof DUE_RULE_TYPES)[number]

export interface DueDateRule {
  type: DueRuleType
  /** ISO date when type === 'Fixed'. */
  fixedDate?: string
  /** Days after distribution when type === 'Relative'. */
  relativeDays?: number
  /** Days after each employee's hire date when type === 'Hire-based'. */
  hireOffsetDays?: number
  /** Months between recurring cycles when type === 'Periodic renewal'. */
  renewalMonths?: number
}

export type DistributionStatus =
  | 'Sent'
  | 'Scheduled'
  | 'Armed' // event-triggered, waiting for lifecycle events
  | 'Cancelled'

export interface Distribution {
  id: string
  policyId: string
  policyTitle: string
  policyVersion: string
  ackType: AckType
  criticality: Criticality
  audience: Audience
  audienceSummary: string
  method: DistributionMethod
  /** ISO datetime for scheduled sends; editable/cancellable until it fires. */
  scheduledFor: string | null
  eventTrigger: LifecycleEvent | null
  dueDateRule: DueDateRule
  status: DistributionStatus
  /** Why this ask went out — 'Initial' or a re-acknowledgment reason. */
  trigger: AssignmentTrigger
  /** Priority wave (regulatory updates) — surfaced with a priority chip. */
  priority: boolean
  isBulk: boolean
  createdBy: string
  createdAt: string
  sentAt: string | null
}

export type AssignmentStatus =
  | 'Pending'
  | 'Acknowledged'
  | 'Overdue'
  | 'Delivered' // Read-Only: information only, no acknowledgment expected
  | 'Failed'

export interface Assignment {
  id: string
  distributionId: string
  employeeId: string
  employeeName: string
  company: string
  department: string
  policyId: string
  policyTitle: string
  policyVersion: string
  ackType: AckType
  criticality: Criticality
  status: AssignmentStatus
  /** ISO due date; null for Read-Only / Optional-without-deadline items. */
  dueDate: string | null
  assignedAt: string
  acknowledgedAt: string | null
  /** Who confirmed — the employee, or the admin acting as proxy. */
  acknowledgedBy: string | null
  proxy: boolean
  proxyEvidence: string | null
  receiptId: string | null
  /** SLA milestones (percent) for which reminders have been sent. */
  remindersSent: number[]
  escalated: boolean
  /** Recipient has no portal access and cannot self-acknowledge. */
  isNonUser: boolean
  /** Why this acknowledgment was requested. */
  trigger: AssignmentTrigger
  /** One-line plain-language context shown to the employee, e.g.
   * "Transferred to Pune office on 12 May 2026". */
  triggerContext: string | null
  /** Priority ask (regulatory update) — shown with a priority chip. */
  priority: boolean
  /** True when a re-acknowledgment cycle replaced this record (kept as history). */
  superseded: boolean
  /** Task/checklist module integration state. */
  taskStatus: 'Open' | 'Completed' | 'None'
}

export interface AuditEvent {
  id: string
  /** Transaction time — when the system recorded the event. */
  recordedAt: string
  /** Valid time — when the fact became effective. */
  effectiveAt: string
  actor: string
  action: string
  employeeName: string
  policyTitle: string
  policyVersion: string
  company: string
  detail: string
  /** 7-year regulatory retention horizon. */
  retainUntil: string
}

/** Fills assignment defaults so seed rows stay readable. */
function makeAssignment(
  row: Pick<
    Assignment,
    | 'id'
    | 'distributionId'
    | 'employeeId'
    | 'employeeName'
    | 'company'
    | 'department'
    | 'policyId'
    | 'policyTitle'
    | 'policyVersion'
    | 'ackType'
    | 'criticality'
    | 'status'
    | 'dueDate'
    | 'assignedAt'
  > &
    Partial<Assignment>
): Assignment {
  return {
    acknowledgedAt: null,
    acknowledgedBy: null,
    proxy: false,
    proxyEvidence: null,
    receiptId: null,
    remindersSent: [],
    escalated: false,
    isNonUser: false,
    trigger: 'Initial',
    triggerContext: null,
    priority: false,
    superseded: false,
    taskStatus: row.ackType === 'Read-Only' ? 'None' : 'Open',
    ...row,
  }
}

export const seedDistributions: Distribution[] = [
  {
    id: 'dist-01',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    audience: {
      logic: 'OR',
      criteria: [
        {
          field: 'company',
          values: [
            'Northwind Retail',
            'Contoso Manufacturing',
            'Fabrikam Logistics',
            'Trey Research',
          ],
        },
      ],
    },
    audienceSummary: 'All 4 group companies (bulk)',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Relative', relativeDays: 14 },
    status: 'Sent',
    trigger: 'Initial',
    priority: false,
    isBulk: true,
    createdBy: 'Priya Raman (Group Company Admin)',
    createdAt: '2026-06-10T09:00:00Z',
    sentAt: '2026-06-10T09:05:00Z',
  },
  {
    id: 'dist-02',
    policyId: 'pol-02',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v2',
    ackType: 'Required',
    criticality: 'Critical',
    audience: {
      logic: 'AND',
      criteria: [
        { field: 'department', values: ['Engineering'] },
        { field: 'employmentType', values: ['Full-time', 'Contract', 'Intern'] },
      ],
    },
    audienceSummary: 'Engineering AND (Full-time, Contract, Intern)',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Fixed', fixedDate: '2026-07-10' },
    status: 'Sent',
    trigger: 'Initial',
    priority: false,
    isBulk: false,
    createdBy: 'Asha Verma (Company Admin)',
    createdAt: '2026-06-20T11:30:00Z',
    sentAt: '2026-06-20T11:32:00Z',
  },
  {
    id: 'dist-03',
    policyId: 'pol-03',
    policyTitle: 'Prevention of Sexual Harassment (POSH)',
    policyVersion: 'v1',
    ackType: 'Required',
    criticality: 'Critical',
    audience: {
      logic: 'AND',
      criteria: [{ field: 'company', values: ['Northwind Retail'] }],
    },
    audienceSummary: 'Northwind Retail — all employees',
    method: 'Scheduled',
    scheduledFor: '2026-07-15T09:00:00Z',
    eventTrigger: null,
    dueDateRule: { type: 'Relative', relativeDays: 10 },
    status: 'Scheduled',
    trigger: 'Initial',
    priority: false,
    isBulk: false,
    createdBy: 'Asha Verma (Company Admin)',
    createdAt: '2026-06-25T14:00:00Z',
    sentAt: null,
  },
  {
    id: 'dist-04',
    policyId: 'pol-04',
    policyTitle: 'Travel & Expense Policy',
    policyVersion: 'v4',
    ackType: 'Optional',
    criticality: 'Standard',
    audience: {
      logic: 'OR',
      criteria: [{ field: 'department', values: ['Finance', 'Sales'] }],
    },
    audienceSummary: 'Finance OR Sales departments',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Relative', relativeDays: 30 },
    status: 'Sent',
    trigger: 'Initial',
    priority: false,
    isBulk: false,
    createdBy: 'Asha Verma (Company Admin)',
    createdAt: '2026-06-15T10:00:00Z',
    sentAt: '2026-06-15T10:02:00Z',
  },
  {
    id: 'dist-05',
    policyId: 'pol-05',
    policyTitle: 'Holiday Calendar 2026',
    policyVersion: 'v1',
    ackType: 'Read-Only',
    criticality: 'Standard',
    audience: {
      logic: 'OR',
      criteria: [
        { field: 'company', values: ['Northwind Retail', 'Contoso Manufacturing'] },
      ],
    },
    audienceSummary: 'Aurora Group companies',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Relative', relativeDays: 0 },
    status: 'Sent',
    trigger: 'Initial',
    priority: false,
    isBulk: false,
    createdBy: 'Priya Raman (Group Company Admin)',
    createdAt: '2026-06-05T08:00:00Z',
    sentAt: '2026-06-05T08:01:00Z',
  },
  {
    id: 'dist-06',
    policyId: 'pol-06',
    policyTitle: 'Data Privacy Policy',
    policyVersion: 'v2',
    ackType: 'Required',
    criticality: 'High',
    audience: {
      logic: 'OR',
      criteria: [
        {
          field: 'company',
          values: [
            'Northwind Retail',
            'Contoso Manufacturing',
            'Fabrikam Logistics',
            'Trey Research',
          ],
        },
      ],
    },
    audienceSummary: 'New joiners — any group company',
    method: 'Event-triggered',
    scheduledFor: null,
    eventTrigger: 'Onboarding',
    dueDateRule: { type: 'Hire-based', hireOffsetDays: 30 },
    status: 'Armed',
    trigger: 'Initial',
    priority: false,
    isBulk: false,
    createdBy: 'Noel D’Souza (Platform Admin)',
    createdAt: '2026-05-30T12:00:00Z',
    sentAt: null,
  },
  {
    id: 'dist-07',
    policyId: 'pol-07',
    policyTitle: 'Workplace Safety Handbook',
    policyVersion: 'v5',
    ackType: 'Required',
    criticality: 'High',
    audience: {
      logic: 'AND',
      criteria: [
        { field: 'group', values: ['Field Staff'] },
        {
          field: 'company',
          values: ['Contoso Manufacturing', 'Fabrikam Logistics'],
        },
      ],
    },
    audienceSummary: 'Field Staff AND (Contoso, Fabrikam) — bulk',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Periodic renewal', renewalMonths: 6 },
    status: 'Sent',
    trigger: 'Initial',
    priority: false,
    isBulk: true,
    createdBy: 'Priya Raman (Group Company Admin)',
    createdAt: '2026-06-18T07:45:00Z',
    sentAt: '2026-06-18T07:50:00Z',
  },
  // Re-acknowledgment wave: Data Privacy Policy content changed on 3 Jun 2026.
  {
    id: 'dist-08',
    policyId: 'pol-06',
    policyTitle: 'Data Privacy Policy',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'High',
    audience: {
      logic: 'OR',
      criteria: [{ field: 'employee', values: ['emp-101', 'emp-108'] }],
    },
    audienceSummary: 'Re-acknowledgment — 2 employees with an active acknowledgment',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Relative', relativeDays: 14 },
    status: 'Sent',
    trigger: 'Content change',
    priority: false,
    isBulk: false,
    createdBy: 'Asha Verma (Company Admin)',
    createdAt: '2026-06-03T10:00:00Z',
    sentAt: '2026-06-03T10:02:00Z',
  },
  // Priority re-acknowledgment wave: DPDP data-handling rules amended.
  {
    id: 'dist-09',
    policyId: 'pol-02',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    audience: {
      logic: 'OR',
      criteria: [{ field: 'employee', values: ['emp-101'] }],
    },
    audienceSummary: 'Re-acknowledgment — 1 employee with an active acknowledgment',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Relative', relativeDays: 7 },
    status: 'Sent',
    trigger: 'Regulatory update',
    priority: true,
    isBulk: false,
    createdBy: 'Asha Verma (Company Admin)',
    createdAt: '2026-06-08T09:00:00Z',
    sentAt: '2026-06-08T09:01:00Z',
  },
  // 2025 POSH campaign — its acknowledgments are now past the annual renewal
  // cadence, so the policy shows as "Renewal due" in the admin console.
  {
    id: 'dist-10',
    policyId: 'pol-03',
    policyTitle: 'Prevention of Sexual Harassment (POSH)',
    policyVersion: 'v1',
    ackType: 'Required',
    criticality: 'Critical',
    audience: {
      logic: 'OR',
      criteria: [{ field: 'employee', values: ['emp-103', 'emp-107'] }],
    },
    audienceSummary: 'Northwind + Contoso HR and Sales — 2025 campaign',
    method: 'Manual',
    scheduledFor: null,
    eventTrigger: null,
    dueDateRule: { type: 'Relative', relativeDays: 10 },
    status: 'Sent',
    trigger: 'Initial',
    priority: false,
    isBulk: false,
    createdBy: 'Asha Verma (Company Admin)',
    createdAt: '2025-06-20T09:00:00Z',
    sentAt: '2025-06-20T09:02:00Z',
  },
]

export const seedAssignments: Assignment[] = [
  // dist-01 · Code of Conduct v3 — group-wide bulk, due 24 Jun (relative +14)
  makeAssignment({
    id: 'as-001',
    distributionId: 'dist-01',
    employeeId: 'emp-101',
    employeeName: 'Riya Sharma',
    company: 'Northwind Retail',
    department: 'Engineering',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Pending',
    dueDate: '2026-07-08',
    assignedAt: '2026-06-10T09:05:00Z',
    remindersSent: [50, 75],
  }),
  makeAssignment({
    id: 'as-002',
    distributionId: 'dist-01',
    employeeId: 'emp-102',
    employeeName: 'Arjun Mehta',
    company: 'Northwind Retail',
    department: 'Human Resources',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Acknowledged',
    dueDate: '2026-06-24',
    assignedAt: '2026-06-10T09:05:00Z',
    acknowledgedAt: '2026-06-12T10:14:00Z',
    acknowledgedBy: 'Arjun Mehta',
    receiptId: 'rcpt-88021',
    taskStatus: 'Completed',
    // Superseded by the role-change re-acknowledgment below (as-071).
    superseded: true,
  }),
  makeAssignment({
    id: 'as-071',
    distributionId: 'dist-01',
    employeeId: 'emp-102',
    employeeName: 'Arjun Mehta',
    company: 'Northwind Retail',
    department: 'Human Resources',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Pending',
    dueDate: '2026-07-15',
    assignedAt: '2026-07-01T09:00:00Z',
    trigger: 'Role change',
    triggerContext: 'Promoted to HR Manager on 1 Jul 2026',
  }),
  makeAssignment({
    id: 'as-003',
    distributionId: 'dist-01',
    employeeId: 'emp-104',
    employeeName: 'Vikram Singh',
    company: 'Northwind Retail',
    department: 'Finance',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Overdue',
    dueDate: '2026-06-24',
    assignedAt: '2026-06-10T09:05:00Z',
    remindersSent: [50, 75, 100],
    escalated: true,
  }),
  makeAssignment({
    id: 'as-004',
    distributionId: 'dist-01',
    employeeId: 'emp-105',
    employeeName: 'Kavya Reddy',
    company: 'Contoso Manufacturing',
    department: 'Operations',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Acknowledged',
    dueDate: '2026-06-24',
    assignedAt: '2026-06-10T09:05:00Z',
    acknowledgedAt: '2026-06-11T16:40:00Z',
    acknowledgedBy: 'Kavya Reddy',
    receiptId: 'rcpt-88034',
    taskStatus: 'Completed',
    // Superseded by the transfer re-acknowledgment below (as-070).
    superseded: true,
  }),
  makeAssignment({
    id: 'as-070',
    distributionId: 'dist-01',
    employeeId: 'emp-105',
    employeeName: 'Kavya Reddy',
    company: 'Contoso Manufacturing',
    department: 'Operations',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Pending',
    dueDate: '2026-07-19',
    assignedAt: '2026-07-05T09:00:00Z',
    trigger: 'Transfer',
    triggerContext: 'Transferred to Pune office on 12 May 2026',
  }),
  makeAssignment({
    id: 'as-005',
    distributionId: 'dist-01',
    employeeId: 'emp-106',
    employeeName: 'Ramesh Yadav',
    company: 'Contoso Manufacturing',
    department: 'Operations',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Acknowledged',
    dueDate: '2026-06-24',
    assignedAt: '2026-06-10T09:05:00Z',
    acknowledgedAt: '2026-06-19T09:20:00Z',
    acknowledgedBy: 'Asha Verma (Company Admin) — proxy',
    proxy: true,
    proxyEvidence: 'Signed paper acknowledgment filed at Pune Plant HR desk',
    receiptId: 'rcpt-88102',
    isNonUser: true,
    taskStatus: 'Completed',
  }),
  makeAssignment({
    id: 'as-006',
    distributionId: 'dist-01',
    employeeId: 'emp-110',
    employeeName: 'Suresh Nair',
    company: 'Fabrikam Logistics',
    department: 'Operations',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Overdue',
    dueDate: '2026-06-24',
    assignedAt: '2026-06-10T09:05:00Z',
    remindersSent: [50, 75, 100],
    escalated: true,
    isNonUser: true,
  }),
  makeAssignment({
    id: 'as-007',
    distributionId: 'dist-01',
    employeeId: 'emp-112',
    employeeName: 'Karthik Rao',
    company: 'Trey Research',
    department: 'Engineering',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Acknowledged',
    dueDate: '2026-06-24',
    assignedAt: '2026-06-10T09:05:00Z',
    acknowledgedAt: '2026-06-14T13:05:00Z',
    acknowledgedBy: 'Karthik Rao',
    receiptId: 'rcpt-88077',
    taskStatus: 'Completed',
  }),
  makeAssignment({
    id: 'as-008',
    distributionId: 'dist-01',
    employeeId: 'emp-113',
    employeeName: 'Pooja Desai',
    company: 'Trey Research',
    department: 'Human Resources',
    policyId: 'pol-01',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Failed',
    dueDate: '2026-06-24',
    assignedAt: '2026-06-10T09:05:00Z',
  }),

  // dist-02 · Information Security Policy v2 — Engineering, fixed due 10 Jul
  makeAssignment({
    id: 'as-010',
    distributionId: 'dist-02',
    employeeId: 'emp-101',
    employeeName: 'Riya Sharma',
    company: 'Northwind Retail',
    department: 'Engineering',
    policyId: 'pol-02',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v2',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Pending',
    dueDate: '2026-07-10',
    assignedAt: '2026-06-20T11:32:00Z',
    remindersSent: [50],
    // Superseded by the regulatory-update wave for v3 (as-052).
    superseded: true,
  }),
  makeAssignment({
    id: 'as-052',
    distributionId: 'dist-09',
    employeeId: 'emp-101',
    employeeName: 'Riya Sharma',
    company: 'Northwind Retail',
    department: 'Engineering',
    policyId: 'pol-02',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Pending',
    dueDate: '2026-07-20',
    assignedAt: '2026-06-08T09:01:00Z',
    trigger: 'Regulatory update',
    triggerContext: 'DPDP data-handling rules amended on 5 Jun 2026',
    priority: true,
  }),
  makeAssignment({
    id: 'as-011',
    distributionId: 'dist-02',
    employeeId: 'emp-108',
    employeeName: 'Dev Patel',
    company: 'Contoso Manufacturing',
    department: 'Engineering',
    policyId: 'pol-02',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v2',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Acknowledged',
    dueDate: '2026-07-10',
    assignedAt: '2026-06-20T11:32:00Z',
    acknowledgedAt: '2026-06-22T09:55:00Z',
    acknowledgedBy: 'Dev Patel',
    receiptId: 'rcpt-88214',
    taskStatus: 'Completed',
  }),
  makeAssignment({
    id: 'as-012',
    distributionId: 'dist-02',
    employeeId: 'emp-112',
    employeeName: 'Karthik Rao',
    company: 'Trey Research',
    department: 'Engineering',
    policyId: 'pol-02',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v2',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Pending',
    dueDate: '2026-07-10',
    assignedAt: '2026-06-20T11:32:00Z',
    remindersSent: [50],
  }),
  makeAssignment({
    id: 'as-013',
    distributionId: 'dist-02',
    employeeId: 'emp-114',
    employeeName: 'Ishaan Verma',
    company: 'Trey Research',
    department: 'Engineering',
    policyId: 'pol-02',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v2',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Pending',
    dueDate: '2026-07-10',
    assignedAt: '2026-06-20T11:32:00Z',
  }),

  // dist-04 · Travel & Expense v4 — Optional, no enforcement
  makeAssignment({
    id: 'as-020',
    distributionId: 'dist-04',
    employeeId: 'emp-103',
    employeeName: 'Sneha Kulkarni',
    company: 'Northwind Retail',
    department: 'Sales',
    policyId: 'pol-04',
    policyTitle: 'Travel & Expense Policy',
    policyVersion: 'v4',
    ackType: 'Optional',
    criticality: 'Standard',
    status: 'Acknowledged',
    dueDate: '2026-07-15',
    assignedAt: '2026-06-15T10:02:00Z',
    acknowledgedAt: '2026-06-16T12:00:00Z',
    acknowledgedBy: 'Sneha Kulkarni',
    receiptId: 'rcpt-88150',
    taskStatus: 'Completed',
  }),
  makeAssignment({
    id: 'as-021',
    distributionId: 'dist-04',
    employeeId: 'emp-104',
    employeeName: 'Vikram Singh',
    company: 'Northwind Retail',
    department: 'Finance',
    policyId: 'pol-04',
    policyTitle: 'Travel & Expense Policy',
    policyVersion: 'v4',
    ackType: 'Optional',
    criticality: 'Standard',
    status: 'Pending',
    dueDate: '2026-07-15',
    assignedAt: '2026-06-15T10:02:00Z',
  }),
  makeAssignment({
    id: 'as-022',
    distributionId: 'dist-04',
    employeeId: 'emp-111',
    employeeName: 'Ananya Bose',
    company: 'Fabrikam Logistics',
    department: 'Finance',
    policyId: 'pol-04',
    policyTitle: 'Travel & Expense Policy',
    policyVersion: 'v4',
    ackType: 'Optional',
    criticality: 'Standard',
    status: 'Pending',
    dueDate: '2026-07-15',
    assignedAt: '2026-06-15T10:02:00Z',
  }),
  makeAssignment({
    id: 'as-023',
    distributionId: 'dist-04',
    employeeId: 'emp-116',
    employeeName: 'Tanvi Joshi',
    company: 'Contoso Manufacturing',
    department: 'Finance',
    policyId: 'pol-04',
    policyTitle: 'Travel & Expense Policy',
    policyVersion: 'v4',
    ackType: 'Optional',
    criticality: 'Standard',
    status: 'Pending',
    dueDate: '2026-07-15',
    assignedAt: '2026-06-15T10:02:00Z',
  }),

  // dist-05 · Holiday Calendar — Read-Only, delivered only
  makeAssignment({
    id: 'as-030',
    distributionId: 'dist-05',
    employeeId: 'emp-101',
    employeeName: 'Riya Sharma',
    company: 'Northwind Retail',
    department: 'Engineering',
    policyId: 'pol-05',
    policyTitle: 'Holiday Calendar 2026',
    policyVersion: 'v1',
    ackType: 'Read-Only',
    criticality: 'Standard',
    status: 'Delivered',
    dueDate: null,
    assignedAt: '2026-06-05T08:01:00Z',
  }),
  makeAssignment({
    id: 'as-031',
    distributionId: 'dist-05',
    employeeId: 'emp-115',
    employeeName: 'Lakshmi Menon',
    company: 'Northwind Retail',
    department: 'Sales',
    policyId: 'pol-05',
    policyTitle: 'Holiday Calendar 2026',
    policyVersion: 'v1',
    ackType: 'Read-Only',
    criticality: 'Standard',
    status: 'Delivered',
    dueDate: null,
    assignedAt: '2026-06-05T08:01:00Z',
    isNonUser: true,
  }),
  makeAssignment({
    id: 'as-032',
    distributionId: 'dist-05',
    employeeId: 'emp-107',
    employeeName: 'Meena Iyer',
    company: 'Contoso Manufacturing',
    department: 'Human Resources',
    policyId: 'pol-05',
    policyTitle: 'Holiday Calendar 2026',
    policyVersion: 'v1',
    ackType: 'Read-Only',
    criticality: 'Standard',
    status: 'Delivered',
    dueDate: null,
    assignedAt: '2026-06-05T08:01:00Z',
  }),

  // dist-07 · Safety Handbook v5 — bulk with failures
  makeAssignment({
    id: 'as-040',
    distributionId: 'dist-07',
    employeeId: 'emp-105',
    employeeName: 'Kavya Reddy',
    company: 'Contoso Manufacturing',
    department: 'Operations',
    policyId: 'pol-07',
    policyTitle: 'Workplace Safety Handbook',
    policyVersion: 'v5',
    ackType: 'Required',
    criticality: 'High',
    status: 'Acknowledged',
    dueDate: '2026-12-18',
    assignedAt: '2026-06-18T07:50:00Z',
    acknowledgedAt: '2026-06-20T08:30:00Z',
    acknowledgedBy: 'Kavya Reddy',
    receiptId: 'rcpt-88190',
    taskStatus: 'Completed',
  }),
  makeAssignment({
    id: 'as-041',
    distributionId: 'dist-07',
    employeeId: 'emp-106',
    employeeName: 'Ramesh Yadav',
    company: 'Contoso Manufacturing',
    department: 'Operations',
    policyId: 'pol-07',
    policyTitle: 'Workplace Safety Handbook',
    policyVersion: 'v5',
    ackType: 'Required',
    criticality: 'High',
    status: 'Pending',
    dueDate: '2026-12-18',
    assignedAt: '2026-06-18T07:50:00Z',
    isNonUser: true,
    trigger: 'Periodic renewal',
    triggerContext: 'Half-yearly safety renewal cycle started 18 Jun 2026',
  }),
  makeAssignment({
    id: 'as-042',
    distributionId: 'dist-07',
    employeeId: 'emp-109',
    employeeName: 'Farah Khan',
    company: 'Fabrikam Logistics',
    department: 'Operations',
    policyId: 'pol-07',
    policyTitle: 'Workplace Safety Handbook',
    policyVersion: 'v5',
    ackType: 'Required',
    criticality: 'High',
    status: 'Failed',
    dueDate: '2026-12-18',
    assignedAt: '2026-06-18T07:50:00Z',
  }),
  makeAssignment({
    id: 'as-043',
    distributionId: 'dist-07',
    employeeId: 'emp-110',
    employeeName: 'Suresh Nair',
    company: 'Fabrikam Logistics',
    department: 'Operations',
    policyId: 'pol-07',
    policyTitle: 'Workplace Safety Handbook',
    policyVersion: 'v5',
    ackType: 'Required',
    criticality: 'High',
    status: 'Failed',
    dueDate: '2026-12-18',
    assignedAt: '2026-06-18T07:50:00Z',
    isNonUser: true,
  }),

  // dist-08 · Data Privacy v3 — content-change re-acknowledgment wave
  makeAssignment({
    id: 'as-050',
    distributionId: 'dist-08',
    employeeId: 'emp-101',
    employeeName: 'Riya Sharma',
    company: 'Northwind Retail',
    department: 'Engineering',
    policyId: 'pol-06',
    policyTitle: 'Data Privacy Policy',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'High',
    status: 'Pending',
    dueDate: '2026-07-17',
    assignedAt: '2026-06-03T10:02:00Z',
    trigger: 'Content change',
    triggerContext: 'Policy content changed on 3 Jun 2026',
  }),
  makeAssignment({
    id: 'as-051',
    distributionId: 'dist-08',
    employeeId: 'emp-108',
    employeeName: 'Dev Patel',
    company: 'Contoso Manufacturing',
    department: 'Engineering',
    policyId: 'pol-06',
    policyTitle: 'Data Privacy Policy',
    policyVersion: 'v3',
    ackType: 'Required',
    criticality: 'High',
    status: 'Acknowledged',
    dueDate: '2026-06-17',
    assignedAt: '2026-06-03T10:02:00Z',
    acknowledgedAt: '2026-06-05T11:20:00Z',
    acknowledgedBy: 'Dev Patel',
    receiptId: 'rcpt-88301',
    taskStatus: 'Completed',
    trigger: 'Content change',
    triggerContext: 'Policy content changed on 3 Jun 2026',
  }),

  // dist-10 · POSH 2025 campaign — acknowledgments now past the annual
  // renewal cadence, driving the "Renewal due" state for pol-03.
  makeAssignment({
    id: 'as-055',
    distributionId: 'dist-10',
    employeeId: 'emp-103',
    employeeName: 'Sneha Kulkarni',
    company: 'Northwind Retail',
    department: 'Sales',
    policyId: 'pol-03',
    policyTitle: 'Prevention of Sexual Harassment (POSH)',
    policyVersion: 'v1',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Acknowledged',
    dueDate: '2025-06-30',
    assignedAt: '2025-06-20T09:02:00Z',
    acknowledgedAt: '2025-06-24T14:05:00Z',
    acknowledgedBy: 'Sneha Kulkarni',
    receiptId: 'rcpt-71204',
    taskStatus: 'Completed',
  }),
  makeAssignment({
    id: 'as-056',
    distributionId: 'dist-10',
    employeeId: 'emp-107',
    employeeName: 'Meena Iyer',
    company: 'Contoso Manufacturing',
    department: 'Human Resources',
    policyId: 'pol-03',
    policyTitle: 'Prevention of Sexual Harassment (POSH)',
    policyVersion: 'v1',
    ackType: 'Required',
    criticality: 'Critical',
    status: 'Acknowledged',
    dueDate: '2025-06-30',
    assignedAt: '2025-06-20T09:02:00Z',
    acknowledgedAt: '2025-06-28T10:12:00Z',
    acknowledgedBy: 'Meena Iyer',
    receiptId: 'rcpt-71219',
    taskStatus: 'Completed',
  }),
]

export const seedAuditEvents: AuditEvent[] = [
  {
    id: 'aud-001',
    recordedAt: '2026-06-10T09:05:12Z',
    effectiveAt: '2026-06-10T09:05:00Z',
    actor: 'Priya Raman (Group Company Admin)',
    action: 'Distribution sent',
    employeeName: '— (16 recipients)',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    company: 'All group companies',
    detail: 'Bulk distribution to de-duplicated group-wide audience.',
    retainUntil: '2033-06-10',
  },
  {
    id: 'aud-002',
    recordedAt: '2026-06-11T16:40:09Z',
    effectiveAt: '2026-06-11T16:40:00Z',
    actor: 'Kavya Reddy',
    action: 'Acknowledged',
    employeeName: 'Kavya Reddy',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    company: 'Contoso Manufacturing',
    detail: 'Self-service acknowledgment. Receipt rcpt-88034 issued.',
    retainUntil: '2033-06-11',
  },
  {
    id: 'aud-003',
    recordedAt: '2026-06-12T10:14:31Z',
    effectiveAt: '2026-06-12T10:14:00Z',
    actor: 'Arjun Mehta',
    action: 'Acknowledged',
    employeeName: 'Arjun Mehta',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    company: 'Northwind Retail',
    detail: 'Self-service acknowledgment. Receipt rcpt-88021 issued.',
    retainUntil: '2033-06-12',
  },
  {
    id: 'aud-004',
    recordedAt: '2026-06-17T09:00:04Z',
    effectiveAt: '2026-06-17T09:00:00Z',
    actor: 'System (SLA engine)',
    action: 'Reminder sent (50%)',
    employeeName: 'Riya Sharma',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    company: 'Northwind Retail',
    detail: '50% SLA milestone reminder delivered with inbox deep link.',
    retainUntil: '2033-06-17',
  },
  {
    id: 'aud-005',
    recordedAt: '2026-06-19T09:20:47Z',
    effectiveAt: '2026-06-19T09:20:00Z',
    actor: 'Asha Verma (Company Admin)',
    action: 'Proxy acknowledgment',
    employeeName: 'Ramesh Yadav',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    company: 'Contoso Manufacturing',
    detail:
      'Recorded on behalf of non-user employee. Evidence: signed paper form at Pune Plant HR desk.',
    retainUntil: '2033-06-19',
  },
  {
    id: 'aud-006',
    recordedAt: '2026-06-25T00:00:06Z',
    effectiveAt: '2026-06-24T23:59:00Z',
    actor: 'System (SLA engine)',
    action: 'Escalation raised',
    employeeName: 'Vikram Singh',
    policyTitle: 'Code of Conduct',
    policyVersion: 'v3',
    company: 'Northwind Retail',
    detail:
      'Overdue at 100% SLA. Critical path: routed to manager + Company Admin via workflow engine.',
    retainUntil: '2033-06-25',
  },
  {
    id: 'aud-007',
    recordedAt: '2026-06-20T11:32:15Z',
    effectiveAt: '2026-06-20T11:32:00Z',
    actor: 'Asha Verma (Company Admin)',
    action: 'Distribution sent',
    employeeName: '— (4 recipients)',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v2',
    company: 'Multiple',
    detail: 'Scope: Engineering AND employment types via rules engine.',
    retainUntil: '2033-06-20',
  },
  {
    id: 'aud-008',
    recordedAt: '2026-06-22T09:55:22Z',
    effectiveAt: '2026-06-22T09:55:00Z',
    actor: 'Dev Patel',
    action: 'Acknowledged',
    employeeName: 'Dev Patel',
    policyTitle: 'Information Security Policy',
    policyVersion: 'v2',
    company: 'Contoso Manufacturing',
    detail: 'Self-service acknowledgment. Receipt rcpt-88214 issued.',
    retainUntil: '2033-06-22',
  },
  {
    id: 'aud-009',
    recordedAt: '2026-06-18T07:50:41Z',
    effectiveAt: '2026-06-18T07:50:00Z',
    actor: 'Priya Raman (Group Company Admin)',
    action: 'Bulk distribution completed',
    employeeName: '— (4 recipients, 2 failed)',
    policyTitle: 'Workplace Safety Handbook',
    policyVersion: 'v5',
    company: 'Contoso + Fabrikam',
    detail: 'Delivery summary: 2 delivered, 2 failed (retry available).',
    retainUntil: '2033-06-18',
  },
  {
    id: 'aud-010',
    recordedAt: '2026-06-25T14:00:29Z',
    effectiveAt: '2026-07-15T09:00:00Z',
    actor: 'Asha Verma (Company Admin)',
    action: 'Distribution scheduled',
    employeeName: '—',
    policyTitle: 'Prevention of Sexual Harassment (POSH)',
    policyVersion: 'v1',
    company: 'Northwind Retail',
    detail:
      'Queued for 15 Jul 2026 09:00. Editable/cancellable until send time (valid-time differs from record-time).',
    retainUntil: '2033-06-25',
  },
]
