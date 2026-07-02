import { createFileRoute } from '@tanstack/react-router'
import { Jurisdictions } from '@/features/jurisdictions'

export const Route = createFileRoute('/_authenticated/jurisdictions/')({
  component: Jurisdictions,
})
