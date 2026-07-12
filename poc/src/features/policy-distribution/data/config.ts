import { type Criticality } from './policies'

/**
 * Platform-governed configuration for reminders, escalations, templates,
 * the re-acknowledgment decision table and module integrations.
 */

export interface ReminderRule {
  criticality: Criticality
  /** SLA percentage milestones at which reminders fire (default 50/75/100). */
  milestones: number[]
  enabled: boolean
}

export interface EscalationPath {
  id: string
  criticality: Criticality
  name: string
  /** Notified parties, in order, executed by the workflow engine. */
  route: string[]
  slaHoursToAct: number
}

export type TemplateKind = 'Reminder' | 'Escalation' | 'Receipt'

export interface NotificationTemplate {
  id: string
  kind: TemplateKind
  name: string
  version: number
  effectiveFrom: string
  subject: string
  /** Supports {{employeeName}} {{policyTitle}} {{dueDate}} {{inboxLink}} merge variables. */
  body: string
  /** Prior versions stay on record for in-flight sends. */
  superseded: boolean
}

export const REACK_TRIGGERS = [
  'Content change',
  'Periodic renewal',
  'Transfer',
  'Role change',
  'Regulatory update',
] as const
export type ReAckTrigger = (typeof REACK_TRIGGERS)[number]

export interface DecisionRule {
  id: string
  order: number
  trigger: ReAckTrigger
  scope: string
  enabled: boolean
  version: number
  effectiveFrom: string
}

export interface IntegrationSetting {
  id: string
  name: string
  description: string
  enabled: boolean
}

export const seedReminderRules: ReminderRule[] = [
  { criticality: 'Critical', milestones: [50, 75, 100], enabled: true },
  { criticality: 'High', milestones: [50, 75, 100], enabled: true },
  { criticality: 'Standard', milestones: [75, 100], enabled: true },
]

export const seedEscalationPaths: EscalationPath[] = [
  {
    id: 'esc-critical',
    criticality: 'Critical',
    name: 'Critical policy escalation',
    route: ['Direct manager', 'Company Admin', 'Group compliance officer'],
    slaHoursToAct: 24,
  },
  {
    id: 'esc-high',
    criticality: 'High',
    name: 'High criticality escalation',
    route: ['Direct manager', 'Company Admin'],
    slaHoursToAct: 72,
  },
  {
    id: 'esc-standard',
    criticality: 'Standard',
    name: 'Standard escalation',
    route: ['Direct manager'],
    slaHoursToAct: 120,
  },
]

export const seedTemplates: NotificationTemplate[] = [
  {
    id: 'tpl-reminder',
    kind: 'Reminder',
    name: 'Acknowledgment reminder',
    version: 2,
    effectiveFrom: '2026-05-01',
    subject: 'Reminder: “{{policyTitle}}” needs your acknowledgment',
    body: 'Hi {{employeeName}},\n\nThe policy “{{policyTitle}}” assigned to you is due on {{dueDate}}. Please review and acknowledge it before the deadline.\n\nOpen your policy inbox: {{inboxLink}}\n\n— HR Compliance, Meridian Holdings',
    superseded: false,
  },
  {
    id: 'tpl-reminder-v1',
    kind: 'Reminder',
    name: 'Acknowledgment reminder',
    version: 1,
    effectiveFrom: '2026-01-15',
    subject: 'Pending policy acknowledgment: {{policyTitle}}',
    body: 'Dear {{employeeName}}, please acknowledge {{policyTitle}} by {{dueDate}}. Link: {{inboxLink}}',
    superseded: true,
  },
  {
    id: 'tpl-escalation',
    kind: 'Escalation',
    name: 'Overdue escalation notice',
    version: 1,
    effectiveFrom: '2026-01-15',
    subject: 'Escalation: overdue acknowledgment for {{employeeName}}',
    body: '{{employeeName}} has not acknowledged “{{policyTitle}}” which was due on {{dueDate}}. Per the criticality mapping, this is now escalated to you for action.\n\nAssignment link: {{inboxLink}}',
    superseded: false,
  },
  {
    id: 'tpl-receipt',
    kind: 'Receipt',
    name: 'Acknowledgment receipt',
    version: 3,
    effectiveFrom: '2026-04-10',
    subject: 'Receipt — {{policyTitle}} acknowledged',
    body: 'This receipt confirms that {{employeeName}} acknowledged “{{policyTitle}}” on {{dueDate}}.\n\nThis record is retained for 7 years and is admissible as compliance evidence.\n\n— Meridian Holdings HR Compliance',
    superseded: false,
  },
]

export const seedDecisionRules: DecisionRule[] = [
  {
    id: 'dr-01',
    order: 1,
    trigger: 'Content change',
    scope: 'All employees holding an active acknowledgment of the changed policy',
    enabled: true,
    version: 3,
    effectiveFrom: '2026-05-20',
  },
  {
    id: 'dr-02',
    order: 2,
    trigger: 'Regulatory update',
    scope: 'All employees in affected jurisdictions',
    enabled: true,
    version: 2,
    effectiveFrom: '2026-03-01',
  },
  {
    id: 'dr-03',
    order: 3,
    trigger: 'Periodic renewal',
    scope: 'Employees whose renewal cycle has lapsed for the policy',
    enabled: true,
    version: 1,
    effectiveFrom: '2026-01-15',
  },
  {
    id: 'dr-04',
    order: 4,
    trigger: 'Transfer',
    scope: 'Transferred employee — policies mapped to the new placement',
    enabled: true,
    version: 2,
    effectiveFrom: '2026-04-12',
  },
  {
    id: 'dr-05',
    order: 5,
    trigger: 'Role change',
    scope: 'Employee — role-relevant policies only',
    enabled: false,
    version: 1,
    effectiveFrom: '2026-01-15',
  },
]

export const seedIntegrations: IntegrationSetting[] = [
  {
    id: 'int-lifecycle',
    name: 'Employee lifecycle',
    description:
      'Onboarding, transfer and role-change events automatically trigger armed distributions and re-acknowledgment rules.',
    enabled: true,
  },
  {
    id: 'int-workflow',
    name: 'Workflow engine',
    description:
      'Executes criticality-mapped escalation paths when acknowledgments pass 100% of their SLA.',
    enabled: true,
  },
  {
    id: 'int-tasks',
    name: 'Task / checklist module',
    description:
      'Creates a checklist item for each pending acknowledgment and completes it when the receipt is recorded.',
    enabled: true,
  },
]
