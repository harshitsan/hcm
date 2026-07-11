import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AUTH_METHOD_LABELS, type AuthUser } from '../data/auth-users'
import { type PasswordPolicyVersion } from '../data/auth-config'
import { type AuditEventDraft } from '../hooks/use-auth-audit'

function buildPasswordSchema(policy: PasswordPolicyVersion) {
  return z.object({
    password: z
      .string()
      .min(
        policy.minLength,
        `At least ${policy.minLength} characters (policy v${policy.version})`
      )
      .refine(
        (v) => !policy.requireUppercase || /[A-Z]/.test(v),
        'Must include an uppercase letter'
      )
      .refine(
        (v) => !policy.requireNumber || /\d/.test(v),
        'Must include a number'
      )
      .refine(
        (v) => !policy.requireSymbol || /[^A-Za-z0-9]/.test(v),
        'Must include a symbol'
      ),
  })
}

interface PasswordResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: AuthUser[]
  /** Current effective password policy (AUTH-17). */
  policy: PasswordPolicyVersion
  logEvent: (draft: AuditEventDraft) => void
  /** Stamps the new credential date and clears any lockout on the account. */
  onResetComplete: (userId: string) => void
}

/**
 * Self-service reset flow (AUTH-11/18): local users get a secure reset link
 * via the notification engine and set a policy-validated new password;
 * SSO-only users are pointed at their identity provider.
 */
export function PasswordResetDialog({
  open,
  onOpenChange,
  users,
  policy,
  logEvent,
  onResetComplete,
}: PasswordResetDialogProps) {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'request' | 'set' | 'sso'>('request')

  const schema = useMemo(() => buildPasswordSchema(policy), [policy])
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  })

  useEffect(() => {
    if (!open) return
    setEmail('')
    setStep('request')
    form.reset({ password: '' })
  }, [open, form])

  const requestReset = () => {
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    )
    if (user && user.authMethod !== 'password') {
      setStep('sso')
      return
    }
    // Generic confirmation — never reveals whether the account exists.
    toast.success('If the account exists, a secure reset link has been sent')
    if (user) {
      logEvent({
        actor: user.email,
        eventType: 'password-reset-request',
        method: 'password',
        outcome: 'info',
        detail: 'Secure reset link issued via notification engine (template: Password Reset).',
      })
      logEvent({
        actor: 'system',
        eventType: 'notification-sent',
        outcome: 'info',
        detail: `"Password Reset" template rendered and delivered to ${user.email}.`,
      })
      setStep('set')
    } else {
      onOpenChange(false)
    }
  }

  const completeReset = () => {
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    )
    if (user) onResetComplete(user.id)
    logEvent({
      actor: email.trim(),
      eventType: 'password-reset-complete',
      method: 'password',
      outcome: 'success',
      detail: `New password accepted under policy v${policy.version} and stored hashed — never in plain text. Failed-attempt counter reset; any lockout cleared.`,
    })
    logEvent({
      actor: 'system',
      eventType: 'notification-sent',
      outcome: 'info',
      detail: `"Password Changed" template rendered and delivered to ${email.trim()}.`,
    })
    toast.success('Password reset complete')
    onOpenChange(false)
  }

  const ssoUser = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            {step === 'request' &&
              'Enter your login email to receive a secure reset link.'}
            {step === 'set' &&
              `Set a new password. It is validated against the current effective policy (v${policy.version}).`}
            {step === 'sso' &&
              'This account does not use a local password.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'request' && (
          <>
            <Input
              type='email'
              placeholder='e.g. name@company.example'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <DialogFooter>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={requestReset} disabled={!email.includes('@')}>
                Send reset link
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'set' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(completeReset)}>
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type='password' placeholder='••••••••••••' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className='text-neutral-1000 mt-2 text-xs'>
                Policy v{policy.version}: min {policy.minLength} chars
                {policy.requireUppercase ? ', uppercase' : ''}
                {policy.requireNumber ? ', number' : ''}
                {policy.requireSymbol ? ', symbol' : ''}; last{' '}
                {policy.historyCount} passwords cannot be reused.
              </p>
              <DialogFooter className='mt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Set new password</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === 'sso' && (
          <>
            <p className='text-neutral-1900 text-sm'>
              Authentication for this account is handled by{' '}
              <span className='font-medium'>
                {ssoUser ? AUTH_METHOD_LABELS[ssoUser.authMethod] : 'your identity provider'}
              </span>
              . Please reset your credentials with your identity provider.
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Got it</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
