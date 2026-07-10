import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Stack } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type OptionalHolidayRequest } from '../data/holidays'
import {
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  employeeById,
  fmtDate,
} from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { StatusBadge } from './badges'
import { BulkOptionalHolidayDialog } from './bulk-optional-holiday-dialog'

/**
 * Employee Optional Holiday Requests (LVE-46): manager review queue with
 * status/class filters, an active/inactive employees toggle and the Create
 * Bulk Optional Holiday mass update. The settings store exposes no bulk
 * create API, so bulk-created rows live in local panel state merged with
 * `settings.optionalRequests` for display (auto-approved rows arrive with
 * status approved).
 */
export function OptionalRequestsPanel({
  settings,
}: {
  settings: LeaveSettingsStore
}) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [classFilter, setClassFilter] = useState('all')
  // EOHR-03: narrow the queue to a department.
  const [deptFilter, setDeptFilter] = useState('all')
  // EOHR-01: From/To period filter over the holiday dates.
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  // Rows created via the bulk mass update, merged with the store's list.
  const [bulkRequests, setBulkRequests] = useState<OptionalHolidayRequest[]>([])

  const rows = useMemo(
    () =>
      [...bulkRequests, ...settings.optionalRequests].filter(
        (r) =>
          (statusFilter === 'all' || r.status === statusFilter) &&
          (classFilter === 'all' || r.employeeClass === classFilter) &&
          (deptFilter === 'all' ||
            employeeById(r.employeeId)?.department === deptFilter) &&
          (!fromDate || r.date >= fromDate) &&
          (!toDate || r.date <= toDate) &&
          (includeInactive || r.employeeActive)
      ),
    [
      bulkRequests,
      classFilter,
      deptFilter,
      fromDate,
      includeInactive,
      settings.optionalRequests,
      statusFilter,
      toDate,
    ]
  )

  /** Route the decision to local state for bulk-created rows. */
  const decide = (id: string, approve: boolean) => {
    if (bulkRequests.some((r) => r.id === id)) {
      setBulkRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: approve ? 'approved' : 'rejected' } : r
        )
      )
      toast.success(
        approve ? 'Optional holiday approved' : 'Optional holiday rejected'
      )
      return
    }
    settings.decideOptionalRequest(id, approve)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Employee Optional Holiday Requests ({rows.length})
        </h2>
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() => setBulkOpen(true)}
            className='h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Stack size={10} weight='bold' />
            Create bulk optional holiday
          </Button>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={includeInactive}
              onCheckedChange={(v) => setIncludeInactive(!!v)}
              variant='blue'
            />
            Include former staff
          </label>
          <Input
            type='date'
            aria-label='From date'
            className='h-7 w-[135px]'
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Input
            type='date'
            aria-label='To date'
            className='h-7 w-[135px]'
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
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
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All classes</SelectItem>
              {EMPLOYEE_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Class</th>
              <th className='px-2 font-medium'>Holiday</th>
              <th className='px-2 font-medium'>Date</th>
              <th className='px-2 font-medium'>Day</th>
              <th className='px-2 font-medium'>Status</th>
              <th className='px-2 text-right font-medium'>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className='text-neutral-1000 py-6 text-center'>
                  No optional-holiday requests match the filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>
                  {r.employeeName}
                  {!r.employeeActive && (
                    <span className='text-neutral-1000 ml-1 text-xs'>(inactive)</span>
                  )}
                </td>
                <td className='px-2'>{r.employeeClass}</td>
                <td className='px-2'>{r.holidayName}</td>
                <td className='px-2'>{fmtDate(r.date)}</td>
                <td className='px-2'>{r.day}</td>
                <td className='px-2'>
                  <StatusBadge status={r.status} />
                </td>
                <td className='px-2 text-right'>
                  {r.status === 'pending' && (
                    <span className='inline-flex gap-1'>
                      <Button
                        className='h-6 px-2 text-xs'
                        onClick={() => decide(r.id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant='outline'
                        className='text-destructive h-6 px-2 text-xs'
                        onClick={() => decide(r.id, false)}
                      >
                        Reject
                      </Button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BulkOptionalHolidayDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        settingsStore={settings}
        onCreate={(requests) => setBulkRequests((prev) => [...requests, ...prev])}
      />
    </div>
  )
}
