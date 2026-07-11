import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Warning } from 'phosphor-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
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
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  PLATFORM_MODULES,
  SUBSCRIPTION_TIERS,
  TIER_DEFAULTS,
  type PlatformModule,
  type Tenant,
} from '../data/tenants'
import { type TenantDraft, type TenantsStore } from '../hooks/use-tenants'

const ARRANGEMENTS = ['standalone', 'portfolio', 'group'] as const

/** A company operates standalone, in a portfolio, or in a group — exactly
 * one arrangement at a time (SYS-09). */
const wizardSchema = z
  .object({
    name: z.string().min(2, 'Company legal name is required'),
    code: z.string().min(2, 'Tenant code is required'),
    jurisdictionIds: z
      .array(z.string())
      .min(1, 'Select at least one supported jurisdiction'),
    arrangement: z.enum(ARRANGEMENTS),
    portfolioId: z.string(),
    groupId: z.string(),
    tier: z.enum(SUBSCRIPTION_TIERS),
    employeeLimit: z
      .number({ message: 'Employee limit is required' })
      .int('Whole number of employees')
      .min(1, 'Employee limit must be at least 1'),
    modules: z.array(z.string()).min(1, 'Entitle at least one module'),
    status: z.enum(['onboarding', 'active']),
  })
  .refine((v) => v.arrangement !== 'portfolio' || v.portfolioId !== '', {
    path: ['portfolioId'],
    message: 'Pick the portfolio — a company belongs to at most one',
  })
  .refine((v) => v.arrangement !== 'group' || v.groupId !== '', {
    path: ['groupId'],
    message: 'Pick the group — a company belongs to at most one',
  })

type WizardValues = z.infer<typeof wizardSchema>

const emptyValues: WizardValues = {
  name: '',
  code: '',
  jurisdictionIds: [],
  arrangement: 'standalone',
  portfolioId: '',
  groupId: '',
  tier: 'starter',
  employeeLimit: TIER_DEFAULTS.starter.employeeLimit,
  modules: [...TIER_DEFAULTS.starter.modules],
  status: 'onboarding',
}

const STEPS: { title: string; fields: (keyof WizardValues)[] }[] = [
  { title: 'Company identity', fields: ['name', 'code'] },
  { title: 'Jurisdictions', fields: ['jurisdictionIds'] },
  { title: 'Operating arrangement', fields: ['arrangement', 'portfolioId', 'groupId'] },
  { title: 'Subscription plan', fields: ['tier', 'employeeLimit', 'modules'] },
  { title: 'Go-live status', fields: ['status'] },
  { title: 'Review & provision', fields: [] },
]

const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ')

interface TenantWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: TenantsStore
  onSubmit: (draft: TenantDraft) => void
}

/**
 * 6-step tenant provisioning wizard with duplicate detection (US-PA-01/03)
 * and commercial subscription setup — tier, employee limit and module
 * entitlements (US-PA-42..44).
 */
export function TenantWizard({
  open,
  onOpenChange,
  store,
  onSubmit,
}: TenantWizardProps) {
  const [step, setStep] = useState(0)
  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    setStep(0)
    form.reset(emptyValues)
  }, [open, form])

  const arrangement = form.watch('arrangement')
  const name = form.watch('name')
  const code = form.watch('code')
  const tier = form.watch('tier')
  const values = form.watch()

  /** Duplicate detection — existing tenants matching by name or code. */
  const duplicates = useMemo(
    () =>
      store.tenants.filter(
        (t) =>
          (name.trim().length >= 3 &&
            (norm(t.name) === norm(name) ||
              norm(t.name).includes(norm(name)) ||
              norm(name).includes(norm(t.name)))) ||
          (code.trim().length >= 2 &&
            t.code.toUpperCase() === code.trim().toUpperCase())
      ),
    [store.tenants, name, code]
  )
  const exactCodeClash = store.tenants.some(
    (t) => t.code.toUpperCase() === code.trim().toUpperCase() && code.trim() !== ''
  )

  const next = async () => {
    const valid = await form.trigger(STEPS[step].fields)
    if (!valid) return
    if (step === 0 && exactCodeClash) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function handleSubmit(v: WizardValues) {
    onSubmit({
      name: v.name.trim(),
      code: v.code.trim().toUpperCase(),
      jurisdictionIds: v.jurisdictionIds,
      portfolioId: v.arrangement === 'portfolio' ? v.portfolioId : null,
      groupId: v.arrangement === 'group' ? v.groupId : null,
      status: v.status,
      subscription: {
        tier: v.tier,
        employeeLimit: v.employeeLimit,
        modules: v.modules as PlatformModule[],
      },
    })
    onOpenChange(false)
  }

  const jurisdictionCode = (id: string) =>
    store.jurisdictions.find((j) => j.id === id)?.code ?? id
  const arrangementLabel =
    values.arrangement === 'portfolio'
      ? `Portfolio · ${store.portfolios.find((p) => p.id === values.portfolioId)?.name ?? '—'}`
      : values.arrangement === 'group'
        ? `Group · ${store.groups.find((g) => g.id === values.groupId)?.name ?? '—'}`
        : 'Standalone'

  const duplicateWarning = (list: Tenant[]) =>
    list.length > 0 && (
      <div className='rounded-[6px] border border-amber-300 bg-amber-50 p-3'>
        <p className='text-paragraph-sm flex items-center gap-1.5 font-medium text-amber-800'>
          <Warning size={14} weight='bold' />
          Possible duplicate tenant{list.length > 1 ? 's' : ''} detected
        </p>
        <ul className='text-paragraph-sm mt-1 space-y-0.5 text-amber-800'>
          {list.map((t) => (
            <li key={t.id}>
              {t.name} ({t.code}) — provisioned {t.createdAt}, {t.status}
            </li>
          ))}
        </ul>
        <p className='text-paragraph-sm mt-1 text-amber-800'>
          {exactCodeClash
            ? 'The tenant code is already in use — pick a different code to continue.'
            : 'Verify this is not an existing tenant before provisioning.'}
        </p>
      </div>
    )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Provision new company
          </SheetTitle>
          {/* Step indicator */}
          <div className='mt-2 flex flex-wrap items-center gap-1.5'>
            {STEPS.map((s, i) => (
              <div key={s.title} className='flex items-center gap-1.5'>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    i < step
                      ? 'bg-green-600 text-white'
                      : i === step
                        ? 'bg-orange-1200 text-white'
                        : 'bg-neutral-300 text-neutral-1000'
                  }`}
                >
                  {i < step ? <Check size={11} weight='bold' /> : i + 1}
                </span>
                {i === step && (
                  <span className='text-paragraph-sm text-neutral-1600 font-medium'>
                    {s.title}
                  </span>
                )}
                {i < STEPS.length - 1 && (
                  <span className='bg-neutral-300 h-px w-3' />
                )}
              </div>
            ))}
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {/* Step 1 — identity + duplicate detection (US-PA-01/03) */}
              {step === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Acme Industries Pvt Ltd' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='code'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant code (unique)</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. ACME-IN' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {duplicateWarning(duplicates)}
                </>
              )}

              {/* Step 2 — jurisdictions from the platform catalog */}
              {step === 1 && (
                <FormField
                  control={form.control}
                  name='jurisdictionIds'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supported jurisdictions (from the platform catalog)
                      </FormLabel>
                      <div className='border-gray-200 grid grid-cols-2 gap-2 rounded-[6px] border p-3'>
                        {store.jurisdictions
                          .filter((j) => j.status === 'available')
                          .map((j) => (
                            <label
                              key={j.id}
                              className='flex items-center gap-2 text-sm'
                            >
                              <Checkbox
                                variant='blue'
                                checked={field.value.includes(j.id)}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, j.id]
                                      : field.value.filter((id) => id !== j.id)
                                  )
                                }
                              />
                              {j.code} — {j.name}
                            </label>
                          ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Step 3 — exactly one operating arrangement (SYS-09) */}
              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name='arrangement'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating arrangement (exactly one)</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='standalone'>Standalone</SelectItem>
                            <SelectItem value='portfolio'>
                              Within a portfolio
                            </SelectItem>
                            <SelectItem value='group'>
                              Within a group structure
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {arrangement === 'portfolio' && (
                    <FormField
                      control={form.control}
                      name='portfolioId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger variant='secondary' className='w-full'>
                                <SelectValue placeholder='Select portfolio' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {store.portfolios.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {arrangement === 'group' && (
                    <FormField
                      control={form.control}
                      name='groupId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group structure</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger variant='secondary' className='w-full'>
                                <SelectValue placeholder='Select group' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {store.groups.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              {/* Step 4 — commercial subscription (US-PA-42..44) */}
              {step === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name='tier'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription tier</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v)
                            const defaults =
                              TIER_DEFAULTS[v as keyof typeof TIER_DEFAULTS]
                            form.setValue('employeeLimit', defaults.employeeLimit)
                            form.setValue('modules', [...defaults.modules])
                          }}
                        >
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUBSCRIPTION_TIERS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t[0].toUpperCase() + t.slice(1)} — up to{' '}
                                {TIER_DEFAULTS[t].employeeLimit.toLocaleString('en-US')}{' '}
                                employees, {TIER_DEFAULTS[t].modules.length} modules
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='employeeLimit'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Employee limit (hires beyond this are blocked)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={1}
                            value={Number.isNaN(field.value) ? '' : field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='modules'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module entitlements</FormLabel>
                        <div className='border-gray-200 grid grid-cols-2 gap-2 rounded-[6px] border p-3'>
                          {PLATFORM_MODULES.map((m) => (
                            <label key={m} className='flex items-center gap-2 text-sm'>
                              <Checkbox
                                variant='blue'
                                checked={field.value.includes(m)}
                                disabled={m === 'Core HR'}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, m]
                                      : field.value.filter((v) => v !== m)
                                  )
                                }
                              />
                              {m}
                              {m === 'Core HR' && (
                                <span className='text-paragraph-sm text-neutral-1000'>
                                  (always on)
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                        <p className='text-paragraph-sm text-neutral-1000'>
                          Users in this company are denied access to modules
                          outside the subscription.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 5 — go-live status */}
              {step === 4 && (
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operational status at provisioning</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='onboarding'>
                            Onboarding — setup checklist runs before go-live
                          </SelectItem>
                          <SelectItem value='active'>
                            Active — live for company users immediately
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Step 6 — review & provision */}
              {step === 5 && (
                <div className='space-y-3'>
                  {duplicateWarning(duplicates)}
                  <div className='border-gray-200 rounded-[6px] border'>
                    {[
                      ['Legal name', values.name],
                      ['Tenant code', values.code.toUpperCase()],
                      [
                        'Jurisdictions',
                        values.jurisdictionIds.map(jurisdictionCode).join(', '),
                      ],
                      ['Arrangement', arrangementLabel],
                      [
                        'Subscription',
                        `${tier[0].toUpperCase() + tier.slice(1)} — up to ${values.employeeLimit.toLocaleString('en-US')} employees`,
                      ],
                      ['Status', values.status],
                    ].map(([label, value], i) => (
                      <div key={label}>
                        {i > 0 && <Separator />}
                        <div className='flex items-start justify-between gap-3 px-3 py-2'>
                          <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
                            {label}
                          </span>
                          <span className='text-neutral-1900 text-right text-sm font-medium'>
                            {value || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className='flex flex-wrap items-center gap-1 px-3 py-2'>
                      <span className='text-paragraph-sm text-neutral-1000 mr-1'>
                        Modules
                      </span>
                      {values.modules.map((m) => (
                        <Badge key={m} variant='pending'>
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Provisioning creates the tenant with logically isolated
                    data and writes a platform-log entry.
                  </p>
                </div>
              )}
            </div>

            <div className='border-gray-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <div className='flex items-center gap-3'>
                {step > 0 && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                  >
                    Back
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button
                    type='button'
                    onClick={next}
                    disabled={step === 0 && exactCodeClash}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type='submit'>Provision tenant</Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
