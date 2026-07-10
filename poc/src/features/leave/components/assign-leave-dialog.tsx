import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { seedLeaveTypes, type LeaveType } from '../data/leave-types'
import { DEPARTMENTS, EMPLOYEES, daySpan } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'

export interface AssignLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestsStore: LeaveRequestsStore
  balancesStore: BalancesStore
  /** Live leave-type catalog; falls back to the seed catalog. */
  leaveTypes?: LeaveType[]
  /** Name recorded as the assigner; falls back to the store's actor. */
  assignedBy?: string
}

/**
 * Assign Time Off (PDF: Assigning Time Off): the reporting manager / HR
 * admin assigns time off on the employee's behalf — department → employee →
 * type with live balance, period with auto-computed duration, reason,
 * message + notify emails and an optional document. The assigned request
 * follows the normal configured approval workflow.
 */
export function AssignLeaveDialog({
  open,
  onOpenChange,
  requestsStore,
  balancesStore,
  leaveTypes = seedLeaveTypes,
  assignedBy,
}: AssignLeaveDialogProps) {
  const [department, setDepartment] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [notifyEmails, setNotifyEmails] = useState('')
  const [docName, setDocName] = useState('')

  const deptEmployees = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) => e.active && (!department || e.department === department)
      ),
    [department]
  )
  const employee = EMPLOYEES.find((e) => e.id === employeeId)
  const selectableTypes = useMemo(
    () =>
      leaveTypes
        .filter(
          (t) =>
            t.active &&
            t.id !== 'lt-lop' &&
            !(employee && t.excludedLevels.includes(employee.positionLevel))
        )
        .sort((a, b) => a.order - b.order),
    [employee, leaveTypes]
  )
  const type = selectableTypes.find((t) => t.id === typeId)
  const balance =
    employeeId && typeId ? balancesStore.remainingFor(employeeId, typeId) : null

  // No. of days/hours auto-populated from the selected period.
  const amount = useMemo(() => {
    if (!from || !to || !type || from > to) return 0
    const days = daySpan(from, to)
    return type.unit === 'hours' ? days * 8 : days
  }, [from, to, type])

  const excess =
    type?.category === 'paid' && balance !== null
      ? Math.max(0, amount - balance)
      : 0

  const reset = () => {
    setDepartment('')
    setEmployeeId('')
    setTypeId('')
    setFrom('')
    setTo('')
    setReason('')
    setMessage('')
    setNotifyEmails('')
    setDocName('')
  }

  const submit = () => {
    if (!employeeId || !type || !from || !to || !reason.trim()) {
      toast.error('Employee, time off type, period and reason are required')
      return
    }
    if (from > to) {
      toast.error('The period is invalid — From must be on or before To')
      return
    }
    if (requestsStore.hasOverlap(employeeId, from, to)) {
      toast.error('These dates overlap an existing request for this employee')
      return
    }
    requestsStore.assign({
      employeeId,
      typeId: type.id,
      from,
      to,
      fromTime: null,
      toTime: null,
      amount,
      lopAmount: excess,
      reason: message.trim()
        ? `${reason.trim()} [Message to employees: ${message.trim()}]`
        : reason.trim(),
      tentative: false,
      tentativeReason: null,
      notifyPeers: [],
      notifyEmails: notifyEmails.trim()
        ? notifyEmails.split(',').map((e) => e.trim())
        : [],
      fmlaQualifyingReason: null,
      attachments: docName.trim() ? [docName.trim()] : [],
      onBehalfOf: null,
      assignedBy,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Assign Time Off</DialogTitle>
          <DialogDescription>
            Assign time off on behalf of an employee who cannot request it
            themselves. Approval of assigned time off follows the configured
            workflow.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label>Department</Label>
              <Select
                value={department}
                onValueChange={(v) => {
                  setDepartment(v)
                  setEmployeeId('')
                }}
              >
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select department' />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Employee name</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select employee' />
                </SelectTrigger>
                <SelectContent>
                  {deptEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Time off type</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  {selectableTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Balance time offs</Label>
              <div className='text-neutral-1600 flex h-9 items-center rounded-[6px] border border-gray-200 px-3 text-sm'>
                {balance !== null && type
                  ? `${balance} ${type.unit}`
                  : 'Select employee & type'}
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Period — From</Label>
              <Input type='date' value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Period — To</Label>
              <Input type='date' value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          {type && amount > 0 && (
            <p className='text-neutral-1000 text-xs'>
              No. of {type.unit}: <strong>{amount}</strong>
              {excess > 0 && (
                <span className='text-red-1400'>
                  {' '}
                  — exceeds balance by {excess} {type.unit}; the excess will be
                  flagged as loss of pay.
                </span>
              )}
            </p>
          )}

          <div className='space-y-1'>
            <Label>Reason for time off</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Why is this time off being assigned?'
              rows={2}
            />
          </div>
          <div className='space-y-1'>
            <Label>Message to employees</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Shared with the notified employees on approval'
              rows={2}
            />
          </div>
          <div className='space-y-1'>
            <Label>Employees to be notified (email IDs, comma-separated)</Label>
            <Input
              value={notifyEmails}
              onChange={(e) => setNotifyEmails(e.target.value)}
              placeholder='e.g. priya.iyer@satellite.tech, vikram.rao@satellite.tech'
            />
          </div>
          <div className='space-y-1'>
            <Label>Upload document (optional)</Label>
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder='e.g. travel-approval.pdf'
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
          >
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
