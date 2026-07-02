import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
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
import { type AuthConfigStore, type PolicyDraft } from '../hooks/use-auth-config'

const policySchema = z.object({
  minLength: z.coerce
    .number<number>()
    .int()
    .min(6, 'Minimum 6')
    .max(64, 'Maximum 64'),
  requireUppercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSymbol: z.boolean(),
  expiryDays: z.coerce
    .number<number>()
    .int()
    .min(30, 'At least 30 days')
    .max(365, 'At most 365 days'),
  historyCount: z.coerce.number<number>().int().min(0).max(24),
  lockoutThreshold: z.coerce
    .number<number>()
    .int()
    .min(3, 'At least 3')
    .max(20, 'At most 20'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
})

type PolicyValues = z.infer<typeof policySchema>

const FLAGS: { name: 'requireUppercase' | 'requireNumber' | 'requireSymbol'; label: string }[] = [
  { name: 'requireUppercase', label: 'Require uppercase' },
  { name: 'requireNumber', label: 'Require number' },
  { name: 'requireSymbol', label: 'Require symbol' },
]

interface PolicyPanelProps {
  config: Pick<AuthConfigStore, 'policyVersions' | 'currentPolicy' | 'savePolicy'>
}

/**
 * Tenant password policy as governed configuration (AUTH-09/17). Saving
 * appends a new effective-dated version; prior versions stay listed below
 * and the authentication logic reads the current effective version.
 */
export function PolicyPanel({ config }: PolicyPanelProps) {
  const { role } = useRole()
  const canEdit = role === 'Company Admin' || role === 'Platform Admin'
  const { currentPolicy, policyVersions, savePolicy } = config

  const form = useForm<PolicyValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      minLength: currentPolicy.minLength,
      requireUppercase: currentPolicy.requireUppercase,
      requireNumber: currentPolicy.requireNumber,
      requireSymbol: currentPolicy.requireSymbol,
      expiryDays: currentPolicy.expiryDays,
      historyCount: currentPolicy.historyCount,
      lockoutThreshold: currentPolicy.lockoutThreshold,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    },
  })

  const handleSave = (values: PolicyValues) => {
    const draft: PolicyDraft = values
    savePolicy(draft, `${role} (demo)`)
  }

  const numberField = (
    name: 'minLength' | 'expiryDays' | 'historyCount' | 'lockoutThreshold',
    label: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className='text-xs'>{label}</FormLabel>
          <FormControl>
            <Input
              type='number'
              disabled={!canEdit}
              className='h-7 text-xs'
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Tenant password policy
        </h3>
        <Badge variant='open'>Current: v{currentPolicy.version}</Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className='space-y-3'>
          <div className='grid grid-cols-2 gap-3'>
            {numberField('minLength', 'Minimum length')}
            {numberField('expiryDays', 'Expiry (days)')}
            {numberField('historyCount', 'Reuse history')}
            {numberField('lockoutThreshold', 'Lockout threshold')}
          </div>
          <div className='flex flex-wrap gap-3'>
            {FLAGS.map((flag) => (
              <FormField
                key={flag.name}
                control={form.control}
                name={flag.name}
                render={({ field }) => (
                  <FormItem className='flex items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        variant='blue'
                        disabled={!canEdit}
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <FormLabel className='text-xs font-normal'>
                      {flag.label}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
          <div className='flex items-end justify-between gap-3'>
            <FormField
              control={form.control}
              name='effectiveFrom'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Effective from</FormLabel>
                  <FormControl>
                    <Input
                      type='date'
                      disabled={!canEdit}
                      className='h-7 w-[150px] text-xs'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canEdit ? (
              <Button type='submit' size='sm' className='h-7 px-3 text-xs'>
                Save as new version
              </Button>
            ) : (
              <Badge variant='pending'>Read-only for {role}</Badge>
            )}
          </div>
        </form>
      </Form>

      <div className='mt-4'>
        <p className='text-neutral-1600 mb-1.5 text-xs font-medium'>
          Version history (retained, never overwritten)
        </p>
        <div className='space-y-1'>
          {[...policyVersions]
            .sort((a, b) => b.version - a.version)
            .map((p) => (
              <div
                key={p.version}
                className='flex items-center justify-between rounded border border-gray-100 px-2 py-1.5 text-xs'
              >
                <span className='text-neutral-1900'>
                  v{p.version} — min {p.minLength}, expiry {p.expiryDays}d,
                  reuse {p.historyCount}, lockout {p.lockoutThreshold}
                </span>
                <span className='text-neutral-1000'>
                  effective {p.effectiveFrom} · by {p.savedBy}
                  {p.version === currentPolicy.version ? ' · current' : ''}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
