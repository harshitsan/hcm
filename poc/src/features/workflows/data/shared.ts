import type { Role } from '@/context/role-context'

/**
 * Shared dimension values for the Workflow Engine POC. Routing conditions
 * (WFE-02, WFE-23) key on these organizational and transaction attributes.
 */

export const COMPANIES = [
  'Aurora Foods',
  'Aurora Fresh Retail',
  'Northwind Logistics',
  'Zenith Software',
] as const

/** Companies inside the "Aurora Group" (Group Company Admin scope, WFE-16). */
export const GROUP_COMPANIES = ['Aurora Foods', 'Aurora Fresh Retail'] as const

export const JURISDICTIONS = [
  'India',
  'United States',
  'United Kingdom',
] as const

export const LOCATIONS = [
  'Hyderabad',
  'Chennai',
  'Pune',
  'Austin',
  'London',
] as const

export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Operations',
  'Sales',
] as const

export const ORG_GROUPS = ['Aurora Group', 'Independent'] as const

export const TRANSACTION_TYPES = [
  'Leave Request',
  'Overtime',
  'Comp Off',
  'Attendance Change',
  'Work From Home',
  'Expense Claim',
  'Exit Clearance',
  'Confirmation',
  'Disciplinary Action',
  'Layoff',
] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const APPROVAL_PATTERNS = [
  'sequential',
  'parallel-any',
  'parallel-all',
] as const

export type ApprovalPattern = (typeof APPROVAL_PATTERNS)[number]

export const PATTERN_LABELS: Record<ApprovalPattern, string> = {
  sequential: 'Sequential',
  'parallel-any': 'Parallel — any one',
  'parallel-all': 'Parallel — all must',
}

export const ESCALATION_STRATEGIES = [
  'manager',
  'role',
  'time-reassignment',
  'multi-level',
] as const

export type EscalationStrategy = (typeof ESCALATION_STRATEGIES)[number]

export const ESCALATION_LABELS: Record<EscalationStrategy, string> = {
  manager: 'Manager escalation',
  role: 'Role escalation',
  'time-reassignment': 'Time-based reassignment',
  'multi-level': 'Multi-level escalation',
}

/** People that can appear as approvers in chains and decision tables. */
export const PEOPLE = [
  'Ananya Sharma',
  'Vikram Rao',
  'Sunita Patil',
  'Farhan Ali',
  'Meera Iyer',
  'Priya Menon',
  'Rohit Verma',
  'David Kim',
  'Elena Garcia',
  'Arjun Mehta',
] as const

/** Persona used for the Employee (User) approver inbox. */
export const CURRENT_APPROVER = 'Ananya Sharma'

/** Reporting lines used by manager escalation (WFE-07). */
export const MANAGERS: Record<string, string> = {
  'Ananya Sharma': 'Vikram Rao',
  'Vikram Rao': 'Meera Iyer',
  'Rohit Verma': 'Meera Iyer',
  'Priya Menon': 'Sunita Patil',
  'Farhan Ali': 'Meera Iyer',
  'David Kim': 'Farhan Ali',
  'Elena Garcia': 'Sunita Patil',
}

export const DEFAULT_ESCALATION_TARGET = 'Sunita Patil'

/** Named roles resolvable by role escalation (WFE-07, WFE-15). */
export const ROLE_HOLDERS: Record<string, string> = {
  'HR Director': 'Sunita Patil',
  'Finance Controller': 'Farhan Ali',
  'Operations Head': 'Meera Iyer',
  'Compliance Officer': 'Elena Garcia',
  'Group HR Head': 'Arjun Mehta',
}

/** Named persona acting for each canonical role (stamped on audit entries). */
export const ACTORS: Record<Role, string> = {
  'Platform Admin': 'Platform Ops',
  'Portfolio Admin': 'Devika Rao',
  'Group Company Admin': 'Arjun Mehta',
  'Company Admin': 'Sunita Patil',
  'Employee (User)': 'Ananya Sharma',
  'Employee (Non-User)': 'Ravi Naik',
}

/**
 * Companies visible to the active role — Company Admins see their company,
 * Group Company Admins see the Aurora Group, Portfolio/Platform see all
 * (WFE-16, WFE-17, WFE-18).
 */
export function companiesForRole(role: Role): string[] {
  switch (role) {
    case 'Company Admin':
    case 'Employee (User)':
    case 'Employee (Non-User)':
      return ['Aurora Foods']
    case 'Group Company Admin':
      return [...GROUP_COMPANIES]
    default:
      return [...COMPANIES]
  }
}
