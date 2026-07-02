import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard'

const homeSearchSchema = z
  .object({
    language: z.string().optional(),
  })
  .catch({})

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: homeSearchSchema,
  component: Dashboard,
})
