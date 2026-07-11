import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { type DocumentType } from '../data/masters'
import { NOTIFY_ROLE_OPTIONS } from '../data/receipts'
import { type ReceiptDraft } from '../hooks/use-receipts'

const receiptFormSchema = z
  .object({
    employeeName: z.string().min(2, 'Employee name is required'),
    employeeCode: z.string().min(1, 'Employee code is required'),
    documentType: z.string().min(1, 'Select a document type'),
    documentName: z.string().min(2, 'Document name is required'),
    dateOfIssuance: z.string().min(1, 'Date of issuance is required'),
    expiryDate: z.string(),
    country: z.string().min(1, 'Country is required'),
    state: z.string().min(1, 'State is required'),
    issueAuthority: z.string().min(1, 'Issue authority is required'),
    notificationRequired: z.boolean(),
    notifyBeforeDays: z.string(),
    peopleToNotify: z.array(z.string()),
    extraEmailIds: z.string(),
    hasPhysicalCopy: z.boolean(),
    custodianComments: z.string(),
    expectedDateOfReturn: z.string(),
    returnReminderRequired: z.boolean(),
    returnReminderDaysBefore: z.string(),
  })
  .refine(
    (v) =>
      !v.notificationRequired ||
      (Number.isInteger(Number(v.notifyBeforeDays)) &&
        Number(v.notifyBeforeDays) > 0),
    {
      message: 'Enter how many days before expiry to notify',
      path: ['notifyBeforeDays'],
    }
  )
  .refine(
    (v) => !v.notificationRequired || v.peopleToNotify.length > 0,
    {
      message: 'Pick at least one role to notify',
      path: ['peopleToNotify'],
    }
  )
  .refine(
    (v) =>
      !v.returnReminderRequired ||
      (Number.isInteger(Number(v.returnReminderDaysBefore)) &&
        Number(v.returnReminderDaysBefore) > 0),
    {
      message: 'Enter how many days before the return date to remind',
      path: ['returnReminderDaysBefore'],
    }
  )
  .refine((v) => !v.returnReminderRequired || Boolean(v.expectedDateOfReturn), {
    message: 'Set the expected date of return to enable the reminder',
    path: ['expectedDateOfReturn'],
  })

type ReceiptFormValues = z.infer<typeof receiptFormSchema>

const emptyDraft: ReceiptFormValues = {
  employeeName: '',
  employeeCode: '',
  documentType: '',
  documentName: '',
  dateOfIssuance: '',
  expiryDate: '',
  country: '',
  state: '',
  issueAuthority: '',
  notificationRequired: false,
  notifyBeforeDays: '',
  peopleToNotify: [],
  extraEmailIds: '',
  hasPhysicalCopy: false,
  custodianComments: '',
  expectedDateOfReturn: '',
  returnReminderRequired: false,
  returnReminderDaysBefore: '',
}

interface RecordReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentTypes: DocumentType[]
  onSubmit: (draft: ReceiptDraft) => void
}

/**
 * Record a document handed over to the custodian: issuance metadata, the
 * expiry-notification block (revealed when notification is required), the
 * physical-copy flag, and the expected-return reminder.
 */
export function RecordReceiptDialog({
  open,
  onOpenChange,
  documentTypes,
  onSubmit,
}: RecordReceiptDialogProps) {
  const [fileName, setFileName] = useState('')

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    setFileName('')
    form.reset(emptyDraft)
  }, [open, form])

  const notificationRequired = form.watch('notificationRequired')
  const returnReminderRequired = form.watch('returnReminderRequired')

  function handleSubmit(values: ReceiptFormValues) {
    onSubmit({
      employeeName: values.employeeName,
      employeeCode: values.employeeCode,
      documentType: values.documentType,
      documentName: values.documentName,
      dateOfIssuance: values.dateOfIssuance,
      expiryDate: values.expiryDate || undefined,
      country: values.country,
      state: values.state,
      issueAuthority: values.issueAuthority,
      notificationRequired: values.notificationRequired,
      notifyBeforeDays: values.notificationRequired
        ? Number(values.notifyBeforeDays)
        : undefined,
      peopleToNotify: values.notificationRequired
        ? values.peopleToNotify
        : undefined,
      extraEmailIds:
        values.notificationRequired && values.extraEmailIds
          ? values.extraEmailIds
          : undefined,
      uploadedFileName: fileName || undefined,
      hasPhysicalCopy: values.hasPhysicalCopy,
      custodianComments: values.custodianComments || undefined,
      expectedDateOfReturn: values.expectedDateOfReturn || undefined,
      returnReminderRequired: values.returnReminderRequired,
      returnReminderDaysBefore: values.returnReminderRequired
        ? Number(values.returnReminderDaysBefore)
        : undefined,
    })
    onOpenChange(false)
  }

  const textField = (
    name: 'employeeName' | 'employeeCode' | 'documentName' | 'country' | 'state' | 'issueAuthority',
    label: string,
    placeholder: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Record document receipt
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <div className='grid grid-cols-2 gap-3'>
                {textField('employeeName', 'Employee name', 'e.g. Ravi Menon')}
                {textField('employeeCode', 'Employee code', 'e.g. MRT-0042')}
              </div>

              <FormField
                control={form.control}
                name='documentType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((t) => (
                          <SelectItem key={t.id} value={t.name}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {textField(
                'documentName',
                'Document name',
                'e.g. Passport — R8814327 (Original)'
              )}

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='dateOfIssuance'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of issuance</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='expiryDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry date (optional)</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                {textField('country', 'Country', 'e.g. India')}
                {textField('state', 'State', 'e.g. Tamil Nadu')}
              </div>

              {textField(
                'issueAuthority',
                'Issue authority',
                'e.g. Regional Passport Office, Chennai'
              )}

              <FormField
                control={form.control}
                name='notificationRequired'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2 space-y-0'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>
                      Expiry notification required
                    </FormLabel>
                  </FormItem>
                )}
              />

              {notificationRequired && (
                <div className='border-gray-200 space-y-4 rounded-[6px] border px-3 py-3'>
                  <FormField
                    control={form.control}
                    name='notifyBeforeDays'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notify before (days)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={1}
                            placeholder='e.g. 30'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='peopleToNotify'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>People to notify</FormLabel>
                        <div className='flex flex-wrap gap-2'>
                          {NOTIFY_ROLE_OPTIONS.map((roleOption) => {
                            const picked = field.value.includes(roleOption)
                            return (
                              <button
                                key={roleOption}
                                type='button'
                                onClick={() =>
                                  field.onChange(
                                    picked
                                      ? field.value.filter(
                                          (r) => r !== roleOption
                                        )
                                      : [...field.value, roleOption]
                                  )
                                }
                                title={
                                  picked
                                    ? 'Notified — click to remove'
                                    : 'Click to notify'
                                }
                              >
                                <Badge
                                  variant={picked ? 'completed' : 'pending'}
                                >
                                  {roleOption}
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
                    name='extraEmailIds'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extra email ids (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='comma-separated email addresses'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className='space-y-1.5'>
                <Label htmlFor='receipt-file'>
                  Scanned copy{' '}
                  <span className='text-paragraph-sm text-neutral-1000 font-normal'>
                    (optional)
                  </span>
                </Label>
                <Input
                  id='receipt-file'
                  type='file'
                  onChange={(e) =>
                    setFileName(e.target.files?.[0]?.name ?? '')
                  }
                />
              </div>

              <FormField
                control={form.control}
                name='hasPhysicalCopy'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <div className='flex flex-row items-center gap-2'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                      </FormControl>
                      <FormLabel className='font-normal'>
                        Physical copy received by custodian
                      </FormLabel>
                    </div>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Receipts with a physical copy in custody cannot be
                      deleted — the original must be returned to the employee
                      first.
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='custodianComments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custodian comments (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder='Why the document is being held'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='expectedDateOfReturn'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected date of return (optional)</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {returnReminderRequired && (
                  <FormField
                    control={form.control}
                    name='returnReminderDaysBefore'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remind before (days)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={1}
                            placeholder='e.g. 5'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name='returnReminderRequired'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2 space-y-0'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>
                      Remind me before the expected date of return
                    </FormLabel>
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
              <Button type='submit'>Record receipt</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
