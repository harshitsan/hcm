import { useMemo } from 'react'
import {
  type GroupMembership,
  type MembershipRequest,
  type OrgGroup,
} from '../data/groups'
import { isEffectiveOn, todayIso } from '../utils/resolve'
import { SummaryCards } from '@/components/module-page'

interface GroupsSummaryProps {
  groups: OrgGroup[]
  memberships: GroupMembership[]
  requests: MembershipRequest[]
}

/** Count cards shown above the groups table. */
export function GroupsSummary({
  groups,
  memberships,
  requests,
}: GroupsSummaryProps) {
  const summaryItems = useMemo(() => {
    const today = todayIso()
    return [
      { label: 'Total groups', value: groups.length },
      {
        label: 'Active groups',
        value: groups.filter((g) => g.status === 'active').length,
      },
      {
        label: 'Benefit cohorts',
        value: groups.filter((g) => g.category === 'benefit-cohort').length,
      },
      {
        label: 'Current memberships',
        value: memberships.filter((m) => isEffectiveOn(m, today)).length,
      },
      {
        label: 'Pending approvals',
        value: requests.filter((r) => r.status === 'pending').length,
      },
    ]
  }, [groups, memberships, requests])

  return <SummaryCards title='Groups Summary' items={summaryItems} />
}
