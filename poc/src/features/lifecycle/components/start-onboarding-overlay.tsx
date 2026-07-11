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
import { Switch } from '@/components/ui/switch'
import { COMPANIES, DEPARTMENTS, LOCATIONS } from '../data/shared'
import { type OnboardingDraft } from '../hooks/use-onboarding'

const schema = z.object({
  employeeName: z.string().min(2, 'Employee name is required'),
  employeeCode: z.string().min(3, 'Employee code is required'),
  department: z.string().min(1, 'Select a department'),
  location: z.string().min(1, 'Select a location'),
  company: z.string().min(1, 'Select a company'),
  portalUser: z.boolean(),
  startDate: z.string().min(1, 'Start date is required'),
})

type FormValues = z.infer<typeof schema>

const emptyDraft: FormValues = {
  employeeName: '',
  employeeCode: '',
  department: 'Engineering',
  location: 'Hyderabad',
  company: 'Aurora Software India',
  portalUser: true,
  startDate: '',
}

interface StartOnboardingOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateVersion: string
  onSubmit: (draft: OnboardingDraft) => void
}

/** Initiates the 5-stage onboarding workflow from the effective template. */
export function StartOnboardingOverlay({
  open,
  onOpenChange,
  templateVersion,
  onSubmit,
}: StartOnboardingOverlayProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (open) form.reset(emptyDraft)
  }, [open, form])

  const selectField = (
    name: 'department' | 'location' | 'company',
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
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Initiate onboarding
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values)
              onOpenChange(false)
            })}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <p className='text-neutral-1000 text-xs'>
                Creates the mandatory stages in order — Offer Acceptance,
                Document Submission, Document Verification, Asset Assignment,
                Induction Completion — from template{' '}
                <span className='font-semibold'>{templateVersion}</span>.
              </p>
              <FormField
                control={form.control}
                name='employeeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New hire name</FormLabel>
                    <FormControl>
                      <Input placeholder='Aditi Sharma' {...field} />
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
                      <Input placeholder='e.g. EMP-2450' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectField('department', 'Department', DEPARTMENTS)}
              {selectField('location', 'Location', LOCATIONS)}
              {selectField('company', 'Company', COMPANIES)}
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='portalUser'
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'>
                    <div>
                      <FormLabel>Portal user</FormLabel>
                      <p className='text-neutral-1000 text-xs'>
                        Off = Employee (Non-User): the admin records offer
                        acceptance and documents on their behalf, and the
                        audit trail captures the proxy.
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
            </div>
            <div className='border-gray-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Initiate onboarding</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
