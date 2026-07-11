import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { FunnelSimple, Plus } from 'phosphor-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/common/data-table/table'
import {
  WORKLIST_CATEGORIES,
  WORKLIST_STATUSES,
  type FeedbackWorklistEntry,
  type WorklistStatus,
} from '../data/feedback-worklist'
import { SELF_EMPLOYEE_ID, SELF_EMPLOYEE_NAME } from '../data/timeline'
import {
  submitFeedbackEntry,
  useFeedbackWorklist,
  type FeedbackDraft,
} from '../hooks/use-feedback-worklist'
import {
  AnonymousBadge,
  WorklistCategoryBadge,
  WorklistStatusBadge,
} from './feedback-badges'

const feedbackSchema = z.object({
  category: z.enum(WORKLIST_CATEGORIES),
  subject: z.string().min(5, 'Give a short subject of at least 5 characters'),
  description: z
    .string()
    .min(10, 'Describe the feedback or grievance in at least 10 characters'),
  anonymous: z.boolean(),
})

type FeedbackFormValues = z.infer<typeof feedbackSchema>

const emptyValues: FeedbackFormValues = {
  category: 'Feedback',
  subject: '',
  description: '',
  anonymous: false,
}

/**
 * Employee "Add new Feedback / Grievance" self-service form (Kensium
 * Organization / My Feedback - Grievance parity). Submissions land in the
 * same live queue the admin worklist triages.
 */
function NewFeedbackOverlay({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  const handleSubmit = (values: FeedbackFormValues) => {
    const draft: FeedbackDraft = {
      category: values.category,
      subject: values.subject.trim(),
      description: values.description.trim(),
      anonymous: values.anonymous,
    }
    const entry = submitFeedbackEntry(draft)
    toast.success(`${entry.code} submitted`, {
      description: values.anonymous
        ? 'Filed anonymously — reviewers will not see your identity.'
        : 'HR will review your submission and update its status.',
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Add new Feedback / Grievance
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
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORKLIST_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
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
                name='subject'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='One line summarizing the matter'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder='What happened, when, and what outcome you expect'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='anonymous'
                render={({ field }) => (
                  <FormItem className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
                    <div>
                      <FormLabel>Submit anonymously</FormLabel>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        Your name is withheld from the HR worklist; you can
                        still track the entry here by its reference.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Submit</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}

function sortableHeader(label: string) {
  const Header: ColumnDef<FeedbackWorklistEntry>['header'] = ({ column }) => (
    <Button
      variant='header'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className='text-neutral-2100 size-3.5' />
    </Button>
  )
  return Header
}

const columns: ColumnDef<FeedbackWorklistEntry>[] = [
  {
    accessorKey: 'code',
    header: sortableHeader('Ref'),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='text-neutral-1900 text-sm font-medium'>
          {row.original.code}
        </span>
        {row.original.anonymous && <AnonymousBadge />}
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: sortableHeader('Category'),
    cell: ({ row }) => (
      <WorklistCategoryBadge category={row.original.category} />
    ),
  },
  {
    accessorKey: 'subject',
    header: 'Subject',
    cell: ({ row }) => (
      <div className='min-w-[220px]'>
        <p className='text-neutral-1600 text-sm font-medium'>
          {row.original.subject}
        </p>
        {row.original.description && (
          <p className='text-paragraph-sm text-neutral-1000 max-w-[420px] truncate'>
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'submittedOn',
    header: sortableHeader('Submitted'),
    cell: ({ row }) => (
      <span className='text-neutral-1000 text-sm'>
        {row.original.submittedOn}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <WorklistStatusBadge status={row.original.status} />,
  },
]

type StatusFilter = 'all' | WorklistStatus

/**
 * Employee self-service "My Feedback" list (Kensium Organization / My
 * Feedback - Grievance): only the signed-in employee's own submissions are
 * shown, each with its live triage status from the shared worklist store.
 */
export function MyFeedbackTab() {
  const entries = useFeedbackWorklist()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [composeOpen, setComposeOpen] = useState(false)

  const myEntries = useMemo(
    () => entries.filter((e) => e.raisedById === SELF_EMPLOYEE_ID),
    [entries]
  )
  const visible = useMemo(
    () => myEntries.filter((e) => status === 'all' || e.status === status),
    [myEntries, status]
  )
  const openCount = useMemo(
    () =>
      myEntries.filter(
        (e) => e.status === 'Submitted' || e.status === 'Under Review'
      ).length,
    [myEntries]
  )

  return (
    <div className='w-full'>
      <p className='text-blue-1400 bg-blue-150 mb-3 rounded-md px-3 py-2 text-xs'>
        Feedback and grievances you ({SELF_EMPLOYEE_NAME}) have raised.
        Submissions go to the HR worklist for triage — {openCount} of yours{' '}
        {openCount === 1 ? 'is' : 'are'} still awaiting resolution. Anonymous
        entries hide your identity from reviewers but remain trackable here.
      </p>

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My feedback ({visible.length})
          </h2>
          <FunnelSimple size={14} className='text-neutral-1000' />
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as StatusFilter)}
          >
            <SelectTrigger
              variant='secondary'
              className='h-7 w-[170px] text-xs'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {WORKLIST_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='red'
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            onClick={() => setComposeOpen(true)}
          >
            <Plus size={10} weight='bold' />
            New Feedback / Grievance
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={visible} variant='no-status' />

      <NewFeedbackOverlay open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  )
}
