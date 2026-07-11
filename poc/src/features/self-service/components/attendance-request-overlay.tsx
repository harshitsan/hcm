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
import { ATTENDANCE_REQUEST_KINDS } from '../data/attendance'
import { type AttendanceRequestDraft } from '../hooks/use-attendance'

const requestSchema = z
  .object({
    kind: z.enum(ATTENDANCE_REQUEST_KINDS),
    fromDateTime: z.string().min(1, 'From date-time is required'),
    toDateTime: z.string().min(1, 'To date-time is required'),
    reason: z.string().min(10, 'Give a reason of at least 10 characters'),
  })
  .refine((v) => v.toDateTime > v.fromDateTime, {
    message: 'To must be after From',
    path: ['toDateTime'],
  })

type RequestFormValues = z.infer<typeof requestSchema>

const emptyValues: RequestFormValues = {
  kind: 'Out Time',
  fromDateTime: '',
  toDateTime: '',
  reason: '',
}

interface AttendanceRequestOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: AttendanceRequestDraft) => void
}

/**
 * New out-time / comp-off / overtime / WFH request (ESS-18..21): the number of
 * days and hours is computed from the entered range; comp-off validity is
 * derived per policy (90 days from the worked date).
 */
export function AttendanceRequestOverlay({
  open,
  onOpenChange,
  onSubmit,
}: AttendanceRequestOverlayProps) {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) form.reset(emptyValues)
  }, [open, form])

  const handleSubmit = (values: RequestFormValues) => {
    const from = new Date(values.fromDateTime)
    const to = new Date(values.toDateTime)
    const hours =
      Math.round(((to.getTime() - from.getTime()) / 36e5) * 10) / 10
    const days = Math.round((hours / 9) * 10) / 10
    const expiresOn =
      values.kind === 'Comp Off'
        ? new Date(from.getTime() + 90 * 864e5).toISOString().slice(0, 10)
        : null
    onSubmit({ ...values, hours, days: days >= 1 ? Math.round(days) : 0, expiresOn })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[460px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            New attendance request
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='flex min-h-0 flex-1 flex-col'
          >
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5'>
              <FormField
                control={form.control}
                name='kind'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ATTENDANCE_REQUEST_KINDS.map((kind) => (
                          <SelectItem key={kind} value={kind}>
                            {kind}
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
                name='fromDateTime'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From (date & time)</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='toDateTime'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To (date & time)</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
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
                      <Textarea
                        placeholder='Why do you need this request?'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
              <Button type='submit'>Raise request</Button>
            </div>
          </form>
        </Form>
      </FloatingSheetContent>
    </Sheet>
  )
}
