import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Department } from '../data/departments'
import { type Employee } from '../data/employees'

interface DepartmentsSummaryProps {
  departments: Department[]
  employees: Employee[]
}

/** Count cards shown above the departments tabs. */
export function DepartmentsSummary({ departments, employees }: DepartmentsSummaryProps) {
  const summaryItems = useMemo(() => {
    const active = departments.filter((d) => d.status === 'active').length
    const topLevel = departments.filter((d) => d.parentId === null).length
    const withHead = departments.filter((d) => d.headId !== null).length
    return [
      { label: 'Total departments', value: departments.length },
      { label: 'Active', value: active },
      { label: 'Top-level', value: topLevel },
      { label: 'With designated head', value: withHead },
      { label: 'Employees assigned', value: employees.length },
    ]
  }, [departments, employees])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Departments Summary
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
