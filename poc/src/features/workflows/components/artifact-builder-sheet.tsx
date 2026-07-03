import { useEffect } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash } from 'phosphor-react'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  ALERT_CHANNELS,
  APPROVER_STEP_ROLES,
  ARTIFACT_TYPES,
  ARTIFACT_TYPE_LABELS,
  FIELD_TYPE_LABELS,
  FORM_FIELD_TYPES,
  RULE_OPERATORS,
  RULE_OUTCOMES,
  TARGET_MODULES,
  type Artifact,
  type ArtifactDefinition,
} from '../data/business-logic'
import type { ArtifactDraft } from '../hooks/use-business-logic'

/**
 * Artifact builder (WFE-44, WFE-45, WFE-46): pick a target module, an
 * artifact type and a name, then define the type-appropriate payload — steps
 * for chains, condition rows + outcome for rules, typed fields for forms,
 * items for checklists, a body for templates, trigger + channels for alerts,
 * key/value for settings. Only the active type's section is validated.
 */
const builderSchema = z
  .object({
    name: z.string().min(2, 'Artifact name is required'),
    description: z.string(),
    type: z.enum(ARTIFACT_TYPES),
    targetModule: z.enum(TARGET_MODULES),
    steps: z.array(
      z.object({ approverRole: z.string(), slaHours: z.string() })
    ),
    conditions: z.array(
      z.object({
        attribute: z.string(),
        operator: z.enum(RULE_OPERATORS),
        value: z.string(),
      })
    ),
    outcome: z.string(),
    fields: z.array(
      z.object({
        label: z.string(),
        fieldType: z.enum(FORM_FIELD_TYPES),
        required: z.boolean(),
        options: z.string(),
      })
    ),
    items: z.array(z.object({ label: z.string(), mandatory: z.boolean() })),
    body: z.string(),
    trigger: z.string(),
    channels: z.array(z.string()),
    key: z.string(),
    value: z.string(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })
    switch (v.type) {
      case 'approver-chain':
        if (v.steps.length === 0) issue(['steps'], 'Add at least one approval step')
        v.steps.forEach((s, i) => {
          if (!s.approverRole)
            issue(['steps', i, 'approverRole'], 'Select an approver role')
          if (!/^\d+$/.test(s.slaHours))
            issue(['steps', i, 'slaHours'], 'Whole hours required')
        })
        break
      case 'decision-rule':
        if (v.conditions.length === 0)
          issue(['conditions'], 'Add at least one condition')
        v.conditions.forEach((c, i) => {
          if (!c.attribute)
            issue(['conditions', i, 'attribute'], 'Attribute is required')
          if (!c.value) issue(['conditions', i, 'value'], 'Value is required')
        })
        if (!v.outcome) issue(['outcome'], 'Select an outcome')
        break
      case 'custom-form':
        if (v.fields.length === 0) issue(['fields'], 'Add at least one field')
        v.fields.forEach((f, i) => {
          if (!f.label) issue(['fields', i, 'label'], 'Field label is required')
          if (f.fieldType === 'select' && !f.options.trim())
            issue(['fields', i, 'options'], 'List at least one option')
        })
        break
      case 'checklist':
        if (v.items.length === 0) issue(['items'], 'Add at least one item')
        v.items.forEach((it, i) => {
          if (!it.label) issue(['items', i, 'label'], 'Item label is required')
        })
        break
      case 'template':
        if (!v.body.trim()) issue(['body'], 'Template body is required')
        break
      case 'alert':
        if (!v.trigger.trim()) issue(['trigger'], 'Trigger event is required')
        if (v.channels.length === 0)
          issue(['channels'], 'Pick at least one channel')
        break
      case 'setting':
        if (!v.key.trim()) issue(['key'], 'Setting key is required')
        if (!v.value.trim()) issue(['value'], 'Setting value is required')
        break
    }
  })

type BuilderValues = z.infer<typeof builderSchema>

const emptyValues: BuilderValues = {
  name: '',
  description: '',
  type: 'approver-chain',
  targetModule: TARGET_MODULES[0],
  steps: [{ approverRole: '', slaHours: '24' }],
  conditions: [{ attribute: '', operator: '=', value: '' }],
  outcome: '',
  fields: [{ label: '', fieldType: 'text', required: false, options: '' }],
  items: [{ label: '', mandatory: true }],
  body: '',
  trigger: '',
  channels: [],
  key: '',
  value: '',
}

function toValues(artifact: Artifact): BuilderValues {
  const values: BuilderValues = {
    ...emptyValues,
    name: artifact.name,
    description: artifact.description,
    type: artifact.type,
    targetModule: artifact.targetModule,
  }
  const def = artifact.definition
  switch (def.kind) {
    case 'approver-chain':
      values.steps = def.steps.map((s) => ({
        approverRole: s.approverRole,
        slaHours: String(s.slaHours),
      }))
      break
    case 'decision-rule':
      values.conditions = def.conditions.map((c) => ({ ...c }))
      values.outcome = def.outcome
      break
    case 'custom-form':
      values.fields = def.fields.map((f) => ({
        label: f.label,
        fieldType: f.fieldType,
        required: f.required,
        options: (f.options ?? []).join(', '),
      }))
      break
    case 'checklist':
      values.items = def.items.map((it) => ({ ...it }))
      break
    case 'template':
      values.body = def.body
      break
    case 'alert':
      values.trigger = def.trigger
      values.channels = [...def.channels]
      break
    case 'setting':
      values.key = def.key
      values.value = def.value
      break
  }
  return values
}

function toDefinition(values: BuilderValues): ArtifactDefinition {
  switch (values.type) {
    case 'approver-chain':
      return {
        kind: 'approver-chain',
        steps: values.steps.map((s, i) => ({
          order: i + 1,
          approverRole: s.approverRole,
          slaHours: Number(s.slaHours || 0),
        })),
      }
    case 'decision-rule':
      return {
        kind: 'decision-rule',
        conditions: values.conditions.map((c) => ({ ...c })),
        outcome:
          RULE_OUTCOMES.find((o) => o === values.outcome) ?? RULE_OUTCOMES[0],
      }
    case 'custom-form':
      return {
        kind: 'custom-form',
        fields: values.fields.map((f) => ({
          label: f.label,
          fieldType: f.fieldType,
          required: f.required,
          options:
            f.fieldType === 'select'
              ? f.options
                  .split(',')
                  .map((o) => o.trim())
                  .filter(Boolean)
              : undefined,
        })),
      }
    case 'checklist':
      return { kind: 'checklist', items: values.items.map((it) => ({ ...it })) }
    case 'template':
      return { kind: 'template', body: values.body }
    case 'alert':
      return { kind: 'alert', trigger: values.trigger, channels: values.channels }
    case 'setting':
      return { kind: 'setting', key: values.key, value: values.value }
  }
}

export function ArtifactBuilderSheet({
  open,
  onOpenChange,
  artifact,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the sheet edits this artifact (saving bumps its version). */
  artifact?: Artifact | null
  onSave: (draft: ArtifactDraft) => void
}) {
  const isEdit = Boolean(artifact)
  const form = useForm<BuilderValues>({
    resolver: zodResolver(builderSchema),
    defaultValues: emptyValues,
  })

  const steps = useFieldArray({ control: form.control, name: 'steps' })
  const conditions = useFieldArray({ control: form.control, name: 'conditions' })
  const fields = useFieldArray({ control: form.control, name: 'fields' })
  const items = useFieldArray({ control: form.control, name: 'items' })

  useEffect(() => {
    if (!open) return
    form.reset(artifact ? toValues(artifact) : emptyValues)
  }, [open, artifact, form])

  const type = form.watch('type')
  const formErrors = form.formState.errors

  function submit(values: BuilderValues) {
    onSave({
      name: values.name,
      description: values.description,
      type: values.type,
      targetModule: values.targetModule,
      definition: toDefinition(values),
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit
              ? `Edit artifact — saving creates v${(artifact?.version ?? 1) + 1}`
              : 'New business-logic artifact'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artifact name</FormLabel>
                    <FormControl>
                      <Input placeholder='Exit Questionnaire' {...field} />
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
                        placeholder='What this artifact does inside its module'
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artifact type</FormLabel>
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
                          {ARTIFACT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {ARTIFACT_TYPE_LABELS[t]}
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
                  name='targetModule'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target module</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TARGET_MODULES.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
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

              {type === 'approver-chain' && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-neutral-1600 text-sm font-semibold'>
                      Approval steps (in order)
                    </h3>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-7 gap-1 px-2'
                      onClick={() =>
                        steps.append({ approverRole: '', slaHours: '24' })
                      }
                    >
                      <Plus size={12} weight='bold' /> Add step
                    </Button>
                  </div>
                  {formErrors.steps?.message && (
                    <p className='text-destructive text-sm'>
                      {formErrors.steps.message}
                    </p>
                  )}
                  {steps.fields.map((row, i) => (
                    <div
                      key={row.id}
                      className='rounded-md border border-gray-200 bg-white p-3'
                    >
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-neutral-1000 text-xs font-medium'>
                          Step {i + 1}
                        </span>
                        <Button
                          type='button'
                          variant='icon2'
                          className='text-neutral-1900 h-6 w-6'
                          onClick={() => steps.remove(i)}
                          aria-label={`Remove step ${i + 1}`}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <FormField
                          control={form.control}
                          name={`steps.${i}.approverRole`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Approver role</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    variant='secondary'
                                    className='w-full'
                                  >
                                    <SelectValue placeholder='Select role' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {APPROVER_STEP_ROLES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
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
                          name={`steps.${i}.slaHours`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SLA (hours)</FormLabel>
                              <FormControl>
                                <Input
                                  inputMode='numeric'
                                  placeholder='24'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {type === 'decision-rule' && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-neutral-1600 text-sm font-semibold'>
                      Conditions (all must match)
                    </h3>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-7 gap-1 px-2'
                      onClick={() =>
                        conditions.append({
                          attribute: '',
                          operator: '=',
                          value: '',
                        })
                      }
                    >
                      <Plus size={12} weight='bold' /> Add condition
                    </Button>
                  </div>
                  {formErrors.conditions?.message && (
                    <p className='text-destructive text-sm'>
                      {formErrors.conditions.message}
                    </p>
                  )}
                  {conditions.fields.map((row, i) => (
                    <div
                      key={row.id}
                      className='rounded-md border border-gray-200 bg-white p-3'
                    >
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-neutral-1000 text-xs font-medium'>
                          Condition {i + 1}
                        </span>
                        <Button
                          type='button'
                          variant='icon2'
                          className='text-neutral-1900 h-6 w-6'
                          onClick={() => conditions.remove(i)}
                          aria-label={`Remove condition ${i + 1}`}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                      <div className='grid grid-cols-3 gap-3'>
                        <FormField
                          control={form.control}
                          name={`conditions.${i}.attribute`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Attribute</FormLabel>
                              <FormControl>
                                <Input placeholder='workedHours' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`conditions.${i}.operator`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operator</FormLabel>
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
                                  {RULE_OPERATORS.map((op) => (
                                    <SelectItem key={op} value={op}>
                                      {op}
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
                          name={`conditions.${i}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Value</FormLabel>
                              <FormControl>
                                <Input placeholder='8' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <FormField
                    control={form.control}
                    name='outcome'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outcome when the rule matches</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger variant='secondary' className='w-full'>
                              <SelectValue placeholder='Select outcome' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RULE_OUTCOMES.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {type === 'custom-form' && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-neutral-1600 text-sm font-semibold'>
                      Form fields
                    </h3>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-7 gap-1 px-2'
                      onClick={() =>
                        fields.append({
                          label: '',
                          fieldType: 'text',
                          required: false,
                          options: '',
                        })
                      }
                    >
                      <Plus size={12} weight='bold' /> Add field
                    </Button>
                  </div>
                  {formErrors.fields?.message && (
                    <p className='text-destructive text-sm'>
                      {formErrors.fields.message}
                    </p>
                  )}
                  {fields.fields.map((row, i) => (
                    <div
                      key={row.id}
                      className='space-y-3 rounded-md border border-gray-200 bg-white p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='text-neutral-1000 text-xs font-medium'>
                          Field {i + 1}
                        </span>
                        <Button
                          type='button'
                          variant='icon2'
                          className='text-neutral-1900 h-6 w-6'
                          onClick={() => fields.remove(i)}
                          aria-label={`Remove field ${i + 1}`}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <FormField
                          control={form.control}
                          name={`fields.${i}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Label</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Reason for leaving'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`fields.${i}.fieldType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field type</FormLabel>
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
                                  {FORM_FIELD_TYPES.map((ft) => (
                                    <SelectItem key={ft} value={ft}>
                                      {FIELD_TYPE_LABELS[ft]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {form.watch(`fields.${i}.fieldType`) === 'select' && (
                        <FormField
                          control={form.control}
                          name={`fields.${i}.options`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Options (comma separated)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Compensation, Career growth, Other'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name={`fields.${i}.required`}
                        render={({ field }) => (
                          <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                            <FormLabel className='font-normal'>
                              Required field
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
                    </div>
                  ))}
                </div>
              )}

              {type === 'checklist' && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-neutral-1600 text-sm font-semibold'>
                      Checklist items
                    </h3>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-7 gap-1 px-2'
                      onClick={() => items.append({ label: '', mandatory: true })}
                    >
                      <Plus size={12} weight='bold' /> Add item
                    </Button>
                  </div>
                  {formErrors.items?.message && (
                    <p className='text-destructive text-sm'>
                      {formErrors.items.message}
                    </p>
                  )}
                  {items.fields.map((row, i) => (
                    <div
                      key={row.id}
                      className='rounded-md border border-gray-200 bg-white p-3'
                    >
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-neutral-1000 text-xs font-medium'>
                          Item {i + 1}
                        </span>
                        <Button
                          type='button'
                          variant='icon2'
                          className='text-neutral-1900 h-6 w-6'
                          onClick={() => items.remove(i)}
                          aria-label={`Remove item ${i + 1}`}
                        >
                          <Trash size={14} weight='bold' />
                        </Button>
                      </div>
                      <div className='space-y-3'>
                        <FormField
                          control={form.control}
                          name={`items.${i}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Return laptop and access card'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${i}.mandatory`}
                          render={({ field }) => (
                            <FormItem className='flex items-center justify-between rounded-md border border-gray-200 px-3 py-2'>
                              <FormLabel className='font-normal'>
                                Mandatory before completion
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
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {type === 'template' && (
                <FormField
                  control={form.control}
                  name='body'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Template body — merge fields like{' '}
                        {'{{candidate.name}}'} resolve at generation time
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={10}
                          placeholder='Dear {{candidate.name}}, …'
                          className='font-mono text-sm'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {type === 'alert' && (
                <>
                  <FormField
                    control={form.control}
                    name='trigger'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trigger event</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Probation ends in 15 days'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='channels'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery channels</FormLabel>
                        <FormControl>
                          <MultiSelectDropdown
                            items={ALERT_CHANNELS.map((c) => ({
                              id: c,
                              label: c,
                            }))}
                            selectedIds={field.value}
                            onSelectionChange={field.onChange}
                            placeholder='Select channels'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {type === 'setting' && (
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='key'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setting key</FormLabel>
                        <FormControl>
                          <Input placeholder='wfh.maxDaysPerMonth' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='value'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input placeholder='8' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                {isEdit ? `Save as v${(artifact?.version ?? 1) + 1}` : 'Create artifact'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
