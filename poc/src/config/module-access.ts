import { type NavGroup } from '@/components/layout/types'
import { type Role } from '@/context/role-context'

/**
 * SatelliteHR POC — role → module access matrix (RBAC).
 *
 * Which of the 6 canonical roles may open each module (keyed by the module's
 * top-level route path). Derived from the BRD/roles-and-security access model:
 * platform-scope modules for the provider, tenant HR modules for company
 * admins, oversight modules for portfolio/group admins, self-service for
 * employees. Employee (Non-User) has no system access, so appears in none.
 *
 * Enforced in three places: the sidebar (hides inaccessible items), the route
 * guard (blocks direct navigation), and the dashboard (hides inaccessible
 * cards). This is the single source of truth for all three.
 */
const P: Role = 'Platform Admin'
const PF: Role = 'Portfolio Admin'
const G: Role = 'Group Company Admin'
const C: Role = 'Company Admin'
const EU: Role = 'Employee (User)'

export const MODULE_ACCESS: Record<string, readonly Role[]> = {
  // Organization
  '/companies': [P, PF, G, C],
  '/group-companies': [P, G],
  '/portfolios': [P, PF],
  '/jurisdictions': [P, C],
  '/locations': [C, G],
  '/departments': [C],
  '/positions': [C],
  '/org-groups': [C],
  '/directory': [P, PF, G, C, EU],
  // Workforce
  '/employees': [P, PF, G, C],
  '/lifecycle': [PF, G, C],
  '/self-service': [EU],
  '/recruitment': [C],
  '/leave': [PF, G, C, EU],
  '/attendance': [PF, G, C, EU],
  '/assets': [C, EU],
  // Policies & Comms
  '/policies': [P, C],
  '/policy-distribution': [C, EU],
  '/announcements': [P, PF, G, C, EU],
  '/notifications': [P, C],
  '/hr-letters': [C],
  '/feedback': [C, EU],
  // Platform
  '/workflows': [P, C],
  '/custom-fields': [P, C],
  '/data-management': [P, C],
  '/documents': [C, EU],
  '/reports': [P, PF, G, C],
  '/roles-security': [P, C],
  '/authentication': [P, C],
  '/audit-logs': [P, PF, G, C, EU],
  '/platform-admin': [P],
}

/** Top-level route segment for a path, e.g. `/companies/detail` → `/companies`. */
export function moduleKey(pathname: string): string {
  const seg = pathname.split('?')[0].split('/')[1] ?? ''
  return seg ? `/${seg}` : '/'
}

/**
 * Whether `role` may open the given path. The dashboard (`/`) and any path not
 * in the matrix (template pages) are always allowed — the matrix is an
 * allow-list only for the modules it names.
 */
export function canAccess(role: Role, pathname: string): boolean {
  const key = moduleKey(pathname)
  if (key === '/') return true
  const allowed = MODULE_ACCESS[key]
  if (!allowed) return true
  return allowed.includes(role)
}

/** Roles permitted for a path (empty if the path isn't a gated module). */
export function rolesForPath(pathname: string): readonly Role[] {
  return MODULE_ACCESS[moduleKey(pathname)] ?? []
}

/** Nav groups with inaccessible items removed and empty groups dropped. */
export function filterNavGroups(role: Role, groups: NavGroup[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        'url' in item && item.url ? canAccess(role, String(item.url)) : true
      ),
    }))
    .filter((group) => group.items.length > 0)
}
