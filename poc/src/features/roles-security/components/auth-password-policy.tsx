import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { HOME_COMPANY_ID, companyName } from '../data/directory'
import { type PasswordPolicy } from '../data/security-config'
import { type SecurityConfigStore } from '../hooks/use-security-config'
import { SecurityBadge } from './badges'

const policySchema = z
  .object({
    expiryDays: z
      .number()
      .int()
      .min(0, 'Use 0 for no expiry')
      .max(730, 'Max 730 days'),
    maxWrongAttempts: z.number().int().min(1).max(20),
    reactivationHours: z.number().int().min(1).max(168),
    historyDepth: z
      .number()
      .int()
      .min(0, 'Use 0 for no history restriction')
      .max(24),
    minLength: z.number().int().min(4).max(128),
    maxLength: z.number().int().min(4).max(128),
    requireUpper: z.boolean(),
    requireLower: z.boolean(),
    requireNumber: z.boolean(),
    requireSpecial: z.boolean(),
  })
  .refine((v) => v.minLength <= v.maxLength, {
    message: 'Minimum length cannot exceed maximum length',
    path: ['maxLength'],
  })

type PolicyValues = z.infer<typeof policySchema>

/** Validation outcomes for the live password tester (RSEC-27 … RSEC-29). */
function testPassword(policy: PasswordPolicy, pwd: string): string[] {
  const failures: string[] = []
  if (pwd.length < policy.minLength)
    failures.push(`At least ${policy.minLength} characters required`)
  if (pwd.length > policy.maxLength)
    failures.push(`At most ${policy.maxLength} characters allowed`)
  if (policy.requireUpper && !/[A-Z]/.test(pwd))
    failures.push('An upper-case letter is required')
  if (policy.requireLower && !/[a-z]/.test(pwd))
    failures.push('A lower-case letter is required')
  if (policy.requireNumber && !/[0-9]/.test(pwd))
    failures.push('A number is required')
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(pwd))
    failures.push('A special character is required')
  if (policy.historyDepth > 0 && pwd.toLowerCase() === 'aurora@2025')
    failures.push(
      `Matches one of your last ${policy.historyDepth} passwords — reuse is rejected`
    )
  return failures
}

const numberFields = [
  { name: 'expiryDays', label: 'Days for password to expire (0 = never)' },
  { name: 'maxWrongAttempts', label: 'Max wrong attempts before lockout' },
  { name: 'reactivationHours', label: 'Hours until a locked account reactivates' },
  { name: 'historyDepth', label: 'Previous passwords that cannot repeat (0 = none)' },
  { name: 'minLength', label: 'Minimum password length' },
  { name: 'maxLength', label: 'Maximum password length' },
] as const

const complexityFields = [
  { name: 'requireUpper', label: 'Upper case (A–Z)' },
  { name: 'requireLower', label: 'Lower case (a–z)' },
  { name: 'requireNumber', label: 'Numbers (0–9)' },
  { name: 'requireSpecial', label: 'Special characters (!@#…)' },
] as const

/**
 * Password policy screen (RSEC-24 … RSEC-29): expiry interval, lockout
 * threshold, auto-reactivation cooldown, history depth, length bounds and
 * complexity categories — company-scoped, applied going forward.
 */
export function AuthPasswordPolicy({
  store,
  onNext,
}: {
  store: SecurityConfigStore
  /** PWD-07 / AD-07: optional "Save & Next" flow — advance to the next step. */
  onNext?: () => void
}) {
  const security = store.securityFor(HOME_COMPANY_ID)
  const [testValue, setTestValue] = useState('')

  const form = useForm<PolicyValues>({
    resolver: zodResolver(policySchema),
    defaultValues: security?.passwordPolicy,
  })

  if (!security) return null

  /** PWD-07: discard unsaved edits — revert the form to the saved policy. */
  const cancelEdits = () => {
    form.reset(security.passwordPolicy)
    toast('Password policy edits discarded — reverted to the saved policy')
  }

  /** PWD-07: validate + save, and re-baseline the form so Cancel disables. */
  const saveValues = (values: PolicyValues) => {
    store.savePasswordPolicy(HOME_COMPANY_ID, values)
    form.reset(values)
  }

  /** PWD-07: validate + save, then continue to the next step. */
  const saveAndNext = form.handleSubmit((values) => {
    saveValues(values)
    onNext?.()
  })
  const failures = testValue
    ? testPassword(security.passwordPolicy, testValue)
    : null

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
        Password policy — {companyName(HOME_COMPANY_ID)}
        <span className='text-neutral-1000 ml-2 text-xs'>
          applies going forward to this company&apos;s users only
        </span>
      </h3>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            store.savePasswordPolicy(HOME_COMPANY_ID, values)
          )}
          className='space-y-4'
        >
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {numberFields.map((f) => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <div>
            <p className='text-neutral-1600 mb-2 text-sm font-medium'>
              Password criteria — required character categories
            </p>
            <div className='grid grid-cols-2 gap-2 rounded-[6px] border border-gray-200 p-3 lg:grid-cols-4'>
              {complexityFields.map((f) => (
                <FormField
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field }) => (
                    <label className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        variant='blue'
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                      />
                      {f.label}
                    </label>
                  )}
                />
              ))}
            </div>
            <p className='text-neutral-1000 pt-1 text-xs'>
              With all toggles off, only length and history rules apply.
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button type='submit' className='h-7'>
              Save policy
            </Button>
            {onNext && (
              <Button
                type='button'
                variant='outline'
                className='h-7'
                onClick={() => void saveAndNext()}
              >
                Save &amp; Next — Active Directory
              </Button>
            )}
            <Button
              type='button'
              variant='ghost'
              className='h-7'
              onClick={cancelEdits}
              disabled={!form.formState.isDirty}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      <div className='mt-4 rounded-[6px] border border-gray-200 p-3'>
        <p className='text-neutral-1600 mb-2 text-sm font-medium'>
          Test a password against the saved policy
        </p>
        <div className='flex items-center gap-3'>
          <Input
            placeholder='Type a candidate password'
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            className='w-72'
          />
          {failures &&
            (failures.length === 0 ? (
              <SecurityBadge value='Allowed' />
            ) : (
              <SecurityBadge value='Rejected' />
            ))}
        </div>
        {failures && failures.length > 0 && (
          <ul className='text-red-1400 mt-2 list-disc pl-5 text-xs'>
            {failures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        <p className='text-neutral-1000 pt-2 text-xs'>
          Hint: “aurora@2025” demonstrates the password-history rejection.
          Lockout behavior: after {security.passwordPolicy.maxWrongAttempts}{' '}
          consecutive failures the account locks and auto-reactivates after{' '}
          {security.passwordPolicy.reactivationHours} hours; a successful
          sign-in resets the counter.
        </p>
      </div>
    </div>
  )
}
