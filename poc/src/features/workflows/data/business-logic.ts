import type { Role } from '@/context/role-context'
import type { WorkflowDoc } from '../designer/core/model'
import { exitFlowDoc, seedDoc } from '../designer/core/seed'

/**
 * Business-logic artifact catalog (WFE-43 … WFE-49).
 *
 * Product thesis: every HRMS configuration screen — approver chains, rules,
 * custom forms, checklists, questionnaires, templates, alerts, settings — is
 * an ARTIFACT of one engine: authored once, attached to any module, and
 * enabled/disabled independently at every scope level. This generalizes
 * Kensium HRMS's 190 bespoke Configuration screens into a single catalog.
 */

/** Types authored in the form-based artifact builder. */
export const FORM_ARTIFACT_TYPES = [
  'approver-chain',
  'decision-rule',
  'custom-form',
  'checklist',
  'template',
  'alert',
  'setting',
  'category-list',
  'calendar',
] as const

export type FormArtifactType = (typeof FORM_ARTIFACT_TYPES)[number]

/** All types — `flow` is authored on the Designer canvas, not in the form. */
export const ARTIFACT_TYPES = [...FORM_ARTIFACT_TYPES, 'flow'] as const

export type ArtifactType = (typeof ARTIFACT_TYPES)[number]

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  'approver-chain': 'Approver chain',
  'decision-rule': 'Decision rule',
  'custom-form': 'Custom form',
  checklist: 'Checklist',
  template: 'Template',
  alert: 'Alert',
  setting: 'Setting',
  'category-list': 'Category list',
  calendar: 'Calendar',
  flow: 'Flow',
}

/** POC modules an artifact can attach to (WFE-44: any HRMS module). */
export const TARGET_MODULES = [
  'Leave Management',
  'Time & Attendance',
  'Recruitment',
  'Employees',
  'Employee Lifecycle',
  'Notifications',
  'HR Letters & Certificates',
  'Asset Management',
  'Custom Fields',
  'Data Management',
  'Policy Management',
  'Companies',
  'Self Service',
  'Feedback & Grievance',
  'Announcements',
  'Documents',
  'Locations',
  'Departments',
  'Positions',
  'Groups',
  'Roles & Security',
  'Authentication',
  'Platform Admin',
] as const

export type TargetModule = (typeof TARGET_MODULES)[number]

/** Tenant hierarchy levels an artifact is toggled at (WFE-47). */
export const SCOPE_LEVELS = [
  'platform',
  'portfolio',
  'group',
  'company',
] as const

export type ScopeLevel = (typeof SCOPE_LEVELS)[number]

export const SCOPE_LABELS: Record<ScopeLevel, string> = {
  platform: 'Platform',
  portfolio: 'Portfolio',
  group: 'Group company',
  company: 'Company',
}

/** Short pill labels for the catalog table scope column. */
export const SCOPE_SHORT: Record<ScopeLevel, string> = {
  platform: 'P',
  portfolio: 'PF',
  group: 'G',
  company: 'C',
}

/** Each scope level is toggled only by the admin who owns that level. */
export const SCOPE_TOGGLE_ROLE: Record<ScopeLevel, Role> = {
  platform: 'Platform Admin',
  portfolio: 'Portfolio Admin',
  group: 'Group Company Admin',
  company: 'Company Admin',
}

/** The scope level the active admin role governs ("enabled here"). */
export const ROLE_SCOPE: Partial<Record<Role, ScopeLevel>> = {
  'Platform Admin': 'platform',
  'Portfolio Admin': 'portfolio',
  'Group Company Admin': 'group',
  'Company Admin': 'company',
}

/**
 * Hierarchical effective state (WFE-47): an artifact is effectively active at
 * a level only when that level AND every ancestor level (platform → … →
 * level) are enabled. Toggles stay independent per level — each admin governs
 * their own switch — but activation cascades down the tenant hierarchy.
 */
export function isEffectivelyActive(
  scopes: Record<ScopeLevel, boolean>,
  level: ScopeLevel
): boolean {
  const idx = SCOPE_LEVELS.indexOf(level)
  return SCOPE_LEVELS.slice(0, idx + 1).every((l) => scopes[l])
}

/** The topmost disabled level preventing activation at `level`, if any. */
export function blockingLevel(
  scopes: Record<ScopeLevel, boolean>,
  level: ScopeLevel
): ScopeLevel | null {
  const idx = SCOPE_LEVELS.indexOf(level)
  for (const l of SCOPE_LEVELS.slice(0, idx + 1)) {
    if (!scopes[l]) return l
  }
  return null
}

/** Named roles resolvable as chain-step approvers. */
export const APPROVER_STEP_ROLES = [
  'Reporting Manager',
  'Department Head',
  'HR Director',
  'Finance Controller',
  'Operations Head',
  'Compliance Officer',
  'Recruitment Lead',
  'Hiring Manager',
  'Group HR Head',
  'CEO',
] as const

export const RULE_OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'contains'] as const

export type RuleOperator = (typeof RULE_OPERATORS)[number]

/** Outcomes a decision rule can apply on the target module (WFE-46). */
export const RULE_OUTCOMES = [
  'Approve route',
  'Flag for review',
  'Block',
  'Notify',
] as const

export type RuleOutcome = (typeof RULE_OUTCOMES)[number]

export const FORM_FIELD_TYPES = [
  'text',
  'number',
  'date',
  'select',
  'yesno',
] as const

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number]

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Select',
  yesno: 'Yes / No',
}

export const ALERT_CHANNELS = ['Email', 'In-app', 'SMS'] as const

export interface ChainStep {
  order: number
  approverRole: string
  slaHours: number
}

export interface RuleCondition {
  attribute: string
  operator: RuleOperator
  value: string
}

export interface FormFieldDef {
  label: string
  fieldType: FormFieldType
  required: boolean
  options?: string[]
}

export interface ChecklistItem {
  label: string
  mandatory: boolean
}

export interface CategoryItem {
  id: string
  label: string
  active: boolean
}

export const CALENDAR_TYPES = ['holiday', 'shift', 'business-hours'] as const
export type CalendarType = (typeof CALENDAR_TYPES)[number]

export const CALENDAR_TYPE_LABELS: Record<CalendarType, string> = {
  holiday: 'Holiday',
  shift: 'Shift pattern',
  'business-hours': 'Business hours',
}

export const CALENDAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export interface CalendarEntry {
  label: string
  date?: string         // holiday entries
  startTime?: string    // shift / business-hours
  endTime?: string      // shift / business-hours
  days?: string[]       // e.g. ['Mon','Tue','Wed']
}

/** Type-specific payload; `kind` always mirrors the artifact's `type`. */
export type ArtifactDefinition =
  | { kind: 'approver-chain'; steps: ChainStep[] }
  | { kind: 'decision-rule'; conditions: RuleCondition[]; outcome: RuleOutcome }
  | { kind: 'custom-form'; fields: FormFieldDef[] }
  | { kind: 'checklist'; items: ChecklistItem[] }
  | { kind: 'template'; body: string; channel?: 'Email' | 'In-app' | 'SMS'; event?: string; templateKind?: 'letter' | 'notification' }
  | { kind: 'alert'; trigger: string; channels: string[] }
  | { kind: 'setting'; key: string; value: string }
  | { kind: 'category-list'; items: CategoryItem[] }
  | { kind: 'calendar'; calendarType: CalendarType; entries: CalendarEntry[] }
  /** Canvas-authored process flow — the Designer's WorkflowDoc is the payload. */
  | { kind: 'flow'; doc: WorkflowDoc }

/** Version / enable / disable audit line (WFE-48). */
export interface ArtifactHistoryEntry {
  at: string
  actor: string
  event: string
}

/** A single attachment point — one module, optionally scoped to a submodule tab. */
export interface ArtifactAttachment {
  module: TargetModule
  submodule?: string   // submodule tab id from module registry; omitted = whole module
}

export interface Artifact {
  id: string
  name: string
  type: ArtifactType
  targetModule: TargetModule   // kept = home module
  description: string
  version: number
  /** Independent enable/disable per tenant scope level (WFE-47). */
  scopes: Record<ScopeLevel, boolean>
  definition: ArtifactDefinition
  updatedBy: string
  updatedAt: string
  history: ArtifactHistoryEntry[]
  attachments: ArtifactAttachment[]
}

/** Seed shape — attachments are optional; normalizeArtifact fills them in. */
export type SeedArtifact = Omit<Artifact, 'attachments'> & { attachments?: ArtifactAttachment[] }

export function normalizeArtifact(a: SeedArtifact): Artifact {
  return { ...a, attachments: a.attachments ?? [{ module: a.targetModule }] }
}

/**
 * 18 seed artifacts, each a real Kensium Configuration screen re-expressed as
 * an engine artifact attached to its POC module (WFE-43).
 */
export const seedArtifacts: SeedArtifact[] = [
  {
    id: 'bl-01',
    name: 'Time Off Approvers',
    type: 'approver-chain',
    targetModule: 'Leave Management',
    description:
      'Two-level approval chain applied to every time-off request before the balance is debited.',
    version: 3,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: {
      kind: 'approver-chain',
      steps: [
        { order: 1, approverRole: 'Reporting Manager', slaHours: 24 },
        { order: 2, approverRole: 'HR Director', slaHours: 48 },
      ],
    },
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-06-02',
    history: [
      { at: '2026-01-12 09:40', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-03-18 15:05', actor: 'Sunita Patil', event: 'Edited — v2 (added HR Director step)' },
      { at: '2026-06-02 11:22', actor: 'Sunita Patil', event: 'Edited — v3 (SLA tightened to 24 h)' },
    ],
  },
  {
    id: 'bl-02',
    name: 'Comp Off Approvers',
    type: 'approver-chain',
    targetModule: 'Time & Attendance',
    description:
      'Chain clearing comp-off credit requests raised against extra hours worked.',
    version: 1,
    scopes: { platform: false, portfolio: false, group: true, company: true },
    definition: {
      kind: 'approver-chain',
      steps: [
        { order: 1, approverRole: 'Reporting Manager', slaHours: 24 },
        { order: 2, approverRole: 'Operations Head', slaHours: 72 },
      ],
    },
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-04-30',
    history: [
      { at: '2026-04-30 10:14', actor: 'Arjun Mehta', event: 'Created v1 — enabled at Group company, Company' },
    ],
  },
  {
    id: 'bl-03',
    name: 'Attendance Rule',
    type: 'decision-rule',
    targetModule: 'Time & Attendance',
    description:
      'Flags shortfall days: worked hours under 8 with no approved leave get flagged for regularization.',
    version: 2,
    scopes: { platform: false, portfolio: false, group: false, company: true },
    definition: {
      kind: 'decision-rule',
      conditions: [
        { attribute: 'workedHours', operator: '<', value: '8' },
        { attribute: 'approvedLeave', operator: '=', value: 'No' },
      ],
      outcome: 'Flag for review',
    },
    updatedBy: 'David Kim',
    updatedAt: '2026-05-21',
    history: [
      { at: '2026-02-09 12:31', actor: 'Sunita Patil', event: 'Created v1 — enabled at Company' },
      { at: '2026-05-21 09:02', actor: 'David Kim', event: 'Edited — v2 (leave exemption condition added)' },
    ],
  },
  {
    id: 'bl-04',
    name: 'Work From Home Settings',
    type: 'setting',
    targetModule: 'Time & Attendance',
    description:
      'Monthly cap on WFH days an employee may book without director sign-off.',
    version: 2,
    scopes: { platform: true, portfolio: true, group: false, company: true },
    definition: { kind: 'setting', key: 'wfh.maxDaysPerMonth', value: '8' },
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-03-19',
    history: [
      { at: '2025-12-01 14:20', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-02-27 16:44', actor: 'Arjun Mehta', event: 'Disabled at Group company' },
      { at: '2026-03-19 10:08', actor: 'Sunita Patil', event: 'Edited — v2 (cap raised from 6 to 8)' },
    ],
  },
  {
    id: 'bl-05',
    name: 'Exit Questionnaire',
    type: 'custom-form',
    targetModule: 'Employee Lifecycle',
    description:
      'Structured exit interview captured before the last working day; feeds attrition analytics.',
    version: 4,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: {
      kind: 'custom-form',
      fields: [
        { label: 'Primary reason for leaving', fieldType: 'select', required: true, options: ['Compensation', 'Career growth', 'Relocation', 'Manager', 'Other'] },
        { label: 'Would you rejoin?', fieldType: 'yesno', required: true },
        { label: 'Rate your onboarding (1-10)', fieldType: 'number', required: false },
        { label: 'What could we have done better?', fieldType: 'text', required: false },
      ],
    },
    updatedBy: 'Priya Menon',
    updatedAt: '2026-05-27',
    history: [
      { at: '2025-10-06 09:15', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-01-22 13:37', actor: 'Priya Menon', event: 'Edited — v3 (rejoin question added)' },
      { at: '2026-05-27 15:51', actor: 'Priya Menon', event: 'Edited — v4 (onboarding rating added)' },
    ],
  },
  {
    id: 'bl-06',
    name: 'Exit Tasks',
    type: 'checklist',
    targetModule: 'Employee Lifecycle',
    description:
      'Clearance checklist that must complete before final settlement is released.',
    version: 2,
    scopes: { platform: false, portfolio: true, group: true, company: true },
    definition: {
      kind: 'checklist',
      items: [
        { label: 'Return laptop and access card', mandatory: true },
        { label: 'Knowledge-transfer sign-off', mandatory: true },
        { label: 'Clear pending expense claims', mandatory: true },
        { label: 'Alumni network opt-in', mandatory: false },
      ],
    },
    updatedBy: 'Elena Garcia',
    updatedAt: '2026-04-08',
    history: [
      { at: '2025-11-14 11:00', actor: 'Devika Rao', event: 'Created v1 — enabled at Portfolio' },
      { at: '2026-04-08 17:26', actor: 'Elena Garcia', event: 'Edited — v2 (expense clearance added)' },
    ],
  },
  {
    id: 'bl-07',
    name: 'Employee Joining Checklist',
    type: 'checklist',
    targetModule: 'Employees',
    description:
      'Day-one onboarding items tracked on the new joiner profile.',
    version: 1,
    scopes: { platform: false, portfolio: false, group: true, company: true },
    definition: {
      kind: 'checklist',
      items: [
        { label: 'Collect signed offer and ID proofs', mandatory: true },
        { label: 'Issue laptop and workspace', mandatory: true },
        { label: 'Payroll and bank details captured', mandatory: true },
        { label: 'Team introduction scheduled', mandatory: false },
      ],
    },
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-02-11',
    history: [
      { at: '2026-02-11 10:45', actor: 'Sunita Patil', event: 'Created v1 — enabled at Group company, Company' },
    ],
  },
  {
    id: 'bl-08',
    name: 'Interview Rounds',
    type: 'setting',
    targetModule: 'Recruitment',
    description:
      'Number of interview rounds each requisition runs before an offer decision.',
    version: 1,
    scopes: { platform: true, portfolio: false, group: false, company: true },
    definition: { kind: 'setting', key: 'recruitment.interviewRounds', value: '3' },
    updatedBy: 'Platform Ops',
    updatedAt: '2026-01-05',
    history: [
      { at: '2026-01-05 08:55', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform, Company' },
    ],
  },
  {
    id: 'bl-09',
    name: 'Interview Panels',
    type: 'approver-chain',
    targetModule: 'Recruitment',
    description:
      'Ordered interviewer panel each candidate progresses through per round.',
    version: 2,
    scopes: { platform: false, portfolio: true, group: true, company: true },
    definition: {
      kind: 'approver-chain',
      steps: [
        { order: 1, approverRole: 'Recruitment Lead', slaHours: 48 },
        { order: 2, approverRole: 'Hiring Manager', slaHours: 48 },
        { order: 3, approverRole: 'Department Head', slaHours: 72 },
      ],
    },
    updatedBy: 'Devika Rao',
    updatedAt: '2026-05-09',
    history: [
      { at: '2026-03-02 09:30', actor: 'Devika Rao', event: 'Created v1 — enabled at Portfolio' },
      { at: '2026-05-09 14:12', actor: 'Devika Rao', event: 'Edited — v2 (department head round added)' },
    ],
  },
  {
    id: 'bl-10',
    name: 'Offer Approvers',
    type: 'approver-chain',
    targetModule: 'Recruitment',
    description:
      'Compensation sign-off chain every offer clears before release to the candidate.',
    version: 3,
    scopes: { platform: true, portfolio: true, group: false, company: true },
    definition: {
      kind: 'approver-chain',
      steps: [
        { order: 1, approverRole: 'Hiring Manager', slaHours: 24 },
        { order: 2, approverRole: 'Finance Controller', slaHours: 48 },
        { order: 3, approverRole: 'HR Director', slaHours: 24 },
      ],
    },
    updatedBy: 'Farhan Ali',
    updatedAt: '2026-06-15',
    history: [
      { at: '2025-09-20 10:10', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-02-14 12:00', actor: 'Farhan Ali', event: 'Edited — v2 (finance gate added)' },
      { at: '2026-06-15 09:47', actor: 'Farhan Ali', event: 'Edited — v3 (HR final sign-off added)' },
    ],
  },
  {
    id: 'bl-11',
    name: 'Confirmation Questions',
    type: 'custom-form',
    targetModule: 'Employee Lifecycle',
    description:
      'Probation-confirmation review form filled by the manager before confirmation is approved.',
    version: 1,
    scopes: { platform: false, portfolio: false, group: false, company: true },
    definition: {
      kind: 'custom-form',
      fields: [
        { label: 'Meets role expectations?', fieldType: 'yesno', required: true },
        { label: 'Performance rating', fieldType: 'select', required: true, options: ['Exceeds', 'Meets', 'Below'] },
        { label: 'Confirmation effective date', fieldType: 'date', required: true },
        { label: 'Development areas', fieldType: 'text', required: false },
      ],
    },
    updatedBy: 'Priya Menon',
    updatedAt: '2026-05-27',
    history: [
      { at: '2026-05-27 16:03', actor: 'Priya Menon', event: 'Created v1 — enabled at Company' },
    ],
  },
  {
    id: 'bl-12',
    name: 'User Defined Fields',
    type: 'custom-form',
    targetModule: 'Custom Fields',
    description:
      'Tenant-specific fields appended to the employee record without schema changes.',
    version: 5,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: {
      kind: 'custom-form',
      fields: [
        { label: 'Uniform size', fieldType: 'select', required: false, options: ['S', 'M', 'L', 'XL'] },
        { label: 'Forklift certified', fieldType: 'yesno', required: false },
        { label: 'Certification expiry', fieldType: 'date', required: false },
      ],
    },
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-06-20',
    history: [
      { at: '2025-08-11 09:00', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-04-17 10:26', actor: 'Arjun Mehta', event: 'Edited — v4 (forklift certification added)' },
      { at: '2026-06-20 13:58', actor: 'Arjun Mehta', event: 'Edited — v5 (expiry date field added)' },
    ],
  },
  {
    id: 'bl-13',
    name: 'Configure Alerts',
    type: 'alert',
    targetModule: 'Notifications',
    description:
      'Probation-ending alert to HR and the manager 15 days before the confirmation due date.',
    version: 2,
    scopes: { platform: true, portfolio: false, group: true, company: true },
    definition: {
      kind: 'alert',
      trigger: 'Probation ends in 15 days',
      channels: ['Email', 'In-app'],
    },
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-04-22',
    history: [
      { at: '2026-01-30 11:11', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-04-22 09:36', actor: 'Sunita Patil', event: 'Edited — v2 (in-app channel added)' },
    ],
  },
  {
    id: 'bl-14',
    name: 'Offer Letter Template',
    type: 'template',
    targetModule: 'HR Letters & Certificates',
    description:
      'Merge-field offer letter generated when an approved offer is released.',
    version: 3,
    scopes: { platform: true, portfolio: true, group: true, company: false },
    definition: {
      kind: 'template',
      body: 'Dear {{candidate.name}},\n\nWe are pleased to offer you the position of {{offer.designation}} at {{company.name}} with an annual CTC of {{offer.ctc}}. Your start date is {{offer.joiningDate}}.\n\nThis offer is valid until {{offer.expiryDate}}.\n\nSincerely,\n{{hr.signatory}}',
    },
    updatedBy: 'Devika Rao',
    updatedAt: '2026-03-14',
    history: [
      { at: '2025-07-19 15:40', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-03-14 10:52', actor: 'Devika Rao', event: 'Edited — v3 (validity clause added)' },
      { at: '2026-03-14 10:55', actor: 'Sunita Patil', event: 'Disabled at Company (local letterhead in use)' },
    ],
  },
  {
    id: 'bl-15',
    name: 'Asset Categories',
    type: 'setting',
    targetModule: 'Asset Management',
    description:
      'Category list assets are issued and tracked against.',
    version: 1,
    scopes: { platform: false, portfolio: false, group: true, company: true },
    definition: {
      kind: 'setting',
      key: 'assets.categories',
      value: 'Laptop, Monitor, Access Card, Mobile, Vehicle',
    },
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-02-25',
    history: [
      { at: '2026-02-25 12:19', actor: 'Arjun Mehta', event: 'Created v1 — enabled at Group company, Company' },
    ],
  },
  {
    id: 'bl-16',
    name: 'Policy Document',
    type: 'template',
    targetModule: 'Policy Management',
    description:
      'Standard policy shell (purpose, scope, applicability, review cadence) new policies start from.',
    version: 2,
    scopes: { platform: true, portfolio: true, group: false, company: false },
    definition: {
      kind: 'template',
      body: '# {{policy.title}}\n\n**Purpose:** {{policy.purpose}}\n\n**Scope:** Applies to {{policy.audience}} across {{company.name}}.\n\n**Policy statement:**\n{{policy.body}}\n\n**Review cycle:** {{policy.reviewCadence}} — owner {{policy.owner}}.',
    },
    updatedBy: 'Devika Rao',
    updatedAt: '2026-01-18',
    history: [
      { at: '2025-06-30 09:25', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-01-18 14:41', actor: 'Devika Rao', event: 'Edited — v2 (review cadence section added)' },
    ],
  },
  {
    id: 'bl-17',
    name: 'Import Functions',
    type: 'setting',
    targetModule: 'Data Management',
    description:
      'Which bulk-import functions are exposed to company admins in the import wizard.',
    version: 1,
    scopes: { platform: true, portfolio: false, group: false, company: false },
    definition: {
      kind: 'setting',
      key: 'import.enabledFunctions',
      value: 'Employees, Attendance, Leave Balances, Assets',
    },
    updatedBy: 'Platform Ops',
    updatedAt: '2026-05-03',
    history: [
      { at: '2026-05-03 08:30', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
    ],
  },
  {
    id: 'bl-18',
    name: 'Localization Settings',
    type: 'setting',
    targetModule: 'Companies',
    description:
      'Default locale, currency and financial-year start applied to a company on creation.',
    version: 2,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: {
      kind: 'setting',
      key: 'company.localization',
      value: 'en-IN · INR · FY starts April',
    },
    updatedBy: 'Platform Ops',
    updatedAt: '2026-06-10',
    history: [
      { at: '2025-05-12 10:05', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-06-10 11:34', actor: 'Platform Ops', event: 'Edited — v2 (currency default corrected)' },
    ],
  },
  {
    // Author → Govern → Consume, closed out of the box: this flow was
    // authored on the Designer canvas and published into the catalog.
    id: 'bl-19',
    name: 'Leave Approval — Standard',
    type: 'flow',
    targetModule: 'Leave Management',
    description:
      'Canvas-authored flow: leave request → manager approval → approved/rejected branches (notify + balance update).',
    version: 1,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: { kind: 'flow', doc: seedDoc() },
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-07-04',
    history: [
      { at: '2026-07-04 12:00', actor: 'Sunita Patil', event: 'Published from Designer — v1' },
    ],
  },
  {
    // Cross-module orchestration: one Employee Lifecycle event drives
    // changes in Asset Management, Leave Management and HR Letters.
    id: 'bl-20',
    name: 'Exit Orchestration — Cross-module',
    type: 'flow',
    targetModule: 'Employee Lifecycle',
    description:
      'Exit initiated → HR approval → updates Asset Management (collection) + Leave Management (encashment) + HR Letters (relieving letter) → notifies the manager.',
    version: 1,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: { kind: 'flow', doc: exitFlowDoc() },
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-07-05',
    history: [
      { at: '2026-07-05 10:30', actor: 'Sunita Patil', event: 'Published from Designer — v1' },
    ],
  },

  // ── category-list seeds ──────────────────────────────────────────────────
  {
    id: 'bl-21',
    name: 'Leave Types',
    type: 'category-list',
    targetModule: 'Leave Management',
    description:
      'Canonical leave types configured for the organisation — used as pick-list values across leave requests and balance screens.',
    version: 2,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: {
      kind: 'category-list',
      items: [
        { id: 'lt-01', label: 'Annual Leave', active: true },
        { id: 'lt-02', label: 'Sick Leave', active: true },
        { id: 'lt-03', label: 'Casual Leave', active: true },
        { id: 'lt-04', label: 'Maternity Leave', active: true },
        { id: 'lt-05', label: 'Paternity Leave', active: true },
        { id: 'lt-06', label: 'Bereavement Leave', active: true },
        { id: 'lt-07', label: 'Unpaid Leave', active: false },
      ],
    },
    updatedBy: 'Sunita Patil',
    updatedAt: '2026-05-14',
    history: [
      { at: '2026-01-10 09:00', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-05-14 11:23', actor: 'Sunita Patil', event: 'Edited — v2 (Unpaid Leave deactivated)' },
    ],
  },
  {
    id: 'bl-22',
    name: 'Asset Categories',
    type: 'category-list',
    targetModule: 'Asset Management',
    description:
      'Category taxonomy for company-issued assets; new categories can be added without a schema change.',
    version: 1,
    scopes: { platform: false, portfolio: false, group: true, company: true },
    definition: {
      kind: 'category-list',
      items: [
        { id: 'ac-01', label: 'Laptop', active: true },
        { id: 'ac-02', label: 'Monitor', active: true },
        { id: 'ac-03', label: 'Access Card', active: true },
        { id: 'ac-04', label: 'Mobile Device', active: true },
        { id: 'ac-05', label: 'Vehicle', active: false },
        { id: 'ac-06', label: 'Peripheral (Keyboard / Mouse)', active: true },
      ],
    },
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-03-01',
    history: [
      { at: '2026-03-01 10:45', actor: 'Arjun Mehta', event: 'Created v1 — enabled at Group company, Company' },
    ],
  },
  {
    id: 'bl-23',
    name: 'Exit Reasons',
    type: 'category-list',
    targetModule: 'Employee Lifecycle',
    description:
      'Standardised exit-reason codes HR selects during offboarding; drives attrition analytics.',
    version: 3,
    scopes: { platform: true, portfolio: true, group: false, company: true },
    definition: {
      kind: 'category-list',
      items: [
        { id: 'er-01', label: 'Resignation', active: true },
        { id: 'er-02', label: 'Contract end', active: true },
        { id: 'er-03', label: 'Termination', active: true },
        { id: 'er-04', label: 'Retirement', active: true },
        { id: 'er-05', label: 'Absconding', active: true },
        { id: 'er-06', label: 'Death in service', active: true },
        { id: 'er-07', label: 'Transfer to group company', active: false },
      ],
    },
    updatedBy: 'Priya Menon',
    updatedAt: '2026-06-03',
    history: [
      { at: '2025-09-15 08:00', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-02-20 14:12', actor: 'Priya Menon', event: 'Edited — v2 (Absconding added)' },
      { at: '2026-06-03 09:55', actor: 'Priya Menon', event: 'Edited — v3 (Transfer deactivated)' },
    ],
  },
  {
    id: 'bl-24',
    name: 'Document Categories',
    type: 'category-list',
    targetModule: 'Documents',
    description:
      'Taxonomy used when uploading or classifying employee documents in the document vault.',
    version: 1,
    scopes: { platform: true, portfolio: false, group: false, company: true },
    definition: {
      kind: 'category-list',
      items: [
        { id: 'dc-01', label: 'Identity Proof', active: true },
        { id: 'dc-02', label: 'Educational Certificate', active: true },
        { id: 'dc-03', label: 'Offer Letter', active: true },
        { id: 'dc-04', label: 'Payslip', active: true },
        { id: 'dc-05', label: 'Appraisal Letter', active: true },
        { id: 'dc-06', label: 'NDA / Agreement', active: true },
        { id: 'dc-07', label: 'Medical Certificate', active: false },
      ],
    },
    updatedBy: 'Elena Garcia',
    updatedAt: '2026-04-17',
    history: [
      { at: '2026-04-17 11:30', actor: 'Elena Garcia', event: 'Created v1 — enabled at Platform, Company' },
    ],
  },

  // ── calendar seeds ───────────────────────────────────────────────────────
  {
    id: 'bl-25',
    name: 'National Holiday Calendar 2026',
    type: 'calendar',
    targetModule: 'Leave Management',
    description:
      'Gazetted public holidays for the financial year 2026; drives system-enforced leave credits and attendance marking.',
    version: 1,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: {
      kind: 'calendar',
      calendarType: 'holiday',
      entries: [
        { label: "New Year's Day", date: '2026-01-01' },
        { label: 'Republic Day', date: '2026-01-26' },
        { label: 'Holi', date: '2026-03-03' },
        { label: 'Good Friday', date: '2026-04-03' },
        { label: 'Independence Day', date: '2026-08-15' },
        { label: 'Gandhi Jayanti', date: '2026-10-02' },
        { label: 'Diwali', date: '2026-10-19' },
        { label: 'Christmas Day', date: '2026-12-25' },
      ],
    },
    updatedBy: 'Platform Ops',
    updatedAt: '2026-01-02',
    history: [
      { at: '2026-01-02 09:00', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
    ],
  },
  {
    id: 'bl-26',
    name: 'Standard Shift Pattern',
    type: 'calendar',
    targetModule: 'Time & Attendance',
    description:
      'Default 9-to-6 shift for office employees; used by attendance to compute worked-hours and overtime.',
    version: 2,
    scopes: { platform: false, portfolio: false, group: true, company: true },
    definition: {
      kind: 'calendar',
      calendarType: 'shift',
      entries: [
        { label: 'Day shift', startTime: '09:00', endTime: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        { label: 'Saturday half-day', startTime: '09:00', endTime: '13:00', days: ['Sat'] },
      ],
    },
    updatedBy: 'Arjun Mehta',
    updatedAt: '2026-04-01',
    history: [
      { at: '2026-01-15 10:00', actor: 'Arjun Mehta', event: 'Created v1 — enabled at Group company, Company' },
      { at: '2026-04-01 09:30', actor: 'Arjun Mehta', event: 'Edited — v2 (Saturday half-day shift added)' },
    ],
  },
  {
    id: 'bl-27',
    name: 'Support SLA Business Hours',
    type: 'calendar',
    targetModule: 'Feedback & Grievance',
    description:
      'Working-hours window used by the SLA engine to compute resolution clock time, excluding weekends.',
    version: 1,
    scopes: { platform: true, portfolio: false, group: false, company: true },
    definition: {
      kind: 'calendar',
      calendarType: 'business-hours',
      entries: [
        { label: 'Support window', startTime: '08:00', endTime: '20:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      ],
    },
    updatedBy: 'Platform Ops',
    updatedAt: '2026-02-10',
    history: [
      { at: '2026-02-10 08:45', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform, Company' },
    ],
  },

  // ── template seeds with optional fields ──────────────────────────────────
  {
    id: 'bl-28',
    name: 'Probation Confirmation Notification',
    type: 'template',
    targetModule: 'Notifications',
    description:
      'In-app and email notification sent to an employee when their probation confirmation is approved.',
    version: 1,
    scopes: { platform: true, portfolio: true, group: true, company: true },
    definition: {
      kind: 'template',
      body: 'Dear {{employee.name}},\n\nCongratulations! Your probation period has been successfully completed and your confirmation is approved effective {{confirmation.date}}.\n\nWelcome to the permanent team.\n\nHR Team',
      channel: 'In-app',
      event: 'probation.confirmed',
      templateKind: 'notification',
    },
    updatedBy: 'Priya Menon',
    updatedAt: '2026-03-05',
    history: [
      { at: '2026-03-05 14:00', actor: 'Priya Menon', event: 'Created v1 — enabled at Platform' },
    ],
  },
  {
    id: 'bl-29',
    name: 'Relieving Letter Template',
    type: 'template',
    targetModule: 'HR Letters & Certificates',
    description:
      'Formal relieving letter generated at the end of the exit workflow after all clearances are complete.',
    version: 2,
    scopes: { platform: true, portfolio: true, group: true, company: false },
    definition: {
      kind: 'template',
      body: 'To Whom It May Concern,\n\nThis is to certify that {{employee.name}} (Employee ID: {{employee.id}}) was employed with {{company.name}} as {{employee.designation}} from {{employee.joiningDate}} to {{employee.lastWorkingDay}}.\n\n{{employee.firstName}} has been relieved from their duties and has no dues pending with the organisation.\n\nWe wish {{employee.firstName}} all the best in their future endeavours.\n\nSincerely,\n{{hr.signatory}}\n{{company.name}}',
      channel: 'Email',
      event: 'exit.clearance.complete',
      templateKind: 'letter',
    },
    updatedBy: 'Devika Rao',
    updatedAt: '2026-05-20',
    history: [
      { at: '2026-01-08 10:00', actor: 'Platform Ops', event: 'Created v1 — enabled at Platform' },
      { at: '2026-05-20 15:40', actor: 'Devika Rao', event: 'Edited — v2 (no-dues clause updated)' },
    ],
  },
]
