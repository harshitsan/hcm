import { createFileRoute } from '@tanstack/react-router'
import { Employees } from '@/features/employees'

export const Route = createFileRoute('/_authenticated/employees/')({
  component: Employees,
  // Detail sheet deep link: /employees?employee=EMP-1024
  validateSearch: (search: Record<string, unknown>) => ({
    employee:
      typeof search.employee === 'string' ? search.employee : undefined,
  }),
})
