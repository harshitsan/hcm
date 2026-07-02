/**
 * Platform Administration — governed configuration domain (SYS-28, 33, 34,
 * 35, 36, 74, 76, 77). Versioned effective-dated config entries, per-company
 * webhooks, the workflow/approval queue and locale formats.
 */

export const CONFIG_KINDS = [
  'Role catalog',
  'Permission set',
  'Jurisdiction rule-pack',
  'Locale format',
  'Security policy',
  'UDF schema',
] as const
export type ConfigKind = (typeof CONFIG_KINDS)[number]

export interface ConfigEntry {
  id: string
  name: string
  kind: ConfigKind
  version: number
  effectiveFrom: string
  status: 'effective' | 'draft' | 'superseded'
  /** Owning tenant id, or null for platform-scoped config (SYS-35). */
  tenantId: string | null
}

export const UDF_TYPES = ['Text', 'Number', 'Date', 'Select'] as const
export type UdfType = (typeof UDF_TYPES)[number]

export const UDF_ENTITIES = ['Employee', 'Candidate', 'Document'] as const
export type UdfEntity = (typeof UDF_ENTITIES)[number]

export const WEBHOOK_EVENTS = [
  'Employee lifecycle',
  'Leave requests',
  'Attendance exceptions',
  'Workflow changes',
  'Document uploads',
] as const
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

export interface WebhookSubscription {
  id: string
  tenantId: string
  url: string
  events: WebhookEvent[]
  active: boolean
  lastDelivery: string | null
  lastStatus: 'delivered' | 'retrying' | null
}

export const WORKFLOW_TYPES = [
  'Employee lifecycle action',
  'Sensitive-field change',
  'Cross-company sharing',
] as const
export type WorkflowType = (typeof WORKFLOW_TYPES)[number]

export const WORKFLOW_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'returned',
] as const
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number]

export interface WorkflowItem {
  id: string
  type: WorkflowType
  subject: string
  requestedBy: string
  tenantCode: string
  status: WorkflowStatus
  submittedAt: string
}

export interface LocaleSettings {
  level: 'Company' | 'Jurisdiction'
  dateFormat: string
  numberFormat: string
  currency: string
  addressFormat: string
}

export const seedConfigEntries: ConfigEntry[] = [
  { id: 'cfg-01', name: 'Employee role catalog', kind: 'Role catalog', version: 4, effectiveFrom: '2026-04-01', status: 'effective', tenantId: null },
  { id: 'cfg-02', name: 'Contractor role catalog', kind: 'Role catalog', version: 2, effectiveFrom: '2026-02-15', status: 'effective', tenantId: null },
  { id: 'cfg-03', name: 'HR operations permission set', kind: 'Permission set', version: 6, effectiveFrom: '2026-05-20', status: 'effective', tenantId: null },
  { id: 'cfg-04', name: 'IN-KA jurisdiction rule-pack', kind: 'Jurisdiction rule-pack', version: 32, effectiveFrom: '2026-06-01', status: 'effective', tenantId: null },
  { id: 'cfg-05', name: 'SG jurisdiction rule-pack', kind: 'Jurisdiction rule-pack', version: 1, effectiveFrom: '2026-07-15', status: 'draft', tenantId: null },
  { id: 'cfg-06', name: 'Platform password policy', kind: 'Security policy', version: 9, effectiveFrom: '2026-03-11', status: 'effective', tenantId: null },
  { id: 'cfg-07', name: 'Aster locale formats (en-IN)', kind: 'Locale format', version: 3, effectiveFrom: '2026-01-05', status: 'effective', tenantId: 'co-01' },
  { id: 'cfg-08', name: 'UDF: PF / UAN number (Employee)', kind: 'UDF schema', version: 2, effectiveFrom: '2026-02-20', status: 'effective', tenantId: 'co-01' },
  { id: 'cfg-09', name: 'UDF: Visa status (Candidate)', kind: 'UDF schema', version: 1, effectiveFrom: '2026-05-02', status: 'effective', tenantId: 'co-01' },
  { id: 'cfg-10', name: 'Employee role catalog', kind: 'Role catalog', version: 3, effectiveFrom: '2025-11-10', status: 'superseded', tenantId: null },
]

export const seedWebhooks: WebhookSubscription[] = [
  {
    id: 'wh-01',
    tenantId: 'co-01',
    url: 'https://erp.aster.example/hooks/hr',
    events: ['Employee lifecycle', 'Workflow changes'],
    active: true,
    lastDelivery: '2026-06-26 18:12',
    lastStatus: 'delivered',
  },
  {
    id: 'wh-02',
    tenantId: 'co-01',
    url: 'https://slack.aster.example/hr-alerts',
    events: ['Leave requests', 'Attendance exceptions'],
    active: true,
    lastDelivery: '2026-06-27 07:55',
    lastStatus: 'retrying',
  },
  {
    id: 'wh-03',
    tenantId: 'co-03',
    url: 'https://dms.meridian.example/ingest',
    events: ['Document uploads'],
    active: false,
    lastDelivery: null,
    lastStatus: null,
  },
]

export const seedWorkflows: WorkflowItem[] = [
  { id: 'wf-01', type: 'Employee lifecycle action', subject: 'Promote Arjun Pillai → Staff Engineer', requestedBy: 'Kavya Raman', tenantCode: 'ASTER-IN', status: 'pending', submittedAt: '2026-06-24' },
  { id: 'wf-02', type: 'Sensitive-field change', subject: 'Bank account update — Ravi Annamalai', requestedBy: 'Self-service portal', tenantCode: 'MERIDIAN', status: 'pending', submittedAt: '2026-06-25' },
  { id: 'wf-03', type: 'Cross-company sharing', subject: 'Share Bengaluru — Whitefield Campus with ASTER-US', requestedBy: 'Group admin', tenantCode: 'ASTER-IN', status: 'pending', submittedAt: '2026-06-21' },
  { id: 'wf-04', type: 'Sensitive-field change', subject: 'Legal name correction — Gita Verghese', requestedBy: 'Self-service portal', tenantCode: 'SURYA', status: 'approved', submittedAt: '2026-06-12' },
  { id: 'wf-05', type: 'Employee lifecycle action', subject: 'Exit processing — Noel Fernandes', requestedBy: 'Dev Mistry', tenantCode: 'BLUEFERN', status: 'approved', submittedAt: '2026-06-02' },
]

export const defaultLocale: LocaleSettings = {
  level: 'Company',
  dateFormat: 'DD MMM YYYY',
  numberFormat: '1,23,456.78 (Indian grouping)',
  currency: 'INR ₹',
  addressFormat: 'Street / City / State / PIN',
}
