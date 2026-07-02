import axios from 'axios'
import { authApiClient } from '@/lib/api-client'
import type {
  DealerResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/features/auth/types/auth'

const baseURL = import.meta.env.VITE_API_URL
const apiKey = import.meta.env.VITE_X_API_KEY

/** Isolated client for refresh only: no access token, no interceptors. Prevents refresh loops. */
const refreshOnlyClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey || '',
  },
})

/**
 * Fetch dealer details by email
 * @param email - User email address
 * @returns Dealer information or null if not found (404)
 */
export async function getDealerByEmail(
  email: string
): Promise<DealerResponse | null> {
  try {
    const encodedEmail = encodeURIComponent(email)
    const response = await authApiClient.get<DealerResponse>(
      `/internal/readywire-bulk/dealerid?email=${encodedEmail}`
    )
    return response.data
  } catch (error: unknown) {
    // Handle 404 errors - return null to indicate no dealer found
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Login user with credentials
 * @param credentials - Login credentials
 * @returns Login response with tokens and user data
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const apiKey = import.meta.env.VITE_X_API_KEY
  const response = await authApiClient.post<LoginResponse>(
    '/internal/readywire-auth/login',
    credentials,
    {
      headers: {
        'x-api-key': apiKey || '',
      },
    }
  )
  return response.data
}

/**
 * Refresh access token using refresh token.
 * Uses isolated client: does NOT attach access token, does NOT trigger 401 interceptors.
 * @param refreshData - Refresh token data
 * @returns Refresh token response with new tokens
 */
export async function refreshToken(
  refreshData: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  const response = await refreshOnlyClient.post<RefreshTokenResponse>(
    '/internal/readywire-auth/refresh-token',
    refreshData
  )
  return response.data
}
