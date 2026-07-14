import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  kbd?: string
}

export function SearchInput({ className, kbd, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={15}
        className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle'
      />
      <input
        type='text'
        className={cn(
          'h-9 w-full rounded-[var(--radius-ds)] border border-border bg-ground pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus-visible:ring-2 focus-visible:ring-ink/15',
          kbd ? 'pr-10' : undefined
        )}
        {...props}
      />
      {kbd ? (
        <kbd className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] text-ink-subtle'>
          {kbd}
        </kbd>
      ) : null}
    </div>
  )
}
