import { type Channel, type EventTypeId } from './notifications'

/**
 * Channel, connector, delivery-model, alerts and preference configuration
 * (FR 6.27.1 / 6.27.3 / 6.27.5 + Kensium Configuration > HRMS > Alerts).
 */

export interface ChannelSetting {
  channel: Channel
  enabled: boolean
  /** Email is the always-on channel and can never be disabled (NTF-01). */
  mandatory: boolean
  /** Teams/WhatsApp only work through a connected connector (NTF-03). */
  requiresConnector: boolean
  description: string
}

export const seedChannelSettings: ChannelSetting[] = [
  {
    channel: 'email',
    enabled: true,
    mandatory: true,
    requiresConnector: false,
    description:
      'Email is the mandatory baseline channel. Always on — the guaranteed fallback for every recipient, including employees without HRMS access.',
  },
  {
    channel: 'in-app',
    enabled: true,
    mandatory: false,
    requiresConnector: false,
    description:
      'Optional. Real-time notifications inside the HRMS for users with application access.',
  },
  {
    channel: 'teams',
    enabled: true,
    mandatory: false,
    requiresConnector: true,
    description:
      'Optional. Delivered via the Microsoft Teams connector when connected by an admin.',
  },
  {
    channel: 'whatsapp',
    enabled: false,
    mandatory: false,
    requiresConnector: true,
    description:
      'Optional. Delivered via the WhatsApp Business connector when connected by an admin.',
  },
]

export interface Connector {
  id: 'teams' | 'whatsapp'
  name: string
  connected: boolean
  /** Workspace (Teams) or business number (WhatsApp) the connector points at. */
  target: string
  /** User-facing label for the target field in the Connect dialog. */
  targetLabel: string
  targetPlaceholder: string
  connectedAt: string | null
  lastTest: string | null
  lastTestResult: 'success' | 'failed' | null
}

export const seedConnectors: Connector[] = [
  {
    id: 'teams',
    name: 'Microsoft Teams',
    connected: true,
    target: 'northwind-hq (teams.microsoft.com)',
    targetLabel: 'Teams workspace',
    targetPlaceholder: 'e.g. northwind-hq',
    connectedAt: '2026-05-14T11:20:00',
    lastTest: '2026-06-29T15:40:02',
    lastTestResult: 'success',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    connected: false,
    target: '',
    targetLabel: 'WhatsApp business number',
    targetPlaceholder: 'e.g. +1 415 555 0100',
    connectedAt: null,
    lastTest: null,
    lastTestResult: null,
  },
]

export type DeliveryModel = 'event-driven' | 'digest'

export interface EventDeliverySetting {
  eventType: EventTypeId
  model: DeliveryModel
  /** Critical events stay event-driven and cannot be batched (NTF-17). */
  locked: boolean
}

export const seedEventDelivery: EventDeliverySetting[] = [
  { eventType: 'approval', model: 'event-driven', locked: true },
  { eventType: 'escalation', model: 'event-driven', locked: true },
  { eventType: 'workflow', model: 'event-driven', locked: false },
  { eventType: 'reminder', model: 'event-driven', locked: false },
  { eventType: 'lifecycle', model: 'digest', locked: false },
  { eventType: 'announcement', model: 'digest', locked: false },
  { eventType: 'task', model: 'event-driven', locked: false },
]

export interface DigestSchedule {
  frequency: 'daily' | 'weekly'
  time: string
  weekday: string
  skipEmpty: boolean
  lastRunAt: string | null
}

export const seedDigestSchedule: DigestSchedule = {
  frequency: 'daily',
  time: '07:00',
  weekday: 'Monday',
  skipEmpty: true,
  lastRunAt: '2026-07-01T07:00:00',
}

/** Kensium Alerts configuration (NTF-35..41), saved atomically. */
export interface AlertsConfig {
  moduleEnabled: boolean
  attendanceReminder: boolean
  announcementAlert: boolean
  pendingTaskAlert: boolean
  overdueTaskAlert: boolean
}

export const seedAlertsConfig: AlertsConfig = {
  moduleEnabled: true,
  attendanceReminder: true,
  announcementAlert: true,
  pendingTaskAlert: false,
  overdueTaskAlert: true,
}

export type Frequency = 'immediate' | 'daily' | 'weekly'

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  immediate: 'Immediate',
  daily: 'Daily digest',
  weekly: 'Weekly digest',
}

/** Modules a user can subscribe to, each with its own delivery frequency. */
export const SUBSCRIPTION_GROUPS = [
  { id: 'approvals', label: 'Approvals', critical: true },
  { id: 'leave', label: 'Leave', critical: false },
  { id: 'attendance', label: 'Attendance', critical: false },
  { id: 'lifecycle', label: 'Lifecycle', critical: false },
  { id: 'announcements', label: 'Announcements', critical: false },
  { id: 'documents', label: 'Documents', critical: false },
] as const

export type SubscriptionGroupId = (typeof SUBSCRIPTION_GROUPS)[number]['id']

export const SUBSCRIPTION_GROUP_LABELS: Record<SubscriptionGroupId, string> =
  Object.fromEntries(
    SUBSCRIPTION_GROUPS.map((g) => [g.id, g.label])
  ) as Record<SubscriptionGroupId, string>

export interface GroupSubscription {
  group: SubscriptionGroupId
  subscribed: boolean
  frequency: Frequency
}

/** Quiet hours suppress non-critical alerts; critical alerts always send. */
export interface QuietHours {
  enabled: boolean
  start: string
  end: string
}

/** Effective-dated user preference record (NTF-12, NTF-20). */
export interface PreferenceVersion {
  version: number
  channels: Channel[]
  groups: GroupSubscription[]
  quietHours: QuietHours
  effectiveFrom: string
  savedBy: string
}

export const seedPreferenceVersions: PreferenceVersion[] = [
  {
    version: 1,
    channels: ['email', 'in-app'],
    groups: [
      { group: 'approvals', subscribed: true, frequency: 'immediate' },
      { group: 'leave', subscribed: true, frequency: 'immediate' },
      { group: 'attendance', subscribed: true, frequency: 'immediate' },
      { group: 'lifecycle', subscribed: true, frequency: 'immediate' },
      { group: 'announcements', subscribed: true, frequency: 'immediate' },
      { group: 'documents', subscribed: true, frequency: 'immediate' },
    ],
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
    effectiveFrom: '2026-01-01',
    savedBy: 'System (default)',
  },
  {
    version: 2,
    channels: ['email', 'in-app'],
    groups: [
      { group: 'approvals', subscribed: true, frequency: 'immediate' },
      { group: 'leave', subscribed: true, frequency: 'immediate' },
      { group: 'attendance', subscribed: true, frequency: 'daily' },
      { group: 'lifecycle', subscribed: true, frequency: 'daily' },
      { group: 'announcements', subscribed: true, frequency: 'weekly' },
      { group: 'documents', subscribed: false, frequency: 'weekly' },
    ],
    quietHours: { enabled: true, start: '22:00', end: '07:00' },
    effectiveFrom: '2026-04-15',
    savedBy: 'Priya Nair',
  },
]

/** Portfolio → group → company cascade for oversight (NTF-15, NTF-16). */
export interface HierarchyRow {
  scope: string
  level: 'Portfolio' | 'Group' | 'Company'
  channelsInEffect: string
  templateSource: string
  overrides: string
}

export const hierarchyRows: HierarchyRow[] = [
  {
    scope: 'Meridian Holdings (portfolio)',
    level: 'Portfolio',
    channelsInEffect: 'Email (mandatory), In-app',
    templateSource: 'Portfolio default library',
    overrides: '—',
  },
  {
    scope: 'Northwind Group',
    level: 'Group',
    channelsInEffect: 'Email (mandatory), In-app, Teams',
    templateSource: 'Group branded templates',
    overrides: 'Employee Joining, Survey Notification',
  },
  {
    scope: 'Northwind Retail Co.',
    level: 'Company',
    channelsInEffect: 'Email (mandatory), In-app',
    templateSource: 'Company templates (inherits group)',
    overrides: 'Offer Approval (v2)',
  },
  {
    scope: 'Northwind Logistics Ltd.',
    level: 'Company',
    channelsInEffect: 'Email (mandatory), In-app, Teams',
    templateSource: 'Group branded templates',
    overrides: '—',
  },
  {
    scope: 'Aurora Foods Group',
    level: 'Group',
    channelsInEffect: 'Email (mandatory), In-app',
    templateSource: 'Portfolio default library',
    overrides: '—',
  },
]
