import { Badge } from '@/components/ui/badge'
import {
  CHANNEL_LABELS,
  EVENT_TYPE_LABELS,
  type AttemptStatus,
  type Channel,
  type DeliveryFinalStatus,
  type EventTypeId,
} from '../data/notifications'

type BadgeVariant =
  | 'open'
  | 'badge_active'
  | 'badge_inactive'
  | 'overdue'
  | 'dropped'
  | 'pending'
  | 'completed'

const categoryVariant: Record<EventTypeId, BadgeVariant> = {
  approval: 'open',
  escalation: 'dropped',
  workflow: 'completed',
  reminder: 'overdue',
  lifecycle: 'badge_active',
  announcement: 'open',
  task: 'pending',
  digest: 'badge_inactive',
}

export function CategoryBadge({ category }: { category: EventTypeId }) {
  return (
    <Badge variant={categoryVariant[category]}>
      {EVENT_TYPE_LABELS[category]}
    </Badge>
  )
}

const finalStatusVariant: Record<DeliveryFinalStatus, BadgeVariant> = {
  delivered: 'badge_active',
  'partially delivered': 'overdue',
  failed: 'dropped',
  'dead-letter': 'dropped',
  'in progress': 'open',
}

export function DeliveryStatusBadge({
  status,
}: {
  status: DeliveryFinalStatus
}) {
  return (
    <Badge variant={finalStatusVariant[status]} className='capitalize'>
      {status}
    </Badge>
  )
}

const attemptVariant: Record<AttemptStatus, BadgeVariant> = {
  delivered: 'badge_active',
  failed: 'dropped',
  retrying: 'overdue',
  pending: 'pending',
}

export function AttemptBadge({
  channel,
  status,
}: {
  channel: Channel
  status: AttemptStatus
}) {
  return (
    <Badge variant={attemptVariant[status]}>
      {CHANNEL_LABELS[channel]}: {status}
    </Badge>
  )
}
