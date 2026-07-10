import { type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type Survey } from '../data/surveys'
import { surveyStatusVariant } from './survey-status'

interface SurveyDetailSheetProps {
  survey: Survey | null
  open: boolean
  onOpenChange: (open: boolean) => void
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
 * View task action target (SVL-06): read-only survey configuration plus
 * mock participation results for published/completed surveys.
 */
export function SurveyDetailSheet({ survey, open, onOpenChange }: SurveyDetailSheetProps) {
  const hasResults =
    survey !== null && (survey.status === 'Published' || survey.status === 'Completed')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[440px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {survey?.title ?? 'Survey'}
          </SheetTitle>
        </SheetHeader>
        {survey && (
          <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Configuration</p>
              <div className='border-grey-200 divide-grey-200 divide-y rounded-[6px] border px-3'>
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
                    <Badge variant={survey.anonymous ? 'booked' : 'pending'}>
                      {survey.anonymous ? 'Anonymous' : 'Identified'}
                    </Badge>
                  }
                />
                <DetailRow label='Created by' value={survey.createdBy} />
                <DetailRow label='Published on' value={survey.publishedOn ?? '—'} />
                <DetailRow label='Applicability' value={survey.applicability} />
              </div>
            </div>

            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Description</p>
              <p className='text-paragraph-sm text-neutral-1000'>
                {survey.description || 'No description recorded.'}
              </p>
            </div>

            <div>
              <p className='text-neutral-1600 mb-1 text-sm font-medium'>Results</p>
              {hasResults ? (
                <div className='border-grey-200 divide-grey-200 divide-y rounded-[6px] border px-3'>
                  <DetailRow label='Invitations sent' value='248' />
                  <DetailRow
                    label='Responses received'
                    value={survey.status === 'Completed' ? '211' : '96'}
                  />
                  <DetailRow
                    label='Completion rate'
                    value={survey.status === 'Completed' ? '85%' : '39% (in progress)'}
                  />
                  <DetailRow label='Average score' value='4.1 / 5' />
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
