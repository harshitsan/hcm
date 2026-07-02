import { useState } from 'react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COMMUNITIES } from '@/features/users/data/users'

const SEGMENTS = [
  { value: '__all__', label: 'All segments' },
  { value: 'market-rate', label: 'Market rate' },
  { value: 'affordable', label: 'Affordable' },
  { value: 'student', label: 'Student housing' },
  { value: 'senior', label: 'Senior living' },
]

/**
 * Filter bar for the portfolio dashboard — community, segment and a date
 * range. State is local for now (no analytics API wired up yet).
 */
export function OverviewFilters() {
  const [community, setCommunity] = useState('__all__')
  const [segment, setSegment] = useState('__all__')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })

  const hasFilters =
    community !== '__all__' ||
    segment !== '__all__' ||
    Boolean(dateRange.from) ||
    Boolean(dateRange.to)

  const reset = () => {
    setCommunity('__all__')
    setSegment('__all__')
    setDateRange({ from: undefined, to: undefined })
  }

  return (
    <div className='mb-3 flex flex-col justify-start gap-2 text-start sm:flex-row sm:items-center sm:justify-between'>
      <h1 className='text-paragraph-lg font-semibold'>Overview</h1>
      <div className='flex flex-wrap items-center gap-3'>
        {hasFilters && (
          <button
            onClick={reset}
            className='text-paragraph-md text-neutral-1800'
          >
            Reset Filters
          </button>
        )}
        <Select value={community} onValueChange={setCommunity}>
          <SelectTrigger className='text-paragraph-md bg-white !font-medium'>
            <SelectValue placeholder='Community' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__all__'>All communities</SelectItem>
            {COMMUNITIES.filter((c) => c !== 'All communities').map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className='text-paragraph-md bg-white !font-medium'>
            <SelectValue placeholder='Segment' />
          </SelectTrigger>
          <SelectContent>
            {SEGMENTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          placeholder='This Month'
          selectedRange={dateRange}
          onRangeSelect={setDateRange}
        />
      </div>
    </div>
  )
}
