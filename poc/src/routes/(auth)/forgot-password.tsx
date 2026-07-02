import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken, getIdToken } from '@/utils/token-storage'
import { ForgotPassword } from '@/features/auth/components/forgot-password'

export const Route = createFileRoute('/(auth)/forgot-password')({
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
  component: ForgotPassword,
})
