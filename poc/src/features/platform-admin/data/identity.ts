/**
 * Platform Administration — identity & access domain (SYS-02, 11, 12, 20, 21,
 * 29, 30, 38, 39, 42, 43, 44, 75). System users with per-company memberships,
 * person records (employee/contractor engagements), authentication providers
 * and access audits. User / Employee / Contractor are distinct concepts.
 */

export const AUTH_PROVIDERS = [
  'SAML',
  'Active Directory',
  'Office 365',
  'Google Apps',
] as const
export type AuthProviderName = (typeof AUTH_PROVIDERS)[number]

export interface AuthProvider {
  id: string
  name: AuthProviderName
  /** Enabled platform-wide by Platform Admin (SYS-02). */
  enabledOnPlatform: boolean
  /** Tenant ids that adopted it for their users (SYS-30, 75). */
  adoptedByTenantIds: string[]
}

export const WORKFORCE_TYPES = ['employee', 'contractor'] as const
export type WorkforceType = (typeof WORKFORCE_TYPES)[number]

export interface CompanyMembership {
  tenantId: string
  /** Role ids assigned in this company only (SYS-11). */
  roleIds: string[]
  /** Person-record id this user maps to in this company, if any (SYS-20). */
  personRecordId: string | null
}

export interface SystemUser {
  id: string
  name: string
  email: string
  status: 'active' | 'invited' | 'disabled'
  memberships: CompanyMembership[]
}

/** One engagement of a physical person within one company (SYS-21, 42, 43). */
export interface PersonRecord {
  id: string
  /** Stable key for the physical person — never shared across tenants. */
  personKey: string
  personName: string
  tenantId: string
  workforceType: WorkforceType
  position: string
  status: 'active' | 'terminated'
  /** Null when the person has no login — a non-user record (SYS-29, 44). */
  userId: string | null
}

export interface AccessAuditRow {
  id: string
  tenantId: string
  userName: string
  detail: string
  at: string
}

export const seedAuthProviders: AuthProvider[] = [
  { id: 'idp-saml', name: 'SAML', enabledOnPlatform: true, adoptedByTenantIds: ['co-01', 'co-03'] },
  { id: 'idp-ad', name: 'Active Directory', enabledOnPlatform: true, adoptedByTenantIds: ['co-03', 'co-04', 'co-11'] },
  { id: 'idp-o365', name: 'Office 365', enabledOnPlatform: true, adoptedByTenantIds: ['co-01', 'co-02', 'co-09'] },
  { id: 'idp-google', name: 'Google Apps', enabledOnPlatform: false, adoptedByTenantIds: [] },
]

export const seedSystemUsers: SystemUser[] = [
  {
    id: 'usr-01',
    name: 'Kavya Raman',
    email: 'kavya.raman@aster.example',
    status: 'active',
    memberships: [
      { tenantId: 'co-01', roleIds: ['role-hr-admin'], personRecordId: 'per-01' },
      { tenantId: 'co-02', roleIds: ['role-emp'], personRecordId: 'per-02' },
    ],
  },
  {
    id: 'usr-02',
    name: 'Dev Mistry',
    email: 'dev.mistry@helios.example',
    status: 'active',
    memberships: [
      { tenantId: 'co-03', roleIds: ['role-pf-ops'], personRecordId: null },
      { tenantId: 'co-04', roleIds: ['role-pf-ops'], personRecordId: null },
      { tenantId: 'co-05', roleIds: ['role-pf-audit'], personRecordId: null },
    ],
  },
  {
    id: 'usr-03',
    name: 'Sana Kulkarni',
    email: 'sana.kulkarni@verdant.example',
    status: 'active',
    memberships: [
      { tenantId: 'co-09', roleIds: ['role-it-sec'], personRecordId: 'per-05' },
    ],
  },
  {
    id: 'usr-04',
    name: 'Ibrahim Shaikh',
    email: 'ibrahim.shaikh@meridian.example',
    status: 'active',
    memberships: [
      { tenantId: 'co-03', roleIds: ['role-mgr'], personRecordId: 'per-06' },
    ],
  },
  {
    id: 'usr-05',
    name: 'Lena D’Souza',
    email: 'lena.dsouza@surya.example',
    status: 'invited',
    memberships: [
      { tenantId: 'co-07', roleIds: ['role-fin-view'], personRecordId: null },
    ],
  },
  {
    id: 'usr-06',
    name: 'Arjun Pillai',
    email: 'arjun.pillai@aster.example',
    status: 'active',
    memberships: [
      { tenantId: 'co-01', roleIds: ['role-emp'], personRecordId: 'per-03' },
      { tenantId: 'co-09', roleIds: ['role-ctr'], personRecordId: 'per-04' },
    ],
  },
  {
    id: 'usr-07',
    name: 'Meghna Bose',
    email: 'meghna.bose@quill.example',
    status: 'disabled',
    memberships: [
      { tenantId: 'co-08', roleIds: ['role-emp'], personRecordId: null },
    ],
  },
  {
    id: 'usr-08',
    name: 'Tom Whitaker',
    email: 'tom.whitaker@harvale.example',
    status: 'active',
    memberships: [
      { tenantId: 'co-06', roleIds: ['role-hr-admin'], personRecordId: null },
    ],
  },
]

export const seedPersonRecords: PersonRecord[] = [
  { id: 'per-01', personKey: 'PK-1001', personName: 'Kavya Raman', tenantId: 'co-01', workforceType: 'employee', position: 'HR Manager', status: 'active', userId: 'usr-01' },
  { id: 'per-02', personKey: 'PK-1001', personName: 'Kavya Raman', tenantId: 'co-02', workforceType: 'employee', position: 'HR Consultant', status: 'active', userId: 'usr-01' },
  { id: 'per-03', personKey: 'PK-1002', personName: 'Arjun Pillai', tenantId: 'co-01', workforceType: 'employee', position: 'Senior Engineer', status: 'active', userId: 'usr-06' },
  { id: 'per-04', personKey: 'PK-1002', personName: 'Arjun Pillai', tenantId: 'co-09', workforceType: 'contractor', position: 'Integration Consultant', status: 'active', userId: 'usr-06' },
  { id: 'per-05', personKey: 'PK-1003', personName: 'Sana Kulkarni', tenantId: 'co-09', workforceType: 'employee', position: 'IT Security Lead', status: 'active', userId: 'usr-03' },
  { id: 'per-06', personKey: 'PK-1004', personName: 'Ibrahim Shaikh', tenantId: 'co-03', workforceType: 'employee', position: 'Plant Supervisor', status: 'active', userId: 'usr-04' },
  { id: 'per-07', personKey: 'PK-1005', personName: 'Ravi Annamalai', tenantId: 'co-03', workforceType: 'employee', position: 'Loom Operator', status: 'active', userId: null },
  { id: 'per-08', personKey: 'PK-1006', personName: 'Gita Verghese', tenantId: 'co-07', workforceType: 'contractor', position: 'Kitchen Auditor', status: 'active', userId: null },
  { id: 'per-09', personKey: 'PK-1007', personName: 'Noel Fernandes', tenantId: 'co-04', workforceType: 'employee', position: 'Fleet Coordinator', status: 'terminated', userId: null },
]

export const seedAccessAudits: AccessAuditRow[] = [
  { id: 'aa-01', tenantId: 'co-09', userName: 'Sana Kulkarni', detail: 'Reviewed role assignments — 42 users, 0 orphaned accounts', at: '2026-06-24 15:02' },
  { id: 'aa-02', tenantId: 'co-01', userName: 'Kavya Raman', detail: 'Access audit export generated (users × roles matrix)', at: '2026-06-19 10:44' },
  { id: 'aa-03', tenantId: 'co-03', userName: 'Dev Mistry', detail: 'Quarterly access recertification started for Meridian', at: '2026-06-12 09:30' },
]
