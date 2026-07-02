/**
 * Tamper-evident audit trail for all cross-company / shared-scenario activity
 * (GRP-05, GRP-08). Each entry carries a chained pseudo-hash so any mutation
 * of an earlier record breaks verification of every later one.
 */

export const AUDIT_CATEGORIES = [
  'construct',
  'membership',
  'config',
  'role-grant',
  'admin-action',
  'location',
  'policy',
  'reporting',
  'directory',
] as const
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number]

export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  action: string
  category: AuditCategory
  targetCompany: string | null
  groupCode: string | null
  detail: string
  /** Chained hash over the previous entry's hash + this payload. */
  hash: string
}

/** Deterministic chained pseudo-hash (tamper evidence for the POC). */
export function chainHash(prevHash: string, payload: string): string {
  const s = prevHash + payload
  let h = 7
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return `sha-${Math.abs(h).toString(16).padStart(8, '0')}`
}

/** Seed entries, newest first (the first element anchors the chain head). */
export const seedAudit: AuditEntry[] = [
  { id: 'au-14', timestamp: '2026-06-25 16:40', actor: 'grace.group@meridiantech.in', actorRole: 'Group Company Admin', action: 'CONSOLIDATED_REPORT_RUN', category: 'reporting', targetCompany: null, groupCode: 'GROUP-2024-001', detail: 'Headcount + leave/attendance report across 3 member companies (row-level security applied)', hash: 'sha-4c19a2e7' },
  { id: 'au-13', timestamp: '2026-06-24 11:05', actor: 'asha.rao@meridiantech.in', actorRole: 'Employee (User)', action: 'DIRECTORY_SEARCH', category: 'directory', targetCompany: null, groupCode: 'GROUP-2024-001', detail: 'Cross-company directory search "analytics" — 2 results, 1 row withheld by RLS', hash: 'sha-2f88d1b3' },
  { id: 'au-12', timestamp: '2026-06-21 09:12', actor: 'ibrahim.khan@meridiananalytics.in', actorRole: 'Company Admin', action: 'LOCATION_REFERENCE_REQUESTED', category: 'location', targetCompany: 'Meridian Technologies', groupCode: 'GROUP-2024-001', detail: 'Meridian Analytics requested reference to Meridian Tower (pending owner approval)', hash: 'sha-7ab3309c' },
  { id: 'au-11', timestamp: '2026-04-01 08:00', actor: 'grace.group@meridiantech.in', actorRole: 'Group Company Admin', action: 'POLICY_TEMPLATE_UPDATED', category: 'policy', targetCompany: 'Meridian Technologies', groupCode: 'GROUP-2024-001', detail: 'Leave Policy FY26 updated to v2 — existing company instances NOT auto-updated', hash: 'sha-0d55e6f1' },
  { id: 'au-10', timestamp: '2025-08-19 14:22', actor: 'grace.group@meridiantech.in', actorRole: 'Group Company Admin', action: 'GROUP_ROLE_REVOKED', category: 'role-grant', targetCompany: 'Meridian Digital Services', groupCode: 'GROUP-2024-001', detail: 'Group Reporting Viewer revoked from tomas.rivera@meridiandigital.in', hash: 'sha-91c04ba8' },
  { id: 'au-09', timestamp: '2025-06-30 17:45', actor: 'grace.group@meridiantech.in', actorRole: 'Group Company Admin', action: 'MEMBER_REMOVED', category: 'membership', targetCompany: 'Northwind Textiles', groupCode: 'GROUP-2024-001', detail: 'Membership ended effective 2025-06-30 — record retained as history', hash: 'sha-663d72c5' },
  { id: 'au-08', timestamp: '2025-04-08 10:30', actor: 'priya.platform@satellitehr.com', actorRole: 'Platform Admin', action: 'GROUP_CREATED', category: 'construct', targetCompany: null, groupCode: 'GROUP-2025-003', detail: 'JointVenture "Harbor–Northwind JV" created with 2 member companies', hash: 'sha-3e91cc04' },
  { id: 'au-07', timestamp: '2025-03-09 12:18', actor: 'admin@bluegrainfoods.in', actorRole: 'Company Admin', action: 'LOCATION_REFERENCE_APPROVED', category: 'location', targetCompany: 'Bluegrain Retail', groupCode: 'GROUP-2025-002', detail: 'Owner approved Bluegrain Retail reference to Bluegrain Processing Plant', hash: 'sha-b8a2417d' },
  { id: 'au-06', timestamp: '2025-03-01 00:00', actor: 'daniel.group@bluegrain.in', actorRole: 'Group Company Admin', action: 'CONFIG_CHANGED', category: 'config', targetCompany: null, groupCode: 'GROUP-2025-002', detail: 'Shared locations: false → true (v1, effective 2025-03-01)', hash: 'sha-59f0e832' },
  { id: 'au-05', timestamp: '2025-01-20 09:55', actor: 'priya.platform@satellitehr.com', actorRole: 'Platform Admin', action: 'GROUP_CREATED', category: 'construct', targetCompany: null, groupCode: 'GROUP-2025-002', detail: 'Sister group "Bluegrain Alliance" created with 2 member companies', hash: 'sha-c47d10ab' },
  { id: 'au-04', timestamp: '2025-01-01 00:00', actor: 'omar.portfolio@northline.com', actorRole: 'Portfolio Admin', action: 'CONFIG_CHANGED', category: 'config', targetCompany: null, groupCode: 'GROUP-2024-001', detail: 'Shared administration: false → true (v3, effective 2025-01-01)', hash: 'sha-8812f3d9' },
  { id: 'au-03', timestamp: '2024-09-10 13:20', actor: 'grace.group@meridiantech.in', actorRole: 'Group Company Admin', action: 'GROUP_ROLE_GRANTED', category: 'role-grant', targetCompany: 'Meridian Technologies', groupCode: 'GROUP-2024-001', detail: 'Group Directory Searcher granted to asha.rao@meridiantech.in', hash: 'sha-1a6be077' },
  { id: 'au-02', timestamp: '2024-05-06 15:47', actor: 'grace.group@meridiantech.in', actorRole: 'Group Company Admin', action: 'ADMIN_ACTION_EXECUTED', category: 'admin-action', targetCompany: 'Meridian Digital Services', groupCode: 'GROUP-2024-001', detail: 'Cross-company action "Publish holiday calendar" executed under shared administration', hash: 'sha-e2903c5b' },
  { id: 'au-01', timestamp: '2024-02-12 09:00', actor: 'priya.platform@satellitehr.com', actorRole: 'Platform Admin', action: 'GROUP_CREATED', category: 'construct', targetCompany: null, groupCode: 'GROUP-2024-001', detail: 'Holding group "Meridian Group" created with parent Meridian Technologies and 2 subsidiaries', hash: 'sha-00a1b2c3' },
]
