import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { WORK_CATEGORIES } from '../data/attendance'
import { EMPLOYEES } from '../data/shared'
import { type ManualEntryDraft } from '../hooks/use-attendance'

const timeField = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Use HH:MM (24h)')

/** Punch-out must be after punch-in (TNA-01 validation). */
const manualEntrySchema = z
  .object({
    employeeId: z.string().min(1, 'Select an employee'),
    date: z.string().min(1, 'Pick a date'),
    punchIn: timeField,
    punchOut: timeField,
    workCategory: z.enum(WORK_CATEGORIES),
    comment: z.string(),
  })
  .refine((v) => v.punchOut > v.punchIn, {
    message: 'Punch-out must be after punch-in',
    path: ['punchOut'],
  })

type ManualEntryValues = z.infer<typeof manualEntrySchema>

const emptyDraft: ManualEntryValues = {
  employeeId: '',
  date: '2026-07-02',
  punchIn: '09:00',
  punchOut: '18:00',
  workCategory: 'office',
  comment: '',
}

const CATEGORY_LABELS: Record<(typeof WORK_CATEGORIES)[number], string> = {
  office: 'Office',
  'work-from-home': 'Work From Home',
  'client-location': 'Client Location',
  'official-visit': 'Official Visit',
}

interface ManualEntryOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: ManualEntryDraft) => void
}

/**
 * Manual attendance entry (TNA-01/18) — works identically for Employee
 * (Non-User) records with no self-service login; capture source is recorded
 * as "manual" and the entry is attributed to the acting admin.
 */
export function ManualEntryOverlay({
  open,
  onOpenChange,
  onSubmit,
}: ManualEntryOverlayProps) {
  const form = useForm<ManualEntryValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (open) form.reset(emptyDraft)
  }, [open, form])

  function handleSubmit(values: ManualEntryValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Manual Attendance Entry
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
                name='employeeId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select employee' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYEES.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} ({e.code}
                            {e.selfService ? '' : ' · non-user'})
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
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendance date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='punchIn'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Punch-in</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='punchOut'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Punch-out</FormLabel>
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
                name='workCategory'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work location category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORK_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {CATEGORY_LABELS[c]}
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
                name='comment'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Reader down at Gate 1' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className='text-paragraph-sm text-neutral-1000'>
                Saved entries are tagged with capture source “manual”,
                attributed to you with a timestamp, and flow into attendance
                review, overtime evaluation and reporting. Duplicate entries
                for the same employee and date are flagged automatically.
              </p>
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save Entry</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
