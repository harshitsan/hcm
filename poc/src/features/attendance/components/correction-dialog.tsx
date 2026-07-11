import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
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
import { type CorrectionKind } from '../data/requests'
import { employeeName } from '../data/shared'
import { type CorrectionDraft } from '../hooks/use-requests'

const KINDS: { value: CorrectionKind; label: string }[] = [
  { value: 'missed-punch', label: 'Missed punch' },
  { value: 'late-arrival', label: 'Late arrival' },
  { value: 'early-exit', label: 'Early exit' },
]

const correctionSchema = z
  .object({
    date: z.string().min(1, 'Pick the attendance date'),
    kind: z.enum(['missed-punch', 'late-arrival', 'early-exit']),
    requestedIn: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    requestedOut: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    justification: z.string().min(10, 'Justification (min 10 characters) is required'),
  })
  .refine((v) => v.requestedOut > v.requestedIn, {
    message: 'Requested out-time must be after in-time',
    path: ['requestedOut'],
  })

type CorrectionValues = z.infer<typeof correctionSchema>

/** Pre-filled values when the dialog is opened from a flagged attendance row. */
export interface CorrectionPrefill {
  date?: string
  kind?: CorrectionKind
  requestedIn?: string
  requestedOut?: string
}

interface CorrectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Employee the correction is for; admins can raise on behalf (TNA-18). */
  employeeId: string
  requestedBy: string
  /** After the payroll cut-off day a second-level approval applies (TNA-43). */
  afterPayrollCutoff: boolean
  onSubmit: (draft: CorrectionDraft) => void
  /** Keep referentially stable (useMemo) — the form resets when it changes. */
  prefill?: CorrectionPrefill
}

/** Attendance exception correction request form (TNA-11). */
export function CorrectionDialog({
  open,
  onOpenChange,
  employeeId,
  requestedBy,
  afterPayrollCutoff,
  onSubmit,
  prefill,
}: CorrectionDialogProps) {
  const form = useForm<CorrectionValues>({
    resolver: zodResolver(correctionSchema),
    defaultValues: {
      date: '2026-07-01',
      kind: 'missed-punch',
      requestedIn: '09:00',
      requestedOut: '18:00',
      justification: '',
    },
  })

  useEffect(() => {
    if (open)
      form.reset({
        date: prefill?.date ?? '2026-07-01',
        kind: prefill?.kind ?? 'missed-punch',
        requestedIn: prefill?.requestedIn ?? '09:00',
        requestedOut: prefill?.requestedOut ?? '18:00',
        justification: '',
      })
  }, [open, form, prefill])

  function handleSubmit(values: CorrectionValues) {
    onSubmit({
      employeeId,
      requestedBy,
      date: values.date,
      kind: values.kind,
      originalIn: values.requestedIn,
      originalOut: values.kind === 'missed-punch' ? null : values.requestedOut,
      requestedIn: values.requestedIn,
      requestedOut: values.requestedOut,
      justification: values.justification,
      afterPayrollCutoff,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Attendance correction request</DialogTitle>
          <DialogDescription>
            For {employeeName(employeeId)} — routed level by level through the
            configured approval flow; unactioned requests escalate after the
            SLA threshold.
            {afterPayrollCutoff &&
              ' Raised after the payroll cut-off: second-level approval will be enforced.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendance date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='kind'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exception type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KINDS.map((k) => (
                          <SelectItem key={k.value} value={k.value}>
                            {k.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='requestedIn'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrected in-time</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='requestedOut'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrected out-time</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='justification'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea placeholder='What happened?' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
