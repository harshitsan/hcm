import { createFileRoute } from '@tanstack/react-router'
import { Portfolios } from '@/features/portfolios'

export const Route = createFileRoute('/_authenticated/portfolios/')({
  component: Portfolios,
})
