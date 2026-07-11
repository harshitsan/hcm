import { useMemo, useState } from 'react'
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
import { DEPARTMENTS, employeeById, employeeName, fmtBreaks, fmtHours } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'
import { StatusBadge } from './badges'

/**
 * Attendance mass approval (TNA-45): pick a date (and optionally department),
 * review planned vs actual with breaks and effective hours, approve in bulk.
 */
export function MassApproval({ attendance }: { attendance: AttendanceStore }) {
  const [date, setDate] = useState('2026-06-30')
  const [dept, setDept] = useState('all')
  const [checked, setChecked] = useState<string[]>([])

  const rows = useMemo(
    () =>
      attendance.records.filter((r) => {
        const emp = employeeById(r.employeeId)
        return (
          r.date === date &&
          r.employeeId !== null &&
          !r.duplicateOfId &&
          (dept === 'all' || emp?.department === dept)
        )
      }),
    [attendance.records, date, dept]
  )

  const approvable = rows.filter((r) => r.status !== 'approved')

  const approveChecked = () => {
    attendance.approveRecords(checked)
    setChecked([])
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-neutral-1600 text-sm font-medium'>
          Attendance Mass Approval — {rows.length} record(s) on the selected day
        </h3>
        <div className='flex items-center gap-2'>
          <Input
            type='date'
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setChecked([])
            }}
            className='h-7 w-[150px]'
          />
          <Select
            value={dept}
            onValueChange={(v) => {
              setDept(v)
              setChecked([])
            }}
          >
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
          <Button className='h-7' disabled={checked.length === 0} onClick={approveChecked}>
            Approve Selected ({checked.length})
          </Button>
        </div>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-2'>
                <Checkbox
                  variant='blue'
                  checked={approvable.length > 0 && checked.length === approvable.length}
                  onCheckedChange={(v) =>
                    setChecked(v ? approvable.map((r) => r.id) : [])
                  }
                  aria-label='Select all'
                />
              </th>
              <th className='pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Planned</th>
              <th className='px-2 font-medium'>Actual start–end</th>
              <th className='px-2 font-medium'>Work location</th>
              <th className='px-2 font-medium'>Breaks</th>
              <th className='px-2 font-medium'>Overall</th>
              <th className='px-2 font-medium'>Effective</th>
              <th className='px-2 font-medium'>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className='border-b last:border-0'>
                <td className='py-2 pr-2'>
                  <Checkbox
                    variant='blue'
                    disabled={r.status === 'approved'}
                    checked={checked.includes(r.id)}
                    onCheckedChange={(v) =>
                      setChecked((prev) =>
                        v ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                      )
                    }
                    aria-label={`Select ${employeeName(r.employeeId)}`}
                  />
                </td>
                <td className='pr-3 font-medium'>{employeeName(r.employeeId)}</td>
                <td className='px-2'>{fmtHours(r.plannedHours)}</td>
                <td className='px-2'>
                  {r.punchIn} → {r.punchOut ?? '—'}
                </td>
                <td className='px-2 capitalize'>{r.workCategory.replace(/-/g, ' ')}</td>
                <td className='px-2'>{fmtBreaks(r.breaksCount, r.breakMinutes)}</td>
                <td className='px-2'>{fmtHours(r.workedHours)}</td>
                <td className='px-2 font-medium'>{fmtHours(r.effectiveHours)}</td>
                <td className='px-2'>
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className='text-neutral-1000 py-3 text-center'>
                  No attendance for this date/department.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
