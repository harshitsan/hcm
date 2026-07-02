import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  APPROVER_CATEGORIES,
  CATEGORY_LABELS,
  EXIT_TYPES,
  type ApproverGroup,
} from '../data/approver-groups'
import { DEPARTMENTS, LOCATIONS, PEOPLE } from '../data/shared'
import type { ApproverGroupDraft } from '../hooks/use-approver-groups'

const groupSchema = z.object({
  category: z.enum(APPROVER_CATEGORIES),
  name: z.string().min(2, 'Configuration name is required'),
  locations: z.array(z.string()).min(1, 'Select at least one location'),
  departments: z.array(z.string()),
  approvers: z.array(z.string()).min(1, 'Assign at least one approver'),
  supervisorCapHours: z.string().regex(/^\d*$/, 'Must be a whole number'),
  payrollCutoffDay: z.string().regex(/^\d*$/, 'Must be a day of month'),
  secondLevelAfterCutoff: z.boolean(),
  exitType: z.string(),
  minEmployeesThreshold: z.string().regex(/^\d*$/, 'Must be a whole number'),
  positionLevel: z.string(),
})

type GroupValues = z.infer<typeof groupSchema>

const emptyValues: GroupValues = {
  category: 'overtime',
  name: '',
  locations: [],
  departments: [],
  approvers: [],
  supervisorCapHours: '',
  payrollCutoffDay: '',
  secondLevelAfterCutoff: false,
  exitType: '',
  minEmployeesThreshold: '',
  positionLevel: '',
}

function toValues(group: ApproverGroup): GroupValues {
  return {
    category: group.category,
    name: group.name,
    locations: [...group.locations],
    departments: [...group.departments],
    approvers: [...group.approvers],
    supervisorCapHours:
      group.supervisorCapHours === null ? '' : String(group.supervisorCapHours),
    payrollCutoffDay:
      group.payrollCutoffDay === null ? '' : String(group.payrollCutoffDay),
    secondLevelAfterCutoff: group.secondLevelAfterCutoff,
    exitType: group.exitType ?? '',
    minEmployeesThreshold:
      group.minEmployeesThreshold === null
        ? ''
        : String(group.minEmployeesThreshold),
    positionLevel: group.positionLevel ?? '',
  }
}

function toDraft(values: GroupValues): ApproverGroupDraft {
  return {
    category: values.category,
    name: values.name,
    locations: values.locations,
    departments: values.departments,
    approvers: values.approvers,
    supervisorCapHours: values.supervisorCapHours
      ? Number(values.supervisorCapHours)
      : null,
    payrollCutoffDay: values.payrollCutoffDay
      ? Number(values.payrollCutoffDay)
      : null,
    secondLevelAfterCutoff: values.secondLevelAfterCutoff,
    exitType: values.exitType || null,
    minEmployeesThreshold: values.minEmployeesThreshold
      ? Number(values.minEmployeesThreshold)
      : null,
    positionLevel: values.positionLevel || null,
  }
}

/**
 * Kensium-style approver chain configuration (WFE-27 … WFE-39) with the
 * guided Save & Next flow stepping through each approver category (WFE-42).
 * Category-specific rules (supervisor caps, payroll cutoff + second level,
 * exit type, layoff threshold, position applicability) appear contextually.
 */
export function ApproverGroupSheet({
  open,
  onOpenChange,
  group,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this configuration. */
  group?: ApproverGroup | null
  onSave: (draft: ApproverGroupDraft) => void
}) {
  const isEdit = Boolean(group)
  const form = useForm<GroupValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    form.reset(group ? toValues(group) : emptyValues)
  }, [open, group, form])

  const category = form.watch('category')

  const showCap = category === 'overtime' || category === 'work-from-home'
  const showPayroll = category === 'change-request'
  const showExitType = category === 'exit'
  const showLayoff = category === 'layoff'
  const showPosition =
    category === 'confirmation' || category === 'change-request'

  function submit(values: GroupValues, saveNext: boolean) {
    onSave(toDraft(values))
    if (!saveNext || isEdit) {
      onOpenChange(false)
      return
    }
    const idx = APPROVER_CATEGORIES.indexOf(values.category)
    const next = APPROVER_CATEGORIES[idx + 1]
    if (!next) {
      toast.success(
        'Guided setup complete — all approver categories configured'
      )
      onOpenChange(false)
      return
    }
    form.reset({ ...emptyValues, category: next })
    toast.info(`Saved — next step: ${CATEGORY_LABELS[next]}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit
              ? `Edit ${CATEGORY_LABELS[group?.category ?? 'overtime']}`
              : `New approver configuration — ${CATEGORY_LABELS[category]}`}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => submit(v, false))}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPROVER_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {CATEGORY_LABELS[c]}
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
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration name</FormLabel>
                    <FormControl>
                      <Input placeholder='Chennai Plant OT Chain' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='locations'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable location(s)</FormLabel>
                    <FormControl>
                      <MultiSelectDropdown
                        items={LOCATIONS.map((l) => ({ id: l, label: l }))}
                        selectedIds={field.value}
                        onSelectionChange={field.onChange}
                        placeholder='Select locations'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='departments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department(s) — empty means all</FormLabel>
                    <FormControl>
                      <MultiSelectDropdown
                        items={DEPARTMENTS.map((d) => ({ id: d, label: d }))}
                        selectedIds={field.value}
                        onSelectionChange={field.onChange}
                        placeholder='All departments'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='approvers'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Approver hierarchy (first = immediate approver)
                    </FormLabel>
                    <FormControl>
                      <MultiSelectDropdown
                        items={PEOPLE.map((p) => ({ id: p, label: p }))}
                        selectedIds={field.value}
                        onSelectionChange={field.onChange}
                        placeholder='Assign approvers'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showCap && (
                <FormField
                  control={form.control}
                  name='supervisorCapHours'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Max hours approvable by the immediate supervisor
                      </FormLabel>
                      <FormControl>
                        <Input inputMode='numeric' placeholder='10' {...field} />
                      </FormControl>
                      <p className='text-neutral-1000 text-xs'>
                        Requests beyond this cap escalate to the next approval
                        level automatically.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showPayroll && (
                <>
                  <FormField
                    control={form.control}
                    name='payrollCutoffDay'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payroll-period date of the month</FormLabel>
                        <FormControl>
                          <Input inputMode='numeric' placeholder='25' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='secondLevelAfterCutoff'
                    render={({ field }) => (
                      <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                        <FormLabel className='font-normal'>
                          Second approval level for requests after the payroll
                          date
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {showExitType && (
                <FormField
                  control={form.control}
                  name='exitType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select exit type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXIT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showLayoff && (
                <FormField
                  control={form.control}
                  name='minEmployeesThreshold'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Minimum employees required to initiate a layoff
                      </FormLabel>
                      <FormControl>
                        <Input inputMode='numeric' placeholder='10' {...field} />
                      </FormControl>
                      <p className='text-neutral-1000 text-xs'>
                        Layoffs below this threshold cannot be initiated.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showPosition && (
                <FormField
                  control={form.control}
                  name='positionLevel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position-level applicability</FormLabel>
                      <FormControl>
                        <Input placeholder='IC / Team Lead' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <Button type='submit' variant='outline'>
                {isEdit ? 'Save changes' : 'Save'}
              </Button>
              {!isEdit && (
                <Button
                  type='button'
                  onClick={form.handleSubmit((v) => submit(v, true))}
                >
                  Save &amp; Next
                </Button>
              )}
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
