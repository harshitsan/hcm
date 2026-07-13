import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/helpers'

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
