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
import { type LeaveType } from '../data/leave-types'
import { EMPLOYEES } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'

const overrideSchema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  typeId: z.string().min(1, 'Select a leave type'),
  newCredited: z
    .string()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid amount'),
  reason: z.string().min(10, 'A mandatory reason (min 10 chars) is required to override'),
})

type OverrideValues = z.infer<typeof overrideSchema>

interface OverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balances: BalancesStore
  leaveTypes: LeaveType[]
}

/**
 * Administrative override (LVE-07): any balance can be overridden, but never
 * without a reason — saving writes a full audit-trail entry (LVE-08).
 */
export function OverrideDialog({
  open,
  onOpenChange,
  balances,
  leaveTypes,
}: OverrideDialogProps) {
  const form = useForm<OverrideValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: { employeeId: '', typeId: '', newCredited: '', reason: '' },
  })

  const submit = (v: OverrideValues) => {
    balances.overrideBalance(v.employeeId, v.typeId, Number(v.newCredited), v.reason)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override leave balance</DialogTitle>
          <DialogDescription>
            Any rule or balance can be overridden. A reason is mandatory — the
            override takes effect immediately and is written to the immutable
            audit trail with actor, timestamp and before/after values.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='employeeId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select employee' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMPLOYEES.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.code}){!e.selfService && ' · non-user'}
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
              name='typeId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger variant='secondary' className='w-full'>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
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
              name='newCredited'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New credited entitlement</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.5' placeholder='e.g. 20' {...field} />
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
                  <FormLabel>Mandatory reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Required — the override cannot be saved without it'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit'>Apply override</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
