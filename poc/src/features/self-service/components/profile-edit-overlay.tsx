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
import { Input } from '@/components/ui/input'
import { type ProfileField } from '../data/profile'

/**
 * Forms-engine style single-field editor (ESS-16): the schema, input type and
 * validation rules all come from the field's metadata configuration, and
 * approval-required fields are routed through the workflow engine (ESS-15).
 */
function schemaFor(field: ProfileField) {
  let rule: z.ZodType<string, string>
  if (field.inputType === 'email') {
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
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    <Input
                      type={field.inputType === 'date' ? 'date' : field.inputType}
                      {...rhf}
                    />
                  </FormControl>
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
