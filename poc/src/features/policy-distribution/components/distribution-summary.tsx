import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Assignment, type Distribution } from '../data/distributions'

interface DistributionSummaryProps {
  distributions: Distribution[]
  assignments: Assignment[]
}

/** Count cards for the admin console: distributions + acknowledgment states. */
export function DistributionSummary({
  distributions,
  assignments,
}: DistributionSummaryProps) {
  const items = useMemo(() => {
    const active = assignments.filter((a) => !a.superseded)
    const acked = active.filter((a) => a.status === 'Acknowledged').length
    const pending = active.filter((a) => a.status === 'Pending').length
    const overdue = active.filter((a) => a.status === 'Overdue').length
    // Open re-acknowledgment asks — anything not part of an initial send.
    const pendingReAck = active.filter(
      (a) =>
        a.trigger !== 'Initial' &&
        (a.status === 'Pending' || a.status === 'Overdue')
    ).length
    return [
      { label: 'Distributions', value: distributions.length },
      { label: 'Acknowledged', value: acked },
      { label: 'Pending', value: pending },
      { label: 'Overdue', value: overdue },
      { label: 'Awaiting re-acknowledgment', value: pendingReAck },
    ]
  }, [distributions, assignments])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Distribution Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          {items.map((item) => (
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
