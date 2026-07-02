import { useEffect, useMemo } from 'react'
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
import { type AssetCategoryConfig } from '../data/config'
import { SELF_EMPLOYEE_ID, employeeName, type Employee } from '../data/org'
import { type RequisitionDraft } from '../hooks/use-requisitions'

interface RequisitionFormOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: AssetCategoryConfig[]
  /** Admin mode: pick any workforce member — incl. non-users (ASM-42). */
  adminMode: boolean
  employees: Employee[]
  onSubmit: (draft: RequisitionDraft) => void
}

/**
 * Raise an asset requisition (ASM-27): requested asset, quantity and a
 * to-be-returned-before date. Required fields block submission; Company
 * Admins can raise on behalf of Employee (Non-User) members (ASM-42).
 */
export function RequisitionFormOverlay({
  open,
  onOpenChange,
  categories,
  adminMode,
  employees,
  onSubmit,
}: RequisitionFormOverlayProps) {
  const schema = useMemo(
    () =>
      z.object({
        requesterId: z.string().min(1, 'Select the employee this requisition is for'),
        assetName: z.string().min(2, 'Requested asset is required'),
        category: z.string().min(1, 'Category is required'),
        quantity: z.coerce
          .number<number>()
          .int('Quantity must be a whole number')
          .min(1, 'Requested quantity must be at least 1'),
        returnBefore: z.string().min(1, 'To-be-returned-before date is required'),
      }),
    []
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requesterId: adminMode ? '' : SELF_EMPLOYEE_ID,
      assetName: '',
      category: '',
      quantity: 1,
      returnBefore: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      requesterId: adminMode ? '' : SELF_EMPLOYEE_ID,
      assetName: '',
      category: '',
      quantity: 1,
      returnBefore: '',
    })
  }, [open, adminMode, form])

  function handleSubmit(values: FormValues) {
    onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {adminMode ? 'New requisition (on behalf)' : 'New asset requisition'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='flex min-h-0 flex-1 flex-col'>
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              {adminMode ? (
                <FormField
                  control={form.control}
                  name='requesterId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requester (workforce member)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger variant='secondary' className='w-full'>
                            <SelectValue placeholder='Select employee' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} · {e.department}
                              {e.hasSystemAccess ? '' : ' (non-user)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <p className='text-paragraph-sm text-neutral-1000'>
                  Requester: <span className='text-neutral-1600 font-medium'>{employeeName(SELF_EMPLOYEE_ID)}</span>{' '}
                  — a requisition number is generated on submit and the request starts as
                  Pending Approval.
                </p>
              )}

              <FormField
                control={form.control}
                name='assetName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested asset</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Dell UltraSharp 27" Monitor' {...field} />
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
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter((c) => c.active)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='quantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested quantity</FormLabel>
                      <FormControl>
                        <Input type='number' min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='returnBefore'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To be returned before</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='border-grey-200 flex items-center justify-end gap-3 border-t px-5 py-4'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>Submit requisition</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
