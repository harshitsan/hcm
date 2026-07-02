import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Jurisdiction } from '../data/jurisdictions'
import { type CompanyRecord } from '../data/assignments'

interface JurisdictionsSummaryProps {
  jurisdictions: Jurisdiction[]
  companies: CompanyRecord[]
}

/** Count cards above the tabs — catalog size, coverage and configuration. */
export function JurisdictionsSummary({
  jurisdictions,
  companies,
}: JurisdictionsSummaryProps) {
  const summaryItems = useMemo(() => {
    const active = jurisdictions.filter((j) => j.status === 'active')
    const configured = jurisdictions.filter((j) => j.taxFees.length > 0)
    const inUse = new Set(companies.flatMap((c) => c.jurisdictionIds))
    return [
      { label: 'Catalog entries', value: jurisdictions.length },
      { label: 'Active', value: active.length },
      { label: 'Tax/fee configured', value: configured.length },
      { label: 'In use by companies', value: inUse.size },
    ]
  }, [jurisdictions, companies])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Jurisdictions Summary
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
