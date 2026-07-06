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
import { Textarea } from '@/components/ui/textarea'
import type { CustomFieldDef } from '../data/config'
import {
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  HIRING_AS,
  LOCATIONS,
  type Requisition,
} from '../data/requisitions'
import type { RequisitionDraft } from '../hooks/use-requisitions'

const requisitionSchema = z
  .object({
    title: z.string().min(3, 'Position title is required'),
    department: z.enum(DEPARTMENTS),
    location: z.enum(LOCATIONS),
    employeeClass: z.enum(EMPLOYEE_CLASSES),
    // RL-04: hiring type — New Join vs Replacement (reason for the vacancy).
    hiringAs: z.enum(HIRING_AS),
    replacementFor: z.string(),
    headcount: z.coerce.number<number>().int().min(1, 'At least 1 opening'),
    description: z.string().min(10, 'Job description is required'),
    requirements: z.string().min(5, 'Requirements are required'),
    nonBudgeted: z.boolean(),
    closingDate: z.string().min(1, 'Closing date is required'),
    custom: z.record(z.string(), z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.hiringAs === 'Replacement' && !values.replacementFor.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['replacementFor'],
        message: 'Name the employee being replaced',
      })
    }
  })

type RequisitionFormValues = z.infer<typeof requisitionSchema>

const emptyValues: RequisitionFormValues = {
  title: '',
  department: 'Engineering',
  location: 'Bengaluru',
  employeeClass: 'Full-time',
  hiringAs: 'New Join',
  replacementFor: '',
  headcount: 1,
  description: '',
  requirements: '',
  nonBudgeted: false,
  closingDate: '',
  custom: {},
}

interface RequisitionOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition?: Requisition | null
  /** Active tenant custom fields rendered dynamically (TA-26, TA-30). */
  customFields: CustomFieldDef[]
  onSubmit: (draft: RequisitionDraft) => void
}

/** Create/edit requisition sheet (TA-01) with forms-engine custom fields. */
export function RequisitionOverlay({
  open,
  onOpenChange,
  requisition,
  customFields,
  onSubmit,
}: RequisitionOverlayProps) {
  const isEdit = Boolean(requisition)
  const activeCustomFields = customFields.filter(
    (f) => f.entity === 'requisition' && f.active
  )

  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      requisition
        ? {
            title: requisition.title,
            department: requisition.department,
            location: requisition.location,
            employeeClass: requisition.employeeClass,
            hiringAs: requisition.hiringAs,
            replacementFor: requisition.replacementFor ?? '',
            headcount: requisition.headcount,
            description: requisition.description,
            requirements: requisition.requirements,
            nonBudgeted: requisition.nonBudgeted,
            closingDate: requisition.closingDate,
            custom: requisition.custom,
          }
        : emptyValues
    )
  }, [open, requisition, form])

  function handleSubmit(values: RequisitionFormValues) {
    // Forms engine enforces mandatory custom fields from config (TA-30).
    for (const field of activeCustomFields) {
      if (field.mandatory && !values.custom[field.id]) {
        form.setError('custom', {
          message: `"${field.label}" is mandatory`,
        })
        return
      }
    }
    // RL-04: only Replacement requisitions carry the backfilled employee.
    onSubmit({
      ...values,
      replacementFor:
        values.hiringAs === 'Replacement'
          ? values.replacementFor.trim()
          : null,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? `Edit ${requisition?.id}` : 'New job requisition'}
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
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position title</FormLabel>
                    <FormControl>
                      <Input placeholder='Senior Backend Engineer' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='department'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
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
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATIONS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='employeeClass'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee class</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EMPLOYEE_CLASSES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
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
                  name='headcount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headcount</FormLabel>
                      <FormControl>
                        <Input type='number' min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* RL-04: hiring type — reason for the vacancy */}
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='hiringAs'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hiring as</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HIRING_AS.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('hiringAs') === 'Replacement' && (
                  <FormField
                    control={form.control}
                    name='replacementFor'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Replacing employee</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Nikhil Kulkarni (EMP-0231)'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name='closingDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position closing date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
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
                    <FormLabel>Job description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='requirements'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='nonBudgeted'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                        variant='blue'
                      />
                    </FormControl>
                    <FormLabel className='mt-0!'>
                      Non-budgeted position (routes to the extra approver)
                    </FormLabel>
                  </FormItem>
                )}
              />

              {activeCustomFields.length > 0 && (
                <div className='space-y-3 rounded-[8px] border border-gray-200 p-3'>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Custom fields (rendered from config v
                    {Math.max(...activeCustomFields.map((f) => f.version))} — no
                    code change)
                  </p>
                  {activeCustomFields.map((cf) => (
                    <FormField
                      key={cf.id}
                      control={form.control}
                      name='custom'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {cf.label}
                            {cf.mandatory ? ' *' : ''}
                          </FormLabel>
                          {cf.fieldType === 'select' ? (
                            <Select
                              value={field.value[cf.id] ?? ''}
                              onValueChange={(v) =>
                                field.onChange({ ...field.value, [cf.id]: v })
                              }
                            >
                              <FormControl>
                                <SelectTrigger className='w-full'>
                                  <SelectValue placeholder='Select…' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(cf.options ?? []).map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input
                                type={cf.fieldType === 'number' ? 'number' : 'text'}
                                value={field.value[cf.id] ?? ''}
                                onChange={(e) =>
                                  field.onChange({
                                    ...field.value,
                                    [cf.id]: e.target.value,
                                  })
                                }
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

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Save as draft'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
