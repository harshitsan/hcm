import { type SecurityConfigStore } from '../hooks/use-security-config'
import { AuthActiveDirectory } from './auth-active-directory'
import { AuthMfaPanel } from './auth-mfa-panel'
import { AuthPasswordPolicy } from './auth-password-policy'

/**
 * Authentication configuration for the Company Admin: MFA per company
 * (RSEC-08), the password policy screen (RSEC-24 … RSEC-29) and Manage
 * Active Directory (RSEC-30 … RSEC-32).
 */
export function AuthenticationTab({ store }: { store: SecurityConfigStore }) {
  return (
    <div className='w-full space-y-4'>
      <AuthMfaPanel store={store} />
      <AuthPasswordPolicy store={store} />
      <AuthActiveDirectory store={store} />
    </div>
  )
}
