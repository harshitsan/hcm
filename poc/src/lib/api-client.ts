import axios from 'axios'
import { API_ERROR_TOAST_MESSAGE } from '@/config/ui-messages'
// import StackTrace from 'stacktrace-js'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  saveTokens,
  clearTokens,
  getRememberMePreference,
} from '@/utils/token-storage'
import { refreshToken } from '@/features/auth/services/auth.service'

declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime?: number
      callStack?: string
    }
    _retry?: boolean
    _skipTokenRefresh?: boolean
  }
}

/** True if refresh failed due to expired/invalid refresh token (logout only in these cases). */
function isRefreshTokenFailure(err: unknown): boolean {
  if (!err || typeof err !== 'object' || !('response' in err)) return false
  const res = (err as { response?: { status?: number; data?: unknown } })
    .response
  if (!res) return false
  if (res.status === 401) return true
  if (res.status === 400 && res.data && typeof res.data === 'object') {
    const body = res.data as Record<string, unknown>
    const error = body.error ?? body.error_description ?? body.code
    const str = typeof error === 'string' ? error : String(error ?? '')
    return /invalid_grant|invalid_token|expired|unauthorized/i.test(str)
  }
  return false
}

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('Missing environment variables')
}

export const authApiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth API client
authApiClient.interceptors.request.use(
  (config) => {
    // Add access token to requests if available
    const accessToken = getAccessToken()
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error)
  }
)

// Flag to prevent multiple simultaneous refresh attempts
// let isRefreshing = false
// let failedQueue: Array<{
//   resolve: (value?: unknown) => void
//   reject: (reason?: unknown) => void
// }> = []

// const processQueue = (error: Error | null, token: string | null = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error)
//     } else {
//       prom.resolve(token)
//     }
//   })
//   failedQueue = []
// }

// Response interceptor for auth API client
authApiClient.interceptors.response.use(
  (response) => {
    // Add any response modifications here
    return response
  },
  async (error) => {
    //   const originalRequest = error.config

    //   // Handle 401 errors with token refresh
    //   if (error.response?.status === 401 && !originalRequest._retry) {
    //     if (isRefreshing) {
    //       // If already refreshing, queue this request
    //       return new Promise((resolve, reject) => {
    //         failedQueue.push({ resolve, reject })
    //       })
    //         .then((token) => {
    //           originalRequest.headers.Authorization = `Bearer ${token}`
    //           return authApiClient(originalRequest)
    //         })
    //         .catch((err) => {
    //           return Promise.reject(err)
    //         })
    //     }

    //     originalRequest._retry = true
    //     isRefreshing = true

    //     const refreshTokenValue = getRefreshToken()
    //     const user = getUser()

    //     if (!refreshTokenValue || !user) {
    //       clearTokens()
    //       processQueue(new Error('No refresh token available'), null)
    //       isRefreshing = false
    //       // Redirect to login
    //       window.location.href = '/login'
    //       return Promise.reject(error)
    //     }

    //     try {
    //       // Extract dealer_id from username (format: email#dealer_id)
    //       const dealerId = user.dealer_id || user.username.split('#')[1] || ''
    //       const username = user.username

    //       const response = await refreshToken({
    //         refresh_token: refreshTokenValue,
    //         username,
    //         dealer_id: dealerId,
    //       })

    //       // Save new tokens using the same storage preference
    //       const rememberMe = getRememberMePreference()
    //       saveTokens(response.tokens, rememberMe)

    //       // Update authorization header
    //       const newAccessToken = response.tokens.access_token
    //       originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

    //       // Process queued requests
    //       processQueue(null, newAccessToken)
    //       isRefreshing = false

    //       // Retry original request
    //       return authApiClient(originalRequest)
    //     } catch (refreshError) {
    //       // Refresh failed, clear tokens and redirect to login
    //       clearTokens()
    //       processQueue(refreshError as Error, null)
    //       isRefreshing = false
    //       window.location.href = '/login'
    //       return Promise.reject(refreshError)
    //     }
    //   }

    //   // Handle other error cases
    //   if (error.response?.status >= 500) {
    //     // Handle server errors - you might want to show a toast notification
    //   }

    // Explicitly reject the error to ensure proper error propagation
    return Promise.reject(error)
  }
)

export const apiClient = axios.create({
  baseURL: baseURL + '/internal/dashboard-api/lms-dashboard',
  headers: {
    'Content-Type': 'application/json',
    dealer_id: getUser()?.dealer_id,
    employee_id: getUser()?.employee_id,
  },
  // withCredentials: true,
})

// Request interceptor: attach access token only. Do not refresh here; refresh only on 401.
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken()
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    const startTime = Date.now()
    config.metadata = { startTime }
    return config
  },
  (error) => {
    logger.error({
      message: error?.message || 'API request error',
      error,
      category: 'api',
      extra: { module: 'unknown', timestamp: new Date().toISOString() },
    })
    return Promise.reject(error)
  }
)

// Single refresh at a time: queue requests while refresh is in progress
let isRefreshing = false
const refreshQueue: Array<{
  resolve: (accessToken: string) => void
  reject: (err: unknown) => void
}> = []

function processRefreshQueue(err: unknown, accessToken: string | null = null) {
  refreshQueue.forEach((prom) => {
    if (err) prom.reject(err)
    else if (accessToken) prom.resolve(accessToken)
    else prom.reject(new Error('No access token after refresh'))
  })
  refreshQueue.length = 0
}

// Response interceptor: refresh only on 401; retry original once; logout only on refresh token failure
apiClient.interceptors.response.use(
  (response) => {
    const startTime = response.config.metadata?.startTime
    const responseTime = startTime ? Date.now() - startTime : undefined
    logger.info({
      message: 'API request successful',
      category: 'api',
      extra: {
        endpoint: response.config.url,
        method: response.config.method?.toUpperCase(),
        statusCode: response.status,
        responseTime: responseTime ? `${responseTime}ms` : 'unknown',
        dataSummary: response.data?.data
          ? { success: response.data.success, hasData: !!response.data.data }
          : undefined,
        timestamp: new Date().toISOString(),
      },
    })
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const startTime = originalRequest?.metadata?.startTime
    const responseTime = startTime ? Date.now() - startTime : undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const refreshTokenValue = getRefreshToken()
      const user = getUser()

      if (!refreshTokenValue || !user) {
        logger.warn({
          message: 'Forced logout: no refresh token or user',
          category: 'api',
          extra: { reason: 'missing_refresh_or_user' },
        })
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (accessToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              originalRequest._retry = true
              apiClient(originalRequest).then(resolve).catch(reject)
            },
            reject,
          })
        })
      }

      isRefreshing = true
      logger.info({ message: 'Refresh start', category: 'api' })

      try {
        const dealerId = user.dealer_id || user.username.split('#')[1] || ''
        const response = await refreshToken({
          refresh_token: refreshTokenValue,
          username: user.username,
          dealer_id: dealerId,
        })
        const rememberMe = getRememberMePreference()
        saveTokens(response.tokens, rememberMe)
        const newAccessToken = response.tokens.access_token
        processRefreshQueue(null, newAccessToken)
        isRefreshing = false
        logger.info({ message: 'Refresh success', category: 'api' })

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        originalRequest._retry = true
        return apiClient(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        processRefreshQueue(refreshError, null)
        const shouldLogout = isRefreshTokenFailure(refreshError)
        logger.warn({
          message: 'Refresh failure',
          category: 'api',
          error: refreshError,
          extra: {
            reason: shouldLogout
              ? 'refresh_token_expired_or_invalid_grant'
              : 'network_or_server_error',
          },
        })
        if (shouldLogout) {
          logger.warn({
            message: 'Forced logout: refresh token expired or invalid_grant',
            category: 'api',
            extra: { reason: 'refresh_failed' },
          })
          clearTokens()
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status >= 500) {
      logger.error({
        message: error?.message || 'API server error',
        category: 'api',
        error,
        extra: {
          endpoint: originalRequest?.url,
          method: originalRequest?.method?.toUpperCase(),
          statusCode: error.response?.status,
          responseTime: responseTime ? `${responseTime}ms` : undefined,
          timestamp: new Date().toISOString(),
        },
      })
    } else {
      logger.error({
        message: error?.message || 'API request failed',
        category: 'api',
        error,
        extra: {
          endpoint: originalRequest?.url,
          method: originalRequest?.method?.toUpperCase(),
          statusCode: error.response?.status,
          responseTime: responseTime ? `${responseTime}ms` : undefined,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Show technical error toast (skip 401 to avoid toast before login redirect)
    if (error.response?.status !== 401) {
      toast.error(API_ERROR_TOAST_MESSAGE, {
        duration: 3500,
        style: {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          color: '#b91c1c',
        },
      })
    }

    return Promise.reject(error)
  }
)

export const loggingApiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging API
loggingApiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    // Silently fail - don't log logging errors to avoid infinite loops
    return Promise.reject(error)
  }
)

// Response interceptor for logging API
loggingApiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Silently fail - don't log logging errors to avoid infinite loops
    return Promise.reject(error)
  }
)
