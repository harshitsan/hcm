import { useState } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type AuthConfigStore } from '../hooks/use-auth-config'

interface TemplatesPanelProps {
  config: Pick<
    AuthConfigStore,
    'templates' | 'customizeTemplate' | 'sendTestNotification'
  >
}

/**
 * Notification/template engine for authentication messages (AUTH-18).
 * Reset links and security alerts render from these governed templates;
 * tenants customize subjects without code changes and test-sends are audited.
 */
export function TemplatesPanel({ config }: TemplatesPanelProps) {
  const { role } = useRole()
  const canEdit = role === 'Company Admin' || role === 'Platform Admin'
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const saveSubject = (id: string, fallback: string) => {
    const subject = (drafts[id] ?? fallback).trim()
    if (subject.length < 5) {
      toast.error('Subject must be at least 5 characters')
      return
    }
    config.customizeTemplate(id, subject, `${role} (demo)`)
    setDrafts((prev) => ({ ...prev, [id]: '' }))
  }

  return (
    <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Security notification templates
        </h3>
        {!canEdit && <Badge variant='pending'>Read-only for {role}</Badge>}
      </div>
      <div className='space-y-3'>
        {config.templates.map((t) => (
          <div key={t.id} className='rounded border border-gray-100 p-2.5'>
            <div className='mb-1.5 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-neutral-1900 text-sm font-medium'>
                  {t.name}
                </span>
                <Badge variant={t.customized ? 'qualified' : 'pending'}>
                  {t.customized ? 'Tenant customized' : 'Platform default'}
                </Badge>
              </div>
              <span className='text-neutral-1000 text-xs'>{t.channel}</span>
            </div>
            <p className='text-neutral-1000 mb-1.5 text-xs'>
              Trigger: {t.trigger}
            </p>
            <div className='flex items-center gap-2'>
              <Input
                value={drafts[t.id] ?? t.subject}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                }
                disabled={!canEdit}
                className='h-7 text-xs'
              />
              {canEdit && (
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 shrink-0 px-2 text-xs'
                  onClick={() => saveSubject(t.id, t.subject)}
                >
                  Save subject
                </Button>
              )}
              <Button
                variant='outline'
                size='sm'
                className='h-7 shrink-0 px-2 text-xs'
                onClick={() =>
                  config.sendTestNotification(t, 'you@company.example')
                }
              >
                Send test
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className='text-neutral-1000 mt-3 text-xs'>
        The shared notification engine renders these templates for password
        resets, password changes and new-context sign-ins. Every delivery is
        recorded in the authentication audit log.
      </p>
    </div>
  )
}
