import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { expiryStatusOf, type DocumentRecord } from '../data/documents'

interface DocumentsSummaryProps {
  documents: DocumentRecord[]
  leadTimeDays: number
}

/**
 * Count cards above the documents grid: totals plus the expiration-tracking
 * breakdown that surfaces expired and upcoming-expiry documents (DOC-07/13).
 */
export function DocumentsSummary({
  documents,
  leadTimeDays,
}: DocumentsSummaryProps) {
  const summaryItems = useMemo(() => {
    const byStatus = (status: 'expired' | 'expiring') =>
      documents.filter(
        (d) => expiryStatusOf(d.expiryDate, leadTimeDays) === status
      ).length

    return [
      { label: 'Total documents', value: documents.length },
      { label: `Expiring within ${leadTimeDays} days`, value: byStatus('expiring') },
      { label: 'Expired', value: byStatus('expired') },
      {
        label: 'Categories in use',
        value: new Set(documents.map((d) => d.category)).size,
      },
    ]
  }, [documents, leadTimeDays])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Documents Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
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
