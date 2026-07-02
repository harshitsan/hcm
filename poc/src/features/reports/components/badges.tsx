import { Badge } from '@/components/ui/badge'

type BadgeVariant =
  | 'badge_active'
  | 'badge_inactive'
  | 'open'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'dropped'

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  // schedules
  active: { label: 'Active', variant: 'badge_active' },
  paused: { label: 'Paused', variant: 'pending' },
  cancelled: { label: 'Cancelled', variant: 'badge_inactive' },
  // engine delivery log
  delivered: { label: 'Delivered', variant: 'completed' },
  failed: { label: 'Failed', variant: 'dropped' },
  'retried-delivered': { label: 'Retried · Delivered', variant: 'open' },
  // templates / config
  superseded: { label: 'Superseded', variant: 'badge_inactive' },
  draft: { label: 'Draft', variant: 'pending' },
  revoked: { label: 'Revoked', variant: 'dropped' },
  // eligibility
  'PF mandatory': { label: 'PF mandatory', variant: 'badge_active' },
  'PF voluntary': { label: 'PF voluntary', variant: 'open' },
  'ESIC covered': { label: 'ESIC covered', variant: 'badge_active' },
  'Not covered': { label: 'Not covered', variant: 'badge_inactive' },
  // current status screen
  Available: { label: 'Available', variant: 'badge_active' },
  'On Leave': { label: 'On Leave', variant: 'overdue' },
  'On Site': { label: 'On Site', variant: 'open' },
  'Work From Home': { label: 'Work From Home', variant: 'open' },
  'In Meeting': { label: 'In Meeting', variant: 'pending' },
}

/** Consistent status pill across the reporting tables. */
export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? {
    label: status,
    variant: 'pending' as const,
  }
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}

/** Marks records of employees without a login (RPT-16, RPT-43). */
export function NonUserBadge() {
  return <Badge variant='badge_inactive'>Non-user</Badge>
}

/** Marks tenant custom/UDF fields in the builder field catalog (RPT-23). */
export function CustomFieldBadge() {
  return <Badge variant='open'>Custom</Badge>
}
