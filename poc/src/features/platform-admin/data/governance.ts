/**
 * Platform Administration — data governance domain (SYS-26, 37, 69, 70, 71).
 * Retention rules per data type, the terminated-record lifecycle with legal
 * holds and monthly purge, and data-subject-rights requests.
 */

export interface RetentionRule {
  id: string
  dataType: string
  retention: string
  note: string
}

export const LIFECYCLE_STAGES = [
  'account disabled',
  'active (exit processing)',
  'anonymized',
  'purged',
] as const
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number]

export interface LifecycleRecord {
  id: string
  person: string
  tenantCode: string
  terminatedOn: string
  stage: LifecycleStage
  legalHold: boolean
}

export const DSR_TYPES = ['Access', 'Rectification', 'Erasure'] as const
export type DsrType = (typeof DSR_TYPES)[number]

export const DSR_STATUSES = [
  'received',
  'identity verified',
  'in progress',
  'completed',
  'statutory exception',
] as const
export type DsrStatus = (typeof DSR_STATUSES)[number]

export interface DsrRequest {
  id: string
  requester: string
  type: DsrType
  detail: string
  /** Rectification only: sensitive fields route through approval (SYS-37). */
  sensitive: boolean
  submittedAt: string
  slaDue: string
  status: DsrStatus
}

export const seedRetentionRules: RetentionRule[] = [
  { id: 'ret-01', dataType: 'Active employee / contractor data', retention: 'Employment + 7 years', note: 'Applies per engagement' },
  { id: 'ret-02', dataType: 'Audit logs', retention: '1 year active + 6 years archived', note: 'Immutable, tenant-scoped' },
  { id: 'ret-03', dataType: 'Completed workflows', retention: '7 years', note: 'Approval history preserved' },
  { id: 'ret-04', dataType: 'Notifications', retention: '1 year', note: 'Includes webhook deliveries' },
  { id: 'ret-05', dataType: 'Rejected candidates', retention: '1 year', note: 'Then deleted' },
  { id: 'ret-06', dataType: 'Inactive candidates', retention: '6 months', note: 'Then deleted' },
]

export const seedLifecycleRecords: LifecycleRecord[] = [
  { id: 'lc-01', person: 'Noel Fernandes', tenantCode: 'BLUEFERN', terminatedOn: '2026-06-05', stage: 'active (exit processing)', legalHold: false },
  { id: 'lc-02', person: 'Farida Merchant', tenantCode: 'ASTER-IN', terminatedOn: '2026-05-12', stage: 'anonymized', legalHold: false },
  { id: 'lc-03', person: 'Vikram Sethi', tenantCode: 'MERIDIAN', terminatedOn: '2026-04-28', stage: 'active (exit processing)', legalHold: true },
  { id: 'lc-04', person: 'Rita Lobo', tenantCode: 'SURYA', terminatedOn: '2026-06-20', stage: 'account disabled', legalHold: false },
  { id: 'lc-05', person: 'Harish Gowda', tenantCode: 'COBALT', terminatedOn: '2019-03-15', stage: 'purged', legalHold: false },
]

export const seedDsrRequests: DsrRequest[] = [
  { id: 'dsr-01', requester: 'Arjun Pillai', type: 'Access', detail: 'Full copy of my employee data', sensitive: false, submittedAt: '2026-06-18', slaDue: '2026-07-18', status: 'in progress' },
  { id: 'dsr-02', requester: 'Sana Kulkarni', type: 'Rectification', detail: 'Correct bank account number', sensitive: true, submittedAt: '2026-06-22', slaDue: '2026-07-22', status: 'identity verified' },
  { id: 'dsr-03', requester: 'Meghna Bose', type: 'Erasure', detail: 'Delete my candidate history', sensitive: false, submittedAt: '2026-06-10', slaDue: '2026-07-10', status: 'statutory exception' },
  { id: 'dsr-04', requester: 'Kavya Raman', type: 'Rectification', detail: 'Update emergency contact', sensitive: false, submittedAt: '2026-06-25', slaDue: '2026-07-25', status: 'completed' },
]

export const anonymizationRules = [
  'Direct identifiers pseudonymized',
  'Indirect identifiers retained for reporting',
  'Unique identifiers one-way hashed',
] as const
