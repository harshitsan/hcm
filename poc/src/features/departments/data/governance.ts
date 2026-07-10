/* Governed, versioned configuration + bitemporal audit history. */

export const CUSTOM_FIELD_TYPES = ['text', 'select'] as const
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number]

/** Tenant-scoped custom field (UDF) on the department entity (DEPT-14). */
export interface CustomFieldDef {
  id: string
  label: string
  type: CustomFieldType
  required: boolean
  options: string[]
  version: number
  effectiveFrom: string
}

export const seedCustomFields: CustomFieldDef[] = [
  {
    id: 'cf-1',
    label: 'Cost Center Code',
    type: 'text',
    required: true,
    options: [],
    version: 2,
    effectiveFrom: '2026-01-01',
  },
  {
    id: 'cf-2',
    label: 'Budget Owner Email',
    type: 'text',
    required: false,
    options: [],
    version: 1,
    effectiveFrom: '2025-04-01',
  },
  {
    id: 'cf-3',
    label: 'Function Type',
    type: 'select',
    required: false,
    options: ['Core', 'Support', 'Shared Service'],
    version: 1,
    effectiveFrom: '2025-04-01',
  },
]

/** Department-keyed approver graph read by the workflow engine (DEPT-15/16). */
export interface ApproverGraph {
  id: string
  name: string
  keyDepartmentId: string
  useDepartmentHead: boolean
  cascadeToParents: boolean
  version: number
  effectiveFrom: string
  flagged: boolean
}

export const seedApproverGraphs: ApproverGraph[] = [
  {
    id: 'ag-1',
    name: 'Leave approvals',
    keyDepartmentId: 'DEP-0001',
    useDepartmentHead: true,
    cascadeToParents: true,
    version: 3,
    effectiveFrom: '2026-02-01',
    flagged: false,
  },
  {
    id: 'ag-2',
    name: 'Expense approvals',
    keyDepartmentId: 'DEP-0005',
    useDepartmentHead: true,
    cascadeToParents: false,
    version: 1,
    effectiveFrom: '2025-07-15',
    flagged: false,
  },
]

/** Decision-table row scoping a role assignment or policy to a department (DEPT-07/15/17). */
export interface ScopeRule {
  id: string
  kind: 'role' | 'policy'
  name: string
  departmentId: string
  cascade: boolean
  version: number
  flagged: boolean
}

export const seedScopeRules: ScopeRule[] = [
  { id: 'sr-1', kind: 'policy', name: 'Remote Work Policy', departmentId: 'DEP-0007', cascade: true, version: 2, flagged: false },
  { id: 'sr-2', kind: 'policy', name: 'Overtime Allowance', departmentId: 'DEP-0011', cascade: true, version: 1, flagged: false },
  { id: 'sr-3', kind: 'policy', name: 'Shift Meal Voucher', departmentId: 'DEP-0012', cascade: false, version: 1, flagged: false },
  { id: 'sr-4', kind: 'role', name: 'HR Manager role', departmentId: 'DEP-0002', cascade: true, version: 1, flagged: false },
  { id: 'sr-5', kind: 'role', name: 'Timesheet Approver role', departmentId: 'DEP-0011', cascade: true, version: 1, flagged: false },
]

/** Named rating set — a reusable list of score values for questions (IAQ-02). */
export interface RatingSet {
  id: string
  name: string
  values: string[]
}

export const seedRatingSets: RatingSet[] = [
  { id: 'rs-1', name: 'Standard 3-point', values: ['Average', 'Good', 'Excellent'] },
  {
    id: 'rs-2',
    name: '5-point scale',
    values: ['Poor', 'Fair', 'Average', 'Good', 'Excellent'],
  },
  { id: 'rs-3', name: 'Pass / Fail', values: ['Fail', 'Pass'] },
]

/** Interview assessment question scoped to departments (DEPT-32). */
export interface InterviewQuestion {
  id: string
  question: string
  departmentIds: string[]
  /** Checklist order the question renders in during interviews (IAQ-05). */
  order: number
  /** A written response must be captured by the interviewer (IAQ-03). */
  responseRequired: boolean
  /** A rating from the linked rating set must be selected (IAQ-03). */
  ratingRequired: boolean
  /** Named rating set used to score this question (IAQ-02). */
  ratingSetId: string | null
  flagged: boolean
}

export const seedInterviewQuestions: InterviewQuestion[] = [
  {
    id: 'iq-1',
    question: 'Describe a production incident you led to resolution.',
    departmentIds: ['DEP-0008', 'DEP-0009'],
    order: 1,
    responseRequired: true,
    ratingRequired: true,
    ratingSetId: 'rs-1',
    flagged: false,
  },
  {
    id: 'iq-2',
    question: 'How do you keep payroll compliant across states?',
    departmentIds: ['DEP-0004'],
    order: 2,
    responseRequired: false,
    ratingRequired: true,
    ratingSetId: 'rs-2',
    flagged: false,
  },
  {
    id: 'iq-3',
    question: 'Walk through your approach to warehouse safety audits.',
    departmentIds: ['DEP-0011', 'DEP-0012'],
    order: 3,
    responseRequired: true,
    ratingRequired: false,
    ratingSetId: null,
    flagged: false,
  },
]

export type NotificationEvent = 'head-assigned' | 'approval-routed' | 'membership-changed'

/** Tenant-scoped, versioned notification template (DEPT-20). */
export interface NotificationTemplate {
  id: string
  event: NotificationEvent
  name: string
  body: string
  version: number
}

export const seedNotificationTemplates: NotificationTemplate[] = [
  {
    id: 'nt-1',
    event: 'head-assigned',
    name: 'Department head assigned',
    body: 'Hi {{head}}, you are now the department head of {{department}}.',
    version: 2,
  },
  {
    id: 'nt-2',
    event: 'approval-routed',
    name: 'Approval pending',
    body: '{{approver}}, a request from {{employee}} ({{department}}) awaits your approval.',
    version: 1,
  },
  {
    id: 'nt-3',
    event: 'membership-changed',
    name: 'Department membership changed',
    body: '{{employee}} was {{action}} {{department}}.',
    version: 1,
  },
]

/** Bitemporal audit event: transaction time vs effective time (DEPT-13). */
export interface HistoryEvent {
  id: string
  /** Transaction time — when the fact was recorded. */
  recordedAt: string
  /** Effective time — when the fact was/is true. */
  effectiveFrom: string
  companyId: string
  entity: string
  action: string
  detail: string
}

export const seedHistory: HistoryEvent[] = [
  {
    id: 'h-1',
    recordedAt: '2025-04-01T10:12:00Z',
    effectiveFrom: '2025-04-01',
    companyId: 'co-aurora-retail',
    entity: 'DEP-0001 Corporate',
    action: 'created',
    detail: 'Initial org structure import.',
  },
  {
    id: 'h-2',
    recordedAt: '2025-09-14T08:40:00Z',
    effectiveFrom: '2025-09-01',
    companyId: 'co-aurora-retail',
    entity: 'DEP-0009 Platform Engineering',
    action: 'created',
    detail: 'Split out of Engineering as a level-4 department.',
  },
  {
    id: 'h-3',
    recordedAt: '2026-01-05T14:22:00Z',
    effectiveFrom: '2025-12-31',
    companyId: 'co-aurora-retail',
    entity: 'DEP-0014 Facilities',
    action: 'deactivated',
    detail: 'Backdated correction: dissolved at year end, recorded 5 days later.',
  },
  {
    id: 'h-4',
    recordedAt: '2026-02-01T09:05:00Z',
    effectiveFrom: '2026-02-01',
    companyId: 'co-aurora-retail',
    entity: 'DEP-0002 Human Resources',
    action: 'head changed',
    detail: 'Aarav Mehta designated department head (was vacant).',
  },
  {
    id: 'h-5',
    recordedAt: '2026-03-18T11:30:00Z',
    effectiveFrom: '2026-03-18',
    companyId: 'co-aurora-logistics',
    entity: 'DEP-0102 Fleet Maintenance',
    action: 'created',
    detail: 'Nested under Line Haul Operations.',
  },
]
