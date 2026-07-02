import { createFileRoute } from '@tanstack/react-router'
import { EmployeesConfiguration } from '@/features/employees/configuration-page'

export const Route = createFileRoute('/_authenticated/employees/configuration')({
  component: EmployeesConfiguration,
})
