import { Badge } from '@/components/ui/badge'
import { type CaptureSource, type OvertimeCategory } from '../data/attendance'

type BadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'dropped'
  | 'live'

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'pending' },
  'pending-approval': { label: 'Pending Approval', variant: 'pending' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  escalated: { label: 'Escalated', variant: 'overdue' },
  blocked: { label: 'Blocked (policy)', variant: 'dropped' },
  flagged: { label: 'Flagged', variant: 'overdue' },
  unmatched: { label: 'Unmatched', variant: 'dropped' },
  cancelled: { label: 'Cancelled', variant: 'badge_inactive' },
  // config lifecycle (TNA-24)
  active: { label: 'Active', variant: 'badge_active' },
  draft: { label: 'Draft', variant: 'pending' },
  superseded: { label: 'Superseded', variant: 'badge_inactive' },
  // devices / integrations
  online: { label: 'Online', variant: 'live' },
  offline: { label: 'Offline', variant: 'dropped' },
  valid: { label: 'Credentials OK', variant: 'badge_active' },
  invalid: { label: 'Invalid Credentials', variant: 'dropped' },
  untested: { label: 'Untested', variant: 'pending' },
}

/** Consistent status pill across all attendance tables and sheets. */
export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, variant: 'pending' as const }
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}

const SOURCE_MAP: Record<CaptureSource, { label: string; variant: BadgeVariant }> = {
  manual: { label: 'Manual', variant: 'open' },
  biometric: { label: 'Biometric', variant: 'live' },
  api: { label: 'API', variant: 'completed' },
  import: { label: 'Import', variant: 'pending' },
}

/** Capture-source tag for traceability (TNA-01…04). */
export function SourceBadge({ source }: { source: CaptureSource }) {
  const entry = SOURCE_MAP[source]
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}

const OT_MAP: Record<OvertimeCategory, { label: string; variant: BadgeVariant }> = {
  normal: { label: 'OT Normal', variant: 'open' },
  holiday: { label: 'OT Holiday', variant: 'overdue' },
  'night-shift': { label: 'OT Night', variant: 'completed' },
}

/** Overtime category classification from the rules engine (TNA-09/26). */
export function OtBadge({ category }: { category: OvertimeCategory | null }) {
  if (!category) return <span className='text-neutral-1000'>—</span>
  const entry = OT_MAP[category]
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}

/** Marker for records that duplicate another capture source (TNA-23). */
export function DuplicateBadge() {
  return <Badge variant='overdue'>Duplicate</Badge>
}

/** Marker for statutory compliance breaches (TNA-12/26). */
export function ViolationBadge({ flag }: { flag: string | null }) {
  if (!flag) return <span className='text-neutral-1000'>—</span>
  return <Badge variant='dropped'>{flag}</Badge>
}
