import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RoleGate, useRole } from '@/context/role-context'
import { type AlertsConfig } from '../data/settings'

interface AlertsTabProps {
  alerts: AlertsConfig
  saveAlerts: (draft: AlertsConfig) => void
}

const ALERT_TOGGLES: {
  key: keyof Omit<AlertsConfig, 'moduleEnabled'>
  label: string
  description: string
}[] = [
  {
    key: 'attendanceReminder',
    label: 'Attendance not recorded',
    description:
      'Remind an employee when they have not recorded attendance for the period; recurs per schedule until resolved.',
  },
  {
    key: 'announcementAlert',
    label: 'New announcement published',
    description:
      'Alert affected employees when a new company announcement is published.',
  },
  {
    key: 'pendingTaskAlert',
    label: 'Task awaiting action',
    description:
      'Alert employees about tasks pending their action so nothing is forgotten.',
  },
  {
    key: 'overdueTaskAlert',
    label: 'Task past due date',
    description:
      'Alert the responsible employee when a task passes its due date.',
  },
]

/**
 * Kensium Configuration > HRMS > Alerts (NTF-35..41): master module switch
 * with Save & Next / Cancel, then the Configure Alerts toggles saved together
 * in a single atomic action. Reopening always reflects the persisted values.
 */
export function AlertsTab({ alerts, saveAlerts }: AlertsTabProps) {
  const { hasRole } = useRole()
  const canConfigure = hasRole('Company Admin', 'Group Company Admin')
  const [step, setStep] = useState<'setup' | 'configure'>('setup')
  const [draft, setDraft] = useState<AlertsConfig>(alerts)

  const resetDraft = () => setDraft(alerts)

  const setField = (key: keyof AlertsConfig, value: boolean) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const dirty = JSON.stringify(draft) !== JSON.stringify(alerts)

  return (
    <div className='mx-auto w-full max-w-[760px]'>
      {step === 'setup' ? (
        <Card className='gap-3 border-none bg-white py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
              <BellRing className='text-blue-1400 size-4' />
              Alerts setup (step 1 of 2)
            </CardTitle>
            <p className='text-paragraph-sm text-neutral-1000'>
              Master switch for the Alerts module. When set to No and saved, no
              alerts are generated anywhere in the HRMS.
            </p>
          </CardHeader>
          <CardContent className='space-y-4 px-4'>
            <div className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
              <div>
                <Label htmlFor='alerts-master' className='text-sm font-medium'>
                  Enable Alerts module
                </Label>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Currently{' '}
                  <Badge variant={alerts.moduleEnabled ? 'badge_active' : 'badge_inactive'}>
                    {alerts.moduleEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>{' '}
                  (last saved value)
                </p>
              </div>
              <Switch
                id='alerts-master'
                checked={draft.moduleEnabled}
                disabled={!canConfigure}
                onCheckedChange={(v) => setField('moduleEnabled', v)}
              />
            </div>
            <RoleGate
              roles={['Company Admin', 'Group Company Admin']}
              fallback={
                <p className='text-paragraph-sm text-neutral-1000'>
                  Alert configuration is managed by your Company Admin.
                </p>
              }
            >
              <div className='flex items-center justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => {
                    resetDraft()
                    toast.info('Changes discarded.')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    saveAlerts(draft)
                    setStep('configure')
                  }}
                >
                  Save &amp; Next
                </Button>
              </div>
            </RoleGate>
          </CardContent>
        </Card>
      ) : (
        <Card className='gap-3 border-none bg-white py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
              <BellRing className='text-blue-1400 size-4' />
              Configure Alerts (step 2 of 2)
            </CardTitle>
            <p className='text-paragraph-sm text-neutral-1000'>
              All toggle selections are stored together and applied atomically
              — a failed save never leaves a partial subset applied.
              {!alerts.moduleEnabled &&
                ' The Alerts module is currently disabled, so none of these alerts fire until it is enabled.'}
            </p>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            {ALERT_TOGGLES.map((t) => (
              <div
                key={t.key}
                className='border-grey-200 flex items-center justify-between gap-3 rounded-[6px] border px-3 py-2'
              >
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    {t.label}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {t.description}
                  </p>
                </div>
                <div className='flex shrink-0 items-center gap-3'>
                  <Badge
                    variant={
                      alerts[t.key] && alerts.moduleEnabled
                        ? 'badge_active'
                        : 'badge_inactive'
                    }
                  >
                    {alerts[t.key] && alerts.moduleEnabled
                      ? 'Firing'
                      : alerts[t.key]
                        ? 'On (module off)'
                        : 'Off'}
                  </Badge>
                  <Switch
                    checked={draft[t.key]}
                    disabled={!canConfigure}
                    onCheckedChange={(v) => setField(t.key, v)}
                    aria-label={t.label}
                  />
                </div>
              </div>
            ))}
            <div className='flex items-center justify-between'>
              <Button variant='outline' onClick={() => setStep('setup')}>
                Back to setup
              </Button>
              <RoleGate roles={['Company Admin', 'Group Company Admin']}>
                <div className='flex items-center gap-3'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      resetDraft()
                      toast.info('Changes discarded — toggles reset to the last saved configuration.')
                    }}
                    disabled={!dirty}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => saveAlerts(draft)} disabled={!dirty}>
                    Save
                  </Button>
                </div>
              </RoleGate>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
