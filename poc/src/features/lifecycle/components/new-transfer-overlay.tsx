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
import { COMPANIES, DEPARTMENTS, LOCATIONS } from '../data/shared'
import { TRANSFER_TYPES } from '../data/transfers'
import { type TransferDraft } from '../hooks/use-transfers'

const schema = z
  .object({
    employeeName: z.string().min(2, 'Employee is required'),
    employeeCode: z.string().min(3, 'Employee code is required'),
    type: z.enum(TRANSFER_TYPES),
    fromDepartment: z.string().min(1),
    toDepartment: z.string().min(1),
    fromLocation: z.string().min(1),
    toLocation: z.string().min(1),
    fromCompany: z.string().min(1),
    toCompany: z.string().min(1),
    effectiveDate: z.string().min(1, 'Effective date is required'),
    reason: z.string().min(5, 'Provide a short justification'),
  })
  .refine(
    (v) => v.type !== 'Inter-Department' || v.fromDepartment !== v.toDepartment,
    { message: 'Destination department must differ', path: ['toDepartment'] }
  )
  .refine(
    (v) => v.type !== 'Inter-Location' || v.fromLocation !== v.toLocation,
    { message: 'Destination location must differ', path: ['toLocation'] }
  )
  .refine((v) => v.type !== 'Inter-Company' || v.fromCompany !== v.toCompany, {
    message: 'Destination company must differ',
    path: ['toCompany'],
  })

type FormValues = z.infer<typeof schema>

const emptyDraft: FormValues = {
  employeeName: '',
  employeeCode: '',
  type: 'Inter-Department',
  fromDepartment: 'Engineering',
  toDepartment: 'Operations',
  fromLocation: 'Hyderabad',
  toLocation: 'Hyderabad',
  fromCompany: 'Aurora Software India',
  toCompany: 'Aurora Software India',
  effectiveDate: '',
  reason: '',
}

interface NewTransferOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: TransferDraft) => void
}

/** Transfer request form — the impact assessment runs on submission. */
export function NewTransferOverlay({
  open,
  onOpenChange,
  onSubmit,
}: NewTransferOverlayProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDraft,
  })
  const type = form.watch('type')

  useEffect(() => {
    if (open) form.reset(emptyDraft)
  }, [open, form])

  const selectField = (
    name: keyof FormValues,
    label: string,
    options: readonly string[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={String(field.value)}
            onValueChange={field.onChange}
          >
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
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[500px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New transfer request
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
              <FormField
                control={form.control}
                name='employeeName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <FormControl>
                      <Input placeholder='Employee name' {...field} />
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
                      <Input placeholder='EMP-0000' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectField('type', 'Transfer type', TRANSFER_TYPES)}
              <div className='grid grid-cols-2 gap-3'>
                {selectField('fromDepartment', 'From department', DEPARTMENTS)}
                {selectField('toDepartment', 'To department', DEPARTMENTS)}
                {selectField('fromLocation', 'From location', LOCATIONS)}
                {selectField('toLocation', 'To location', LOCATIONS)}
                {selectField('fromCompany', 'From company', COMPANIES)}
                {selectField('toCompany', 'To company', COMPANIES)}
              </div>
              {type === 'Inter-Company' && (
                <p className='text-neutral-1000 text-xs'>
                  Inter-company transfers add a group-level approval step after
                  company approvals, per the configured approver graph.
                </p>
              )}
              <FormField
                control={form.control}
                name='effectiveDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
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
                      <Textarea placeholder='Business justification' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Submit for approval</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
