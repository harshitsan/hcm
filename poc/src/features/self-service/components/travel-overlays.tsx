import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea'
import {
  type AdvanceDraft,
  type ExpenseDraft,
  type TravelDraft,
} from '../hooks/use-travel'
import { TextField } from './form-fields'

interface OverlayProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: T) => void
}

const travelSchema = z
  .object({
    title: z.string().min(5, 'Give the trip a title'),
    destination: z.string().min(2, 'Destination is required'),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    purpose: z.string().min(10, 'Describe the trip purpose'),
    requestedAdvance: z.number().min(0, 'Advance cannot be negative'),
  })
  .refine((v) => v.toDate >= v.fromDate, {
    message: 'Return date must be on or after departure',
    path: ['toDate'],
  })

/** Apply travel request with a requested advance (ESS-26). */
export function TravelRequestOverlay({
  open,
  onOpenChange,
  onSubmit,
}: OverlayProps<TravelDraft>) {
  const form = useForm<z.infer<typeof travelSchema>>({
    resolver: zodResolver(travelSchema),
    defaultValues: {
      title: '',
      destination: '',
      fromDate: '',
      toDate: '',
      purpose: '',
      requestedAdvance: 0,
    },
  })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>Apply travel request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values)
              onOpenChange(false)
            })}
            className='space-y-3'
          >
            <TextField control={form.control} name='title' label='Trip title' />
            <TextField
              control={form.control}
              name='destination'
              label='Destination'
            />
            <div className='grid grid-cols-2 gap-3'>
              <TextField
                control={form.control}
                name='fromDate'
                label='From date'
                type='date'
              />
              <TextField
                control={form.control}
                name='toDate'
                label='To date'
                type='date'
              />
            </div>
            <FormField
              control={form.control}
              name='purpose'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TextField
              control={form.control}
              name='requestedAdvance'
              label='Requested advance (₹)'
              type='number'
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Apply</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const expenseSchema = z.object({
  title: z.string().min(5, 'Give the expense a title'),
  amount: z.number().min(1, 'Amount must be positive'),
  details: z.string().min(5, 'Add supporting details'),
})

/** Submit actual trip expenses (ESS-27). */
export function ExpenseOverlay({
  open,
  onOpenChange,
  onSubmit,
}: OverlayProps<ExpenseDraft>) {
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { title: '', amount: 0, details: '' },
  })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Submit expense</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values)
              onOpenChange(false)
            })}
            className='space-y-3'
          >
            <TextField
              control={form.control}
              name='title'
              label='Expense title'
            />
            <TextField
              control={form.control}
              name='amount'
              label='Amount (₹)'
              type='number'
            />
            <TextField
              control={form.control}
              name='details'
              label='Supporting details'
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Submit expense</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const advanceSchema = z.object({
  title: z.string().min(5, 'Give the advance a title'),
  requestedAdvance: z.number().min(1, 'Requested advance must be positive'),
})

/** Raise an advance expense request before travel (ESS-28). */
export function AdvanceOverlay({
  open,
  onOpenChange,
  onSubmit,
}: OverlayProps<AdvanceDraft>) {
  const form = useForm<z.infer<typeof advanceSchema>>({
    resolver: zodResolver(advanceSchema),
    defaultValues: { title: '', requestedAdvance: 0 },
  })

  useEffect(() => {
    if (open) form.reset()
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Raise advance expense</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values)
              onOpenChange(false)
            })}
            className='space-y-3'
          >
            <TextField
              control={form.control}
              name='title'
              label='Advance title'
            />
            <TextField
              control={form.control}
              name='requestedAdvance'
              label='Requested advance (₹)'
              type='number'
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Raise request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
