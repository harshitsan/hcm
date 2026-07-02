import { Badge } from '@/components/ui/badge'
import { companyById, type EmploymentStatus } from '../data/directory'

const statusBadge: Record<
  EmploymentStatus,
  {
    label: string
    variant: 'badge_active' | 'overdue' | 'open' | 'badge_inactive'
  }
> = {
  active: { label: 'Active', variant: 'badge_active' },
  'on-leave': { label: 'On leave', variant: 'overdue' },
  contractor: { label: 'Contractor', variant: 'open' },
  inactive: { label: 'Deactivated', variant: 'badge_inactive' },
}

export function EmploymentStatusBadge({
  status,
}: {
  status: EmploymentStatus
}) {
  const badge = statusBadge[status]
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

/** Company identifier shown on cross-company results (DIR-09/12). */
export function CompanyBadge({ companyId }: { companyId: string }) {
  const company = companyById(companyId)
  if (!company) return null
  return <Badge variant='secondary'>{company.code}</Badge>
}

/** Marks employees without a system login (DIR-13). */
export function NonUserBadge() {
  return <Badge variant='pending'>Non-user</Badge>
}

export function SensitiveBadge() {
  return <Badge variant='dropped'>Sensitive</Badge>
}
