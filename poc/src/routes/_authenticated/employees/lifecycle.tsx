import { createFileRoute } from '@tanstack/react-router'
import { EmployeesLifecycle } from '@/features/employees/lifecycle-page'

export const Route = createFileRoute('/_authenticated/employees/lifecycle')({
  component: EmployeesLifecycle,
})
