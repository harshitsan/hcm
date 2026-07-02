import * as React from 'react'
import {
  format,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parse,
  isValid,
  addDays,
  isBefore,
  isAfter,
  differenceInDays,
} from 'date-fns'
import { CaretDown } from 'phosphor-react'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

type PresetOption = 'today' | 'this-week' | 'this-month' | 'custom'

interface DateRangePickerProps {
  placeholder?: string
  selectedRange?: DateRange
  onRangeSelect?: (range: DateRange) => void
  minDate?: Date
  maxDate?: Date
  variant?: 'default' | 'secondary' | 'timeframe'
}

export function DateRangePicker({
  placeholder = 'Select date range',
  selectedRange,
  variant = 'default',
  onRangeSelect,
  minDate: propMinDate,
  maxDate: propMaxDate,
}: DateRangePickerProps) {
  const [internalRange, setInternalRange] = React.useState<DateRange>({
    from: undefined,
    to: undefined,
  })

  const dateRange = selectedRange ?? internalRange
  const setDateRange = onRangeSelect ?? setInternalRange

  const [selectedPreset, setSelectedPreset] =
    React.useState<PresetOption | null>(null)
  const [customFrom, setCustomFrom] = React.useState('')
  const [customTo, setCustomTo] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)

  // Get effective min and max dates (default maxDate to today if not provided)
  const effectiveMaxDate = React.useMemo(() => {
    const today = startOfDay(new Date())
    return propMaxDate
      ? isBefore(propMaxDate, today)
        ? propMaxDate
        : today
      : today
  }, [propMaxDate])

  const effectiveMinDate = propMinDate

  const handlePresetSelect = (preset: Exclude<PresetOption, 'custom'>) => {
    const today = startOfDay(new Date())
    const maxDate = effectiveMaxDate
    const minDate = effectiveMinDate

    switch (preset) {
      case 'today': {
        const todayDate = isAfter(today, maxDate) ? maxDate : today
        const finalDate =
          minDate && isBefore(todayDate, minDate) ? minDate : todayDate
        setDateRange({ from: finalDate, to: finalDate })
        setSelectedPreset('today')
        break
      }
      case 'this-week': {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
        const actualEnd = isAfter(weekEnd, maxDate) ? maxDate : weekEnd
        const actualStart =
          minDate && isBefore(weekStart, minDate) ? minDate : weekStart
        setDateRange({
          from: actualStart,
          to: actualEnd,
        })
        setSelectedPreset('this-week')
        break
      }
      case 'this-month': {
        const monthStart = startOfMonth(today)
        const monthEnd = endOfMonth(today)
        const actualEnd = isAfter(monthEnd, maxDate) ? maxDate : monthEnd
        const actualStart =
          minDate && isBefore(monthStart, minDate) ? minDate : monthStart
        setDateRange({
          from: actualStart,
          to: actualEnd,
        })
        setSelectedPreset('this-month')
        break
      }
    }
    setOpen(false)
  }

  const handleCustomSubOpen = (isOpen: boolean) => {
    if (isOpen) {
      setCustomFrom(dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '')
      setCustomTo(dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '')
      setError(null)
    }
  }

  const getMaxToDate = (): string => {
    const maxDateStr = format(effectiveMaxDate, 'yyyy-MM-dd')
    if (!customFrom) return maxDateStr
    const fromDate = parse(customFrom, 'yyyy-MM-dd', new Date())
    if (!isValid(fromDate)) return maxDateStr
    const maxFromRange = format(addDays(fromDate, 31), 'yyyy-MM-dd')
    return maxFromRange < maxDateStr ? maxFromRange : maxDateStr
  }

  const getMinDate = (): string | undefined => {
    return effectiveMinDate ? format(effectiveMinDate, 'yyyy-MM-dd') : undefined
  }

  const getMaxDate = (): string => {
    return format(effectiveMaxDate, 'yyyy-MM-dd')
  }

  const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setCustomFrom(value)
      setCustomTo('')
    } else {
      setCustomTo(value)
    }
    setError(null)
  }

  const applyCustomRange = () => {
    const fromDate = parse(customFrom, 'yyyy-MM-dd', new Date())
    const toDate = parse(customTo, 'yyyy-MM-dd', new Date())

    if (!isValid(fromDate) || !isValid(toDate)) {
      setError('Please enter valid dates')
      return
    }

    if (fromDate > toDate) {
      setError('From date must be before To date')
      return
    }

    const daysDiff = differenceInDays(toDate, fromDate)
    if (daysDiff > 31) {
      setError('Date range cannot exceed 31 days')
      return
    }

    if (
      effectiveMinDate &&
      (isBefore(fromDate, effectiveMinDate) ||
        isBefore(toDate, effectiveMinDate))
    ) {
      setError(
        `Dates must be on or after ${format(effectiveMinDate, 'MMM d, yyyy')}`
      )
      return
    }

    if (
      isAfter(fromDate, effectiveMaxDate) ||
      isAfter(toDate, effectiveMaxDate)
    ) {
      setError(
        `Dates must be on or before ${format(effectiveMaxDate, 'MMM d, yyyy')}`
      )
      return
    }

    setDateRange({ from: fromDate, to: toDate })
    setSelectedPreset('custom')
    setOpen(false)
    setError(null)
  }

  const formatDisplayDate = () => {
    const dateFormat = variant === 'secondary' ? 'MMM d' : 'MMM d, yyyy'
    const preset = selectedPreset

    if (preset === 'custom') {
      if (dateRange.from || dateRange.to) {
        if (dateRange.from && dateRange.to) {
          return `${format(dateRange.from, dateFormat)} - ${format(dateRange.to, dateFormat)}`
        } else if (dateRange.from) {
          return `${format(dateRange.from, dateFormat)} - Select End Date`
        } else if (dateRange.to) {
          return `Select Start Date - ${format(dateRange.to, dateFormat)}`
        }
      }
      return 'Custom'
    }

    if (preset === 'today') return 'Today'
    if (preset === 'this-week') return 'This Week'
    if (preset === 'this-month') return 'This Month'
    return `${format(dateRange?.from ?? new Date(), dateFormat)} - ${format(dateRange?.to ?? new Date(), dateFormat)}`
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'text-dark-100 h-7 gap-2 bg-neutral-200 !px-1.5 font-medium',
            variant === 'secondary' &&
              'text-dark-100 !text-paragraph-sm !h-[22px] w-auto justify-between gap-0.5 rounded-[4px] !bg-white !px-1 !font-medium',
            variant === 'timeframe' && '!rounded-[3px] bg-transparent'
          )}
        >
          {formatDisplayDate() || placeholder}
          <CaretDown weight='fill' className='size-3' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem
          onClick={() => handlePresetSelect('today')}
          className={cn(selectedPreset === 'today' && 'bg-accent')}
          variant={variant}
        >
          Today
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlePresetSelect('this-week')}
          className={cn(selectedPreset === 'this-week' && 'bg-accent')}
          variant={variant}
        >
          This Week
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlePresetSelect('this-month')}
          className={cn(selectedPreset === 'this-month' && 'bg-accent')}
          variant={variant}
        >
          This Month
        </DropdownMenuItem>

        <DropdownMenuSub onOpenChange={handleCustomSubOpen}>
          <DropdownMenuSubTrigger
            variant={variant}
            className={cn(selectedPreset === 'custom' && 'bg-accent')}
          >
            Custom
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent sideOffset={8} className='w-[300px] p-2'>
              <div className='flex items-center gap-3'>
                <div className='flex-1'>
                  <label className='text-muted-foreground mb-1 block text-xs'>
                    From
                  </label>
                  <input
                    type='date'
                    value={customFrom}
                    onChange={(e) =>
                      handleCustomDateChange('from', e.target.value)
                    }
                    min={getMinDate()}
                    max={getMaxDate()}
                    className='bg-background text-paragraph-sm w-full rounded border px-2 py-1.5'
                  />
                </div>
                <div className='flex-1'>
                  <label className='text-muted-foreground mb-1 block text-xs'>
                    To
                  </label>
                  <input
                    type='date'
                    value={customTo}
                    onChange={(e) =>
                      handleCustomDateChange('to', e.target.value)
                    }
                    min={customFrom || undefined}
                    max={getMaxToDate()}
                    className='bg-background text-paragraph-sm w-full rounded border px-2 py-1.5'
                  />
                </div>
              </div>
              {error && (
                <p className='text-destructive mt-2 text-xs'>{error}</p>
              )}
              <Button
                size='sm'
                variant='download'
                className={cn(
                  'mt-3 h-7 w-full !rounded',
                  variant === 'secondary' && '!text-paragraph-sm'
                )}
                onClick={applyCustomRange}
              >
                Apply
              </Button>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
