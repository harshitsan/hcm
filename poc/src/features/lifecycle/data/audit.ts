/** Append-only, tenant-scoped lifecycle audit trail + templated notifications. */

export const LIFECYCLE_MODULES = [
  'Onboarding',
  'Probation',
  'Transfer',
  'Exit',
  'Disciplinary',
  'Performance Review',
  'Configuration',
  'Notification',
] as const

export type LifecycleModule = (typeof LIFECYCLE_MODULES)[number]

export interface AuditEvent {
  id: string
  timestamp: string
  /** Tenant / company scope for row-level-security style filtering. */
  company: string
  module: LifecycleModule
  action: string
  target: string
  actor: string
  actorRole: string
  outcome: string
  /** Set when an admin acted as proxy for a non-user employee. */
  onBehalfOf: string | null
}

export const seedAudit: AuditEvent[] = [
  {
    id: 'evt-9001',
    timestamp: '2026-06-28T10:12:00Z',
    company: 'Aurora Software India',
    module: 'Transfer',
    action: 'Approval granted (HR)',
    target: 'trf-3003 · Grace Obi',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: 'Awaiting Group Admin approval',
    onBehalfOf: null,
  },
  {
    id: 'evt-9002',
    timestamp: '2026-06-25T08:40:00Z',
    company: 'Aurora Software India',
    module: 'Onboarding',
    action: 'Offer accepted',
    target: 'onb-1007 · Tomás Silva',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: 'Stage advanced to Document Submission',
    onBehalfOf: 'Tomás Silva',
  },
  {
    id: 'evt-9003',
    timestamp: '2026-06-24T14:05:00Z',
    company: 'Aurora Software India',
    module: 'Probation',
    action: 'Decision submitted (Confirm)',
    target: 'prb-2002 · Meghna Iyer',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: 'Routed to Manager → Department Head → HR',
    onBehalfOf: null,
  },
  {
    id: 'evt-9004',
    timestamp: '2026-06-22T09:00:00Z',
    company: 'Aurora Software US',
    module: 'Exit',
    action: 'Exit request submitted',
    target: 'ext-4003 · Carlos Mendes',
    actor: 'Carlos Mendes',
    actorRole: 'Employee (User)',
    outcome: 'Pending approval · 90 day notice derived',
    onBehalfOf: null,
  },
  {
    id: 'evt-9005',
    timestamp: '2026-06-20T11:30:00Z',
    company: 'Aurora Software India',
    module: 'Configuration',
    action: 'Onboarding template published',
    target: 'Standard Joiner Checklist v2',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: 'Effective 2026-06-20 · in-flight cases keep v1',
    onBehalfOf: null,
  },
  {
    id: 'evt-9006',
    timestamp: '2026-06-14T16:22:00Z',
    company: 'Aurora Software India',
    module: 'Exit',
    action: 'Clearance initiated (parallel)',
    target: 'ext-4001 · Dev Malhotra',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: '4 functional clearance tasks issued',
    onBehalfOf: null,
  },
  {
    id: 'evt-9007',
    timestamp: '2026-06-07T10:00:00Z',
    company: 'Aurora Software India',
    module: 'Disciplinary',
    action: 'Warning letter issued',
    target: 'dsc-5001 · Nikhil Joshi',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: 'Letter generated from template DL-01',
    onBehalfOf: null,
  },
  {
    id: 'evt-9008',
    timestamp: '2026-06-01T04:30:00Z',
    company: 'Aurora Software India',
    module: 'Transfer',
    action: 'Transfer effective — assignment rewritten',
    target: 'trf-3004 · Sara Ali',
    actor: 'System (workflow engine)',
    actorRole: 'Platform Admin',
    outcome: 'New assignment record asg-02 · balances reconciled',
    onBehalfOf: null,
  },
  {
    id: 'evt-9009',
    timestamp: '2026-05-18T12:00:00Z',
    company: 'Aurora Software India',
    module: 'Exit',
    action: 'Exit finalized',
    target: 'ext-4002 · Ritika Bansal',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: 'All clearances complete · exit closed',
    onBehalfOf: null,
  },
  {
    id: 'evt-9010',
    timestamp: '2026-05-11T06:15:00Z',
    company: 'Aurora Software India',
    module: 'Onboarding',
    action: 'Induction completed',
    target: 'onb-1006 · Grace Obi',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: 'Onboarding workflow closed',
    onBehalfOf: null,
  },
  {
    id: 'evt-9011',
    timestamp: '2026-06-26T09:45:00Z',
    company: 'Helix Manufacturing',
    module: 'Onboarding',
    action: 'Onboarding initiated',
    target: 'onb-1003 · Sunil Patil',
    actor: 'Anita Desai',
    actorRole: 'Company Admin',
    outcome: '5 mandatory stages created from template v2',
    onBehalfOf: 'Sunil Patil',
  },
  {
    id: 'evt-9012',
    timestamp: '2026-06-27T07:20:00Z',
    company: 'Aurora Software India',
    module: 'Notification',
    action: 'Notification dispatched',
    target: 'Rohan Verma · Document Submission task',
    actor: 'System (notification engine)',
    actorRole: 'Platform Admin',
    outcome: 'Template ONB-TASK rendered and sent',
    onBehalfOf: null,
  },
]

export type NotificationKind = 'task' | 'approval' | 'reminder' | 'escalation'

export interface LifecycleNotification {
  id: string
  recipient: string
  kind: NotificationKind
  title: string
  body: string
  sentAt: string
}

export const seedNotifications: LifecycleNotification[] = [
  {
    id: 'ntf-01',
    recipient: 'Rohan Verma',
    kind: 'task',
    title: 'Onboarding task: Document Submission',
    body: 'Stage “Document Submission” requires 2 more documents. Open your onboarding to upload them.',
    sentAt: '2026-06-27T07:20:00Z',
  },
  {
    id: 'ntf-02',
    recipient: 'Rohan Verma',
    kind: 'reminder',
    title: 'Reminder: Government ID proof pending',
    body: 'Your required document “Government ID proof” is overdue by 2 days.',
    sentAt: '2026-06-29T07:00:00Z',
  },
  {
    id: 'ntf-03',
    recipient: 'Rohan Verma',
    kind: 'approval',
    title: 'Peer review requested',
    body: 'You have been nominated to review Ishaan Gupta’s confirmation. Due 03 Jul 2026.',
    sentAt: '2026-06-25T10:00:00Z',
  },
  {
    id: 'ntf-04',
    recipient: 'Anita Desai',
    kind: 'escalation',
    title: 'Escalation: Finance clearance overdue',
    body: 'Exit ext-4001 (Dev Malhotra) Finance clearance has been pending 10 days.',
    sentAt: '2026-06-26T06:00:00Z',
  },
]
