import { RoleGate } from '@/context/role-context'
import { type RoleAssignment } from '../data/assignments'
import { type RoleDef } from '../data/roles'
import { type ScopeRule } from '../data/scope-rules'
import { type SecurityConfigStore } from '../hooks/use-security-config'
import { AccessEnginePanel } from './access-engine-panel'
import { MfaSigninPanel } from './mfa-signin-panel'
import { NonUserPanel } from './non-user-panel'

/**
 * "My Access" — the employee-facing security surface. Employee (User):
 * access-control engine evaluation on every request (RSEC-20), MFA
 * enrollment and challenge at sign-in (RSEC-12) and the permission-aware UI
 * preview (RSEC-23). Employee (Non-User): how the same RBAC scope governs a
 * record that has no login (RSEC-13).
 */
export function AccessTab({
  assignments,
  roles,
  scopeRules,
  config,
}: {
  assignments: RoleAssignment[]
  roles: RoleDef[]
  scopeRules: ScopeRule[]
  config: SecurityConfigStore
}) {
  return (
    <div className='w-full space-y-4'>
      <RoleGate roles={['Employee (User)']}>
        <MfaSigninPanel store={config} />
        <AccessEnginePanel assignments={assignments} roles={roles} />
      </RoleGate>
      <RoleGate roles={['Employee (Non-User)']}>
        <NonUserPanel rules={scopeRules} />
      </RoleGate>
    </div>
  )
}
