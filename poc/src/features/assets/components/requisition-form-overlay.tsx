import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import {
  CustomFieldsSection,
  validateCustomFields,
} from '@/features/custom-fields/components/custom-fields-section'
import { type FieldValue } from '@/features/custom-fields/data/records'
import { type AssetCategoryConfig } from '../data/config'
import { SELF_EMPLOYEE_ID, employeeName, type Employee } from '../data/org'
import { type RequisitionDraft } from '../hooks/use-requisitions'
import { getArtifacts } from '@/features/workflows/hooks/use-business-logic'
import { linkedFlows } from '@/features/workflows/data/flow-links'
import { triggerFormFlows } from '@/features/workflows/hooks/use-flow-runs'

const ASSET_SUBMIT_EVENT = 'Asset requisition submitted'
const ASSET_MODULE = 'Asset Management' as const

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

  // A7: count flow artifacts linked to the Asset Requisition form (hint badge).
  const linkedFlowCount = useMemo(
    () => linkedFlows(getArtifacts(), ASSET_MODULE, ASSET_SUBMIT_EVENT).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  )

  // A6: custom fields for Asset Requisition form.
  const [customValues, setCustomValues] = useState<Record<string, FieldValue>>({})
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({})

  const handleCustomChange = useCallback((fieldId: string, value: FieldValue) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
    setCustomErrors((prev) => {
      if (!prev[fieldId]) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }, [])

  useEffect(() => {
    if (!open) return
    form.reset({
      requesterId: adminMode ? '' : SELF_EMPLOYEE_ID,
      assetName: '',
      category: '',
      quantity: 1,
      returnBefore: '',
    })
    setCustomValues({})
    setCustomErrors({})
  }, [open, adminMode, form])

  function handleSubmit(values: FormValues) {
    // A6: validate custom fields before proceeding.
    const cfErrors = validateCustomFields('Asset Requisition', customValues, 'employee')
    if (Object.keys(cfErrors).length > 0) {
      setCustomErrors(cfErrors)
      toast.error('Please complete the required additional fields')
      return
    }
    onSubmit({ ...values, custom: customValues })
    // A7: trigger any flow artifacts linked to this form.
    const requesterLabel = adminMode
      ? employees.find((e) => e.id === values.requesterId)?.name ?? values.requesterId
      : employeeName(SELF_EMPLOYEE_ID)
    triggerFormFlows({
      module: ASSET_MODULE,
      event: ASSET_SUBMIT_EVENT,
      summary: `${values.assetName} · qty ${values.quantity}`,
      requester: requesterLabel,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <div className='flex items-center gap-3'>
            <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
              {adminMode ? 'New requisition (on behalf)' : 'New asset requisition'}
            </SheetTitle>
            {linkedFlowCount > 0 && (
              <span className='inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700'>
                {linkedFlowCount} flow{linkedFlowCount === 1 ? '' : 's'} will run on submit
              </span>
            )}
          </div>
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

              {/* A6: custom fields targeting the Asset Requisition form. */}
              <CustomFieldsSection
                entity='Asset Requisition'
                values={customValues}
                onChange={handleCustomChange}
                errors={customErrors}
                audience='employee'
              />
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
