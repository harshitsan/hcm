/**
 * Notifications & Communications (FR 6.27) — core in-app notification and
 * per-channel delivery-record entities. Hand-written seed data; the in-memory
 * stores in hooks/ stand in for the real notification engine.
 */

export const CHANNELS = ['email', 'in-app', 'teams', 'whatsapp'] as const
export type Channel = (typeof CHANNELS)[number]

export const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  'in-app': 'In-app',
  teams: 'Microsoft Teams',
  whatsapp: 'WhatsApp',
}

/** Event categories the engine raises notifications for (FR 6.27.2). */
export const EVENT_TYPES = [
  { id: 'approval', label: 'Approval requests', critical: true },
  { id: 'escalation', label: 'Escalation alerts', critical: true },
  { id: 'workflow', label: 'Workflow status changes', critical: false },
  { id: 'reminder', label: 'Reminders', critical: false },
  { id: 'lifecycle', label: 'Lifecycle events', critical: false },
  { id: 'announcement', label: 'Announcements', critical: false },
  { id: 'task', label: 'Task alerts', critical: false },
  { id: 'digest', label: 'Digests & summaries', critical: false },
] as const

export type EventTypeId = (typeof EVENT_TYPES)[number]['id']

export const EVENT_TYPE_LABELS: Record<EventTypeId, string> =
  Object.fromEntries(EVENT_TYPES.map((e) => [e.id, e.label])) as Record<
    EventTypeId,
    string
  >

export interface AppNotification {
  id: string
  category: EventTypeId
  title: string
  body: string
  /** Item the notification points at — selecting it navigates to the record. */
  linkedItem: string
  requester?: string
  /** Escalation chain position, when the category is 'escalation'. */
  escalationLevel?: number
  createdAt: string
  read: boolean
}

export type AttemptStatus = 'delivered' | 'failed' | 'retrying' | 'pending'

export interface DeliveryAttempt {
  channel: Channel
  status: AttemptStatus
  timestamp: string
  error?: string
}

export type DeliveryFinalStatus =
  | 'delivered'
  | 'partially delivered'
  | 'failed'
  | 'dead-letter'
  | 'in progress'

/** Persisted, auditable notification + per-channel outcomes (NTF-18). */
export interface DeliveryRecord {
  id: string
  eventType: EventTypeId
  subject: string
  recipient: string
  recipientType: 'user' | 'non-user'
  tenant: string
  templateVersion: string
  createdAt: string
  attempts: DeliveryAttempt[]
  finalStatus: DeliveryFinalStatus
}

export const seedNotifications: AppNotification[] = [
  {
    id: 'ntf-3001',
    category: 'approval',
    title: 'Leave request awaiting your approval',
    body: 'Priya Nair submitted a 3-day casual leave request (14–16 Jul) that requires your approval.',
    linkedItem: 'Leave request LR-2214',
    requester: 'Priya Nair',
    createdAt: '2026-07-02T09:42:00',
    read: false,
  },
  {
    id: 'ntf-3002',
    category: 'approval',
    title: 'Expense claim awaiting your approval',
    body: 'Marcus Lane submitted an expense claim of $412.80 for the Austin client visit.',
    linkedItem: 'Expense claim EXP-0981',
    requester: 'Marcus Lane',
    createdAt: '2026-07-02T08:15:00',
    read: false,
  },
  {
    id: 'ntf-3003',
    category: 'escalation',
    title: 'Escalation: timesheet approval overdue',
    body: 'Timesheet TS-4471 has been awaiting approval for 5 days and has escalated past its first threshold. Action required.',
    linkedItem: 'Timesheet TS-4471',
    requester: 'Theo Brooks',
    escalationLevel: 1,
    createdAt: '2026-07-01T18:00:00',
    read: false,
  },
  {
    id: 'ntf-3004',
    category: 'escalation',
    title: 'Escalation level 2: onboarding task unattended',
    body: 'Onboarding task “Issue laptop” for Sofia Reyes remains unattended after the first escalation; it has moved to the next recipient in the chain.',
    linkedItem: 'Onboarding task OB-118',
    escalationLevel: 2,
    createdAt: '2026-07-01T09:30:00',
    read: true,
  },
  {
    id: 'ntf-3005',
    category: 'workflow',
    title: 'Travel request approved',
    body: 'Your travel request to Bengaluru (20–24 Jul) moved from Pending Approval to Approved.',
    linkedItem: 'Travel request TR-0332',
    createdAt: '2026-06-30T16:20:00',
    read: false,
  },
  {
    id: 'ntf-3006',
    category: 'workflow',
    title: 'Grievance status changed to Under Review',
    body: 'Grievance GRV-051 that you raised has moved from Submitted to Under Review.',
    linkedItem: 'Grievance GRV-051',
    createdAt: '2026-06-30T11:05:00',
    read: true,
  },
  {
    id: 'ntf-3007',
    category: 'reminder',
    title: 'Attendance not recorded for yesterday',
    body: 'You have not recorded attendance for 01 Jul. Record your time to avoid a compliance gap.',
    linkedItem: 'Attendance — 01 Jul 2026',
    createdAt: '2026-07-02T07:00:00',
    read: false,
  },
  {
    id: 'ntf-3008',
    category: 'reminder',
    title: 'Timesheet submission due tomorrow',
    body: 'Your weekly timesheet for 22–28 Jun is due for submission by end of day tomorrow.',
    linkedItem: 'Timesheet TS-4478',
    createdAt: '2026-06-29T09:00:00',
    read: true,
  },
  {
    id: 'ntf-3009',
    category: 'lifecycle',
    title: 'Role change effective 01 Aug',
    body: 'Your role changes from Senior Analyst to Team Lead effective 01 Aug 2026. Review your updated responsibilities.',
    linkedItem: 'Employee record — role change',
    createdAt: '2026-06-28T10:00:00',
    read: true,
  },
  {
    id: 'ntf-3010',
    category: 'lifecycle',
    title: 'New joiner in your team',
    body: 'Sofia Reyes joins your team on 07 Jul. Pre-joining checklist items are assigned to you.',
    linkedItem: 'Onboarding — Sofia Reyes',
    createdAt: '2026-06-27T14:30:00',
    read: false,
  },
  {
    id: 'ntf-3011',
    category: 'announcement',
    title: 'New announcement: Annual town hall',
    body: 'The annual town hall is scheduled for 18 Jul, 3:00 PM in the main auditorium and on Teams.',
    linkedItem: 'Announcement ANN-207',
    createdAt: '2026-06-26T12:00:00',
    read: true,
  },
  {
    id: 'ntf-3012',
    category: 'task',
    title: 'Task overdue: submit self-appraisal',
    body: 'Your self-appraisal for the H1 review cycle passed its due date (30 Jun) and is now overdue.',
    linkedItem: 'Task TSK-887',
    createdAt: '2026-07-01T08:00:00',
    read: false,
  },
  {
    id: 'ntf-3013',
    category: 'digest',
    title: 'Daily digest — 30 Jun',
    body: 'Your daily digest: 2 workflow updates, 1 reminder and 1 announcement were consolidated for 30 Jun.',
    linkedItem: 'Digest 30 Jun 2026',
    createdAt: '2026-07-01T07:00:00',
    read: true,
  },
]

/**
 * Direct reports' notifications, readable by the reporting manager
 * ("Option for the reporting manager to read the notifications of his/her
 * direct reports" — Kensium General Features, Notifications).
 */
export interface TeamNotification extends AppNotification {
  employee: string
}

export const seedTeamNotifications: TeamNotification[] = [
  {
    id: 'tntf-4001',
    employee: 'Priya Nair',
    category: 'workflow',
    title: 'Leave request LR-2214 pending with approver',
    body: 'Priya’s 3-day casual leave request (14–16 Jul) is awaiting reporting-manager approval.',
    linkedItem: 'Leave request LR-2214',
    createdAt: '2026-07-02T09:42:00',
    read: false,
  },
  {
    id: 'tntf-4002',
    employee: 'Priya Nair',
    category: 'reminder',
    title: 'Timesheet submission due tomorrow',
    body: 'Weekly timesheet for 29 Jun – 05 Jul is due for submission by end of day 10 Jul.',
    linkedItem: 'Timesheet TS-4490',
    createdAt: '2026-07-08T09:00:00',
    read: false,
  },
  {
    id: 'tntf-4003',
    employee: 'Theo Brooks',
    category: 'workflow',
    title: 'Attendance change request CR-118 submitted',
    body: 'Theo submitted a change request for a missed punch on 30 Jun; it is pending approval.',
    linkedItem: 'Attendance CR-118',
    createdAt: '2026-07-06T10:12:00',
    read: true,
  },
  {
    id: 'tntf-4004',
    employee: 'Marcus Lane',
    category: 'workflow',
    title: 'Travel request TR-0339 approved',
    body: 'Marcus’s travel request to Chicago (27–29 Jul) moved from Pending Approval to Approved.',
    linkedItem: 'Travel request TR-0339',
    createdAt: '2026-07-05T16:40:00',
    read: false,
  },
  {
    id: 'tntf-4005',
    employee: 'Liam Patel',
    category: 'task',
    title: 'Task overdue: update onboarding checklist',
    body: 'Task TSK-2001 assigned to Liam passed its due date (06 Jul) and is now overdue.',
    linkedItem: 'Task TSK-2001',
    createdAt: '2026-07-07T08:00:00',
    read: true,
  },
]

export const seedDeliveries: DeliveryRecord[] = [
  {
    id: 'DLV-9001',
    eventType: 'approval',
    subject: 'Leave request awaiting your approval',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Leave Approval v3',
    createdAt: '2026-07-02T09:42:04',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-02T09:42:05' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-02T09:42:04' },
    ],
    finalStatus: 'delivered',
  },
  {
    id: 'DLV-9002',
    eventType: 'escalation',
    subject: 'Escalation: timesheet approval overdue',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Escalation Alert v2',
    createdAt: '2026-07-01T18:00:02',
    attempts: [
      { channel: 'teams', status: 'failed', timestamp: '2026-07-01T18:00:03', error: 'Connector timeout (504)' },
      { channel: 'email', status: 'delivered', timestamp: '2026-07-01T18:00:09' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-01T18:00:02' },
    ],
    finalStatus: 'delivered',
  },
  {
    id: 'DLV-9003',
    eventType: 'lifecycle',
    subject: 'Welcome to Northwind — your joining details',
    recipient: 'sofia.reyes@gmail.com',
    recipientType: 'non-user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Employee Joining v1',
    createdAt: '2026-06-27T14:30:10',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-06-27T14:30:12' },
    ],
    finalStatus: 'delivered',
  },
  {
    id: 'DLV-9004',
    eventType: 'workflow',
    subject: 'Travel request approved',
    recipient: 'marcus.lane@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Travel Approval v2',
    createdAt: '2026-06-30T16:20:03',
    attempts: [
      { channel: 'whatsapp', status: 'retrying', timestamp: '2026-06-30T16:21:00', error: 'Rate limited — retry 2/3 (backoff 60s)' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-06-30T16:20:03' },
      { channel: 'email', status: 'delivered', timestamp: '2026-06-30T16:20:05' },
    ],
    finalStatus: 'partially delivered',
  },
  {
    id: 'DLV-9005',
    eventType: 'reminder',
    subject: 'Attendance not recorded for 01 Jul',
    recipient: 'theo.brooks@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Attendance Reminder v1',
    createdAt: '2026-07-02T07:00:01',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-02T07:00:03' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-02T07:00:01' },
    ],
    finalStatus: 'delivered',
  },
  {
    id: 'DLV-9006',
    eventType: 'lifecycle',
    subject: 'Exit checklist and final settlement details',
    recipient: 'owen.clarke@outlook.com',
    recipientType: 'non-user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Exit Notification v2',
    createdAt: '2026-06-25T10:15:00',
    attempts: [
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T10:15:02', error: 'Mailbox unavailable (550)' },
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T10:25:02', error: 'Mailbox unavailable (550) — retry 1/3' },
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T10:45:02', error: 'Mailbox unavailable (550) — retry 2/3' },
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T11:25:02', error: 'Mailbox unavailable (550) — retry 3/3, exhausted' },
    ],
    finalStatus: 'dead-letter',
  },
  {
    id: 'DLV-9007',
    eventType: 'announcement',
    subject: 'New announcement: Annual town hall',
    recipient: 'all-employees@northwind (412 recipients)',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Announcement Alert v4',
    createdAt: '2026-06-26T12:00:05',
    attempts: [
      { channel: 'in-app', status: 'delivered', timestamp: '2026-06-26T12:00:05' },
      { channel: 'email', status: 'delivered', timestamp: '2026-06-26T12:00:41' },
    ],
    finalStatus: 'delivered',
  },
  {
    id: 'DLV-9008',
    eventType: 'digest',
    subject: 'Daily digest — 30 Jun',
    recipient: 'priya.nair@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Daily Digest v1',
    createdAt: '2026-07-01T07:00:00',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-01T07:00:06' },
    ],
    finalStatus: 'delivered',
  },
  {
    id: 'DLV-9009',
    eventType: 'approval',
    subject: 'Offer approval required — Frontend Engineer',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Offer Approval v2',
    createdAt: '2026-06-29T15:40:00',
    attempts: [
      { channel: 'teams', status: 'failed', timestamp: '2026-06-29T15:40:02', error: 'Invalid connector credentials (401)' },
      { channel: 'email', status: 'delivered', timestamp: '2026-06-29T15:40:08' },
    ],
    finalStatus: 'delivered',
  },
  {
    id: 'DLV-9010',
    eventType: 'task',
    subject: 'Task overdue: submit self-appraisal',
    recipient: 'yuki.tanaka@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Overdue Task v1',
    createdAt: '2026-07-01T08:00:00',
    attempts: [
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-01T08:00:01' },
      { channel: 'email', status: 'pending', timestamp: '2026-07-01T08:00:01' },
    ],
    finalStatus: 'in progress',
  },
]
