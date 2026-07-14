import * as React from 'react'
import { cn } from '@/lib/cn'

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar: React.ReactNode
}

export function AppShell({ sidebar, className, children, ...props }: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen bg-ground', className)} {...props}>
      {sidebar}
      <div className='flex-1 overflow-y-auto px-8 py-6'>
        <div className='mx-auto flex max-w-6xl flex-col gap-6'>{children}</div>
      </div>
    </div>
  )
}
