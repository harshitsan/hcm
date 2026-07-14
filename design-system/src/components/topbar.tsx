import * as React from 'react'
import { cn } from '@/lib/cn'

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  breadcrumb?: string
  title: string
  actions?: React.ReactNode
}

export function TopBar({ breadcrumb, title, actions, className, ...props }: TopBarProps) {
  return (
    <div className={cn('flex items-end justify-between', className)} {...props}>
      <div>
        {breadcrumb ? (
          <div className='mb-1 text-sm text-ink-muted'>{breadcrumb}</div>
        ) : null}
        <h1 className='text-[28px] font-bold leading-tight text-ink'>{title}</h1>
      </div>
      {actions ? <div className='flex items-center gap-2.5'>{actions}</div> : null}
    </div>
  )
}
