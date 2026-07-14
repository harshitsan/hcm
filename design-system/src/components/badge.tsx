import * as React from 'react'
import { cn } from '@/lib/cn'

export type Tone = 'high' | 'medium' | 'low' | 'success' | 'info' | 'neutral'

const toneClasses: Record<Tone, string> = {
  high: 'bg-high-bg text-high-fg',
  medium: 'bg-medium-bg text-medium-fg',
  low: 'bg-low-bg text-low-fg',
  success: 'bg-success-bg text-success-fg',
  info: 'bg-info-bg text-info-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
}

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: Tone
}

export function StatusPill({ tone, className, children, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-muted px-1.5 text-xs text-ink-muted',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
