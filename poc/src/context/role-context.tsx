import { createContext, useContext, useEffect, useState } from 'react'

/**
 * SatelliteHR POC — mock role switcher.
 *
 * The user stories are role-specific across 6 canonical actors. The POC has no
 * backend, so the active role is a client-side toggle (persisted in
 * localStorage) that features use to gate role-specific UI.
 */
export const ROLES = [
  'Platform Admin',
  'Portfolio Admin',
  'Group Company Admin',
  'Company Admin',
  'Employee (User)',
  'Employee (Non-User)',
] as const

export type Role = (typeof ROLES)[number]

const ROLE_STORAGE_KEY = 'satellitehr-poc-role'
// The platform owner is the default persona — above every tenant, landing on
// the platform overview dashboard (billing, tenant hierarchy, adoption).
const DEFAULT_ROLE: Role = 'Platform Admin'

type RoleContextType = {
  role: Role
  setRole: (role: Role) => void
  /** True when the active role is any of the given roles. */
  hasRole: (...roles: Role[]) => boolean
}

const RoleContext = createContext<RoleContextType | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, _setRole] = useState<Role>(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY)
    return ROLES.includes(saved as Role) ? (saved as Role) : DEFAULT_ROLE
  })

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, role)
  }, [role])

  const setRole = (next: Role) => _setRole(next)
  const hasRole = (...roles: Role[]) => roles.includes(role)

  return (
    <RoleContext.Provider value={{ role, setRole, hasRole }}>
      {children}
    </RoleContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within <RoleProvider>')
  return ctx
}

/**
 * Renders children only when the active role matches. Use to gate
 * role-specific actions per the user stories.
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { role } = useRole()
  return roles.includes(role) ? <>{children}</> : <>{fallback}</>
}
