import { Badge } from '@/components/ui/badge'
import {
  type AuditActionType,
  type StorageTier,
} from '../data/audit-entries'

const actionBadge: Record<
  AuditActionType,
  { label: string; variant: 'badge_active' | 'open' | 'dropped' | 'overdue' }
> = {
  create: { label: 'Create', variant: 'badge_active' },
  update: { label: 'Update', variant: 'open' },
  delete: { label: 'Delete', variant: 'dropped' },
  'status-change': { label: 'Status change', variant: 'overdue' },
}

export function ActionBadge({ action }: { action: AuditActionType }) {
  const badge = actionBadge[action]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

const tierBadge: Record<
  StorageTier,
  { label: string; variant: 'badge_active' | 'badge_inactive' }
> = {
  active: { label: 'Active store', variant: 'badge_active' },
  archived: { label: 'Archived', variant: 'badge_inactive' },
}

export function TierBadge({ tier }: { tier: StorageTier }) {
  const badge = tierBadge[tier]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

// eslint-disable-next-line react-refresh/only-export-components
export const auditDateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// eslint-disable-next-line react-refresh/only-export-components
export const auditDateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Renders a previous/new value pair; null means "no value / empty". */
export function ValueTransition({
  previousValue,
  newValue,
}: {
  previousValue: string | null
  newValue: string | null
}) {
  return (
    <span className='inline-flex flex-wrap items-center gap-1.5'>
      <span className='text-red-1400 bg-red-1300 rounded px-1.5 py-0.5 text-xs'>
        {previousValue ?? '(no prior value)'}
      </span>
      <span className='text-neutral-1000 text-xs'>→</span>
      <span className='text-green-1300 bg-green-1200 rounded px-1.5 py-0.5 text-xs'>
        {newValue ?? '(empty / deleted)'}
      </span>
    </span>
  )
}
