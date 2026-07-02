import { useMemo, useState, useEffect } from 'react'
import { decodeJWT } from '@/utils/jwt-decoder'
import { getIdToken } from '@/utils/token-storage'
import type { UserInfo } from '@/features/auth/types/auth'

/**
 * Hook to get user info from decoded ID token
 * Automatically updates when tokens change in localStorage
 */
export function useUserInfo(): {
  userInfo: UserInfo | null
  isLoading: boolean
  isAuthenticated: boolean
} {
  const [tokenUpdate, setTokenUpdate] = useState(0)

  // Listen for storage changes to update user info
  useEffect(() => {
    const handleStorageChange = () => {
      setTokenUpdate((prev) => prev + 1)
    }

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom events (from same tab)
    window.addEventListener('auth-token-updated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-token-updated', handleStorageChange)
    }
  }, [])

  const userInfo = useMemo(() => {
    const idToken = getIdToken()
    if (!idToken) return null
    return decodeJWT(idToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUpdate])

  const isAuthenticated = !!userInfo

  return {
    userInfo: {
      username: 'MLS Apartements Dev',
      email: 'dev@mlsapartements.com',
      avatar: '/avatars/shadcn.jpg',
    },
    isLoading: false,
    isAuthenticated,
  }
}
