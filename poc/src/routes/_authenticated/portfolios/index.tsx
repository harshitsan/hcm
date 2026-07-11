import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Portfolios } from '@/features/portfolios'

/**
 * Bookmarkable company-context URLs (PORT-FR-006, PORT-17): /portfolios
 * accepts ?company=<companyId> and the module switches context to it —
 * authorized targets load automatically, unauthorized ones are denied with
 * AUTH_002 and the URL falls back to the active context.
 */
const portfoliosSearchSchema = z
  .object({
    company: z.string().optional(),
  })
  .catch({})

export const Route = createFileRoute('/_authenticated/portfolios/')({
  validateSearch: portfoliosSearchSchema,
  component: Portfolios,
})
