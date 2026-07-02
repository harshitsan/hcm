import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/helpers'
import { type LeaveRequest } from '../data/requests'
import { type OfficeClosure } from '../data/config'

interface CalendarHoliday {
  date: string
  name: string
}

interface LeaveCalendarProps {
  requests: LeaveRequest[]
  holidays: CalendarHoliday[]
  closures: OfficeClosure[]
  /** Show each entry as the employee's name (team/company views). */
  showNames?: boolean
  /** When set, renders coverage metrics per day (LVE-10). */
  headcount?: number
  footer?: React.ReactNode
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Month-grid calendar shared by the personal (LVE-09), team (LVE-13) and
 * company-wide (LVE-10) views. Approved, pending and tentative leave are
 * rendered distinctly; published holidays and office closures show as
 * non-working days.
 */
export function LeaveCalendar({
  requests,
  holidays,
  closures,
  showNames = false,
  headcount,
  footer,
}: LeaveCalendarProps) {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(6) // July 2026

  const move = (delta: number) => {
    const next = month + delta
    if (next < 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else if (next > 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth(next)
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  const byDay = useMemo(() => {
    const map = new Map<
      string,
      { requests: LeaveRequest[]; holiday?: string; closure?: string }
    >()
    for (let d = 1; d <= daysInMonth; d++) {
      const date = iso(year, month, d)
      const dayRequests = requests.filter(
        (r) =>
          r.from <= date &&
          r.to >= date &&
          (r.status === 'pending' || r.status === 'approved')
      )
      const holiday = holidays.find((h) => h.date === date)?.name
      const closure = closures.find(
        (c) => c.from <= date && c.to >= date
      )?.reason
      map.set(date, { requests: dayRequests, holiday, closure })
    }
    return map
  }, [closures, daysInMonth, holidays, month, requests, year])

  const coverage = useMemo(() => {
    if (!headcount) return null
    let worstPct = 100
    let daysBelow = 0
    for (const [, info] of byDay) {
      const off = new Set(info.requests.map((r) => r.employeeId)).size
      const pct = Math.round(((headcount - off) / headcount) * 100)
      if (pct < worstPct) worstPct = pct
      if (pct < 80) daysBelow += 1
    }
    return { worstPct, daysBelow }
  }, [byDay, headcount])

  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='icon2'
            className='h-7 w-7'
            onClick={() => move(-1)}
            aria-label='Previous month'
          >
            <ChevronLeft className='size-4' />
          </Button>
          <span className='text-neutral-1600 text-paragraph-md font-medium'>
            {MONTHS[month]} {year}
          </span>
          <Button
            variant='icon2'
            className='h-7 w-7'
            onClick={() => move(1)}
            aria-label='Next month'
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>
        <div className='text-neutral-1000 flex items-center gap-3 text-xs'>
          <span className='flex items-center gap-1'>
            <span className='bg-green-1200 inline-block h-2.5 w-2.5 rounded-full' />
            Approved
          </span>
          <span className='flex items-center gap-1'>
            <span className='bg-vanilla-400 inline-block h-2.5 w-2.5 rounded-full' />
            Pending
          </span>
          <span className='flex items-center gap-1'>
            <span className='inline-block h-2.5 w-2.5 rounded-full border border-dashed border-orange-400' />
            Tentative
          </span>
          <span className='flex items-center gap-1'>
            <span className='bg-blue-150 inline-block h-2.5 w-2.5 rounded-full' />
            Holiday
          </span>
          <span className='flex items-center gap-1'>
            <span className='inline-block h-2.5 w-2.5 rounded-full bg-gray-300' />
            Closure
          </span>
        </div>
      </div>

      {coverage && (
        <div className='bg-blue-150 mb-3 flex items-center gap-6 rounded-[6px] px-3 py-2 text-sm'>
          <span>
            Headcount in scope: <strong>{headcount}</strong>
          </span>
          <span>
            Lowest daily coverage this month: <strong>{coverage.worstPct}%</strong>
          </span>
          <span className={cn(coverage.daysBelow > 0 && 'text-red-1400')}>
            Days below 80% coverage: <strong>{coverage.daysBelow}</strong>
          </span>
        </div>
      )}

      <div className='grid grid-cols-7 gap-px overflow-hidden rounded-[6px] border border-gray-200 bg-gray-200'>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className='text-neutral-1000 bg-white px-2 py-1 text-center text-xs font-medium'
          >
            {d}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} className='min-h-[72px] bg-white' />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = iso(year, month, day)
          const info = byDay.get(date)
          const weekend = [0, 6].includes(new Date(year, month, day).getDay())
          return (
            <div
              key={date}
              className={cn(
                'min-h-[72px] bg-white p-1.5',
                weekend && 'bg-neutral-100',
                info?.closure && 'bg-gray-100'
              )}
            >
              <div className='text-neutral-1000 mb-1 text-xs'>{day}</div>
              <div className='flex flex-col gap-0.5'>
                {info?.holiday && (
                  <span className='bg-blue-150 text-blue-1400 truncate rounded px-1 text-[10px]'>
                    {info.holiday}
                  </span>
                )}
                {info?.closure && (
                  <span className='truncate rounded bg-gray-200 px-1 text-[10px] text-gray-600'>
                    Closed
                  </span>
                )}
                {info?.requests.slice(0, 3).map((r) => (
                  <span
                    key={r.id}
                    className={cn(
                      'truncate rounded px-1 text-[10px]',
                      r.tentative
                        ? 'border border-dashed border-orange-400 text-orange-600'
                        : r.status === 'approved'
                          ? 'bg-green-1200 text-green-1300'
                          : 'bg-vanilla-400 text-vanilla-500'
                    )}
                    title={`${r.employeeName} · ${r.typeName} (${r.status}${r.tentative ? ', tentative' : ''})`}
                  >
                    {showNames ? r.employeeName : r.typeName}
                  </span>
                ))}
                {info && info.requests.length > 3 && (
                  <span className='text-neutral-1000 text-[10px]'>
                    +{info.requests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {footer}
    </div>
  )
}
