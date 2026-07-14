import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface TypePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: LucideIcon
}

export function TypePill({ icon: Icon, className, children, ...props }: TypePillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-ground px-2.5 py-1 text-xs text-ink',
        className
      )}
      {...props}
    >
      {Icon ? <Icon size={13} className='text-ink-muted' /> : null}
      {children}
    </span>
  )
}
