import { createFileRoute } from '@tanstack/react-router'
import { RolesSecurity } from '@/features/roles-security'

export const Route = createFileRoute('/_authenticated/roles-security/')({
  component: RolesSecurity,
})
