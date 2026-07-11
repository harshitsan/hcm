import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { type PolicyDocument } from '../data/masters'
import { DEPARTMENTS, POSITION_LEVELS } from '../data/org'
import { type PolicyDraft } from '../hooks/use-masters'

const policyFormSchema = z
  .object({
    name: z.string().min(2, 'Policy name is required'),
    effectiveFrom: z.string().min(1, 'Effective-from date is required'),
    effectiveTill: z.string(),
    applicability: z.string().min(1, 'Select applicability'),
    excludedPositionLevels: z.array(z.string()),
    content: z.string().min(10, 'Add the policy content (min 10 characters)'),
  })
  .refine(
    (v) => !v.effectiveTill || v.effectiveTill >= v.effectiveFrom,
    {
      message: 'Effective-till must be on or after effective-from',
      path: ['effectiveTill'],
    }
  )

type PolicyFormValues = z.infer<typeof policyFormSchema>

const emptyDraft: PolicyFormValues = {
  name: '',
  effectiveFrom: '',
  effectiveTill: '',
  applicability: 'All employees',
  excludedPositionLevels: [],
  content: '',
}

interface PolicyOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: PolicyDocument | null
  onSubmit: (draft: PolicyDraft) => void
}

/**
 * Publish/edit a policy document (DOC-32) with an effective window,
 * applicability audience, and excluded position levels (DOC-33).
 */
export function PolicyOverlay({
  open,
  onOpenChange,
  policy,
  onSubmit,
}: PolicyOverlayProps) {
  const isEdit = Boolean(policy)
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      policy
        ? {
            name: policy.name,
            effectiveFrom: policy.effectiveFrom,
            effectiveTill: policy.effectiveTill ?? '',
            applicability: policy.applicability,
            excludedPositionLevels: policy.excludedPositionLevels,
            content: policy.content,
          }
        : emptyDraft
    )
  }, [open, policy, form])

  function handleSubmit(values: PolicyFormValues) {
    onSubmit({
      name: values.name,
      effectiveFrom: values.effectiveFrom,
      effectiveTill: values.effectiveTill || null,
      applicability: values.applicability,
      excludedPositionLevels: values.excludedPositionLevels,
      content: values.content,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {isEdit ? 'Edit policy' : 'New policy document'}
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
                    <FormLabel>Policy name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Code of Conduct' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
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
                  name='effectiveTill'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective till (optional)</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='applicability'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicability</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='All employees'>
                          All employees
                        </SelectItem>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d} department
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
                name='excludedPositionLevels'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excluded position levels</FormLabel>
                    <div className='flex flex-wrap gap-2'>
                      {POSITION_LEVELS.map((level) => {
                        const excluded = field.value.includes(level)
                        return (
                          <button
                            key={level}
                            type='button'
                            onClick={() =>
                              field.onChange(
                                excluded
                                  ? field.value.filter((l) => l !== level)
                                  : [...field.value, level]
                              )
                            }
                            title={
                              excluded
                                ? 'Excluded — click to include'
                                : 'Included — click to exclude'
                            }
                          >
                            <Badge variant={excluded ? 'dropped' : 'open'}>
                              {level}
                              {excluded ? ' (excluded)' : ''}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='content'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy content</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder='Full policy text shown in the preview'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {isEdit ? 'Save changes' : 'Publish policy'}
              </Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
