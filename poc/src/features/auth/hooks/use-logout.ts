import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { clearTokens } from '@/utils/token-storage'

/**
 * Hook for logout functionality
 */
export function useLogout() {
  const navigate = useNavigate()

  const logout = () => {
    try {
      // Clear tokens from storage
      clearTokens()

      // Show success message
      toast.success('Logged out successfully')

      // Redirect to login page
      navigate({ to: '/sign-in', replace: true })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout error:', error)
      toast.error('Failed to logout. Please try again.')
    }
  }

  return { logout }
}
