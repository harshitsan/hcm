import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken, getIdToken } from '@/utils/token-storage'
import { SignIn } from '@/features/auth/components/sign-in'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  beforeLoad: () => {
    // Check if user is already authenticated
    const accessToken = getAccessToken()
    const idToken = getIdToken()

    if (accessToken && idToken) {
      // Redirect to home if already logged in
      throw redirect({
        to: '/',
        replace: true,
      })
    }
  },
  component: SignIn,
  validateSearch: searchSchema,
})
