import { Bell, Info } from 'lucide-react'
import { useRole } from '@/context/role-context'
import {
  SELF_MEMBER_NON_USER_ID,
  SELF_MEMBER_USER_ID,
} from '../data/groups'
import { type OrgGroupsStore } from '../hooks/use-org-groups'
import { hierarchyPath } from '../utils/hierarchy'
import { isEffectiveOn, todayIso } from '../utils/resolve'
import {
  CategoryBadge,
  ScopeBadge,
  SourceBadge,
} from './group-badges'

interface MyGroupsTabProps {
  store: OrgGroupsStore
}

/**
 * Self-service memberships view (GRP-11/43, plus the GRP-10 non-user case):
 * the signed-in employee sees every group they currently belong to, strictly
 * read-only, with membership-change notifications.
 */
export function MyGroupsTab({ store }: MyGroupsTabProps) {
  const { role } = useRole()
  const isNonUser = role === 'Employee (Non-User)'
  const selfId = isNonUser ? SELF_MEMBER_NON_USER_ID : SELF_MEMBER_USER_ID
  const self = store.members.find((m) => m.id === selfId)

  const today = todayIso()
  const current = store.memberships.filter(
    (m) => m.memberId === selfId && isEffectiveOn(m, today)
  )
  const groupById = new Map(store.groups.map((g) => [g.id, g]))
  const notifications = store.notifications.filter(
    (n) => n.memberId === selfId
  )

  return (
    <div className='grid w-full gap-4 lg:grid-cols-2'>
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          My group memberships — {self?.name} ({self?.code})
        </h3>
        <div className='border-grey-200 mb-2 flex items-start gap-2 rounded-[6px] border bg-white px-3 py-2'>
          <Info className='text-blue-1400 mt-0.5 size-4 shrink-0' />
          <p className='text-paragraph-sm text-neutral-1000'>
            {isNonUser
              ? 'You are an employee without a login account. Group membership still covers you for policy, eligibility and benefit evaluation — it never grants login capability by itself. This is how HR sees your memberships.'
              : 'This list is read-only and always current: you can see the groups you belong to and the policies they drive, but membership and group definitions can only be changed by an administrator.'}
          </p>
        </div>
        {current.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            You are not a member of any group as of {today}.
          </p>
        ) : (
          <div className='space-y-2'>
            {current.map((m) => {
              const g = groupById.get(m.groupId)
              if (!g) return null
              const policies = store.policiesUsing(g.id)
              return (
                <div
                  key={m.id}
                  className='border-grey-200 rounded-[6px] border bg-white px-3 py-2'
                >
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {g.name} ({g.acronym})
                    </span>
                    <ScopeBadge scope={g.scope} />
                    <CategoryBadge category={g.category} />
                    <SourceBadge source={m.source} />
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    Member since {m.effectiveFrom} ·{' '}
                    {hierarchyPath(store.groups, g.id)}
                    {policies.length > 0 &&
                      ` · applies: ${policies.map((p) => p.name).join(', ')}`}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className='text-neutral-1600 mb-2 flex items-center gap-1.5 text-sm font-medium'>
          <Bell className='size-4' /> Membership change notifications
        </h3>
        {notifications.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            No membership change notifications yet. You’ll be notified here
            when you are added to or removed from a group, including the
            effective date.
          </p>
        ) : (
          <div className='space-y-2'>
            {notifications.map((n) => (
              <div
                key={n.id}
                className='border-grey-200 rounded-[6px] border bg-white px-3 py-2'
              >
                <p className='text-neutral-1900 text-sm'>{n.text}</p>
                <p className='text-neutral-1000 text-xs'>{n.at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
