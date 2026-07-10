import { createFileRoute } from '@tanstack/react-router'
import { EnginesHub } from '@/features/engines'

export const Route = createFileRoute('/_authenticated/engines/')({
  component: EnginesHub,
})
