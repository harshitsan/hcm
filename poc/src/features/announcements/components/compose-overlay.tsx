import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Textarea } from '@/components/ui/textarea'
import {
  ANNOUNCEMENT_TYPES,
  EVENT_BASES,
  WEEKDAYS,
  type Announcement,
} from '../data/announcements'
import { DIMENSIONS, type OrgConfig } from '../data/org'
import { type AnnouncementDraft } from '../hooks/use-announcements'
import { todayIso } from '../utils/audience'
import { AudiencePicker } from './audience-picker'

const composeSchema = z
  .object({
    title: z.string().min(3, 'Title is required'),
    body: z.string().min(10, 'Message content is required (min 10 characters)'),
    type: z.enum(ANNOUNCEMENT_TYPES),
    eventBasis: z.enum(EVENT_BASES),
    recurrenceDays: z.array(z.string()),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string(),
    link: z.url('Enter a valid URL').or(z.literal('')),
    attachment: z.string(),
    targeting: z.object({
      companies: z.array(z.string()),
      jurisdictions: z.array(z.string()),
      locations: z.array(z.string()),
      departments: z.array(z.string()),
      groups: z.array(z.string()),
      workforceTypes: z.array(z.string()),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Expiry must be on or after the scheduled publish date',
      })
    }
    if (!DIMENSIONS.some((dim) => values.targeting[dim].length > 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['targeting'],
        message: 'Select at least one target audience value',
      })
    }
    if (
      values.type === 'Recurring' &&
      values.eventBasis === 'None' &&
      values.recurrenceDays.length === 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['eventBasis'],
        message: 'Recurring announcements need an event basis or series days',
      })
    }
  })

type ComposeValues = z.infer<typeof composeSchema>

const emptyValues: ComposeValues = {
  title: '',
  body: '',
  type: 'Adhoc',
  eventBasis: 'None',
  recurrenceDays: [],
  startDate: '',
  endDate: '',
  link: '',
  attachment: '',
  targeting: {
    companies: [],
    jurisdictions: [],
    locations: [],
    departments: [],
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
  onCreate: (draft: AnnouncementDraft, intent: 'draft' | 'submit') => void
  onUpdate: (id: string, draft: AnnouncementDraft) => void
}

/**
 * Metadata-driven compose screen (ANN-22): content, six-dimension audience
 * picker with live reach preview, schedule + expiry controls (ANN-05/06),
 * links/attachments (ANN-41), Adhoc/Recurring classification with event basis
 * and series cadence (ANN-30/31/42). Inline zod validation blocks submission.
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
  const intentRef = useRef<'draft' | 'submit'>('draft')

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
            type: announcement.type,
            eventBasis: announcement.eventBasis,
            recurrenceDays: announcement.recurrenceDays,
            startDate: announcement.startDate,
            endDate: announcement.endDate ?? '',
            link: announcement.link,
            attachment: announcement.attachment,
            targeting: announcement.targeting,
          }
        : emptyValues
    )
  }, [open, announcement, form])

  const watchType = form.watch('type')

  function handleSubmit(values: ComposeValues) {
    const draft: AnnouncementDraft = {
      ...values,
      endDate: values.endDate || null,
      tenant:
        announcement?.tenant ??
        (role === 'Platform Admin' ? 'Platform' : 'Aster Digital'),
    }
    if (!isEdit && values.startDate < todayIso()) {
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
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
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
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Q3 All-Hands on 10 July' {...field} />
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
                  name='eventBasis'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event based</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={watchType !== 'Recurring'}
                      >
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_BASES.map((basis) => (
                            <SelectItem key={basis} value={basis}>
                              {basis}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchType === 'Recurring' && (
                <FormField
                  control={form.control}
                  name='recurrenceDays'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configure series — applicable days</FormLabel>
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
              )}

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date (scheduled publish)</FormLabel>
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
                      <FormLabel>End date (expiry, optional)</FormLabel>
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
                  name='link'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hyperlink (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='https://intranet.aster.dev/…' {...field} />
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
                      <FormLabel>Attachment (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='Holiday-Calendar-2026.pdf' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              {isEdit && announcement && announcement.history.length > 0 && (
                <div className='border-grey-200 rounded-[6px] border bg-white px-3 py-2'>
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

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
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
                    onClick={() => (intentRef.current = 'submit')}
                  >
                    Submit for approval
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
