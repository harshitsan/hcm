import { createFileRoute, redirect } from '@tanstack/react-router'
import { requestModuleTab } from '@/features/workflows/data/module-nav'

// The Engines Hub merged into the Workflows page — its catalog lives on the
// Configure tab's Browse view. Old links and muscle memory land there.
export const Route = createFileRoute('/_authenticated/engines/')({
  beforeLoad: () => {
    requestModuleTab('/workflows', 'business-logic')
    throw redirect({ to: '/workflows' })
  },
})
