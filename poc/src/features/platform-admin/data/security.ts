/**
 * Platform Administration — security & compliance domain (SYS-14, 25, 32,
 * 52, 65, 66, 67, 68). Immutable metadata-level audit trail, platform
 * password policy and compliance/encryption posture.
 */

export interface AuditRecord {
  id: string
  at: string
  tenantCode: string
  actor: string
  event: string
  kind: 'security' | 'data-change' | 'denial'
  /** Metadata-level before/after context — never transactional data (SYS-32). */
  context: string
}

export interface PasswordPolicy {
  minLength: number
  requireComplexity: boolean
  expiryDays: number
  lockoutAttempts: number
  mfaRequired: boolean
}

export interface ComplianceItem {
  name: string
  status: 'Supported' | 'Phase 1' | 'Planned' | 'Ready'
  detail: string
}

export const seedAuditRecords: AuditRecord[] = [
  { id: 'aud-01', at: '2026-06-27 09:14', tenantCode: 'ASTER-IN', actor: 'kavya.raman', event: 'Role assignment changed', kind: 'security', context: 'roles: [Employee] → [Employee, People Manager]' },
  { id: 'aud-02', at: '2026-06-26 17:40', tenantCode: 'MERIDIAN', actor: 'system', event: 'Employee record updated', kind: 'data-change', context: 'fields: position (metadata only)' },
  { id: 'aud-03', at: '2026-06-24 14:37', tenantCode: 'QUILL', actor: 'meghna.bose', event: 'Cross-tenant read denied', kind: 'denial', context: 'target: VERDANT employee record — tenant boundary enforced' },
  { id: 'aud-04', at: '2026-06-23 11:02', tenantCode: 'PLATFORM', actor: 'platform.admin', event: 'Password policy updated', kind: 'security', context: 'minLength: 10 → 12' },
  { id: 'aud-05', at: '2026-06-20 10:15', tenantCode: 'BLUEFERN', actor: 'dev.mistry', event: 'Bulk import completed', kind: 'data-change', context: 'rows: 2,140 (approved import)' },
  { id: 'aud-06', at: '2026-06-18 08:44', tenantCode: 'SURYA', actor: 'lena.dsouza', event: 'Login via Office 365 SSO', kind: 'security', context: 'provider: idp-o365' },
  { id: 'aud-07', at: '2026-06-15 16:09', tenantCode: 'HARVALE', actor: 'tom.whitaker', event: 'Export attempt blocked', kind: 'denial', context: 'reason: finance viewer is read-only for HR ops' },
]

export const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 12,
  requireComplexity: true,
  expiryDays: 90,
  lockoutAttempts: 5,
  mfaRequired: true,
}

export const complianceItems: ComplianceItem[] = [
  { name: 'ISO 27001', status: 'Supported', detail: 'Platform designed to support certification' },
  { name: 'SOC 2 Type I', status: 'Phase 1', detail: 'In scope for Phase 1 assessment' },
  { name: 'SOC 2 Type II', status: 'Planned', detail: 'Future phase' },
  { name: 'GDPR', status: 'Ready', detail: 'GDPR-ready controls in place' },
  { name: 'India DPDP', status: 'Ready', detail: 'DPDP obligations supported' },
]

export const encryptionPosture = [
  { name: 'Data at rest', detail: 'AES-256 for PII, credentials and audit logs' },
  { name: 'Data in transit', detail: 'TLS 1.2+ on every connection' },
  { name: 'Backups', detail: 'All backup tiers encrypted' },
] as const

export const sdlcControls = [
  'Security requirements & secure coding standards',
  'Security-focused code reviews',
  'Vulnerability assessments with timely patching',
  'Penetration testing — application, infrastructure, API',
  'Security event monitoring, anomaly detection & incident response',
] as const
