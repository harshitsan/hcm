import { useRef } from 'react'
import { type SecurityConfigStore } from '../hooks/use-security-config'
import { AuthActiveDirectory } from './auth-active-directory'
import { AuthMfaPanel } from './auth-mfa-panel'
import { AuthPasswordPolicy } from './auth-password-policy'

/**
 * Authentication configuration for the Company Admin: MFA per company
 * (RSEC-08), the password policy screen (RSEC-24 … RSEC-29) and Manage
 * Active Directory (RSEC-30 … RSEC-32).
 *
 * PWD-07 / AD-07: the sections form an ordered setup flow — each step offers
 * "Save & Next" so the admin can persist settings and continue efficiently;
 * finishing the last step (Active Directory) advances to Jobs & Support.
 */
export function AuthenticationTab({
  store,
  onFinish,
}: {
  store: SecurityConfigStore
  /** Called after "Save & Next" on the final step (Active Directory). */
  onFinish?: () => void
}) {
  const adSectionRef = useRef<HTMLDivElement>(null)

  const goToActiveDirectory = () => {
    adSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className='w-full space-y-4'>
      <section>
        <p className='text-neutral-1000 mb-1 text-xs font-medium'>
          Step 1 of 3 — Multi-factor authentication
        </p>
        <AuthMfaPanel store={store} />
      </section>
      <section>
        <p className='text-neutral-1000 mb-1 text-xs font-medium'>
          Step 2 of 3 — Password policy
        </p>
        <AuthPasswordPolicy store={store} onNext={goToActiveDirectory} />
      </section>
      <section ref={adSectionRef} className='scroll-mt-4'>
        <p className='text-neutral-1000 mb-1 text-xs font-medium'>
          Step 3 of 3 — Active Directory
        </p>
        <AuthActiveDirectory
          store={store}
          onNext={onFinish}
          nextLabel='Jobs & Support'
        />
      </section>
    </div>
  )
}
