import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRole } from '@/context/role-context'
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
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  COMPANIES,
  MANAGER_BY_ID,
  MANAGER_USERS,
  type Portfolio,
} from '../data/portfolios'

export interface PortfolioFormValues {
  name: string
  description: string
  managerId: string
  status: 'Active' | 'Inactive'
  companyIds: string[]
}

/**
 * Field validation per PORT-02/03/04/05: name 3–50 chars & unique (PORT_001),
 * description ≤500 chars optional, manager must hold the Portfolio Manager
 * role, and at least one company must be selected before persisting.
 */
function makeSchema(existingNames: string[], isEdit: boolean) {
  return z
    .object({
      name: z
        .string()
        .min(3, 'Portfolio name must be 3–50 characters')
        .max(50, 'Portfolio name must be 3–50 characters'),
      description: z
        .string()
        .max(500, 'Description is limited to 500 characters'),
      managerId: z.string().min(1, 'Select a portfolio manager'),
      status: z.enum(['Active', 'Inactive']),
      companyIds: z.array(z.string()),
    })
    .superRefine((values, ctx) => {
      if (existingNames.includes(values.name.trim().toLowerCase())) {
        ctx.addIssue({
          code: 'custom',
          path: ['name'],
          message: 'PORT_001 — Portfolio name exists (409)',
        })
      }
      const manager = MANAGER_BY_ID[values.managerId]
      if (manager && !manager.isPortfolioManager) {
        ctx.addIssue({
          code: 'custom',
          path: ['managerId'],
          message: 'Selected user must hold the Portfolio Manager role',
        })
      }
      if (!isEdit && values.companyIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['companyIds'],
          message: 'A portfolio must contain at least one company',
        })
      }
    })
}

interface PortfolioOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this portfolio; otherwise it creates one. */
  portfolio?: Portfolio | null
  /** All portfolios, for uniqueness + one-portfolio-per-company checks. */
  portfolios: Portfolio[]
  companyAssignment: Map<string, Portfolio>
  onSubmit: (values: PortfolioFormValues) => boolean
}

export function PortfolioOverlay({
  open,
  onOpenChange,
  portfolio,
  portfolios,
  companyAssignment,
  onSubmit,
}: PortfolioOverlayProps) {
  const { role } = useRole()
  const isEdit = Boolean(portfolio)
  // Portfolio Admin may only maintain the description of their portfolio
  // (PORT-09); name, manager and status stay Platform-Admin-only (PORT-08).
  const descriptionOnly = isEdit && role !== 'Platform Admin'

  const existingNames = useMemo(
    () =>
      portfolios
        .filter((p) => p.id !== portfolio?.id)
        .map((p) => p.name.trim().toLowerCase()),
    [portfolios, portfolio]
  )

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(makeSchema(existingNames, isEdit)),
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
      status: 'Active',
      companyIds: [],
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      portfolio
        ? {
            name: portfolio.name,
            description: portfolio.description,
            managerId: portfolio.managerId,
            status: portfolio.status,
            companyIds: portfolio.companies.map((l) => l.companyId),
          }
        : {
            name: '',
            description: '',
            managerId: '',
            status: 'Active',
            companyIds: [],
          }
    )
  }, [open, portfolio, form])

  // Only active companies not already held by another portfolio may be
  // selected (PORT-03 / PORT_002).
  const selectableCompanies = COMPANIES.filter((c) => c.status === 'active')

  function handleSubmit(values: PortfolioFormValues) {
    if (onSubmit(values)) onOpenChange(false)
  }

  const description = form.watch('description')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit ${portfolio?.code}` : 'Create Portfolio'}
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
                    <FormLabel>Portfolio name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Shared Services West'
                        disabled={descriptionOnly}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{' '}
                      <span className='text-neutral-1000 font-normal'>
                        (optional · {description.length}/500)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='What this shared-services portfolio administers'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='managerId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio manager</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={descriptionOnly}
                    >
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select a user' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MANAGER_USERS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className='flex items-center gap-2'>
                              {m.name}
                              <span className='text-neutral-1000 text-xs'>
                                {m.role}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEdit && (
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                      <div>
                        <FormLabel>Portfolio status</FormLabel>
                        <p className='text-paragraph-sm text-neutral-1000'>
                          Active or Inactive — changes are audited (PORT-27)
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 'Active'}
                          disabled={descriptionOnly}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? 'Active' : 'Inactive')
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {!isEdit && (
                <FormField
                  control={form.control}
                  name='companyIds'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated companies</FormLabel>
                      <div className='max-h-56 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2'>
                        {selectableCompanies.map((c) => {
                          const holder = companyAssignment.get(c.id)
                          const taken = Boolean(holder)
                          const checked = field.value.includes(c.id)
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 ${taken ? 'opacity-50' : 'cursor-pointer hover:bg-neutral-100'}`}
                            >
                              <span className='flex items-center gap-2'>
                                <Checkbox
                                  variant='blue'
                                  checked={checked}
                                  disabled={taken}
                                  onCheckedChange={(v) =>
                                    field.onChange(
                                      v
                                        ? [...field.value, c.id]
                                        : field.value.filter(
                                            (id) => id !== c.id
                                          )
                                    )
                                  }
                                />
                                <span className='text-sm'>{c.name}</span>
                              </span>
                              {taken && (
                                <Badge variant='pending'>
                                  In {holder?.code}
                                </Badge>
                              )}
                            </label>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isEdit && (
                <p className='text-paragraph-sm text-neutral-1000'>
                  A PortfolioCode (PORT-YYYY-NNN) is auto-generated and the
                  status defaults to Active on creation.
                </p>
              )}
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
                {isEdit ? 'Save changes' : 'Create portfolio'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
