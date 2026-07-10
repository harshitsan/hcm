import { Badge } from '@/components/ui/badge'

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
  // generic workflow states
  'in-progress': { label: 'In Progress', variant: 'open' },
  completed: { label: 'Completed', variant: 'completed' },
  pending: { label: 'Pending', variant: 'pending' },
  'pending-approval': { label: 'Pending Approval', variant: 'pending' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  // probation
  'in-review': { label: 'In Review', variant: 'open' },
  confirmed: { label: 'Confirmed', variant: 'completed' },
  extended: { label: 'Extended Probation', variant: 'overdue' },
  'separation-initiated': { label: 'Separation Initiated', variant: 'dropped' },
  // transfers
  scheduled: { label: 'Scheduled', variant: 'open' },
  effective: { label: 'Effective', variant: 'completed' },
  // exits
  'clearance-in-progress': { label: 'Clearance In Progress', variant: 'open' },
  finalized: { label: 'Finalized', variant: 'completed' },
  cleared: { label: 'Cleared', variant: 'completed' },
  // documents
  missing: { label: 'Missing', variant: 'badge_inactive' },
  submitted: { label: 'Submitted', variant: 'open' },
  'correction-requested': { label: 'Correction Requested', variant: 'overdue' },
  verified: { label: 'Verified', variant: 'completed' },
  // disciplinary
  'letter-issued': { label: 'Letter Issued', variant: 'completed' },
  'counselling-in-progress': { label: 'Counselling In Progress', variant: 'open' },
  'counselling-completed': { label: 'Counselling Completed', variant: 'completed' },
  closed: { label: 'Closed', variant: 'badge_inactive' },
  // orientation programs
  cancelled: { label: 'Cancelled', variant: 'dropped' },
  // reviews
  'Pending Approval': { label: 'Pending Approval', variant: 'pending' },
  Submitted: { label: 'Submitted', variant: 'completed' },
  Active: { label: 'Active', variant: 'open' },
  // performance review
  Initiated: { label: 'Initiated', variant: 'open' },
  'Pending Initiation': { label: 'Pending Initiation', variant: 'pending' },
  Completed: { label: 'Completed', variant: 'completed' },
  'Pending Submission': { label: 'Pending Submission', variant: 'pending' },
  Closed: { label: 'Closed', variant: 'completed' },
  // knowledge transfer
  Assigned: { label: 'Assigned', variant: 'open' },
  Reassigned: { label: 'Reassigned', variant: 'pending' },
  Received: { label: 'Received', variant: 'completed' },
  'Pre Closed': { label: 'Pre Closed', variant: 'badge_inactive' },
  Withdrawn: { label: 'Withdrawn', variant: 'dropped' },
  // config
  published: { label: 'Published', variant: 'badge_active' },
  superseded: { label: 'Superseded', variant: 'badge_inactive' },
}

/** Consistent status pill across all lifecycle tables and sheets. */
export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, variant: 'pending' as const }
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}
