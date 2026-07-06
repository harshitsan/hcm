import { useMemo, useState } from 'react'
import { ArrowCounterClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEPARTMENTS, fmtHours } from '../data/shared'
import {
  TRACKED_EMPLOYEES,
  UTILIZATION_WEEKS,
  WEEKDAY_LABELS,
  buildUtilizationRows,
} from '../data/tracking'
import { SummaryCards } from './summary-cards'

const DEFAULT_WEEK = UTILIZATION_WEEKS[0].value
const MIN_UTILIZATION_OPTIONS = ['0', '50', '70', '85'] as const

/**
 * Timesheet Utilization Summary (TUS-06/07): week + department + minimum
 * utilization filters with reset, and a per-employee productive vs
 * non-productive breakdown across Su–Sa with utilization percentages.
 */
export function UtilizationTab() {
  const [week, setWeek] = useState<string>(DEFAULT_WEEK)
  const [department, setDepartment] = useState('all')
  const [minUtilization, setMinUtilization] = useState('0')

  const resetFilters = () => {
    setWeek(DEFAULT_WEEK)
    setDepartment('all')
    setMinUtilization('0')
    toast.success('Utilization filters reset — showing the current week')
  }

  const rows = useMemo(() => {
    const byId = new Map(TRACKED_EMPLOYEES.map((e) => [e.id, e]))
    return buildUtilizationRows(week).filter((r) => {
      const emp = byId.get(r.employeeId)
      if (!emp) return false
      if (department !== 'all' && emp.department !== department) return false
      return r.utilizationPct >= Number(minUtilization)
    })
  }, [week, department, minUtilization])

  const byId = new Map(TRACKED_EMPLOYEES.map((e) => [e.id, e]))
  const teamProductive = rows.reduce((s, r) => s + r.productiveTotal, 0)
  const teamNonProductive = rows.reduce((s, r) => s + r.nonProductiveTotal, 0)
  const avgUtilization =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.utilizationPct, 0) / rows.length)

  return (
    <div className='w-full'>
      <SummaryCards
        title={`Timesheet Utilization Summary — ${UTILIZATION_WEEKS.find((w) => w.value === week)?.label ?? week}`}
        items={[
          { label: 'Employees', value: rows.length },
          { label: 'Productive hours', value: fmtHours(teamProductive) },
          { label: 'Non-productive hours', value: fmtHours(teamNonProductive) },
          { label: 'Avg utilization', value: `${avgUtilization}%` },
        ]}
      />

      <div className='mb-3 flex flex-wrap items-center gap-2 rounded-[8px] border border-gray-200 bg-white p-3'>
        <Select value={week} onValueChange={setWeek}>
          <SelectTrigger variant='secondary' className='h-7 w-[210px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UTILIZATION_WEEKS.map((w) => (
              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={minUtilization} onValueChange={setMinUtilization}>
          <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MIN_UTILIZATION_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>
                {m === '0' ? 'Any utilization' : `Utilization ≥ ${m}%`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant='outline' className='ml-auto h-7 gap-1' onClick={resetFilters}>
          <ArrowCounterClockwise size={14} weight='bold' />
          Reset
        </Button>
      </div>

      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <div className='text-neutral-1000 mb-2 text-xs'>
          Each day shows <span className='text-green-1300 font-medium'>productive</span> /{' '}
          <span className='text-orange-1200 font-medium'>non-productive</span> hours logged
          on timesheets.
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              {WEEKDAY_LABELS.map((d) => (
                <th key={d} className='px-2 text-right font-medium'>{d}</th>
              ))}
              <th className='px-2 text-right font-medium'>Productive</th>
              <th className='px-2 text-right font-medium'>Non-prod.</th>
              <th className='px-2 text-right font-medium'>Util %</th>
              <th className='px-2 text-right font-medium'>Non-util %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className='text-neutral-1000 py-6 text-center'>
                  No employees match the current filters — reset to start a new query.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const emp = byId.get(r.employeeId)
              return (
                <tr key={r.employeeId} className='border-b last:border-0'>
                  <td className='py-2 pr-3'>
                    <span className='font-medium'>{emp?.name ?? r.employeeId}</span>
                    <span className='text-neutral-1000 block text-xs'>
                      {emp?.code} · {emp?.department}
                    </span>
                  </td>
                  {r.days.map((d, idx) => (
                    <td key={WEEKDAY_LABELS[idx]} className='px-2 text-right text-xs'>
                      {d.productive === 0 && d.nonProductive === 0 ? (
                        <span className='text-neutral-1000'>—</span>
                      ) : (
                        <>
                          <span className='text-green-1300 font-medium'>{d.productive}</span>
                          {' / '}
                          <span className='text-orange-1200'>{d.nonProductive}</span>
                        </>
                      )}
                    </td>
                  ))}
                  <td className='px-2 text-right font-medium'>{fmtHours(r.productiveTotal)}</td>
                  <td className='px-2 text-right'>{fmtHours(r.nonProductiveTotal)}</td>
                  <td className='px-2 text-right font-medium'>{r.utilizationPct}%</td>
                  <td className='text-neutral-1000 px-2 text-right'>{r.nonUtilizationPct}%</td>
                </tr>
              )
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className='bg-blue-150/60 border-t text-sm font-medium'>
                <td className='py-2 pr-3'>Team totals ({rows.length})</td>
                <td colSpan={7} className='px-2' />
                <td className='px-2 text-right'>{fmtHours(teamProductive)}</td>
                <td className='px-2 text-right'>{fmtHours(teamNonProductive)}</td>
                <td className='px-2 text-right'>{avgUtilization}%</td>
                <td className='px-2 text-right'>{100 - avgUtilization}%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
