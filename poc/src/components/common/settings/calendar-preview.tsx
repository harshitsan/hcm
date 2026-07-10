import { useState } from 'react'
import { CaretLeft, CaretRight } from 'phosphor-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/helpers'

export interface CalendarMarker {
  date: string
  label: string
  kind: 'holiday' | 'optional' | 'closure'
}

export interface CalendarPreviewProps {
  markers: CalendarMarker[]
  workingDays: number[]
  months?: number
  onSelectDate?: (iso: string) => void
}

const KIND_CLASSES: Record<CalendarMarker['kind'], string> = {
  holiday: 'rdp-modifier-holiday',
  optional: 'rdp-modifier-optional',
  closure: 'rdp-modifier-closure',
}

const KIND_COLORS: Record<CalendarMarker['kind'], string> = {
  holiday: 'bg-red-400',
  optional: 'bg-yellow-400',
  closure: 'bg-gray-400',
}

const KIND_LABELS: Record<CalendarMarker['kind'], string> = {
  holiday: 'Holiday',
  optional: 'Optional holiday',
  closure: 'Office closure',
}

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function CalendarPreview({
  markers,
  workingDays,
  months = 3,
  onSelectDate,
}: CalendarPreviewProps) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth)

  const markersByKind: Record<CalendarMarker['kind'], Date[]> = {
    holiday: [],
    optional: [],
    closure: [],
  }

  const markerDateMap = new Map<string, CalendarMarker>()

  for (const m of markers) {
    if (!m.date) continue
    const d = isoToDate(m.date)
    markersByKind[m.kind].push(d)
    markerDateMap.set(m.date, m)
  }

  const modifiers = {
    holiday: markersByKind.holiday,
    optional: markersByKind.optional,
    closure: markersByKind.closure,
    weekend: (d: Date) => !workingDays.includes(d.getDay()),
  }

  const modifiersClassNames: Record<string, string> = {
    holiday: KIND_CLASSES.holiday,
    optional: KIND_CLASSES.optional,
    closure: KIND_CLASSES.closure,
    weekend: 'rdp-modifier-weekend',
  }

  const handleDayClick = onSelectDate
    ? (d: Date) => {
        const iso = dateToIso(d)
        if (markerDateMap.has(iso)) {
          onSelectDate(iso)
        }
      }
    : undefined

  const prevMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between mb-1'>
        <Button variant='outline' className='h-7 w-7 p-0' onClick={prevMonth} aria-label='Previous month'>
          <CaretLeft size={14} />
        </Button>
        <Button variant='outline' className='h-7 w-7 p-0' onClick={nextMonth} aria-label='Next month'>
          <CaretRight size={14} />
        </Button>
      </div>

      <div className='overflow-x-auto'>
        <Calendar
          numberOfMonths={months}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={handleDayClick}
          className={cn(
            '[&_.rdp-modifier-holiday_button]:relative [&_.rdp-modifier-holiday_button]:after:absolute [&_.rdp-modifier-holiday_button]:after:bottom-0.5 [&_.rdp-modifier-holiday_button]:after:left-1/2 [&_.rdp-modifier-holiday_button]:after:-translate-x-1/2 [&_.rdp-modifier-holiday_button]:after:h-1 [&_.rdp-modifier-holiday_button]:after:w-1 [&_.rdp-modifier-holiday_button]:after:rounded-full [&_.rdp-modifier-holiday_button]:after:bg-red-400',
            '[&_.rdp-modifier-optional_button]:relative [&_.rdp-modifier-optional_button]:after:absolute [&_.rdp-modifier-optional_button]:after:bottom-0.5 [&_.rdp-modifier-optional_button]:after:left-1/2 [&_.rdp-modifier-optional_button]:after:-translate-x-1/2 [&_.rdp-modifier-optional_button]:after:h-1 [&_.rdp-modifier-optional_button]:after:w-1 [&_.rdp-modifier-optional_button]:after:rounded-full [&_.rdp-modifier-optional_button]:after:bg-yellow-400',
            '[&_.rdp-modifier-closure_button]:relative [&_.rdp-modifier-closure_button]:after:absolute [&_.rdp-modifier-closure_button]:after:bottom-0.5 [&_.rdp-modifier-closure_button]:after:left-1/2 [&_.rdp-modifier-closure_button]:after:-translate-x-1/2 [&_.rdp-modifier-closure_button]:after:h-1 [&_.rdp-modifier-closure_button]:after:w-1 [&_.rdp-modifier-closure_button]:after:rounded-full [&_.rdp-modifier-closure_button]:after:bg-gray-400',
            '[&_.rdp-modifier-weekend]:opacity-60 [&_.rdp-modifier-weekend]:bg-gray-50'
          )}
          disabled={false}
        />
      </div>

      <div className='flex flex-wrap gap-3 pt-1'>
        {(Object.keys(KIND_LABELS) as CalendarMarker['kind'][]).map((kind) => (
          <span key={kind} className='flex items-center gap-1.5 text-xs text-neutral-1000'>
            <span className={cn('h-3 w-3 rounded-sm flex-shrink-0', KIND_COLORS[kind])} />
            {KIND_LABELS[kind]}
          </span>
        ))}
        <span className='flex items-center gap-1.5 text-xs text-neutral-1000'>
          <span className='h-3 w-3 rounded-sm flex-shrink-0 bg-gray-100 border border-gray-200' />
          Non-working day
        </span>
      </div>
    </div>
  )
}
