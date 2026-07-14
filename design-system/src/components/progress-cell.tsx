import * as React from 'react'
import { cn } from '@/lib/cn'
import { type Tone } from '@/components/badge'

function toneForValue(value: number): Tone {
  if (value < 34) return 'high'
  if (value < 67) return 'medium'
  return 'success'
}

const fillClasses: Record<Tone, string> = {
  high: 'bg-high-fg',
  medium: 'bg-medium-fg',
  low: 'bg-low-fg',
  success: 'bg-success-fg',
  info: 'bg-info-fg',
  neutral: 'bg-neutral-fg',
}

export interface ProgressCellProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  tone?: Tone
}

export function ProgressCell({ value, tone, className, ...props }: ProgressCellProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const resolvedTone = tone ?? toneForValue(clamped)

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <span className='text-sm text-ink'>{clamped}%</span>
      <span className='h-1.5 w-16 overflow-hidden rounded-full bg-muted'>
        <span
          className={cn('block h-full rounded-full', fillClasses[resolvedTone])}
          style={{ width: `${clamped}%` }}
        />
      </span>
    </div>
  )
}
