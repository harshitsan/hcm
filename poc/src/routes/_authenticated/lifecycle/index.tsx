import { createFileRoute } from '@tanstack/react-router'
import { Lifecycle } from '@/features/lifecycle'

export const Route = createFileRoute('/_authenticated/lifecycle/')({
  component: Lifecycle,
})
