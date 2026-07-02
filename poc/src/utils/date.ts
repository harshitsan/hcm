import {
  endOfDay,
  endOfMonth,
  format,
  isToday,
  isYesterday,
  parseISO,
  startOfDay,
  startOfMonth,
  formatDate as formatDateFns,
} from 'date-fns'

export const FORMAT_DATE_TIME_12HR = 'dd MMM yyyy, h:mm a'
export const FORMAT_DATE_TIME_12HR_SHORT = 'd MMM, yyyy h:mm a'

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateWithTimezone(
  date: Date,
  format: string = 'dd MMM yyyy HH:mm'
): string {
  return formatDateFns(new Date(date + 'Z'), format)
}

export const getDateRange = (timeframe: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (timeframe) {
    case 'week': {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // End of current week (Saturday)
      const endDate = endOfWeek > today ? today : endOfWeek

      const result = {
        start_date: formatDate(startOfWeek),
        end_date: formatDate(endDate),
      }
      return result
    }
    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      const endDate = endOfMonth > today ? today : endOfMonth

      const result = {
        start_date: formatDate(startOfMonth),
        end_date: formatDate(endDate),
      }
      return result
    }
    case 'next-month': {
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      // Calculate next month (0-indexed: 0=Jan, 11=Dec)
      let nextMonth = currentMonth + 1
      let nextYear = currentYear

      // If we're in December (month 11), next month is January of next year
      if (nextMonth > 11) {
        nextMonth = 0
        nextYear = currentYear + 1
      }

      const startOfNextMonth = new Date(nextYear, nextMonth, 1)
      const endOfNextMonth = new Date(nextYear, nextMonth + 1, 0)

      // Only cap end date if we're already in the next month
      // If we're still in the current month, use the full next month range
      const isInNextMonth = today >= startOfNextMonth
      const endDate =
        isInNextMonth && endOfNextMonth > today ? today : endOfNextMonth

      const result = {
        start_date: formatDate(startOfNextMonth),
        end_date: formatDate(endDate),
      }
      return result
    }
    case 'year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      const endOfYear = new Date(today.getFullYear(), 11, 31)
      const endDate = endOfYear > today ? today : endOfYear

      const result = {
        start_date: formatDate(startOfYear),
        end_date: formatDate(endDate),
      }
      return result
    }
    default:
      return {
        start_date: formatDate(today),
        end_date: formatDate(today),
      }
  }
}

export function validateAndAdjustDateRange(
  globalRange: {
    startDate: string | null | undefined
    endDate: string | null | undefined
  },
  localRange: {
    start_date: string
    end_date: string
  }
): {
  start_date: string
  end_date: string
  shouldShowAlert: boolean
} {
  // If global range is not available, return local range as-is
  if (!globalRange.startDate || !globalRange.endDate) {
    return {
      ...localRange,
      shouldShowAlert: false,
    }
  }
  // Parse dates
  const globalStart = new Date(globalRange.startDate)
  const globalEnd = new Date(globalRange.endDate)
  const localStart = new Date(localRange.start_date)
  const localEnd = new Date(localRange.end_date)

  // Check if local range is completely outside global range
  const isLocalOutsideGlobal = localEnd < globalStart || localStart > globalEnd

  if (isLocalOutsideGlobal) {
    return {
      start_date: globalRange.startDate,
      end_date: globalRange.endDate,
      shouldShowAlert: true,
    }
  }

  // Check if local range is greater than global range (local extends beyond global)
  const isLocalGreaterThanGlobal =
    localStart < globalStart || localEnd > globalEnd

  if (isLocalGreaterThanGlobal) {
    // Use global range (clamp local to global boundaries)
    return {
      start_date: globalRange.startDate,
      end_date: globalRange.endDate,
      shouldShowAlert: false,
    }
  }

  // Local range is within global range, use local range
  return {
    ...localRange,
    shouldShowAlert: false,
  }
}

export function isDateRangeThisMonth(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): boolean {
  if (!startDate || !endDate) {
    return false
  }
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const thisMonthEnd = monthEnd > today ? endOfDay(today) : monthEnd

  const filterStart = startOfDay(new Date(startDate))
  const filterEnd = endOfDay(new Date(endDate))

  return (
    filterStart.getTime() === startOfDay(monthStart).getTime() &&
    filterEnd.getTime() === thisMonthEnd.getTime()
  )
}

export function formatDateTime(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd MMM yyyy, h:mm a')
  } catch {
    return dateString
  }
}

export function getCurrentMonthRange() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  // Use today's date if end of month is in the future
  const endDate = endOfMonth > now ? now : endOfMonth

  return {
    startDate: formatDate(startOfMonth),
    endDate: formatDate(endDate),
  }
}

export function formatDateTimeSplit(dateString: string): {
  date: string
  time: string
} {
  try {
    const date = new Date(dateString)
    return {
      date: format(date, 'dd MMM yyyy'),
      time: format(date, 'h:mm a'),
    }
  } catch {
    return {
      date: dateString,
      time: '',
    }
  }
}

export function formatChatDate(dateString: string): string {
  try {
    const date = parseISO(dateString)
    if (isToday(date)) {
      return 'TODAY'
    }
    if (isYesterday(date)) {
      return 'YESTERDAY'
    }
    return format(date, 'dd MMM yyyy')
  } catch {
    return dateString
  }
}
