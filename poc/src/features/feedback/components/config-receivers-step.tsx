import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { RECEIVER_ROLE_CATALOG } from '../data/config'
import { type FeedbackConfigStore } from '../hooks/use-feedback-config'
import { DualListPicker } from './dual-list-picker'
import { ReceiverDefinitionsCard } from './receiver-definitions-card'

interface ConfigReceiversStepProps {
  store: FeedbackConfigStore
  onNext: () => void
}

/**
 * Receivers step (FBG-15/21..26): anonymous support toggle, separate
 * anonymous / non-anonymous receiver roles via dual-list pickers, SLA
 * thresholds, the designated coordinator, and grievance access rules.
 */
export function ConfigReceiversStep({ store, onNext }: ConfigReceiversStepProps) {
  const { config } = store
  const [anonymousEnabled, setAnonymousEnabled] = useState(config.anonymousEnabled)
  const [nonAnonReceivers, setNonAnonReceivers] = useState(config.nonAnonymousReceivers)
  const [anonReceivers, setAnonReceivers] = useState(config.anonymousReceivers)
  const [coordinator, setCoordinator] = useState(config.coordinator ?? '')
  const [approverDays, setApproverDays] = useState(config.approverReminderDays)
  const [coordinatorDays, setCoordinatorDays] = useState(config.coordinatorReminderDays)
  const [accessRoles, setAccessRoles] = useState(config.accessRoles)

  const save = (advance: boolean) => {
    const ok = store.saveReceivers({
      anonymousEnabled,
      nonAnonymousReceivers: nonAnonReceivers,
      anonymousReceivers: anonymousEnabled ? anonReceivers : [],
      coordinator: coordinator || null,
      approverReminderDays: approverDays,
      coordinatorReminderDays: coordinatorDays,
      accessRoles,
    })
    if (ok && advance) onNext()
  }

  const cancel = () => {
    setAnonymousEnabled(config.anonymousEnabled)
    setNonAnonReceivers(config.nonAnonymousReceivers)
    setAnonReceivers(config.anonymousReceivers)
    setCoordinator(config.coordinator ?? '')
    setApproverDays(config.approverReminderDays)
    setCoordinatorDays(config.coordinatorReminderDays)
    setAccessRoles(config.accessRoles)
    toast.info('Unsaved Receivers changes discarded')
  }

  return (
    <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
      <Card className='gap-3 border-none bg-white py-4 xl:col-span-2'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Feedback / Grievance Receivers
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 px-4'>
          <div className='border-grey-200 flex items-center justify-between gap-4 rounded-[6px] border px-3 py-2'>
            <div>
              <Label className='text-sm font-medium'>
                Do you support anonymous feedback/grievances?
              </Label>
              <p className='text-paragraph-sm text-neutral-1000'>
                "Yes" allows employees to submit feedback/grievances without
                logging into the application (anonymous feedback). "No" means
                entries always carry the submitter's identity.
              </p>
            </div>
            <RadioGroup
              value={anonymousEnabled ? 'yes' : 'no'}
              onValueChange={(v) => setAnonymousEnabled(v === 'yes')}
              className='flex shrink-0 items-center gap-4'
            >
              <label className='flex items-center gap-2 text-sm'>
                <RadioGroupItem value='yes' />
                Yes
              </label>
              <label className='flex items-center gap-2 text-sm'>
                <RadioGroupItem value='no' />
                No
              </label>
            </RadioGroup>
          </div>

          <DualListPicker
            label='Non-Anonymous Receiver(s) — applicable roles'
            catalog={RECEIVER_ROLE_CATALOG}
            selected={nonAnonReceivers}
            onChange={setNonAnonReceivers}
          />

          {anonymousEnabled && (
            <DualListPicker
              label='Anonymous Receiver(s) — applicable roles'
              catalog={RECEIVER_ROLE_CATALOG}
              selected={anonReceivers}
              onChange={setAnonReceivers}
            />
          )}
        </CardContent>
      </Card>

      {/* Configured receivers with the cascading Applicable locations →
          departments → positions → employees scope + applicable roles. */}
      <ReceiverDefinitionsCard store={store} />

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Reminders, escalation & coordinator
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div>
            <Label className='text-sm'>Reminder to the approver after (days)</Label>
            <Input
              type='number'
              min={1}
              value={approverDays}
              onChange={(e) => setApproverDays(Math.max(1, Number(e.target.value)))}
              className='mt-1 max-w-40'
            />
            <p className='text-paragraph-sm text-neutral-1000 mt-1'>
              The approver is reminded this many days after receiving an entry
              with no action; no redundant reminder is sent once they act.
            </p>
          </div>
          <div>
            <Label className='text-sm'>
              Reminder to feedback coordinator after (days)
            </Label>
            <Input
              type='number'
              min={1}
              value={coordinatorDays}
              onChange={(e) => setCoordinatorDays(Math.max(1, Number(e.target.value)))}
              className='mt-1 max-w-40'
            />
            <p className='text-paragraph-sm text-neutral-1000 mt-1'>
              Stalled entries escalate to the coordinator after this many days
              of approver inaction.
            </p>
          </div>
          <div>
            <Label className='text-sm'>Feedback / Grievance Coordinator</Label>
            <Select value={coordinator} onValueChange={setCoordinator}>
              <SelectTrigger variant='secondary' className='mt-1 w-full'>
                <SelectValue placeholder='Designate a coordinator role' />
              </SelectTrigger>
              <SelectContent>
                {RECEIVER_ROLE_CATALOG.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-paragraph-sm text-neutral-1000 mt-1'>
              Required while escalation is configured — saving without a
              coordinator is blocked.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Grievance access rules (authorized personnel)
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            Only the roles checked here may view grievance information; all
            other access is denied and logged.
          </p>
        </CardHeader>
        <CardContent className='space-y-2 px-4'>
          {RECEIVER_ROLE_CATALOG.map((r) => (
            <label key={r} className='flex items-center gap-2 text-sm'>
              <Checkbox
                variant='blue'
                checked={accessRoles.includes(r)}
                onCheckedChange={(checked) =>
                  setAccessRoles(
                    checked
                      ? [...accessRoles, r]
                      : accessRoles.filter((x) => x !== r)
                  )
                }
              />
              {r}
            </label>
          ))}
        </CardContent>
      </Card>

      <div className='flex items-center justify-end gap-3 xl:col-span-2'>
        <Button variant='outline' onClick={cancel}>
          Cancel
        </Button>
        <Button variant='outline' onClick={() => save(false)}>
          Save
        </Button>
        <Button onClick={() => save(true)}>Save & Next</Button>
      </div>
    </div>
  )
}
