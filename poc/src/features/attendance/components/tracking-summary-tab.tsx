import { useMemo, useState } from 'react'
import { ArrowCounterClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { SwitchWithLabel } from '@/components/common/switch-with-label'
import {
  DEPARTMENTS,
  EMPLOYEE_CLASSES,
  POSITIONS,
  fmtHours,
  todayIso,
} from '../data/shared'
import { seedShiftPatterns } from '../data/shifts'
import {
  SUMMARY_DEFAULT_FROM,
  TRACKED_EMPLOYEES,
  buildSummaryRows,
  shiftForEmployee,
  summaryDefaultTo,
  type TrackedEmployee,
} from '../data/tracking'
import { SummaryCards } from './summary-cards'

interface EmployeeTotals {
  employee: TrackedEmployee
  days: number
  scheduled: number
  leaves: number
  officialVisit: number
  clientLocation: number
  personalOut: number
  wfh: number
  breaks: number
  total: number
  effective: number
}

const ACTIVE_SHIFTS = seedShiftPatterns.filter((s) => s.status === 'active')

function shiftLabel(id: string) {
  return ACTIVE_SHIFTS.find((s) => s.id === id)?.name ?? id
}

/**
 * Employee Attendance Summary (EAS-01…07): date-range + today filters,
 * active/inactive toggle, department / position / class / shift narrowing and
 * a per-employee hours matrix with an aggregate totals row.
 */
export function TrackingSummaryTab() {
  const [from, setFrom] = useState(SUMMARY_DEFAULT_FROM)
  const [to, setTo] = useState(summaryDefaultTo())
  const [showInactive, setShowInactive] = useState(false)
  const [department, setDepartment] = useState('all')
  const [position, setPosition] = useState('all')
  const [employeeClass, setEmployeeClass] = useState('all')
  const [shift, setShift] = useState('all')
  const [showToday, setShowToday] = useState(false)

  const resetFilters = () => {
    setFrom(SUMMARY_DEFAULT_FROM)
    setTo(summaryDefaultTo())
    setShowInactive(false)
    setDepartment('all')
    setPosition('all')
    setEmployeeClass('all')
    setShift('all')
    setShowToday(false)
    toast.success('Summary filters reset — showing the default period')
  }

  // EAS-04: "Show today data" pins the range to the current day.
  const effFrom = showToday ? todayIso() : from
  const effTo = showToday ? todayIso() : to

  const rows = useMemo(() => {
    const employees = TRACKED_EMPLOYEES.filter(
      (e) =>
        e.active === !showInactive &&
        (department === 'all' || e.department === department) &&
        (position === 'all' || e.position === position) &&
        (employeeClass === 'all' || e.employeeClass === employeeClass) &&
        (shift === 'all' || shiftForEmployee(e.id) === shift)
    )
    const ids = new Set(employees.map((e) => e.id))
    const byEmployee = new Map<string, EmployeeTotals>(
      employees.map((e) => [
        e.id,
        {
          employee: e, days: 0, scheduled: 0, leaves: 0, officialVisit: 0,
          clientLocation: 0, personalOut: 0, wfh: 0, breaks: 0, total: 0,
          effective: 0,
        },
      ])
    )
    for (const r of buildSummaryRows(effFrom, effTo)) {
      if (!ids.has(r.employeeId)) continue
      const t = byEmployee.get(r.employeeId)
      if (!t) continue
      t.days += 1
      t.scheduled += r.scheduledHours
      t.leaves += r.leaveHours
      t.officialVisit += r.officialVisitHours
      t.clientLocation += r.clientLocationHours
      t.personalOut += r.personalOutHours
      t.wfh += r.wfhHours
      t.breaks += r.breakHours
      t.total += r.totalHours
      t.effective += r.effectiveHours
    }
    return [...byEmployee.values()].filter((t) => t.days > 0)
  }, [effFrom, effTo, showInactive, department, position, employeeClass, shift])

  // EAS-06: totals row aggregating every employee in the result.
  const grand = rows.reduce(
    (acc, t) => ({
      scheduled: acc.scheduled + t.scheduled,
      leaves: acc.leaves + t.leaves,
      officialVisit: acc.officialVisit + t.officialVisit,
      clientLocation: acc.clientLocation + t.clientLocation,
      personalOut: acc.personalOut + t.personalOut,
      wfh: acc.wfh + t.wfh,
      breaks: acc.breaks + t.breaks,
      total: acc.total + t.total,
      effective: acc.effective + t.effective,
    }),
    { scheduled: 0, leaves: 0, officialVisit: 0, clientLocation: 0, personalOut: 0, wfh: 0, breaks: 0, total: 0, effective: 0 }
  )

  return (
    <div className='w-full'>
      <SummaryCards
        title={`Employee Attendance Summary — ${showToday ? 'today' : `${effFrom} → ${effTo}`}`}
        items={[
          { label: 'Employees in summary', value: rows.length },
          { label: 'Total hours', value: fmtHours(grand.total) },
          { label: 'Effective hours', value: fmtHours(grand.effective) },
          { label: 'Leave hours', value: fmtHours(grand.leaves) },
        ]}
      />

      <div className='mb-3 flex flex-wrap items-end gap-2 rounded-[8px] border border-gray-200 bg-white p-3'>
        <div className='flex flex-col gap-1'>
          <span className='text-neutral-1000 text-xs font-medium'>From</span>
          <Input
            type='date'
            className='h-7 w-[150px]'
            value={from}
            disabled={showToday}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-neutral-1000 text-xs font-medium'>To</span>
          <Input
            type='date'
            className='h-7 w-[150px]'
            value={to}
            disabled={showToday}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-neutral-1000 text-xs font-medium'>Department</span>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-neutral-1000 text-xs font-medium'>Position level</span>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All levels</SelectItem>
              {POSITIONS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-neutral-1000 text-xs font-medium'>Employee class</span>
          <Select value={employeeClass} onValueChange={setEmployeeClass}>
            <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All classes</SelectItem>
              {EMPLOYEE_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-neutral-1000 text-xs font-medium'>Shift</span>
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All shifts</SelectItem>
              {ACTIVE_SHIFTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SwitchWithLabel
          className='mb-1.5 ml-1'
          checked={showInactive}
          onCheckedChange={setShowInactive}
          labelA='Active'
          labelB='Inactive'
        />
        <div className='mb-1.5 ml-1 flex items-center gap-2'>
          <Switch variant='blue' checked={showToday} onCheckedChange={setShowToday} />
          <span className='text-grey-1200 text-xs font-medium'>Show today data</span>
        </div>
        <Button variant='outline' className='mb-0.5 ml-auto h-7 gap-1' onClick={resetFilters}>
          <ArrowCounterClockwise size={14} weight='bold' />
          Reset
        </Button>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Shift</th>
              <th className='px-2 text-right font-medium'>Scheduled</th>
              <th className='px-2 text-right font-medium'>Leaves</th>
              <th className='px-2 text-right font-medium'>Official Visit</th>
              <th className='px-2 text-right font-medium'>Client Location</th>
              <th className='px-2 text-right font-medium'>Personal Out</th>
              <th className='px-2 text-right font-medium'>WFH</th>
              <th className='px-2 text-right font-medium'>Breaks</th>
              <th className='px-2 text-right font-medium'>Total</th>
              <th className='px-2 text-right font-medium'>Effective</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className='text-neutral-1000 py-6 text-center'>
                  No attendance in the selected period — adjust the filters or reset.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.employee.id} className='border-b last:border-0'>
                <td className='py-2 pr-3'>
                  <span className='font-medium'>{t.employee.name}</span>
                  <span className='text-neutral-1000 block text-xs'>
                    {t.employee.code} · {t.employee.department}
                    {!t.employee.active && ' · inactive'}
                  </span>
                </td>
                <td className='px-2'>{shiftLabel(shiftForEmployee(t.employee.id))}</td>
                <td className='px-2 text-right'>{fmtHours(t.scheduled)}</td>
                <td className='px-2 text-right'>{fmtHours(t.leaves)}</td>
                <td className='px-2 text-right'>{fmtHours(t.officialVisit)}</td>
                <td className='px-2 text-right'>{fmtHours(t.clientLocation)}</td>
                <td className='px-2 text-right'>{fmtHours(t.personalOut)}</td>
                <td className='px-2 text-right'>{fmtHours(t.wfh)}</td>
                <td className='px-2 text-right'>{fmtHours(t.breaks)}</td>
                <td className='px-2 text-right font-medium'>{fmtHours(t.total)}</td>
                <td className='px-2 text-right font-medium'>{fmtHours(t.effective)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className='bg-blue-150/60 border-t text-sm font-medium'>
                <td className='py-2 pr-3'>Totals ({rows.length} employees)</td>
                <td className='px-2'>—</td>
                <td className='px-2 text-right'>{fmtHours(grand.scheduled)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.leaves)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.officialVisit)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.clientLocation)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.personalOut)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.wfh)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.breaks)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.total)}</td>
                <td className='px-2 text-right'>{fmtHours(grand.effective)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
