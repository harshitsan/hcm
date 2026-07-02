import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Employee } from '../data/employees'

interface EmployeesSummaryProps {
  employees: Employee[]
  scopeLabel: string
}

/** Count cards above the directory grid, scoped to the active role's view. */
export function EmployeesSummary({
  employees,
  scopeLabel,
}: EmployeesSummaryProps) {
  const items = useMemo(() => {
    const byStage = (stage: Employee['lifecycleStage']) =>
      employees.filter((e) => e.lifecycleStage === stage).length
    return [
      { label: 'Employees in scope', value: employees.length },
      {
        label: 'Active',
        value: byStage('Active'),
      },
      {
        label: 'Onboarding / Probation',
        value: byStage('Onboarding') + byStage('Probation'),
      },
      {
        label: 'Without user account',
        value: employees.filter((e) => !e.hasUserAccount).length,
      },
    ]
  }, [employees])

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Workforce Summary — {scopeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
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
