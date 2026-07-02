import { useNavigate } from '@tanstack/react-router'
import { clearTokens } from '@/utils/token-storage'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { recordUserLoginDetail } from '@/features/auth/services/login-detail.service'

interface SignOutDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      const cache = localStorage.getItem('userLoginDetailMeta')
      const cachedMeta = cache
        ? (JSON.parse(cache) as {
            orgUserId?: string | null
            dealerId?: string | null
            employeeId?: string | null
          })
        : null

      const now = new Date().toISOString()
      const deviceInfo = `${navigator.platform}, ${navigator.userAgent}`

      await recordUserLoginDetail(
        {
          //org_user_id: cachedMeta?.orgUserId || null,
          login_datetime: null,
          logout_datetime: now,
          device_information: deviceInfo,
          source: 'web',
        },
        {
          dealer_id: cachedMeta?.dealerId || undefined,
          employee_id: cachedMeta?.employeeId || undefined,
        }
      )
    } catch (_err) {
      // eslint-disable-next-line no-console
      console.error(_err)
    }

    // Clear tokens from storage
    clearTokens()

    // Preserve current location for redirect after sign-in
    const currentPath = location.href
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
