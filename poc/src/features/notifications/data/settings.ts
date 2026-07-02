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
  /** Teams/WhatsApp only work through a provisioned connector (NTF-03). */
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
      'Always-on. Used as the guaranteed fallback for every recipient, including employees without HRMS access.',
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
    enabled: false,
    mandatory: false,
    requiresConnector: true,
    description:
      'Optional. Delivered via the Microsoft Teams third-party connector when provisioned by the Platform Admin.',
  },
  {
    channel: 'whatsapp',
    enabled: false,
    mandatory: false,
    requiresConnector: true,
    description:
      'Optional. Delivered via the WhatsApp Business connector when provisioned by the Platform Admin.',
  },
]

export type CredentialStatus = 'valid' | 'invalid' | 'missing'

export interface Connector {
  id: 'teams' | 'whatsapp'
  name: string
  provisioned: boolean
  credentialStatus: CredentialStatus
  webhookUrl: string
  apiKey: string
  lastTest: string | null
  lastTestResult: 'success' | 'failed' | null
}

export const seedConnectors: Connector[] = [
  {
    id: 'teams',
    name: 'Microsoft Teams',
    provisioned: true,
    credentialStatus: 'invalid',
    webhookUrl: 'https://outlook.office.com/webhook/nw-hrms-alerts',
    apiKey: 'teams-key-••••7d21',
    lastTest: '2026-06-29T15:40:02',
    lastTestResult: 'failed',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    provisioned: false,
    credentialStatus: 'missing',
    webhookUrl: '',
    apiKey: '',
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

/** Effective-dated user preference record (NTF-12, NTF-20). */
export interface PreferenceVersion {
  version: number
  channels: Channel[]
  subscriptions: EventTypeId[]
  frequency: Frequency
  effectiveFrom: string
  savedBy: string
}

export const seedPreferenceVersions: PreferenceVersion[] = [
  {
    version: 1,
    channels: ['email', 'in-app'],
    subscriptions: [
      'approval',
      'escalation',
      'workflow',
      'reminder',
      'lifecycle',
      'announcement',
      'task',
    ],
    frequency: 'immediate',
    effectiveFrom: '2026-01-01',
    savedBy: 'System (default)',
  },
  {
    version: 2,
    channels: ['email', 'in-app'],
    subscriptions: [
      'approval',
      'escalation',
      'workflow',
      'reminder',
      'lifecycle',
      'task',
    ],
    frequency: 'daily',
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
