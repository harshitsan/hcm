import { Badge } from '@/components/ui/badge'
import {
  type AnnouncementStatus,
  type AnnouncementType,
} from '../data/announcements'

type BadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'open'
  | 'pending'
  | 'overdue'
  | 'completed'
  | 'dropped'

const statusVariants: Record<AnnouncementStatus, BadgeVariant> = {
  'Draft': 'pending',
  'Pending approval': 'overdue',
  'Approved': 'open',
  'Scheduled': 'open',
  'Published': 'badge_active',
  'Unpublished': 'badge_inactive',
  'Recently Completed': 'completed',
  'Completed': 'completed',
  'Rejected': 'dropped',
  'Withdrawn': 'badge_inactive',
  'On Hold': 'pending',
}

/** Lifecycle badge — every row surfaces its journey state (ANN-29). */
export function StatusBadge({ status }: { status: AnnouncementStatus }) {
  return <Badge variant={statusVariants[status]}>{status}</Badge>
}

/** Adhoc vs Recurring classification badge (ANN-30). */
export function TypeBadge({ type }: { type: AnnouncementType }) {
  return (
    <Badge variant={type === 'Recurring' ? 'open' : 'pending'}>{type}</Badge>
  )
}
