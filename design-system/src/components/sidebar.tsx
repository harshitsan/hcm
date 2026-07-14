import * as React from 'react'
import { ChevronsUpDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface WorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  org: string
  avatar?: React.ReactNode
}

export function WorkspaceCard({ name, org, avatar, className, ...props }: WorkspaceCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-[var(--radius-ds)] border border-border p-2',
        className
      )}
      {...props}
    >
      <span className='flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-ink text-xs font-semibold text-primary-fg'>
        {avatar ?? name.slice(0, 1).toUpperCase()}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-semibold text-ink'>{name}</span>
        <span className='block truncate text-xs text-ink-muted'>{org}</span>
      </span>
      <ChevronsUpDown size={14} className='shrink-0 text-ink-subtle' />
    </div>
  )
}

export interface NavGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  action?: React.ReactNode
}

export function NavGroup({ label, action, className, children, ...props }: NavGroupProps) {
  return (
    <div className={cn('group/nav', className)} {...props}>
      <div className='flex items-center justify-between px-2.5 py-1'>
        <span className='text-xs font-medium text-ink-subtle'>{label}</span>
        {action ? (
          <span className='opacity-0 transition-opacity group-hover/nav:opacity-100'>
            {action}
          </span>
        ) : null}
      </div>
      <div className='flex flex-col gap-0.5'>{children}</div>
    </div>
  )
}

export interface NavItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  label: string
  active?: boolean
  iconColor?: string
}

export function NavItem({
  icon: Icon,
  label,
  active,
  iconColor,
  className,
  ...props
}: NavItemProps) {
  return (
    <button
      type='button'
      className={cn(
        'flex items-center gap-2.5 rounded-[var(--radius-ds)] px-2.5 py-1.5 text-left text-sm transition-colors',
        active
          ? 'border border-border bg-ground text-ink shadow-[var(--ds-shadow-xs)]'
          : 'border border-transparent text-ink-muted hover:bg-muted',
        className
      )}
      {...props}
    >
      {Icon ? (
        <Icon size={16} className='shrink-0' style={iconColor ? { color: iconColor } : undefined} />
      ) : null}
      <span className='truncate'>{label}</span>
    </button>
  )
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex w-62 shrink-0 flex-col gap-4 border-r border-border bg-surface px-3 py-4',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}
