import type { UserInfo } from '@/features/auth/types/auth'
import { getIdToken } from './token-storage'

/**
 * Decode JWT token without verification
 * Note: This only decodes the token, it does not verify the signature
 */
export function decodeJWT(token: string): UserInfo | null {
  try {
    // JWT has three parts: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]

    // Base64 URL decode
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)

    // Decode from base64
    const decoded = atob(padded)

    // Parse JSON
    const userInfo = JSON.parse(decoded) as UserInfo

    // Normalize dealer_id: use dealer_id if present, otherwise use custom:dealer_id
    // This ensures dealer_id is always available regardless of which field is present in the token
    if (!userInfo.dealer_id && userInfo['custom:dealer_id']) {
      userInfo.dealer_id = userInfo['custom:dealer_id']
    } else if (!userInfo['custom:dealer_id'] && userInfo.dealer_id) {
      userInfo['custom:dealer_id'] = userInfo.dealer_id
    }

    // Normalize employee_id: use employee_id if present, otherwise use custom:employee_id
    // This ensures employee_id is always available for payloads (e.g. company_user_group API)
    if (!userInfo.employee_id && userInfo['custom:employee_id']) {
      userInfo.employee_id = userInfo['custom:employee_id']
    } else if (!userInfo['custom:employee_id'] && userInfo.employee_id) {
      userInfo['custom:employee_id'] = userInfo.employee_id
    }

    return userInfo
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to decode JWT token:', error)
    return null
  }
}

/**
 * Get user info from ID token stored in storage (checks both localStorage and sessionStorage)
 */
export function getUserInfoFromToken(): UserInfo | null {
  try {
    const idToken = getIdToken()
    if (!idToken) return null

    return decodeJWT(idToken)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get user info from token:', error)
    return null
  }
}
