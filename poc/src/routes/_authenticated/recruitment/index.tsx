import { createFileRoute } from '@tanstack/react-router'
import { Recruitment } from '@/features/recruitment'

export const Route = createFileRoute('/_authenticated/recruitment/')({
  component: Recruitment,
})
