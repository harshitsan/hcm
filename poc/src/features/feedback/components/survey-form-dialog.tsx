import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  SURVEY_APPLICABILITY,
  SURVEY_PERIODS,
  SURVEY_STATUSES,
  type Survey,
} from '../data/surveys'
import { type SurveyDraft } from '../hooks/use-surveys'

const schema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    period: z.enum(SURVEY_PERIODS),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    anonymous: z.boolean(),
    applicability: z.string().min(1, 'Select applicability'),
    status: z.enum(SURVEY_STATUSES),
    description: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  })

type SurveyFormValues = z.infer<typeof schema>

interface SurveyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this survey; otherwise it creates one. */
  survey: Survey | null
  onSubmit: (draft: SurveyDraft) => void
}

/**
 * Add / Edit survey dialog (SVL-01): title, period, start/end dates,
 * anonymity, applicability, status and description on a zod-validated form.
 */
export function SurveyFormDialog({
  open,
  onOpenChange,
  survey,
  onSubmit,
}: SurveyFormDialogProps) {
  const defaults = useMemo<SurveyFormValues>(
    () =>
      survey
        ? {
            title: survey.title,
            period: survey.period,
            startDate: survey.startDate,
            endDate: survey.endDate,
            anonymous: survey.anonymous,
            applicability: survey.applicability,
            status: survey.status,
            description: survey.description,
          }
        : {
            title: '',
            period: SURVEY_PERIODS[2],
            startDate: '',
            endDate: '',
            anonymous: true,
            applicability: '',
            status: 'Pending Approval',
            description: '',
          },
    [survey]
  )

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) form.reset(defaults)
  }, [open, defaults, form])

  const handleSubmit = (values: SurveyFormValues) => {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{survey ? `Edit survey: ${survey.title}` : 'Add new survey'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Survey title</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Quarterly Engagement Pulse' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='period'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SURVEY_PERIODS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SURVEY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
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
                    <FormLabel>End date</FormLabel>
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
              name='applicability'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicability</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Who receives this survey?' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SURVEY_APPLICABILITY.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
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
              name='anonymous'
              render={({ field }) => (
                <FormItem className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
                  <div>
                    <FormLabel>Anonymous responses</FormLabel>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Respondent identity is withheld from results and exports.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
                    <Textarea rows={3} placeholder='Purpose of the survey' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>{survey ? 'Save changes' : 'Create survey'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
