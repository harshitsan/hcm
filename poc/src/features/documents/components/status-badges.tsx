import { Badge } from '@/components/ui/badge'
import { type ExpiryStatus } from '../data/documents'
import { type ReceiptStatus } from '../data/receipts'

const expiryBadgeMap: Record<
  ExpiryStatus,
  { label: string; variant: 'dropped' | 'overdue' | 'badge_active' | 'pending' }
> = {
  expired: { label: 'Expired', variant: 'dropped' },
  expiring: { label: 'Expiring soon', variant: 'overdue' },
  active: { label: 'Valid', variant: 'badge_active' },
  none: { label: 'No expiry', variant: 'pending' },
}

/** Computed expiry flag shown alongside document metadata (DOC-07). */
export function ExpiryBadge({ status }: { status: ExpiryStatus }) {
  const badge = expiryBadgeMap[status]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

const receiptBadgeMap: Record<
  ReceiptStatus,
  { label: string; variant: 'open' | 'overdue' | 'pending' | 'badge_active' }
> = {
  'with-custodian': { label: 'With custodian', variant: 'open' },
  'returned-temporary': { label: 'Returned (temporary)', variant: 'overdue' },
  'returned-permanent': { label: 'Returned (permanent)', variant: 'pending' },
  acknowledged: { label: 'Acknowledged', variant: 'badge_active' },
}

/** Custody state of a document receipt (Custodian — Receipts & Returns). */
export function ReceiptStatusBadge({ status }: { status: ReceiptStatus }) {
  const badge = receiptBadgeMap[status]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

/** Physical original vs digital-copy flag on a custodian receipt. */
export function PhysicalCopyBadge({ hasPhysicalCopy }: { hasPhysicalCopy: boolean }) {
  return (
    <Badge variant={hasPhysicalCopy ? 'open' : 'pending'}>
      {hasPhysicalCopy ? 'Physical copy' : 'Digital only'}
    </Badge>
  )
}

/** Active/Inactive flag derived from a policy's effective window (DOC-32/35). */
export function PolicyStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'badge_active' : 'badge_inactive'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}
