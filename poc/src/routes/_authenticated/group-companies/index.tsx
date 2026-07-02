import { createFileRoute } from '@tanstack/react-router'
import { GroupCompanies } from '@/features/group-companies'

export const Route = createFileRoute('/_authenticated/group-companies/')({
  component: GroupCompanies,
})
