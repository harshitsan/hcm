import { createFileRoute } from '@tanstack/react-router'
import { Authentication } from '@/features/authentication'

export const Route = createFileRoute('/_authenticated/authentication/')({
  component: Authentication,
})
