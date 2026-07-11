import { Badge } from '@/components/ui/badge'
import {
  typeAbbrev,
  type Jurisdiction,
  type JurisdictionStatus,
  type JurisdictionType,
} from '../data/jurisdictions'

const typeVariant: Record<
  JurisdictionType,
  'open' | 'pending' | 'badge_active' | 'overdue'
> = {
  Country: 'open',
  State: 'badge_active',
  City: 'pending',
  'Other Operational Region': 'overdue',
}

/** Each catalog entry's type is identifiable at a glance (JUR-02). */
export function TypeBadge({ type }: { type: JurisdictionType }) {
  return <Badge variant={typeVariant[type]}>{typeAbbrev[type]}</Badge>
}

const statusBadge: Record<
  JurisdictionStatus,
  { label: string; variant: 'badge_active' | 'badge_inactive' }
> = {
  active: { label: 'Active', variant: 'badge_active' },
  inactive: { label: 'Inactive', variant: 'badge_inactive' },
}

export function StatusBadge({ status }: { status: JurisdictionStatus }) {
  const b = statusBadge[status]
  return <Badge variant={b.variant}>{b.label}</Badge>
}

/** "Configured (n)" vs "Not configured" — optional applicability (JUR-04). */
export function TaxConfigBadge({ jurisdiction }: { jurisdiction: Jurisdiction }) {
  return jurisdiction.taxFees.length > 0 ? (
    <Badge variant='completed'>
      Configured ({jurisdiction.taxFees.length})
    </Badge>
  ) : (
    <Badge variant='pending'>Not configured</Badge>
  )
}

export function RulePackStatusBadge({
  status,
}: {
  status: 'published' | 'superseded' | 'draft'
}) {
  if (status === 'published') return <Badge variant='live'>Published</Badge>
  if (status === 'draft') return <Badge variant='open'>Draft</Badge>
  return <Badge variant='badge_inactive'>Superseded</Badge>
}
