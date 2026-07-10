import { useMemo, useState } from 'react'
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
import { dateOfJoinFor } from '../data/balances'
import { seedLeaveTypes, type LeaveType } from '../data/leave-types'
import { EMPLOYEES, employeeById, fmtDate, shortId } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'

interface StagedAdjustment {
  key: string
  employeeId: string
  employeeName: string
  typeId: string
  typeName: string
  dateOfJoin: string
  addedThisYear: number
  currentBalance: number
  delta: number
  document: string
  reason: string
  totalAvailable: number
  autoApprove: boolean
  approverName: string
}

interface BulkAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balancesStore: BalancesStore
  /** Configured leave types; defaults to the seed catalog. */
  types?: LeaveType[]
}

/**
 * Bulk Pending Time Off Adjustments (mass update): stage adjustment rows for
 * multiple employees, then submit them at once. Rows with the "Approver"
 * checkbox are auto-approved (supporting document mandatory) per the PDF.
 */
export function BulkAdjustmentDialog({
  open,
  onOpenChange,
  balancesStore,
  types = seedLeaveTypes,
}: BulkAdjustmentDialogProps) {
  const [employeeId, setEmployeeId] = useState('')
  const [approverChecked, setApproverChecked] = useState(false)
  const [approverName, setApproverName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [delta, setDelta] = useState('1')
  const [document, setDocument] = useState('')
  const [reason, setReason] = useState('')
  const [rows, setRows] = useState<StagedAdjustment[]>([])

  const employee = employeeById(employeeId)
  const leaveTypes = useMemo(
    () =>
      types.filter(
        (t) =>
          t.active &&
          (!employee || !t.excludedLevels.includes(employee.positionLevel))
      ),
    [employee, types]
  )
  const dateOfJoin = employeeId ? dateOfJoinFor(employeeId) : ''
  const addedThisYear =
    employeeId && typeId
      ? (balancesStore.balanceFor(employeeId, typeId)?.credited ?? 0)
      : 0
  const currentBalance =
    employeeId && typeId ? balancesStore.remainingFor(employeeId, typeId) : 0
  const deltaNum = Number(delta) || 0
  const totalAvailable = currentBalance + deltaNum

  const resetEntry = () => {
    setEmployeeId('')
    setApproverChecked(false)
    setApproverName('')
    setTypeId('')
    setDelta('1')
    setDocument('')
    setReason('')
  }

  const addRow = () => {
    const emp = employeeById(employeeId)
    const type = types.find((t) => t.id === typeId)
    if (!emp || !type) {
      toast.error('Select an employee and a time off type')
      return
    }
    if (!Number(delta)) {
      toast.error('Number of time offs adjustment must be a non-zero number')
      return
    }
    if (reason.trim().length < 5) {
      toast.error('Enter a reason for the time off adjustment')
      return
    }
    if (approverChecked && !approverName.trim()) {
      toast.error('Enter the approver name to auto-approve this record')
      return
    }
    if (approverChecked && !document.trim()) {
      toast.error(
        'A supporting document is mandatory when the approver checkbox is selected'
      )
      return
    }
    setRows((prev) => [
      ...prev,
      {
        key: shortId('badj'),
        employeeId: emp.id,
        employeeName: emp.name,
        typeId: type.id,
        typeName: type.name,
        dateOfJoin,
        addedThisYear,
        currentBalance,
        delta: Number(delta),
        document: document.trim(),
        reason: reason.trim(),
        totalAvailable,
        autoApprove: approverChecked,
        approverName: approverName.trim(),
      },
    ])
    toast.info('Record added to the bulk adjustment grid')
    resetEntry()
  }

  const submit = () => {
    if (rows.length === 0) {
      toast.error('Add at least one record to the grid before submitting')
      return
    }
    balancesStore.requestAdjustments(
      rows.map((r) => {
        const emp = employeeById(r.employeeId)
        return {
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          employeeCode: emp?.code ?? '—',
          department: emp?.department ?? '—',
          employeeClass: emp?.employeeClass ?? 'Regular',
          typeId: r.typeId,
          typeName: r.typeName,
          delta: r.delta,
          currentBalance: r.currentBalance,
          reason: r.reason,
          dateOfJoin: r.dateOfJoin,
          sendMailToEmployee: false,
          addedThisYear: r.addedThisYear,
          totalForYear: r.addedThisYear + r.delta,
          documents: r.document ? [r.document] : [],
          comments: r.autoApprove
            ? `Auto-approved via bulk mass update by ${r.approverName}.`
            : 'Created via bulk pending time off adjustments.',
          autoApprove: r.autoApprove,
          approvedBy: r.autoApprove ? r.approverName : undefined,
        }
      })
    )
    const autoCount = rows.filter((r) => r.autoApprove).length
    if (autoCount === rows.length) {
      toast.success(
        'Bulk time off credit submitted — time off adjustment has been assigned and approved for selected employees'
      )
    } else if (autoCount === 0) {
      toast.success(
        'Bulk time off adjustment submitted — assigned to selected employees and pending approval per configuration'
      )
    } else {
      toast.success(
        `Bulk time off adjustment submitted — ${autoCount} approved by the named approver, ${rows.length - autoCount} pending approval per configuration`
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
          <DialogTitle>Bulk Pending Time Off Adjustments</DialogTitle>
          <DialogDescription>
            Add adjustment records for multiple employees, then submit them at
            once. Checking “Approver” auto-approves the record (document
            mandatory).
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
                {leaveTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className='text-neutral-1000 col-span-2 grid grid-cols-4 gap-2 rounded-[6px] border border-gray-200 bg-gray-50 p-2 text-xs'>
            <div>
              <div className='font-medium'>Date of join</div>
              <div>{dateOfJoin ? fmtDate(dateOfJoin) : '—'}</div>
            </div>
            <div>
              <div className='font-medium'>Added in current year</div>
              <div>{employeeId && typeId ? addedThisYear : '—'}</div>
            </div>
            <div>
              <div className='font-medium'>Current balance</div>
              <div>{employeeId && typeId ? currentBalance : '—'}</div>
            </div>
            <div>
              <div className='font-medium'>Total available for year</div>
              <div>{employeeId && typeId ? totalAvailable : '—'}</div>
            </div>
          </div>

          <label className='space-y-1 text-sm'>
            <span className='font-medium'>Number of time offs adjustment</span>
            <Input
              type='number'
              step='0.5'
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
          </label>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>
              Document{approverChecked ? ' (mandatory)' : ''}
            </span>
            <Input
              placeholder='e.g. adjustment-approval.pdf'
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </label>
          <label className='col-span-2 space-y-1 text-sm'>
            <span className='font-medium'>Reason</span>
            <Input
              placeholder='Reason for time off adjustment'
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
                <th className='px-2 py-1.5 font-medium'>DOJ</th>
                <th className='px-2 py-1.5 font-medium'>Adjustment</th>
                <th className='px-2 py-1.5 font-medium'>Total available</th>
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
                  <td className='px-2 py-1.5'>{fmtDate(r.dateOfJoin)}</td>
                  <td className='px-2 py-1.5'>
                    {r.delta > 0 ? `+${r.delta}` : r.delta}
                  </td>
                  <td className='px-2 py-1.5'>{r.totalAvailable}</td>
                  <td className='px-2 py-1.5'>
                    {r.autoApprove ? `${r.approverName} (auto)` : 'Configured flow'}
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
