import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Employee } from '../data/employees'
import type { Position } from '../data/positions'

interface PositionsSummaryProps {
  positions: Position[]
  employees: Employee[]
}

/** Count cards shown above the tabs (catalogue size, status, coverage). */
export function PositionsSummary({ positions, employees }: PositionsSummaryProps) {
  const summaryItems = useMemo(() => {
    const active = positions.filter((p) => p.status === 'active').length
    const assigned = employees.filter((e) => e.positionId !== null).length
    return [
      { label: 'Total positions', value: positions.length },
      { label: 'Active', value: active },
      { label: 'Inactive', value: positions.length - active },
      { label: 'Employees with a position', value: assigned },
    ]
  }, [positions, employees])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Positions Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {summaryItems.map((item) => (
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
