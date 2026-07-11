/**
 * User identity entities (FR 6.1.2) — distinct from Employee/Contractor
 * records. A single User can hold memberships in multiple companies, each
 * carrying its own role set and optional employee linkage (FR 6.1.3/6.1.5).
 */

export const AUTH_METHODS = [
  'password',
  'saml',
  'active-directory',
  'office365',
  'google',
] as const

export type AuthMethod = (typeof AUTH_METHODS)[number]

export const AUTH_METHOD_LABELS: Record<AuthMethod, string> = {
  password: 'Email / Password',
  saml: 'SAML 2.0',
  'active-directory': 'Active Directory',
  office365: 'Office 365',
  google: 'Google Apps',
}

export const COMPANY_ROLES = [
  'Company Admin',
  'HR Manager',
  'Payroll Admin',
  'Recruiter',
  'Employee',
  'Viewer',
] as const

export type CompanyRole = (typeof COMPANY_ROLES)[number]

export const USER_STATUSES = ['active', 'invited', 'suspended'] as const
export type AuthUserStatus = (typeof USER_STATUSES)[number]

/**
 * A tenant-scoped membership. Revoked memberships are retained with an
 * `effectiveTo` date rather than deleted (effective-dating, AUTH-16).
 */
export interface CompanyMembership {
  id: string
  companyId: string
  roles: CompanyRole[]
  /** Employee linkage is scoped to this company only (AUTH-06/14). */
  employeeId: string | null
  status: 'active' | 'revoked'
  effectiveFrom: string
  effectiveTo: string | null
}

export interface AuthUser {
  id: string
  name: string
  /** Unique login identity — enforced on create/edit (AUTH-16). */
  email: string
  authMethod: AuthMethod
  status: AuthUserStatus
  lastLogin: string | null
  /** Null for SSO-only users — no local credential exists (AUTH-11). */
  passwordUpdatedAt: string | null
  /** Consecutive failed local sign-ins — reset on success/unlock (lockout counter). */
  failedAttempts: number
  /** Set when the policy lockoutThreshold is reached; sign-in refused until cleared. */
  lockedAt: string | null
  /** True once the user has enrolled an authenticator (TOTP) for MFA. */
  mfaEnrolled: boolean
  memberships: CompanyMembership[]
}

export const seedAuthUsers: AuthUser[] = [
  {
    id: 'au-01',
    name: 'Priya Raman',
    email: 'priya.raman@northwind.example',
    authMethod: 'password',
    status: 'active',
    lastLogin: '2026-06-30T08:42:00Z',
    passwordUpdatedAt: '2026-06-20',
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-0101', companyId: 'co-01', roles: ['Company Admin'], employeeId: null, status: 'active', effectiveFrom: '2025-01-10', effectiveTo: null },
      { id: 'm-0102', companyId: 'co-02', roles: ['HR Manager'], employeeId: null, status: 'active', effectiveFrom: '2025-06-01', effectiveTo: null },
      { id: 'm-0103', companyId: 'co-03', roles: ['Viewer'], employeeId: null, status: 'active', effectiveFrom: '2026-02-14', effectiveTo: null },
    ],
  },
  {
    id: 'au-02',
    name: 'Grace Okonkwo',
    email: 'grace.okonkwo@northwind.example',
    authMethod: 'office365',
    status: 'active',
    lastLogin: '2026-07-01T14:05:00Z',
    passwordUpdatedAt: null,
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-0201', companyId: 'co-01', roles: ['HR Manager', 'Employee'], employeeId: 'emp-101', status: 'active', effectiveFrom: '2024-11-03', effectiveTo: null },
    ],
  },
  {
    id: 'au-03',
    name: 'Daniel Mercer',
    email: 'daniel.mercer@northwind.example',
    authMethod: 'active-directory',
    status: 'active',
    lastLogin: '2026-06-28T06:15:00Z',
    passwordUpdatedAt: null,
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-0301', companyId: 'co-02', roles: ['Employee'], employeeId: 'emp-102', status: 'active', effectiveFrom: '2025-03-17', effectiveTo: null },
    ],
  },
  {
    id: 'au-04',
    name: 'Mei-Ling Chen',
    email: 'meiling.chen@aurorahold.example',
    authMethod: 'saml',
    status: 'active',
    lastLogin: '2026-07-01T09:58:00Z',
    passwordUpdatedAt: null,
    failedAttempts: 0,
    lockedAt: null,
    // Aurora Software Labs requires MFA — Mei-Ling is already enrolled.
    mfaEnrolled: true,
    memberships: [
      { id: 'm-0401', companyId: 'co-04', roles: ['Company Admin'], employeeId: null, status: 'active', effectiveFrom: '2024-08-20', effectiveTo: null },
      { id: 'm-0402', companyId: 'co-05', roles: ['Payroll Admin'], employeeId: null, status: 'active', effectiveFrom: '2025-01-05', effectiveTo: null },
    ],
  },
  {
    id: 'au-05',
    name: 'Leila Haddad',
    email: 'leila.haddad@northwind.example',
    authMethod: 'password',
    status: 'active',
    lastLogin: '2026-06-25T11:20:00Z',
    passwordUpdatedAt: '2026-06-01',
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-0501', companyId: 'co-01', roles: ['Payroll Admin', 'Employee'], employeeId: 'emp-103', status: 'active', effectiveFrom: '2025-02-11', effectiveTo: null },
      { id: 'm-0502', companyId: 'co-03', roles: ['Payroll Admin'], employeeId: null, status: 'revoked', effectiveFrom: '2025-02-11', effectiveTo: '2026-03-31' },
    ],
  },
  {
    id: 'au-06',
    name: 'Kofi Mensah',
    email: 'kofi.mensah@aurorahold.example',
    authMethod: 'google',
    status: 'active',
    lastLogin: '2026-06-30T16:47:00Z',
    passwordUpdatedAt: null,
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-0601', companyId: 'co-04', roles: ['Employee'], employeeId: 'emp-106', status: 'active', effectiveFrom: '2025-09-01', effectiveTo: null },
    ],
  },
  {
    id: 'au-07',
    name: 'Ravi Subramanian',
    email: 'ravi.subramanian@aurorahold.example',
    authMethod: 'password',
    status: 'suspended',
    lastLogin: '2026-05-14T10:02:00Z',
    passwordUpdatedAt: '2025-12-19',
    // 3 consecutive failures on record (see seed audit event evt-9007).
    failedAttempts: 3,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-0701', companyId: 'co-05', roles: ['Employee'], employeeId: 'emp-108', status: 'active', effectiveFrom: '2025-04-22', effectiveTo: null },
    ],
  },
  {
    id: 'au-08',
    name: 'Astrid Lindqvist',
    email: 'astrid.lindqvist@satellitehr.example',
    authMethod: 'password',
    status: 'active',
    lastLogin: '2026-07-01T07:30:00Z',
    passwordUpdatedAt: '2026-05-10',
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    // Platform administrator with no workforce record at all (AUTH-07).
    memberships: [
      { id: 'm-0801', companyId: 'co-01', roles: ['Viewer'], employeeId: null, status: 'active', effectiveFrom: '2024-06-01', effectiveTo: null },
      { id: 'm-0802', companyId: 'co-04', roles: ['Viewer'], employeeId: null, status: 'active', effectiveFrom: '2024-06-01', effectiveTo: null },
      { id: 'm-0803', companyId: 'co-06', roles: ['Company Admin'], employeeId: null, status: 'active', effectiveFrom: '2024-06-01', effectiveTo: null },
    ],
  },
  {
    id: 'au-09',
    name: 'Jonas Weber',
    email: 'jonas.weber@meridianhealth.example',
    authMethod: 'office365',
    status: 'invited',
    lastLogin: null,
    passwordUpdatedAt: null,
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-0901', companyId: 'co-06', roles: ['HR Manager'], employeeId: null, status: 'active', effectiveFrom: '2026-06-20', effectiveTo: null },
    ],
  },
  {
    id: 'au-10',
    name: 'Fatima Al-Rashid',
    email: 'fatima.alrashid@northwind.example',
    authMethod: 'saml',
    status: 'active',
    lastLogin: '2026-06-29T13:11:00Z',
    passwordUpdatedAt: null,
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-1001', companyId: 'co-01', roles: ['Recruiter'], employeeId: null, status: 'active', effectiveFrom: '2025-07-08', effectiveTo: null },
      { id: 'm-1002', companyId: 'co-02', roles: ['Recruiter'], employeeId: null, status: 'active', effectiveFrom: '2025-07-08', effectiveTo: null },
      { id: 'm-1003', companyId: 'co-03', roles: ['Recruiter', 'Viewer'], employeeId: null, status: 'active', effectiveFrom: '2025-10-01', effectiveTo: null },
    ],
  },
  {
    id: 'au-11',
    name: 'Marco Bellini',
    email: 'marco.bellini@aurorahold.example',
    authMethod: 'password',
    status: 'invited',
    lastLogin: null,
    passwordUpdatedAt: null,
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-1101', companyId: 'co-05', roles: ['Viewer'], employeeId: null, status: 'active', effectiveFrom: '2026-06-27', effectiveTo: null },
    ],
  },
  {
    id: 'au-12',
    name: 'Nadia Kowalczyk',
    email: 'nadia.kowalczyk@meridianhealth.example',
    authMethod: 'password',
    status: 'active',
    lastLogin: '2026-06-26T15:38:00Z',
    // Stale credential — demonstrates password-expiry enforcement at sign-in.
    passwordUpdatedAt: '2026-02-28',
    failedAttempts: 0,
    lockedAt: null,
    mfaEnrolled: false,
    memberships: [
      { id: 'm-1201', companyId: 'co-06', roles: ['Payroll Admin'], employeeId: null, status: 'active', effectiveFrom: '2025-05-19', effectiveTo: null },
    ],
  },
]

export function activeMemberships(user: AuthUser): CompanyMembership[] {
  return user.memberships.filter((m) => m.status === 'active')
}
