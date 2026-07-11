import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type EmployeeRecord } from '../data/companies'
import {
  AUTH_METHOD_LABELS,
  type AuthMethod,
  type AuthUser,
} from '../data/auth-users'
import { type PasswordPolicyVersion } from '../data/auth-config'
import { type AuditEventDraft } from '../hooks/use-auth-audit'
import {
  DEMO_MFA_CODE,
  DEMO_PASSWORD,
  type LoginSessionStore,
} from '../hooks/use-login-session'
import { PasswordResetDialog } from './password-reset-dialog'
import { SessionPanel } from './session-panel'

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

const SSO_METHODS: AuthMethod[] = [
  'saml',
  'active-directory',
  'office365',
  'google',
]

interface SignInTabProps {
  users: AuthUser[]
  employees: EmployeeRecord[]
  /** Methods currently enabled in configuration — disabled ones are hidden (AUTH-19). */
  enabledMethods: AuthMethod[]
  sessionStore: LoginSessionStore
  policy: PasswordPolicyVersion
  logEvent: (draft: AuditEventDraft) => void
  /** Completed self-service reset — refreshes the credential + clears lockout. */
  onPasswordReset: (userId: string) => void
}

/**
 * Metadata-driven login screen simulator (AUTH-01/02/11/18/19 + BRD 6.12.5).
 * Renders only the enabled authentication methods; verified credentials pass
 * through the MFA enrollment/challenge step when the user's company requires
 * it, and a successful sign-in shows the active session with company
 * switcher, per-company roles and employee context.
 */
export function SignInTab({
  users,
  employees,
  enabledMethods,
  sessionStore,
  policy,
  logEvent,
  onPasswordReset,
}: SignInTabProps) {
  const {
    session,
    sessionUser,
    mfaPending,
    mfaPendingUser,
    loginWithPassword,
    loginWithSso,
    submitMfaCode,
    cancelMfa,
    switchCompany,
    logout,
  } = sessionStore

  const [resetOpen, setResetOpen] = useState(false)
  const [ssoIdentity, setSsoIdentity] = useState<Record<string, string>>({})
  const [mfaCode, setMfaCode] = useState('')

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const passwordEnabled = enabledMethods.includes('password')
  const enabledSso = SSO_METHODS.filter((m) => enabledMethods.includes(m))

  const handleLogin = (values: LoginValues) => {
    if (loginWithPassword(values.email, values.password)) {
      form.reset()
    } else {
      form.resetField('password')
    }
  }

  const ssoUsersFor = (method: AuthMethod) =>
    users.filter((u) => u.authMethod === method && u.status !== 'suspended')

  const runSso = (method: AuthMethod, providerAccepts: boolean) => {
    const user = users.find((u) => u.id === ssoIdentity[method])
    if (!user) return
    if (loginWithSso(user, method, providerAccepts)) {
      setSsoIdentity((prev) => ({ ...prev, [method]: '' }))
    }
  }

  if (session && sessionUser) {
    return (
      <SessionPanel
        session={session}
        user={sessionUser}
        employees={employees}
        onSwitchCompany={switchCompany}
        onLogout={logout}
      />
    )
  }

  // Credentials verified but the second factor is still owed — no session
  // exists until the enrollment/challenge below passes (BRD 6.12.5).
  if (mfaPending && mfaPendingUser) {
    const enrolling = mfaPending.mode === 'enroll'
    return (
      <div className='max-w-[520px] rounded-[6px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            {enrolling
              ? 'Set up two-factor authentication'
              : 'Two-factor verification'}
          </h3>
          <Badge variant='pending'>
            {AUTH_METHOD_LABELS[mfaPending.method]}
          </Badge>
        </div>
        <p className='text-neutral-1900 text-xs'>
          {enrolling
            ? `${mfaPendingUser.name}, one of your companies requires MFA. Add the setup key to an authenticator app, then enter the 6-digit code it shows to finish enrollment.`
            : `Welcome back, ${mfaPendingUser.name}. Enter the 6-digit code from your enrolled authenticator to finish signing in.`}
        </p>
        {enrolling && (
          <div className='mt-3 rounded border border-gray-100 p-2.5 text-center'>
            <p className='text-neutral-1000 text-xs'>
              Authenticator setup key (mock TOTP secret)
            </p>
            <p className='text-neutral-1600 font-mono text-sm font-medium tracking-widest'>
              SHRM-{mfaPendingUser.id.toUpperCase()}-TOTP
            </p>
          </div>
        )}
        <div className='mt-3 flex items-center gap-2'>
          <Input
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
            inputMode='numeric'
            maxLength={6}
            placeholder='6-digit code'
            className='h-7 w-[140px] text-xs'
            aria-label='One-time code'
          />
          <Button
            size='sm'
            className='h-7 px-3 text-xs'
            disabled={mfaCode.trim().length !== 6}
            onClick={() => {
              submitMfaCode(mfaCode)
              setMfaCode('')
            }}
          >
            {enrolling ? 'Verify & enroll' : 'Verify code'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='h-7 px-2 text-xs'
            onClick={() => {
              cancelMfa()
              setMfaCode('')
            }}
          >
            Cancel
          </Button>
        </div>
        <p className='text-neutral-1000 mt-3 text-xs'>
          Demo: the mock authenticator always shows{' '}
          <span className='font-medium'>{DEMO_MFA_CODE}</span>. Wrong codes are
          rejected and audited; no session exists until the challenge passes.
        </p>
      </div>
    )
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Sign in to SatelliteHR
          </h3>
          <Badge variant='pending'>
            {enabledMethods.length} method{enabledMethods.length === 1 ? '' : 's'} enabled
          </Badge>
        </div>

        {passwordEnabled ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className='space-y-3'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='e.g. name@company.example'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='••••••••••••'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex items-center justify-between'>
                <Button
                  type='button'
                  variant='link'
                  className='h-auto p-0 text-xs'
                  onClick={() => setResetOpen(true)}
                >
                  Forgot password?
                </Button>
                <Button type='submit' size='sm' className='h-7 px-3 text-xs'>
                  Sign in
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <p className='text-neutral-1000 text-xs'>
            Email/Password sign-in is disabled for this organization — it is
            not offered on the login screen. Use an enabled provider instead.
          </p>
        )}

        <p className='text-neutral-1000 mt-3 text-xs'>
          Demo: local accounts (e.g. priya.raman@northwind.example) accept the
          password <span className='font-medium'>{DEMO_PASSWORD}</span>. A
          wrong email or password returns the same generic error — the failing
          field is never disclosed, and every attempt lands in the audit log.
          After {policy.lockoutThreshold} consecutive failures the account is
          locked out (policy v{policy.version}) until an administrator unlocks
          it or a password reset completes.
        </p>
      </div>

      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-3 text-sm font-medium'>
          Enterprise single sign-on
        </h3>
        {enabledSso.length === 0 && (
          <p className='text-neutral-1000 text-xs'>
            No SSO providers are enabled. A Platform Admin can enable SAML,
            Active Directory, Office 365 or Google Apps under Configuration.
          </p>
        )}
        <div className='space-y-3'>
          {enabledSso.map((method) => {
            const candidates = ssoUsersFor(method)
            const selected = ssoIdentity[method] ?? ''
            return (
              <div
                key={method}
                className='rounded border border-gray-100 p-2.5'
              >
                <p className='text-neutral-1600 mb-1.5 text-xs font-medium'>
                  Continue with {AUTH_METHOD_LABELS[method]}
                </p>
                <div className='flex flex-wrap items-center gap-2'>
                  <Select
                    value={selected}
                    onValueChange={(v) =>
                      setSsoIdentity((prev) => ({ ...prev, [method]: v }))
                    }
                  >
                    <SelectTrigger
                      variant='secondary'
                      className='h-7 w-[230px] text-xs'
                    >
                      <SelectValue placeholder='Choose federated identity' />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} · {u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 px-2 text-xs'
                    disabled={!selected}
                    onClick={() => runSso(method, true)}
                  >
                    Redirect &amp; sign in
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-destructive h-7 px-2 text-xs'
                    disabled={!selected}
                    onClick={() => runSso(method, false)}
                  >
                    Simulate IdP rejection
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <p className='text-neutral-1000 mt-3 text-xs'>
          A federated identity resolves to its distinct User record: the
          session binds to that User&apos;s per-company roles. Rejections by
          the provider grant no access and are audited.
        </p>
      </div>

      <PasswordResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        users={users}
        policy={policy}
        logEvent={logEvent}
        onResetComplete={onPasswordReset}
      />
    </div>
  )
}
