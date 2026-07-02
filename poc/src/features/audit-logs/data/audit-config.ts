import { type Role } from '@/context/role-context'
import { type AuditEntityType } from './audit-entries'

/* ------------------------------------------------------------------ */
/* Retention policy — governed, versioned, effective-dated (FR 6.29.3) */
/* ------------------------------------------------------------------ */

export type PolicyVersionStatus = 'in-effect' | 'scheduled' | 'superseded'

export interface RetentionPolicyVersion {
  id: string
  version: number
  /** Active-store retention window in months (default 12 = 1 year). */
  activeMonths: number
  /** Total retention (active + archival) in years (default 7). */
  totalYears: number
  effectiveFrom: string
  changedBy: string
  changedAt: string
  status: PolicyVersionStatus
}

export const seedRetentionVersions: RetentionPolicyVersion[] = [
  {
    id: 'RP-2',
    version: 2,
    activeMonths: 12,
    totalYears: 7,
    effectiveFrom: '2025-04-01',
    changedBy: 'Priya Sharma (Platform Admin)',
    changedAt: '2025-03-18T10:20:00Z',
    status: 'in-effect',
  },
  {
    id: 'RP-1',
    version: 1,
    activeMonths: 6,
    totalYears: 7,
    effectiveFrom: '2024-01-01',
    changedBy: 'Priya Sharma (Platform Admin)',
    changedAt: '2023-12-05T09:00:00Z',
    status: 'superseded',
  },
]

/* ------------------------------------------------------------------ */
/* Mandatory audit entity + field scope (FR 6.29.1 / 6.29.2 — L2)      */
/* ------------------------------------------------------------------ */

export interface AuditScopeField {
  name: string
  tracked: boolean
}

export interface AuditScopeEntity {
  entity: AuditEntityType
  /** Company and Employee are mandatory — they cannot leave audit scope. */
  mandatory: boolean
  enabled: boolean
  fields: AuditScopeField[]
  version: number
  effectiveFrom: string
  updatedBy: string
}

export const seedScopeEntities: AuditScopeEntity[] = [
  {
    entity: 'Company',
    mandatory: true,
    enabled: true,
    version: 3,
    effectiveFrom: '2025-06-01',
    updatedBy: 'Priya Sharma (Platform Admin)',
    fields: [
      { name: 'Legal Name', tracked: true },
      { name: 'Status', tracked: true },
      { name: 'CIN', tracked: true },
      { name: 'GSTIN', tracked: true },
      { name: 'Registered Address', tracked: true },
      { name: 'Internal Notes', tracked: false },
    ],
  },
  {
    entity: 'Employee',
    mandatory: true,
    enabled: true,
    version: 5,
    effectiveFrom: '2025-09-01',
    updatedBy: 'Priya Sharma (Platform Admin)',
    fields: [
      { name: 'Full Name', tracked: true },
      { name: 'Status', tracked: true },
      { name: 'Designation', tracked: true },
      { name: 'Grade', tracked: true },
      { name: 'Work Email', tracked: true },
      { name: 'Bank Account', tracked: true },
      { name: 'Desk Location', tracked: false },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Role-based audit access permissions (FR 6.29.5 — L2)                */
/* ------------------------------------------------------------------ */

export interface AuditAccessRule {
  role: Role
  scopeLabel: string
  canViewAuditTrail: boolean
  canViewRecordHistory: boolean
}

export interface AuditAccessConfig {
  version: number
  effectiveFrom: string
  updatedBy: string
  rules: AuditAccessRule[]
}

export const seedAccessConfig: AuditAccessConfig = {
  version: 4,
  effectiveFrom: '2026-01-01',
  updatedBy: 'Priya Sharma (Platform Admin)',
  rules: [
    {
      role: 'Platform Admin',
      scopeLabel: 'All tenants (platform operations)',
      canViewAuditTrail: true,
      canViewRecordHistory: true,
    },
    {
      role: 'Portfolio Admin',
      scopeLabel: 'Meridian Portfolio companies',
      canViewAuditTrail: true,
      canViewRecordHistory: true,
    },
    {
      role: 'Group Company Admin',
      scopeLabel: 'Northwind Group companies',
      canViewAuditTrail: true,
      canViewRecordHistory: true,
    },
    {
      role: 'Company Admin',
      scopeLabel: 'Own company (Northwind Retail)',
      canViewAuditTrail: true,
      canViewRecordHistory: true,
    },
    {
      role: 'Employee (User)',
      scopeLabel: 'Own employee record only',
      canViewAuditTrail: true,
      canViewRecordHistory: true,
    },
    {
      role: 'Employee (Non-User)',
      scopeLabel: 'No system login — no direct access',
      canViewAuditTrail: false,
      canViewRecordHistory: false,
    },
  ],
}
