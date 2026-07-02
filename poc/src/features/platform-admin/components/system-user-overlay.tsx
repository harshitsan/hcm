import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import { type Tenant } from '../data/tenants'
import { type IdentityStore, type SystemUserDraft } from '../hooks/use-identity'

const NONE = 'none'

const userFormSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.email('Enter a valid email'),
  status: z.enum(['active', 'invited', 'disabled']),
  tenantId: z.string().min(1, 'Pick the company for this membership'),
  roleId: z.string().min(1, 'Pick a role from the matching catalog'),
  personRecordId: z.string(),
})

type UserFormValues = z.infer<typeof userFormSchema>

const emptyDraft: UserFormValues = {
  name: '',
  email: '',
  status: 'invited',
  tenantId: '',
  roleId: '',
  personRecordId: NONE,
}

interface SystemUserOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  identity: IdentityStore
  tenants: Tenant[]
  onSubmit: (draft: SystemUserDraft) => void
}

/**
 * New user / new membership form (SYS-11, 12, 20, 38, 39). A user belongs to
 * one or more companies; roles are contextual per company and the role list
 * is bounded by the mapped record's workforce-type catalog.
 */
export function SystemUserOverlay({
  open,
  onOpenChange,
  identity,
  tenants,
  onSubmit,
}: SystemUserOverlayProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (open) form.reset(emptyDraft)
  }, [open, form])

  const tenantId = form.watch('tenantId')
  const personRecordId = form.watch('personRecordId')

  /** Unmapped person records within the selected company (SYS-20, 44). */
  const mappableRecords = useMemo(
    () =>
      identity.personRecords.filter(
        (r) => r.tenantId === tenantId && r.userId === null
      ),
    [identity.personRecords, tenantId]
  )

  /** Workforce-type role boundary (SYS-12). */
  const allowedRoles = useMemo(() => {
    const record = identity.personRecords.find((r) => r.id === personRecordId)
    if (!record) return identity.roles
    return identity.roles.filter(
      (role) => role.catalog === 'any' || role.catalog === record.workforceType
    )
  }, [identity.personRecords, identity.roles, personRecordId])

  function handleSubmit(values: UserFormValues) {
    onSubmit({
      name: values.name,
      email: values.email,
      status: values.status,
      membership: {
        tenantId: values.tenantId,
        roleIds: [values.roleId],
        personRecordId:
          values.personRecordId === NONE ? null : values.personRecordId,
      },
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New user / membership
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <p className='text-paragraph-sm text-neutral-1000'>
                Using an existing user&apos;s email adds a company membership to
                the same identity — no duplicate user is created.
              </p>

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder='Jordan Avery' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='name@company.example' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tenantId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (membership context)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('personRecordId', NONE)
                      }}
                    >
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select company' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
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
                name='personRecordId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Map to person record (optional — users, employees &
                      contractors stay distinct)
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>
                          No mapping — user without employee record
                        </SelectItem>
                        {mappableRecords.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.personName} — {r.workforceType} · {r.position}
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
                name='roleId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Role in this company (workforce-type catalog enforced)
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allowedRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name} ({role.catalog})
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='invited'>Invited</SelectItem>
                        <SelectItem value='disabled'>Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
