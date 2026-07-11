import { useMemo } from 'react'
import { type Department } from '../data/departments'
import { type Employee } from '../data/employees'
import { SummaryCards } from '@/components/module-page'

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

  return <SummaryCards title='Departments Summary' items={summaryItems} />
}
