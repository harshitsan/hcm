import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  QUESTION_TYPES,
  type QuestionType,
  type SurveyQuestion,
} from '../data/surveys'

interface QuestionnaireBuilderProps {
  value: SurveyQuestion[]
  onChange: (questions: SurveyQuestion[]) => void
  /**
   * True once the survey has been published — the questionnaire is then
   * read-only so collected answers stay comparable.
   */
  locked?: boolean
}

const CHOICE_TYPES: QuestionType[] = ['Single choice', 'Multiple choice']

function newQuestion(): SurveyQuestion {
  return {
    id: `q-${crypto.randomUUID().slice(0, 8)}`,
    prompt: '',
    type: 'Single choice',
    required: true,
    options: ['', ''],
  }
}

/**
 * Survey authoring questionnaire builder: ordered questions with a type
 * (single/multiple choice, 1–5 rating, yes/no, free text), a per-question
 * required toggle, add / remove / reorder, and option editing for the
 * choice types.
 */
export function QuestionnaireBuilder({
  value,
  onChange,
  locked = false,
}: QuestionnaireBuilderProps) {
  const patch = (index: number, changes: Partial<SurveyQuestion>) => {
    onChange(value.map((qn, i) => (i === index ? { ...qn, ...changes } : qn)))
  }

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const changeType = (index: number, type: QuestionType) => {
    const qn = value[index]
    const keepsOptions = CHOICE_TYPES.includes(type)
    patch(index, {
      type,
      options: keepsOptions
        ? qn.options.length >= 2
          ? qn.options
          : ['', '']
        : [],
    })
  }

  return (
    <div className='space-y-3'>
      {locked && (
        <p className='bg-blue-150 text-blue-1400 rounded-[6px] px-3 py-2 text-xs'>
          This survey has been published, so its questionnaire is locked —
          changing questions now would make already-collected answers
          incomparable.
        </p>
      )}

      {value.length === 0 && (
        <p className='text-paragraph-sm text-neutral-1000 border-gray-200 rounded-[6px] border border-dashed px-3 py-4 text-center'>
          No questions yet. Add the first question to build the questionnaire.
        </p>
      )}

      {value.map((qn, index) => (
        <div key={qn.id} className='border-gray-200 space-y-2 rounded-[6px] border p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='open'>Q{index + 1}</Badge>
            <Select
              value={qn.type}
              onValueChange={(v) => changeType(index, v as QuestionType)}
              disabled={locked}
            >
              <SelectTrigger variant='secondary' className='h-8 w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='flex items-center gap-1.5'>
              <Switch
                id={`q-required-${qn.id}`}
                checked={qn.required}
                onCheckedChange={(checked) => patch(index, { required: checked })}
                disabled={locked}
              />
              <Label htmlFor={`q-required-${qn.id}`} className='text-xs font-normal'>
                Required
              </Label>
            </div>
            <div className='ml-auto flex items-center gap-1'>
              <Button
                type='button'
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label={`Move question ${index + 1} up`}
                disabled={locked || index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className='size-4' />
              </Button>
              <Button
                type='button'
                variant='icon2'
                className='text-neutral-1900 h-7 w-7'
                aria-label={`Move question ${index + 1} down`}
                disabled={locked || index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className='size-4' />
              </Button>
              <Button
                type='button'
                variant='icon2'
                className='text-red-1400 h-7 w-7'
                aria-label={`Remove question ${index + 1}`}
                disabled={locked}
                onClick={() => remove(index)}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </div>

          <Input
            value={qn.prompt}
            onChange={(e) => patch(index, { prompt: e.target.value })}
            placeholder='e.g. How satisfied are you with your onboarding?'
            disabled={locked}
          />

          {CHOICE_TYPES.includes(qn.type) && (
            <div className='space-y-1.5'>
              <Label className='text-xs'>
                Answer options{' '}
                {qn.type === 'Multiple choice'
                  ? '(respondents can pick several)'
                  : '(respondents pick one)'}
              </Label>
              {qn.options.map((opt, optIndex) => (
                <div key={optIndex} className='flex items-center gap-1.5'>
                  <Input
                    value={opt}
                    onChange={(e) =>
                      patch(index, {
                        options: qn.options.map((o, i) =>
                          i === optIndex ? e.target.value : o
                        ),
                      })
                    }
                    placeholder={`e.g. Option ${optIndex + 1}`}
                    className='h-8'
                    disabled={locked}
                  />
                  <Button
                    type='button'
                    variant='icon2'
                    className='text-neutral-1900 h-7 w-7 shrink-0'
                    aria-label={`Remove option ${optIndex + 1} of question ${index + 1}`}
                    disabled={locked || qn.options.length <= 2}
                    onClick={() =>
                      patch(index, {
                        options: qn.options.filter((_, i) => i !== optIndex),
                      })
                    }
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                className='h-7 gap-1 px-2 text-xs'
                disabled={locked}
                onClick={() => patch(index, { options: [...qn.options, ''] })}
              >
                <Plus className='size-3.5' /> Add option
              </Button>
            </div>
          )}

          {qn.type === 'Rating (1–5)' && (
            <p className='text-paragraph-sm text-neutral-1000'>
              Respondents pick a score from 1 (low) to 5 (high).
            </p>
          )}
          {qn.type === 'Yes / No' && (
            <p className='text-paragraph-sm text-neutral-1000'>
              Respondents answer Yes or No.
            </p>
          )}
          {qn.type === 'Free text' && (
            <p className='text-paragraph-sm text-neutral-1000'>
              Respondents answer in their own words.
            </p>
          )}
        </div>
      ))}

      {!locked && (
        <Button
          type='button'
          variant='outline'
          className='h-8 gap-1'
          onClick={() => onChange([...value, newQuestion()])}
        >
          <Plus className='size-3.5' /> Add question
        </Button>
      )}
    </div>
  )
}
