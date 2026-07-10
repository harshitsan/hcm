import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Trash } from 'phosphor-react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type LeaveType } from '../data/leave-types'
import {
  EMPLOYEES,
  daySpan,
  employeeById,
  fmtDate,
  shortId,
} from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'

interface StagedRequest {
  key: string
  employeeId: string
  employeeName: string
  typeId: string
  typeName: string
  balance: number
  from: string
  to: string
  days: number
  document: string
  reason: string
  autoApprove: boolean
  approverName: string
}

interface AutoTarget {
  employeeId: string
  typeId: string
  from: string
  approver: string
}

interface BulkRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestsStore: LeaveRequestsStore
  balancesStore: BalancesStore
  leaveTypes: LeaveType[]
}

/**
 * Bulk Employee Time Off Request (Time Off Assignment Mass Update): stage
 * time off requests for multiple employees and submit them at once. Rows with
 * the "Approver" checkbox (name + document mandatory) are auto-approved —
 * approval levels are advanced automatically once the request is created.
 */
export function BulkRequestDialog({
  open,
  onOpenChange,
  requestsStore,
  balancesStore,
  leaveTypes,
}: BulkRequestDialogProps) {
  const [employeeId, setEmployeeId] = useState('')
  const [approverChecked, setApproverChecked] = useState(false)
  const [approverName, setApproverName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [document, setDocument] = useState('')
  const [reason, setReason] = useState('')
  const [rows, setRows] = useState<StagedRequest[]>([])
  // Auto-approval queue: filled on submit, drained by the effect below.
  const [autoTargets, setAutoTargets] = useState<AutoTarget[]>([])
  const approveAttempts = useRef<Record<string, number>>({})

  const employee = employeeById(employeeId)
  // Pointer 3: only the employee's applicable time off types.
  const applicableTypes = useMemo(
    () =>
      leaveTypes.filter(
        (t) =>
          t.active &&
          (!employee || !t.excludedLevels.includes(employee.positionLevel))
      ),
    [employee, leaveTypes]
  )
  const balance =
    employeeId && typeId ? balancesStore.remainingFor(employeeId, typeId) : 0
  const days = from && to && from <= to ? daySpan(from, to) : 0

  /**
   * Drains the auto-approval queue: each pass approves the current pending
   * level of every matching request; re-runs as the store updates until no
   * pending step remains (max 3 approve calls per request).
   */
  useEffect(() => {
    if (autoTargets.length === 0) return
    const remaining: AutoTarget[] = []
    for (const target of autoTargets) {
      const req = requestsStore.requests.find(
        (r) =>
          r.employeeId === target.employeeId &&
          r.typeId === target.typeId &&
          r.from === target.from &&
          r.status === 'pending'
      )
      if (!req) continue // fully approved (or gone) — drop the target
      const attempts = approveAttempts.current[req.id] ?? 0
      if (attempts >= 3) continue // safety valve — stop advancing
      approveAttempts.current[req.id] = attempts + 1
      requestsStore.approve(req.id, false)
      remaining.push(target)
    }
    if (remaining.length !== autoTargets.length) setAutoTargets(remaining)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestsStore.requests, autoTargets])

  const resetEntry = () => {
    setEmployeeId('')
    setApproverChecked(false)
    setApproverName('')
    setTypeId('')
    setFrom('')
    setTo('')
    setDocument('')
    setReason('')
  }

  const addRow = () => {
    const emp = employeeById(employeeId)
    const type = applicableTypes.find((t) => t.id === typeId)
    if (!emp || !type) {
      toast.error('Select an employee and an applicable time off type')
      return
    }
    if (!from || !to || from > to) {
      toast.error('Select a valid period (from/to)')
      return
    }
    if (reason.trim().length < 5) {
      toast.error('Enter a reason for the time off')
      return
    }
    if (approverChecked && !approverName.trim()) {
      toast.error('Enter the approver name to auto-approve this request')
      return
    }
    if (approverChecked && !document.trim()) {
      toast.error(
        'A supporting document is mandatory when the approver checkbox is selected'
      )
      return
    }
    if (requestsStore.hasOverlap(emp.id, from, to)) {
      toast.error(
        `${emp.name} already has an active request overlapping this period`
      )
      return
    }
    if (rows.some((r) => r.employeeId === emp.id && from <= r.to && r.from <= to)) {
      toast.error('A staged row for this employee already covers this period')
      return
    }
    setRows((prev) => [
      ...prev,
      {
        key: shortId('breq'),
        employeeId: emp.id,
        employeeName: emp.name,
        typeId: type.id,
        typeName: type.name,
        balance,
        from,
        to,
        days,
        document: document.trim(),
        reason: reason.trim(),
        autoApprove: approverChecked,
        approverName: approverName.trim(),
      },
    ])
    toast.info('Record added to the bulk time off request grid')
    resetEntry()
  }

  const submit = () => {
    if (rows.length === 0) {
      toast.error('Add at least one record to the grid before submitting')
      return
    }
    const newTargets: AutoTarget[] = []
    for (const r of rows) {
      requestsStore.submit({
        employeeId: r.employeeId,
        typeId: r.typeId,
        from: r.from,
        to: r.to,
        fromTime: null,
        toTime: null,
        amount: r.days,
        lopAmount: 0,
        reason: r.reason,
        tentative: false,
        tentativeReason: null,
        notifyPeers: [],
        notifyEmails: [],
        fmlaQualifyingReason: null,
        attachments: r.document ? [r.document] : [],
        onBehalfOf: r.autoApprove
          ? `Bulk mass update (approver: ${r.approverName})`
          : 'Bulk mass update',
      })
      if (r.autoApprove) {
        newTargets.push({
          employeeId: r.employeeId,
          typeId: r.typeId,
          from: r.from,
          approver: r.approverName,
        })
      }
    }
    if (newTargets.length > 0) setAutoTargets((prev) => [...prev, ...newTargets])
    const autoCount = newTargets.length
    if (autoCount === rows.length) {
      toast.success(
        'Bulk time off request submitted — time off has been assigned and approved for selected employees'
      )
    } else if (autoCount === 0) {
      toast.success(
        'Bulk time off request submitted — assigned to selected employees and pending approval per configuration'
      )
    } else {
      toast.success(
        `Bulk time off request submitted — ${autoCount} auto-approved by the named approver, ${rows.length - autoCount} pending approval per configuration`
      )
    }
    setRows([])
    resetEntry()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Create Bulk Time Off Requests</DialogTitle>
          <DialogDescription>
            Assign time offs to multiple employees at once. Checking “Approver”
            auto-approves the request (approver name + document mandatory).
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-3'>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>Employee name</span>
            <Select
              value={employeeId}
              onValueChange={(v) => {
                setEmployeeId(v)
                setTypeId('')
              }}
            >
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select employee' />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES.filter((e) => e.active).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>Time off type</span>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                {applicableTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {employeeId && typeId && (
              <span className='text-neutral-1000 block text-xs'>
                Balance time offs: {balance}
              </span>
            )}
          </label>

          <div className='col-span-2 space-y-1 text-sm'>
            <label className='flex items-center gap-2'>
              <Checkbox
                checked={approverChecked}
                onCheckedChange={(v) => setApproverChecked(!!v)}
                variant='blue'
              />
              <span className='font-medium'>
                Approver (auto-approve — otherwise the configured approval
                process applies)
              </span>
            </label>
            {approverChecked && (
              <Input
                placeholder='Approver name (mandatory)'
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
              />
            )}
          </div>

          <label className='space-y-1 text-sm'>
            <span className='font-medium'>Period — from</span>
            <Input type='date' value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>Period — to</span>
            <Input type='date' value={to} onChange={(e) => setTo(e.target.value)} />
          </label>

          <div className='text-neutral-1000 space-y-1 text-sm'>
            <span className='font-medium'>No. of days</span>
            <div className='rounded-[6px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs'>
              {days || '—'}
            </div>
          </div>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>
              Document{approverChecked ? ' (mandatory)' : ''}
            </span>
            <Input
              placeholder='e.g. trip-approval.pdf'
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </label>
          <label className='col-span-2 space-y-1 text-sm'>
            <span className='font-medium'>Reason for time off</span>
            <Input
              placeholder='Reason applied to this record'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        </div>

        <div className='flex justify-end'>
          <Button type='button' variant='outline' onClick={addRow}>
            Add
          </Button>
        </div>

        <div className='rounded-[6px] border border-gray-200'>
          <table className='w-full text-xs'>
            <thead>
              <tr className='text-neutral-1000 border-b bg-gray-50 text-left'>
                <th className='px-2 py-1.5 font-medium'>Employee</th>
                <th className='px-2 py-1.5 font-medium'>Type</th>
                <th className='px-2 py-1.5 font-medium'>Period</th>
                <th className='px-2 py-1.5 font-medium'>Days</th>
                <th className='px-2 py-1.5 font-medium'>Balance</th>
                <th className='px-2 py-1.5 font-medium'>Approver</th>
                <th className='px-2 py-1.5 font-medium'>Reason</th>
                <th className='px-2 py-1.5' />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className='text-neutral-1000 px-2 py-4 text-center'>
                    No records added yet — fill the form above and click “Add”.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.key} className='border-b last:border-0'>
                  <td className='px-2 py-1.5 font-medium'>{r.employeeName}</td>
                  <td className='px-2 py-1.5'>{r.typeName}</td>
                  <td className='px-2 py-1.5'>
                    {fmtDate(r.from)} – {fmtDate(r.to)}
                  </td>
                  <td className='px-2 py-1.5'>{r.days}</td>
                  <td className='px-2 py-1.5'>{r.balance}</td>
                  <td className='px-2 py-1.5'>
                    {r.autoApprove
                      ? `${r.approverName} (auto-approval advanced by approver)`
                      : 'Configured flow'}
                  </td>
                  <td className='px-2 py-1.5'>{r.reason}</td>
                  <td className='px-2 py-1.5 text-right'>
                    <Button
                      variant='ghost'
                      className='h-6 px-1.5'
                      onClick={() =>
                        setRows((prev) => prev.filter((x) => x.key !== r.key))
                      }
                    >
                      <Trash size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='button' onClick={submit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
