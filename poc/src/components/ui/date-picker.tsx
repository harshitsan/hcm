import React, { useState } from 'react'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  addDays,
} from 'date-fns'
import { CaretDown } from 'phosphor-react'
import { cn } from '@/utils/helpers'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'

type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

type DatePickerProps = {
  selected?: Date | undefined
  selectedRange?: DateRange
  onSelect?: (date: Date | undefined) => void
  onRangeSelect?: (range: DateRange) => void
  placeholder?: string
  mode?: 'single' | 'range'
  variant?: 'default' | 'small' | 'secondary'
  hideYear?: boolean
  minDate?: Date
  maxDate?: Date
  purchaseTimeframe?: boolean
}

type PresetOption = 'today' | 'thisWeek' | 'thisMonth' | 'custom'

const formatDateForInput = (date: Date | undefined): string => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DatePicker({
  selected,
  selectedRange,
  onSelect,
  onRangeSelect,
  placeholder = 'Pick a date',
  mode = 'single',
  variant = 'default',
  hideYear = false,
  minDate,
  maxDate,
  purchaseTimeframe = false,
}: DatePickerProps) {
  const [preset, setPreset] = useState<PresetOption>('thisMonth')
  const [tempRange, setTempRange] = useState<DateRange>({
    from: selectedRange?.from,
    to: selectedRange?.to,
  })

  const [inputFromValue, setInputFromValue] = useState<string>(
    selectedRange?.from ? formatDateForInput(selectedRange.from) : ''
  )
  const [inputToValue, setInputToValue] = useState<string>(
    selectedRange?.to ? formatDateForInput(selectedRange.to) : ''
  )

  const handlePresetChange = (value: PresetOption) => {
    setPreset(value)

    if (mode === 'range' && onRangeSelect) {
      const today = new Date()
      let range: DateRange = { from: undefined, to: undefined }

      switch (value) {
        case 'today':
          range = { from: startOfDay(today), to: endOfDay(today) }
          break
        case 'thisWeek': {
          const weekStart = startOfWeek(today)
          const weekEnd = endOfWeek(today)
          range = {
            from: weekStart,
            to: weekEnd > today ? endOfDay(today) : weekEnd,
          }
          break
        }
        case 'thisMonth': {
          const monthStart = startOfMonth(today)
          const monthEnd = endOfMonth(today)
          range = {
            from: monthStart,
            to: monthEnd > today ? endOfDay(today) : monthEnd,
          }
          break
        }
        case 'custom':
          range = { from: undefined, to: undefined }
          break
      }

      setTempRange(range)
      setInputFromValue(range.from ? formatDateForInput(range.from) : '')
      setInputToValue(range.to ? formatDateForInput(range.to) : '')
      onRangeSelect(range)
    } else if (mode === 'single' && onSelect) {
      const today = new Date()
      let date: Date | undefined = undefined

      switch (value) {
        case 'today':
          date = today
          break
        case 'thisWeek':
          date = startOfWeek(today)
          break
        case 'thisMonth':
          date = startOfMonth(today)
          break
        case 'custom':
          date = undefined
          break
      }

      onSelect(date)
    }
  }

  const dateFormat = hideYear ? 'MMM d' : 'MMM d, yyyy'

  const formatDateRange = (range: DateRange) => {
    if (!range.from && !range.to) return 'Select Date Range'
    if (range.from && range.to) {
      return `${format(range.from, dateFormat)} - ${format(range.to, dateFormat)}`
    }
    if (range.from) {
      return `${format(range.from, dateFormat)} - Select End Date`
    }
    if (range.to) {
      return `Select Start Date - ${format(range.to, dateFormat)}`
    }
    return 'Select Date Range'
  }

  const formatSingleDate = (date: Date | undefined) => {
    if (!date) return placeholder
    return format(date, dateFormat)
  }

  const getDisplayValue = () => {
    if (preset === 'custom') {
      if (tempRange && (tempRange.from || tempRange.to)) {
        // Show both from and to dates in the main display
        if (tempRange.from && tempRange.to) {
          return `${format(tempRange.from, dateFormat)} - ${format(tempRange.to, dateFormat)}`
        } else if (tempRange.from) {
          return `${format(tempRange.from, dateFormat)} - Select End Date`
        } else if (tempRange.to) {
          return `Select Start Date - ${format(tempRange.to, dateFormat)}`
        }
        return formatDateRange(tempRange)
      } else if (mode === 'single' && selected) {
        return formatSingleDate(selected)
      }
      return 'Custom'
    }

    if (preset === 'today') return 'Today'
    if (preset === 'thisWeek') return 'This Week'
    if (preset === 'thisMonth') return 'This Month'
    return // default
  }

  const handleCustomDateChange = (
    field: 'from' | 'to',
    date: Date | undefined
  ) => {
    // Prevent selecting future dates
    if (date && date > endOfDay(new Date())) {
      return
    }

    const newRange = {
      from: field === 'from' ? date : tempRange.from,
      to: field === 'to' ? date : tempRange.to,
    }

    // If selecting 'from' date and 'to' date exists, ensure 'to' is not before 'from'
    if (field === 'from' && date && newRange.to && date > newRange.to) {
      newRange.to = date // Set 'to' to the same date as 'from'
    }

    // If selecting 'to' date and 'from' date exists, ensure 'to' is not before 'from'
    if (field === 'to' && date && newRange.from && date < newRange.from) {
      return // Don't allow selecting an end date before the start date
    }

    // Validate 31-day limit when both dates exist
    if (newRange.from && newRange.to) {
      const daysDifference = differenceInDays(newRange.to, newRange.from)

      if (daysDifference > 31) {
        // If 'from' date is being changed, adjust 'to' to be 31 days after 'from'
        if (field === 'from') {
          const maxToDate = addDays(newRange.from, 31)
          // Ensure maxToDate doesn't exceed today
          const today = endOfDay(new Date())
          newRange.to = maxToDate > today ? today : maxToDate
        } else {
          // If 'to' date is being changed and exceeds 31 days, reject it
          return
        }
      }
    }

    // Always update tempRange
    setTempRange(newRange)

    // Update input values to match
    if (field === 'from') {
      setInputFromValue(date ? formatDateForInput(date) : '')
      // If 'to' was adjusted, update its input value too
      if (newRange.to) {
        setInputToValue(formatDateForInput(newRange.to))
      }
    } else {
      setInputToValue(date ? formatDateForInput(date) : '')
    }

    // Set preset to custom when dates are selected
    setPreset('custom')

    // Call appropriate callback based on mode
    if (mode === 'range' && onRangeSelect) {
      onRangeSelect(newRange)
    } else if (mode === 'single' && onSelect) {
      // For single mode, use the 'from' date as the selected date
      onSelect(newRange.from)
    }
  }

  const handleInputDateChange = (field: 'from' | 'to', value: string) => {
    // Update local input state immediately (allows typing without losing focus)
    if (field === 'from') {
      setInputFromValue(value)
    } else {
      setInputToValue(value)
    }

    // Only process and validate when we have a complete date value
    if (!value) {
      handleCustomDateChange(field, undefined)
      return
    }

    // Check if the value is a valid date string (YYYY-MM-DD format)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(value)) {
      // Incomplete date, don't process yet
      return
    }

    const date = new Date(value + 'T00:00:00') // Add time to avoid timezone issues
    if (isNaN(date.getTime())) {
      return
    }

    // Validate the date
    handleCustomDateChange(field, date)
  }

  const handleInputBlur = (field: 'from' | 'to') => {
    const value = field === 'from' ? inputFromValue : inputToValue

    // If empty, clear the date
    if (!value || value.trim() === '') {
      handleCustomDateChange(field, undefined)
      return
    }

    // Check if the value is a valid date string (YYYY-MM-DD format)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(value)) {
      // Invalid or incomplete date, reset to last valid value
      const currentDate = field === 'from' ? tempRange.from : tempRange.to
      if (field === 'from') {
        setInputFromValue(currentDate ? formatDateForInput(currentDate) : '')
      } else {
        setInputToValue(currentDate ? formatDateForInput(currentDate) : '')
      }
      return
    }

    // Try to parse and validate the date
    const date = new Date(value + 'T00:00:00') // Add time to avoid timezone issues
    if (isNaN(date.getTime())) {
      // Invalid date, reset to last valid value
      const currentDate = field === 'from' ? tempRange.from : tempRange.to
      if (field === 'from') {
        setInputFromValue(currentDate ? formatDateForInput(currentDate) : '')
      } else {
        setInputToValue(currentDate ? formatDateForInput(currentDate) : '')
      }
      return
    }

    // Check 31-day limit before calling handleCustomDateChange
    if (field === 'to' && tempRange.from) {
      const daysDifference = differenceInDays(date, tempRange.from)
      if (daysDifference > 31) {
        // Date exceeds 31 days, reset to last valid value or adjust to max
        const maxToDate = addDays(tempRange.from, 31)
        const today = endOfDay(new Date())
        const adjustedDate = maxToDate > today ? today : maxToDate
        setInputToValue(formatDateForInput(adjustedDate))
        handleCustomDateChange('to', adjustedDate)
        return
      }
    }

    // Validate and submit the date
    handleCustomDateChange(field, date)
  }

  const getMaxDate = (): string => {
    if (maxDate) {
      return formatDateForInput(maxDate)
    }
    const today = new Date()
    return formatDateForInput(today)
  }

  const getMaxToDate = (): string => {
    const today = endOfDay(new Date())
    const effectiveMaxDate = maxDate ? endOfDay(maxDate) : today

    if (tempRange.from) {
      const maxDateFromRange = addDays(tempRange.from, 31)
      const maxDate =
        maxDateFromRange > effectiveMaxDate
          ? effectiveMaxDate
          : maxDateFromRange
      return formatDateForInput(maxDate)
    }
    return formatDateForInput(effectiveMaxDate)
  }

  const getMinDate = (): string => {
    if (minDate) {
      return formatDateForInput(minDate)
    }
    return '1900-01-01'
  }

  // Helper function to check if a date range matches a preset
  const checkPresetMatch = React.useCallback(
    (range: DateRange): PresetOption | null => {
      if (!range.from || !range.to) return null

      const today = new Date()
      const todayStart = startOfDay(today)
      const todayEnd = endOfDay(today)
      const weekStart = startOfWeek(today)
      const weekEnd = endOfWeek(today)
      const monthStart = startOfMonth(today)
      const monthEnd = endOfMonth(today)

      const rangeFrom = startOfDay(range.from)
      const rangeTo = endOfDay(range.to)

      // Check if matches "today"
      if (
        rangeFrom.getTime() === todayStart.getTime() &&
        rangeTo.getTime() === todayEnd.getTime()
      ) {
        return 'today'
      }

      // Check if matches "thisWeek"
      const weekEndAdjusted = weekEnd > today ? todayEnd : endOfDay(weekEnd)
      if (
        rangeFrom.getTime() === startOfDay(weekStart).getTime() &&
        rangeTo.getTime() === weekEndAdjusted.getTime()
      ) {
        return 'thisWeek'
      }

      // Check if matches "thisMonth"
      const monthEndAdjusted = monthEnd > today ? todayEnd : endOfDay(monthEnd)
      if (
        rangeFrom.getTime() === startOfDay(monthStart).getTime() &&
        rangeTo.getTime() === monthEndAdjusted.getTime()
      ) {
        return 'thisMonth'
      }

      return null
    },
    []
  )

  React.useEffect(() => {
    if (selectedRange) {
      setTempRange(selectedRange)
      setInputFromValue(
        selectedRange.from ? formatDateForInput(selectedRange.from) : ''
      )
      setInputToValue(
        selectedRange.to ? formatDateForInput(selectedRange.to) : ''
      )

      // Determine if the selectedRange matches a preset
      if (selectedRange.from && selectedRange.to) {
        const matchedPreset = checkPresetMatch(selectedRange)
        if (matchedPreset) {
          setPreset(matchedPreset)
        } else {
          // Custom date range
          setPreset('custom')
        }
      } else if (selectedRange.from || selectedRange.to) {
        // Partial range - treat as custom
        setPreset('custom')
      }
    }
  }, [selectedRange, checkPresetMatch])

  const isSmall = variant === 'small'

  return (
    <div className={isSmall ? '' : 'space-y-3'}>
      {/* Date Picker Menubar */}
      <Menubar
        className={isSmall ? '!h-[22px] !border-0 px-0' : 'h-7 !border-t px-0'}
      >
        <MenubarMenu>
          <MenubarTrigger
            className={
              isSmall
                ? 'text-dark-100 !h-[22px] w-auto justify-between gap-0.5 rounded-[4px] !bg-white px-2 text-sm !font-semibold'
                : purchaseTimeframe
                  ? 'hover:bg-accent rounded-[4px] !border !bg-neutral-200 font-normal hover:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] focus-visible:shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:ring-[1px] active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F]'
                  : '!text-neutral-1600 text-paragraph-md !h-7 w-full justify-start !bg-neutral-200 !px-1.5 !font-medium shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5]'
            }
          >
            <span className={isSmall ? 'text-xs font-semibold' : ''}>
              {getDisplayValue()}
            </span>
            <CaretDown
              weight='fill'
              className={cn(isSmall ? 'size-3' : 'size-3.5', 'ml-0.5')}
            />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              className='!text-grey-100'
              onClick={() => handlePresetChange('today')}
            >
              Today
            </MenubarItem>
            <MenubarItem
              className='!text-grey-100'
              onClick={() => handlePresetChange('thisWeek')}
            >
              This Week
            </MenubarItem>
            <MenubarItem
              className='!text-grey-100'
              onClick={() => handlePresetChange('thisMonth')}
            >
              This Month
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger className='!text-grey-100'>
                Custom
              </MenubarSubTrigger>
              <MenubarSubContent sideOffset={10}>
                <div className='p-1'>
                  <div className='space-y-2'>
                    <div className='flex gap-2'>
                      <div className='flex-1'>
                        <label
                          htmlFor='date-picker-from'
                          className='text-paragraph-sm text-neutral-1800 mb-1 block font-medium'
                        >
                          From
                        </label>
                        <input
                          id='date-picker-from'
                          type='date'
                          value={inputFromValue}
                          onChange={(e) =>
                            handleInputDateChange('from', e.target.value)
                          }
                          onBlur={() => handleInputBlur('from')}
                          max={getMaxDate()}
                          min={getMinDate()}
                          className='text-paragraph-sm text-neutral-1800 border-input bg-background focus-visible:ring-ring h-8 w-full rounded border px-3 py-1 font-normal focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                        />
                      </div>

                      <div className='flex-1'>
                        <label
                          htmlFor='date-picker-to'
                          className='text-paragraph-sm text-neutral-1800 mb-1 block font-medium'
                        >
                          To
                        </label>
                        <input
                          id='date-picker-to'
                          type='date'
                          value={inputToValue}
                          onChange={(e) =>
                            handleInputDateChange('to', e.target.value)
                          }
                          onBlur={() => handleInputBlur('to')}
                          max={getMaxToDate()}
                          min={
                            tempRange.from
                              ? formatDateForInput(tempRange.from)
                              : getMinDate()
                          }
                          className='text-paragraph-sm text-neutral-1800 border-input bg-background focus-visible:ring-ring h-8 w-full rounded border px-3 py-1 font-normal focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  )
}
