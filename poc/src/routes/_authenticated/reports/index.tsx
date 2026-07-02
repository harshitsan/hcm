import { createFileRoute } from '@tanstack/react-router'
import { ReportsAnalytics } from '@/features/reports'

export const Route = createFileRoute('/_authenticated/reports/')({
  component: ReportsAnalytics,
})
