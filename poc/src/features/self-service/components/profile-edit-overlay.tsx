import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type ProfileField } from '../data/profile'

/**
 * Forms-engine style single-field editor (ESS-16): the schema, input type and
 * validation rules all come from the field's metadata configuration, and
 * approval-required fields are routed through the workflow engine (ESS-15).
 */
function schemaFor(field: ProfileField) {
  let rule: z.ZodType<string, string>
  if (field.inputType === 'checkbox') {
    // Checkbox values are stored as Yes/No; mandatory means it must be ticked.
    rule = field.required
      ? z.string().refine((v) => v === 'Yes', `${field.label} must be checked`)
      : z.string()
  } else if (
    field.inputType === 'dropdown' ||
    field.inputType === 'radio'
  ) {
    rule = z
      .string()
      .min(1, `Select ${field.label.toLowerCase()}`)
      .refine(
        (v) => (field.options ?? []).includes(v),
        'Choose one of the configured options'
      )
  } else if (field.inputType === 'email') {
    rule = z.email('Enter a valid email address')
  } else {
    let stringRule = z.string().min(1, `${field.label} is required`)
    if (field.minLength) {
      stringRule = stringRule.min(
        field.minLength,
        `${field.label} must be at least ${field.minLength} characters`
      )
    }
    if (field.pattern) {
      stringRule = stringRule.regex(
        new RegExp(field.pattern),
        field.patternMessage ?? `Enter a valid ${field.label.toLowerCase()}`
      )
    }
    rule = stringRule
  }
  return z.object({ value: rule })
}

interface ProfileEditOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: ProfileField | null
  currentValue: string
  onSubmit: (field: ProfileField, value: string) => void
}

export function ProfileEditOverlay({
  open,
  onOpenChange,
  field,
  currentValue,
  onSubmit,
}: ProfileEditOverlayProps) {
  const form = useForm<{ value: string }>({
    resolver: field ? zodResolver(schemaFor(field)) : undefined,
    defaultValues: { value: currentValue },
  })

  useEffect(() => {
    if (open) form.reset({ value: currentValue })
  }, [open, currentValue, form])

  if (!field) return null

  const handleSubmit = (values: { value: string }) => {
    onSubmit(field, values.value)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Edit {field.label}
            {field.isUdf && <Badge variant='open'>UDF</Badge>}
          </DialogTitle>
        </DialogHeader>

        {field.approvalRequired && (
          <p className='text-paragraph-sm text-neutral-1000 bg-vanilla-400/40 rounded-[6px] px-3 py-2'>
            Policy marks this field approval-required. Your change will be
            routed through the configured approver graph and the prior value
            stays in effect until approved.
          </p>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='value'
              render={({ field: rhf }) => (
                <FormItem>
                  <FormLabel>
                    {field.label}
                    {field.required && (
                      <span className='text-destructive'>*</span>
                    )}
                  </FormLabel>
                  {field.inputType === 'dropdown' ? (
                    <Select
                      value={rhf.value || undefined}
                      onValueChange={rhf.onChange}
                    >
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select an option' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(field.options ?? []).map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.inputType === 'radio' ? (
                    <FormControl>
                      <RadioGroup
                        value={rhf.value || undefined}
                        onValueChange={rhf.onChange}
                        className='flex flex-wrap gap-x-4 gap-y-1.5 rounded-[6px] border border-gray-200 bg-white px-3 py-2'
                      >
                        {(field.options ?? []).map((o) => (
                          <label
                            key={o}
                            className='flex items-center gap-1.5 text-sm'
                          >
                            <RadioGroupItem value={o} aria-label={o} />
                            {o}
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  ) : field.inputType === 'checkbox' ? (
                    <FormControl>
                      <label className='flex w-fit items-center gap-2 text-sm'>
                        <Checkbox
                          variant='blue'
                          checked={rhf.value === 'Yes'}
                          onCheckedChange={(checked) =>
                            rhf.onChange(checked === true ? 'Yes' : 'No')
                          }
                          aria-label={field.label}
                        />
                        Yes
                      </label>
                    </FormControl>
                  ) : field.inputType === 'textarea' ? (
                    <FormControl>
                      <Textarea rows={3} {...rhf} />
                    </FormControl>
                  ) : (
                    <FormControl>
                      <Input
                        type={
                          field.inputType === 'date' ? 'date' : field.inputType
                        }
                        {...rhf}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {field.approvalRequired ? 'Submit for approval' : 'Save change'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
