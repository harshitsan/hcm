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
import { Textarea } from '@/components/ui/textarea'
import { type AttendanceRecord } from '../data/attendance'
import { employeeName, fmtDate } from '../data/shared'

const overrideSchema = z
  .object({
    punchIn: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    punchOut: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    reason: z.string().min(10, 'A mandatory reason (min 10 characters) is required'),
  })
  .refine((v) => v.punchOut > v.punchIn, {
    message: 'Punch-out must be after punch-in',
    path: ['punchOut'],
  })

type OverrideValues = z.infer<typeof overrideSchema>

interface OverrideDialogProps {
  record: AttendanceRecord | null
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, punchIn: string, punchOut: string, reason: string) => void
}

/**
 * Administrative override (TNA-13): mandatory reason, before/after values
 * captured to an immutable audit trail, downstream hours recomputed.
 */
export function OverrideDialog({
  record,
  onOpenChange,
  onSubmit,
}: OverrideDialogProps) {
  const form = useForm<OverrideValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: { punchIn: '09:00', punchOut: '18:00', reason: '' },
  })

  useEffect(() => {
    if (record) {
      form.reset({
        punchIn: record.punchIn,
        punchOut: record.punchOut ?? '18:00',
        reason: '',
      })
    }
  }, [record, form])

  function handleSubmit(values: OverrideValues) {
    if (!record) return
    onSubmit(record.id, values.punchIn, values.punchOut, values.reason)
    onOpenChange(false)
  }

  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Override attendance record</DialogTitle>
          <DialogDescription>
            {record &&
              `${employeeName(record.employeeId)} · ${fmtDate(record.date)} — current punches ${record.punchIn} → ${record.punchOut ?? 'missing'}. The before/after values, your identity and a timestamp are written to an immutable audit trail.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='punchIn'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New punch-in</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='punchOut'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New punch-out</FormLabel>
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
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mandatory reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Why is this override authorized?'
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
              <Button type='submit'>Apply Override</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
