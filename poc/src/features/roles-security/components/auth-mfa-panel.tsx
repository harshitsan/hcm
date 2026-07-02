import { Switch } from '@/components/ui/switch'
import { HOME_COMPANY_ID, companyName } from '../data/directory'
import { type SecurityConfigStore } from '../hooks/use-security-config'
import { SecurityBadge } from './badges'

/**
 * Company-level MFA configuration (RSEC-08): the toggle applies to this
 * company only; other companies' policies are shown read-only to make the
 * independent enforcement visible.
 */
export function AuthMfaPanel({ store }: { store: SecurityConfigStore }) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
        Multi-factor authentication
        <span className='text-neutral-1000 ml-2 text-xs'>
          configured per company — each company&apos;s policy is enforced
          independently
        </span>
      </h3>
      <div className='space-y-2'>
        {store.companySecurity.map((c) => {
          const own = c.companyId === HOME_COMPANY_ID
          return (
            <div
              key={c.companyId}
              className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'
            >
              <div>
                <p className='text-neutral-1600 text-sm font-medium'>
                  {companyName(c.companyId)}
                  {own && (
                    <span className='text-neutral-1000 ml-1 text-xs'>
                      (your company)
                    </span>
                  )}
                </p>
                <p className='text-neutral-1000 text-xs'>
                  {c.mfaEnabled
                    ? 'Users must complete an additional factor at sign-in'
                    : 'No additional factor required at sign-in'}
                </p>
              </div>
              {own ? (
                <Switch
                  variant='blue'
                  checked={c.mfaEnabled}
                  onCheckedChange={(v) => store.setMfa(c.companyId, v)}
                />
              ) : (
                <SecurityBadge value={c.mfaEnabled ? 'Enabled' : 'Disabled'} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
