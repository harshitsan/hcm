import { Badge } from '@/components/ui/badge'

type SecurityBadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'pending'
  | 'completed'
  | 'disqualified'
  | 'overdue'

const VARIANTS: Record<string, SecurityBadgeVariant> = {
  Active: 'badge_active',
  Scheduled: 'open',
  Ended: 'badge_inactive',
  Revoked: 'badge_inactive',
  Expired: 'pending',
  Published: 'completed',
  Draft: 'pending',
  Pending: 'open',
  Approved: 'completed',
  Rejected: 'disqualified',
  Enabled: 'badge_active',
  Disabled: 'badge_inactive',
  Admin: 'overdue',
  Visible: 'completed',
  Hidden: 'disqualified',
  Allowed: 'completed',
  Denied: 'disqualified',
  Impersonation: 'overdue',
  'Context Switch': 'open',
  Delegation: 'pending',
  'Role Change': 'completed',
  'Sign-in': 'badge_inactive',
  Config: 'open',
  Job: 'pending',
}

/** Status/category badge with consistent variants across the module. */
export function SecurityBadge({ value }: { value: string }) {
  return <Badge variant={VARIANTS[value] ?? 'pending'}>{value}</Badge>
}
