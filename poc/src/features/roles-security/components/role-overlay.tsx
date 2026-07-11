import { useEffect } from 'react'
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
import { useRole } from '@/context/role-context'
import {
  allowedScopeLevels,
  authorizedCompanyIds,
  authorizedGroupIds,
} from '../data/authority'
import {
  COMPANIES,
  GROUP_COMPANIES,
  HIERARCHY_LEVELS,
  PORTFOLIO,
} from '../data/directory'
import {
  PERMISSION_FUNCTIONS,
  ROLE_STATUSES,
  type RoleDef,
} from '../data/roles'
import { type RoleDraft } from '../hooks/use-roles'

const roleFormSchema = z
  .object({
    name: z.string().min(2, 'Role name is required'),
    description: z.string().min(2, 'Description is required'),
    isAdmin: z.boolean(),
    scopeLevel: z.enum(HIERARCHY_LEVELS),
    scopeEntityId: z.string(),
    permissions: z
      .array(z.enum(PERMISSION_FUNCTIONS))
      .min(1, 'Grant at least one function permission'),
    effectiveFrom: z.string().min(1, 'Effective date is required'),
    status: z.enum(ROLE_STATUSES),
    note: z.string(),
  })
  .refine(
    (v) => v.scopeLevel === 'Platform' || v.scopeEntityId.length > 0,
    {
      message: 'Select the entity this role is scoped to',
      path: ['scopeEntityId'],
    }
  )

type RoleFormValues = z.infer<typeof roleFormSchema>

const emptyValues: RoleFormValues = {
  name: '',
  description: '',
  isAdmin: false,
  scopeLevel: 'Company',
  scopeEntityId: '',
  permissions: [],
  effectiveFrom: new Date().toISOString().slice(0, 10),
  status: 'Draft',
  note: '',
}

interface RoleOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleDef | null
  onSubmit: (draft: RoleDraft) => boolean
}

/**
 * Create/edit a role scoped to exactly one hierarchy level (RSEC-01);
 * selectable scopes are limited to the persona's authority (RSEC-11) and
 * edits are saved as new governed-config versions (RSEC-18, RSEC-35).
 */
export function RoleOverlay({
  open,
  onOpenChange,
  role,
  onSubmit,
}: RoleOverlayProps) {
  const { role: actorRole } = useRole()
  const isEdit = Boolean(role)
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      role
        ? {
            name: role.name,
            description: role.description,
            isAdmin: role.isAdmin,
            scopeLevel: role.scopeLevel,
            scopeEntityId: role.scopeEntityId ?? '',
            permissions: [...role.permissions],
            effectiveFrom: role.effectiveFrom,
            status: role.status,
            note: '',
          }
        : emptyValues
    )
  }, [open, role, form])

  const scopeLevel = form.watch('scopeLevel')
  const levels = allowedScopeLevels(actorRole)
  const groupIds = authorizedGroupIds(actorRole)
  const companyIds = authorizedCompanyIds(actorRole)

  function handleSubmit(values: RoleFormValues) {
    const ok = onSubmit({
      ...values,
      scopeEntityId:
        values.scopeLevel === 'Platform'
          ? null
          : values.scopeLevel === 'Portfolio'
            ? PORTFOLIO.id
            : values.scopeEntityId,
    })
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit role (saves as v${(role?.version ?? 0) + 1})` : 'New role'}
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
                    <FormLabel>Role name</FormLabel>
                    <FormControl>
                      <Input placeholder='Company HR Manager' {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder='What this role governs' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='scopeLevel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope level (exactly one)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('scopeEntityId', '')
                      }}
                    >
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(scopeLevel === 'Group Company' || scopeLevel === 'Company') && (
                <FormField
                  control={form.control}
                  name='scopeEntityId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {scopeLevel === 'Group Company'
                          ? 'Group company'
                          : 'Company'}
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select entity' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {scopeLevel === 'Group Company'
                            ? GROUP_COMPANIES.filter((g) =>
                                groupIds.includes(g.id)
                              ).map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>
                              ))
                            : COMPANIES.filter((c) =>
                                companyIds.includes(c.id)
                              ).map((c) => (
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
              )}
              <FormField
                control={form.control}
                name='permissions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Function permissions (cascade only within the scope)
                    </FormLabel>
                    <div className='grid grid-cols-1 gap-2 rounded-[6px] border border-gray-200 p-3'>
                      {PERMISSION_FUNCTIONS.map((perm) => (
                        <label
                          key={perm}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Checkbox
                            variant='blue'
                            checked={field.value.includes(perm)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, perm]
                                  : field.value.filter((p) => p !== perm)
                              )
                            }
                          />
                          {perm}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='effectiveFrom'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective from</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
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
                          {ROLE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='isAdmin'
                render={({ field }) => (
                  <FormItem>
                    <label className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        variant='blue'
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                      Admin role — grants administrative access when assigned
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='note'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change note (kept in version history)</FormLabel>
                    <FormControl>
                      <Input placeholder='Why this version was published' {...field} />
                    </FormControl>
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
                {isEdit ? 'Save new version' : 'Save role'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
