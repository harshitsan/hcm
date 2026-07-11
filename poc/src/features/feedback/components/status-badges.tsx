import { type ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import { type EntryStatus, type EntryType } from '../data/entries'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

const statusVariant: Record<EntryStatus, BadgeVariant> = {
  Submitted: 'open',
  'Feedback received': 'badge_active',
  'Under Review': 'pending',
  'On Hold': 'overdue',
  Escalated: 'dropped',
  Resolved: 'completed',
  Closed: 'badge_inactive',
}

/** Computed status pill for an entry (FBG-04 status tracking). */
export function EntryStatusBadge({ status }: { status: EntryStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>
}

const typeVariant: Record<EntryType, BadgeVariant> = {
  Feedback: 'open',
  Grievance: 'dropped',
}

export function EntryTypeBadge({ type }: { type: EntryType }) {
  return <Badge variant={typeVariant[type]}>{type}</Badge>
}
