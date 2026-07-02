import type {
  LoginResponse,
  RefreshTokenResponse,
} from '@/features/auth/types/auth'

const TOKEN_STORAGE_KEY = 'auth_tokens'
const USER_STORAGE_KEY = 'auth_user'
const REMEMBER_ME_KEY = 'remember_me'

export interface StoredTokens {
  access_token: string
  id_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  access_token_expiry: string
  refresh_token_expiry?: string
}

export interface StoredUser {
  username: string
  employee_id?: string
  dealer_id?: string
  org_user_id?: string
}

/**
 * Get the storage to use based on rememberMe preference
 */
function getStorage(useLocalStorage: boolean): Storage {
  return useLocalStorage ? localStorage : sessionStorage
}

/**
 * Get storage that contains tokens (checks both localStorage and sessionStorage)
 */
function getStorageWithTokens(): Storage | null {
  if (localStorage.getItem(TOKEN_STORAGE_KEY)) {
    return localStorage
  }
  if (sessionStorage.getItem(TOKEN_STORAGE_KEY)) {
    return sessionStorage
  }
  return null
}

/**
 * Save tokens to storage (localStorage or sessionStorage based on rememberMe).
 * Refresh token rotation: never overwrite refresh_token with undefined; keep existing if new one not returned.
 */
export function saveTokens(
  tokens: LoginResponse['tokens'] | RefreshTokenResponse['tokens'],
  rememberMe: boolean = true
): void {
  try {
    const existing = getTokens()
    const refreshTokenToStore =
      tokens.refresh_token !== undefined && tokens.refresh_token !== ''
        ? tokens.refresh_token
        : (existing?.refresh_token ?? '')

    // Clear tokens from both storages first to avoid conflicts
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)

    const tokensToStore: StoredTokens = {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: refreshTokenToStore,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      access_token_expiry: tokens.access_token_expiry,
      refresh_token_expiry:
        'refresh_token_expiry' in tokens
          ? tokens.refresh_token_expiry
          : undefined,
    }

    const storage = getStorage(rememberMe)
    storage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokensToStore))

    // Store rememberMe preference in localStorage so we can retrieve it later
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(rememberMe))

    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new Event('auth-token-updated'))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save tokens:', error)
    throw error
  }
}

/**
 * Get tokens from storage (checks both localStorage and sessionStorage)
 */
export function getTokens(): StoredTokens | null {
  try {
    const storage = getStorageWithTokens()
    if (!storage) return null

    const stored = storage.getItem(TOKEN_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as StoredTokens
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get tokens:', error)
    return null
  }
}

/**
 * Remove tokens from both storages
 */
export function clearTokens(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(REMEMBER_ME_KEY)
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(USER_STORAGE_KEY)
    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new Event('auth-token-updated'))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear tokens:', error)
  }
}

/**
 * Save user info to storage (localStorage or sessionStorage based on rememberMe)
 */
export function saveUser(user: StoredUser, rememberMe: boolean = true): void {
  try {
    // Clear user from both storages first to avoid conflicts
    localStorage.removeItem(USER_STORAGE_KEY)
    sessionStorage.removeItem(USER_STORAGE_KEY)

    const storage = getStorage(rememberMe)
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save user:', error)
  }
}

/**
 * Get user info from storage (checks both localStorage and sessionStorage)
 */
export function getUser(): StoredUser | null {
  try {
    const storage = getStorageWithTokens()
    if (!storage) return null

    const stored = storage.getItem(USER_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as StoredUser
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get user:', error)
    return null
  }
}

/**
 * Get rememberMe preference from storage
 */
export function getRememberMePreference(): boolean {
  try {
    const stored = localStorage.getItem(REMEMBER_ME_KEY)
    if (stored === null) {
      // Default to true if not set (backward compatibility)
      return true
    }
    return JSON.parse(stored) as boolean
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get rememberMe preference:', error)
    return true // Default to localStorage
  }
}

/** Clock skew buffer: consider token expired this many ms before actual expiry (2–5 min). */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000

/**
 * Check if access token is expired or will expire soon.
 * Uses expiry from stored token (API-provided), with buffer for clock skew. No hardcoded time.
 */
export function isTokenExpired(): boolean {
  const tokens = getTokens()
  if (!tokens) return true

  try {
    const expiryDate = new Date(tokens.access_token_expiry)
    const now = new Date()
    return expiryDate.getTime() - now.getTime() < EXPIRY_BUFFER_MS
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to check token expiry:', error)
    return true
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  const tokens = getTokens()
  return tokens?.access_token || null
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  const tokens = getTokens()
  return tokens?.refresh_token || null
}

/**
 * Get ID token
 */
export function getIdToken(): string | null {
  const tokens = getTokens()
  return tokens?.id_token || null
}
