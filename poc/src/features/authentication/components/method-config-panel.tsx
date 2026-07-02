import { useState } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { AUTH_METHOD_LABELS } from '../data/auth-users'
import { type AuthConfigStore } from '../hooks/use-auth-config'

interface MethodConfigPanelProps {
  config: Pick<AuthConfigStore, 'methods' | 'toggleMethod' | 'saveConnection'>
}

/**
 * Platform-level authentication method availability (AUTH-10). Each method
 * toggles independently, SSO providers carry validated connection settings
 * and at least one method must always remain enabled (enforced in the hook).
 */
export function MethodConfigPanel({ config }: MethodConfigPanelProps) {
  const { role } = useRole()
  const canEdit = role === 'Platform Admin'
  const actor = `${role} (demo)`
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const saveConnection = (method: (typeof config.methods)[number]) => {
    const url = (drafts[method.method] ?? method.connectionUrl ?? '').trim()
    if (!/^(https|ldaps):\/\/.+/.test(url)) {
      toast.error('Connection URL must start with https:// or ldaps://')
      return
    }
    config.saveConnection(method.method, url, actor)
    setDrafts((prev) => ({ ...prev, [method.method]: '' }))
  }

  return (
    <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Available authentication methods
        </h3>
        {!canEdit && <Badge variant='pending'>Read-only — Platform Admin manages this</Badge>}
      </div>
      <div className='space-y-3'>
        {config.methods.map((m) => (
          <div key={m.method} className='rounded border border-gray-100 p-2.5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1900 text-sm font-medium'>
                  {AUTH_METHOD_LABELS[m.method]}
                </span>
                <Badge variant={m.enabled ? 'badge_active' : 'badge_inactive'}>
                  {m.enabled ? 'Enabled' : 'Hidden at login'}
                </Badge>
              </div>
              <Switch
                checked={m.enabled}
                disabled={!canEdit}
                onCheckedChange={() => config.toggleMethod(m.method, actor)}
                aria-label={`Toggle ${AUTH_METHOD_LABELS[m.method]}`}
              />
            </div>
            {m.method !== 'password' && (
              <div className='mt-2 flex items-center gap-2'>
                <Input
                  value={drafts[m.method] ?? m.connectionUrl ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [m.method]: e.target.value,
                    }))
                  }
                  disabled={!canEdit}
                  placeholder='https://idp.example/sso'
                  className='h-7 text-xs'
                />
                {canEdit && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 shrink-0 px-2 text-xs'
                    onClick={() => saveConnection(m)}
                  >
                    Validate &amp; save
                  </Button>
                )}
              </div>
            )}
            {m.lastValidated && (
              <p className='text-neutral-1000 mt-1.5 text-xs'>
                Connection validated {m.lastValidated} — settings stored
                securely.
              </p>
            )}
          </div>
        ))}
      </div>
      <p className='text-neutral-1000 mt-3 text-xs'>
        Disabled methods are not offered on the login screen. Disabling the
        last enabled method is prevented, and every change is audited.
      </p>
    </div>
  )
}
