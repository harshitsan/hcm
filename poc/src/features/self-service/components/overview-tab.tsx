import { useMemo } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { seedLeaveBalances } from '../data/profile'
import { type PortalStore } from '../hooks/use-portal'
import { type ProfileStore } from '../hooks/use-profile'
import { ProfileCard } from './profile-card'
import { StatusBadge } from './status-badge'
import { formatDate } from './utils'

export interface PendingTask {
  id: string
  module: string
  item: string
  action: string
}

interface OverviewTabProps {
  profile: ProfileStore
  portal: PortalStore
  pendingTasks: PendingTask[]
}

function PanelCard({
  title,
  aside,
  children,
}: {
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className='gap-3 border-gray-200 bg-white px-4 py-3'>
      <CardHeader className='flex items-center justify-between p-0'>
        <CardTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-medium'>
          {title}
        </CardTitle>
        {aside}
      </CardHeader>
      <CardContent className='p-0'>{children}</CardContent>
    </Card>
  )
}

/**
 * Self-service home: responsive portal note (ESS-01), authorized profile
 * (ESS-02/03/04), pending approval-routed changes (ESS-15), leave (ESS-05),
 * targeted announcements (ESS-06/17), documents & feedback (ESS-07) and the
 * cross-module pending-task rollup (ESS-39).
 */
export function OverviewTab({ profile, portal, pendingTasks }: OverviewTabProps) {
  const { role, hasRole } = useRole()
  const isEmployee = role === 'Employee (User)'
  const canApprove = hasRole('Company Admin', 'Group Company Admin')

  const profilePolicy = portal.policyFor('profile')
  const leavePolicy = portal.policyFor('leave')
  const announcementsPolicy = portal.policyFor('announcements')
  const documentsPolicy = portal.policyFor('documents')

  const authorizedDocs = useMemo(
    () => portal.documents.filter((d) => d.authorized),
    [portal.documents]
  )
  const restrictedDocs = portal.documents.length - authorizedDocs.length

  return (
    <div className='w-full space-y-4'>
      <div className='border-blue-150 bg-blue-150/50 text-paragraph-sm text-neutral-1600 rounded-[6px] border px-3 py-2'>
        Phase I delivers all self-service transactions through this responsive
        web portal — usable on desktop, tablet and mobile browsers. A native
        mobile app is deferred to Phase II.
      </div>

      {profilePolicy?.view ? (
        <ProfileCard
          store={profile}
          canManage={isEmployee && Boolean(profilePolicy?.manage)}
        />
      ) : (
        <div className='rounded-[6px] border border-gray-200 bg-white px-4 py-6 text-center'>
          <p className='text-paragraph-sm text-neutral-1000'>
            Profile information is blocked by your organization&apos;s
            self-service policy.
          </p>
        </div>
      )}

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <PanelCard title='Profile change requests'>
          {profile.changeRequests.length === 0 ? (
            <p className='text-paragraph-sm text-neutral-1000'>
              No change requests yet.
            </p>
          ) : (
            <ul className='space-y-2'>
              {profile.changeRequests.map((cr) => (
                <li
                  key={cr.id}
                  className='rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-sm font-medium'>{cr.fieldLabel}</span>
                    <StatusBadge status={cr.status} />
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                    {cr.currentValue} → {cr.requestedValue}
                  </p>
                  <div className='mt-1 flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      Approver graph: {cr.approverGraph.join(' → ')}
                      {cr.pendingWith ? ` · with ${cr.pendingWith}` : ''}
                    </span>
                    {canApprove && cr.status === 'Pending approval' && (
                      <span className='flex gap-2'>
                        <Button
                          className='h-6 rounded-[6px] px-2 text-xs'
                          onClick={() => profile.approveChange(cr.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant='outline'
                          className='h-6 rounded-[6px] px-2 text-xs'
                          onClick={() => profile.rejectChange(cr.id)}
                        >
                          Reject
                        </Button>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>

        <PanelCard
          title='My pending tasks'
          aside={
            <Badge variant='pending'>{pendingTasks.length} awaiting me</Badge>
          }
        >
          {pendingTasks.length === 0 ? (
            <p className='text-paragraph-sm text-neutral-1000'>
              Nothing awaits your action across attendance, travel, learning
              and assets.
            </p>
          ) : (
            <ul className='space-y-2'>
              {pendingTasks.map((task) => (
                <li
                  key={task.id}
                  className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{task.item}</p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      {task.module}
                    </p>
                  </div>
                  <Badge variant='overdue'>{task.action}</Badge>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>

        {announcementsPolicy?.view && (
          <PanelCard
            title={
              <>
                Announcements
                {portal.unreadCount > 0 && (
                  <Badge variant='open'>{portal.unreadCount} unread</Badge>
                )}
              </>
            }
            aside={
              <span className='text-paragraph-sm text-neutral-1000'>
                Targeted to your audience only
              </span>
            }
          >
            <ul className='space-y-2'>
              {portal.myAnnouncements.map((a) => (
                <li
                  key={a.id}
                  className='rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-sm font-medium'>{a.title}</span>
                    <span className='flex items-center gap-2'>
                      <Badge variant='badge_inactive'>{a.template}</Badge>
                      {!a.read && (
                        <Button
                          variant='outline'
                          className='h-6 rounded-[6px] px-2 text-xs'
                          onClick={() => portal.markRead(a.id)}
                        >
                          Mark read
                        </Button>
                      )}
                    </span>
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                    {a.body}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                    {a.audience} · {formatDate(a.publishedOn)}
                  </p>
                </li>
              ))}
            </ul>
          </PanelCard>
        )}

        {leavePolicy?.view && (
          <PanelCard
            title='Leave balances'
            aside={
              <span className='text-paragraph-sm text-neutral-1000'>
                Functions shown per role & policy
              </span>
            }
          >
            <div className='grid grid-cols-2 gap-3'>
              {seedLeaveBalances.map((lb) => (
                <div
                  key={lb.type}
                  className='rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <p className='text-paragraph-sm text-neutral-1000'>{lb.type}</p>
                  <p className='text-xl font-medium'>
                    {lb.entitled - lb.used}
                    <span className='text-paragraph-sm text-neutral-1000 ml-1 font-normal'>
                      of {lb.entitled} left
                    </span>
                  </p>
                </div>
              ))}
            </div>
            {isEmployee && leavePolicy.manage && (
              <Button
                variant='outline'
                className='mt-3 h-7 rounded-[6px] px-3'
                onClick={() =>
                  toast.info(
                    'Leave application opens in the Leave module of this POC'
                  )
                }
              >
                Apply leave
              </Button>
            )}
          </PanelCard>
        )}

        {documentsPolicy?.view && (
          <>
            <PanelCard
              title='My documents'
              aside={
                restrictedDocs > 0 ? (
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {restrictedDocs} restricted document
                    {restrictedDocs === 1 ? '' : 's'} hidden
                  </span>
                ) : undefined
              }
            >
              <ul className='space-y-2'>
                {authorizedDocs.map((doc) => (
                  <li
                    key={doc.id}
                    className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{doc.name}</p>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        {doc.category} · {formatDate(doc.addedOn)}
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      className='h-6 rounded-[6px] px-2 text-xs'
                      onClick={() =>
                        toast.success(`Downloading ${doc.name} (demo)`)
                      }
                    >
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            </PanelCard>

            <PanelCard title='Feedback & surveys'>
              <ul className='space-y-2'>
                {portal.feedback.map((f) => (
                  <li
                    key={f.id}
                    className='flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 px-3 py-2'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{f.title}</p>
                      <p className='text-paragraph-sm text-neutral-1000'>
                        {f.type} · due {formatDate(f.due)}
                      </p>
                    </div>
                    {f.status === 'Open' && isEmployee ? (
                      <Button
                        className='h-6 rounded-[6px] px-2 text-xs'
                        onClick={() => portal.submitFeedback(f.id)}
                      >
                        Give feedback
                      </Button>
                    ) : (
                      <StatusBadge status={f.status} />
                    )}
                  </li>
                ))}
              </ul>
            </PanelCard>
          </>
        )}
      </div>
    </div>
  )
}
