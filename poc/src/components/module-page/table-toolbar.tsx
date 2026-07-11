import { Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/helpers'

/**
 * Canonical toolbar row above a table (scaffold kit §3): filters/search on
 * the left, actions on the right, instant-apply (no Search/Reset buttons).
 */
export function TableToolbar({
  start,
  end,
  className,
}: {
  start?: React.ReactNode
  end?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-3 flex flex-wrap items-center justify-between gap-2',
        className
      )}
    >
      <div className='flex flex-wrap items-center gap-2'>{start}</div>
      <div className='flex flex-wrap items-center gap-2'>{end}</div>
    </div>
  )
}

/** Compact "Label: All + options" instant filter dropdown (h-7 secondary). */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  allLabel?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        variant='secondary'
        className={cn('h-7 w-fit min-w-[130px] text-sm', className)}
        aria-label={label}
      >
        <span className='text-neutral-1000 mr-1'>{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Instant search input for toolbars (h-7 w-[180px]). */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn('h-7 w-[180px]', className)}
      aria-label={placeholder}
    />
  )
}

/** Canonical orange "+ New X" create button. */
export function CreateButton({
  label,
  onClick,
  disabled,
  disabledHint,
  className,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  disabledHint?: string
  className?: string
}) {
  const button = (
    <Button
      variant='red'
      onClick={onClick}
      disabled={disabled}
      title={disabled && disabledHint ? disabledHint : undefined}
      className={cn(
        'bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!',
        className
      )}
    >
      <Plus size={10} weight='bold' />
      {label}
    </Button>
  )
  if (disabled && disabledHint) {
    // A disabled button swallows pointer events, so the hint lives on a wrapper.
    return (
      <span title={disabledHint} className='inline-flex'>
        {button}
      </span>
    )
  }
  return button
}
