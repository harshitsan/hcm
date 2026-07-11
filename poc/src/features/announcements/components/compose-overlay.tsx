import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  ANNOUNCE_ON_OPTIONS,
  ANNOUNCEMENT_KINDS,
  ANNOUNCEMENT_TYPES,
  EVENT_BASES,
  RECURRENCE_PATTERNS,
  WEEKDAYS,
  type Announcement,
} from '../data/announcements'
import { DIMENSIONS, type OrgConfig } from '../data/org'
import { type AnnouncementDraft } from '../hooks/use-announcements'
import {
  renderTemplate,
  SAMPLE_TEMPLATE_CONTEXT,
  todayIso,
} from '../utils/audience'
import { AudiencePicker } from './audience-picker'

const composeSchema = z
  .object({
    title: z.string().min(3, 'Title is required'),
    body: z.string().min(10, 'Message content is required (min 10 characters)'),
    kind: z.enum(ANNOUNCEMENT_KINDS),
    type: z.enum(ANNOUNCEMENT_TYPES),
    eventBased: z.boolean(),
    eventBasis: z.enum(EVENT_BASES),
    recurrencePattern: z.enum(RECURRENCE_PATTERNS),
    recurrenceDays: z.array(z.string()),
    announceOn: z.enum(ANNOUNCE_ON_OPTIONS),
    announceOffsetDays: z.coerce
      .number<number>()
      .int('Whole days only')
      .min(0, 'Days cannot be negative')
      .max(90, '90 days or less'),
    notifyAnnouncerBeforeDays: z.coerce
      .number<number>()
      .int('Whole days only')
      .min(0, 'Days cannot be negative')
      .max(90, '90 days or less'),
    expireInDays: z.coerce
      .number<number>()
      .int('Whole days only')
      .min(0, 'Days cannot be negative')
      .max(365, '365 days or less'),
    announceOnWeeklyOff: z.boolean(),
    announceOnHolidays: z.boolean(),
    startDate: z.string().min(1, 'Date is required'),
    startTime: z.string(),
    endDate: z.string(),
    visibleToAll: z.boolean(),
    notifyByEmail: z.boolean(),
    notifySubject: z.string(),
    template: z.string(),
    link: z.url('Enter a valid URL').or(z.literal('')),
    attachment: z.string(),
    targeting: z.object({
      companies: z.array(z.string()),
      jurisdictions: z.array(z.string()),
      locations: z.array(z.string()),
      departments: z.array(z.string()),
      positions: z.array(z.string()),
      groups: z.array(z.string()),
      workforceTypes: z.array(z.string()),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Expiry must be on or after the announcement date',
      })
    }
    if (
      !values.visibleToAll &&
      !DIMENSIONS.some((dim) => values.targeting[dim].length > 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['targeting'],
        message:
          'Select at least one audience value, or mark the announcement visible to all employees',
      })
    }
    if (values.eventBased && values.eventBasis === 'None') {
      ctx.addIssue({
        code: 'custom',
        path: ['eventBasis'],
        message: 'Select the event from the drop-down list',
      })
    }
    if (
      values.type === 'Recurring' &&
      !values.eventBased &&
      values.recurrenceDays.length === 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['recurrenceDays'],
        message: 'Recurring announcements need an event basis or series days',
      })
    }
    if (
      values.type === 'Recurring' &&
      values.announceOn !== 'On date' &&
      values.announceOffsetDays < 1
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['announceOffsetDays'],
        message: 'Enter the number of days before/after the event',
      })
    }
    if (values.notifyByEmail && values.notifySubject.trim().length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['notifySubject'],
        message: 'Enter the email subject for the notification',
      })
    }
  })

type ComposeValues = z.infer<typeof composeSchema>

const emptyValues: ComposeValues = {
  title: '',
  body: '',
  kind: 'General',
  type: 'Adhoc',
  eventBased: false,
  eventBasis: 'None',
  recurrencePattern: 'Yearly',
  recurrenceDays: [],
  announceOn: 'On date',
  announceOffsetDays: 0,
  notifyAnnouncerBeforeDays: 0,
  expireInDays: 0,
  announceOnWeeklyOff: false,
  announceOnHolidays: false,
  startDate: '',
  startTime: '',
  endDate: '',
  visibleToAll: false,
  notifyByEmail: false,
  notifySubject: '',
  template: '',
  link: '',
  attachment: '',
  targeting: {
    companies: [],
    jurisdictions: [],
    locations: [],
    departments: [],
    positions: [],
    groups: [],
    workforceTypes: [],
  },
}

interface ComposeOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this announcement; otherwise it creates one. */
  announcement?: Announcement | null
  orgConfig: OrgConfig
  onCreate: (draft: AnnouncementDraft, intent: 'draft' | 'submit' | 'publish') => void
  onUpdate: (id: string, draft: AnnouncementDraft) => void
}

/**
 * Metadata-driven compose screen covering the full Kensium field set:
 * Adhoc (announcement date + time, end date) and Recurring (period, announce
 * on/before/after with offset days, announcer review reminder, expire-in-days,
 * weekly-off/holiday flags, recurrence pattern, event-based drop-down),
 * visible-to-all vs location/department/position targeting with applicable
 * groups, email notification config, document upload, and a token template
 * editor with live Preview. Inline zod validation blocks submission.
 */
export function ComposeOverlay({
  open,
  onOpenChange,
  announcement,
  orgConfig,
  onCreate,
  onUpdate,
}: ComposeOverlayProps) {
  const isEdit = Boolean(announcement)
  const { role } = useRole()
  const intentRef = useRef<'draft' | 'submit' | 'publish'>('draft')
  const [previewOpen, setPreviewOpen] = useState(false)

  const form = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      announcement
        ? {
            title: announcement.title,
            body: announcement.body,
            kind: announcement.kind,
            type: announcement.type,
            eventBased: announcement.eventBasis !== 'None',
            eventBasis: announcement.eventBasis,
            recurrencePattern: announcement.recurrencePattern,
            recurrenceDays: announcement.recurrenceDays,
            announceOn: announcement.announceOn,
            announceOffsetDays: announcement.announceOffsetDays,
            notifyAnnouncerBeforeDays: announcement.notifyAnnouncerBeforeDays,
            expireInDays: announcement.expireInDays,
            announceOnWeeklyOff: announcement.announceOnWeeklyOff,
            announceOnHolidays: announcement.announceOnHolidays,
            startDate: announcement.startDate,
            startTime: announcement.startTime,
            endDate: announcement.endDate ?? '',
            visibleToAll: announcement.visibleToAll,
            notifyByEmail: announcement.notifyByEmail,
            notifySubject: announcement.notifySubject,
            template: announcement.template,
            link: announcement.link,
            attachment: announcement.attachment,
            targeting: announcement.targeting,
          }
        : emptyValues
    )
  }, [open, announcement, form])

  const watchType = form.watch('type')
  const watchEventBased = form.watch('eventBased')
  const watchAnnounceOn = form.watch('announceOn')
  const watchVisibleToAll = form.watch('visibleToAll')
  const watchNotifyByEmail = form.watch('notifyByEmail')
  const watchTemplate = form.watch('template')
  const isRecurring = watchType === 'Recurring'

  const groupOptions = orgConfig.groups
    .filter((g) => !g.deprecated)
    .map((g) => ({ id: g.value, label: g.value }))

  function handleSubmit(values: ComposeValues) {
    const { eventBased, ...rest } = values
    const draft: AnnouncementDraft = {
      ...rest,
      eventBasis: eventBased ? values.eventBasis : 'None',
      endDate: values.endDate || null,
      tenant:
        announcement?.tenant ??
        (role === 'Platform Admin' ? 'Platform' : 'Aster Digital'),
    }
    if (!isEdit && intentRef.current !== 'publish' && values.startDate < todayIso()) {
      toast.warning(
        'Scheduled publish date is in the past — it will go live immediately once published'
      )
    }
    if (isEdit && announcement) {
      onUpdate(announcement.id, draft)
    } else {
      onCreate(draft, intentRef.current)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit announcement' : 'New announcement'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Announcement type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ANNOUNCEMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name='kind'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content kind</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ANNOUNCEMENT_KINDS.map((kind) => (
                            <SelectItem key={kind} value={kind}>
                              {kind === 'General'
                                ? 'General news'
                                : kind === 'Vacancy'
                                  ? 'Vacancy posting'
                                  : 'Enrollable event / training'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Q3 All-Hands on 10 July' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='body'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Write the announcement message…'
                        className='min-h-24'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ---------- Scheduling ---------- */}
              {isRecurring ? (
                <div className='border-gray-200 space-y-4 rounded-[6px] border bg-white px-3 py-3'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    Recurring schedule
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='startDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period from</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='endDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period to (optional)</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='announceOn'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Announce on</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger variant='secondary' className='w-full'>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ANNOUNCE_ON_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchAnnounceOn !== 'On date' && (
                      <FormField
                        control={form.control}
                        name='announceOffsetDays'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {watchAnnounceOn === 'Before date'
                                ? 'Days before the event'
                                : 'Days after the event'}
                            </FormLabel>
                            <FormControl>
                              <Input type='number' min={0} max={90} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='notifyAnnouncerBeforeDays'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notify the announcer before (days)</FormLabel>
                          <FormControl>
                            <Input type='number' min={0} max={90} {...field} />
                          </FormControl>
                          <p className='text-paragraph-sm text-neutral-1000'>
                            Review reminder before each occurrence publishes.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='expireInDays'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expire in day(s)</FormLabel>
                          <FormControl>
                            <Input type='number' min={0} max={365} {...field} />
                          </FormControl>
                          <p className='text-paragraph-sm text-neutral-1000'>
                            Each occurrence leaves the portal after this many days.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='flex flex-wrap gap-5'>
                    <FormField
                      control={form.control}
                      name='announceOnWeeklyOff'
                      render={({ field }) => (
                        <FormItem>
                          <label className='text-neutral-1600 flex items-center gap-1.5 text-sm'>
                            <Checkbox
                              variant='blue'
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(!!checked)}
                            />
                            Announce on weekly off
                          </label>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='announceOnHolidays'
                      render={({ field }) => (
                        <FormItem>
                          <label className='text-neutral-1600 flex items-center gap-1.5 text-sm'>
                            <Checkbox
                              variant='blue'
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(!!checked)}
                            />
                            Announce on holidays
                          </label>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name='recurrencePattern'
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
                            {RECURRENCE_PATTERNS.map((pattern) => (
                              <SelectItem key={pattern} value={pattern}>
                                {pattern}
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
                    name='recurrenceDays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicable days</FormLabel>
                        <div className='flex flex-wrap gap-3'>
                          {WEEKDAYS.map((day) => (
                            <label
                              key={day}
                              className='text-neutral-1600 flex items-center gap-1.5 text-sm'
                            >
                              <Checkbox
                                variant='blue'
                                checked={field.value.includes(day)}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, day]
                                      : field.value.filter((d) => d !== day)
                                  )
                                }
                              />
                              {day}
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='eventBased'
                    render={({ field }) => (
                      <FormItem>
                        <label className='text-neutral-1600 flex items-center gap-1.5 text-sm'>
                          <Checkbox
                            variant='blue'
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(!!checked)}
                          />
                          Event based
                        </label>
                      </FormItem>
                    )}
                  />
                  {watchEventBased && (
                    <FormField
                      control={form.control}
                      name='eventBasis'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger variant='secondary' className='w-full'>
                                <SelectValue placeholder='Select the event' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EVENT_BASES.filter((b) => b !== 'None').map((basis) => (
                                <SelectItem key={basis} value={basis}>
                                  {basis === 'Date of Birth' ? 'Birthday' : basis}
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
              ) : (
                <div className='border-gray-200 space-y-4 rounded-[6px] border bg-white px-3 py-3'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    Adhoc schedule
                  </p>
                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name='startDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Announcement date</FormLabel>
                          <FormControl>
                            <Input type='date' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='startTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time (optional)</FormLabel>
                          <FormControl>
                            <Input type='time' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name='endDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Announcement end date (optional)</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <p className='text-paragraph-sm text-neutral-1000'>
                          After this date the announcement is no longer shown on
                          the employee portal.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ---------- Visibility ---------- */}
              <div className='border-gray-200 space-y-3 rounded-[6px] border bg-white px-3 py-3'>
                <FormField
                  control={form.control}
                  name='visibleToAll'
                  render={({ field }) => (
                    <FormItem>
                      <label className='text-neutral-1600 flex items-center gap-1.5 text-sm font-medium'>
                        <Checkbox
                          variant='blue'
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
                        />
                        Visible to all employees
                      </label>
                    </FormItem>
                  )}
                />
                {watchVisibleToAll ? (
                  <FormField
                    control={form.control}
                    name='targeting'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicable groups (optional)</FormLabel>
                        <MultiSelectDropdown
                          items={groupOptions}
                          selectedIds={field.value.groups}
                          onSelectionChange={(ids) =>
                            field.onChange({ ...field.value, groups: ids })
                          }
                          placeholder='All groups'
                          className='w-full'
                        />
                        <p className='text-paragraph-sm text-neutral-1000'>
                          When visible to all, only the selected groups (if any)
                          narrow the audience.
                        </p>
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name='targeting'
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <AudiencePicker
                            value={field.value}
                            onChange={field.onChange}
                            orgConfig={orgConfig}
                            error={fieldState.error?.message}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* ---------- Notifications ---------- */}
              <div className='border-gray-200 space-y-3 rounded-[6px] border bg-white px-3 py-3'>
                <FormField
                  control={form.control}
                  name='notifyByEmail'
                  render={({ field }) => (
                    <FormItem>
                      <label className='text-neutral-1600 flex items-center gap-1.5 text-sm font-medium'>
                        <Checkbox
                          variant='blue'
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
                        />
                        Notify employee by email
                      </label>
                    </FormItem>
                  )}
                />
                {watchNotifyByEmail && (
                  <FormField
                    control={form.control}
                    name='notifySubject'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email subject</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Reminder: Q3 All-Hands on 10 July'
                            {...field}
                          />
                        </FormControl>
                        <p className='text-paragraph-sm text-neutral-1000'>
                          Sent to the resolved audience when the announcement
                          publishes (simulated — recorded in the notification log).
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* ---------- Content extras ---------- */}
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='link'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hyperlink (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. https://intranet.aster.dev/…' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='attachment'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload document</FormLabel>
                      <FormControl>
                        <Input
                          type='file'
                          onChange={(e) =>
                            field.onChange(e.target.files?.[0]?.name ?? '')
                          }
                        />
                      </FormControl>
                      {field.value && (
                        <p className='text-paragraph-sm text-neutral-1000'>
                          Attached: {field.value}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='template'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center justify-between'>
                      <FormLabel>Template (optional)</FormLabel>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-7 rounded-[6px] px-2'
                        disabled={!watchTemplate.trim()}
                        onClick={() => setPreviewOpen(true)}
                      >
                        Preview
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={'e.g. Dear {{employee}},\nHappy {{event}} on {{date}} from all of us at {{company}}!'}
                        className='min-h-20 font-mono text-sm'
                        {...field}
                      />
                    </FormControl>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Tokens: {'{{employee}}'}, {'{{event}}'}, {'{{date}}'},{' '}
                      {'{{company}}'} — resolved per recipient when published.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEdit && announcement && announcement.history.length > 0 && (
                <div className='border-gray-200 rounded-[6px] border bg-white px-3 py-2'>
                  <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                    Change history (bitemporal record)
                  </p>
                  <ul className='space-y-0.5'>
                    {announcement.history.map((entry, i) => (
                      <li
                        key={`${entry.at}-${i}`}
                        className='text-paragraph-sm text-neutral-1000'
                      >
                        {entry.at} — {entry.event}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {isEdit ? (
                <Button type='submit'>Save changes</Button>
              ) : (
                <>
                  <Button
                    type='submit'
                    variant='outline'
                    onClick={() => (intentRef.current = 'draft')}
                  >
                    Save draft
                  </Button>
                  <Button
                    type='submit'
                    variant='outline'
                    onClick={() => (intentRef.current = 'submit')}
                  >
                    Submit for approval
                  </Button>
                  <Button
                    type='submit'
                    onClick={() => (intentRef.current = 'publish')}
                  >
                    Publish
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </FloatingSheetContent>

      {/* Template preview (PDF Screen #6) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Template preview</DialogTitle>
            <DialogDescription>
              Rendered with sample values — {SAMPLE_TEMPLATE_CONTEXT.employee},{' '}
              {SAMPLE_TEMPLATE_CONTEXT.event}, {SAMPLE_TEMPLATE_CONTEXT.date},{' '}
              {SAMPLE_TEMPLATE_CONTEXT.company}.
            </DialogDescription>
          </DialogHeader>
          <div className='bg-blue-150 rounded-[6px] px-4 py-3'>
            <p className='text-neutral-1600 text-sm whitespace-pre-line'>
              {renderTemplate(watchTemplate, SAMPLE_TEMPLATE_CONTEXT)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
