import { createFileRoute } from '@tanstack/react-router'
import { EmployeesPerformance } from '@/features/employees/performance-page'

export const Route = createFileRoute('/_authenticated/employees/performance')({
  component: EmployeesPerformance,
})
