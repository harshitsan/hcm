import { createFileRoute } from '@tanstack/react-router'
import { DirectoryOrgChart } from '@/features/directory'

export const Route = createFileRoute('/_authenticated/directory/')({
  component: DirectoryOrgChart,
})
