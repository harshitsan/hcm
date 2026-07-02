import { apiClient } from '@/lib/api-client'

export interface UserLoginDetailPayload {
  //org_user_id: string | null
  login_datetime: string | null
  logout_datetime: string | null
  device_information?: string | null
  source?: string | null
}

export const recordUserLoginDetail = async (
  payload: UserLoginDetailPayload,
  headers?: { dealer_id?: string; employee_id?: string }
) => {
  await apiClient.post('/user-login-detail', payload, {
    headers: {
      ...(headers?.dealer_id ? { dealer_id: headers.dealer_id } : {}),
      ...(headers?.employee_id ? { employee_id: headers.employee_id } : {}),
    },
  })
}
