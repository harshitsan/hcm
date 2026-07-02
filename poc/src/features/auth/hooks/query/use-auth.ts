import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getDealerByEmail,
  login,
  refreshToken,
} from '@/features/auth/services/auth.service'
import type {
  DealerResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UseDealerByEmailOptions,
  UseDealerByEmailReturn,
  UseLoginOptions,
  UseLoginReturn,
} from '@/features/auth/types/auth'

export type {
  DealerResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UseDealerByEmailOptions,
  UseDealerByEmailReturn,
  UseLoginOptions,
  UseLoginReturn,
}

export function useDealerByEmail({
  email,
  enabled = true,
}: UseDealerByEmailOptions): UseDealerByEmailReturn {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dealer-by-email', email],
    queryFn: () => getDealerByEmail(email),
    enabled: enabled && !!email && email.includes('@'),

    retry: false, // Don't retry on 404 errors
  })

  const isNotFound = data === null || (data !== undefined && !data.dealers)

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    isNotFound,
  }
}

export function useLogin({ onSuccess }: UseLoginOptions = {}): UseLoginReturn {
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: login,
    onSuccess,
    onError: (error: unknown) => {
      let errorMessage = 'An error occurred during login'
      try {
        // Handle AxiosError with response data
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response
        ) {
          const responseData = error.response.data
          if (
            responseData &&
            typeof responseData === 'object' &&
            'error' in responseData &&
            typeof responseData.error === 'string'
          ) {
            errorMessage = responseData.error
          } else if (
            responseData &&
            typeof responseData === 'object' &&
            'message' in responseData &&
            typeof responseData.message === 'string'
          ) {
            errorMessage = responseData.message
          }
        }
      } catch (_err) {
        // Final fallback - avoid showing technical error messages
        if (error && typeof error === 'object' && 'message' in error) {
          const msg = String(error.message)
          if (
            !msg.includes('Cannot read properties') &&
            !msg.includes('undefined')
          ) {
            errorMessage = msg
          }
        }
      }

      toast.error(errorMessage)
    },
  })

  return {
    mutate,
    isLoading: isPending,
    isError,
    error: error as Error | null,
  }
}

export interface UseRefreshTokenOptions {
  onSuccess?: (
    data: RefreshTokenResponse,
    variables: RefreshTokenRequest
  ) => void
  onError?: (error: Error) => void
}

export interface UseRefreshTokenReturn {
  mutate: (refreshData: RefreshTokenRequest) => void
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useRefreshToken({
  onSuccess,
  onError,
}: UseRefreshTokenOptions = {}): UseRefreshTokenReturn {
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: refreshToken,
    onSuccess,
    onError: (error: Error) => {
      onError?.(error)
    },
  })

  return {
    mutate,
    isLoading: isPending,
    isError,
    error: error as Error | null,
  }
}
