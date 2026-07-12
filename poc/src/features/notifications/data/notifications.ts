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
  | 'retrying'
  | 'sent via fallback'
  | 'held'
  | 'dead-letter'
  | 'in progress'

/** Event-driven dispatch vs scheduler-driven digests/summaries (NTF-08/09). */
export type OutboxModel = 'event-driven' | 'scheduled'

export const OUTBOX_MODEL_LABELS: Record<OutboxModel, string> = {
  'event-driven': 'Event-driven',
  scheduled: 'Scheduled',
}

/** Persisted, auditable notification + per-channel outcomes (NTF-18). */
export interface DeliveryRecord {
  id: string
  eventType: EventTypeId
  subject: string
  recipient: string
  recipientType: 'user' | 'non-user'
  tenant: string
  templateVersion: string
  /** Whether the engine sent this immediately on an event or on a schedule. */
  model: OutboxModel
  createdAt: string
  attempts: DeliveryAttempt[]
  finalStatus: DeliveryFinalStatus
  /** Rendered message body shown in the outbox detail view. */
  preview?: string
  /** Delivery-engine annotation, e.g. a quiet-hours hold or override. */
  note?: string
  /** Explicit engine timeline steps; when absent the view derives them from attempts. */
  timeline?: string[]
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
    model: 'event-driven',
    createdAt: '2026-07-02T09:42:04',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-02T09:42:05' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-02T09:42:04' },
    ],
    finalStatus: 'delivered',
    preview:
      'Hi Dana, Priya Nair submitted a 3-day casual leave request (14–16 Jul) that needs your approval. Open the request to approve or reject.',
  },
  {
    id: 'DLV-9002',
    eventType: 'escalation',
    subject: 'Escalation: timesheet approval overdue',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Escalation Alert v2',
    model: 'event-driven',
    createdAt: '2026-07-01T18:00:02',
    attempts: [
      { channel: 'teams', status: 'failed', timestamp: '2026-07-01T18:00:03', error: 'Connector timeout (504)' },
      { channel: 'email', status: 'delivered', timestamp: '2026-07-01T18:00:09' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-01T18:00:02' },
    ],
    finalStatus: 'sent via fallback',
    preview:
      'Timesheet TS-4471 has been awaiting approval for 5 days and has escalated past its first threshold. Action required.',
    timeline: [
      'Attempt 1 failed (Teams connector timeout)',
      'Fallback: delivered via email',
      'Also delivered in-app',
    ],
  },
  {
    id: 'DLV-9003',
    eventType: 'lifecycle',
    subject: 'Welcome to Northwind — your joining details',
    recipient: 'sofia.reyes@gmail.com',
    recipientType: 'non-user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Employee Joining v1',
    model: 'event-driven',
    createdAt: '2026-06-27T14:30:10',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-06-27T14:30:12' },
    ],
    finalStatus: 'delivered',
    preview:
      'Welcome aboard, Sofia! You join Northwind Retail Co. on 07 Jul. This email carries your joining checklist, reporting location and first-day schedule.',
  },
  {
    id: 'DLV-9004',
    eventType: 'workflow',
    subject: 'Travel request approved',
    recipient: 'marcus.lane@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Travel Approval v2',
    model: 'event-driven',
    createdAt: '2026-06-30T16:20:03',
    attempts: [
      { channel: 'whatsapp', status: 'retrying', timestamp: '2026-06-30T16:21:00', error: 'Rate limited — retry 2/3 (backoff 60s)' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-06-30T16:20:03' },
      { channel: 'email', status: 'delivered', timestamp: '2026-06-30T16:20:05' },
    ],
    finalStatus: 'partially delivered',
    preview:
      'Your travel request to Bengaluru (20–24 Jul) moved from Pending Approval to Approved. Bookings can now be raised.',
  },
  {
    id: 'DLV-9005',
    eventType: 'reminder',
    subject: 'Attendance not recorded for 01 Jul',
    recipient: 'theo.brooks@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Attendance Reminder v1',
    model: 'event-driven',
    createdAt: '2026-07-02T07:00:01',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-02T07:00:03' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-02T07:00:01' },
    ],
    finalStatus: 'delivered',
    preview:
      'Hi Theo, you have not recorded attendance for 01 Jul. Record your time to avoid a compliance gap.',
  },
  {
    id: 'DLV-9006',
    eventType: 'lifecycle',
    subject: 'Exit checklist and final settlement details',
    recipient: 'owen.clarke@outlook.com',
    recipientType: 'non-user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Exit Notification v2',
    model: 'event-driven',
    createdAt: '2026-06-25T10:15:00',
    attempts: [
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T10:15:02', error: 'Mailbox unavailable (550)' },
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T10:25:02', error: 'Mailbox unavailable (550) — retry 1/3' },
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T10:45:02', error: 'Mailbox unavailable (550) — retry 2/3' },
      { channel: 'email', status: 'failed', timestamp: '2026-06-25T11:25:02', error: 'Mailbox unavailable (550) — retry 3/3, exhausted' },
    ],
    finalStatus: 'dead-letter',
    preview:
      'Hi Owen, your exit checklist and final settlement summary are attached. Please review and acknowledge by 05 Jul.',
  },
  {
    id: 'DLV-9007',
    eventType: 'announcement',
    subject: 'New announcement: Annual town hall',
    recipient: 'all-employees@northwind (412 recipients)',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Announcement Alert v4',
    model: 'event-driven',
    createdAt: '2026-06-26T12:00:05',
    attempts: [
      { channel: 'in-app', status: 'delivered', timestamp: '2026-06-26T12:00:05' },
      { channel: 'email', status: 'delivered', timestamp: '2026-06-26T12:00:41' },
    ],
    finalStatus: 'delivered',
    preview:
      'The annual town hall is scheduled for 18 Jul, 3:00 PM in the main auditorium and on Teams. Agenda and joining details inside.',
  },
  {
    id: 'DLV-9008',
    eventType: 'digest',
    subject: 'Daily digest — 30 Jun',
    recipient: 'priya.nair@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Daily Digest v1',
    model: 'scheduled',
    createdAt: '2026-07-01T07:00:00',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-01T07:00:06' },
    ],
    finalStatus: 'delivered',
    preview:
      'Your daily digest for 30 Jun: 2 workflow updates, 1 reminder and 1 announcement, consolidated into one summary.',
  },
  {
    id: 'DLV-9009',
    eventType: 'approval',
    subject: 'Offer approval required — Frontend Engineer',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Offer Approval v2',
    model: 'event-driven',
    createdAt: '2026-06-29T15:40:00',
    attempts: [
      { channel: 'teams', status: 'failed', timestamp: '2026-06-29T15:40:02', error: 'Connector temporarily unavailable' },
      { channel: 'email', status: 'delivered', timestamp: '2026-06-29T15:40:08' },
    ],
    finalStatus: 'delivered',
    preview:
      'The offer for the Frontend Engineer requisition (REQ-114) is ready for your approval. Compensation details are in the attached summary.',
  },
  {
    id: 'DLV-9010',
    eventType: 'task',
    subject: 'Task overdue: submit self-appraisal',
    recipient: 'yuki.tanaka@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Overdue Task v1',
    model: 'event-driven',
    createdAt: '2026-07-01T08:00:00',
    attempts: [
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-01T08:00:01' },
      { channel: 'email', status: 'pending', timestamp: '2026-07-01T08:00:01' },
    ],
    finalStatus: 'in progress',
    preview:
      'Hi Yuki, your self-appraisal for the H1 review cycle passed its due date (30 Jun) and is now overdue. Submit it to keep the cycle on track.',
  },
  {
    id: 'DLV-9011',
    eventType: 'escalation',
    subject: 'Escalation: purchase approval PA-2087 unattended',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Escalation Alert v2',
    model: 'event-driven',
    createdAt: '2026-07-03T10:12:00',
    attempts: [
      { channel: 'teams', status: 'failed', timestamp: '2026-07-03T10:12:02', error: 'Teams unreachable' },
      { channel: 'teams', status: 'failed', timestamp: '2026-07-03T10:17:02', error: 'Teams unreachable — retry 2 failed' },
      { channel: 'email', status: 'delivered', timestamp: '2026-07-03T10:18:10' },
    ],
    finalStatus: 'sent via fallback',
    preview:
      'Purchase approval PA-2087 has been unattended for 3 days and escalated to you as the next approver in the chain.',
    timeline: [
      'Attempt 1 failed (Teams unreachable)',
      'Retry in 5 min',
      'Attempt 2 failed',
      'Fallback: delivered via email',
    ],
  },
  {
    id: 'DLV-9012',
    eventType: 'reminder',
    subject: 'Timesheet submission due tomorrow',
    recipient: 'priya.nair (WhatsApp +1 415 ••• 0182)',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Timesheet Reminder v2',
    model: 'event-driven',
    createdAt: '2026-07-09T09:00:00',
    attempts: [
      { channel: 'whatsapp', status: 'retrying', timestamp: '2026-07-09T09:01:10', error: 'Provider rate limited — retry 1/3 (next attempt in 5 min)' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-09T09:00:01' },
    ],
    finalStatus: 'retrying',
    preview:
      'Reminder: your weekly timesheet for 06–12 Jul is due for submission by end of day tomorrow.',
  },
  {
    id: 'DLV-9013',
    eventType: 'announcement',
    subject: 'Policy update: revised travel policy',
    recipient: 'liam.patel@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Announcement Alert v4',
    model: 'event-driven',
    createdAt: '2026-07-08T15:30:00',
    attempts: [
      { channel: 'email', status: 'failed', timestamp: '2026-07-08T15:30:04', error: 'Recipient mailbox full (552)' },
    ],
    finalStatus: 'failed',
    preview:
      'The travel policy was revised on 08 Jul: updated per-diem limits and a new pre-approval threshold for international travel.',
  },
  {
    id: 'DLV-9014',
    eventType: 'announcement',
    subject: 'Cafeteria menu for next week',
    recipient: 'theo.brooks@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Announcement Alert v4',
    model: 'event-driven',
    createdAt: '2026-07-11T22:30:00',
    attempts: [
      { channel: 'in-app', status: 'pending', timestamp: '2026-07-11T22:30:01' },
      { channel: 'email', status: 'pending', timestamp: '2026-07-11T22:30:01' },
    ],
    finalStatus: 'held',
    note: 'Held — quiet hours (delivers 07:00)',
    preview:
      'Next week’s cafeteria menu is out — including the new vegetarian counter starting Monday.',
    timeline: [
      'Generated 22:30 — inside the recipient’s quiet hours (22:00–07:00)',
      'Non-critical alert: held by the engine',
      'Scheduled to deliver at 07:00',
    ],
  },
  {
    id: 'DLV-9015',
    eventType: 'escalation',
    subject: 'Critical: payroll cutoff approval needed tonight',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Escalation Alert v2',
    model: 'event-driven',
    createdAt: '2026-07-11T23:05:00',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-11T23:05:04' },
      { channel: 'in-app', status: 'delivered', timestamp: '2026-07-11T23:05:01' },
    ],
    finalStatus: 'delivered',
    note: 'Critical alert — quiet hours overridden',
    preview:
      'Payroll batch PB-0712 needs sign-off before the 06:00 bank cutoff. Approve or reject tonight to avoid a payment delay.',
    timeline: [
      'Generated 23:05 — inside the recipient’s quiet hours (22:00–07:00)',
      'Critical alert: quiet hours overridden by policy',
      'Delivered via email and in-app immediately',
    ],
  },
  {
    id: 'DLV-9016',
    eventType: 'digest',
    subject: 'Weekly manager digest — week of 06 Jul',
    recipient: 'dana.whitfield@satellitehr.com',
    recipientType: 'user',
    tenant: 'Northwind Retail Co.',
    templateVersion: 'Weekly Manager Digest v1',
    model: 'scheduled',
    createdAt: '2026-07-06T08:00:00',
    attempts: [
      { channel: 'email', status: 'delivered', timestamp: '2026-07-06T08:00:09' },
    ],
    finalStatus: 'delivered',
    preview:
      'Your team last week: 3 approvals completed, 1 escalation resolved, 2 leave requests upcoming, and 1 overdue task.',
  },
]

/** Scheduler-driven digests waiting for their next run (NTF-09). */
export interface DigestQueueItem {
  id: string
  name: string
  cadence: string
  nextRunAt: string
  recipients: string
  contents: string
}

export const seedDigestQueue: DigestQueueItem[] = [
  {
    id: 'DGQ-01',
    name: 'Daily summary',
    cadence: 'Daily at 07:00',
    nextRunAt: '2026-07-13T07:00:00',
    recipients: 'All employees subscribed to daily digests',
    contents: 'Non-critical updates from the past day, consolidated per person',
  },
  {
    id: 'DGQ-02',
    name: 'Weekly manager digest',
    cadence: 'Mondays at 08:00',
    nextRunAt: '2026-07-13T08:00:00',
    recipients: 'Reporting managers',
    contents: 'Team approvals, leave, attendance exceptions and overdue tasks',
  },
]
