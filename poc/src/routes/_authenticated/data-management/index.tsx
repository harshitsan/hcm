import { createFileRoute } from '@tanstack/react-router'
import { DataManagement } from '@/features/data-management'

export const Route = createFileRoute('/_authenticated/data-management/')({
  component: DataManagement,
})
