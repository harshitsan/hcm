import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Check, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DataTable } from '@/components/common/data-table/table'
import {
  NOTIFICATION_MODES,
  RECURRENCE_PATTERNS,
  type NotificationRule,
} from '../data/orientation'
import { LOCATIONS } from '../data/shared'
import { type OrientationStore } from '../hooks/use-orientation'
import { SortHeader } from './columns-shared'
import { SectionCard } from './config-widgets'
import { RefreshButton, StepFooter } from './orientation-widgets'
import { PhysicalResourcesStep, PresenterPanelStep } from './orientation-resources'
import { QuestionBankStep } from './orientation-question-bank'
import { TemplateList } from './orientation-templates'

const STEPS = [
  'Setup',
  'Notification Rule',
  'Physical Resources',
  'Presenter Panel',
  'Question Bank',
  'Email Templates',
  'Notification Templates',
] as const

interface OrientationConfigProps {
  store: OrientationStore
}

/**
 * Orientation configuration wizard — mirrors the Kensium setup flow:
 * Setup → Notification Rule → Physical Resources → Presenter Panel →
 * Question Bank → Email Templates → Notification Templates.
 */
export function OrientationConfig({ store }: OrientationConfigProps) {
  const [step, setStep] = useState(0)

  const cancel = () => {
    setStep(0)
    toast.info('Orientation setup exited — unsaved changes discarded')
  }
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))

  return (
    <div className='w-full'>
      {/* Step rail */}
      <div className='mb-4 flex flex-wrap items-center gap-1.5'>
        {STEPS.map((label, i) => (
          <button
            key={label}
            type='button'
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              i === step
                ? 'border-blue-600 bg-blue-600 font-medium text-white'
                : i < step
                  ? 'border-green-600/40 bg-green-50 text-green-700'
                  : 'text-neutral-1000 border-gray-200 bg-white'
            }`}
          >
            {i < step ? (
              <Check size={11} weight='bold' />
            ) : (
              <span className='font-medium'>{i + 1}.</span>
            )}
            {label}
          </button>
        ))}
      </div>

      <section className='rounded-[6px] border border-gray-200 bg-white p-4'>
        {step === 0 && <SetupStep store={store} onNext={next} onCancel={cancel} />}
        {step === 1 && (
          <NotificationRuleStep store={store} onNext={next} onCancel={cancel} />
        )}
        {step === 2 && (
          <>
            <PhysicalResourcesStep store={store} />
            <StepFooter onCancel={cancel}>
              <Button size='sm' onClick={next}>
                Next: Presenter Panel
              </Button>
            </StepFooter>
          </>
        )}
        {step === 3 && (
          <>
            <PresenterPanelStep store={store} />
            <StepFooter onCancel={cancel}>
              <Button size='sm' onClick={next}>
                Next: Question Bank
              </Button>
            </StepFooter>
          </>
        )}
        {step === 4 && (
          <>
            <QuestionBankStep store={store} />
            <StepFooter onCancel={cancel}>
              <Button size='sm' onClick={next}>
                Next: Email Templates
              </Button>
            </StepFooter>
          </>
        )}
        {step === 5 && (
          <>
            <TemplateList
              title='Email Templates'
              description='System-managed induction emails used by orientation communications.'
              items={store.emailTemplates}
              refreshedAt={store.refreshedAt['email-templates']}
              onRefresh={() => store.refresh('email-templates', 'Email templates')}
            />
            <StepFooter onCancel={cancel}>
              <Button size='sm' onClick={next}>
                Next: Notification Templates
              </Button>
            </StepFooter>
          </>
        )}
        {step === 6 && (
          <>
            <TemplateList
              title='Notification Templates'
              description='In-app notifications pushed around orientation sessions.'
              items={store.notificationTemplates}
              refreshedAt={store.refreshedAt['notification-templates']}
              onRefresh={() =>
                store.refresh('notification-templates', 'Notification templates')
              }
            />
            <StepFooter onCancel={cancel}>
              <Button
                size='sm'
                onClick={() => {
                  setStep(0)
                  toast.success('Orientation configuration complete')
                }}
              >
                Finish setup
              </Button>
            </StepFooter>
          </>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------ Setup ------------------------------- */

function SetupStep({
  store,
  onNext,
  onCancel,
}: {
  store: OrientationStore
  onNext: () => void
  onCancel: () => void
}) {
  const [enabled, setEnabled] = useState(store.moduleEnabled)

  return (
    <div>
      <SectionCard
        title='Orientation Module'
        description='Controls whether orientation programs can be scheduled for this company.'
      >
        <label className='flex items-center gap-3 text-sm'>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span>
            Enable Orientation Module{' '}
            <Badge variant={enabled ? 'badge_active' : 'badge_inactive'}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </span>
        </label>
        {!enabled && (
          <p className='text-neutral-1000 mt-2 text-xs'>
            While disabled, the Programs tab is read-only and new orientations
            cannot be scheduled.
          </p>
        )}
      </SectionCard>
      <StepFooter onCancel={onCancel}>
        <Button variant='outline' size='sm' onClick={() => store.saveSetup(enabled)}>
          Save
        </Button>
        <Button
          size='sm'
          onClick={() => {
            store.saveSetup(enabled)
            onNext()
          }}
        >
          Save &amp; Continue
        </Button>
      </StepFooter>
    </div>
  )
}

/* ------------------------------ Notification Rule ------------------------- */

const ruleSchema = z.object({
  location: z.string().min(1),
  mode: z.enum(NOTIFICATION_MODES),
  recurrence: z.enum(RECURRENCE_PATTERNS),
})

type RuleValues = z.infer<typeof ruleSchema>

const ruleColumns: ColumnDef<NotificationRule>[] = [
  {
    accessorKey: 'location',
    header: ({ column }) => <SortHeader column={column} label='Location' />,
    cell: ({ row }) => (
      <span className='text-neutral-1600 font-medium'>
        {row.original.location}
      </span>
    ),
  },
  {
    accessorKey: 'mode',
    header: ({ column }) => <SortHeader column={column} label='Mode' />,
    cell: ({ row }) => <Badge variant='outline'>{row.original.mode}</Badge>,
  },
  {
    accessorKey: 'recurrence',
    header: ({ column }) => (
      <SortHeader column={column} label='Recurrence Pattern' />
    ),
    cell: ({ row }) => <span className='text-sm'>{row.original.recurrence}</span>,
  },
]

function NotificationRuleStep({
  store,
  onNext,
  onCancel,
}: {
  store: OrientationStore
  onNext: () => void
  onCancel: () => void
}) {
  const [adding, setAdding] = useState(false)
  const form = useForm<RuleValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { location: 'Hyderabad', mode: 'Email', recurrence: 'Weekly' },
  })

  return (
    <div>
      <SectionCard
        title='Notification frequency policy'
        description='Whether every location must define a notification frequency rule.'
      >
        <label className='flex items-center gap-3 text-sm'>
          <Switch
            checked={store.notificationRuleRequired}
            onCheckedChange={store.setNotificationRuleRequired}
          />
          <span>Notification frequency rule is required</span>
        </label>
      </SectionCard>

      <SectionCard
        title={`Notification Rules (${store.rules.length})`}
        description='Schedules on which participants receive orientation notifications.'
        actions={
          <>
            <RefreshButton
              onRefresh={() => store.refresh('rules', 'Notification rules')}
              refreshedAt={store.refreshedAt.rules}
            />
            <Button
              size='sm'
              className='h-7 gap-1'
              onClick={() => {
                form.reset()
                setAdding((v) => !v)
              }}
            >
              <Plus size={12} weight='bold' />
              Add Rule
            </Button>
          </>
        }
      >
        {adding && (
          <Form {...form}>
            <form
              className='mb-3 grid grid-cols-1 items-end gap-3 rounded-[6px] border border-gray-200 bg-neutral-100 p-3 sm:grid-cols-4'
              onSubmit={form.handleSubmit((values) => {
                store.addRule(values)
                setAdding(false)
              })}
            >
              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCATIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='mode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NOTIFICATION_MODES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='recurrence'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurrence pattern</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RECURRENCE_PATTERNS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex gap-2'>
                <Button type='submit' size='sm'>
                  Add
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setAdding(false)}
                >
                  Discard
                </Button>
              </div>
            </form>
          </Form>
        )}

        <DataTable columns={ruleColumns} data={store.rules} variant='no-status' />
      </SectionCard>

      <StepFooter onCancel={onCancel}>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            store.saveNotificationPolicy(store.notificationRuleRequired)
          }
        >
          Save
        </Button>
        <Button
          size='sm'
          onClick={() => {
            store.saveNotificationPolicy(store.notificationRuleRequired)
            onNext()
          }}
        >
          Save &amp; Continue
        </Button>
      </StepFooter>
    </div>
  )
}
