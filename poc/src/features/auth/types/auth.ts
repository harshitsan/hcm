export interface DealerResponse {
  user_id: string
  dealers: {
    id: string
    name: string
  } | null
}

export interface LoginRequest {
  username: string
  password: string
  dealer_id: string
}

export interface LoginResponse {
  message: string
  tokens: {
    access_token: string
    id_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    access_token_expiry: string
    refresh_token_expiry: string
  }
  username: string
  employee_id: string
}

export interface UseDealerByEmailOptions {
  email: string
  enabled?: boolean
}

export interface UseDealerByEmailReturn {
  data: DealerResponse | null | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  isNotFound: boolean // Flag to indicate 404 error
}

export interface UseLoginOptions {
  onSuccess?: (data: LoginResponse, variables: LoginRequest) => void
  onError?: (error: Error) => void
}

export interface UseLoginReturn {
  mutate: (credentials: LoginRequest) => void
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export interface RefreshTokenRequest {
  refresh_token: string
  username: string
  dealer_id: string
}

export interface RefreshTokenResponse {
  message: string
  tokens: {
    access_token: string
    id_token: string
    /** Optional on refresh (rotation); keep existing if not returned */
    refresh_token?: string
    token_type: string
    expires_in: number
    access_token_expiry: string
  }
  username: string
}

export interface UserInfo {
  username: string
  email: string
  avatar: string
  // Optional Cognito claims, normalized by decodeJWT (both the plain and
  // `custom:` prefixed variants may appear in the token).
  dealer_id?: string
  'custom:dealer_id'?: string
  employee_id?: string
  'custom:employee_id'?: string
}
