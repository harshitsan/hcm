/**
 * Authority helpers — what each canonical persona may govern (RSEC-01,
 * RSEC-02, RSEC-03, RSEC-11): Platform Admins govern everything, Portfolio
 * Admins their portfolio, Group Company Admins only companies inside their
 * group, Company Admins a single company.
 */
import type { Role } from '@/context/role-context'
import {
  COMPANIES,
  GROUP_COMPANIES,
  HOME_COMPANY_ID,
  MY_GROUP_ID,
  type HierarchyLevel,
} from './directory'

/** Companies the active persona is authorized to govern / switch into. */
export function authorizedCompanyIds(role: Role): string[] {
  switch (role) {
    case 'Platform Admin':
    case 'Portfolio Admin':
      return COMPANIES.map((c) => c.id)
    case 'Group Company Admin':
      return COMPANIES.filter((c) => c.groupId === MY_GROUP_ID).map(
        (c) => c.id
      )
    default:
      return [HOME_COMPANY_ID]
  }
}

/** Hierarchy levels at which the persona may define roles (RSEC-01, RSEC-11). */
export function allowedScopeLevels(role: Role): HierarchyLevel[] {
  switch (role) {
    case 'Platform Admin':
      return ['Platform', 'Portfolio', 'Group Company', 'Company']
    case 'Portfolio Admin':
      return ['Portfolio', 'Group Company', 'Company']
    case 'Group Company Admin':
      return ['Group Company', 'Company']
    default:
      return ['Company']
  }
}

/** Group companies the persona may scope roles to. */
export function authorizedGroupIds(role: Role): string[] {
  switch (role) {
    case 'Platform Admin':
    case 'Portfolio Admin':
      return GROUP_COMPANIES.map((g) => g.id)
    case 'Group Company Admin':
      return [MY_GROUP_ID]
    default:
      return []
  }
}

/**
 * True when the persona may govern a role scoped at the given level/entity —
 * used to deny out-of-authority saves (RSEC-11: "assign roles to a company
 * outside my group → denied").
 */
export function canGovernScope(
  role: Role,
  scopeLevel: HierarchyLevel,
  scopeEntityId: string | null
): boolean {
  if (!allowedScopeLevels(role).includes(scopeLevel)) return false
  if (scopeLevel === 'Platform' || scopeLevel === 'Portfolio') {
    return role === 'Platform Admin' || role === 'Portfolio Admin'
  }
  if (scopeLevel === 'Group Company') {
    return scopeEntityId !== null && authorizedGroupIds(role).includes(scopeEntityId)
  }
  return (
    scopeEntityId !== null && authorizedCompanyIds(role).includes(scopeEntityId)
  )
}
