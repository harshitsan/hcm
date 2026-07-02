import { saveTokens, saveUser } from '@/utils/token-storage'

interface UseLoginHandlerOptions {
  redirectTo?: string
}

/**
 * Auth is temporarily disabled.
 *
 * This hook mimics a successful login: it stores placeholder tokens (so the
 * `_authenticated` route guard passes) and redirects to the dashboard. No auth
 * API is called.
 */
export function useLoginHandler(_options: UseLoginHandlerOptions = {}) {
  const login = (credentials?: {
    username?: string
    password?: string
    dealer_id?: string
    rememberMe?: boolean
  }) => {
    const rememberMe = credentials?.rememberMe ?? true

    saveTokens(
      {
        access_token: 'dev-access-token',
        id_token: 'dev-id-token',
        refresh_token: 'dev-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        access_token_expiry: '2099-12-31T23:59:59.000Z',
        refresh_token_expiry: '2099-12-31T23:59:59.000Z',
      },
      rememberMe
    )

    saveUser(
      {
        username: credentials?.username || 'dev@gomagentic.com',
        dealer_id: credentials?.dealer_id,
      },
      rememberMe
    )

    // Redirect to the dashboard
    window.location.href = '/'
  }

  return {
    login,
    isLoading: false,
  }
}
