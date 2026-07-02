export interface PeriodStatusFilter {
  from: string
  to: string
  status: string
}

export const EMPTY_FILTER: PeriodStatusFilter = {
  from: '',
  to: '',
  status: 'All',
}

/** Applies a period/status filter over rows exposing a date + status. */
export function applyFilter<T>(
  rows: T[],
  filter: PeriodStatusFilter,
  getDate: (row: T) => string,
  getStatus: (row: T) => string
): T[] {
  return rows.filter((row) => {
    const date = getDate(row).slice(0, 10)
    if (filter.from && date < filter.from) return false
    if (filter.to && date > filter.to) return false
    if (filter.status !== 'All' && getStatus(row) !== filter.status)
      return false
    return true
  })
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string | null): string {
  if (!iso || iso === '—') return '—'
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : dateFmt.format(parsed)
}

export function formatDateTime(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return `${dateFmt.format(parsed)}, ${parsed.toTimeString().slice(0, 5)}`
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
