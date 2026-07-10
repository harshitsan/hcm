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
import {
  CHANNEL_LABELS,
  EMPLOYEES,
  todayIso,
  type Channel,
  type HrDocument,
} from '../data/hr-letters'

const distributeSchema = z
  .object({
    channel: z.enum(['email', 'in-app', 'print', 'handover']),
    ccRecipients: z.array(z.string()),
    handedOverBy: z.string(),
    handoverDate: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.channel === 'handover') {
      if (values.handedOverBy.trim().length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['handedOverBy'],
          message: 'Record who handed the document over',
        })
      }
      if (!values.handoverDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['handoverDate'],
          message: 'Record the handover date',
        })
      }
    }
  })

type DistributeValues = z.infer<typeof distributeSchema>

export interface DistributeOptions {
  ccRecipients?: string[]
  handedOverBy?: string
  handoverDate?: string
}

interface DistributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: HrDocument
  onDistribute: (channel: Channel, options: DistributeOptions) => void
}

/**
 * Distribution/send flow (HLC-08/09/21): pick a channel — including physical
 * "Handover to employee" with who/when captured — and optionally CC other
 * employees on the communication. CC names are stored on the distribution
 * record and shown in the document's distribution history.
 */
export function DistributeDialog({
  open,
  onOpenChange,
  doc,
  onDistribute,
}: DistributeDialogProps) {
  const form = useForm<DistributeValues>({
    resolver: zodResolver(distributeSchema),
    defaultValues: {
      channel: 'email',
      ccRecipients: [],
      handedOverBy: 'Lakshmi Rao (Company Admin)',
      handoverDate: todayIso(),
    },
  })

  useEffect(() => {
    if (open)
      form.reset({
        channel: 'email',
        ccRecipients: [],
        handedOverBy: 'Lakshmi Rao (Company Admin)',
        handoverDate: todayIso(),
      })
  }, [open, form])

  const channel = form.watch('channel')
  const ccChoices = EMPLOYEES.filter((e) => e.id !== doc.employeeId)

  function handleSubmit(values: DistributeValues) {
    onDistribute(values.channel, {
      ccRecipients: values.ccRecipients.length ? values.ccRecipients : undefined,
      handedOverBy:
        values.channel === 'handover' ? values.handedOverBy.trim() : undefined,
      handoverDate:
        values.channel === 'handover' ? values.handoverDate : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Distribute document</DialogTitle>
          <DialogDescription>
            {doc.docType} — {doc.employeeName}. Delivery outcome is tracked per
            channel; CC'd employees are recorded on the distribution.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='channel'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as Channel)}
                  >
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(CHANNEL_LABELS) as Channel[]).map((ch) => (
                        <SelectItem
                          key={ch}
                          value={ch}
                          disabled={ch === 'in-app' && !doc.employeeHasAppAccess}
                        >
                          {CHANNEL_LABELS[ch]}
                          {ch === 'in-app' && !doc.employeeHasAppAccess
                            ? ' — no app access'
                            : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {channel === 'handover' && (
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='handedOverBy'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handed over by</FormLabel>
                      <FormControl>
                        <Input placeholder='Name of the person' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='handoverDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handover date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name='ccRecipients'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CC other employees (optional)</FormLabel>
                  <div className='max-h-40 space-y-1 overflow-y-auto rounded-[6px] border border-gray-200 p-2'>
                    {ccChoices.map((emp) => (
                      <label
                        key={emp.id}
                        className='flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-neutral-100'
                      >
                        <Checkbox
                          variant='blue'
                          checked={field.value.includes(emp.name)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, emp.name]
                                : field.value.filter((n) => n !== emp.name)
                            )
                          }
                        />
                        <span className='text-sm'>
                          {emp.name}
                          <span className='text-neutral-1000'>
                            {' '}
                            — {emp.position}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
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
                {channel === 'handover'
                  ? 'Record handover'
                  : `Send via ${CHANNEL_LABELS[channel].toLowerCase()}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
