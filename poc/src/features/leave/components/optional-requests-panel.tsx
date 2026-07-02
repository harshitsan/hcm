import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPLOYEE_CLASSES, fmtDate } from '../data/shared'
import { type LeaveSettingsStore } from '../hooks/use-leave-settings'
import { StatusBadge } from './badges'

/**
 * Employee Optional Holiday Requests (LVE-46): manager review queue with
 * status/class filters and an active/inactive employees toggle.
 */
export function OptionalRequestsPanel({
  settings,
}: {
  settings: LeaveSettingsStore
}) {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [classFilter, setClassFilter] = useState('all')
  const [includeInactive, setIncludeInactive] = useState(false)

  const rows = useMemo(
    () =>
      settings.optionalRequests.filter(
        (r) =>
          (statusFilter === 'all' || r.status === statusFilter) &&
          (classFilter === 'all' || r.employeeClass === classFilter) &&
          (includeInactive || r.employeeActive)
      ),
    [classFilter, includeInactive, settings.optionalRequests, statusFilter]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Employee Optional Holiday Requests ({rows.length})
        </h2>
        <div className='flex items-center gap-3'>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={includeInactive}
              onCheckedChange={(v) => setIncludeInactive(!!v)}
              variant='blue'
            />
            Include former staff
          </label>
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
                        onClick={() => settings.decideOptionalRequest(r.id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant='outline'
                        className='text-destructive h-6 px-2 text-xs'
                        onClick={() => settings.decideOptionalRequest(r.id, false)}
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
    </div>
  )
}
