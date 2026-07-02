import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PencilSimple, Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import { ESCALATION_LABELS, ESCALATION_STRATEGIES } from '../data/shared'
import type { BusinessCalendar, SlaPolicy } from '../data/sla'
import type { SlaConfigStore } from '../hooks/use-sla-config'
import { SummaryCards } from './summary-cards'
import { SectionToolbar, SortableHeader } from './table-helpers'

const STRATEGY_NOTES: Record<(typeof ESCALATION_STRATEGIES)[number], string> = {
  manager:
    'Redirects the request to the current approver’s reporting manager.',
  role: 'Redirects to whoever holds the designated role (e.g. HR Director) rather than a named individual.',
  'time-reassignment':
    'Automatically reassigns the task to the configured target when the timer elapses without action.',
  'multi-level':
    'Escalates level by level until someone acts or all levels are exhausted.',
}

/* ----------------------------- Calendar dialog ---------------------------- */

const calendarSchema = z.object({
  name: z.string().min(2, 'Calendar name is required'),
  workingDays: z.string().min(2, 'Working days are required'),
  workingHours: z.string().min(2, 'Working hours are required'),
  holidays: z.string(),
})

type CalendarValues = z.infer<typeof calendarSchema>

function CalendarDialog({
  open,
  onOpenChange,
  calendar,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  calendar?: BusinessCalendar | null
  onSave: (draft: {
    name: string
    workingDays: string
    workingHours: string
    holidays: string[]
  }) => void
}) {
  const form = useForm<CalendarValues>({
    resolver: zodResolver(calendarSchema),
    defaultValues: { name: '', workingDays: '', workingHours: '', holidays: '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      calendar
        ? {
            name: calendar.name,
            workingDays: calendar.workingDays,
            workingHours: calendar.workingHours,
            holidays: calendar.holidays.join('\n'),
          }
        : { name: '', workingDays: '', workingHours: '', holidays: '' }
    )
  }, [open, calendar, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>
            {calendar
              ? `Edit calendar — republishing creates v${calendar.version + 1}`
              : 'New business-hour calendar'}
          </DialogTitle>
          <DialogDescription>
            SLA elapsed time counts only these working hours; weekends and
            holidays are excluded. In-flight timers keep their bound version.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave({
                name: v.name,
                workingDays: v.workingDays,
                workingHours: v.workingHours,
                holidays: v.holidays
                  .split('\n')
                  .map((h) => h.trim())
                  .filter(Boolean),
              })
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar name</FormLabel>
                  <FormControl>
                    <Input placeholder='India Standard — Mon–Fri' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='workingDays'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Working days</FormLabel>
                    <FormControl>
                      <Input placeholder='Mon–Fri' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='workingHours'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Working hours</FormLabel>
                    <FormControl>
                      <Input placeholder='09:30 – 18:30 IST' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='holidays'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Holidays (one per line)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={'2026-08-15 Independence Day\n2026-10-20 Diwali'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {calendar ? 'Republish calendar' : 'Create calendar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------ Policy dialog ----------------------------- */

const policySchema = z.object({
  name: z.string().min(2, 'Rule-pack name is required'),
  durationHours: z.string().regex(/^\d+$/, 'Duration must be a whole number'),
  calendarId: z.string().min(1, 'Select a calendar'),
  effectiveFrom: z.string().min(1, 'Effective-from date is required'),
})

type PolicyValues = z.infer<typeof policySchema>

function PolicyDialog({
  open,
  onOpenChange,
  policy,
  calendars,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: SlaPolicy | null
  calendars: BusinessCalendar[]
  onSave: (draft: {
    name: string
    durationHours: number
    calendarId: string
    effectiveFrom: string
  }) => void
}) {
  const form = useForm<PolicyValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: '',
      durationHours: '24',
      calendarId: calendars[0]?.id ?? '',
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      policy
        ? {
            name: policy.name,
            durationHours: String(policy.durationHours),
            calendarId: policy.calendarId,
            effectiveFrom: policy.effectiveFrom,
          }
        : {
            name: '',
            durationHours: '24',
            calendarId: calendars[0]?.id ?? '',
            effectiveFrom: new Date().toISOString().slice(0, 10),
          }
    )
  }, [open, policy, form, calendars])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            {policy ? 'Edit SLA rule-pack' : 'New SLA rule-pack'}
          </DialogTitle>
          <DialogDescription>
            Reminders fire at 50% and 75% of the SLA; escalation fires at 100%
            per the configured strategy.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSave({
                name: v.name,
                durationHours: Number(v.durationHours),
                calendarId: v.calendarId,
                effectiveFrom: v.effectiveFrom,
              })
              onOpenChange(false)
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule-pack name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Standard Approvals — 24 business hrs'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='durationHours'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (business hrs)</FormLabel>
                    <FormControl>
                      <Input inputMode='numeric' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='effectiveFrom'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective from</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='calendarId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business-hour calendar</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {calendars.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {policy ? 'Save changes' : 'Create rule-pack'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------------- The tab -------------------------------- */

/**
 * SLA & Escalations (WFE-07 … WFE-11, WFE-24): reusable business-hour
 * calendars, versioned SLA rule-packs with fixed 50%/75% reminders and 100%
 * escalation, and the four configurable escalation strategies.
 */
export function SlaTab({
  store,
  canConfigure,
}: {
  store: SlaConfigStore
  canConfigure: boolean
}) {
  const { calendars, policies, saveCalendar, savePolicy } = store

  const [calendarDialog, setCalendarDialog] = useState(false)
  const [editingCalendar, setEditingCalendar] =
    useState<BusinessCalendar | null>(null)
  const [policyDialog, setPolicyDialog] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null)

  const summary = useMemo(
    () => [
      { label: 'Business-hour calendars', value: calendars.length },
      { label: 'SLA rule-packs', value: policies.length },
      { label: 'Reminder thresholds', value: '50% · 75%' },
      { label: 'Escalation fires at', value: '100%' },
    ],
    [calendars, policies]
  )

  const calendarColumns: ColumnDef<BusinessCalendar>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label='Calendar' />,
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            v{row.original.version} · effective {row.original.effectiveFrom}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'workingDays',
      header: ({ column }) => <SortableHeader column={column} label='Days' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.workingDays}
        </span>
      ),
    },
    {
      accessorKey: 'workingHours',
      header: ({ column }) => <SortableHeader column={column} label='Hours' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.workingHours}
        </span>
      ),
    },
    {
      id: 'holidays',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Holidays excluded</span>
      ),
      cell: ({ row }) => (
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.holidays.join(' · ')}
        </LongText>
      ),
    },
    {
      accessorKey: 'updatedBy',
      header: ({ column }) => (
        <SortableHeader column={column} label='Updated by' />
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.updatedBy}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Edit calendar'
            onClick={() => {
              setEditingCalendar(row.original)
              setCalendarDialog(true)
            }}
          >
            <PencilSimple size={14} weight='fill' />
          </Button>
        ) : null,
      size: 50,
    },
  ]

  const policyColumns: ColumnDef<SlaPolicy>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader column={column} label='SLA rule-pack' />
      ),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            v{row.original.version} · effective {row.original.effectiveFrom}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'durationHours',
      header: ({ column }) => <SortableHeader column={column} label='Duration' />,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.durationHours} business hrs
        </span>
      ),
    },
    {
      id: 'thresholds',
      header: () => (
        <span className='text-paragraph-sm font-medium'>
          Reminders → escalation
        </span>
      ),
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-1 p-1'>
          <Badge variant='open'>{row.original.reminderThresholds[0]}%</Badge>
          <Badge variant='overdue'>{row.original.reminderThresholds[1]}%</Badge>
          <Badge variant='dropped'>
            {row.original.escalateAtPercent}% escalate
          </Badge>
        </div>
      ),
    },
    {
      id: 'calendar',
      header: () => (
        <span className='text-paragraph-sm font-medium'>Calendar</span>
      ),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {calendars.find((c) => c.id === row.original.calendarId)?.name ??
            row.original.calendarId}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) =>
        canConfigure ? (
          <Button
            variant='icon2'
            className='text-neutral-1900 h-7 w-7'
            aria-label='Edit rule-pack'
            onClick={() => {
              setEditingPolicy(row.original)
              setPolicyDialog(true)
            }}
          >
            <PencilSimple size={14} weight='fill' />
          </Button>
        ) : null,
      size: 50,
    },
  ]

  return (
    <div className='w-full'>
      <SummaryCards title='SLA configuration' items={summary} />

      <SectionToolbar title={`Business-hour calendars (${calendars.length})`}>
        {canConfigure && (
          <Button
            variant='red'
            onClick={() => {
              setEditingCalendar(null)
              setCalendarDialog(true)
            }}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Calendar
          </Button>
        )}
      </SectionToolbar>
      <DataTable columns={calendarColumns} data={calendars} variant='no-status' />

      <div className='mt-6'>
        <SectionToolbar title={`SLA rule-packs (${policies.length})`}>
          {canConfigure && (
            <Button
              variant='red'
              onClick={() => {
                setEditingPolicy(null)
                setPolicyDialog(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New Rule-pack
            </Button>
          )}
        </SectionToolbar>
        <DataTable columns={policyColumns} data={policies} variant='no-status' />
      </div>

      <Card className='mt-6 gap-2 border-gray-200 py-4'>
        <CardHeader className='px-4 pb-0'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Escalation strategies available per stage
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='grid grid-cols-1 gap-3 lg:grid-cols-4'>
            {ESCALATION_STRATEGIES.map((s) => (
              <div
                key={s}
                className='rounded-md border border-gray-200 bg-white p-3'
              >
                <p className='text-neutral-1600 text-sm font-medium'>
                  {ESCALATION_LABELS[s]}
                </p>
                <p className='text-neutral-1000 mt-1 text-xs'>
                  {STRATEGY_NOTES[s]}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CalendarDialog
        open={calendarDialog}
        onOpenChange={(open) => {
          setCalendarDialog(open)
          if (!open) setEditingCalendar(null)
        }}
        calendar={editingCalendar}
        onSave={(draft) => saveCalendar(draft, editingCalendar?.id)}
      />
      <PolicyDialog
        open={policyDialog}
        onOpenChange={(open) => {
          setPolicyDialog(open)
          if (!open) setEditingPolicy(null)
        }}
        policy={editingPolicy}
        calendars={calendars}
        onSave={(draft) => savePolicy(draft, editingPolicy?.id)}
      />
    </div>
  )
}
