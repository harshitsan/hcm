import { createFileRoute } from '@tanstack/react-router'
import { RbacPage } from '@/features/rbac'

export const Route = createFileRoute('/_authenticated/rbac/')({
  component: RbacPage,
})
