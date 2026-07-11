import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  APPLICABILITY_OPTIONS,
  CLASS_TYPES,
  GROUP_CATEGORIES,
  GROUP_SCOPES,
  GROUP_STATUSES,
  GROUP_TYPES,
  PAYROLL_FREQUENCIES,
  WAGE_TYPES,
  type GroupScope,
  type OrgGroup,
} from '../data/groups'
import { type GroupDraft } from '../hooks/use-org-groups'
import { descendantIds, isScopeCompatible } from '../utils/hierarchy'

const NONE = '__none__'
const INHERIT = '__inherit__'

const formSchema = z
  .object({
    name: z.string().min(2, 'Group name is required'),
    acronym: z.string().max(8, 'Keep the acronym short (max 8 characters)'),
    description: z.string(),
    scope: z.enum(GROUP_SCOPES),
    category: z.enum(GROUP_CATEGORIES),
    type: z.enum(GROUP_TYPES),
    parentId: z.string(),
    applicability: z.string().min(1, 'Select an applicability'),
    owner: z.string(),
    requiresApproval: z.boolean(),
    inheritanceRule: z.string(),
    classType: z.string(),
    payrollFrequency: z.string(),
    wageType: z.string(),
    eligibilityRule: z.string(),
    status: z.enum(GROUP_STATUSES),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'dynamic' && values.eligibilityRule.trim().length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['eligibilityRule'],
        message: 'A dynamic group needs a membership rule',
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

const emptyValues = (scope: GroupScope): FormValues => ({
  name: '',
  acronym: '',
  description: '',
  scope,
  category: 'organizational',
  type: 'static',
  parentId: NONE,
  applicability: 'All locations',
  owner: '',
  requiresApproval: false,
  inheritanceRule: INHERIT,
  classType: '',
  payrollFrequency: '',
  wageType: '',
  eligibilityRule: '',
  status: 'active',
})

function toValues(g: OrgGroup): FormValues {
  return {
    name: g.name,
    acronym: g.acronym,
    description: g.description,
    scope: g.scope,
    category: g.category,
    type: g.type,
    parentId: g.parentId ?? NONE,
    applicability: g.applicability,
    owner: g.owner ?? '',
    requiresApproval: g.requiresApproval,
    inheritanceRule: g.inheritanceRule ?? INHERIT,
    classType: g.classType ?? '',
    payrollFrequency: g.payrollFrequency ?? '',
    wageType: g.wageType ?? '',
    eligibilityRule: g.eligibilityRule ?? '',
    status: g.status,
  }
}

const SCOPE_LABELS: Record<GroupScope, string> = {
  global: 'Global (all tenants)',
  'group-company': 'Group company',
  company: 'Company',
}

interface GroupFormOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, edits this group. */
  group?: OrgGroup | null
  /** When set (and no `group`), pre-fills a clone of this group. */
  cloneSource?: OrgGroup | null
  /** Scopes the active role may create/edit within. */
  allowedScopes: GroupScope[]
  groups: OrgGroup[]
  /** Returns true when the save succeeded (uniqueness etc. pass). */
  onSubmit: (draft: GroupDraft) => boolean
}

export function GroupFormOverlay({
  open,
  onOpenChange,
  group,
  cloneSource,
  allowedScopes,
  groups,
  onSubmit,
}: GroupFormOverlayProps) {
  const isEdit = Boolean(group)
  const isClone = Boolean(cloneSource) && !isEdit
  const defaultScope = allowedScopes[allowedScopes.length - 1] ?? 'company'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues(defaultScope),
  })

  useEffect(() => {
    if (!open) return
    if (group) form.reset(toValues(group))
    else if (cloneSource)
      form.reset({
        ...toValues(cloneSource),
        name: `${cloneSource.name} (Copy)`,
        acronym: '',
      })
    else form.reset(emptyValues(defaultScope))
  }, [open, group, cloneSource, defaultScope, form])

  const scope = form.watch('scope')
  const type = form.watch('type')
  const category = form.watch('category')

  const blockedIds = group ? [group.id, ...descendantIds(groups, group.id)] : []
  const parentOptions = groups.filter(
    (g) =>
      g.status === 'active' &&
      !blockedIds.includes(g.id) &&
      isScopeCompatible(g.scope, scope)
  )

  function handleSubmit(values: FormValues) {
    const ok = onSubmit({
      name: values.name.trim(),
      acronym: values.acronym.trim().toUpperCase(),
      description: values.description.trim(),
      scope: values.scope,
      category: values.category,
      type: values.type,
      parentId: values.parentId === NONE ? null : values.parentId,
      applicability: values.applicability,
      owner: values.owner.trim() || null,
      requiresApproval: values.requiresApproval,
      inheritanceRule:
        values.inheritanceRule === INHERIT
          ? null
          : (values.inheritanceRule as OrgGroup['inheritanceRule']),
      classType: values.classType || null,
      payrollFrequency: values.payrollFrequency || null,
      wageType: values.wageType || null,
      eligibilityRule: values.eligibilityRule.trim() || null,
      status: values.status,
    })
    if (ok) onOpenChange(false)
  }

  function handleCancel() {
    if (form.formState.isDirty) {
      const discard = window.confirm('Discard unsaved changes to this group?')
      if (!discard) return
    }
    onOpenChange(false)
  }

  const selectField = (
    name: 'scope' | 'category' | 'type' | 'parentId' | 'applicability' | 'inheritanceRule' | 'status' | 'classType' | 'payrollFrequency' | 'wageType',
    label: string,
    options: { value: string; label: string; disabled?: boolean }[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleCancel())}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit group' : isClone ? 'Clone group' : 'New group'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <div className='grid grid-cols-3 gap-3'>
                <div className='col-span-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Gratuity Cohort' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name='acronym'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acronym</FormLabel>
                      <FormControl>
                        <Input placeholder='GRAT' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / eligibility note (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder='Purpose and statutory basis, e.g. Payment of Gratuity Act 1972 — 4 years 240 days continuous service'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                {selectField(
                  'scope',
                  'Scope',
                  GROUP_SCOPES.map((s) => ({
                    value: s,
                    label: SCOPE_LABELS[s],
                    disabled: !allowedScopes.includes(s),
                  }))
                )}
                {selectField(
                  'category',
                  'Category',
                  GROUP_CATEGORIES.map((c) => ({ value: c, label: c.replace('-', ' ') }))
                )}
              </div>

              <div className='grid grid-cols-2 gap-3'>
                {selectField('type', 'Type', GROUP_TYPES.map((t) => ({
                  value: t,
                  label: t === 'static' ? 'Static (manual members)' : 'Dynamic (rule-derived)',
                })))}
                {selectField('parentId', 'Parent group', [
                  { value: NONE, label: 'None (top level)' },
                  ...parentOptions.map((g) => ({ value: g.id, label: `${g.name} (${SCOPE_LABELS[g.scope]})` })),
                ])}
              </div>

              {type === 'dynamic' && (
                <FormField
                  control={form.control}
                  name='eligibilityRule'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membership rule</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. gross_monthly_salary <= 21000 (ESI Act 1948)'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {category === 'payroll-cohort' && (
                <div className='grid grid-cols-3 gap-3'>
                  {selectField('classType', 'Class type', CLASS_TYPES.map((v) => ({ value: v, label: v })))}
                  {selectField('payrollFrequency', 'Payroll frequency', PAYROLL_FREQUENCIES.map((v) => ({ value: v, label: v })))}
                  {selectField('wageType', 'Wage type', WAGE_TYPES.map((v) => ({ value: v, label: v })))}
                </div>
              )}

              <div className='grid grid-cols-2 gap-3'>
                {selectField(
                  'applicability',
                  'Applicability',
                  APPLICABILITY_OPTIONS.map((v) => ({ value: v, label: v }))
                )}
                <FormField
                  control={form.control}
                  name='owner'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner / steward (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Divya Rao' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                {selectField('inheritanceRule', 'Inheritance rule', [
                  { value: INHERIT, label: 'Inherit from parent (default)' },
                  { value: 'inherit-downward', label: 'Inherit downward' },
                  { value: 'no-inheritance', label: 'No inheritance' },
                ])}
                {selectField('status', 'Status', GROUP_STATUSES.map((s) => ({
                  value: s,
                  label: s === 'active' ? 'Active' : 'Inactive',
                })))}
              </div>

              <FormField
                control={form.control}
                name='requiresApproval'
                render={({ field }) => (
                  <FormItem className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
                    <div>
                      <FormLabel>Approval-controlled membership</FormLabel>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        Membership changes are held pending until a Group
                        Company Admin approves them.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : isClone ? 'Create clone' : 'Create group'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
