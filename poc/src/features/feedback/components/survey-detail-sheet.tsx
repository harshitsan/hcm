import { useMemo, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type Survey, type SurveyResponseRecord } from '../data/surveys'
import { resolveSurveyAudience } from '../data/survey-audience'
import { surveyStatusVariant } from './survey-status'

interface SurveyDetailSheetProps {
  survey: Survey | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Collected answer records for this survey (drives the results rollup). */
  responses?: SurveyResponseRecord[]
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-4 py-1.5'>
      <span className='text-paragraph-sm text-neutral-1000 shrink-0'>{label}</span>
      <span className='text-neutral-1900 text-right text-sm'>{value}</span>
    </div>
  )
}

/**
 * View task action target (SVL-06): read-only survey configuration, the
 * ordered questionnaire, the targeted audience and live participation
 * results for published/completed surveys.
 */
export function SurveyDetailSheet({
  survey,
  open,
  onOpenChange,
  responses = [],
}: SurveyDetailSheetProps) {
  const hasResults =
    survey !== null && (survey.status === 'Published' || survey.status === 'Completed')

  const invitedCount = useMemo(
    () => (survey ? resolveSurveyAudience(survey.audience).length : 0),
    [survey]
  )

  const completionRate =
    invitedCount > 0 ? Math.round((responses.length / invitedCount) * 100) : 0

  /** Overall average across every 1–5 rating answer in the survey. */
  const averageRating = useMemo(() => {
    if (!survey) return null
    const ratingIds = new Set(
      survey.questions.filter((q) => q.type === 'Rating (1–5)').map((q) => q.id)
    )
    const scores: number[] = []
    for (const r of responses) {
      for (const [qid, value] of Object.entries(r.answers)) {
        if (ratingIds.has(qid) && typeof value === 'number') scores.push(value)
      }
    }
    if (scores.length === 0) return null
    return (scores.reduce((sum, v) => sum + v, 0) / scores.length).toFixed(1)
  }, [survey, responses])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[440px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {survey?.title ?? 'Survey'}
          </SheetTitle>
        </SheetHeader>
        {survey && (
          <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Configuration</p>
              <div className='border-gray-200 divide-grey-200 divide-y rounded-[6px] border px-3'>
                <DetailRow
                  label='Status'
                  value={
                    <Badge variant={surveyStatusVariant(survey.status)}>{survey.status}</Badge>
                  }
                />
                <DetailRow label='Period' value={survey.period} />
                <DetailRow label='Start date' value={survey.startDate} />
                <DetailRow label='End date' value={survey.endDate} />
                <DetailRow
                  label='Anonymity'
                  value={
                    <Badge variant={survey.anonymous ? 'open' : 'pending'}>
                      {survey.anonymous ? 'Anonymous' : 'Identified'}
                    </Badge>
                  }
                />
                <DetailRow label='Created by' value={survey.createdBy} />
                <DetailRow label='Published on' value={survey.publishedOn ?? '—'} />
                <DetailRow label='Audience' value={survey.applicability} />
                <DetailRow label='Audience size' value={`${invitedCount} employee(s)`} />
              </div>
            </div>

            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Description</p>
              <p className='text-paragraph-sm text-neutral-1000'>
                {survey.description || 'No description recorded.'}
              </p>
            </div>

            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>
                Questionnaire ({survey.questions.length} question
                {survey.questions.length === 1 ? '' : 's'})
              </p>
              {survey.questions.length === 0 ? (
                <p className='text-paragraph-sm text-neutral-1000'>
                  No questions added yet — edit the survey to build its
                  questionnaire.
                </p>
              ) : (
                <ol className='space-y-1.5'>
                  {survey.questions.map((qn, index) => (
                    <li
                      key={qn.id}
                      className='border-gray-200 rounded-[6px] border px-3 py-2'
                    >
                      <p className='text-neutral-1600 text-sm'>
                        {index + 1}. {qn.prompt}
                      </p>
                      <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                        <Badge variant='open'>{qn.type}</Badge>
                        <Badge variant={qn.required ? 'pending' : 'badge_inactive'}>
                          {qn.required ? 'Required' : 'Optional'}
                        </Badge>
                        {qn.options.length > 0 && (
                          <span className='text-paragraph-sm text-neutral-1000'>
                            {qn.options.filter((o) => o.trim() !== '').join(' · ')}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Results</p>
              {hasResults ? (
                <div className='border-gray-200 divide-grey-200 divide-y rounded-[6px] border px-3'>
                  <DetailRow label='Invitations sent' value={String(invitedCount)} />
                  <DetailRow
                    label='Responses received'
                    value={String(responses.length)}
                  />
                  <DetailRow
                    label='Completion rate'
                    value={
                      survey.status === 'Completed'
                        ? `${completionRate}%`
                        : `${completionRate}% (in progress)`
                    }
                  />
                  <DetailRow
                    label='Average rating score'
                    value={averageRating ? `${averageRating} / 5` : '—'}
                  />
                </div>
              ) : (
                <p className='text-paragraph-sm text-neutral-1000'>
                  Results become available once the survey is published and
                  responses start arriving.
                </p>
              )}
            </div>
          </div>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
