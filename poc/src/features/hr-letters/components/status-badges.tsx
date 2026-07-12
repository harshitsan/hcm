import { Badge } from '@/components/ui/badge'
import {
  CHANNEL_LABELS,
  type Channel,
  type DeliveryOutcome,
  type DocStatus,
} from '../data/hr-letters'

const docStatusMap: Record<
  DocStatus,
  {
    label: string
    variant: 'overdue' | 'badge_active' | 'dropped' | 'open' | 'pending'
  }
> = {
  draft: { label: 'Draft', variant: 'pending' },
  'pending-approval': { label: 'Pending approval', variant: 'overdue' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  issued: { label: 'Issued', variant: 'open' },
}

/** Workflow status of a generated document (HLC-06/14). */
export function DocStatusBadge({ status }: { status: DocStatus }) {
  const badge = docStatusMap[status]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

const deliveryMap: Record<
  DeliveryOutcome,
  { label: string; variant: 'open' | 'badge_active' | 'dropped' }
> = {
  sent: { label: 'Sent', variant: 'open' },
  delivered: { label: 'Delivered', variant: 'badge_active' },
  failed: { label: 'Failed', variant: 'dropped' },
}

/** Per-channel delivery-tracking outcome (HLC-09/21). */
export function DeliveryBadge({ outcome }: { outcome: DeliveryOutcome }) {
  const badge = deliveryMap[outcome]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

const channelVariantMap: Record<Channel, 'pending' | 'overdue'> = {
  email: 'pending',
  'in-app': 'pending',
  print: 'pending',
  // Distinct badge — physical handover is tracked differently from digital dispatch.
  handover: 'overdue',
}

/** Distribution channel badge; handover renders with a distinct style. */
export function ChannelBadge({ channel }: { channel: Channel }) {
  return <Badge variant={channelVariantMap[channel]}>{CHANNEL_LABELS[channel]}</Badge>
}

/** Acknowledgment state on agreement letters (HLC-28/29). */
export function AckBadge({ acknowledgedOn }: { acknowledgedOn: string | null }) {
  return acknowledgedOn ? (
    <Badge variant='badge_active'>Acknowledged</Badge>
  ) : (
    <Badge variant='pending'>Ack. pending</Badge>
  )
}
