import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken, getIdToken } from '@/utils/token-storage'
import { SignUp } from '@/features/auth/components/sign-up'

export const Route = createFileRoute('/(auth)/sign-up')({
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
  component: SignUp,
})
