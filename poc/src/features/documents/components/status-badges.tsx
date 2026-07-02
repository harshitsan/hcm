import { Badge } from '@/components/ui/badge'
import { type ExpiryStatus } from '../data/documents'

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

/** Active/Inactive flag derived from a policy's effective window (DOC-32/35). */
export function PolicyStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'badge_active' : 'badge_inactive'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}
