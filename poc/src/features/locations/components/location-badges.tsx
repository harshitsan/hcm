import { Badge } from '@/components/ui/badge'
import type { LocationStatus } from '../data/locations'
import type { ShareStatus } from '../hooks/use-locations'

export type Ownership = 'owned' | 'referenced' | 'shared-out'

/** Owned vs referenced indicator on grid rows (LOC-08 / LOC-14). */
export function OwnershipBadge({ ownership }: { ownership: Ownership }) {
  if (ownership === 'owned') {
    return <Badge variant='badge_active'>Owned</Badge>
  }
  if (ownership === 'shared-out') {
    return <Badge variant='completed'>Owned · Shared out</Badge>
  }
  return <Badge variant='open'>Referenced</Badge>
}

export function LocationStatusBadge({ status }: { status: LocationStatus }) {
  return status === 'active' ? (
    <Badge variant='badge_active'>Active</Badge>
  ) : (
    <Badge variant='badge_inactive'>Inactive</Badge>
  )
}

/** Effective status of a sharing configuration version (LOC-13). */
export function ShareStatusBadge({ status }: { status: ShareStatus }) {
  if (status === 'active') return <Badge variant='badge_active'>Active</Badge>
  if (status === 'scheduled') return <Badge variant='open'>Scheduled</Badge>
  return <Badge variant='dropped'>Revoked</Badge>
}

/** Compliance document validity computed from its effective-till date (LOC-24). */
export function DocumentStatusBadge({
  effectiveTill,
  today,
}: {
  effectiveTill: string
  today: string
}) {
  return effectiveTill < today ? (
    <Badge variant='overdue'>Expired</Badge>
  ) : (
    <Badge variant='badge_active'>Valid</Badge>
  )
}
