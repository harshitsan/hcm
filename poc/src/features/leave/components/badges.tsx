import { Badge } from '@/components/ui/badge'

type BadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'dropped'
  | 'live'

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'pending' },
  approved: { label: 'Approved', variant: 'badge_active' },
  rejected: { label: 'Rejected', variant: 'dropped' },
  withdrawn: { label: 'Withdrawn', variant: 'badge_inactive' },
  'cancellation-requested': { label: 'Cancellation Requested', variant: 'overdue' },
  cancelled: { label: 'Cancelled', variant: 'badge_inactive' },
  skipped: { label: 'Skipped', variant: 'badge_inactive' },
  // comp-off credits
  available: { label: 'Available', variant: 'badge_active' },
  used: { label: 'Used', variant: 'open' },
  lapsed: { label: 'Lapsed', variant: 'badge_inactive' },
  // config statuses
  active: { label: 'Active', variant: 'badge_active' },
  draft: { label: 'Draft', variant: 'pending' },
  superseded: { label: 'Superseded', variant: 'badge_inactive' },
  published: { label: 'Published', variant: 'badge_active' },
  paid: { label: 'Paid', variant: 'completed' },
  unpaid: { label: 'Unpaid', variant: 'overdue' },
}

/** Consistent status pill across all leave tables and sheets. */
export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? {
    label: status,
    variant: 'pending' as const,
  }
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}

/** Provisional-request marker (LVE-30). */
export function TentativeBadge() {
  return <Badge variant='overdue'>Tentative</Badge>
}

/** Loss-of-pay portion marker (LVE-32). */
export function LopBadge({ amount, unit }: { amount: number; unit: string }) {
  return (
    <Badge variant='dropped'>
      LOP {amount} {unit}
    </Badge>
  )
}

export function FmlaBadge() {
  return <Badge variant='open'>FMLA</Badge>
}
