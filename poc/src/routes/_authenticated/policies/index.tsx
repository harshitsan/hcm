import { createFileRoute } from '@tanstack/react-router'
import { Policies } from '@/features/policies'

export const Route = createFileRoute('/_authenticated/policies/')({
  component: Policies,
})
