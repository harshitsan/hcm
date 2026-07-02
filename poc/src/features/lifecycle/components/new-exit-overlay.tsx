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
import { Textarea } from '@/components/ui/textarea'
import { type ExitTypeDef } from '../data/config'
import { DEPARTMENTS, LOCATIONS, POSITION_LEVELS } from '../data/shared'
import { type ExitDraft } from '../hooks/use-exits'

const schema = z.object({
  employeeName: z.string().min(2, 'Employee is required'),
  employeeCode: z.string().min(3, 'Employee code is required'),
  department: z.string().min(1),
  location: z.string().min(1),
  positionLevel: z.string().min(1),
  exitType: z.string().min(1, 'Select a configured exit type'),
  reason: z.string().min(5, 'A reason is required'),
})

type FormValues = z.infer<typeof schema>

interface NewExitOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exitTypes: ExitTypeDef[]
  raisedBy: 'Employee' | 'Admin (proxy)'
  /** Prefill for the self-service portal. */
  defaults?: Partial<FormValues>
  onSubmit: (draft: ExitDraft) => void
}

/**
 * Exit request form. Only configured exit types are selectable; the notice
 * period is derived from the matching scoped notice rule on submission.
 */
export function NewExitOverlay({
  open,
  onOpenChange,
  exitTypes,
  raisedBy,
  defaults,
  onSubmit,
}: NewExitOverlayProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeName: '',
      employeeCode: '',
      department: 'Engineering',
      location: 'Hyderabad',
      positionLevel: 'L1 - Associate',
      exitType: '',
      reason: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      employeeName: defaults?.employeeName ?? '',
      employeeCode: defaults?.employeeCode ?? '',
      department: defaults?.department ?? 'Engineering',
      location: defaults?.location ?? 'Hyderabad',
      positionLevel: defaults?.positionLevel ?? 'L1 - Associate',
      exitType: '',
      reason: '',
    })
  }, [open, defaults, form])

  const selectField = (
    name: 'department' | 'location' | 'positionLevel',
    label: string,
    options: readonly string[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
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
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {raisedBy === 'Employee' ? 'Raise exit request' : 'Record exit request'}
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit({ ...values, raisedBy })
              onOpenChange(false)
            })}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='employeeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Employee name'
                        disabled={raisedBy === 'Employee'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='employeeCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='EMP-0000'
                        disabled={raisedBy === 'Employee'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-3'>
                {selectField('department', 'Department', DEPARTMENTS)}
                {selectField('location', 'Location', LOCATIONS)}
              </div>
              {selectField('positionLevel', 'Position level', POSITION_LEVELS)}
              <FormField
                control={form.control}
                name='exitType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit type (from configured catalog)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select exit type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exitTypes.map((t) => (
                          <SelectItem key={t.id} value={t.name}>
                            {t.name} ({t.category})
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
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Why is this exit happening?' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className='text-neutral-1000 text-xs'>
                Notice period, clearance tasks, offboarding checklist and the
                exit questionnaire are derived from the effective configuration
                when this request is submitted.
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
              <Button type='submit'>Submit exit request</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
