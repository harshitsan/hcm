import { useState } from 'react'
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
import { type OptionalHolidayRequest } from '../data/holidays'
import { EMPLOYEES, employeeById, fmtDate, shortId } from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'

interface StagedOptionalHoliday {
  key: string
  employeeId: string
  employeeName: string
  holidayName: string
  date: string
  reason: string
  document: string
  autoApprove: boolean
  approverName: string
}

interface BulkOptionalHolidayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Settings store (read-only here — it exposes no bulk-create API for
   * optional holiday requests, so created rows are handed to `onCreate` and
   * merged into the panel's list).
   */
  settingsStore: LeaveSettingsStore
  /** Receives the created requests for display in the requests queue. */
  onCreate: (requests: OptionalHolidayRequest[]) => void
}

function weekdayOf(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
  })
}

/**
 * Create Bulk Optional Holiday (Optional Holiday Mass Update): stage optional
 * holiday requests for multiple employees, then submit them at once. Rows with
 * the "Approver" checkbox (name + document mandatory) are auto-approved.
 */
export function BulkOptionalHolidayDialog({
  open,
  onOpenChange,
  onCreate,
}: BulkOptionalHolidayDialogProps) {
  const [employeeId, setEmployeeId] = useState('')
  const [approverChecked, setApproverChecked] = useState(false)
  const [approverName, setApproverName] = useState('')
  const [holidayName, setHolidayName] = useState('')
  const [holidayDate, setHolidayDate] = useState('')
  const [reason, setReason] = useState('')
  const [document, setDocument] = useState('')
  const [rows, setRows] = useState<StagedOptionalHoliday[]>([])

  const resetEntry = () => {
    setEmployeeId('')
    setApproverChecked(false)
    setApproverName('')
    setHolidayName('')
    setHolidayDate('')
    setReason('')
    setDocument('')
  }

  const addRow = () => {
    const emp = employeeById(employeeId)
    if (!emp) {
      toast.error('Select an employee')
      return
    }
    if (!holidayName.trim()) {
      toast.error('Enter the name of the holiday')
      return
    }
    if (!holidayDate) {
      toast.error('Enter the date of the holiday')
      return
    }
    if (reason.trim().length < 5) {
      toast.error('Enter a reason for the optional holiday request')
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
    if (
      rows.some(
        (r) => r.employeeId === emp.id && r.holidayName === holidayName.trim()
      )
    ) {
      toast.error('This holiday is already staged for the selected employee')
      return
    }
    setRows((prev) => [
      ...prev,
      {
        key: shortId('boh'),
        employeeId: emp.id,
        employeeName: emp.name,
        holidayName: holidayName.trim(),
        date: holidayDate,
        reason: reason.trim(),
        document: document.trim(),
        autoApprove: approverChecked,
        approverName: approverName.trim(),
      },
    ])
    toast.info('Record added to the bulk optional holiday grid')
    resetEntry()
  }

  const submit = () => {
    if (rows.length === 0) {
      toast.error('Add at least one record to the grid before submitting')
      return
    }
    onCreate(
      rows.map((r) => {
        const emp = employeeById(r.employeeId)
        return {
          id: shortId('ohr'),
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          employeeClass: emp?.employeeClass ?? 'Regular',
          holidayName: r.holidayName,
          date: r.date,
          day: weekdayOf(r.date),
          status: r.autoApprove ? ('approved' as const) : ('pending' as const),
          employeeActive: emp?.active ?? true,
        }
      })
    )
    const autoCount = rows.filter((r) => r.autoApprove).length
    if (autoCount === rows.length) {
      toast.success(
        'Bulk optional holiday submitted — optional holidays have been assigned and approved for selected employees'
      )
    } else if (autoCount === 0) {
      toast.success(
        'Bulk optional holiday submitted — assigned to selected employees and pending approval per configuration'
      )
    } else {
      toast.success(
        `Bulk optional holiday submitted — ${autoCount} approved by the named approver, ${rows.length - autoCount} pending approval per configuration`
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
          <DialogTitle>Create Bulk Optional Holiday</DialogTitle>
          <DialogDescription>
            Assign optional holidays to multiple employees at once. Checking
            “Approver” auto-approves the request (approver name + document
            mandatory).
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-3'>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>Employee name</span>
            <Select value={employeeId} onValueChange={setEmployeeId}>
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
            <span className='font-medium'>Holiday</span>
            <Input
              placeholder='Name of the holiday'
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
            />
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
            <span className='font-medium'>Holiday date</span>
            <Input
              type='date'
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
          </label>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>
              Document{approverChecked ? ' (mandatory)' : ''}
            </span>
            <Input
              placeholder='e.g. approval-note.pdf'
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </label>
          <label className='col-span-2 space-y-1 text-sm'>
            <span className='font-medium'>Reason for mass update</span>
            <Input
              placeholder='Reason for the optional holiday request'
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
                <th className='px-2 py-1.5 font-medium'>Holiday</th>
                <th className='px-2 py-1.5 font-medium'>Date</th>
                <th className='px-2 py-1.5 font-medium'>Approver</th>
                <th className='px-2 py-1.5 font-medium'>Reason</th>
                <th className='px-2 py-1.5' />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className='text-neutral-1000 px-2 py-4 text-center'>
                    No records added yet — fill the form above and click “Add”.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.key} className='border-b last:border-0'>
                  <td className='px-2 py-1.5 font-medium'>{r.employeeName}</td>
                  <td className='px-2 py-1.5'>{r.holidayName}</td>
                  <td className='px-2 py-1.5'>{fmtDate(r.date)}</td>
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
