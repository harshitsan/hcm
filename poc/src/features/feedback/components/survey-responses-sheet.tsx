import { useMemo } from 'react'
import { ShieldCheck, UsersThree } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  type Survey,
  type SurveyParticipant,
  type SurveyQuestion,
  type SurveyResponseRecord,
} from '../data/surveys'
import { resolveSurveyAudience } from '../data/survey-audience'

interface SurveyResponsesSheetProps {
  survey: Survey | null
  responses: SurveyResponseRecord[]
  participants: SurveyParticipant[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TEXT_SAMPLE_LIMIT = 4

function optionCatalog(qn: SurveyQuestion): string[] {
  if (qn.type === 'Yes / No') return ['Yes', 'No']
  if (qn.type === 'Rating (1–5)') return ['1', '2', '3', '4', '5']
  return qn.options
}

/** Horizontal distribution bar for one answer option. */
function DistributionBar({
  label,
  count,
  total,
}: {
  label: string
  count: number
  total: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className='space-y-0.5'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-neutral-1600 text-xs'>{label}</span>
        <span className='text-neutral-1000 text-xs'>
          {count} · {pct}%
        </span>
      </div>
      <div className='bg-neutral-200 h-1.5 w-full rounded-full'>
        <div
          className='bg-blue-1400 h-1.5 rounded-full'
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function QuestionAggregate({
  question,
  index,
  responses,
}: {
  question: SurveyQuestion
  index: number
  responses: SurveyResponseRecord[]
}) {
  const answers = responses
    .map((r) => r.answers[question.id])
    .filter((a) => a !== undefined)

  return (
    <div className='border-gray-200 space-y-2 rounded-[6px] border p-3'>
      <div className='flex items-start justify-between gap-2'>
        <p className='text-neutral-1600 text-sm font-medium'>
          {index + 1}. {question.prompt}
        </p>
        <Badge variant='open'>{question.type}</Badge>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        {answers.length} of {responses.length} response(s) answered this
        question{question.required ? '' : ' (optional)'}.
      </p>

      {question.type === 'Free text' ? (
        answers.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>No written answers yet.</p>
        ) : (
          <div className='space-y-1.5'>
            {(answers as string[]).slice(0, TEXT_SAMPLE_LIMIT).map((text, i) => (
              <p
                key={i}
                className='bg-neutral-200 text-neutral-1600 rounded-[6px] px-2.5 py-1.5 text-xs'
              >
                “{text}”
              </p>
            ))}
            {answers.length > TEXT_SAMPLE_LIMIT && (
              <p className='text-paragraph-sm text-neutral-1000'>
                +{answers.length - TEXT_SAMPLE_LIMIT} more written answer(s).
              </p>
            )}
          </div>
        )
      ) : (
        <div className='space-y-1.5'>
          {question.type === 'Rating (1–5)' && answers.length > 0 && (
            <p className='text-neutral-1600 text-sm'>
              Average:{' '}
              <span className='font-semibold'>
                {(
                  (answers as number[]).reduce((sum, v) => sum + v, 0) /
                  answers.length
                ).toFixed(1)}
              </span>{' '}
              / 5
            </p>
          )}
          {optionCatalog(question).map((opt) => {
            const count = answers.filter((a) =>
              Array.isArray(a)
                ? a.includes(opt)
                : question.type === 'Rating (1–5)'
                  ? String(a) === opt
                  : a === opt
            ).length
            return (
              <DistributionBar
                key={opt}
                label={opt}
                count={count}
                total={answers.length}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Admin responses view: per-question aggregates (choice distributions,
 * rating averages, sampled written answers), the completion rollup against
 * the resolved audience, and the participation ledger. Anonymous surveys
 * show counts only — respondent identity is separated from responses; the
 * participation list exists solely for chasing and is not linkable to
 * answers.
 */
export function SurveyResponsesSheet({
  survey,
  responses,
  participants,
  open,
  onOpenChange,
}: SurveyResponsesSheetProps) {
  const invitees = useMemo(
    () => (survey ? resolveSurveyAudience(survey.audience) : []),
    [survey]
  )

  if (!survey) {
    return <Sheet open={open} onOpenChange={onOpenChange} />
  }

  const completedNames = new Set(participants.map((p) => p.name))
  const pending = invitees.filter((e) => !completedNames.has(e.name))
  const completionRate =
    invitees.length > 0
      ? Math.round((participants.length / invitees.length) * 100)
      : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Responses — {survey.title}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
          {/* Anonymity banner */}
          {survey.anonymous ? (
            <div className='bg-blue-150 flex items-start gap-2 rounded-[6px] px-3 py-2.5'>
              <ShieldCheck size={18} className='text-blue-1400 mt-0.5 shrink-0' />
              <p className='text-blue-1400 text-xs'>
                Anonymous survey — respondent identity is separated from
                responses. The aggregates below show only counts; no answer can
                be traced back to a person.
              </p>
            </div>
          ) : (
            <div className='bg-neutral-200 flex items-start gap-2 rounded-[6px] px-3 py-2.5'>
              <UsersThree size={18} className='text-neutral-1600 mt-0.5 shrink-0' />
              <p className='text-neutral-1600 text-xs'>
                Named survey — each response is recorded with the respondent's
                name (listed under Participation).
              </p>
            </div>
          )}

          {/* Completion rollup */}
          <div className='grid grid-cols-3 gap-2'>
            <div className='border-gray-200 rounded-[6px] border px-3 py-2'>
              <p className='text-neutral-1000 text-xs'>Invited</p>
              <p className='text-neutral-1600 text-paragraph-md font-semibold'>
                {invitees.length}
              </p>
            </div>
            <div className='border-gray-200 rounded-[6px] border px-3 py-2'>
              <p className='text-neutral-1000 text-xs'>Responses</p>
              <p className='text-neutral-1600 text-paragraph-md font-semibold'>
                {responses.length}
              </p>
            </div>
            <div className='border-gray-200 rounded-[6px] border px-3 py-2'>
              <p className='text-neutral-1000 text-xs'>Completion</p>
              <p className='text-neutral-1600 text-paragraph-md font-semibold'>
                {completionRate}%
              </p>
            </div>
          </div>

          {/* Per-question aggregates */}
          <div>
            <p className='text-neutral-1600 mb-2 text-sm font-medium'>
              Results by question
            </p>
            {responses.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                No responses collected yet.
              </p>
            ) : (
              <div className='space-y-2'>
                {survey.questions.map((qn, index) => (
                  <QuestionAggregate
                    key={qn.id}
                    question={qn}
                    index={index}
                    responses={responses}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Participation ledger */}
          <div>
            <p className='text-neutral-1600 mb-1 text-sm font-medium'>
              Participation ({participants.length} of {invitees.length})
            </p>
            {survey.anonymous && (
              <p className='text-paragraph-sm text-neutral-1000 mb-2'>
                Completion is tracked separately from answers so HR can remind
                pending invitees. Who completed is shown below, but it is not
                linkable to any answer set above.
              </p>
            )}
            {participants.length === 0 ? (
              <p className='text-paragraph-sm text-neutral-1000'>
                Nobody has completed this survey yet.
              </p>
            ) : (
              <div className='flex flex-wrap gap-1.5'>
                {participants.map((p) => (
                  <Badge key={p.name} variant='completed'>
                    {p.name} · {p.completedOn}
                  </Badge>
                ))}
              </div>
            )}
            {pending.length > 0 && survey.status === 'Published' && (
              <div className='mt-2'>
                <p className='text-paragraph-sm text-neutral-1000 mb-1'>
                  Still pending ({pending.length}) — reminder candidates:
                </p>
                <div className='flex flex-wrap gap-1.5'>
                  {pending.map((e) => (
                    <Badge key={e.id} variant='pending'>
                      {e.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
