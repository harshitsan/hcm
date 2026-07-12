import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/helpers'
import {
  type Survey,
  type SurveyAnswerValue,
  type SurveyQuestion,
} from '../data/surveys'

interface SurveyTakeDialogProps {
  survey: Survey | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Return true when the store accepted the response (closes the dialog). */
  onSubmit: (answers: Record<string, SurveyAnswerValue>) => boolean
}

function isAnswered(_qn: SurveyQuestion, value: SurveyAnswerValue | undefined): boolean {
  if (value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Employee response collection: renders the survey's questionnaire in order
 * — single choice, multiple choice, 1–5 rating, yes/no and free text —
 * validates required questions and submits the answers to the survey store.
 */
export function SurveyTakeDialog({
  survey,
  open,
  onOpenChange,
  onSubmit,
}: SurveyTakeDialogProps) {
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (open) {
      setAnswers({})
      setErrors({})
    }
  }, [open, survey?.id])

  if (!survey) return null

  const setAnswer = (questionId: string, value: SurveyAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setErrors((prev) => ({ ...prev, [questionId]: false }))
  }

  const toggleMulti = (questionId: string, option: string) => {
    const current = answers[questionId]
    const selected = Array.isArray(current) ? current : []
    setAnswer(
      questionId,
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    )
  }

  const handleSubmit = () => {
    const missing: Record<string, boolean> = {}
    for (const qn of survey.questions) {
      if (qn.required && !isAnswered(qn, answers[qn.id])) missing[qn.id] = true
    }
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      return
    }
    // Only keep answers that were actually given.
    const given: Record<string, SurveyAnswerValue> = {}
    for (const qn of survey.questions) {
      const value = answers[qn.id]
      if (isAnswered(qn, value)) {
        given[qn.id] = typeof value === 'string' ? value.trim() : value!
      }
    }
    if (onSubmit(given)) onOpenChange(false)
  }

  const renderQuestion = (qn: SurveyQuestion, index: number) => {
    const error = errors[qn.id]
    const value = answers[qn.id]
    return (
      <div
        key={qn.id}
        className={cn(
          'space-y-2 rounded-[6px] border p-3',
          error ? 'border-red-1400' : 'border-gray-200'
        )}
      >
        <p className='text-neutral-1600 text-sm font-medium'>
          {index + 1}. {qn.prompt}
          {qn.required && <span className='text-red-1400'> *</span>}
        </p>

        {qn.type === 'Single choice' && (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => setAnswer(qn.id, v)}
            className='flex flex-col gap-1.5'
          >
            {qn.options.map((opt) => (
              <div key={opt} className='flex items-center gap-2'>
                <RadioGroupItem value={opt} id={`${qn.id}-${opt}`} />
                <Label htmlFor={`${qn.id}-${opt}`} className='text-sm font-normal'>
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {qn.type === 'Multiple choice' && (
          <div className='flex flex-col gap-1.5'>
            {qn.options.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt)
              return (
                <div key={opt} className='flex items-center gap-2'>
                  <Checkbox
                    id={`${qn.id}-${opt}`}
                    checked={selected}
                    onCheckedChange={() => toggleMulti(qn.id, opt)}
                  />
                  <Label htmlFor={`${qn.id}-${opt}`} className='text-sm font-normal'>
                    {opt}
                  </Label>
                </div>
              )
            })}
            <p className='text-paragraph-sm text-neutral-1000'>
              Select all that apply.
            </p>
          </div>
        )}

        {qn.type === 'Rating (1–5)' && (
          <div className='flex items-center gap-1.5'>
            {[1, 2, 3, 4, 5].map((score) => (
              <Button
                key={score}
                type='button'
                variant={value === score ? 'default' : 'outline'}
                className='h-8 w-9 px-0'
                aria-label={`Rate ${score} of 5`}
                onClick={() => setAnswer(qn.id, score)}
              >
                {score}
              </Button>
            ))}
            <span className='text-paragraph-sm text-neutral-1000 ml-1'>
              1 = low · 5 = high
            </span>
          </div>
        )}

        {qn.type === 'Yes / No' && (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => setAnswer(qn.id, v)}
            className='flex gap-6'
          >
            {['Yes', 'No'].map((opt) => (
              <div key={opt} className='flex items-center gap-2'>
                <RadioGroupItem value={opt} id={`${qn.id}-${opt}`} />
                <Label htmlFor={`${qn.id}-${opt}`} className='text-sm font-normal'>
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {qn.type === 'Free text' && (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => setAnswer(qn.id, e.target.value)}
            placeholder='e.g. Share your thoughts…'
            rows={3}
          />
        )}

        {error && (
          <p className='text-red-1400 text-xs'>This question requires an answer.</p>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[88vh] flex-col sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {survey.title}
            <Badge variant={survey.anonymous ? 'open' : 'pending'}>
              {survey.anonymous ? 'Anonymous' : 'Identified'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Open {survey.startDate} – {survey.endDate} ·{' '}
            {survey.questions.length} question
            {survey.questions.length === 1 ? '' : 's'}.{' '}
            {survey.anonymous
              ? 'Your answers are recorded without your name. We separately note that you completed the survey (so HR can remind pending invitees), but that record is never linked to your answers.'
              : 'Your name is recorded together with your answers.'}
          </DialogDescription>
        </DialogHeader>

        <div className='min-h-0 flex-1 space-y-3 overflow-y-auto pr-1'>
          {survey.questions.map((qn, index) => renderQuestion(qn, index))}
        </div>

        <DialogFooter className='pt-3'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='button' onClick={handleSubmit}>
            Submit response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
