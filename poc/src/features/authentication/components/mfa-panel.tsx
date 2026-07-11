import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { COMPANIES, manageableCompanyIds } from '../data/companies'
import { type AuthConfigStore } from '../hooks/use-auth-config'

interface MfaPanelProps {
  config: Pick<AuthConfigStore, 'mfaCompanyIds' | 'toggleMfaCompany'>
}

/**
 * Per-company multi-factor authentication requirement (BRD Phase I 6.12.5).
 * When a company requires MFA, its members enroll an authenticator on their
 * next sign-in and answer a one-time-code challenge on every sign-in after;
 * enrollment and challenge outcomes land in the audit log.
 */
export function MfaPanel({ config }: MfaPanelProps) {
  const { role } = useRole()
  const scope = manageableCompanyIds(role)
  const actor = `${role} (demo)`

  return (
    <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Multi-factor authentication
        </h3>
        {scope.length === 0 && (
          <Badge variant='pending'>Read-only — admins manage this</Badge>
        )}
      </div>
      <div className='space-y-3'>
        {COMPANIES.map((c) => {
          const required = config.mfaCompanyIds.includes(c.id)
          return (
            <div
              key={c.id}
              className='flex items-center justify-between rounded border border-gray-100 p-2.5'
            >
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1900 text-sm font-medium'>
                  {c.name}
                </span>
                <Badge variant={required ? 'badge_active' : 'badge_inactive'}>
                  {required ? 'MFA required' : 'Off'}
                </Badge>
              </div>
              <Switch
                checked={required}
                disabled={!scope.includes(c.id)}
                onCheckedChange={() => config.toggleMfaCompany(c.id, actor)}
                aria-label={`Toggle MFA for ${c.name}`}
              />
            </div>
          )
        })}
      </div>
      <p className='text-neutral-1000 mt-3 text-xs'>
        Members of an MFA-required company enroll an authenticator (TOTP) on
        their next sign-in and enter a one-time code on every sign-in after —
        for local and SSO methods alike. Every enrollment and challenge is
        audited.
      </p>
    </div>
  )
}
