import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, value, onChange, className, ...props }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-5 border-b border-border', className)} {...props}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = tab.id === value

        return (
          <button
            key={tab.id}
            type='button'
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors',
              active
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {Icon ? <Icon size={15} /> : null}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
