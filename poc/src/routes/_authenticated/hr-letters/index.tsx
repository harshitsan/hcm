import { createFileRoute } from '@tanstack/react-router'
import { HrLetters } from '@/features/hr-letters'

export const Route = createFileRoute('/_authenticated/hr-letters/')({
  component: HrLetters,
})
