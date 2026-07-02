import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Policy } from '../data/policies'
import { policyStatus } from '../data/policy-utils'

interface PoliciesSummaryProps {
  policies: Policy[]
}

/** Count cards above the catalog: totals + effective-status breakdown. */
export function PoliciesSummary({ policies }: PoliciesSummaryProps) {
  const summaryItems = useMemo(() => {
    const statuses = policies.map((p) => policyStatus(p))
    const count = (s: string) => statuses.filter((x) => x === s).length
    return [
      { label: 'Total policies', value: policies.length },
      { label: 'Active (in force)', value: count('active') },
      { label: 'Scheduled / Draft', value: count('scheduled') + count('draft') },
      { label: 'Expired / Retired', value: count('expired') + count('retired') },
    ]
  }, [policies])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Policies Summary
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
