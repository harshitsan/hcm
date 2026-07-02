import { Badge } from '@/components/ui/badge'
import { type PolicyType } from '../data/policies'
import { type PolicyStatus, type ResolutionOutcome } from '../data/policy-utils'

const statusBadge: Record<
  PolicyStatus,
  {
    label: string
    variant: 'badge_active' | 'open' | 'pending' | 'badge_inactive' | 'dropped'
  }
> = {
  active: { label: 'Active', variant: 'badge_active' },
  scheduled: { label: 'Scheduled', variant: 'open' },
  draft: { label: 'Draft', variant: 'pending' },
  expired: { label: 'Expired', variant: 'badge_inactive' },
  retired: { label: 'Retired', variant: 'dropped' },
}

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const badge = statusBadge[status]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

export function PolicyTypeBadge({ type }: { type: PolicyType }) {
  return (
    <Badge variant={type === 'HR' ? 'open' : 'overdue'}>
      {type === 'HR' ? 'HR Policy' : 'Business Policy'}
    </Badge>
  )
}

const outcomeBadge: Record<
  ResolutionOutcome,
  {
    label: string
    variant: 'badge_active' | 'pending' | 'dropped' | 'badge_inactive'
  }
> = {
  applies: { label: 'Applies', variant: 'badge_active' },
  overridden: { label: 'Overridden', variant: 'pending' },
  excluded: { label: 'Excluded', variant: 'dropped' },
  'not-applicable': { label: 'Not applicable', variant: 'badge_inactive' },
}

export function OutcomeBadge({ outcome }: { outcome: ResolutionOutcome }) {
  const badge = outcomeBadge[outcome]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}
