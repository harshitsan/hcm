import { useState } from 'react'
import { ArrowsClockwise, X } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RoleGate, useRole } from '@/context/role-context'
import { PEOPLE } from '../data/directory'
import { seedRoles } from '../data/roles'
import { type JobRecipient } from '../data/security-config'
import { type SecurityConfigStore } from '../hooks/use-security-config'
import { SupportTeamsPanel } from './support-teams-panel'

/**
 * Schedule Job screen (RSEC-37): Platform Admins enable/disable background
 * jobs and reset IIS to apply changes. Company Admins configure who is
 * notified per job — employees or roles (RSEC-38). Support teams (RSEC-39)
 * are maintained below.
 */
export function JobsTab({ store }: { store: SecurityConfigStore }) {
  const { hasRole } = useRole()
  const [recipientPick, setRecipientPick] = useState<Record<string, string>>({})

  const canToggle = hasRole('Platform Admin')
  const canEditRecipients = hasRole('Company Admin')

  const recipientOptions: JobRecipient[] = [
    ...PEOPLE.filter((p) => p.isUser).map((p) => ({
      kind: 'Employee' as const,
      name: p.name,
    })),
    ...seedRoles.map((r) => ({ kind: 'Role' as const, name: r.name })),
  ]

  const addRecipient = (jobId: string) => {
    const key = recipientPick[jobId]
    if (!key) return
    const [kind, ...rest] = key.split('::')
    store.addJobRecipient(jobId, {
      kind: kind as JobRecipient['kind'],
      name: rest.join('::'),
    })
    setRecipientPick((prev) => ({ ...prev, [jobId]: '' }))
  }

  return (
    <div className='w-full space-y-4'>
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Scheduled Jobs
            <span className='text-neutral-1000 ml-2 text-xs'>
              {canToggle
                ? 'toggle a job and reset IIS so the schedule takes effect'
                : 'job scheduling is managed by the Platform Admin — you configure notification recipients'}
            </span>
          </h3>
          <RoleGate roles={['Platform Admin']}>
            <Button className='h-7 gap-1' onClick={store.resetIis}>
              <ArrowsClockwise size={14} weight='bold' />
              Reset IIS
            </Button>
          </RoleGate>
        </div>
        <div className='space-y-2'>
          {store.jobs.map((job) => (
            <div
              key={job.id}
              className='rounded-[6px] border border-gray-200 px-3 py-2'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {job.name}
                  </p>
                  <p className='text-neutral-1000 text-xs'>
                    {job.description} · last run: {job.lastRun ?? 'never'}
                  </p>
                </div>
                <Switch
                  variant='blue'
                  checked={job.enabled}
                  disabled={!canToggle}
                  onCheckedChange={(v) => store.toggleJob(job.id, v)}
                />
              </div>
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                <span className='text-neutral-1000 text-xs'>Notify:</span>
                {job.recipients.map((r) => (
                  <Badge key={`${r.kind}-${r.name}`} variant='open'>
                    {r.kind}: {r.name}
                    {canEditRecipients && (
                      <button
                        type='button'
                        aria-label={`Remove ${r.name}`}
                        onClick={() => store.removeJobRecipient(job.id, r)}
                      >
                        <X size={10} weight='bold' />
                      </button>
                    )}
                  </Badge>
                ))}
                {job.recipients.length === 0 && (
                  <span className='text-neutral-1000 text-xs'>
                    no recipients configured
                  </span>
                )}
                {canEditRecipients && (
                  <>
                    <div className='w-56'>
                      <Select
                        value={recipientPick[job.id] ?? ''}
                        onValueChange={(v) =>
                          setRecipientPick((prev) => ({ ...prev, [job.id]: v }))
                        }
                      >
                        <SelectTrigger variant='secondary' className='h-6 w-full text-xs'>
                          <SelectValue placeholder='Add employee or role' />
                        </SelectTrigger>
                        <SelectContent>
                          {recipientOptions.map((r) => (
                            <SelectItem
                              key={`${r.kind}::${r.name}`}
                              value={`${r.kind}::${r.name}`}
                            >
                              {r.kind}: {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant='outline'
                      className='h-6 text-xs'
                      disabled={!recipientPick[job.id]}
                      onClick={() => addRecipient(job.id)}
                    >
                      Add
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className='text-neutral-1000 pt-2 text-xs'>
          Recipients configured by role notify the role&apos;s current members
          at run time; removed recipients stop receiving notifications from
          the next run.
        </p>
      </div>

      <SupportTeamsPanel store={store} />
    </div>
  )
}
