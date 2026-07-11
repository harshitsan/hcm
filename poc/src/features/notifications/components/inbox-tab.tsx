import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BellSlash, Checks, EnvelopeSimple, Lightning, Users } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RoleGate, useRole } from '@/context/role-context'
import { requestModuleTab } from '@/features/workflows/data/module-nav'
import {
  EVENT_TYPES,
  type AppNotification,
  type DeliveryRecord,
  type EventTypeId,
  type TeamNotification,
} from '../data/notifications'
import { resolveRecordLink } from '../data/record-links'
import { CategoryBadge } from './notification-badges'

interface InboxTabProps {
  notifications: AppNotification[]
  teamNotifications: TeamNotification[]
  unreadCount: number
  deliveries: DeliveryRecord[]
  inAppEnabled: boolean
  markRead: (id: string) => void
  markAllRead: () => void
  markReadMany: (ids: string[]) => void
  simulateEvent: (category: EventTypeId, title: string) => void
  /** Switch to another tab on this page (for records that live here). */
  openTab: (tab: string) => void
}

const SIMULATIONS: { category: EventTypeId; title: string }[] = [
  { category: 'approval', title: 'New approval request assigned to you' },
  { category: 'escalation', title: 'Escalation: item unattended past threshold' },
  { category: 'workflow', title: 'Workflow status changed on your request' },
  { category: 'reminder', title: 'Reminder: attendance not recorded today' },
  { category: 'lifecycle', title: 'Lifecycle event recorded on your profile' },
]

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * In-app notification center (NTF-02, NTF-23): read/unread state, event
 * context, filtering and item navigation. Employees without HRMS access see
 * the mandatory-email fallback view instead (NTF-14).
 */
export function InboxTab({
  notifications,
  teamNotifications,
  unreadCount,
  deliveries,
  inAppEnabled,
  markRead,
  markAllRead,
  markReadMany,
  simulateEvent,
  openTab,
}: InboxTabProps) {
  const { role, hasRole } = useRole()
  const navigate = useNavigate()
  const [categoryFilter, setCategoryFilter] = useState<'all' | EventTypeId>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  /** Reporting-manager view: read the notifications of direct reports. */
  const [teamView, setTeamView] = useState(false)

  const isManagerPersona = hasRole(
    'Platform Admin',
    'Portfolio Admin',
    'Group Company Admin',
    'Company Admin'
  )
  const showTeam = teamView && isManagerPersona

  const filtered = useMemo(() => {
    const source: AppNotification[] = showTeam
      ? teamNotifications
      : notifications
    const q = search.trim().toLowerCase()
    return source.filter(
      (n) =>
        (categoryFilter === 'all' || n.category === categoryFilter) &&
        (!unreadOnly || !n.read) &&
        (q === '' ||
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.linkedItem.toLowerCase().includes(q) ||
          (showTeam &&
            (n as TeamNotification).employee.toLowerCase().includes(q)))
    )
  }, [
    notifications,
    teamNotifications,
    showTeam,
    categoryFilter,
    unreadOnly,
    search,
  ])

  const toggleSelected = (id: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id)
    )

  const submitBulkRead = () => {
    if (selected.length === 0) {
      toast.error('Check at least one notification to mark as read.')
      return
    }
    markReadMany(selected)
    setSelected([])
  }

  const openItem = (n: AppNotification) => {
    markRead(n.id)
    const link = resolveRecordLink(n.linkedItem, role)
    if (!link) {
      toast.info(
        `${n.linkedItem} has no dedicated screen — its items are summarised in this inbox.`
      )
      return
    }
    if (link.route === '/notifications') {
      // The record lives on another tab of this page — switch locally.
      if (link.tab) openTab(link.tab)
      return
    }
    if (link.tab) requestModuleTab(link.route, link.tab)
    toast.info(`Opening ${n.linkedItem}…`)
    navigate({ to: link.route })
  }

  const nonUserEmails = deliveries.filter((d) => d.recipientType === 'non-user')

  return (
    <RoleGate
      roles={[
        'Platform Admin',
        'Portfolio Admin',
        'Group Company Admin',
        'Company Admin',
        'Employee (User)',
      ]}
      fallback={
        <Card className='gap-3 border-none bg-white py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
              <EnvelopeSimple className='text-blue-1400 size-4' />
              You receive communications by email
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 px-4'>
            <p className='text-paragraph-sm text-neutral-1000'>
              As an Employee (Non-User) you have no HRMS application access, so
              in-app delivery is never attempted for you. Every lifecycle and
              event notification is sent to your email address — the mandatory,
              always-on channel — with your details inserted via the template
              placeholders.
            </p>
            <div className='space-y-2'>
              {nonUserEmails.map((d) => (
                <div
                  key={d.id}
                  className='border-gray-200 flex items-center justify-between rounded-[6px] border px-3 py-2'
                >
                  <div>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {d.subject}
                    </p>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Emailed to {d.recipient} · {d.templateVersion}
                    </p>
                  </div>
                  <CategoryBadge category={d.eventType} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      }
    >
      {!inAppEnabled && (
        <Card className='mb-3 gap-2 border-none bg-white py-3'>
          <CardContent className='flex items-center gap-2 px-4'>
            <BellSlash className='text-neutral-1000 size-4' />
            <p className='text-paragraph-sm text-neutral-1000'>
              In-app notifications are currently disabled for your company —
              no new in-app notifications will appear. Enabled channels (with
              email as the mandatory fallback) continue to deliver.
            </p>
          </CardContent>
        </Card>
      )}

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search notifications…'
            className='h-7 w-[200px] rounded-[6px]'
          />
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as 'all' | EventTypeId)}
          >
            <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All event types</SelectItem>
              {EVENT_TYPES.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            className='h-7 rounded-[6px] px-2'
            onClick={() => setUnreadOnly((v) => !v)}
          >
            Unread ({unreadCount})
          </Button>
          {isManagerPersona && (
            <Button
              variant={showTeam ? 'default' : 'outline'}
              className='h-7 gap-1 rounded-[6px] px-2'
              onClick={() => {
                setTeamView((v) => !v)
                setSelected([])
              }}
            >
              <Users className='size-3.5' />
              My team
            </Button>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {!showTeam && (
            <Button
              variant='outline'
              className='h-7 rounded-[6px] px-2'
              onClick={submitBulkRead}
            >
              Submit ({selected.length})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='h-7 gap-1 rounded-[6px] px-2'>
                <Lightning className='size-3.5' />
                Simulate event
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-[260px]'>
              {SIMULATIONS.map((s) => (
                <DropdownMenuItem
                  key={s.category}
                  onClick={() => simulateEvent(s.category, s.title)}
                >
                  {s.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Checks className='size-3.5' />
            Mark all read
          </Button>
        </div>
      </div>

      {showTeam && (
        <Card className='mb-3 gap-2 rounded-[8px] border border-gray-200 bg-white py-3'>
          <CardContent className='flex items-center gap-2 px-4'>
            <Users className='text-blue-1400 size-4' />
            <p className='text-paragraph-sm text-neutral-1000'>
              Reporting-manager view: you are reading the notifications of your
              direct reports. Switch “My team” off to return to your own
              notifications.
            </p>
          </CardContent>
        </Card>
      )}

      <div className='space-y-2'>
        {filtered.length === 0 && (
          <Card className='border-none bg-white py-6'>
            <CardContent className='text-neutral-1000 text-center text-sm'>
              No notifications match the current filter.
            </CardContent>
          </Card>
        )}
        {filtered.map((n) => (
          <Card
            key={n.id}
            className={`gap-1 border-none py-3 ${n.read ? 'bg-white' : 'bg-blue-150'}`}
          >
            <CardContent className='flex items-start justify-between gap-3 px-4'>
              <div className='flex items-start gap-3'>
                {!showTeam ? (
                  <Checkbox
                    variant='blue'
                    className='mt-1'
                    checked={selected.includes(n.id)}
                    onCheckedChange={(c) => toggleSelected(n.id, c === true)}
                    disabled={n.read}
                    aria-label={`Select ${n.title}`}
                  />
                ) : (
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-grey-200' : 'bg-blue-1400'}`}
                    aria-label={n.read ? 'Read' : 'Unread'}
                  />
                )}
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-neutral-1600 text-sm font-medium'>
                      {n.title}
                    </p>
                    <CategoryBadge category={n.category} />
                    {showTeam && (
                      <Badge variant='badge_active'>
                        {(n as TeamNotification).employee}
                      </Badge>
                    )}
                    {n.escalationLevel !== undefined && (
                      <Badge variant='dropped'>Level {n.escalationLevel}</Badge>
                    )}
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                    {n.body}
                  </p>
                  <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                    {timeFmt.format(new Date(n.createdAt))}
                    {n.requester ? ` · Requested by ${n.requester}` : ''}
                    {' · '}
                    <span className='inline-flex items-center gap-1'>
                      Delivered via Dashboard + Email
                      <EnvelopeSimple className='size-3' aria-hidden />
                    </span>
                  </p>
                </div>
              </div>
              {!showTeam && (
                <div className='flex shrink-0 items-center gap-2'>
                  {!n.read && (
                    <Button
                      variant='outline'
                      className='h-7 rounded-[6px] px-2'
                      onClick={() => markRead(n.id)}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    className='h-7 rounded-[6px] px-2'
                    onClick={() => openItem(n)}
                  >
                    Open item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </RoleGate>
  )
}
