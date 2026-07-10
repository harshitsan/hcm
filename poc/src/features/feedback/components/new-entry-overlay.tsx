import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldAlert } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type CategoryDef, type FormFieldDef } from '../data/config'
import { ENTRY_TYPES } from '../data/entries'
import { type EntryDraft } from '../hooks/use-feedback-entries'
import { EmployeeRolePicker } from './employee-role-picker'

interface NewEntryOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategoryDef[]
  formFields: FormFieldDef[]
  /** Governed "Do you support Anonymous Feedback / Grievance?" (FBG-20/21). */
  anonymousEnabled: boolean
  /** Company Admin may file for an Employee (Non-User) (FBG-08). */
  allowOnBehalf: boolean
  onSubmit: (draft: EntryDraft) => void
}

const baseSchema = z.object({
  type: z.enum(ENTRY_TYPES),
  category: z.string().min(1, 'Select a category'),
  anonymous: z.boolean(),
  onBehalfOf: z.string(),
  details: z.record(z.string(), z.string()),
  sendTo: z.array(z.string()),
  copyTo: z.array(z.string()),
  responseEmails: z.string(),
  comments: z.string(),
})

type EntryFormValues = z.infer<typeof baseSchema>

/**
 * Submission form rendered dynamically from the tenant's configured field
 * schema (FBG-18): categories and fields come from governed config, and
 * config-mandatory fields are enforced at submission (FBG-01/14).
 */
export function NewEntryOverlay({
  open,
  onOpenChange,
  categories,
  formFields,
  anonymousEnabled,
  allowOnBehalf,
  onSubmit,
}: NewEntryOverlayProps) {
  const activeFields = useMemo(
    () => formFields.filter((f) => f.active),
    [formFields]
  )
  const activeCategories = useMemo(
    () => categories.filter((c) => c.active),
    [categories]
  )

  const schema = useMemo(
    () =>
      baseSchema.superRefine((values, ctx) => {
          for (const field of activeFields) {
            if (field.required && !values.details[field.id]?.trim()) {
              ctx.addIssue({
                code: 'custom',
                path: ['details', field.id],
                message: `${field.label} is required`,
              })
            }
          }
        }),
    [activeFields]
  )

  const emptyValues = useMemo<EntryFormValues>(
    () => ({
      type: 'Feedback',
      category: '',
      anonymous: false,
      onBehalfOf: '',
      details: Object.fromEntries(activeFields.map((f) => [f.id, ''])),
      sendTo: [],
      copyTo: [],
      responseEmails: '',
      comments: '',
    }),
    [activeFields]
  )

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, emptyValues, form])

  const anonymous = form.watch('anonymous')
  const type = form.watch('type')

  function handleSubmit(values: EntryFormValues) {
    onSubmit({
      type: values.type,
      category: values.category,
      details: values.details,
      anonymous: values.anonymous,
      onBehalfOf: values.onBehalfOf.trim() ? values.onBehalfOf.trim() : null,
      sendTo: values.sendTo,
      copyTo: values.copyTo,
      responseEmails: values.anonymous
        ? values.responseEmails
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      comments: values.comments.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New feedback / grievance entry
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
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className='flex items-center gap-6'
                      >
                        {ENTRY_TYPES.map((t) => (
                          <label
                            key={t}
                            className='flex items-center gap-2 text-sm'
                          >
                            <RadioGroupItem value={t} />
                            {t}
                            <span className='text-neutral-1000 text-xs'>
                              {t === 'Feedback'
                                ? '— share feedback on anything'
                                : '— raise a grievance'}
                            </span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (from tenant configuration)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select a category' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeCategories.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activeFields.map((fieldDef) => (
                <FormField
                  key={fieldDef.id}
                  control={form.control}
                  name={`details.${fieldDef.id}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {fieldDef.label}
                        {fieldDef.required ? ' *' : ''}
                        {fieldDef.custom ? (
                          <span className='text-neutral-1000 text-xs font-normal'>
                            (custom field)
                          </span>
                        ) : null}
                      </FormLabel>
                      <FormControl>
                        {fieldDef.type === 'textarea' ? (
                          <Textarea rows={3} {...field} />
                        ) : (
                          <Input
                            type={fieldDef.type === 'date' ? 'date' : 'text'}
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Send to / Copy to via the Employee-or-Role picker with the
                  Applicable location → Roles → Employees cascade. */}
              <FormField
                control={form.control}
                name='sendTo'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EmployeeRolePicker
                        label='Send to'
                        value={field.value}
                        onChange={field.onChange}
                        hint='Choose Employee for specific employee(s) or Role to address a role in the organization. Leave empty to use the configured receivers.'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='copyTo'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EmployeeRolePicker
                        label='Copy to'
                        value={field.value}
                        onChange={field.onChange}
                        hint='Tip: employees marked "Copy to" can only see the response but cannot submit a response.'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='comments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder='Enter the comments (if any)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {anonymousEnabled && (
                <FormField
                  control={form.control}
                  name='anonymous'
                  render={({ field }) => (
                    <FormItem className='border-grey-200 flex items-center justify-between rounded-[6px] border px-3 py-2'>
                      <div>
                        <FormLabel>Submit anonymously</FormLabel>
                        <p className='text-paragraph-sm text-neutral-1000'>
                          Your identity is withheld from receivers and
                          reviewers; you track the entry via an anonymous
                          reference.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {anonymous && (
                <FormField
                  control={form.control}
                  name='responseEmails'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send response to emails</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Comma-separated email ids for the response'
                          {...field}
                        />
                      </FormControl>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        Responses to this anonymous entry are sent to these
                        addresses without linking them to your identity.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {allowOnBehalf && (
                <FormField
                  control={form.control}
                  name='onBehalfOf'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        On behalf of (Employee — Non-User, optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Sanjay Patel (warehouse operative)'
                          {...field}
                        />
                      </FormControl>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        The audit trail will record that this entry was filed
                        on the employee's behalf.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(type === 'Grievance' || anonymous) && (
                <div className='bg-blue-150 text-blue-1400 flex items-start gap-2 rounded-[6px] px-3 py-2 text-sm'>
                  <ShieldAlert className='mt-0.5 size-4 shrink-0' />
                  <span>
                    {type === 'Grievance'
                      ? 'Grievance details are confidential — visible only to the authorized receiver roles configured by your company. '
                      : ''}
                    {anonymous
                      ? 'Anonymous submissions route to the dedicated anonymous receiver roles.'
                      : ''}
                  </span>
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
              <Button type='submit'>Submit entry</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
