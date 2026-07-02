import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { COMPANIES, type EmployeeRecord } from '../data/companies'
import {
  AUTH_METHOD_LABELS,
  AUTH_METHODS,
  COMPANY_ROLES,
  USER_STATUSES,
  type AuthUser,
} from '../data/auth-users'
import { type AuthUserDraft } from '../hooks/use-auth-users'

const NO_EMPLOYEE = 'none'

const userFormSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.email('Enter a valid email'),
  authMethod: z.enum(AUTH_METHODS),
  status: z.enum(USER_STATUSES),
  companyId: z.string().min(1, 'Select a company'),
  roles: z.array(z.enum(COMPANY_ROLES)).min(1, 'Assign at least one role'),
  employeeId: z.string(),
})

type UserFormValues = z.infer<typeof userFormSchema>

const emptyDraft: UserFormValues = {
  name: '',
  email: '',
  authMethod: 'password',
  status: 'invited',
  companyId: 'co-01',
  roles: ['Employee'],
  employeeId: NO_EMPLOYEE,
}

interface UserOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this identity; otherwise it creates one. */
  user?: AuthUser | null
  employees: EmployeeRecord[]
  /** Uniqueness guard for the login identity (AUTH-16). */
  emailTaken: (email: string, exceptId?: string) => boolean
  onSubmit: (draft: AuthUserDraft) => void
}

export function UserOverlay({
  open,
  onOpenChange,
  user,
  employees,
  emailTaken,
  onSubmit,
}: UserOverlayProps) {
  const isEdit = Boolean(user)
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      user
        ? {
            name: user.name,
            email: user.email,
            authMethod: user.authMethod,
            status: user.status,
            companyId: user.memberships[0]?.companyId ?? 'co-01',
            roles: user.memberships[0]?.roles ?? ['Employee'],
            employeeId: NO_EMPLOYEE,
          }
        : emptyDraft
    )
  }, [open, user, form])

  const companyId = form.watch('companyId')
  const linkableEmployees = useMemo(
    () =>
      employees.filter(
        (e) => e.companyId === companyId && e.linkedUserId === null
      ),
    [employees, companyId]
  )

  function handleSubmit(values: UserFormValues) {
    if (emailTaken(values.email, user?.id)) {
      form.setError('email', {
        message: 'This login identity already exists — emails must be unique',
      })
      return
    }
    onSubmit({
      name: values.name,
      email: values.email,
      authMethod: values.authMethod,
      status: values.status,
      companyId: values.companyId,
      roles: values.roles,
      employeeId: values.employeeId === NO_EMPLOYEE ? null : values.employeeId,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit user identity' : 'New user identity'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <p className='text-paragraph-sm text-neutral-1000'>
                A User is a distinct identity — it never requires an Employee
                or Contractor record to exist.
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
                    <FormLabel>Login email (unique identity)</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='name@company.example'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='authMethod'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AUTH_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {AUTH_METHOD_LABELS[m]}
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
                        {USER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className='capitalize'>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isEdit && (
                <>
                  <FormField
                    control={form.control}
                    name='companyId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial company membership</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v)
                            form.setValue('employeeId', NO_EMPLOYEE)
                          }}
                        >
                          <FormControl>
                            <SelectTrigger
                              variant='secondary'
                              className='w-full'
                            >
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMPANIES.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
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
                    name='roles'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roles in this company</FormLabel>
                        <div className='grid grid-cols-2 gap-2'>
                          {COMPANY_ROLES.map((role) => (
                            <label
                              key={role}
                              className='text-neutral-1900 flex items-center gap-2 text-sm'
                            >
                              <Checkbox
                                variant='blue'
                                checked={field.value.includes(role)}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, role]
                                      : field.value.filter((r) => r !== role)
                                  )
                                }
                              />
                              {role}
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='employeeId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to employee record (optional)</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger
                              variant='secondary'
                              className='w-full'
                            >
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_EMPLOYEE}>
                              None — no workforce record
                            </SelectItem>
                            {linkableEmployees.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.name} · {e.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Create user'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
