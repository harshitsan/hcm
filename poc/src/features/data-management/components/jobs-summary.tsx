import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type DataJob } from '../data/jobs'

interface JobsSummaryProps {
  jobs: DataJob[]
}

/** Count cards shown above the job dashboard (live status breakdown). */
export function JobsSummary({ jobs }: JobsSummaryProps) {
  const summaryItems = useMemo(() => {
    const inFlight = jobs.filter((j) =>
      ['Submitted', 'Validating', 'In-progress'].includes(j.status)
    ).length
    const completed = jobs.filter((j) => j.status === 'Completed').length
    const attention = jobs.filter(
      (j) => j.status === 'Failed' || j.status === 'Partially completed'
    ).length
    const failedRecords = jobs.reduce((sum, j) => sum + j.failedRecords, 0)

    return [
      { label: 'Total jobs', value: jobs.length },
      { label: 'In flight', value: inFlight },
      { label: 'Completed', value: completed },
      { label: 'Failed / Partial', value: attention },
      { label: 'Failed records', value: failedRecords },
    ]
  }, [jobs])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Import / Export Summary
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
