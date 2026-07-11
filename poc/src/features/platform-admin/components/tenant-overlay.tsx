import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TENANT_STATUSES, type Tenant } from '../data/tenants'
import { type TenantsStore, type TenantEditDraft } from '../hooks/use-tenants'

const ARRANGEMENTS = ['standalone', 'portfolio', 'group'] as const

/** A company operates standalone, in a portfolio, or in a group — exactly
 * one arrangement at a time (SYS-09). */
const tenantFormSchema = z
  .object({
    name: z.string().min(2, 'Company name is required'),
    code: z.string().min(2, 'Tenant code is required'),
    jurisdictionIds: z
      .array(z.string())
      .min(1, 'Select at least one supported jurisdiction'),
    arrangement: z.enum(ARRANGEMENTS),
    portfolioId: z.string(),
    groupId: z.string(),
    status: z.enum(TENANT_STATUSES),
  })
  .refine((v) => v.arrangement !== 'portfolio' || v.portfolioId !== '', {
    path: ['portfolioId'],
    message: 'Pick the portfolio — a company belongs to at most one',
  })
  .refine((v) => v.arrangement !== 'group' || v.groupId !== '', {
    path: ['groupId'],
    message: 'Pick the group — a company belongs to at most one',
  })

type TenantFormValues = z.infer<typeof tenantFormSchema>

const emptyDraft: TenantFormValues = {
  name: '',
  code: '',
  jurisdictionIds: [],
  arrangement: 'standalone',
  portfolioId: '',
  groupId: '',
  status: 'onboarding',
}

interface TenantOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant | null
  store: TenantsStore
  onSubmit: (draft: TenantEditDraft) => void
}

export function TenantOverlay({
  open,
  onOpenChange,
  tenant,
  store,
  onSubmit,
}: TenantOverlayProps) {
  const isEdit = Boolean(tenant)
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      tenant
        ? {
            name: tenant.name,
            code: tenant.code,
            jurisdictionIds: tenant.jurisdictionIds,
            arrangement: tenant.portfolioId
              ? 'portfolio'
              : tenant.groupId
                ? 'group'
                : 'standalone',
            portfolioId: tenant.portfolioId ?? '',
            groupId: tenant.groupId ?? '',
            status: tenant.status,
          }
        : emptyDraft
    )
  }, [open, tenant, form])

  const arrangement = form.watch('arrangement')

  function handleSubmit(values: TenantFormValues) {
    onSubmit({
      name: values.name,
      code: values.code.toUpperCase(),
      jurisdictionIds: values.jurisdictionIds,
      portfolioId:
        values.arrangement === 'portfolio' ? values.portfolioId : null,
      groupId: values.arrangement === 'group' ? values.groupId : null,
      status: values.status,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit company' : 'Provision new company'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
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
                    <FormLabel>Tenant code</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. ACME-IN' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            {j.code}
                          </label>
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operational status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Suspension only via the suspend flow — needs a
                            mandatory reason + approval (US-PA-07). */}
                        {TENANT_STATUSES.filter(
                          (s) =>
                            s !== 'suspended' || tenant?.status === 'suspended'
                        ).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s[0].toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Provision tenant'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
