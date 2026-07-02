import { createFileRoute } from '@tanstack/react-router'
import { PlatformAdmin } from '@/features/platform-admin'

export const Route = createFileRoute('/_authenticated/platform-admin/')({
  component: PlatformAdmin,
})
