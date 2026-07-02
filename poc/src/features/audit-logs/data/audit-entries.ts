import { type Role } from '@/context/role-context'

export const AUDIT_ENTITY_TYPES = ['Company', 'Employee'] as const
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

export const AUDIT_ACTION_TYPES = [
  'create',
  'update',
  'delete',
  'status-change',
] as const
export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[number]

export type StorageTier = 'active' | 'archived'

export interface AuditFieldChange {
  field: string
  /** null represents "no prior value" (creates). */
  previousValue: string | null
  /** null represents "empty / deleted" (deletes and cleared fields). */
  newValue: string | null
}

export interface AuditEntry {
  id: string
  entityType: AuditEntityType
  recordId: string
  recordName: string
  /** Employee records maintained on behalf of people with no system login. */
  nonUserRecord?: boolean
  actionType: AuditActionType
  changes: AuditFieldChange[]
  actor: string
  actorType: 'user' | 'system'
  /** ISO timestamp with time — precise enough for chronological ordering. */
  timestamp: string
  companyId: string
  companyName: string
  tenant: string
  storageTier: StorageTier
}

export type SecurityEventType = 'tamper-attempt' | 'access-denied'

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  detail: string
  actor: string
  timestamp: string
}

/* ------------------------------------------------------------------ */
/* Tenancy model used for role-based / tenant-boundary scoping         */
/* ------------------------------------------------------------------ */

export interface CompanyRef {
  id: string
  name: string
  group: string
  portfolio: string
  tenant: string
}

export const COMPANIES: CompanyRef[] = [
  {
    id: 'CMP-NWR',
    name: 'Northwind Retail',
    group: 'Northwind Group',
    portfolio: 'Meridian Portfolio',
    tenant: 'Meridian Holdings',
  },
  {
    id: 'CMP-NWL',
    name: 'Northwind Logistics',
    group: 'Northwind Group',
    portfolio: 'Meridian Portfolio',
    tenant: 'Meridian Holdings',
  },
  {
    id: 'CMP-SOL',
    name: 'Solaris Technologies',
    group: 'Solaris Group',
    portfolio: 'Meridian Portfolio',
    tenant: 'Meridian Holdings',
  },
  {
    id: 'CMP-ZEN',
    name: 'Zenith Manufacturing',
    group: 'Zenith Group',
    portfolio: 'Zenith Portfolio',
    tenant: 'Zenith Industries',
  },
]

/** The signed-in employee used for Employee (User) self-service scoping. */
export const SELF_EMPLOYEE = { recordId: 'EMP-1042', name: 'Ananya Iyer' }

export type RoleScope =
  | { kind: 'all' }
  | { kind: 'companies'; companyIds: string[]; label: string }
  | { kind: 'self'; recordId: string }
  | { kind: 'none'; reason: string }

/** Tenant-boundary + RBAC scope for each canonical role (FR 6.29.5). */
export function getRoleScope(role: Role): RoleScope {
  switch (role) {
    case 'Platform Admin':
      return { kind: 'all' }
    case 'Portfolio Admin':
      return {
        kind: 'companies',
        companyIds: ['CMP-NWR', 'CMP-NWL', 'CMP-SOL'],
        label: 'Meridian Portfolio',
      }
    case 'Group Company Admin':
      return {
        kind: 'companies',
        companyIds: ['CMP-NWR', 'CMP-NWL'],
        label: 'Northwind Group',
      }
    case 'Company Admin':
      return {
        kind: 'companies',
        companyIds: ['CMP-NWR'],
        label: 'Northwind Retail',
      }
    case 'Employee (User)':
      return { kind: 'self', recordId: SELF_EMPLOYEE.recordId }
    case 'Employee (Non-User)':
      return {
        kind: 'none',
        reason:
          'Employee (Non-User) records have no system login. Changes to your record are still fully audited and reviewable by authorized administrators on your behalf.',
      }
  }
}

/** Applies the role's tenant/RBAC scope to a set of audit entries. */
export function scopeEntries(entries: AuditEntry[], role: Role): AuditEntry[] {
  const scope = getRoleScope(role)
  switch (scope.kind) {
    case 'all':
      return entries
    case 'companies':
      return entries.filter((e) => scope.companyIds.includes(e.companyId))
    case 'self':
      return entries.filter(
        (e) => e.entityType === 'Employee' && e.recordId === scope.recordId
      )
    case 'none':
      return []
  }
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

export const seedAuditEntries: AuditEntry[] = [
  {
    id: 'AE-2604',
    entityType: 'Company',
    recordId: 'CMP-SOL',
    recordName: 'Solaris Technologies',
    actionType: 'update',
    changes: [{ field: 'GSTIN', previousValue: null, newValue: '29AACCS8877K1Z4' }],
    actor: 'System · Compliance Sync',
    actorType: 'system',
    timestamp: '2026-06-28T04:15:00Z',
    companyId: 'CMP-SOL',
    companyName: 'Solaris Technologies',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2603',
    entityType: 'Employee',
    recordId: 'EMP-0901',
    recordName: 'Kiran Rao',
    nonUserRecord: true,
    actionType: 'status-change',
    changes: [{ field: 'Status', previousValue: 'Active', newValue: 'Inactive' }],
    actor: 'Meera Krishnan (HR Ops)',
    actorType: 'user',
    timestamp: '2026-06-25T10:42:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2602',
    entityType: 'Employee',
    recordId: 'EMP-1042',
    recordName: 'Ananya Iyer',
    actionType: 'update',
    changes: [
      {
        field: 'Work Email',
        previousValue: 'ananya.i@northwindretail.com',
        newValue: 'ananya.iyer@northwindretail.com',
      },
    ],
    actor: 'Ananya Iyer (Self-service)',
    actorType: 'user',
    timestamp: '2026-06-21T08:03:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2601',
    entityType: 'Company',
    recordId: 'CMP-NWL',
    recordName: 'Northwind Logistics',
    actionType: 'status-change',
    changes: [
      { field: 'Status', previousValue: 'Active', newValue: 'Under Restructure' },
    ],
    actor: 'Vikram Shah (Group Company Admin)',
    actorType: 'user',
    timestamp: '2026-05-30T13:27:00Z',
    companyId: 'CMP-NWL',
    companyName: 'Northwind Logistics',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2600',
    entityType: 'Employee',
    recordId: 'EMP-1230',
    recordName: 'Devika Nair',
    actionType: 'create',
    changes: [
      { field: 'Full Name', previousValue: null, newValue: 'Devika Nair' },
      { field: 'Department', previousValue: null, newValue: 'Operations' },
      { field: 'Status', previousValue: null, newValue: 'Onboarding' },
    ],
    actor: 'Meera Krishnan (HR Ops)',
    actorType: 'user',
    timestamp: '2026-04-22T09:12:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2599',
    entityType: 'Employee',
    recordId: 'EMP-1042',
    recordName: 'Ananya Iyer',
    actionType: 'status-change',
    changes: [
      { field: 'Status', previousValue: 'Probation', newValue: 'Confirmed' },
    ],
    actor: 'Rohan Mehta (Company Admin)',
    actorType: 'user',
    timestamp: '2026-03-01T11:45:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2598',
    entityType: 'Company',
    recordId: 'CMP-ZEN',
    recordName: 'Zenith Manufacturing',
    actionType: 'status-change',
    changes: [{ field: 'Status', previousValue: 'Active', newValue: 'Suspended' }],
    actor: 'Farah Qureshi (Zenith Admin)',
    actorType: 'user',
    timestamp: '2026-02-10T16:20:00Z',
    companyId: 'CMP-ZEN',
    companyName: 'Zenith Manufacturing',
    tenant: 'Zenith Industries',
    storageTier: 'active',
  },
  {
    id: 'AE-2597',
    entityType: 'Employee',
    recordId: 'EMP-1105',
    recordName: 'Arjun Malhotra',
    actionType: 'status-change',
    changes: [{ field: 'Status', previousValue: 'Onboarding', newValue: 'Active' }],
    actor: 'System · Onboarding Job',
    actorType: 'system',
    timestamp: '2026-01-05T02:00:00Z',
    companyId: 'CMP-NWL',
    companyName: 'Northwind Logistics',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2596',
    entityType: 'Company',
    recordId: 'CMP-NWR',
    recordName: 'Northwind Retail',
    actionType: 'update',
    changes: [
      {
        field: 'CIN',
        previousValue: 'U52100MH2019PTC331901',
        newValue: 'U52100MH2019PTC331910',
      },
    ],
    actor: 'Rohan Mehta (Company Admin)',
    actorType: 'user',
    timestamp: '2025-11-18T14:55:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2595',
    entityType: 'Employee',
    recordId: 'EMP-0901',
    recordName: 'Kiran Rao',
    nonUserRecord: true,
    actionType: 'update',
    changes: [
      {
        field: 'Bank Account',
        previousValue: '•••• 4410',
        newValue: '•••• 7821',
      },
      { field: 'IFSC', previousValue: 'HDFC0000241', newValue: 'ICIC0000318' },
    ],
    actor: 'Meera Krishnan (HR Ops)',
    actorType: 'user',
    timestamp: '2025-10-02T12:31:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2594',
    entityType: 'Employee',
    recordId: 'EMP-1042',
    recordName: 'Ananya Iyer',
    actionType: 'update',
    changes: [
      { field: 'Designation', previousValue: 'Analyst', newValue: 'Senior Analyst' },
      { field: 'Grade', previousValue: 'L2', newValue: 'L3' },
    ],
    actor: 'Meera Krishnan (HR Ops)',
    actorType: 'user',
    timestamp: '2025-09-14T10:18:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'active',
  },
  {
    id: 'AE-2510',
    entityType: 'Company',
    recordId: 'CMP-SOL',
    recordName: 'Solaris Technologies',
    actionType: 'create',
    changes: [
      { field: 'Legal Name', previousValue: null, newValue: 'Solaris Technologies Pvt Ltd' },
      { field: 'Country', previousValue: null, newValue: 'India' },
      { field: 'Status', previousValue: null, newValue: 'Draft' },
    ],
    actor: 'Priya Sharma (Platform Admin)',
    actorType: 'user',
    timestamp: '2025-05-08T09:00:00Z',
    companyId: 'CMP-SOL',
    companyName: 'Solaris Technologies',
    tenant: 'Meridian Holdings',
    storageTier: 'archived',
  },
  {
    id: 'AE-2509',
    entityType: 'Employee',
    recordId: 'EMP-0877',
    recordName: 'Duplicate — S. Pillai',
    actionType: 'delete',
    changes: [
      { field: 'Full Name', previousValue: 'Suresh Pillai', newValue: null },
      { field: 'Status', previousValue: 'Draft', newValue: null },
    ],
    actor: 'Meera Krishnan (HR Ops)',
    actorType: 'user',
    timestamp: '2025-03-11T15:40:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'archived',
  },
  {
    id: 'AE-2508',
    entityType: 'Company',
    recordId: 'CMP-NWL',
    recordName: 'Northwind Logistics',
    actionType: 'update',
    changes: [
      {
        field: 'Registered Address',
        previousValue: 'Plot 12, MIDC, Pune',
        newValue: 'Tower B, Hinjewadi Phase 2, Pune',
      },
    ],
    actor: 'Vikram Shah (Group Company Admin)',
    actorType: 'user',
    timestamp: '2025-01-20T11:05:00Z',
    companyId: 'CMP-NWL',
    companyName: 'Northwind Logistics',
    tenant: 'Meridian Holdings',
    storageTier: 'archived',
  },
  {
    id: 'AE-2507',
    entityType: 'Employee',
    recordId: 'EMP-1042',
    recordName: 'Ananya Iyer',
    actionType: 'create',
    changes: [
      { field: 'Full Name', previousValue: null, newValue: 'Ananya Iyer' },
      { field: 'Designation', previousValue: null, newValue: 'Analyst' },
      { field: 'Status', previousValue: null, newValue: 'Onboarding' },
    ],
    actor: 'Rohan Mehta (Company Admin)',
    actorType: 'user',
    timestamp: '2024-09-01T09:30:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'archived',
  },
  {
    id: 'AE-2506',
    entityType: 'Employee',
    recordId: 'EMP-0901',
    recordName: 'Kiran Rao',
    nonUserRecord: true,
    actionType: 'create',
    changes: [
      { field: 'Full Name', previousValue: null, newValue: 'Kiran Rao' },
      { field: 'Employment Type', previousValue: null, newValue: 'Contract (Non-User)' },
    ],
    actor: 'Meera Krishnan (HR Ops)',
    actorType: 'user',
    timestamp: '2024-06-15T10:00:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'archived',
  },
  {
    id: 'AE-2505',
    entityType: 'Company',
    recordId: 'CMP-NWR',
    recordName: 'Northwind Retail',
    actionType: 'status-change',
    changes: [{ field: 'Status', previousValue: 'Draft', newValue: 'Active' }],
    actor: 'Rohan Mehta (Company Admin)',
    actorType: 'user',
    timestamp: '2024-04-02T12:00:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'archived',
  },
  {
    id: 'AE-2504',
    entityType: 'Company',
    recordId: 'CMP-NWR',
    recordName: 'Northwind Retail',
    actionType: 'create',
    changes: [
      { field: 'Legal Name', previousValue: null, newValue: 'Northwind Retail Pvt Ltd' },
      { field: 'Country', previousValue: null, newValue: 'India' },
      { field: 'Status', previousValue: null, newValue: 'Draft' },
    ],
    actor: 'Priya Sharma (Platform Admin)',
    actorType: 'user',
    timestamp: '2024-03-12T08:45:00Z',
    companyId: 'CMP-NWR',
    companyName: 'Northwind Retail',
    tenant: 'Meridian Holdings',
    storageTier: 'archived',
  },
]

export const seedSecurityEvents: SecurityEvent[] = [
  {
    id: 'SEC-002',
    type: 'tamper-attempt',
    detail:
      'Modify attempt on audit entry AE-2596 blocked — audit entries are write-once.',
    actor: 'Unknown session · CMP-NWR',
    timestamp: '2026-06-02T18:12:00Z',
  },
  {
    id: 'SEC-001',
    type: 'access-denied',
    detail:
      "Role 'Employee (User)' attempted to open record history for EMP-0901 — denied by RBAC, no data revealed.",
    actor: 'Ananya Iyer',
    timestamp: '2026-05-12T09:47:00Z',
  },
]
