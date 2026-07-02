import { Badge } from '@/components/ui/badge'
import {
  activeMemberships,
  type GroupCompany,
  type GroupType,
  type MemberCompany,
} from '../data/group-companies'
import { type ReferenceStatus } from '../data/sharing'

const typeVariant: Record<GroupType, 'open' | 'qualified' | 'overdue'> = {
  Holding: 'open',
  Sister: 'qualified',
  JointVenture: 'overdue',
}

export function GroupTypeBadge({ type }: { type: GroupType }) {
  return <Badge variant={typeVariant[type]}>{type}</Badge>
}

/**
 * Health of a construct: Flagged when a member is no longer Active or the
 * group has dropped below the 2-member minimum (GRP-20).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function groupHealth(
  group: GroupCompany,
  companies: MemberCompany[]
): { label: string; flagged: boolean; reason: string } {
  const active = activeMemberships(group)
  const inactiveMember = active.find(
    (m) => companies.find((c) => c.id === m.companyId)?.status !== 'Active'
  )
  if (inactiveMember) {
    const c = companies.find((x) => x.id === inactiveMember.companyId)
    return {
      label: 'Flagged',
      flagged: true,
      reason: `${c?.name ?? 'A member'} is ${c?.status ?? 'inactive'} — blocked from new shared scenarios`,
    }
  }
  if (active.length < 2) {
    return {
      label: 'Flagged',
      flagged: true,
      reason: 'Below the 2-member minimum for a valid group',
    }
  }
  return { label: 'Active', flagged: false, reason: '' }
}

export function GroupStatusBadge({
  group,
  companies,
}: {
  group: GroupCompany
  companies: MemberCompany[]
}) {
  const health = groupHealth(group, companies)
  return (
    <Badge
      variant={health.flagged ? 'badge_inactive' : 'badge_active'}
      title={health.reason}
    >
      {health.label}
    </Badge>
  )
}

/** Compact on/off pills for the three shared scenarios (GRP-04 default off). */
export function ScenarioBadges({ group }: { group: GroupCompany }) {
  const items: { key: string; label: string; on: boolean }[] = [
    { key: 'adm', label: 'Admin', on: group.sharedAdministration },
    { key: 'loc', label: 'Locations', on: group.sharedLocations },
    { key: 'acc', label: 'Access', on: group.crossCompanyAccess },
  ]
  return (
    <div className='flex flex-wrap gap-1'>
      {items.map((i) => (
        <Badge key={i.key} variant={i.on ? 'completed' : 'pending'}>
          {i.label} {i.on ? 'on' : 'off'}
        </Badge>
      ))}
    </div>
  )
}

const refVariant: Record<ReferenceStatus, 'open' | 'qualified' | 'disqualified' | 'pending'> = {
  Pending: 'open',
  Approved: 'qualified',
  Denied: 'disqualified',
  Removed: 'pending',
}

export function ReferenceStatusBadge({ status }: { status: ReferenceStatus }) {
  return <Badge variant={refVariant[status]}>{status}</Badge>
}

export function CompanyStatusBadge({ status }: { status: MemberCompany['status'] }) {
  return (
    <Badge variant={status === 'Active' ? 'badge_active' : 'badge_inactive'}>
      {status}
    </Badge>
  )
}
