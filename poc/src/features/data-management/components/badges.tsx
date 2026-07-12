import { Badge } from '@/components/ui/badge'
import { type Tier } from '../data/catalog'
import { type JobStatus, type RecordOutcome } from '../data/jobs'

type BadgeVariant =
  | 'pending'
  | 'open'
  | 'open'
  | 'completed'
  | 'dropped'
  | 'overdue'
  | 'badge_active'
  | 'badge_inactive'

const statusVariant: Record<JobStatus, BadgeVariant> = {
  Submitted: 'pending',
  Validating: 'open',
  'In-progress': 'open',
  Completed: 'completed',
  Failed: 'dropped',
  'Partially completed': 'overdue',
  'Rolled back': 'badge_inactive',
}

export function JobStatusBadge({
  status,
  rolledBack,
}: {
  status: JobStatus
  rolledBack?: boolean
}) {
  return (
    <span className='inline-flex items-center gap-1'>
      <Badge variant={statusVariant[status]}>{status}</Badge>
      {rolledBack && status !== 'Rolled back' && (
        <Badge variant='badge_inactive'>Rolled back</Badge>
      )}
    </span>
  )
}

const tierVariant: Record<Tier, BadgeVariant> = {
  Foundation: 'pending',
  Organizational: 'open',
  Workforce: 'badge_active',
  Transactional: 'overdue',
}

export function TierBadge({ tier }: { tier: Tier }) {
  return <Badge variant={tierVariant[tier]}>{tier}</Badge>
}

const outcomeVariant: Record<RecordOutcome, BadgeVariant> = {
  success: 'completed',
  warning: 'overdue',
  failed: 'dropped',
  skipped: 'pending',
}

/** Record-level result labels shown to users (FR 6.24.4). */
const outcomeLabel: Record<RecordOutcome, string> = {
  success: 'OK',
  warning: 'Warning',
  failed: 'Error',
  skipped: 'Skipped',
}

export function OutcomeBadge({ outcome }: { outcome: RecordOutcome }) {
  return <Badge variant={outcomeVariant[outcome]}>{outcomeLabel[outcome]}</Badge>
}

/** Animated bar shown while a job is In-progress (FR 6.24.6). */
export function JobProgressBar({ progress }: { progress?: number }) {
  const pct = Math.max(0, Math.min(100, progress ?? 0))
  return (
    <span className='mt-1 flex w-[120px] items-center gap-1.5'>
      <span className='h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-300'>
        <span
          className='bg-blue-1400 block h-full rounded-full transition-all duration-300'
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className='text-paragraph-sm text-neutral-1000 tabular-nums'>
        {pct}%
      </span>
    </span>
  )
}
