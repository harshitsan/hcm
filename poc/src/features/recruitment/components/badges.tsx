import { Badge } from '@/components/ui/badge'
import type { HiringAs } from '../data/requisitions'

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
  // requisition lifecycle (TA-03)
  draft: { label: 'Draft', variant: 'pending' },
  'pending-approval': { label: 'Pending Approval', variant: 'overdue' },
  approved: { label: 'Approved', variant: 'badge_active' },
  sourcing: { label: 'Sourcing', variant: 'open' },
  'on-hold': { label: 'On Hold', variant: 'overdue' },
  filled: { label: 'Filled', variant: 'completed' },
  closed: { label: 'Closed', variant: 'badge_inactive' },
  cancelled: { label: 'Cancelled', variant: 'badge_inactive' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  // vacancy lifecycle (TA-34)
  new: { label: 'New', variant: 'open' },
  assigned: { label: 'Assigned', variant: 'badge_active' },
  'in-process': { label: 'In Process', variant: 'live' },
  withdrawn: { label: 'Withdrawn', variant: 'badge_inactive' },
  // pipeline stages (TA-13)
  applied: { label: 'Applied', variant: 'open' },
  screening: { label: 'Screening', variant: 'pending' },
  shortlisted: { label: 'Shortlisted', variant: 'live' },
  interview: { label: 'Interview', variant: 'open' },
  'reference-check': { label: 'Reference Check', variant: 'overdue' },
  offer: { label: 'Offer', variant: 'completed' },
  hired: { label: 'Hired', variant: 'badge_active' },
  // offer lifecycle (TA-47)
  released: { label: 'Released', variant: 'live' },
  accepted: { label: 'Accepted', variant: 'badge_active' },
  refused: { label: 'Refused', variant: 'dropped' },
  expired: { label: 'Expired', variant: 'overdue' },
  // misc
  pending: { label: 'Pending', variant: 'pending' },
  completed: { label: 'Completed', variant: 'completed' },
  live: { label: 'Live', variant: 'live' },
  active: { label: 'Active', variant: 'badge_active' },
  inactive: { label: 'Inactive', variant: 'badge_inactive' },
  superseded: { label: 'Superseded', variant: 'badge_inactive' },
  reviewed: { label: 'Reviewed', variant: 'badge_active' },
  'not-reviewed': { label: 'Not Reviewed', variant: 'pending' },
}

/** Consistent status pill across all recruitment tables and sheets. */
export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? {
    label: status,
    variant: 'pending' as const,
  }
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}

/** Marker for requisitions outside the approved budget (TA-52). */
export function NonBudgetedBadge() {
  return <Badge variant='dropped'>Non-budgeted</Badge>
}

/** Marker for offers above the approved salary band (TA-46). */
export function OutOfBandBadge() {
  return <Badge variant='overdue'>Out-of-band</Badge>
}

/** Approved-for-sourcing requisitions without an owner are flagged (TA-04). */
export function UnassignedBadge() {
  return <Badge variant='overdue'>Unassigned</Badge>
}

/** RL-04: reason-for-vacancy pill — New Join vs Replacement. */
export function HiringAsBadge({ hiringAs }: { hiringAs: HiringAs }) {
  return (
    <Badge variant={hiringAs === 'New Join' ? 'open' : 'pending'}>
      {hiringAs}
    </Badge>
  )
}
