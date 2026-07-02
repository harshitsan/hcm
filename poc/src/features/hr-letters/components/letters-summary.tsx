import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type HrDocument } from '../data/hr-letters'

interface LettersSummaryProps {
  documents: HrDocument[]
}

/** Count cards shown above the documents grid (HLC-22 overview). */
export function LettersSummary({ documents }: LettersSummaryProps) {
  const summaryItems = useMemo(() => {
    const by = (status: HrDocument['status']) =>
      documents.filter((d) => d.status === status).length
    const failedDeliveries = documents.filter((d) =>
      d.distributions.some((dist) => dist.outcome === 'failed')
    ).length
    const pendingAcks = documents.filter(
      (d) => d.requiresAcknowledgment && !d.acknowledgedOn
    ).length

    return [
      { label: 'Total documents', value: documents.length },
      { label: 'Pending approval', value: by('pending-approval') },
      { label: 'Distributed', value: by('distributed') },
      { label: 'Delivery failures', value: failedDeliveries },
      { label: 'Acknowledgments due', value: pendingAcks },
    ]
  }, [documents])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          HR Letters &amp; Certificates Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex w-full items-center gap-3'>
                <div className='flex flex-col gap-4'>
                  <span className='text-paragraph-sm font-medium text-black'>
                    {item.label}
                  </span>
                  <span className='text-3xl font-medium text-black'>
                    {item.value.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
