/**
 * Audit events, bitemporal version history, retention rules and error-code
 * reference for the Companies module (§8.1, §8.2, §9, COMP-FR-009).
 */

export const AUDIT_EVENT_TYPES = [
  'COMPANY_CREATED',
  'COMPANY_UPDATED',
  'COMPANY_STATUS_CHANGED',
  'COMPANY_ACCESSED',
  'CONFIG_CHANGED',
  'EXPORT_GENERATED',
  'CROSS_COMPANY_ACCESS',
] as const
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number]

export interface AuditEvent {
  id: string
  type: AuditEventType
  companyId: string
  companyName: string
  actor: string
  timestamp: string
  details: string
  outcome: 'success' | 'denied'
}

export type HistoryKind = 'profile' | 'lifecycle' | 'config'

/** One effective-dated change record (COMP-FR-009 / bitemporal history). */
export interface HistoryEntry {
  id: string
  companyId: string
  kind: HistoryKind
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
  effectiveDate: string
  reason: string | null
}

export interface RetentionRule {
  dataType: string
  retention: string
  postRetentionAction: string
}

/** §8.2 / COMP-FR-012, COMP-FR-013 — retention by data type. */
export const RETENTION_RULES: RetentionRule[] = [
  {
    dataType: 'Employee records',
    retention: '7 years after employee exit',
    postRetentionAction: 'Anonymize and archive',
  },
  {
    dataType: 'Transactional data',
    retention: '7 years',
    postRetentionAction: 'Archive to cold storage',
  },
  {
    dataType: 'Audit logs',
    retention: '7 years',
    postRetentionAction: 'Archive to compliance storage',
  },
  {
    dataType: 'Documents',
    retention: '7 years',
    postRetentionAction: 'Export and delete',
  },
  {
    dataType: 'Backup data',
    retention: '90 days',
    postRetentionAction: 'Purge',
  },
  {
    dataType: 'Deleted company records (soft-deleted)',
    retention: '90 days after deletion',
    postRetentionAction: 'Purge',
  },
]

export interface ErrorCodeRef {
  code: string
  httpStatus: string
  meaning: string
}

/** §9 — standardized company error codes. */
export const ERROR_CODES: ErrorCodeRef[] = [
  {
    code: 'COMP_001',
    httpStatus: '409 Conflict',
    meaning: 'Duplicate company legal name',
  },
  {
    code: 'COMP_002',
    httpStatus: '400 Bad Request',
    meaning: 'Invalid or unsupported jurisdiction',
  },
  {
    code: 'COMP_003',
    httpStatus: '404 Not Found',
    meaning: 'Company does not exist',
  },
  {
    code: 'COMP_004',
    httpStatus: '403 Forbidden',
    meaning: 'Operation attempted on a suspended company',
  },
  {
    code: 'COMP_005',
    httpStatus: '409 Conflict',
    meaning: 'Modification attempted on an inactive company',
  },
  {
    code: 'COMP_006',
    httpStatus: '409 Conflict',
    meaning: 'Duplicate registration number within jurisdiction',
  },
  {
    code: 'AUTH_001',
    httpStatus: '403 Forbidden',
    meaning: 'Unauthorized company access (tenant isolation)',
  },
]

export const seedAuditEvents: AuditEvent[] = [
  {
    id: 'ae-01',
    type: 'COMPANY_CREATED',
    companyId: 'c-12',
    companyName: 'Kestrel Renewables Private Limited',
    actor: 'priya.platform@satellitehr.com',
    timestamp: '2026-05-20T10:12:00Z',
    details:
      'Company created in Draft via wizard. Tenant schema + default security policies initialized.',
    outcome: 'success',
  },
  {
    id: 'ae-02',
    type: 'COMPANY_STATUS_CHANGED',
    companyId: 'c-05',
    companyName: 'Aurelia Wellness LLP',
    actor: 'priya.platform@satellitehr.com',
    timestamp: '2026-04-11T08:40:00Z',
    details:
      'active → suspended. Reason: subscription payment overdue 60 days. Admins notified; 30-min read-only grace applied.',
    outcome: 'success',
  },
  {
    id: 'ae-03',
    type: 'COMPANY_UPDATED',
    companyId: 'c-03',
    companyName: 'Bluegrain Foods Private Limited',
    actor: 'admin@bluegrainfoods.in',
    timestamp: '2026-03-02T14:05:00Z',
    details:
      'primaryEmail: hr@bluegrainfoods.in → people@bluegrainfoods.in',
    outcome: 'success',
  },
  {
    id: 'ae-04',
    type: 'CROSS_COMPANY_ACCESS',
    companyId: 'c-01',
    companyName: 'Meridian Technologies Private Limited',
    actor: 'admin@bluegrainfoods.in',
    timestamp: '2026-02-19T09:22:00Z',
    details:
      'JWT company claim (c-03) did not match requested company (c-01). Rejected with AUTH_001.',
    outcome: 'denied',
  },
  {
    id: 'ae-05',
    type: 'EXPORT_GENERATED',
    companyId: 'c-09',
    companyName: 'Sable & Frost Consulting Ltd.',
    actor: 'priya.platform@satellitehr.com',
    timestamp: '2025-12-01T16:30:00Z',
    details:
      'Inactivation export package generated (JSON/CSV + audit logs + documents). 7-year retention timer started.',
    outcome: 'success',
  },
  {
    id: 'ae-06',
    type: 'CONFIG_CHANGED',
    companyId: 'c-01',
    companyName: 'Meridian Technologies Private Limited',
    actor: 'admin@meridiantech.in',
    timestamp: '2025-11-14T11:00:00Z',
    details:
      'mfaRequired: inherited(false) → override(true); sessionTimeoutMins: inherited(30) → override(15). Config v3 → v4.',
    outcome: 'success',
  },
  {
    id: 'ae-07',
    type: 'COMPANY_ACCESSED',
    companyId: 'c-04',
    companyName: 'Northwind Logistics Inc.',
    actor: 'omar.portfolio@astrashared.com',
    timestamp: '2026-06-24T07:55:00Z',
    details: 'Company profile viewed via portfolio assignment (pf-01).',
    outcome: 'success',
  },
]

export const seedHistory: HistoryEntry[] = [
  {
    id: 'h-01',
    companyId: 'c-03',
    kind: 'profile',
    field: 'primaryEmail',
    oldValue: 'hr@bluegrainfoods.in',
    newValue: 'people@bluegrainfoods.in',
    changedBy: 'admin@bluegrainfoods.in',
    changedAt: '2026-03-02T14:05:00Z',
    effectiveDate: '2026-03-02',
    reason: 'HR shared mailbox migration',
  },
  {
    id: 'h-02',
    companyId: 'c-03',
    kind: 'profile',
    field: 'tradeName',
    oldValue: 'Bluegrain Foods',
    newValue: 'Bluegrain',
    changedBy: 'admin@bluegrainfoods.in',
    changedAt: '2025-09-15T10:20:00Z',
    effectiveDate: '2025-10-01',
    reason: 'Brand refresh',
  },
  {
    id: 'h-03',
    companyId: 'c-05',
    kind: 'lifecycle',
    field: 'status',
    oldValue: 'active',
    newValue: 'suspended',
    changedBy: 'priya.platform@satellitehr.com',
    changedAt: '2026-04-11T08:40:00Z',
    effectiveDate: '2026-04-11',
    reason: 'Subscription payment overdue 60 days',
  },
  {
    id: 'h-04',
    companyId: 'c-09',
    kind: 'lifecycle',
    field: 'status',
    oldValue: 'active',
    newValue: 'inactive',
    changedBy: 'priya.platform@satellitehr.com',
    changedAt: '2025-12-01T16:00:00Z',
    effectiveDate: '2025-11-30',
    reason: 'Company closure — merged into parent entity',
  },
  {
    id: 'h-05',
    companyId: 'c-01',
    kind: 'config',
    field: 'mfaRequired',
    oldValue: 'Inherited (Off)',
    newValue: 'Override (On)',
    changedBy: 'admin@meridiantech.in',
    changedAt: '2025-11-14T11:00:00Z',
    effectiveDate: '2025-11-14',
    reason: 'Security policy uplift',
  },
  {
    id: 'h-06',
    companyId: 'c-01',
    kind: 'profile',
    field: 'website',
    oldValue: 'https://meridian.in',
    newValue: 'https://meridiantech.in',
    changedBy: 'admin@meridiantech.in',
    changedAt: '2024-06-10T09:00:00Z',
    effectiveDate: '2024-06-10',
    reason: null,
  },
]
