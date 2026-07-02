import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '@/features/platform-admin/pages/workspace'

export const Route = createFileRoute('/_authenticated/platform-admin/workspace')({
  component: WorkspacePage,
})
