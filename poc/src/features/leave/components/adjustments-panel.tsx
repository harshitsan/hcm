import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Stack } from 'phosphor-react'
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
import { dateOfJoinFor, type Adjustment } from '../data/balances'
import { type LeaveType } from '../data/leave-types'
import { DEPARTMENTS, EMPLOYEES, fmtDate } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { StatusBadge } from './badges'
import { BulkAdjustmentDialog } from './bulk-adjustment-dialog'

const adjustmentSchema = z.object({
  department: z.string().min(1, 'Select a department'),
  employeeId: z.string().min(1, 'Select an employee'),
  typeId: z.string().min(1, 'Select a time off type'),
  sendMail: z.boolean(),
  delta: z
    .string()
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) !== 0,
      'Adjustment must be a non-zero number'
    ),
  reason: z.string().min(5, 'A reason is required for adjustments'),
  document: z.string(),
  comments: z.string(),
  action: z.string().min(1, 'Select an action'),
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
 * adjustments routed via the adjustment-approver flow (LVE-42). The create
 * dialog follows the Adjust Time Off 13-pointer table; the approve flow lets
 * the approver alter the number of time offs before approving; the bulk
 * button opens the Bulk Pending Time Off Adjustments mass update.
 */
export function AdjustmentsPanel({
  balances,
  leaveTypes,
  canDecide,
}: AdjustmentsPanelProps) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [deptFilter, setDeptFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  // Approve Adjusted Time Off: editable delta before final approval.
  const [approveTarget, setApproveTarget] = useState<Adjustment | null>(null)
  const [approveDelta, setApproveDelta] = useState('')

  const form = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      department: '',
      employeeId: '',
      typeId: '',
      sendMail: false,
      delta: '1',
      reason: '',
      document: '',
      comments: '',
      action: 'submit',
    },
  })

  const watched = form.watch(['department', 'employeeId', 'typeId', 'delta'])
  const [department, employeeId, typeId, deltaStr] = watched
  const deptEmployees = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) => e.active && (!department || e.department === department)
      ),
    [department]
  )
  const dateOfJoin = employeeId ? dateOfJoinFor(employeeId) : ''
  const addedThisYear =
    employeeId && typeId
      ? (balances.balanceFor(employeeId, typeId)?.credited ?? 0)
      : 0
  const currentBalance =
    employeeId && typeId ? balances.remainingFor(employeeId, typeId) : 0
  const totalForYear = addedThisYear + (Number(deltaStr) || 0)

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
    balances.requestAdjustment({
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.code,
      department: emp.department,
      employeeClass: emp.employeeClass,
      typeId: type.id,
      typeName: type.name,
      delta: Number(v.delta),
      currentBalance,
      reason: v.reason,
      dateOfJoin: dateOfJoinFor(emp.id),
      sendMailToEmployee: v.sendMail,
      addedThisYear,
      totalForYear: addedThisYear + Number(v.delta),
      documents: v.document.trim() ? [v.document.trim()] : [],
      comments: v.comments.trim(),
    })
    setCreateOpen(false)
    form.reset()
  }

  const confirmApprove = () => {
    if (!approveTarget) return
    const delta = Number(approveDelta)
    if (Number.isNaN(delta) || delta === 0) return
    balances.decideAdjustment(approveTarget.id, true, delta)
    setApproveTarget(null)
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
            variant='outline'
            onClick={() => setBulkOpen(true)}
            className='h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Stack size={10} weight='bold' />
            Bulk pending adjustments
          </Button>
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
              <th className='px-2 font-medium'>Total for year</th>
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
                    {a.employeeCode} · {a.department} · DOJ {fmtDate(a.dateOfJoin)} · by{' '}
                    {a.requestedBy}
                    {a.status === 'approved' && a.approvedBy
                      ? ` · approved by ${a.approvedBy}`
                      : ''}
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
                <td className='px-2 font-medium'>{a.totalForYear}</td>
                <td className='px-2'>
                  <StatusBadge status={a.status} />
                </td>
                {canDecide && (
                  <td className='px-2 text-right'>
                    {a.status === 'pending' && (
                      <span className='inline-flex gap-1'>
                        <Button
                          className='h-6 px-2 text-xs'
                          onClick={() => {
                            setApproveTarget(a)
                            setApproveDelta(String(a.delta))
                          }}
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
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>New time-off adjustment</DialogTitle>
            <DialogDescription>
              Adjust an employee’s time offs against configured benefits — routed
              to the configured credit approvers.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='department'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('employeeId', '')
                      }}
                    >
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select department' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
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
                name='employeeId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee name</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue placeholder='Select employee' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deptEmployees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} ({e.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {employeeId && (
                      <p className='text-neutral-1000 text-xs'>
                        Date of join: {fmtDate(dateOfJoin)}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='typeId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time off type</FormLabel>
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
                name='sendMail'
                render={({ field }) => (
                  <FormItem>
                    <label className='flex items-center gap-2 text-sm'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(!!v)}
                          variant='blue'
                        />
                      </FormControl>
                      Send mail to employee once the adjusted time offs are approved
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='text-neutral-1000 grid grid-cols-3 gap-2 rounded-[6px] border border-gray-200 bg-gray-50 p-2 text-xs'>
                <div>
                  <div className='font-medium'>Time offs added in current year</div>
                  <div>{employeeId && typeId ? addedThisYear : '—'}</div>
                </div>
                <div>
                  <div className='font-medium'>Current time off balance</div>
                  <div>{employeeId && typeId ? currentBalance : '—'}</div>
                </div>
                <div>
                  <div className='font-medium'>Total time offs added for year</div>
                  <div>{employeeId && typeId ? totalForYear : '—'}</div>
                </div>
              </div>
              <FormField
                control={form.control}
                name='delta'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of time offs adjustment (+/-)</FormLabel>
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
              <FormField
                control={form.control}
                name='document'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload documents</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. supporting-doc.pdf' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='comments'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Input placeholder='Coordinator comments (optional)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='action'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actions</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger variant='secondary' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='submit'>Submit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Submit adjustment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Approve Adjusted Time Off — the approver may alter the time offs. */}
      <Dialog
        open={approveTarget !== null}
        onOpenChange={(o) => !o && setApproveTarget(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Approve time-off adjustment</DialogTitle>
            <DialogDescription>
              Alter the time offs to be adjusted (if required) and submit with the
              approve action.
            </DialogDescription>
          </DialogHeader>
          {approveTarget && (
            <div className='space-y-3 text-sm'>
              <div className='text-neutral-1000 rounded-[6px] border border-gray-200 bg-gray-50 p-2 text-xs'>
                <div>
                  <span className='font-medium'>{approveTarget.employeeName}</span> ·{' '}
                  {approveTarget.typeName}
                </div>
                <div>
                  Requested: {approveTarget.delta > 0 ? '+' : ''}
                  {approveTarget.delta} · Current balance {approveTarget.currentBalance}
                </div>
                {approveTarget.comments && <div>Comments: {approveTarget.comments}</div>}
                {approveTarget.documents.length > 0 && (
                  <div>Documents: {approveTarget.documents.join(', ')}</div>
                )}
              </div>
              <label className='block space-y-1'>
                <span className='font-medium'>Number of time offs to adjust</span>
                <Input
                  type='number'
                  step='0.5'
                  value={approveDelta}
                  onChange={(e) => setApproveDelta(e.target.value)}
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setApproveTarget(null)}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={confirmApprove}
              disabled={!approveDelta || Number(approveDelta) === 0}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkAdjustmentDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        balancesStore={balances}
        types={leaveTypes}
      />
    </div>
  )
}
