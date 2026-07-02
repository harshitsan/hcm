/**
 * Platform Administration — roles & permission model (SYS-07, 10, 12, 17,
 * 31). Roles are personas composed of reusable permission sets; employee and
 * contractor role catalogs are kept separate.
 */

export interface PermissionSet {
  id: string
  name: string
  capabilities: string[]
}

export const ROLE_CATALOGS = ['employee', 'contractor', 'any'] as const
export type RoleCatalog = (typeof ROLE_CATALOGS)[number]

export interface RoleDef {
  id: string
  name: string
  /** Workforce-type catalog boundary for assignment (SYS-12). */
  catalog: RoleCatalog
  /** Composable permission sets — reusable across roles (SYS-10). */
  permissionSetIds: string[]
  /** Effective scope of the persona (SYS-17, 31). */
  scope: string
}

export const seedPermissionSets: PermissionSet[] = [
  {
    id: 'ps-emp-core',
    name: 'Employee core',
    capabilities: ['View own profile', 'Update own profile', 'Submit leave', 'View attendance'],
  },
  {
    id: 'ps-hr-ops',
    name: 'HR operations',
    capabilities: ['Manage employees', 'Apply policies', 'Run lifecycle workflows', 'Leave & attendance admin'],
  },
  {
    id: 'ps-approvals',
    name: 'Team approvals',
    capabilities: ['Approve leave', 'Approve attendance', 'Approve onboarding steps'],
  },
  {
    id: 'ps-reporting',
    name: 'Reporting',
    capabilities: ['Run reports', 'Export data'],
  },
  {
    id: 'ps-identity',
    name: 'Identity & access',
    capabilities: ['Assign roles', 'Configure SSO', 'Run access audits'],
  },
  {
    id: 'ps-readonly',
    name: 'Read-only compliance',
    capabilities: ['View employees', 'View attendance & leave', 'Compliance exports'],
  },
]

export const seedRoles: RoleDef[] = [
  {
    id: 'role-hr-admin',
    name: 'Company HR Administrator',
    catalog: 'employee',
    permissionSetIds: ['ps-hr-ops', 'ps-approvals', 'ps-reporting'],
    scope: 'Company-wide HR, no tenant-wide technical control',
  },
  {
    id: 'role-it-sec',
    name: 'Company IT / Security Admin',
    catalog: 'employee',
    permissionSetIds: ['ps-identity'],
    scope: 'Identity, access & security only',
  },
  {
    id: 'role-fin-view',
    name: 'Finance / Compliance Viewer',
    catalog: 'employee',
    permissionSetIds: ['ps-readonly'],
    scope: 'Read-only — HR operations denied',
  },
  {
    id: 'role-mgr',
    name: 'Department Head / People Manager',
    catalog: 'employee',
    permissionSetIds: ['ps-emp-core', 'ps-approvals'],
    scope: 'Assigned team members only',
  },
  {
    id: 'role-func-mgr',
    name: 'Functional / Project Manager',
    catalog: 'employee',
    permissionSetIds: ['ps-approvals'],
    scope: 'Assigned functional groups only',
  },
  {
    id: 'role-emp',
    name: 'Standard Employee',
    catalog: 'employee',
    permissionSetIds: ['ps-emp-core'],
    scope: 'Self-service, policy-limited',
  },
  {
    id: 'role-pf-ops',
    name: 'Portfolio HR Operations',
    catalog: 'any',
    permissionSetIds: ['ps-hr-ops', 'ps-reporting'],
    scope: 'Assigned portfolio companies, no master data',
  },
  {
    id: 'role-pf-audit',
    name: 'Portfolio Read-Only / Auditor',
    catalog: 'any',
    permissionSetIds: ['ps-readonly'],
    scope: 'Portfolio-wide, no transactions',
  },
  {
    id: 'role-ctr',
    name: 'Contractor (engagement access)',
    catalog: 'contractor',
    permissionSetIds: ['ps-emp-core'],
    scope: 'Own engagement only',
  },
  {
    id: 'role-ctr-lead',
    name: 'Contractor Lead',
    catalog: 'contractor',
    permissionSetIds: ['ps-emp-core', 'ps-reporting'],
    scope: 'Own crew timesheets only',
  },
]
