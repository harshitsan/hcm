import { createFileRoute } from '@tanstack/react-router'
import { TimeAttendance } from '@/features/attendance'

export const Route = createFileRoute('/_authenticated/attendance/')({
  component: TimeAttendance,
})
