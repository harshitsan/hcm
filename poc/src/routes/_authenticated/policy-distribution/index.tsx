import { createFileRoute } from '@tanstack/react-router'
import { PolicyDistribution } from '@/features/policy-distribution'

export const Route = createFileRoute('/_authenticated/policy-distribution/')({
  component: PolicyDistribution,
})
