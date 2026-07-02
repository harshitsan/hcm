import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { remaining } from '../data/balances'
import { type LeaveType } from '../data/leave-types'
import { DEPARTMENTS, EMPLOYEES } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { StatusBadge } from './badges'

const adjustmentSchema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  typeId: z.string().min(1, 'Select a leave type'),
  delta: z
    .string()
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) !== 0,
      'Adjustment must be a non-zero number'
    ),
  reason: z.string().min(5, 'A reason is required for adjustments'),
})

type AdjustmentValues = z.infer<typeof adjustmentSchema>

interface AdjustmentsPanelProps {
  balances: BalancesStore
  leaveTypes: LeaveType[]
  /** Whether the viewer can approve adjustments (adjustment approver). */
  canDecide: boolean
}

/**
 * Pending Time Off Adjustments (LVE-43): create, filter and decide balance
 * adjustments routed via the adjustment-approver flow (LVE-42).
 */
export function AdjustmentsPanel({
  balances,
  leaveTypes,
  canDecide,
}: AdjustmentsPanelProps) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [deptFilter, setDeptFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const form = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { employeeId: '', typeId: '', delta: '1', reason: '' },
  })

  const rows = useMemo(
    () =>
      balances.adjustments.filter(
        (a) =>
          (statusFilter === 'all' || a.status === statusFilter) &&
          (deptFilter === 'all' || a.department === deptFilter)
      ),
    [balances.adjustments, deptFilter, statusFilter]
  )

  const submit = (v: AdjustmentValues) => {
    const emp = EMPLOYEES.find((e) => e.id === v.employeeId)
    const type = leaveTypes.find((t) => t.id === v.typeId)
    if (!emp || !type) return
    const bal = balances.balanceFor(emp.id, type.id)
    balances.requestAdjustment({
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.code,
      department: emp.department,
      employeeClass: emp.employeeClass,
      typeId: type.id,
      typeName: type.name,
      delta: Number(v.delta),
      currentBalance: bal ? remaining(bal) : 0,
      reason: v.reason,
    })
    setCreateOpen(false)
    form.reset()
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Pending Time Off Adjustments ({rows.length})
        </h2>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='pending'>Pending with me</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='all'>All</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='red'
            onClick={() => setCreateOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Adjustment
          </Button>
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Class</th>
              <th className='px-2 font-medium'>Leave type</th>
              <th className='px-2 font-medium'>Adjusted time off</th>
              <th className='px-2 font-medium'>Current balance</th>
              <th className='px-2 font-medium'>Modified balance</th>
              <th className='px-2 font-medium'>Status</th>
              {canDecide && <th className='px-2 text-right font-medium'>Action</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className='text-neutral-1000 py-6 text-center'>
                  No adjustments match the selected filters.
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr key={a.id} className='border-b last:border-0'>
                <td className='py-2 pr-3'>
                  <div className='font-medium'>{a.employeeName}</div>
                  <div className='text-neutral-1000 text-xs'>
                    {a.employeeCode} · {a.department} · by {a.requestedBy}
                  </div>
                </td>
                <td className='px-2'>{a.employeeClass}</td>
                <td className='px-2'>{a.typeName}</td>
                <td className='px-2'>
                  <span className={a.delta < 0 ? 'text-red-1400' : 'text-green-1300'}>
                    {a.delta > 0 ? `+${a.delta}` : a.delta}
                  </span>
                </td>
                <td className='px-2'>{a.currentBalance}</td>
                <td className='px-2 font-medium'>{a.currentBalance + a.delta}</td>
                <td className='px-2'>
                  <StatusBadge status={a.status} />
                </td>
                {canDecide && (
                  <td className='px-2 text-right'>
                    {a.status === 'pending' && (
                      <span className='inline-flex gap-1'>
                        <Button
                          className='h-6 px-2 text-xs'
                          onClick={() => balances.decideAdjustment(a.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant='outline'
                          className='text-destructive h-6 px-2 text-xs'
                          onClick={() => balances.decideAdjustment(a.id, false)}
                        >
                          Reject
                        </Button>
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New time-off adjustment</DialogTitle>
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
                        {EMPLOYEES.filter((e) => e.active).map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} ({e.code})
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
                        {leaveTypes
                          .filter((t) => t.active)
                          .map((t) => (
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
                name='delta'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment (+/- in the type’s unit)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.5' {...field} />
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
                      <Input placeholder='Why is the balance being corrected?' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Create adjustment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
