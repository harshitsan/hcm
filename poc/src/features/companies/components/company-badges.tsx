import { Badge } from '@/components/ui/badge'
import {
  STATUS_LABELS,
  type CompanyStatus,
  type OperatingModel,
} from '../data/companies'

/**
 * §5.1 status color indicators — Green=Active, Yellow=Suspended,
 * Gray=Inactive (draft/archived/cancelled get neutral treatments).
 */
const statusVariant: Record<
  CompanyStatus,
  'badge_active' | 'overdue' | 'badge_inactive' | 'open' | 'pending' | 'dropped'
> = {
  draft: 'open',
  active: 'badge_active',
  suspended: 'overdue',
  inactive: 'badge_inactive',
  archived: 'pending',
  cancelled: 'dropped',
}

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return <Badge variant={statusVariant[status]}>{STATUS_LABELS[status]}</Badge>
}

export function OperatingModelBadge({ model }: { model: OperatingModel }) {
  const variant =
    model === 'Standalone'
      ? 'pending'
      : model === 'Group Company'
        ? 'open'
        : 'badge_active'
  return <Badge variant={variant}>{model}</Badge>
}

/** COMP-FR-015 — shows whether a config value is inherited or overridden. */
export function InheritanceBadge({ overridden }: { overridden: boolean }) {
  return (
    <Badge variant={overridden ? 'open' : 'pending'}>
      {overridden ? 'Override' : 'Inherited'}
    </Badge>
  )
}
