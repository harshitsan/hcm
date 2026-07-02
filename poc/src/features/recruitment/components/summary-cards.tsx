import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Application } from '../data/candidates'
import type { Offer } from '../data/offers'
import type { Requisition } from '../data/requisitions'

interface RecruitmentSummaryProps {
  requisitions: Requisition[]
  applications: Application[]
  offers: Offer[]
}

/** Count cards shown above the recruitment tabs (TA-03, TA-13, TA-20). */
export function RecruitmentSummary({
  requisitions,
  applications,
  offers,
}: RecruitmentSummaryProps) {
  const summaryItems = useMemo(() => {
    // Filled/cancelled requisitions are excluded from active-open reporting (TA-03).
    const openReqs = requisitions.filter((r) =>
      ['approved', 'sourcing', 'pending-approval', 'on-hold', 'draft'].includes(
        r.status
      )
    ).length
    const inPipeline = applications.filter(
      (a) => !['rejected', 'cancelled', 'hired'].includes(a.status)
    ).length
    const pendingOffers = offers.filter((o) =>
      ['pending-approval', 'approved', 'released'].includes(o.status)
    ).length
    const hired = applications.filter((a) => a.status === 'hired').length

    return [
      { label: 'Open requisitions', value: openReqs },
      { label: 'Candidates in pipeline', value: inPipeline },
      { label: 'Offers in flight', value: pendingOffers },
      { label: 'Hired this cycle', value: hired },
    ]
  }, [requisitions, applications, offers])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Recruitment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex flex-col gap-4'>
                <span className='text-paragraph-sm font-medium text-black'>
                  {item.label}
                </span>
                <span className='text-3xl font-medium text-black'>
                  {item.value.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
