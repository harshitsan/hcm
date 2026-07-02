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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  TS_CLIENTS,
  TS_PROJECTS,
  TS_TASKS,
  WEEKDAY_LABELS,
  WORK_TYPES,
} from '../data/timesheets'
import { type TimesheetEntryDraft } from '../hooks/use-timesheets'

const entrySchema = z
  .object({
    client: z.string().min(1, 'Select a client'),
    project: z.string().min(1, 'Select a project'),
    task: z.string().min(1, 'Select a task'),
    typeOfWork: z.enum(WORK_TYPES),
    productive: z.boolean(),
    nonProductiveReason: z.string(),
    hours: z.array(
      z
        .number('Enter hours')
        .min(0, 'Hours cannot be negative')
        .max(16, 'Max 16 hours per day')
    ),
    comment: z.string(),
  })
  .refine((v) => v.productive || v.nonProductiveReason.trim().length >= 5, {
    message: 'Give a reason when time is not productive',
    path: ['nonProductiveReason'],
  })
  .refine((v) => v.hours.some((h) => h > 0), {
    message: 'Enter hours for at least one day',
    path: ['hours'],
  })

type EntryFormValues = z.infer<typeof entrySchema>

const emptyValues: EntryFormValues = {
  client: TS_CLIENTS[0],
  project: TS_PROJECTS[0],
  task: TS_TASKS[0],
  typeOfWork: 'Development',
  productive: true,
  nonProductiveReason: '',
  hours: [0, 0, 0, 0, 0, 0, 0],
  comment: '',
}

interface TimesheetEntryOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: TimesheetEntryDraft) => void
}

/**
 * Timesheet entry form (ESS-24/25): client/project/task with hours per
 * weekday, type-of-work + productivity classification (reason required when
 * non-productive) and an optional comment.
 */
export function TimesheetEntryOverlay({
  open,
  onOpenChange,
  onSubmit,
}: TimesheetEntryOverlayProps) {
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  const productive = form.watch('productive')

  const handleSubmit = (values: EntryFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  const selectField = (
    name: 'client' | 'project' | 'task',
    label: string,
    options: readonly string[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
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
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New timesheet entry
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {selectField('client', 'Client', TS_CLIENTS)}
              {selectField('project', 'Project', TS_PROJECTS)}
              {selectField('task', 'Task', TS_TASKS)}

              <FormField
                control={form.control}
                name='typeOfWork'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of work</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORK_TYPES.map((wt) => (
                          <SelectItem key={wt} value={wt}>
                            {wt}
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
                name='productive'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'>
                    <FormLabel className='mb-0'>Productive time</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!productive && (
                <FormField
                  control={form.control}
                  name='nonProductiveReason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Non-productive reason</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Recurring ceremonies'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='hours'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours per day</FormLabel>
                    <div className='grid grid-cols-7 gap-1'>
                      {WEEKDAY_LABELS.map((day, idx) => (
                        <div key={day} className='flex flex-col items-center gap-1'>
                          <span className='text-paragraph-sm text-neutral-1000'>
                            {day}
                          </span>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.5'
                              min={0}
                              max={16}
                              aria-label={`${day} hours`}
                              value={field.value[idx]}
                              onChange={(e) => {
                                const next = [...field.value]
                                next[idx] = Number(e.target.value)
                                field.onChange(next)
                              }}
                              className='h-8 px-1 text-center'
                            />
                          </FormControl>
                        </div>
                      ))}
                    </div>
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
                      <Textarea placeholder='Context for this entry' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save entry</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
