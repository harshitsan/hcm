import { Badge } from '@/components/ui/badge'
import { type Tier } from '../data/catalog'
import { type JobStatus, type RecordOutcome } from '../data/jobs'

type BadgeVariant =
  | 'pending'
  | 'open'
  | 'overlay_open'
  | 'completed'
  | 'dropped'
  | 'overdue'
  | 'qualified'
  | 'badge_inactive'

const statusVariant: Record<JobStatus, BadgeVariant> = {
  Submitted: 'pending',
  Validating: 'open',
  'In-progress': 'overlay_open',
  Completed: 'completed',
  Failed: 'dropped',
  'Partially completed': 'overdue',
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
      {rolledBack && <Badge variant='badge_inactive'>Rolled back</Badge>}
    </span>
  )
}

const tierVariant: Record<Tier, BadgeVariant> = {
  Foundation: 'pending',
  Organizational: 'open',
  Workforce: 'qualified',
  Transactional: 'overdue',
}

export function TierBadge({ tier }: { tier: Tier }) {
  return <Badge variant={tierVariant[tier]}>{tier}</Badge>
}

const outcomeVariant: Record<RecordOutcome, BadgeVariant> = {
  success: 'completed',
  failed: 'dropped',
  skipped: 'pending',
}

export function OutcomeBadge({ outcome }: { outcome: RecordOutcome }) {
  return (
    <Badge variant={outcomeVariant[outcome]} className='capitalize'>
      {outcome}
    </Badge>
  )
}
