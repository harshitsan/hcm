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
import {
  POSITION_STATUSES,
  type Department,
  type Position,
  type PositionCustomFieldDef,
} from '../data/positions'
import type { PositionDraft } from '../hooks/use-positions'

const positionFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter a position name of at least 2 characters'),
  // Exactly one department is mandatory (POS-02).
  departmentId: z.string().min(1, 'Select the department this position belongs to'),
  // Level may be left blank without blocking creation (POS-19).
  level: z.string().regex(/^\d*$/, 'Level must be a whole number, e.g. 1, 2 or 3'),
  status: z.enum(POSITION_STATUSES, 'Choose Active or Inactive'),
  // Tenant custom fields are never required: untouched inputs arrive as
  // undefined, so values must be optional or empty submits would fail with
  // a generic "Invalid input" under each custom field (worklist #29).
  customFields: z.record(z.string(), z.string().optional()),
})

type PositionFormValues = z.infer<typeof positionFormSchema>

interface PositionOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this position; otherwise it creates one. */
  position?: Position | null
  companyId: string
  /** Only departments of the admin's own company are offered (POS-02/06). */
  departments: Department[]
  /** Governed custom-field definitions rendered dynamically (POS-13). */
  customFieldDefs: PositionCustomFieldDef[]
  existingPositions: Position[]
  onSubmit: (draft: PositionDraft) => void
}

export function PositionOverlay({
  open,
  onOpenChange,
  position,
  companyId,
  departments,
  customFieldDefs,
  existingPositions,
  onSubmit,
}: PositionOverlayProps) {
  const isEdit = Boolean(position)
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: { name: '', departmentId: '', level: '', status: 'active', customFields: {} },
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      position
        ? {
            name: position.name,
            departmentId: position.departmentId,
            level: position.level == null ? '' : String(position.level),
            status: position.status,
            customFields: { ...position.customFields },
          }
        : { name: '', departmentId: '', level: '', status: 'active', customFields: {} }
    )
  }, [open, position, form])

  function handleSubmit(values: PositionFormValues) {
    const level = values.level === '' ? null : Number(values.level)
    // Same name may repeat across departments/levels, but an exact
    // name+department+level duplicate is flagged (POS-19/43).
    const duplicate = existingPositions.some(
      (p) =>
        p.id !== position?.id &&
        p.companyId === companyId &&
        p.departmentId === values.departmentId &&
        p.level === level &&
        p.name.trim().toLowerCase() === values.name.trim().toLowerCase()
    )
    if (duplicate) {
      form.setError('name', {
        message: 'This position already exists in that department at the same level',
      })
      return
    }
    // Keep only custom fields that were actually filled in; blanks are
    // simply "not set" rather than stored as empty strings.
    const customFields: Record<string, string> = {}
    for (const [key, value] of Object.entries(values.customFields)) {
      const trimmed = value?.trim()
      if (trimmed) customFields[key] = trimmed
    }
    onSubmit({
      name: values.name.trim(),
      companyId,
      departmentId: values.departmentId,
      level,
      status: values.status,
      customFields,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit ${position?.id}` : 'New position'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {isEdit && (
                <p className='text-paragraph-sm text-neutral-1000'>
                  Position ID <span className='font-mono'>{position?.id}</span>{' '}
                  is system-generated and cannot change. Edits are historized
                  with effective dates.
                </p>
              )}

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Developer' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='departmentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (exactly one)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select a department' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
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
                name='level'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. 1, 2, 3 — leave blank if untiered' {...field} />
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
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {customFieldDefs.length > 0 && (
                <div className='space-y-4 border-t pt-4'>
                  <p className='text-paragraph-sm text-neutral-1600 font-medium'>
                    Custom fields (tenant-configured)
                  </p>
                  {customFieldDefs.map((def) => (
                    <FormField
                      key={def.id}
                      control={form.control}
                      name={`customFields.${def.id}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{def.label}</FormLabel>
                          {def.type === 'select' && def.options ? (
                            <Select
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger variant='secondary' className='w-full'>
                                  <SelectValue placeholder={`Select ${def.label.toLowerCase()}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {def.options.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input
                                placeholder={def.label}
                                value={field.value ?? ''}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>{isEdit ? 'Save changes' : 'Create position'}</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
