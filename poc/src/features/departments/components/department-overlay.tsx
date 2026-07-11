import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { DEPARTMENT_STATUSES, type Department } from '../data/departments'
import { type Employee } from '../data/employees'
import { LOCATIONS } from '../data/org-config'
import { type CustomFieldDef } from '../data/governance'
import { type DepartmentDraft, type DepartmentsStore } from '../hooks/use-departments'

const NONE = 'none'

const departmentFormSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  acronym: z
    .string()
    .max(6, 'Keep the acronym to 6 characters or fewer')
    .optional()
    .or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  parentId: z.string(),
  headId: z.string(),
  status: z.enum(DEPARTMENT_STATUSES),
})

type DepartmentFormValues = z.infer<typeof departmentFormSchema>

const emptyDraft: DepartmentFormValues = {
  name: '',
  acronym: '',
  description: '',
  parentId: NONE,
  headId: NONE,
  status: 'active',
}

interface DepartmentOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this department; otherwise it creates one. */
  department?: Department | null
  departments: Department[]
  employees: Employee[]
  customFields: CustomFieldDef[]
  descendantsOf: DepartmentsStore['descendantsOf']
  onSubmit: (draft: DepartmentDraft) => boolean
}

export function DepartmentOverlay({
  open,
  onOpenChange,
  department,
  departments,
  employees,
  customFields,
  descendantsOf,
  onSubmit,
}: DepartmentOverlayProps) {
  const isEdit = Boolean(department)
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: emptyDraft,
  })
  const [locationIds, setLocationIds] = useState<string[]>([])
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    form.reset(
      department
        ? {
            name: department.name,
            acronym: department.acronym,
            description: department.description,
            parentId: department.parentId ?? NONE,
            headId: department.headId ?? NONE,
            status: department.status,
          }
        : emptyDraft
    )
    setLocationIds(department?.locationIds ?? [])
    setCustomValues(department?.customFields ?? {})
  }, [open, department, form])

  // Cycle prevention (DEPT-02): a department cannot pick itself or any of
  // its descendants as its parent.
  const parentOptions = useMemo(() => {
    const invalid = department
      ? new Set([department.id, ...descendantsOf(department.id).map((d) => d.id)])
      : new Set<string>()
    return departments.filter((d) => d.status === 'active' && !invalid.has(d.id))
  }, [departments, department, descendantsOf])

  function handleSubmit(values: DepartmentFormValues) {
    // Required custom fields are enforced per the configured schema (DEPT-14).
    const missing = customFields.filter((f) => f.required && !customValues[f.id]?.trim())
    if (missing.length > 0) {
      toast.error(`Required custom field: ${missing.map((f) => f.label).join(', ')}`)
      return
    }
    // Acronym conflicts within the company are flagged per config (DEPT-21).
    const acronym = (values.acronym ?? '').toUpperCase()
    if (
      acronym &&
      departments.some((d) => d.id !== department?.id && d.acronym === acronym)
    ) {
      toast.warning(`Acronym "${acronym}" is already used by another department — conflict flagged`)
    }
    const ok = onSubmit({
      name: values.name,
      acronym,
      description: values.description ?? '',
      parentId: values.parentId === NONE ? null : values.parentId,
      headId: values.headId === NONE ? null : values.headId,
      status: values.status,
      locationIds,
      workAreaIds: department?.workAreaIds ?? [],
      shiftIds: department?.shiftIds ?? ['sh-1'],
      defaultShiftId: department?.defaultShiftId ?? 'sh-1',
      rosterVisibleTo: department?.rosterVisibleTo ?? [
        'Platform Admin',
        'Portfolio Admin',
        'Group Company Admin',
        'Company Admin',
        'Employee (User)',
      ],
      customFields: customValues,
    })
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit department — ${department?.id}` : 'New department'}
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
                    <FormLabel>Department name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Customer Success' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='acronym'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acronym / short code</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. CS' {...field} />
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
                      <Textarea
                        placeholder='Purpose and scope of this department'
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
                name='parentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent department</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Top-level (no parent)</SelectItem>
                        {parentOptions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} ({d.acronym || d.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className='text-neutral-1000 text-xs'>
                      Nesting is unlimited (n-level). The department itself and its
                      descendants are excluded to prevent cycles.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='headId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department head</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Unassigned</SelectItem>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} — {e.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className='text-neutral-1000 text-xs'>
                      Only valid employees of this company can be designated head.
                    </p>
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
                        <SelectItem value='inactive'>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-2'>
                <FormLabel>Office locations / sites</FormLabel>
                {LOCATIONS.map((loc) => (
                  <label key={loc.id} className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      variant='blue'
                      checked={locationIds.includes(loc.id)}
                      onCheckedChange={(checked) =>
                        setLocationIds((prev) =>
                          checked ? [...prev, loc.id] : prev.filter((id) => id !== loc.id)
                        )
                      }
                    />
                    <span className='text-neutral-1900'>
                      {loc.name}, {loc.city}
                      {loc.retired && (
                        <span className='text-red-1400 ml-1 text-xs'>(retired site)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>

              {customFields.length > 0 && (
                <div className='space-y-3 rounded-md border border-gray-200 p-3'>
                  <p className='text-neutral-1600 text-sm font-medium'>
                    Custom fields{' '}
                    <span className='text-neutral-1000 font-normal'>
                      (rendered from tenant config)
                    </span>
                  </p>
                  {customFields.map((f) => (
                    <div key={f.id} className='space-y-1'>
                      <FormLabel>
                        {f.label}
                        {f.required && <span className='text-red-1400'> *</span>}
                        <span className='text-neutral-1000 ml-1 text-xs font-normal'>
                          v{f.version}
                        </span>
                      </FormLabel>
                      {f.type === 'select' ? (
                        <Select
                          value={customValues[f.id] ?? ''}
                          onValueChange={(v) =>
                            setCustomValues((prev) => ({ ...prev, [f.id]: v }))
                          }
                        >
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select…' />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={customValues[f.id] ?? ''}
                          onChange={(e) =>
                            setCustomValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                          }
                          placeholder={f.label}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>{isEdit ? 'Save changes' : 'Create department'}</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
