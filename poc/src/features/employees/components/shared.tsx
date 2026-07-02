import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/helpers'

type BadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'pending'
  | 'completed'
  | 'dropped'
  | 'overdue'
  | 'qualified'
  | 'disqualified'

/** Maps workflow status labels onto the design-system badge variants. */
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  // lifecycle stages
  Onboarding: 'open',
  Probation: 'overdue',
  Active: 'badge_active',
  Transferred: 'open',
  'Notice Period': 'overdue',
  Exited: 'badge_inactive',
  // generic workflow statuses
  'Pending initiation': 'pending',
  'In Progress': 'open',
  Completed: 'completed',
  'Pending submission': 'pending',
  'Pending for Submission': 'pending',
  Submitted: 'open',
  'Pending approval': 'overdue',
  Approved: 'qualified',
  Rejected: 'disqualified',
  Cancelled: 'badge_inactive',
  Withdrawn: 'badge_inactive',
  'Need clarification': 'overdue',
  'Resignation initiated': 'open',
  'Pending FFS': 'overdue',
  'Closed FFS': 'completed',
  'Letter generated': 'completed',
  Pending: 'pending',
  Acknowledged: 'qualified',
  Expired: 'disqualified',
  // delegation / eligibility / config
  Scheduled: 'open',
  Ended: 'badge_inactive',
  Eligible: 'qualified',
  'Not eligible': 'badge_inactive',
  'Pending evaluation': 'pending',
  Published: 'qualified',
  Draft: 'pending',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'pending'}>{status}</Badge>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  allLabel?: string
  className?: string
}

/** Compact "All + options" filter dropdown used across list screens. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
  className,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        variant='secondary'
        className={cn('h-8 w-fit min-w-[130px] text-sm', className)}
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

interface MultiToggleProps {
  options: readonly string[]
  value: string[]
  onChange: (value: string[]) => void
}

/** Badge-based multi-select used for departments / groups / locations. */
export function MultiToggle({ options, value, onChange }: MultiToggleProps) {
  const toggle = (option: string) => {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option]
    )
  }
  return (
    <div className='flex flex-wrap gap-1.5'>
      {options.map((option) => {
        const active = value.includes(option)
        return (
          <button
            key={option}
            type='button'
            onClick={() => toggle(option)}
            className={cn(
              'rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
              active
                ? 'border-blue-1400 bg-blue-150 text-blue-1400'
                : 'text-neutral-1000 border-gray-200 bg-white hover:border-gray-300'
            )}
            aria-pressed={active}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

/** Small label/value pair used across read-only panels. */
export function InfoField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-paragraph-sm text-neutral-1000'>{label}</span>
      <span className='text-neutral-1600 text-sm font-medium'>
        {value || '—'}
      </span>
    </div>
  )
}

/** Section heading used inside sheets/tabs. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='text-neutral-1600 text-paragraph-md border-b border-gray-100 pb-1 font-semibold'>
      {children}
    </h3>
  )
}
