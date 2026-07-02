import { createFileRoute } from '@tanstack/react-router'
import { getAccessToken, getIdToken, saveTokens } from '@/utils/token-storage'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    // POC: no backend — seed mock tokens instead of redirecting to sign-in.
    if (!getAccessToken() || !getIdToken()) {
      saveTokens(
        {
          access_token: 'poc-access-token',
          id_token: 'poc-id-token',
          refresh_token: 'poc-refresh-token',
          token_type: 'Bearer',
          expires_in: 60 * 60 * 24 * 365,
          access_token_expiry: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 365
          ).toISOString(),
        },
        true
      )
    }
  },
  component: AuthenticatedLayout,
})
