import { createFileRoute } from '@tanstack/react-router'
import { EmployeeCurrentStatus } from '@/features/reports/current-status'

export const Route = createFileRoute('/_authenticated/reports/current-status/')(
  {
    component: EmployeeCurrentStatus,
  }
)
