import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Company } from '../data/companies'

interface CompaniesSummaryProps {
  companies: Company[]
}

/** Count cards shown above the directory (total tenants + status breakdown). */
export function CompaniesSummary({ companies }: CompaniesSummaryProps) {
  const summaryItems = useMemo(() => {
    const by = (status: Company['status']) =>
      companies.filter((c) => c.status === status).length

    return [
      { label: 'Total companies', value: companies.length },
      { label: 'Active', value: by('active') },
      { label: 'Draft', value: by('draft') },
      { label: 'Suspended', value: by('suspended') },
      { label: 'Inactive / Archived', value: by('inactive') + by('archived') },
    ]
  }, [companies])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Tenant Companies Summary
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
