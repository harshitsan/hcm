import { createFileRoute } from '@tanstack/react-router'
import { OrgGroups } from '@/features/org-groups'

export const Route = createFileRoute('/_authenticated/org-groups/')({
  component: OrgGroups,
})
