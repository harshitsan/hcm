import { useMemo, useState } from 'react'
import {
  Bell, BellRing, CheckCheck, Settings2, Filter, AtSign, Inbox, Mail,
  Smartphone, CalendarCheck2, FileSignature, ShieldCheck, Megaphone, Clock3,
  UserCog, RefreshCw, AlarmClock, type LucideIcon,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../app/store'
import { useNotifications, type Notif } from '../app/notifications'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field,
  IconButton, PageHeader, Select, StatCard, Switch, Tabs, Tooltip, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- types */
type NotifKind =
  | 'leave' | 'attendance' | 'policy' | 'security' | 'announcement'
  | 'mention' | 'document' | 'context' | 'delegation'
type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'accent2'
type Channel = 'inapp' | 'email'
type Digest = 'event' | 'daily' | 'weekly'
type FilterTab = 'all' | 'unread' | 'mentions'

type PrefRow = {
  id: string
  label: string
  hint: string
  kind: NotifKind
  inapp: boolean
  email: boolean
  emailLocked?: boolean     // mandatory email events can't be turned off
}

/* ----------------------------------------------------------------- kind meta
 * Tailwind JIT can't see interpolated class names, so each tone carries
 * fully-static `bg`/`text` classes. */
const TONE_BG: Record<Tone, string> = {
  neutral: 'bg-muted', primary: 'bg-primary/10', success: 'bg-success/12',
  warning: 'bg-warning/15', danger: 'bg-danger/12', info: 'bg-info/12',
  accent: 'bg-accent/12', accent2: 'bg-accent2/15',
}
const TONE_FG: Record<Tone, string> = {
  neutral: 'text-muted-fg', primary: 'text-primary', success: 'text-success',
  warning: 'text-warning', danger: 'text-danger', info: 'text-info',
  accent: 'text-accent', accent2: 'text-accent2',
}

const KIND_META: Record<NotifKind, { icon: LucideIcon; tone: Tone; label: string }> = {
  leave: { icon: CalendarCheck2, tone: 'accent', label: 'Leave' },
  attendance: { icon: Clock3, tone: 'info', label: 'Attendance' },
  policy: { icon: FileSignature, tone: 'warning', label: 'Policy' },
  security: { icon: ShieldCheck, tone: 'danger', label: 'Security' },
  announcement: { icon: Megaphone, tone: 'primary', label: 'Announcement' },
  mention: { icon: AtSign, tone: 'accent2', label: 'Mention' },
  document: { icon: FileSignature, tone: 'info', label: 'Document' },
  context: { icon: RefreshCw, tone: 'neutral', label: 'Context' },
  delegation: { icon: UserCog, tone: 'success', label: 'Delegation' },
}

/* ----------------------------------------------------------------- deterministic mock */
// Per-event channel preferences (in-app / email). Security email is mandatory.
const SEED_PREFS: PrefRow[] = [
  { id: 'p1', label: 'Leave decisions', hint: 'Approved, rejected or escalated leave requests.', kind: 'leave', inapp: true, email: true },
  { id: 'p2', label: 'Attendance corrections', hint: 'Outcome of your missed-punch correction requests.', kind: 'attendance', inapp: true, email: false },
  { id: 'p3', label: 'Policy acknowledgments', hint: 'New policies to sign and renewal reminders.', kind: 'policy', inapp: true, email: true },
  { id: 'p4', label: 'Documents & HR letters', hint: 'When a new letter or document is shared with you.', kind: 'document', inapp: true, email: true },
  { id: 'p5', label: 'Announcements', hint: 'Company, location and department messages.', kind: 'announcement', inapp: true, email: false },
  { id: 'p6', label: 'Mentions', hint: 'When a colleague @-mentions you in a thread.', kind: 'mention', inapp: true, email: false },
  { id: 'p7', label: 'Security & sign-in', hint: 'New sign-ins, MFA and credential changes.', kind: 'security', inapp: true, email: true, emailLocked: true },
]

// Deterministic 7-day in-app delivery volume for the trend chart.
const VOLUME: { day: string; count: number }[] = [
  { day: 'Mon', count: 9 },
  { day: 'Tue', count: 14 },
  { day: 'Wed', count: 7 },
  { day: 'Thu', count: 18 },
  { day: 'Fri', count: 12 },
  { day: 'Sat', count: 3 },
  { day: 'Sun', count: 5 },
]

const axisStyle = { fontSize: 11, fill: 'rgb(var(--muted-fg))' }
const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}

/* ----------------------------------------------------------------- row */
function NotifRow({
  n, actorName, onToggleRead,
}: {
  n: Notif
  actorName: string | null
  onToggleRead: (id: string) => void
}) {
  const meta = KIND_META[n.kind]
  const Icon = meta.icon
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
        n.read ? 'border-transparent bg-transparent' : 'border-border bg-surface2/50',
      )}
    >
      <span className="relative mt-0.5">
        {actorName ? (
          <Avatar name={actorName} size="sm" />
        ) : (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', TONE_BG[meta.tone])}>
            <Icon className={cn('h-4 w-4', TONE_FG[meta.tone])} />
          </span>
        )}
        {!n.read && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent2 ring-2 ring-surface" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-fg">
            <Icon className={cn('h-3.5 w-3.5', TONE_FG[meta.tone])} />
            {n.module}
          </span>
          {n.mention && <Badge tone="accent2">Mention</Badge>}
          <span className="tnum ml-auto whitespace-nowrap text-xs text-muted-fg">{n.time}</span>
        </div>
        <p className={cn('mt-1 truncate text-sm', n.read ? 'font-semibold text-fg' : 'font-bold text-fg')}>
          {n.title}
        </p>
        <p className="mt-0.5 text-sm text-muted-fg">{n.body}</p>
      </div>

      <Tooltip label={n.read ? 'Mark as unread' : 'Mark as read'}>
        <IconButton
          size="sm"
          variant="ghost"
          aria-label={n.read ? `Mark ${n.title} as unread` : `Mark ${n.title} as read`}
          onClick={() => onToggleRead(n.id)}
        >
          {n.read ? <Bell className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
        </IconButton>
      </Tooltip>
    </li>
  )
}

/* ----------------------------------------------------------------- page */
export default function Notifications() {
  const { role, company } = useApp()
  const { employees } = useCompanyData()
  const { push } = useToast()

  const isAdmin = role === 'company_hr_admin' || role === 'provider_admin' || role === 'portfolio_manager'

  // Shared store — read state is in sync with the top-bar bell.
  const { feed, unreadCount, mentionCount, toggleRead, markAllRead } = useNotifications()

  const names = useMemo(() => employees.map((e) => e.name), [employees])
  const actorFor = (idx: number | null): string | null =>
    idx === null ? null : names[idx % Math.max(1, names.length)] ?? null

  const [tab, setTab] = useState<FilterTab>('all')
  const [prefs, setPrefs] = useState<PrefRow[]>(SEED_PREFS)
  const [digest, setDigest] = useState<Digest>('event')

  const visible = useMemo(() => {
    if (tab === 'unread') return feed.filter((n) => !n.read)
    if (tab === 'mentions') return feed.filter((n) => n.mention)
    return feed
  }, [feed, tab])

  const markAll = () => {
    markAllRead()
    push({ title: 'All notifications marked as read', tone: 'success' })
  }

  const setChannel = (id: string, ch: Channel, value: boolean) =>
    setPrefs((p) => p.map((r) => (r.id === id ? { ...r, [ch]: value } : r)))

  const savePrefs = () =>
    push({ title: 'Notification preferences saved', tone: 'success' })

  const tabs = [
    { value: 'all', label: <span className="inline-flex items-center gap-1.5">All<Badge tone="neutral">{feed.length}</Badge></span> },
    { value: 'unread', label: <span className="inline-flex items-center gap-1.5">Unread{unreadCount > 0 && <Badge tone="accent2">{unreadCount}</Badge>}</span> },
    { value: 'mentions', label: <span className="inline-flex items-center gap-1.5">Mentions{mentionCount > 0 && <Badge tone="accent">{mentionCount}</Badge>}</span> },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={`Your in-app alerts and delivery preferences for ${company.name}.`}
        icon={<Bell className="h-5 w-5" />}
        actions={
          <>
            <Tooltip label="Mark all as read">
              <IconButton
                variant="outline"
                aria-label="Mark all notifications as read"
                onClick={markAll}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Refresh feed">
              <IconButton
                variant="outline"
                aria-label="Refresh notifications"
                onClick={() => push({ title: 'Feed up to date', tone: 'info' })}
              >
                <RefreshCw className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Preferences">
              <IconButton
                variant="outline"
                aria-label="Jump to preferences"
                onClick={() => document.getElementById('notif-prefs')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Settings2 className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
          </>
        }
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Unread" value={unreadCount} delta={unreadCount > 0 ? 'new' : 'clear'} deltaTone={unreadCount > 0 ? 'accent2' : 'success'} icon={<BellRing className="h-4 w-4" />} />
        <StatCard label="Mentions" value={mentionCount} delta="this week" deltaTone="accent" icon={<AtSign className="h-4 w-4" />} />
        <StatCard label="Delivered (7d)" value={68} delta="in-app" deltaTone="info" icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="Email channel" value="On" delta="mandatory" deltaTone="primary" icon={<Mail className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notification center */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notification center</CardTitle>
            <Badge tone="accent2" dot>{unreadCount} unread</Badge>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Tabs tabs={tabs} value={tab} onChange={(v) => setTab(v as FilterTab)} />
              <span className="hidden items-center gap-1.5 text-xs text-muted-fg sm:inline-flex">
                <Filter className="h-3.5 w-3.5" /> {visible.length} shown
              </span>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={<CheckCheck className="h-5 w-5" />}
                title={tab === 'unread' ? 'You are all caught up' : 'Nothing here yet'}
                description={
                  tab === 'mentions'
                    ? 'You have no mentions in this view.'
                    : 'New alerts about your leave, attendance, policies and documents will appear here.'
                }
              />
            ) : (
              <ul className="space-y-2">
                {visible.map((n) => (
                  <NotifRow key={n.id} n={n} actorName={actorFor(n.actorIdx)} onToggleRead={toggleRead} />
                ))}
              </ul>
            )}

            <p className="flex items-center gap-1.5 border-t border-border pt-3 text-2xs text-muted-fg">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              This feed is scoped to your company context only — it never shows other people&apos;s notifications, and is
              separate from your policy inbox.
            </p>
          </CardBody>
        </Card>

        {/* Right column: delivery trend + digest */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>In-app delivery · last 7 days</CardTitle>
              <Badge tone="info">68 total</Badge>
            </CardHeader>
            <CardBody>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={VOLUME} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="notifVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisStyle} />
                    <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={28} />
                    <RTooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgb(var(--border))' }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Notifications"
                      stroke="rgb(var(--accent))"
                      strokeWidth={2}
                      fill="url(#notifVol)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Digest frequency</CardTitle>
              <AlarmClock className="h-4 w-4 text-muted-fg" />
            </CardHeader>
            <CardBody className="space-y-3">
              <Field label="How often to bundle non-urgent alerts" hint="Urgent and security alerts are always delivered immediately.">
                <Select value={digest} onChange={(e) => setDigest(e.target.value as Digest)}>
                  <option value="event">Event-driven · as it happens</option>
                  <option value="daily">Daily digest · one summary email</option>
                  <option value="weekly">Weekly digest · Monday morning</option>
                </Select>
              </Field>
              <div className="flex items-center gap-2 rounded-xl bg-surface2/60 px-3 py-2 text-xs text-muted-fg">
                <Mail className="h-3.5 w-3.5 shrink-0 text-info" />
                {digest === 'event'
                  ? 'You will be emailed for each subscribed event.'
                  : digest === 'daily'
                    ? 'Bundled into a single email every evening.'
                    : 'Bundled into a single email every Monday.'}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Preferences */}
      <Card id="notif-prefs" className="mt-6">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <div className="flex items-center gap-2">
            <Badge tone="neutral"><Smartphone className="h-3 w-3" /> In-app</Badge>
            <Badge tone="info"><Mail className="h-3 w-3" /> Email</Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-1">
          <div className="hidden grid-cols-[1fr_auto_auto] items-center gap-6 px-4 pb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg sm:grid">
            <span>Event</span>
            <span className="w-16 text-center">In-app</span>
            <span className="w-16 text-center">Email</span>
          </div>
          {prefs.map((r) => {
            const meta = KIND_META[r.kind]
            const Icon = meta.icon
            return (
              <div
                key={r.id}
                className="grid grid-cols-1 items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted/40 sm:grid-cols-[1fr_auto_auto] sm:gap-6"
              >
                <div className="flex items-start gap-3">
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONE_BG[meta.tone])}>
                    <Icon className={cn('h-4 w-4', TONE_FG[meta.tone])} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-fg">{r.label}</p>
                    <p className="text-xs text-muted-fg">{r.hint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-11 sm:w-16 sm:justify-center sm:pl-0">
                  <span className="text-xs text-muted-fg sm:hidden">In-app</span>
                  <Switch checked={r.inapp} onChange={(v) => setChannel(r.id, 'inapp', v)} />
                </div>
                <div className="flex items-center gap-2 pl-11 sm:w-16 sm:justify-center sm:pl-0">
                  <span className="text-xs text-muted-fg sm:hidden">Email</span>
                  {r.emailLocked ? (
                    <Tooltip label="Mandatory — always delivered by email">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                        <Mail className="h-3.5 w-3.5" /> On
                      </span>
                    </Tooltip>
                  ) : (
                    <Switch checked={r.email} onChange={(v) => setChannel(r.id, 'email', v)} />
                  )}
                </div>
              </div>
            )
          })}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Email is the mandatory channel — security and account events always reach you by email.
            </p>
            <Button onClick={savePrefs}>Save preferences</Button>
          </div>
        </CardBody>
      </Card>

      {/* Admin-only: delivery routing snapshot */}
      {isAdmin && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Delivery routing · admin</CardTitle>
            <Badge tone="primary" dot>Company-wide</Badge>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'In-app delivered (7d)', value: '1,284', tone: 'accent' as Tone, icon: Inbox },
                { label: 'Emails sent (7d)', value: '942', tone: 'info' as Tone, icon: Mail },
                { label: 'Avg read time', value: '18 min', tone: 'success' as Tone, icon: Clock3 },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="rounded-xl border border-border bg-surface2/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-muted-fg">{s.label}</span>
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', TONE_BG[s.tone])}>
                        <Icon className={cn('h-3.5 w-3.5', TONE_FG[s.tone])} />
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-extrabold tracking-tight tnum">{s.value}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-2xs text-muted-fg">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Routing metrics are tenant-isolated to {company.name} and visible to admins only.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
