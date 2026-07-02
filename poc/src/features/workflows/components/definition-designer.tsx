import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash, Warning } from 'phosphor-react'
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
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { WorkflowDefinition } from '../data/definitions'
import {
  APPROVAL_PATTERNS,
  ESCALATION_LABELS,
  ESCALATION_STRATEGIES,
  PATTERN_LABELS,
  PEOPLE,
  ROLE_HOLDERS,
  TRANSACTION_TYPES,
} from '../data/shared'
import type { BusinessCalendar } from '../data/sla'
import type { DefinitionDraft } from '../hooks/use-definitions'

/**
 * Metadata-driven workflow designer (WFE-01, WFE-06, WFE-25): stages with
 * sequential / parallel patterns, approver chains, escalation strategy and
 * per-stage SLAs. Drafts may be incomplete; publishing is validation-gated.
 */
const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  pattern: z.enum(APPROVAL_PATTERNS),
  approvers: z.array(z.string()),
  escalation: z.enum(ESCALATION_STRATEGIES),
  escalationTarget: z.string(),
  slaHours: z.string().regex(/^\d*$/, 'Hours must be a whole number'),
})

const designerSchema = z.object({
  name: z.string().min(2, 'Workflow name is required'),
  transactionType: z.enum(TRANSACTION_TYPES),
  company: z.string().min(1, 'Select a company'),
  effectiveFrom: z.string().min(1, 'Effective-from date is required'),
  calendarId: z.string().min(1, 'Select a business-hour calendar'),
  stages: z.array(stageSchema).min(1, 'Add at least one stage'),
})

type DesignerValues = z.infer<typeof designerSchema>

const ESCALATION_TARGETS = [
  'Reporting manager',
  ...Object.keys(ROLE_HOLDERS),
  ...PEOPLE,
]

const emptyStage: DesignerValues['stages'][number] = {
  name: '',
  pattern: 'sequential',
  approvers: [],
  escalation: 'manager',
  escalationTarget: 'Reporting manager',
  slaHours: '24',
}

interface DefinitionDesignerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, edits this definition (publish supersedes it as a new version). */
  definition?: WorkflowDefinition | null
  companies: string[]
  calendars: BusinessCalendar[]
  /** Returns validation errors — empty array means the save succeeded. */
  onSubmit: (draft: DefinitionDraft, publish: boolean) => string[]
}

export function DefinitionDesigner({
  open,
  onOpenChange,
  definition,
  companies,
  calendars,
  onSubmit,
}: DefinitionDesignerProps) {
  const isEdit = Boolean(definition)
  const [publishErrors, setPublishErrors] = useState<string[]>([])

  const form = useForm<DesignerValues>({
    resolver: zodResolver(designerSchema),
    defaultValues: {
      name: '',
      transactionType: TRANSACTION_TYPES[0],
      company: companies[0] ?? '',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      calendarId: calendars[0]?.id ?? 'cal-ist',
      stages: [emptyStage],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'stages',
  })

  useEffect(() => {
    if (!open) return
    setPublishErrors([])
    form.reset(
      definition
        ? {
            name: definition.name,
            transactionType: definition.transactionType,
            company: definition.company,
            effectiveFrom: definition.effectiveFrom,
            calendarId: definition.calendarId,
            stages: definition.stages.map((s) => ({
              name: s.name,
              pattern: s.pattern,
              approvers: [...s.approvers],
              escalation: s.escalation,
              escalationTarget: s.escalationTarget,
              slaHours: String(s.slaHours),
            })),
          }
        : {
            name: '',
            transactionType: TRANSACTION_TYPES[0],
            company: companies[0] ?? '',
            effectiveFrom: new Date().toISOString().slice(0, 10),
            calendarId: calendars[0]?.id ?? 'cal-ist',
            stages: [emptyStage],
          }
    )
  }, [open, definition, form, companies, calendars])

  function toDraft(values: DesignerValues): DefinitionDraft {
    return {
      name: values.name,
      transactionType: values.transactionType,
      company: values.company,
      effectiveFrom: values.effectiveFrom,
      calendarId: values.calendarId,
      stages: values.stages.map((s, i) => ({
        id: definition?.stages[i]?.id ?? `st-${i + 1}`,
        name: s.name,
        pattern: s.pattern,
        approvers: s.approvers,
        escalation: s.escalation,
        escalationTarget: s.escalationTarget,
        slaHours: Number(s.slaHours || 0),
      })),
    }
  }

  function save(values: DesignerValues, publish: boolean) {
    const errors = onSubmit(toDraft(values), publish)
    setPublishErrors(errors)
    if (errors.length === 0) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit
              ? `Edit workflow — publishing creates v${(definition?.version ?? 1) + 1}`
              : 'New workflow definition'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => save(v, true))}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {publishErrors.length > 0 && (
                <div className='rounded-md border border-red-300 bg-red-50 px-3 py-2'>
                  <div className='mb-1 flex items-center gap-1.5 text-sm font-medium text-red-700'>
                    <Warning size={14} weight='fill' />
                    Activation blocked until every required element is defined
                  </div>
                  <ul className='list-disc space-y-0.5 pl-5 text-sm text-red-700'>
                    {publishErrors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow name</FormLabel>
                    <FormControl>
                      <Input placeholder='Leave Approval — Standard' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='transactionType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRANSACTION_TYPES.map((t) => (
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
                <FormField
                  control={form.control}
                  name='company'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company scope</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((c) => (
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
              </div>

              <div className='grid grid-cols-2 gap-4'>
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
                  name='calendarId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business-hour calendar</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {calendars.map((c) => (
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
              </div>

              <Separator />

              <div className='flex items-center justify-between'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  Approval stages ({fields.length})
                </span>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => append(emptyStage)}
                >
                  <Plus size={12} weight='bold' />
                  Add stage
                </Button>
              </div>

              {fields.map((stageField, index) => (
                <div
                  key={stageField.id}
                  className='space-y-3 rounded-md border border-gray-200 bg-white p-3'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-neutral-1000 text-xs font-semibold uppercase'>
                      Stage {index + 1}
                    </span>
                    <Button
                      type='button'
                      variant='icon2'
                      className='text-neutral-1900 h-6 w-6'
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      aria-label={`Remove stage ${index + 1}`}
                    >
                      <Trash size={14} weight='bold' />
                    </Button>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <FormField
                      control={form.control}
                      name={`stages.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stage name</FormLabel>
                          <FormControl>
                            <Input placeholder='Manager Review' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`stages.${index}.pattern`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approval pattern</FormLabel>
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
                              {APPROVAL_PATTERNS.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {PATTERN_LABELS[p]}
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
                    name={`stages.${index}.approvers`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approver chain (ordered)</FormLabel>
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

                  <div className='grid grid-cols-3 gap-3'>
                    <FormField
                      control={form.control}
                      name={`stages.${index}.escalation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escalation</FormLabel>
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
                              {ESCALATION_STRATEGIES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {ESCALATION_LABELS[s]}
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
                      name={`stages.${index}.escalationTarget`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escalates to</FormLabel>
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
                              {ESCALATION_TARGETS.map((t) => (
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
                    <FormField
                      control={form.control}
                      name={`stages.${index}.slaHours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SLA (business hrs)</FormLabel>
                          <FormControl>
                            <Input inputMode='numeric' placeholder='24' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              <p className='text-neutral-1000 text-xs'>
                Publishing creates a new effective-dated version; in-flight
                requests continue on the version they started with. SLA
                reminders fire at 50% / 75% and escalation at 100% on the
                selected business-hour calendar.
              </p>
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={form.handleSubmit((v) => save(v, false))}
              >
                Save draft
              </Button>
              <Button type='submit'>Validate &amp; publish</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
