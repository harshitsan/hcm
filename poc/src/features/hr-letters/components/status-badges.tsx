import { Badge } from '@/components/ui/badge'
import { type DeliveryOutcome, type DocStatus } from '../data/hr-letters'

const docStatusMap: Record<
  DocStatus,
  { label: string; variant: 'overdue' | 'badge_active' | 'dropped' | 'open' }
> = {
  'pending-approval': { label: 'Pending approval', variant: 'overdue' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  distributed: { label: 'Distributed', variant: 'open' },
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

/** Acknowledgment state on agreement letters (HLC-28/29). */
export function AckBadge({ acknowledgedOn }: { acknowledgedOn: string | null }) {
  return acknowledgedOn ? (
    <Badge variant='badge_active'>Acknowledged</Badge>
  ) : (
    <Badge variant='pending'>Ack. pending</Badge>
  )
}
