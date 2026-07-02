import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ACK_TYPES, seedPolicies } from '../data/policies'
import {
  DISTRIBUTION_METHODS,
  DUE_RULE_TYPES,
  LIFECYCLE_EVENTS,
  type Audience,
  type Distribution,
  type DueDateRule,
} from '../data/distributions'
import { type DistributionDraft } from '../hooks/use-policy-distribution'
import { resolveAudience } from '../utils/audience'
import { AudienceBuilder } from './audience-builder'

const numeric = (message: string) =>
  z
    .string()
    .regex(/^\d+$/, message)
    .optional()
    .or(z.literal(''))

const formSchema = z
  .object({
    policyId: z.string().min(1, 'Select a policy'),
    ackType: z.enum(ACK_TYPES),
    method: z.enum(DISTRIBUTION_METHODS),
    scheduledFor: z.string().optional(),
    eventTrigger: z.string().optional(),
    dueRuleType: z.enum(DUE_RULE_TYPES),
    fixedDate: z.string().optional(),
    relativeDays: numeric('Enter the number of days'),
    hireOffsetDays: numeric('Enter days after hire date'),
    renewalMonths: numeric('Enter the renewal period in months'),
  })
  .superRefine((v, ctx) => {
    if (v.method === 'Scheduled' && !v.scheduledFor)
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledFor'],
        message: 'Pick the future send date',
      })
    if (v.method === 'Event-triggered' && !v.eventTrigger)
      ctx.addIssue({
        code: 'custom',
        path: ['eventTrigger'],
        message: 'Pick the lifecycle event trigger',
      })
    if (v.ackType === 'Read-Only') return
    if (v.dueRuleType === 'Fixed' && !v.fixedDate)
      ctx.addIssue({
        code: 'custom',
        path: ['fixedDate'],
        message: 'Pick the shared fixed deadline',
      })
    if (v.dueRuleType === 'Relative' && !v.relativeDays)
      ctx.addIssue({
        code: 'custom',
        path: ['relativeDays'],
        message: 'Days from distribution are required',
      })
    if (v.dueRuleType === 'Hire-based' && !v.hireOffsetDays)
      ctx.addIssue({
        code: 'custom',
        path: ['hireOffsetDays'],
        message: 'Days from hire date are required',
      })
    if (v.dueRuleType === 'Periodic renewal' && !v.renewalMonths)
      ctx.addIssue({
        code: 'custom',
        path: ['renewalMonths'],
        message: 'Renewal period is required',
      })
  })

type FormValues = z.infer<typeof formSchema>

const emptyValues: FormValues = {
  policyId: '',
  ackType: 'Required',
  method: 'Manual',
  scheduledFor: '',
  eventTrigger: '',
  dueRuleType: 'Relative',
  fixedDate: '',
  relativeDays: '14',
  hireOffsetDays: '30',
  renewalMonths: '12',
}

const emptyAudience: Audience = { logic: 'AND', criteria: [] }

interface NewDistributionOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, edits this (still unsent) distribution. */
  distribution?: Distribution | null
  onSubmit: (draft: DistributionDraft) => void
}

export function NewDistributionOverlay({
  open,
  onOpenChange,
  distribution,
  onSubmit,
}: NewDistributionOverlayProps) {
  const isEdit = Boolean(distribution)
  const [audience, setAudience] = useState<Audience>(emptyAudience)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    if (distribution) {
      const r = distribution.dueDateRule
      form.reset({
        policyId: distribution.policyId,
        ackType: distribution.ackType,
        method: distribution.method,
        scheduledFor: distribution.scheduledFor?.slice(0, 10) ?? '',
        eventTrigger: distribution.eventTrigger ?? '',
        dueRuleType: r.type,
        fixedDate: r.fixedDate ?? '',
        relativeDays: String(r.relativeDays ?? 14),
        hireOffsetDays: String(r.hireOffsetDays ?? 30),
        renewalMonths: String(r.renewalMonths ?? 12),
      })
      setAudience(distribution.audience)
    } else {
      form.reset(emptyValues)
      setAudience(emptyAudience)
    }
  }, [open, distribution, form])

  const ackType = form.watch('ackType')
  const method = form.watch('method')
  const dueRuleType = form.watch('dueRuleType')

  function handleSubmit(values: FormValues) {
    const recipients = resolveAudience(audience)
    if (values.method !== 'Event-triggered' && recipients.length === 0) {
      toast.warning(
        'No recipients match the selected scope — adjust the audience before distributing'
      )
      return
    }
    const dueDateRule: DueDateRule = {
      type: values.dueRuleType,
      fixedDate: values.fixedDate || undefined,
      relativeDays: values.relativeDays ? Number(values.relativeDays) : undefined,
      hireOffsetDays: values.hireOffsetDays
        ? Number(values.hireOffsetDays)
        : undefined,
      renewalMonths: values.renewalMonths
        ? Number(values.renewalMonths)
        : undefined,
    }
    onSubmit({
      policyId: values.policyId,
      ackType: values.ackType,
      audience,
      method: values.method,
      scheduledFor:
        values.method === 'Scheduled' && values.scheduledFor
          ? `${values.scheduledFor}T09:00:00Z`
          : null,
      eventTrigger:
        values.method === 'Event-triggered'
          ? ((values.eventTrigger || 'Onboarding') as DistributionDraft['eventTrigger'])
          : null,
      dueDateRule,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[640px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit distribution' : 'New distribution'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='policyId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v)
                          const p = seedPolicies.find((x) => x.id === v)
                          if (p) form.setValue('ackType', p.defaultAckType)
                        }}
                        disabled={isEdit}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select policy' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {seedPolicies.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title} ({p.version})
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
                  name='ackType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acknowledgment type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACK_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        {field.value === 'Required'
                          ? 'Mandatory — due dates, reminders and escalations apply.'
                          : field.value === 'Optional'
                            ? 'Recommended — never marked overdue.'
                            : 'Information only — no acknowledgment action.'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <AudienceBuilder value={audience} onChange={setAudience} />

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='method'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distribution method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISTRIBUTION_METHODS.map((m) => (
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
                {method === 'Scheduled' && (
                  <FormField
                    control={form.control}
                    name='scheduledFor'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Send on</FormLabel>
                        <FormControl>
                          <DatePicker
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(d) =>
                              field.onChange(d ? d.toISOString().slice(0, 10) : '')
                            }
                            placeholder='Pick send date'
                            minDate={new Date()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {method === 'Event-triggered' && (
                  <FormField
                    control={form.control}
                    name='eventTrigger'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lifecycle event</FormLabel>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue placeholder='Select event' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LIFECYCLE_EVENTS.map((e) => (
                              <SelectItem key={e} value={e}>
                                {e}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {ackType !== 'Read-Only' && (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='dueRuleType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due date rule</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DUE_RULE_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {dueRuleType === 'Fixed' && (
                    <FormField
                      control={form.control}
                      name='fixedDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fixed deadline (all recipients)</FormLabel>
                          <FormControl>
                            <DatePicker
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(d) =>
                                field.onChange(
                                  d ? d.toISOString().slice(0, 10) : ''
                                )
                              }
                              placeholder='Pick deadline'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {dueRuleType === 'Relative' && (
                    <FormField
                      control={form.control}
                      name='relativeDays'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days after distribution</FormLabel>
                          <FormControl>
                            <Input inputMode='numeric' placeholder='14' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {dueRuleType === 'Hire-based' && (
                    <FormField
                      control={form.control}
                      name='hireOffsetDays'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days after each hire date</FormLabel>
                          <FormControl>
                            <Input inputMode='numeric' placeholder='30' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {dueRuleType === 'Periodic renewal' && (
                    <FormField
                      control={form.control}
                      name='renewalMonths'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renewal cycle (months)</FormLabel>
                          <FormControl>
                            <Input inputMode='numeric' placeholder='12' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit
                  ? 'Save changes'
                  : method === 'Manual'
                    ? 'Distribute now'
                    : method === 'Scheduled'
                      ? 'Schedule distribution'
                      : 'Arm event trigger'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
