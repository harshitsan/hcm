import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
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
import { fmtDate, todayISO } from '../data/shared'
import { type LeaveConfigStore } from '../hooks/use-leave-config'

const delegationSchema = z
  .object({
    from: z.string().min(2, 'Primary approver is required'),
    to: z.string().min(2, 'Delegate is required'),
    fromDate: z.string().min(1, 'Start date required'),
    toDate: z.string().min(1, 'End date required'),
  })
  .refine((v) => v.toDate >= v.fromDate, {
    message: 'End must be on or after start',
    path: ['toDate'],
  })

type DelegationValues = z.infer<typeof delegationSchema>

/**
 * Approval workflows with sequential/parallel levels and per-level SLA +
 * escalation (LVE-04/06), and delegation windows (LVE-05). The shared
 * workflow engine interprets this config at runtime (LVE-24).
 */
export function ConfigWorkflows({ config }: { config: LeaveConfigStore }) {
  const [delegateOpen, setDelegateOpen] = useState(false)
  const form = useForm<DelegationValues>({
    resolver: zodResolver(delegationSchema),
    defaultValues: { from: '', to: '', fromDate: '', toDate: '' },
  })

  const submit = (v: DelegationValues) => {
    config.addDelegation(v)
    setDelegateOpen(false)
    form.reset()
  }

  const today = todayISO()

  return (
    <div className='w-full space-y-4'>
      <div>
        <h2 className='text-neutral-1600 text-paragraph-md mb-3 font-medium'>
          Approval Workflows ({config.workflows.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            interpreted at runtime by the shared workflow engine — no code changes
          </span>
        </h2>
        <div className='grid gap-3 lg:grid-cols-2'>
          {config.workflows.map((wf) => (
            <div key={wf.id} className='rounded-[8px] border border-gray-200 bg-white p-3'>
              <div className='mb-2 text-sm font-medium'>
                {wf.name}
                <span className='text-neutral-1000 ml-2 text-xs'>{wf.appliesTo}</span>
              </div>
              <div className='space-y-1.5'>
                {wf.levels.map((l) => (
                  <div
                    key={l.seq}
                    className='flex items-center justify-between rounded-[6px] border border-gray-100 px-2 py-1.5 text-xs'
                  >
                    <div>
                      <span className='font-medium'>
                        L{l.seq} · {l.name}
                      </span>
                      <span className='text-neutral-1000 ml-1'>
                        {l.approvers.join(', ')}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Badge variant={l.mode === 'parallel' ? 'open' : 'pending'}>
                        {l.mode}
                        {l.mode === 'parallel' && ` · ${l.rule}`}
                      </Badge>
                      <Badge variant='overdue'>
                        SLA {l.slaHours}h → {l.escalateTo}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Approval Delegations
            <span className='text-neutral-1000 ml-2 text-xs'>
              the delegate acts on behalf of the primary for the window; history
              records the delegation
            </span>
          </h2>
          <Button
            variant='red'
            onClick={() => setDelegateOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            New Delegation
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Primary approver</th>
                <th className='px-2 font-medium'>Delegate</th>
                <th className='px-2 font-medium'>Window</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {config.delegations.map((d) => {
                const active = d.fromDate <= today && d.toDate >= today
                return (
                  <tr key={d.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>{d.from}</td>
                    <td className='px-2'>{d.to}</td>
                    <td className='px-2'>
                      {fmtDate(d.fromDate)} → {fmtDate(d.toDate)}
                    </td>
                    <td className='px-2'>
                      <Badge variant={active ? 'badge_active' : 'badge_inactive'}>
                        {active ? 'Active' : 'Ended'}
                      </Badge>
                    </td>
                    <td className='px-2 text-right'>
                      {active && (
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => config.endDelegation(d.id)}
                        >
                          End now
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New delegation</DialogTitle>
            <DialogDescription>
              While the window is active, requests awaiting the primary
              approver can be actioned by the delegate. When it ends, approvals
              revert automatically.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className='space-y-3'>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='from'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary approver</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Rahul Menon' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='to'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delegate</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Sunita Patil' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='fromDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='toDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDelegateOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Save delegation</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
