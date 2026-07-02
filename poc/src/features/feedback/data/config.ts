/**
 * Governed, per-tenant configuration for the Feedback & Grievance module —
 * receiver routing, anonymous support, SLA thresholds, form schema and email
 * templates (FBG-13..15, FBG-21..29). Versioned in-memory for the POC.
 */

export const RECEIVER_ROLE_CATALOG = [
  'HR Manager',
  'HR Business Partner',
  'Department Head',
  'Ethics Officer',
  'Legal Counsel',
  'Compliance Officer',
  'People Ops Lead',
  'Wellbeing Officer',
] as const

export type FieldType = 'text' | 'textarea' | 'date'

export interface FormFieldDef {
  id: string
  label: string
  type: FieldType
  required: boolean
  /** Company-defined custom field (UDF) vs. platform base field. */
  custom: boolean
  active: boolean
}

export interface CategoryDef {
  name: string
  active: boolean
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  updatedOn: string
}

export interface ConfigVersion {
  version: number
  changedOn: string
  changedBy: string
  note: string
}

export interface FeedbackConfig {
  /** Per-tenant module toggle (FBG-13). */
  moduleEnabled: boolean
  /** "Do you support Anonymous Feedback / Grievance?" (FBG-21). */
  anonymousEnabled: boolean
  nonAnonymousReceivers: string[]
  anonymousReceivers: string[]
  /** Designated escalation owner (FBG-26). */
  coordinator: string | null
  /** Reminder to the approver after N days (FBG-24). */
  approverReminderDays: number
  /** Reminder to feedback coordinator after N days (FBG-25). */
  coordinatorReminderDays: number
  /** Roles authorized to view grievance information (FBG-15 / FBG-03). */
  accessRoles: string[]
  categories: CategoryDef[]
  formFields: FormFieldDef[]
  templates: EmailTemplate[]
  /** Bumped whenever the form schema changes (FBG-14). */
  schemaVersion: number
  versions: ConfigVersion[]
  /** Portfolio-level per-company provisioning (FBG-10). */
  companyProvisioning: Record<string, boolean>
}

export const seedConfig: FeedbackConfig = {
  moduleEnabled: true,
  anonymousEnabled: true,
  nonAnonymousReceivers: ['HR Manager', 'HR Business Partner'],
  anonymousReceivers: ['Ethics Officer'],
  coordinator: 'People Ops Lead',
  approverReminderDays: 3,
  coordinatorReminderDays: 7,
  accessRoles: ['HR Manager', 'HR Business Partner', 'Ethics Officer', 'People Ops Lead'],
  categories: [
    { name: 'Workplace Environment', active: true },
    { name: 'Manager Conduct', active: true },
    { name: 'Compensation & Benefits', active: true },
    { name: 'Policy Suggestion', active: true },
    { name: 'Harassment / Discrimination', active: true },
    { name: 'Facilities & IT', active: true },
    { name: 'Travel & Expenses', active: false },
  ],
  formFields: [
    { id: 'subject', label: 'Subject', type: 'text', required: true, custom: false, active: true },
    { id: 'description', label: 'Description', type: 'textarea', required: true, custom: false, active: true },
    { id: 'incidentDate', label: 'Date of incident', type: 'date', required: false, custom: true, active: true },
    { id: 'witnesses', label: 'Witnesses (if any)', type: 'text', required: false, custom: true, active: true },
    { id: 'desiredOutcome', label: 'Desired outcome', type: 'textarea', required: false, custom: true, active: true },
  ],
  templates: [
    {
      id: 'tmpl-ack',
      name: 'Submission acknowledgement',
      subject: 'We received your {{entry_type}} ({{entry_id}})',
      body: 'Hi {{recipient}},\n\nYour {{entry_type}} "{{subject}}" was recorded on {{date}} and routed for role-based review. You can track its status in the Feedback & Grievance module.\n\n— {{company}} HR',
      updatedOn: '2026-05-02',
    },
    {
      id: 'tmpl-status',
      name: 'Status change',
      subject: 'Update on {{entry_id}}: now {{status}}',
      body: 'Hi {{recipient}},\n\nThe status of your entry "{{subject}}" changed to {{status}} on {{date}}.\n\nReviewer note: {{note}}\n\n— {{company}} HR',
      updatedOn: '2026-05-02',
    },
    {
      id: 'tmpl-reminder',
      name: 'Approver reminder',
      subject: 'Action pending: {{entry_id}} awaits your review',
      body: 'Hi {{approver}},\n\nEntry {{entry_id}} ("{{subject}}") has been awaiting action for {{days}} days. Please review it to keep within the configured SLA.\n\n— Feedback & Grievance workflow',
      updatedOn: '2026-05-14',
    },
    {
      id: 'tmpl-escalation',
      name: 'Coordinator escalation',
      subject: 'Escalated: {{entry_id}} exceeded the approver SLA',
      body: 'Hi {{coordinator}},\n\nEntry {{entry_id}} received on {{received_date}} has had no approver action for {{days}} days and is escalated to you as the designated Feedback / Grievance Coordinator.\n\n— Feedback & Grievance workflow',
      updatedOn: '2026-05-14',
    },
  ],
  schemaVersion: 3,
  versions: [
    { version: 1, changedOn: '2026-04-18', changedBy: 'Meera Iyer', note: 'Module enabled for Aster Retail (Phase 1 scope).' },
    { version: 2, changedOn: '2026-05-02', changedBy: 'Meera Iyer', note: 'Receiver roles and SLA thresholds configured; templates published.' },
    { version: 3, changedOn: '2026-06-10', changedBy: 'Meera Iyer', note: 'Form schema v3: added "Witnesses" and "Desired outcome" custom fields.' },
  ],
  companyProvisioning: {
    'Aster Retail': true,
    'Aster Logistics': true,
    'Borealis Tech': true,
  },
}
