import { useMemo, useState } from 'react'
import {
  Megaphone, Plus, Pin, Clock, Archive, Send, CalendarClock, CheckCheck,
  Check, Users, Globe, MapPin, Building2, Scale, BadgeCheck, Eye, Inbox,
  CircleDot, Mail,
} from 'lucide-react'
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle,
  EmptyState, Field, IconButton, Input, Modal, PageHeader, ProgressBar,
  Segmented, Select, StatCard, Switch, Tabs, Textarea,
  Tooltip, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- types */
type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'accent2'
type Status = 'active' | 'scheduled' | 'expired'
type Dimension = 'Company' | 'Department' | 'Location' | 'Jurisdiction' | 'Role'
type AckType = 'Acknowledge' | 'Read-only'

type Audience = { dim: Dimension; value: string }

type Announcement = {
  id: string
  title: string
  body: string
  author: string
  category: 'General' | 'Policy' | 'Benefits' | 'Event' | 'Safety' | 'IT'
  publish: string // ISO date
  expiry: string // ISO date
  status: Status
  pinned: boolean
  ackType: AckType
  audience: Audience[]
  reach: number // people targeted
  reads: number // people who opened
  acks: number // people who acknowledged
}

/* ----------------------------------------------------------------- deterministic constants (no Date.now / Math.random) */
const TODAY = new Date('2026-06-08')
const DAY = 86_400_000

const DIMENSIONS: { dim: Dimension; icon: typeof Globe; tone: Tone }[] = [
  { dim: 'Company', icon: Globe, tone: 'primary' },
  { dim: 'Department', icon: Building2, tone: 'info' },
  { dim: 'Location', icon: MapPin, tone: 'accent' },
  { dim: 'Jurisdiction', icon: Scale, tone: 'accent2' },
  { dim: 'Role', icon: BadgeCheck, tone: 'warning' },
]
const DIM_ICON: Record<Dimension, typeof Globe> = {
  Company: Globe, Department: Building2, Location: MapPin, Jurisdiction: Scale, Role: BadgeCheck,
}
const DIM_TONE: Record<Dimension, Tone> = {
  Company: 'primary', Department: 'info', Location: 'accent', Jurisdiction: 'accent2', Role: 'warning',
}

const CATEGORY_TONE: Record<Announcement['category'], Tone> = {
  General: 'neutral', Policy: 'warning', Benefits: 'success', Event: 'accent', Safety: 'danger', IT: 'info',
}

const STATUS_META: Record<Status, { label: string; tone: Tone; icon: typeof Clock }> = {
  active: { label: 'Active', tone: 'success', icon: CircleDot },
  scheduled: { label: 'Scheduled', tone: 'info', icon: CalendarClock },
  expired: { label: 'Expired', tone: 'neutral', icon: Archive },
}

const ROLE_TARGETS = ['All roles', 'People Managers', 'Department Heads', 'Standard Employees']

/* ----------------------------------------------------------------- module-scope seed announcements (fixed, deterministic) */
const SEED: Announcement[] = [
  {
    id: 'an1',
    title: 'Q3 All-Hands — Thursday 2 PM IST',
    body: 'Join the leadership team for the quarterly all-hands. We will cover company performance, the H2 roadmap, and open Q&A. Calendar invites have gone out to everyone.',
    author: 'Vikram Nair',
    category: 'Event',
    publish: '2026-06-05',
    expiry: '2026-06-19',
    status: 'active',
    pinned: true,
    ackType: 'Read-only',
    audience: [{ dim: 'Company', value: 'All employees' }],
    reach: 312, reads: 248, acks: 0,
  },
  {
    id: 'an2',
    title: 'Updated Information Security Policy v2.0 — action required',
    body: 'A revised Information Security Policy is now in effect. All staff must read and acknowledge it by the due date. Highlights: mandatory MFA, device encryption, and the new phishing-report shortcut.',
    author: 'Priya Sharma',
    category: 'Policy',
    publish: '2026-06-03',
    expiry: '2026-06-30',
    status: 'active',
    pinned: true,
    ackType: 'Acknowledge',
    audience: [{ dim: 'Company', value: 'All employees' }, { dim: 'Jurisdiction', value: 'India · Telangana' }],
    reach: 312, reads: 281, acks: 214,
  },
  {
    id: 'an3',
    title: 'New medical insurance provider from 1 July',
    body: 'Our group medical cover moves to a new provider next month with higher coverage limits and cashless network hospitals. Enrolment links and dependant nomination forms will follow this week.',
    author: 'Priya Sharma',
    category: 'Benefits',
    publish: '2026-06-01',
    expiry: '2026-06-25',
    status: 'active',
    pinned: false,
    ackType: 'Acknowledge',
    audience: [{ dim: 'Company', value: 'All employees' }],
    reach: 312, reads: 190, acks: 120,
  },
  {
    id: 'an4',
    title: 'Engineering town hall — Platform & Data',
    body: 'Eng-wide session on the new deployment pipeline and on-call rotation changes. Optional for non-engineering staff.',
    author: 'Rahul Verma',
    category: 'General',
    publish: '2026-06-06',
    expiry: '2026-06-16',
    status: 'active',
    pinned: false,
    ackType: 'Read-only',
    audience: [{ dim: 'Department', value: 'Engineering' }],
    reach: 84, reads: 61, acks: 0,
  },
  {
    id: 'an5',
    title: 'Mumbai HQ — lift maintenance this weekend',
    body: 'The main lifts at Mumbai HQ will be serviced Sat–Sun. Please use the service lift near the east wing. Building access hours are unchanged.',
    author: 'Karan Mehta',
    category: 'Safety',
    publish: '2026-06-07',
    expiry: '2026-06-10',
    status: 'active',
    pinned: false,
    ackType: 'Read-only',
    audience: [{ dim: 'Location', value: 'Mumbai HQ' }],
    reach: 96, reads: 44, acks: 0,
  },
  {
    id: 'an6',
    title: 'Annual employee engagement survey opens Monday',
    body: 'The confidential engagement survey opens next week and stays open for 10 days. It takes ~12 minutes. Your responses are anonymised before HR sees them.',
    author: 'Priya Sharma',
    category: 'General',
    publish: '2026-06-15',
    expiry: '2026-06-28',
    status: 'scheduled',
    pinned: false,
    ackType: 'Read-only',
    audience: [{ dim: 'Company', value: 'All employees' }],
    reach: 312, reads: 0, acks: 0,
  },
  {
    id: 'an7',
    title: 'Revised remote-work guidelines — effective 1 July',
    body: 'The updated hybrid-work guideline (3 office days/week for Engineering) publishes ahead of the July rollout so teams can plan. Acknowledgement will be required once it goes live.',
    author: 'Priya Sharma',
    category: 'Policy',
    publish: '2026-06-20',
    expiry: '2026-07-20',
    status: 'scheduled',
    pinned: false,
    ackType: 'Acknowledge',
    audience: [{ dim: 'Department', value: 'Engineering' }, { dim: 'Role', value: 'People Managers' }],
    reach: 88, reads: 0, acks: 0,
  },
  {
    id: 'an8',
    title: 'Holi holiday — office closed',
    body: 'Reminder that all India offices were closed for the Holi public holiday. Normal operations have since resumed.',
    author: 'Priya Sharma',
    category: 'General',
    publish: '2026-03-13',
    expiry: '2026-03-15',
    status: 'expired',
    pinned: false,
    ackType: 'Read-only',
    audience: [{ dim: 'Jurisdiction', value: 'India · Telangana' }],
    reach: 312, reads: 305, acks: 0,
  },
  {
    id: 'an9',
    title: 'Payroll bank-detail verification window (closed)',
    body: 'The window to verify bank details for the May cycle has closed. Thank you to everyone who confirmed in time.',
    author: 'Arjun Desai',
    category: 'General',
    publish: '2026-05-02',
    expiry: '2026-05-10',
    status: 'expired',
    pinned: false,
    ackType: 'Acknowledge',
    audience: [{ dim: 'Company', value: 'All employees' }],
    reach: 312, reads: 298, acks: 290,
  },
]

/* Which seed items an employee (self-service) sees as "targeted to me", with a fixed read flag. */
const EMP_FEED_IDS = ['an2', 'an1', 'an3', 'an5'] as const
const EMP_PREREAD: Record<string, boolean> = { an1: true, an3: false, an2: false, an5: true }
/* Items the current employee has already acknowledged (fixed). */
const EMP_PREACK: Record<string, boolean> = { an3: false, an2: false, an9: true }

/* ----------------------------------------------------------------- helpers */
function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function daysFromToday(iso: string): number {
  return Math.round((new Date(iso).getTime() - TODAY.getTime()) / DAY)
}
function relWindow(a: Announcement): string {
  if (a.status === 'scheduled') {
    const d = daysFromToday(a.publish)
    return d <= 0 ? 'Publishing today' : `Publishes in ${d}d`
  }
  if (a.status === 'expired') return `Expired ${fmtDate(a.expiry)}`
  const d = daysFromToday(a.expiry)
  return d <= 0 ? 'Expires today' : `Expires in ${d}d`
}

/* ----------------------------------------------------------------- module-scope subcomponents */
function AudienceChips({ audience }: { audience: Audience[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {audience.map((a) => {
        const Icon = DIM_ICON[a.dim]
        return (
          <Badge key={a.dim + a.value} tone={DIM_TONE[a.dim]}>
            <Icon className="h-3 w-3" /> {a.value}
          </Badge>
        )
      })}
    </div>
  )
}

function ReadStat({ a }: { a: Announcement }) {
  const readPct = a.reach ? Math.round((a.reads / a.reach) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <Eye className="h-3.5 w-3.5 text-muted-fg" />
      <ProgressBar value={readPct} tone="accent" className="w-20" />
      <span className="tnum text-xs font-semibold text-muted-fg">{readPct}%</span>
    </div>
  )
}

function AckStat({ a }: { a: Announcement }) {
  if (a.ackType !== 'Acknowledge') {
    return <span className="text-xs text-muted-fg">Read-only</span>
  }
  const pct = a.reach ? Math.round((a.acks / a.reach) * 100) : 0
  const tone: Tone = pct >= 85 ? 'success' : pct >= 60 ? 'warning' : 'danger'
  return (
    <div className="flex items-center gap-2">
      <CheckCheck className="h-3.5 w-3.5 text-muted-fg" />
      <ProgressBar value={pct} tone={tone} className="w-20" />
      <span className="tnum text-xs font-semibold text-muted-fg">{pct}%</span>
    </div>
  )
}

/* ----------------------------------------------------------------- admin / HR view */
function AdminView({
  rows, companyName, readerNames,
}: { rows: Announcement[]; companyName: string; readerNames: string[] }) {
  const { push } = useToast()
  const [tab, setTab] = useState<Status>('active')
  const [composeOpen, setComposeOpen] = useState(false)

  // compose form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<Announcement['category']>('General')
  const [dim, setDim] = useState<Dimension>('Company')
  const [requireAck, setRequireAck] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [publishDate, setPublishDate] = useState('2026-06-10')
  const [expiryDate, setExpiryDate] = useState('2026-06-30')

  const counts = useMemo(() => ({
    active: rows.filter((r) => r.status === 'active').length,
    scheduled: rows.filter((r) => r.status === 'scheduled').length,
    expired: rows.filter((r) => r.status === 'expired').length,
  }), [rows])

  const visible = useMemo(() => {
    const list = rows.filter((r) => r.status === tab)
    // pinned first within the active tab
    return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned))
  }, [rows, tab])

  // headline metrics
  const metrics = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active')
    const ackable = rows.filter((r) => r.ackType === 'Acknowledge' && r.status !== 'scheduled')
    const totalReach = ackable.reduce((s, r) => s + r.reach, 0)
    const totalAck = ackable.reduce((s, r) => s + r.acks, 0)
    const ackPct = totalReach ? Math.round((totalAck / totalReach) * 100) : 0
    const awaiting = totalReach - totalAck
    return {
      active: active.length,
      scheduled: counts.scheduled,
      ackPct,
      awaiting,
      readDonut: [
        { name: 'Acknowledged', value: totalAck, tone: 'rgb(var(--accent))' },
        { name: 'Awaiting', value: awaiting, tone: 'rgb(var(--accent2))' },
      ],
    }
  }, [rows, counts.scheduled])

  const resetCompose = () => {
    setTitle(''); setBody(''); setCategory('General'); setDim('Company')
    setRequireAck(false); setPinned(false); setPublishDate('2026-06-10'); setExpiryDate('2026-06-30')
  }

  const submit = () => {
    if (!title.trim()) {
      push({ title: 'Give the announcement a title', tone: 'warning' })
      return
    }
    const scheduled = daysFromToday(publishDate) > 0
    push({
      title: scheduled
        ? `Scheduled "${title.trim()}" for ${fmtDate(publishDate)}`
        : `Published "${title.trim()}" to ${dim} audience`,
      tone: 'success',
    })
    setComposeOpen(false)
    resetCompose()
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Announcements"
        subtitle={`Broadcast & track company messages for ${companyName}.`}
        icon={<Megaphone className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Tooltip label="Send a digest">
              <IconButton variant="outline" aria-label="Send a digest of pending announcements">
                <Mail className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="View pinned">
              <IconButton variant="outline" aria-label="View pinned announcements">
                <Pin className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4" /> Compose
            </Button>
          </div>
        }
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active now" value={metrics.active} delta="live" deltaTone="success" icon={<CircleDot className="h-4 w-4" />} />
        <StatCard label="Scheduled" value={metrics.scheduled} delta="upcoming" deltaTone="info" icon={<CalendarClock className="h-4 w-4" />} />
        <StatCard label="Avg acknowledgement" value={`${metrics.ackPct}%`} delta="required msgs" deltaTone={metrics.ackPct >= 85 ? 'success' : 'warning'} icon={<CheckCheck className="h-4 w-4" />} />
        <StatCard label="Awaiting ack" value={metrics.awaiting} delta="people" deltaTone="accent2" icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feed + tabs */}
        <div className="lg:col-span-2">
          <Tabs
            className="mb-5"
            value={tab}
            onChange={(v) => setTab(v as Status)}
            tabs={[
              { value: 'active', label: <span className="flex items-center gap-2">Active <Badge tone="success">{counts.active}</Badge></span> },
              { value: 'scheduled', label: <span className="flex items-center gap-2">Scheduled <Badge tone="info">{counts.scheduled}</Badge></span> },
              { value: 'expired', label: <span className="flex items-center gap-2">Expired <Badge tone="neutral">{counts.expired}</Badge></span> },
            ]}
          />

          {visible.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-5 w-5" />}
              title={`No ${tab} announcements`}
              description={tab === 'scheduled'
                ? 'Schedule a message and it will appear here until its publish date.'
                : 'Nothing in this bucket right now.'}
            />
          ) : (
            <div className="space-y-4">
              {visible.map((a) => {
                const StatusIcon = STATUS_META[a.status].icon
                return (
                  <Card key={a.id} className={cn('transition-shadow hover:shadow-pop', a.pinned && 'ring-1 ring-accent2/40')}>
                    <CardBody>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Megaphone className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-bold tracking-tight text-fg">{a.title}</h3>
                              {a.pinned && (
                                <Badge tone="accent2"><Pin className="h-3 w-3" /> Pinned</Badge>
                              )}
                              <Badge tone={CATEGORY_TONE[a.category]}>{a.category}</Badge>
                            </div>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-fg">
                              <Avatar name={a.author} size="xs" /> {a.author}
                              <span className="text-border">·</span>
                              {fmtDate(a.publish)}
                            </p>
                          </div>
                        </div>
                        <Badge tone={STATUS_META[a.status].tone}>
                          <StatusIcon className="h-3 w-3" /> {STATUS_META[a.status].label}
                        </Badge>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-muted-fg">{a.body}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <AudienceChips audience={a.audience} />
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-fg">
                          <Clock className="h-3.5 w-3.5" /> {relWindow(a)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Reach</p>
                            <p className="tnum mt-0.5 text-sm font-bold text-fg">{a.reach}</p>
                          </div>
                          <div>
                            <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Read</p>
                            <div className="mt-1"><ReadStat a={a} /></div>
                          </div>
                          <div>
                            <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Ack</p>
                            <div className="mt-1"><AckStat a={a} /></div>
                          </div>
                        </div>
                        {a.reads > 0 && <AvatarStack names={readerNames} max={4} size="xs" />}
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right rail: ack donut + targeting recap */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acknowledgement</CardTitle>
              <Badge tone="success" dot>Live</Badge>
            </CardHeader>
            <CardBody>
              <div className="relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RTooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid rgb(var(--border))', fontSize: 12, background: 'rgb(var(--surface))' }}
                    />
                    <Pie data={metrics.readDonut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} paddingAngle={2} stroke="none">
                      {metrics.readDonut.map((d) => (
                        <Cell key={d.name} fill={d.tone} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="tnum text-2xl font-extrabold tracking-tight text-fg">{metrics.ackPct}%</span>
                  <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">acknowledged</span>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-fg"><span className="h-2 w-2 rounded-full bg-accent" /> Acknowledged</span>
                  <span className="tnum font-semibold text-fg">{metrics.readDonut[0].value}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-fg"><span className="h-2 w-2 rounded-full bg-accent2" /> Awaiting</span>
                  <span className="tnum font-semibold text-fg">{metrics.awaiting}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Targeting dimensions</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-xs text-muted-fg">
                Combine dimensions to reach a precise segment. A message is delivered to anyone matching the chosen audience.
              </p>
              <ul className="space-y-2">
                {DIMENSIONS.map(({ dim: d, icon: Icon, tone }) => (
                  <li key={d} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface2/40 px-3 py-2">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg',
                      tone === 'primary' && 'bg-primary/10 text-primary',
                      tone === 'info' && 'bg-info/12 text-info',
                      tone === 'accent' && 'bg-accent/12 text-accent',
                      tone === 'accent2' && 'bg-accent2/15 text-accent2',
                      tone === 'warning' && 'bg-warning/15 text-warning',
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-semibold text-fg">{d}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Compose modal */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose announcement"
        description="Target an audience, then publish now or schedule it."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={submit}>
              <Send className="h-4 w-4" /> {daysFromToday(publishDate) > 0 ? 'Schedule' : 'Publish'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office closed for Diwali" autoFocus />
          </Field>
          <Field label="Message">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What do you want people to know?" />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as Announcement['category'])}>
                {(['General', 'Policy', 'Benefits', 'Event', 'Safety', 'IT'] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Target dimension" hint="The audience this reaches.">
              <Select value={dim} onChange={(e) => setDim(e.target.value as Dimension)}>
                {DIMENSIONS.map(({ dim: d }) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
          </div>

          {/* dynamic audience value picker */}
          <Field label={`${dim} value`}>
            <Select aria-label={`${dim} target value`} defaultValue="">
              {dim === 'Company' && <><option>All employees</option><option>Active employees</option></>}
              {dim === 'Department' && <><option>Engineering</option><option>Sales</option><option>Finance</option><option>Human Resources</option><option>Operations</option></>}
              {dim === 'Location' && <><option>Mumbai HQ</option><option>Pune Office</option><option>Delhi Office</option><option>Remote</option></>}
              {dim === 'Jurisdiction' && <><option>India · Telangana</option><option>India · Maharashtra</option><option>United States · Delaware</option></>}
              {dim === 'Role' && ROLE_TARGETS.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Publish on">
              <Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
            </Field>
            <Field label="Expires on">
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface2/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Switch checked={requireAck} onChange={setRequireAck} label="Require acknowledgement" />
            <Switch checked={pinned} onChange={setPinned} label="Pin to top of feed" />
          </div>

          {daysFromToday(publishDate) > 0 && (
            <p className="flex items-center gap-1.5 rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-xs text-muted-fg">
              <CalendarClock className="h-3.5 w-3.5 text-info" />
              This will be scheduled and appear automatically on {fmtDate(publishDate)}.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}

/* ----------------------------------------------------------------- employee self-service view */
function EmployeeView({
  feed, companyName, selfName,
}: { feed: Announcement[]; companyName: string; selfName: string }) {
  const { push } = useToast()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [read, setRead] = useState<Set<string>>(
    () => new Set(feed.filter((a) => EMP_PREREAD[a.id]).map((a) => a.id)),
  )
  const [acked, setAcked] = useState<Set<string>>(
    () => new Set(feed.filter((a) => EMP_PREACK[a.id]).map((a) => a.id)),
  )

  const unreadCount = feed.filter((a) => !read.has(a.id)).length
  const pendingAck = feed.filter((a) => a.ackType === 'Acknowledge' && !acked.has(a.id)).length

  const visible = useMemo(
    () => (filter === 'unread' ? feed.filter((a) => !read.has(a.id)) : feed),
    [feed, filter, read],
  )

  const markRead = (id: string) => {
    setRead((prev) => prev.has(id) ? prev : new Set(prev).add(id))
  }
  const acknowledge = (a: Announcement) => {
    setRead((prev) => new Set(prev).add(a.id))
    setAcked((prev) => new Set(prev).add(a.id))
    push({ title: `Acknowledged "${a.title}"`, tone: 'success' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Announcements"
        subtitle={`Messages for you at ${companyName}.`}
        icon={<Megaphone className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge tone="accent2" className="hidden sm:inline-flex">
                <CircleDot className="h-3 w-3" /> {unreadCount} unread
              </Badge>
            )}
            <Tooltip label="Mark all read">
              <IconButton
                variant="outline"
                aria-label="Mark all announcements as read"
                onClick={() => {
                  setRead(new Set(feed.map((a) => a.id)))
                  push({ title: 'All caught up — marked everything read', tone: 'success' })
                }}
              >
                <CheckCheck className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-fg">
          <span className="flex items-center gap-1.5"><Inbox className="h-4 w-4" /> {feed.length} targeted</span>
          {pendingAck > 0 && (
            <Badge tone="warning"><CheckCheck className="h-3 w-3" /> {pendingAck} to acknowledge</Badge>
          )}
        </div>
        <Segmented<'all' | 'unread'>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread${unreadCount ? ` · ${unreadCount}` : ''}` },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<CheckCheck className="h-5 w-5" />}
          title="You're all caught up"
          description="No unread announcements. New messages targeted to you will show up here."
        />
      ) : (
        <div className="space-y-4">
          {visible.map((a) => {
            const isRead = read.has(a.id)
            const isAcked = acked.has(a.id)
            const needsAck = a.ackType === 'Acknowledge'
            return (
              <Card key={a.id} className={cn('transition-shadow hover:shadow-pop', !isRead && 'ring-1 ring-accent2/40')}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        isRead ? 'bg-muted text-muted-fg' : 'bg-primary/10 text-primary')}>
                        <Megaphone className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-accent2" aria-label="Unread" />}
                          <h3 className={cn('truncate text-sm tracking-tight', isRead ? 'font-semibold text-fg' : 'font-bold text-fg')}>{a.title}</h3>
                          {a.pinned && <Badge tone="accent2"><Pin className="h-3 w-3" /> Pinned</Badge>}
                          <Badge tone={CATEGORY_TONE[a.category]}>{a.category}</Badge>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-fg">
                          <Avatar name={a.author} size="xs" /> {a.author}
                          <span className="text-border">·</span>
                          {fmtDate(a.publish)}
                        </p>
                      </div>
                    </div>
                    {isRead ? (
                      <Badge tone="neutral"><Check className="h-3 w-3" /> Read</Badge>
                    ) : (
                      <Badge tone="accent2" dot>New</Badge>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-fg">{a.body}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <AudienceChips audience={a.audience} />
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-fg">
                      <Clock className="h-3.5 w-3.5" /> {relWindow(a)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                    {!isRead && (
                      <Button size="sm" variant="outline" onClick={() => markRead(a.id)}>
                        <Eye className="h-3.5 w-3.5" /> Mark read
                      </Button>
                    )}
                    {needsAck && (
                      isAcked ? (
                        <Badge tone="success" className="py-1.5"><Check className="h-3.5 w-3.5" /> Acknowledged</Badge>
                      ) : (
                        <Button size="sm" onClick={() => acknowledge(a)}>
                          <CheckCheck className="h-3.5 w-3.5" /> Acknowledge
                        </Button>
                      )
                    )}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-fg">
        <BadgeCheck className="h-3.5 w-3.5 text-success" />
        You only see announcements targeted to you, {selfName.split(' ')[0]} — by company, department, location, jurisdiction or role — within their active window.
      </p>
    </div>
  )
}

/* ----------------------------------------------------------------- page */
export default function Announcements() {
  const { role, persona, company } = useApp()
  const { employees } = useCompanyData()

  const isEmployee = role === 'employee'
  const canCompose = role === 'company_hr_admin' || role === 'portfolio_manager' || role === 'provider_admin'

  // stable mock dataset for THIS module
  const rows = useMemo(() => SEED, [])

  // a few real people to populate avatar "who read it" clusters
  const readerNames = useMemo(() => employees.slice(0, 8).map((e) => e.name), [employees])

  const selfName = persona?.name ?? employees[0]?.name ?? 'You'

  const empFeed = useMemo(
    () => EMP_FEED_IDS.map((id) => SEED.find((a) => a.id === id)!).filter(Boolean),
    [],
  )

  if (isEmployee || !canCompose) {
    return <EmployeeView feed={empFeed} companyName={company.name} selfName={selfName} />
  }
  return <AdminView rows={rows} companyName={company.name} readerNames={readerNames} />
}
