import * as React from 'react'
import { cn } from '@/lib/cn'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

export interface DateRangeProps extends React.HTMLAttributes<HTMLSpanElement> {
  from: string
  to?: string
}

export function DateRange({ from, to, className, ...props }: DateRangeProps) {
  const label = to ? `${formatDate(from)} – ${formatDate(to)}` : formatDate(from)

  return (
    <span className={cn('text-sm text-ink-muted', className)} {...props}>
      {label}
    </span>
  )
}
