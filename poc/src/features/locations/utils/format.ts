import type { DateFormat } from '../data/organization'

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Render an ISO date (yyyy-mm-dd) in the organization's configured date
 * format (LOC-26 — dates display consistently across the module).
 */
export function formatDate(iso: string | null, format: DateFormat): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  if (!y || !m || !d) return iso
  switch (format) {
    case 'DD MMM YYYY':
      return `${d} ${MONTH_ABBR[Number(m) - 1] ?? m} ${y}`
    case 'DD/MM/YYYY':
      return `${d}/${m}/${y}`
    case 'MM/DD/YYYY':
      return `${m}/${d}/${y}`
    case 'YYYY-MM-DD':
      return `${y}-${m}-${d}`
  }
}

/** Today as an ISO yyyy-mm-dd string. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
