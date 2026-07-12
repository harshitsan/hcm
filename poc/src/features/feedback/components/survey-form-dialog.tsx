import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
  SURVEY_PERIODS,
  SURVEY_STATUSES,
  type Survey,
  type SurveyQuestion,
} from '../data/surveys'
import {
  emptyAudience,
  resolveSurveyAudience,
  type Audience,
} from '../data/survey-audience'
import { type SurveyDraft } from '../hooks/use-surveys'
import { QuestionnaireBuilder } from './questionnaire-builder'
import { SurveyAudienceBuilder } from './survey-audience-builder'

const schema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    period: z.enum(SURVEY_PERIODS),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    anonymous: z.boolean(),
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

const CHOICE_TYPES = ['Single choice', 'Multiple choice']

/**
 * Validate the questionnaire before it goes to approvers or the audience:
 * every question needs a prompt, choice questions need at least two
 * filled-in options. Returns the first problem found, or null.
 */
function questionnaireProblem(questions: SurveyQuestion[]): string | null {
  for (let i = 0; i < questions.length; i++) {
    const qn = questions[i]
    if (qn.prompt.trim() === '') {
      return `Question ${i + 1} has no wording yet.`
    }
    if (CHOICE_TYPES.includes(qn.type)) {
      const filled = qn.options.filter((o) => o.trim() !== '')
      if (filled.length < 2) {
        return `Question ${i + 1} needs at least two answer options.`
      }
    }
  }
  return null
}

/**
 * Add / Edit survey dialog (SVL-01): title, period, dates, anonymity,
 * status and description, plus the questionnaire builder and audience
 * targeting over the shared applicability dimensions. Anonymity and the
 * questionnaire lock once the survey has been published.
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
            status: survey.status,
            description: survey.description,
          }
        : {
            title: '',
            period: SURVEY_PERIODS[2],
            startDate: '',
            endDate: '',
            anonymous: true,
            status: 'Pending Approval',
            description: '',
          },
    [survey]
  )

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [audience, setAudience] = useState<Audience>(emptyAudience())

  // Anonymity and the questionnaire are locked once published — responses
  // may already exist under the original promise / question set.
  const published = survey !== null && survey.publishedOn !== null

  useEffect(() => {
    if (open) {
      form.reset(defaults)
      setQuestions(survey ? survey.questions.map((qn) => ({ ...qn })) : [])
      setAudience(
        survey
          ? {
              logic: survey.audience.logic,
              criteria: survey.audience.criteria.map((c) => ({
                ...c,
                values: [...c.values],
              })),
            }
          : emptyAudience()
      )
    }
  }, [open, defaults, form, survey])

  const handleSubmit = (values: SurveyFormValues) => {
    const goingLive =
      values.status === 'Published' || values.status === 'Pending Approval'
    if (goingLive) {
      if (questions.length === 0) {
        toast.error('Questionnaire is empty', {
          description:
            'Add at least one question before sending the survey for approval or publishing it.',
        })
        return
      }
      const problem = questionnaireProblem(questions)
      if (problem) {
        toast.error('Questionnaire is incomplete', { description: problem })
        return
      }
      if (resolveSurveyAudience(audience).length === 0) {
        toast.error('No one would receive this survey', {
          description:
            'Pick at least one audience criterion that matches employees before going live.',
        })
        return
      }
    }
    const cleaned = questions.map((qn) => ({
      ...qn,
      prompt: qn.prompt.trim(),
      options: CHOICE_TYPES.includes(qn.type)
        ? goingLive
          ? qn.options.map((o) => o.trim()).filter((o) => o !== '')
          : qn.options
        : [],
    }))
    onSubmit({ ...values, questions: cleaned, audience })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[88vh] flex-col sm:max-w-[720px]'>
        <DialogHeader>
          <DialogTitle>
            {survey ? `Edit survey: ${survey.title}` : 'Add new survey'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='min-h-0 flex-1 space-y-4 overflow-y-auto pr-1'>
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
                              {s === 'Completed' ? 'Completed (closed)' : s}
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
                name='anonymous'
                render={({ field }) => (
                  <FormItem className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
                    <div>
                      <FormLabel>Anonymous responses</FormLabel>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        {published
                          ? 'Locked — anonymity cannot change once the survey has been published, because responses may already exist under that promise.'
                          : 'Respondent identity is separated from answers: results show only counts, never names. Completion is still tracked separately for reminders.'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={published}
                      />
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
                      <Textarea rows={2} placeholder='e.g. Purpose of the survey' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-2'>
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>Audience</p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Target who receives this survey using the same
                    applicability dimensions as policy distribution.
                  </p>
                </div>
                <SurveyAudienceBuilder value={audience} onChange={setAudience} />
              </div>

              <div className='space-y-2'>
                <div>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    Questionnaire ({questions.length} question
                    {questions.length === 1 ? '' : 's'})
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Employees answer these questions in order when they open
                    the survey.
                  </p>
                </div>
                <QuestionnaireBuilder
                  value={questions}
                  onChange={setQuestions}
                  locked={published}
                />
              </div>
            </div>

            <DialogFooter className='pt-4'>
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
