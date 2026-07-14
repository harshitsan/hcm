import * as React from 'react'
import { cn } from '@/lib/cn'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

const sizeClasses = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  src?: string
  size?: keyof typeof sizeClasses
}

export function Avatar({ name, src, size = 'md', className, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-ink-muted ring-2 ring-ground',
        sizeClasses[size],
        className
      )}
      title={name}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className='size-full rounded-full object-cover' />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  names: string[]
  max?: number
  size?: keyof typeof sizeClasses
}

export function AvatarStack({
  names,
  max = 4,
  size = 'md',
  className,
  ...props
}: AvatarStackProps) {
  const shown = names.slice(0, max)
  const overflow = names.length - shown.length

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {shown.map((name, i) => (
        <Avatar key={`${name}-${i}`} name={name} size={size} />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-ink-muted ring-2 ring-ground',
            sizeClasses[size]
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  )
}
