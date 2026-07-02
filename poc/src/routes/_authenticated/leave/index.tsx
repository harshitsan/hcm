import { createFileRoute } from '@tanstack/react-router'
import { LeaveManagement } from '@/features/leave'

export const Route = createFileRoute('/_authenticated/leave/')({
  component: LeaveManagement,
})
