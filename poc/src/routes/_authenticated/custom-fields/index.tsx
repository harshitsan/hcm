import { createFileRoute } from '@tanstack/react-router'
import { CustomFields } from '@/features/custom-fields'

export const Route = createFileRoute('/_authenticated/custom-fields/')({
  component: CustomFields,
})
