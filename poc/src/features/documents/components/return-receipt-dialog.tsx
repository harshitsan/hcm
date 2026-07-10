import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CUSTODIAN_TODAY,
  type DocumentReceipt,
  type ReceiptReturnDetails,
  type ReturnType,
} from '../data/receipts'

const returnFormSchema = z
  .object({
    returnType: z.enum(['Temporary', 'Permanent']),
    expectedDateOfSubmission: z.string(),
    collectReminderRequired: z.boolean(),
    collectReminderDaysBefore: z.string(),
    comments: z.string(),
  })
  .refine(
    (v) => v.returnType === 'Permanent' || Boolean(v.expectedDateOfSubmission),
    {
      message: 'Set when the employee must submit the document back',
      path: ['expectedDateOfSubmission'],
    }
  )
  .refine(
    (v) =>
      v.returnType === 'Permanent' ||
      !v.collectReminderRequired ||
      (Number.isInteger(Number(v.collectReminderDaysBefore)) &&
        Number(v.collectReminderDaysBefore) > 0),
    {
      message: 'Enter how many days before submission to remind',
      path: ['collectReminderDaysBefore'],
    }
  )

type ReturnFormValues = z.infer<typeof returnFormSchema>

const emptyDraft: ReturnFormValues = {
  returnType: 'Temporary',
  expectedDateOfSubmission: '',
  collectReminderRequired: false,
  collectReminderDaysBefore: '',
  comments: '',
}

interface ReturnReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: DocumentReceipt | null
  onSubmit: (details: ReceiptReturnDetails) => void
}

/**
 * Return a held document to its employee. Temporary returns capture the
 * expected date of submission back to the custodian plus an optional
 * collect reminder; permanent returns close out custody.
 */
export function ReturnReceiptDialog({
  open,
  onOpenChange,
  receipt,
  onSubmit,
}: ReturnReceiptDialogProps) {
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: emptyDraft,
  })

  useEffect(() => {
    if (!open) return
    form.reset(emptyDraft)
  }, [open, form])

  const returnType = form.watch('returnType')
  const collectReminderRequired = form.watch('collectReminderRequired')

  function handleSubmit(values: ReturnFormValues) {
    const temporary = values.returnType === 'Temporary'
    onSubmit({
      returnType: values.returnType,
      returnedOn: CUSTODIAN_TODAY,
      expectedDateOfSubmission: temporary
        ? values.expectedDateOfSubmission
        : undefined,
      collectReminderRequired: temporary
        ? values.collectReminderRequired
        : undefined,
      collectReminderDaysBefore:
        temporary && values.collectReminderRequired
          ? Number(values.collectReminderDaysBefore)
          : undefined,
      comments: values.comments || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>Return to employee</DialogTitle>
          <DialogDescription>
            {receipt
              ? `${receipt.documentName} — ${receipt.employeeName} (${receipt.employeeCode})`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='returnType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as ReturnType)}
                  >
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Temporary'>
                        Temporary — employee must submit it back
                      </SelectItem>
                      <SelectItem value='Permanent'>
                        Permanent — custody closed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {returnType === 'Temporary' && (
              <div className='border-grey-200 space-y-4 rounded-[6px] border px-3 py-3'>
                <FormField
                  control={form.control}
                  name='expectedDateOfSubmission'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected date of submission</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='collectReminderRequired'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center gap-2 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                      </FormControl>
                      <FormLabel className='font-normal'>
                        Remind me to collect the document back
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {collectReminderRequired && (
                  <FormField
                    control={form.control}
                    name='collectReminderDaysBefore'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remind before (days)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={1}
                            placeholder='e.g. 3'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name='comments'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder='Why the document is being returned'
                      {...field}
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
              <Button type='submit'>Return document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
