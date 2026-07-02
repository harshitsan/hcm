import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { formatDateWithTimezone } from '@/utils/date'
import { formatTotalDuration } from '@/utils/duration'
import { cn } from '@/utils/helpers'
import { toTitleCase } from '@/utils/ui-helpers'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ColumnSearchProps {
  columnId: string
  columnName: string
  data: unknown[]
  accessorKey?: string
  onFilterChange: (columnId: string, value: string) => void
  filterValue?: string
  children: React.ReactNode
  isDateColumn?: boolean
  dateFormat?: string
  isDurationColumn?: boolean
  disabled?: boolean
}

// Helper to check if a string is a valid date
const isValidDate = (value: string): boolean => {
  const date = new Date(value)
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)
}

export function ColumnSearch({
  columnId,
  columnName,
  data,
  accessorKey,
  onFilterChange,
  filterValue = '',
  children,
  isDateColumn = false,
  dateFormat,
  isDurationColumn = false,
  disabled,
}: ColumnSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(filterValue)

  // Sync searchValue with filterValue when it changes externally
  // Also clear if filterValue is empty (another column search was initiated)
  useEffect(() => {
    setSearchValue(filterValue || '')
  }, [filterValue])

  // Helper to extract string value from unknown type (handles objects, arrays, etc.)
  const extractStringValue = (value: unknown): string | null => {
    if (value === null || value === undefined) return null

    // If it's already a string or number, convert to string
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }

    // If it's an object, try to extract meaningful value
    if (typeof value === 'object') {
      // Check for common properties that might contain the display value
      if ('value' in value && typeof value.value === 'string') {
        return value.value
      }
      if ('name' in value && typeof value.name === 'string') {
        return value.name
      }
      if ('label' in value && typeof value.label === 'string') {
        return value.label
      }
      if ('text' in value && typeof value.text === 'string') {
        return value.text
      }
      // If it's an array, join it
      if (Array.isArray(value)) {
        return value.map(String).join(', ')
      }
      // Last resort: try JSON.stringify for objects
      try {
        const jsonStr = JSON.stringify(value)
        // If it's a simple object with one string property, extract it
        const parsed = JSON.parse(jsonStr)
        if (typeof parsed === 'object' && parsed !== null) {
          const keys = Object.keys(parsed)
          if (keys.length === 1 && typeof parsed[keys[0]] === 'string') {
            return parsed[keys[0]]
          }
        }
      } catch {
        // JSON parsing failed
      }
    }

    // Fallback to String conversion
    const stringValue = String(value)
    // Don't return [object Object]
    if (stringValue === '[object Object]') {
      return null
    }

    return stringValue
  }

  // Get unique values from the column data
  const uniqueValues = useMemo(() => {
    if (!data || data.length === 0) return []

    const values = new Set<string>()
    data.forEach((row) => {
      let value: unknown
      if (accessorKey) {
        value = (row as Record<string, unknown>)[accessorKey]
      } else {
        // Try to get value by columnId
        value = (row as Record<string, unknown>)[columnId]
      }

      const stringValue = extractStringValue(value)

      if (stringValue) {
        let finalValue = stringValue

        // Format date if it's a date column
        if (isDateColumn) {
          try {
            // Check if it's already a formatted date (contains month abbreviations)
            const monthAbbrevs = [
              'jan',
              'feb',
              'mar',
              'apr',
              'may',
              'jun',
              'jul',
              'aug',
              'sep',
              'oct',
              'nov',
              'dec',
            ]
            const hasMonthAbbrev = monthAbbrevs.some((month) =>
              finalValue.toLowerCase().includes(month)
            )

            if (hasMonthAbbrev) {
              // Already formatted - extract just the date part (remove time if present)
              // Match patterns like "01 Aug 2025, 12:00 Am" and extract "01 Aug 2025"
              const dateOnlyMatch = finalValue.match(
                /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})/i
              )
              if (dateOnlyMatch) {
                finalValue = dateOnlyMatch[1]
              }
            } else if (isValidDate(finalValue)) {
              // Raw date string - format it using the dateFormat from column meta
              const formatToUse = dateFormat || 'dd MMM yyyy'
              finalValue = formatDateWithTimezone(
                new Date(finalValue),
                formatToUse
              )
            }
          } catch {
            // If formatting fails, use original value
          }
        }

        // Format duration if it's a duration column
        if (isDurationColumn) {
          try {
            // Check if it's already formatted (contains 'm' or 's' or 'h')
            const isFormatted = /[hms]/.test(finalValue.toLowerCase())

            if (!isFormatted) {
              // Raw number (seconds) - format it
              const seconds = Number(finalValue)
              if (!isNaN(seconds)) {
                finalValue = formatTotalDuration(seconds)
              }
            }
            // If already formatted, use as is
          } catch {
            // If formatting fails, use original value
          }
        }

        if (finalValue.trim()) {
          values.add(finalValue)
        }
      }
    })

    return Array.from(values).sort()
  }, [data, accessorKey, columnId, isDateColumn, dateFormat, isDurationColumn])

  // Filter unique values based on search
  const filteredValues = useMemo(() => {
    if (!searchValue.trim()) return uniqueValues

    const searchLower = searchValue.toLowerCase()
    return uniqueValues.filter((value) =>
      value.toLowerCase().includes(searchLower)
    )
  }, [uniqueValues, searchValue])

  const handleSearchChange = (value: string) => {
    // Only update local search value to filter dropdown options
    // Don't trigger table filter until user selects an option
    setSearchValue(value)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const handleSelectValue = (value: string) => {
    setSearchValue(value)
    onFilterChange(columnId, value)
    setOpen(false)
  }

  const handleClear = () => {
    setSearchValue('')
    onFilterChange(columnId, '')
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger
        asChild
        disabled={disabled}
        className='disabled:opacity-100'
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        className='w-[280px] rounded p-0'
        align='start'
        side='bottom'
        onScroll={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className='flex flex-col'>
          <div className='px-0 pt-0'>
            <div className='text-neutral-1600 bg-alpha-white-300 text-paragraph-sm mb-2 px-2 py-1 font-medium'>
              {columnName}
            </div>
            <div className='px-2'>
              <div className='relative mb-1.5'>
                <Search className='text-neutral-1600 absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
                <Input
                  type='text'
                  placeholder='Search'
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='h-7 rounded pr-8 pl-8'
                  autoFocus
                />
                {searchValue && (
                  <button
                    onClick={handleClear}
                    className='text-neutral-1600 absolute top-1/2 right-2 -translate-y-1/2 text-xs hover:underline'
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className='max-h-[240px] overflow-y-auto border-t'>
            {filteredValues.length > 0 ? (
              <div className='py-0'>
                {filteredValues.map((value, index) => (
                  <button
                    key={`${value}-${index}`}
                    onClick={() => handleSelectValue(value)}
                    className={cn(
                      'text-neutral-1600 w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100',
                      searchValue &&
                        value
                          .toLowerCase()
                          .includes(searchValue.toLowerCase()) &&
                        'bg-blue-50'
                    )}
                  >
                    {toTitleCase(value)}
                  </button>
                ))}
              </div>
            ) : (
              <div className='text-neutral-1600 py-4 text-center text-sm'>
                No results found
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
