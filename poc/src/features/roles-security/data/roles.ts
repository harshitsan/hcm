/**
 * Role catalog — roles are versioned, effective-dated governed configuration
 * (RSEC-18): every edit produces a new version and prior versions are
 * retained for audit. Roles are scoped to exactly one hierarchy level
 * (RSEC-01, RSEC-11) and carry screen-level permissions (RSEC-33, RSEC-34)
 * plus an admin flag (RSEC-35).
 */
import type { HierarchyLevel } from './directory'

export const PERMISSION_FUNCTIONS = [
  'View employee records',
  'Edit employee records',
  'Approve leave',
  'Approve timesheets',
  'Run payroll',
  'Manage roles & security',
  'View reports',
  'Manage organization setup',
  'View salary data',
  'View tax data',
  'View payroll reports',
] as const
export type PermissionFunction = (typeof PERMISSION_FUNCTIONS)[number]

/**
 * Compensation-visibility rule (Phase 1 policy): salary, tax and payroll
 * report data may only be granted to the HR Admin and Finance & Compliance
 * Viewer roles, or to platform/portfolio-scoped roles.
 */
export const COMPENSATION_PERMISSIONS = [
  'View salary data',
  'View tax data',
  'View payroll reports',
] as const satisfies readonly PermissionFunction[]

const COMPENSATION_PERMISSION_SET = new Set<PermissionFunction>(
  COMPENSATION_PERMISSIONS
)

export function isCompensationPermission(
  permission: PermissionFunction
): boolean {
  return COMPENSATION_PERMISSION_SET.has(permission)
}

const COMPENSATION_ELIGIBLE_ROLE_NAMES = [
  'hr admin',
  'finance & compliance viewer',
]

/** Whether a role may hold any of the three compensation permissions. */
export function canHoldCompensationPermissions(
  name: string,
  scopeLevel: HierarchyLevel
): boolean {
  if (scopeLevel === 'Platform' || scopeLevel === 'Portfolio') return true
  return COMPENSATION_ELIGIBLE_ROLE_NAMES.includes(name.trim().toLowerCase())
}

export const ROLE_STATUSES = ['Published', 'Draft'] as const
export type RoleStatus = (typeof ROLE_STATUSES)[number]

export interface RoleVersion {
  version: number
  effectiveFrom: string
  permissions: PermissionFunction[]
  changedBy: string
  changedOn: string
  note: string
}

export interface RoleDef {
  id: string
  name: string
  description: string
  isAdmin: boolean
  scopeLevel: HierarchyLevel
  /** Portfolio / group / company id the role is scoped to (null = platform). */
  scopeEntityId: string | null
  permissions: PermissionFunction[]
  /** Screen-level permissions granted to the role (RSEC-33). */
  screenIds: string[]
  version: number
  effectiveFrom: string
  status: RoleStatus
  /** Prior versions — never physically deleted (RSEC-18). */
  history: RoleVersion[]
}

export const seedRoles: RoleDef[] = [
  {
    id: 'role-01',
    name: 'Platform Support',
    description: 'Authorized support staff able to assist any tenant',
    isAdmin: true,
    scopeLevel: 'Platform',
    scopeEntityId: null,
    permissions: ['View employee records', 'View reports', 'Manage roles & security'],
    screenIds: ['scr-13', 'scr-14', 'scr-18'],
    version: 3,
    effectiveFrom: '2026-05-01',
    status: 'Published',
    history: [
      {
        version: 1,
        effectiveFrom: '2025-11-01',
        permissions: ['View employee records'],
        changedBy: 'Platform Ops',
        changedOn: '2025-10-28',
        note: 'Initial definition',
      },
      {
        version: 2,
        effectiveFrom: '2026-02-01',
        permissions: ['View employee records', 'View reports'],
        changedBy: 'Platform Ops',
        changedOn: '2026-01-25',
        note: 'Added reporting access for support triage',
      },
    ],
  },
  {
    id: 'role-02',
    name: 'Portfolio Auditor',
    description: 'Read-only oversight across every company in the portfolio',
    isAdmin: false,
    scopeLevel: 'Portfolio',
    scopeEntityId: 'pf-1',
    permissions: ['View employee records', 'View reports'],
    screenIds: ['scr-16', 'scr-17'],
    version: 1,
    effectiveFrom: '2026-01-15',
    status: 'Published',
    history: [],
  },
  {
    id: 'role-03',
    name: 'Group HR Admin',
    description: 'HR administration across Meridian Tech Group companies',
    isAdmin: true,
    scopeLevel: 'Group Company',
    scopeEntityId: 'grp-1',
    permissions: [
      'View employee records',
      'Edit employee records',
      'Approve leave',
      'Manage organization setup',
    ],
    screenIds: ['scr-07', 'scr-08', 'scr-09', 'scr-16', 'scr-17'],
    version: 2,
    effectiveFrom: '2026-04-01',
    status: 'Published',
    history: [
      {
        version: 1,
        effectiveFrom: '2026-01-01',
        permissions: ['View employee records', 'Edit employee records'],
        changedBy: 'Arjun Mehta',
        changedOn: '2025-12-20',
        note: 'Initial definition',
      },
    ],
  },
  {
    id: 'role-04',
    name: 'Group Payroll Reviewer',
    description: 'Reviews payroll runs for Meridian Retail Group',
    isAdmin: false,
    scopeLevel: 'Group Company',
    scopeEntityId: 'grp-2',
    permissions: ['View reports', 'Run payroll'],
    screenIds: ['scr-04', 'scr-05', 'scr-06'],
    version: 1,
    effectiveFrom: '2026-02-01',
    status: 'Published',
    history: [],
  },
  {
    id: 'role-05',
    name: 'Company HR Manager',
    description: 'Full HR administration for Aurora Software',
    isAdmin: true,
    scopeLevel: 'Company',
    scopeEntityId: 'co-1',
    permissions: [
      'View employee records',
      'Edit employee records',
      'Approve leave',
      'Approve timesheets',
      'Manage organization setup',
    ],
    screenIds: ['scr-07', 'scr-08', 'scr-09', 'scr-10', 'scr-16', 'scr-17', 'scr-18'],
    version: 2,
    effectiveFrom: '2026-03-01',
    status: 'Published',
    history: [
      {
        version: 1,
        effectiveFrom: '2026-01-01',
        permissions: ['View employee records', 'Edit employee records', 'Approve leave'],
        changedBy: 'Sunita Patil',
        changedOn: '2025-12-28',
        note: 'Initial definition',
      },
    ],
  },
  {
    id: 'role-06',
    name: 'Company Payroll Officer',
    description: 'Runs payroll for Aurora Software only',
    isAdmin: false,
    scopeLevel: 'Company',
    scopeEntityId: 'co-1',
    permissions: ['Run payroll', 'View reports'],
    screenIds: ['scr-04', 'scr-05', 'scr-06'],
    version: 1,
    effectiveFrom: '2026-01-01',
    status: 'Published',
    history: [],
  },
  {
    id: 'role-07',
    name: 'Team Approver',
    description: 'Approves leave and timesheets for direct reports',
    isAdmin: false,
    scopeLevel: 'Company',
    scopeEntityId: 'co-1',
    permissions: ['Approve leave', 'Approve timesheets', 'View employee records'],
    screenIds: ['scr-07', 'scr-10', 'scr-12'],
    version: 1,
    effectiveFrom: '2026-01-01',
    status: 'Published',
    history: [],
  },
  {
    id: 'role-08',
    name: 'Employee Self-Service',
    description: 'Baseline self-service access for every Aurora employee',
    isAdmin: false,
    scopeLevel: 'Company',
    scopeEntityId: 'co-1',
    permissions: ['View employee records'],
    screenIds: ['scr-13', 'scr-14', 'scr-15'],
    version: 1,
    effectiveFrom: '2026-01-01',
    status: 'Published',
    history: [],
  },
  {
    id: 'role-09',
    name: 'Finance Viewer',
    description: 'Read-only finance dashboards for Northwind Analytics',
    isAdmin: false,
    scopeLevel: 'Company',
    scopeEntityId: 'co-2',
    permissions: ['View reports'],
    screenIds: ['scr-04'],
    version: 1,
    effectiveFrom: '2026-02-15',
    status: 'Published',
    history: [],
  },
  {
    id: 'role-10',
    name: 'Retail Ops Manager',
    description: 'Store operations management for Cedar Retail (draft)',
    isAdmin: false,
    scopeLevel: 'Company',
    scopeEntityId: 'co-3',
    permissions: ['View employee records', 'Approve timesheets'],
    screenIds: ['scr-10', 'scr-11'],
    version: 1,
    effectiveFrom: '2026-08-01',
    status: 'Draft',
    history: [],
  },
  {
    id: 'role-11',
    name: 'HR Admin',
    description:
      'HR administration for Aurora Software with access to salary and tax data',
    isAdmin: true,
    scopeLevel: 'Company',
    scopeEntityId: 'co-1',
    permissions: [
      'View employee records',
      'Edit employee records',
      'View reports',
      'View salary data',
      'View tax data',
      'View payroll reports',
    ],
    screenIds: ['scr-07', 'scr-08', 'scr-09', 'scr-16', 'scr-17'],
    version: 1,
    effectiveFrom: '2026-05-01',
    status: 'Published',
    history: [],
  },
  {
    id: 'role-12',
    name: 'Finance & Compliance Viewer',
    description:
      'Read-only compensation visibility for Aurora Software finance and compliance staff',
    isAdmin: false,
    scopeLevel: 'Company',
    scopeEntityId: 'co-1',
    permissions: [
      'View reports',
      'View salary data',
      'View tax data',
      'View payroll reports',
    ],
    screenIds: ['scr-04', 'scr-16', 'scr-17'],
    version: 1,
    effectiveFrom: '2026-05-01',
    status: 'Published',
    history: [],
  },
]

/* ---------- Project roles (RSEC-36) ---------- */

export const PROJECT_TYPES = [
  'Fixed Bid',
  'Time & Material',
  'Internal',
  'Support Retainer',
] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export interface ProjectRole {
  id: string
  name: string
  projectTypes: ProjectType[]
  /** Evaluation questions associated with the role. */
  questions: string[]
}

export const seedProjectRoles: ProjectRole[] = [
  {
    id: 'pr-01',
    name: 'Project Manager',
    projectTypes: ['Fixed Bid', 'Time & Material'],
    questions: [
      'Does the resource have delivery ownership experience?',
      'Has the resource managed budgets over $100k?',
    ],
  },
  {
    id: 'pr-02',
    name: 'Tech Lead',
    projectTypes: ['Fixed Bid', 'Time & Material', 'Internal'],
    questions: ['Can the resource own architecture decisions?'],
  },
  {
    id: 'pr-03',
    name: 'QA Analyst',
    projectTypes: ['Fixed Bid', 'Support Retainer'],
    questions: ['Is the resource certified in test automation?'],
  },
  {
    id: 'pr-04',
    name: 'Support Engineer',
    projectTypes: ['Support Retainer'],
    questions: ['Has the resource handled SLA-bound tickets before?'],
  },
  {
    id: 'pr-05',
    name: 'Business Analyst',
    projectTypes: ['Internal', 'Time & Material'],
    questions: ['Can the resource run stakeholder workshops?'],
  },
]
