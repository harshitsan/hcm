import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type GroupMembership,
  type MembershipRequest,
  type OrgGroup,
} from '../data/groups'
import { isEffectiveOn, todayIso } from '../utils/resolve'

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

  return (
    <Card className='bg-blue-150 mb-4 w-full gap-2 border-none py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm text-neutral-1600 font-medium'>
          Groups Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className='flex items-center rounded-[6px] border border-gray-200 bg-white px-3 py-1.5'
            >
              <div className='flex w-full items-center gap-3'>
                <div className='flex flex-col gap-4'>
                  <span className='text-paragraph-sm font-medium text-black'>
                    {item.label}
                  </span>
                  <span className='text-3xl font-medium text-black'>
                    {item.value.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
