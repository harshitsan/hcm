import { createFileRoute } from '@tanstack/react-router'
import { OrgModelPage } from '@/features/platform-admin/pages/org-model'

export const Route = createFileRoute('/_authenticated/platform-admin/org-model')({
  component: OrgModelPage,
})
