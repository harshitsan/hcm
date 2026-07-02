import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Employee } from '../data/directory'

interface DirectorySummaryProps {
  employees: Employee[]
  companiesInScope: number
}

/** Count cards above the tabs — scoped to what the active role can see. */
export function DirectorySummary({
  employees,
  companiesInScope,
}: DirectorySummaryProps) {
  const summaryItems = useMemo(
    () => [
      { label: 'People in scope', value: employees.length },
      {
        label: 'Departments',
        value: new Set(employees.map((e) => e.department)).size,
      },
      {
        label: 'Non-user employees',
        value: employees.filter((e) => !e.isUser).length,
      },
      { label: 'Companies in scope', value: companiesInScope },
    ],
    [employees, companiesInScope]
  )

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Directory Summary
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
