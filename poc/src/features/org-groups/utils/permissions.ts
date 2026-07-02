import { type Role } from '@/context/role-context'
import { type GroupScope, type OrgGroup } from '../data/groups'

/**
 * Scope-based write authorization matrix:
 * - Global groups are writable only by the Platform Admin (FR 6.6.1).
 * - Group-company groups by the Group Company Admin (and Platform Admin).
 * - Company groups by the Company Admin and above.
 * - Portfolio Admin has governance (read/audit) access, not group CRUD.
 */
export function canManageScope(role: Role, scope: GroupScope): boolean {
  switch (role) {
    case 'Platform Admin':
      return true
    case 'Group Company Admin':
      return scope === 'group-company' || scope === 'company'
    case 'Company Admin':
      return scope === 'company'
    default:
      return false
  }
}

export function canManageGroup(role: Role, group: OrgGroup): boolean {
  return canManageScope(role, group.scope)
}

/** Scopes the active role may pick when creating a group. */
export function creatableScopes(role: Role): GroupScope[] {
  switch (role) {
    case 'Platform Admin':
      return ['global', 'group-company', 'company']
    case 'Group Company Admin':
      return ['group-company', 'company']
    case 'Company Admin':
      return ['company']
    default:
      return []
  }
}

/** Roles allowed to approve membership change requests on sensitive groups. */
export function canApproveRequests(role: Role): boolean {
  return role === 'Group Company Admin' || role === 'Platform Admin'
}

/**
 * Membership changes made by a Company Admin on an approval-controlled group
 * are held pending; approver roles apply immediately.
 */
export function needsApproval(role: Role, group: OrgGroup): boolean {
  return group.requiresApproval && !canApproveRequests(role)
}

/** Named persona per role — used as the actor on audits, versions and requests. */
export function actorFor(role: Role): string {
  switch (role) {
    case 'Platform Admin':
      return 'Asha Verma (Platform Admin)'
    case 'Portfolio Admin':
      return 'Nikhil Bhat (Portfolio Admin)'
    case 'Group Company Admin':
      return 'Rahul Menon (Group Company Admin)'
    case 'Company Admin':
      return 'Divya Rao (Company Admin)'
    case 'Employee (User)':
      return 'Ananya Sharma (Employee)'
    case 'Employee (Non-User)':
      return 'Sunita Devi (Employee)'
  }
}
