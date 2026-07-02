import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COMPANIES, type Portfolio } from '../data/portfolios'

interface PortfoliosSummaryProps {
  portfolios: Portfolio[]
}

/** Count cards shown above the portfolio tabs (PORT-10 oversight view). */
export function PortfoliosSummary({ portfolios }: PortfoliosSummaryProps) {
  const summaryItems = useMemo(() => {
    const assignedIds = new Set(
      portfolios.flatMap((p) => p.companies.map((l) => l.companyId))
    )
    const activeCompanies = COMPANIES.filter((c) => c.status === 'active')
    return [
      { label: 'Total portfolios', value: portfolios.length },
      {
        label: 'Active portfolios',
        value: portfolios.filter((p) => p.status === 'Active').length,
      },
      { label: 'Companies under portfolios', value: assignedIds.size },
      {
        label: 'Unassigned companies',
        value: activeCompanies.filter((c) => !assignedIds.has(c.id)).length,
      },
    ]
  }, [portfolios])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Portfolios Summary
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
