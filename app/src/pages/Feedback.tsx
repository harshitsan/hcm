import { useMemo, useState } from 'react'
import {
  MessageSquareWarning, Plus, Lock, ShieldCheck, Send, Inbox, ListChecks,
  CircleDot, CheckCircle2, Clock3, ArrowRight, UserPlus, Tag, Reply,
  ThumbsUp, AlertTriangle, Lightbulb, MessageCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle,
  Drawer, EmptyState, Field, IconButton, Input, Modal, PageHeader, ProgressBar,
  Segmented, Select, StatCard, Switch, Table, Td, Textarea, Th, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- types */
type Kind = 'Grievance' | 'Feedback' | 'Suggestion'
type Category =
  | 'Workplace'
  | 'Harassment'
  | 'Compensation'
  | 'Facilities'
  | 'Management'
  | 'Process'
  | 'Recognition'
type Status = 'Submitted' | 'Acknowledged' | 'In progress' | 'Resolved' | 'Closed'
type Priority = 'Low' | 'Normal' | 'High'

type TimelineEntry = { stage: Status; at: string; by: string; note: string }
type Submission = {
  id: string
  ref: string
  kind: Kind
  category: Category
  subject: string
  description: string
  confidential: boolean
  status: Status
  priority: Priority
  submittedBy: string
  assignee: string | null
  submittedOn: string
  timeline: TimelineEntry[]
}

/* ----------------------------------------------------------------- constants */
const KINDS: Kind[] = ['Grievance', 'Feedback', 'Suggestion']
const CATEGORIES: Category[] = [
  'Workplace', 'Harassment', 'Compensation', 'Facilities', 'Management', 'Process', 'Recognition',
]
const STATUS_FLOW: Status[] = ['Submitted', 'Acknowledged', 'In progress', 'Resolved', 'Closed']

const statusTone: Record<Status, 'neutral' | 'info' | 'accent' | 'accent2' | 'success' | 'warning'> = {
  Submitted: 'neutral',
  Acknowledged: 'info',
  'In progress': 'accent2',
  Resolved: 'success',
  Closed: 'accent',
}
// static (JIT-safe) dot colors per status — full class strings, no interpolation
const statusDot: Record<Status, string> = {
  Submitted: 'bg-muted-fg',
  Acknowledged: 'bg-info',
  'In progress': 'bg-accent2',
  Resolved: 'bg-success',
  Closed: 'bg-accent',
}
const priorityTone: Record<Priority, 'neutral' | 'warning' | 'danger'> = {
  Low: 'neutral', Normal: 'warning', High: 'danger',
}
const kindIcon: Record<Kind, typeof MessageCircle> = {
  Grievance: AlertTriangle, Feedback: MessageCircle, Suggestion: Lightbulb,
}
const kindTone: Record<Kind, 'danger' | 'info' | 'accent'> = {
  Grievance: 'danger', Feedback: 'info', Suggestion: 'accent',
}
// static (JIT-safe) icon tile classes per kind — full class strings, no interpolation
const kindTile: Record<Kind, string> = {
  Grievance: 'bg-danger/12 text-danger',
  Feedback: 'bg-info/12 text-info',
  Suggestion: 'bg-accent/12 text-accent',
}

const axisTooltip = {
  borderRadius: 10,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}

/* ----------------------------------------------------------------- chart slices */
const STATUS_MIX: { name: string; value: number; tone: string }[] = [
  { name: 'Open', value: 6, tone: 'rgb(var(--accent2))' },
  { name: 'In progress', value: 4, tone: 'rgb(var(--accent))' },
  { name: 'Resolved', value: 9, tone: '#16a34a' },
  { name: 'Closed', value: 5, tone: 'rgb(var(--muted-fg))' },
]

/* ----------------------------------------------------------------- module-scope components */
function StatusPill({ status }: { status: Status }) {
  return (
    <Badge tone={statusTone[status]} dot>
      {status}
    </Badge>
  )
}

function KindTag({ kind }: { kind: Kind }) {
  const Icon = kindIcon[kind]
  return (
    <Badge tone={kindTone[kind]}>
      <Icon className="h-3 w-3" /> {kind}
    </Badge>
  )
}

function ConfidentialChip() {
  return (
    <Badge tone="primary">
      <Lock className="h-3 w-3" /> Confidential
    </Badge>
  )
}

function StatusTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  const reached = new Set(timeline.map((t) => t.stage))
  return (
    <ol className="relative space-y-4 pl-6">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {STATUS_FLOW.map((stage) => {
        const entry = timeline.find((t) => t.stage === stage)
        const done = reached.has(stage)
        const isLast = timeline[timeline.length - 1]?.stage === stage
        return (
          <li key={stage} className="relative">
            <span
              className={cn(
                'absolute -left-6 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-surface',
                done && isLast && 'bg-accent2',
                done && !isLast && 'bg-success',
                !done && 'bg-muted',
              )}
              aria-hidden
            >
              {done && !isLast && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
              {done && isLast && <CircleDot className="h-2.5 w-2.5 text-white" />}
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className={cn('text-[13px] font-semibold', done ? 'text-fg' : 'text-muted-fg')}>{stage}</p>
              {entry && <span className="tnum text-2xs text-muted-fg">{entry.at}</span>}
            </div>
            {entry ? (
              <p className="mt-0.5 text-xs text-muted-fg">
                {entry.note} · <span className="font-medium text-fg">{entry.by}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-fg/60">Pending</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ----------------------------------------------------------------- page */
export default function Feedback() {
  const { role, company, persona } = useApp()
  const { employees, getEmployee } = useCompanyData()
  const { push } = useToast()
  const isEmployee = role === 'employee'
  const isReviewer = !isEmployee

  // "me" resolves strictly from the logged-in persona's linked employee record —
  // never employees[0]/last, so a confidential grievance channel keeps identity correct.
  const me = useMemo(() => {
    const meRec = persona?.employeeId ? getEmployee(persona.employeeId) : null
    return meRec?.name ?? persona?.name ?? 'You'
  }, [persona, getEmployee])
  const hrName = useMemo(
    () => employees.find((e) => e.title.includes('HR'))?.name ?? employees[0]?.name ?? 'HR Team',
    [employees],
  )
  const reviewerNames = useMemo(() => {
    const pool = employees.filter((e) => e.title.includes('HR') || e.title.includes('Head'))
    return (pool.length ? pool : employees.slice(0, 3)).map((e) => e.name)
  }, [employees])

  // ---- deterministic mock submissions (module-deterministic, no randomness/clock) ----
  const allSubmissions = useMemo<Submission[]>(() => {
    const p = (i: number) => employees[i % Math.max(1, employees.length)]?.name ?? `Person ${i}`
    return [
      {
        id: 's1', ref: 'GRV-2041', kind: 'Grievance', category: 'Management',
        subject: 'Unfair shift allocation in my team',
        description: 'I have been assigned the late shift four weeks in a row while requests are rotated for others.',
        confidential: true, status: 'In progress', priority: 'High',
        submittedBy: me, assignee: hrName, submittedOn: '02 Jun 2026',
        timeline: [
          { stage: 'Submitted', at: '02 Jun', by: me, note: 'Logged via self-service' },
          { stage: 'Acknowledged', at: '02 Jun', by: hrName, note: 'Received & confidential flag honoured' },
          { stage: 'In progress', at: '04 Jun', by: hrName, note: 'Discussing roster with department head' },
        ],
      },
      {
        id: 's2', ref: 'FBK-2039', kind: 'Feedback', category: 'Facilities',
        subject: 'Cafeteria seating is too limited at lunch',
        description: 'Peak lunch hours leave many without seating. Could we stagger break times?',
        confidential: false, status: 'Resolved', priority: 'Normal',
        submittedBy: me, assignee: p(4), submittedOn: '21 May 2026',
        timeline: [
          { stage: 'Submitted', at: '21 May', by: me, note: 'Logged via self-service' },
          { stage: 'Acknowledged', at: '21 May', by: p(4), note: 'Thanks for flagging' },
          { stage: 'In progress', at: '23 May', by: p(4), note: 'Reviewing with admin team' },
          { stage: 'Resolved', at: '28 May', by: p(4), note: 'Staggered breaks rolled out' },
        ],
      },
      {
        id: 's3', ref: 'SGN-2036', kind: 'Suggestion', category: 'Process',
        subject: 'Add a dark mode to the HR portal',
        description: 'A dark theme would reduce eye strain for those of us working late.',
        confidential: false, status: 'Acknowledged', priority: 'Low',
        submittedBy: me, assignee: null, submittedOn: '18 May 2026',
        timeline: [
          { stage: 'Submitted', at: '18 May', by: me, note: 'Logged via self-service' },
          { stage: 'Acknowledged', at: '19 May', by: hrName, note: 'Added to product backlog' },
        ],
      },
      // ---- reviewer-queue items from other employees ----
      {
        id: 's4', ref: 'GRV-2044', kind: 'Grievance', category: 'Harassment',
        subject: 'Inappropriate remarks during stand-up',
        description: 'Repeated comments that make me uncomfortable in front of the team.',
        confidential: true, status: 'Submitted', priority: 'High',
        submittedBy: p(2), assignee: null, submittedOn: '07 Jun 2026',
        timeline: [
          { stage: 'Submitted', at: '07 Jun', by: p(2), note: 'Logged via self-service' },
        ],
      },
      {
        id: 's5', ref: 'GRV-2043', kind: 'Grievance', category: 'Compensation',
        subject: 'Overtime not reflected in last cycle',
        description: 'My approved overtime for week 22 was not captured. Requesting correction.',
        confidential: false, status: 'Acknowledged', priority: 'Normal',
        submittedBy: p(3), assignee: hrName, submittedOn: '05 Jun 2026',
        timeline: [
          { stage: 'Submitted', at: '05 Jun', by: p(3), note: 'Logged via self-service' },
          { stage: 'Acknowledged', at: '06 Jun', by: hrName, note: 'Routed to payroll for check' },
        ],
      },
      {
        id: 's6', ref: 'FBK-2042', kind: 'Feedback', category: 'Workplace',
        subject: 'Hybrid policy clarity',
        description: 'The hybrid attendance expectations are unclear for cross-location teams.',
        confidential: false, status: 'In progress', priority: 'Normal',
        submittedBy: p(5), assignee: p(1), submittedOn: '04 Jun 2026',
        timeline: [
          { stage: 'Submitted', at: '04 Jun', by: p(5), note: 'Logged via self-service' },
          { stage: 'Acknowledged', at: '04 Jun', by: p(1), note: 'Reviewing with policy owner' },
          { stage: 'In progress', at: '06 Jun', by: p(1), note: 'Drafting an FAQ update' },
        ],
      },
      {
        id: 's7', ref: 'SGN-2040', kind: 'Suggestion', category: 'Recognition',
        subject: 'Quarterly peer-recognition awards',
        description: 'Introduce a lightweight peer-nominated recognition programme.',
        confidential: false, status: 'Resolved', priority: 'Low',
        submittedBy: p(6), assignee: hrName, submittedOn: '12 May 2026',
        timeline: [
          { stage: 'Submitted', at: '12 May', by: p(6), note: 'Logged via self-service' },
          { stage: 'Acknowledged', at: '13 May', by: hrName, note: 'Great idea — scoping it' },
          { stage: 'In progress', at: '20 May', by: hrName, note: 'Pilot defined for Q3' },
          { stage: 'Resolved', at: '30 May', by: hrName, note: 'Pilot approved' },
        ],
      },
    ]
  }, [employees, me, hrName])

  // Self-service view sees only own submissions; reviewer sees the whole company queue.
  const mySubmissions = useMemo(
    () => allSubmissions.filter((s) => s.submittedBy === me),
    [allSubmissions, me],
  )

  /* ------------------------------------------------------------- local UI state */
  const [scope, setScope] = useState<'mine' | 'queue'>(isEmployee ? 'mine' : 'queue')
  const [queueFilter, setQueueFilter] = useState<'All' | Status>('All')
  const [selected, setSelected] = useState<Submission | null>(null)

  // submit-modal form state
  const [open, setOpen] = useState(false)
  const [fKind, setFKind] = useState<Kind>('Feedback')
  const [fCategory, setFCategory] = useState<Category>('Workplace')
  const [fSubject, setFSubject] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fConfidential, setFConfidential] = useState(false)

  const reviewerQueue = useMemo(
    () => allSubmissions.filter((s) => queueFilter === 'All' || s.status === queueFilter),
    [allSubmissions, queueFilter],
  )

  const openCount = useMemo(
    () => allSubmissions.filter((s) => s.status === 'Submitted' || s.status === 'Acknowledged').length,
    [allSubmissions],
  )
  const unassignedCount = useMemo(
    () => allSubmissions.filter((s) => !s.assignee).length,
    [allSubmissions],
  )
  const resolvedCount = useMemo(
    () => allSubmissions.filter((s) => s.status === 'Resolved' || s.status === 'Closed').length,
    [allSubmissions],
  )

  const submit = () => {
    if (!fSubject.trim()) {
      push({ title: 'Add a short subject', tone: 'warning' })
      return
    }
    push({
      title: `${fKind} submitted${fConfidential ? ' · confidential' : ''} · tracked for you`,
      tone: 'success',
    })
    setOpen(false)
    setFKind('Feedback'); setFCategory('Workplace'); setFSubject(''); setFDesc(''); setFConfidential(false)
  }

  const reviewerAction = (label: string) => push({ title: label, tone: 'info' })

  const newButton = (
    <Button onClick={() => setOpen(true)}>
      <Plus className="h-4 w-4" /> New submission
    </Button>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Feedback & Grievance"
        subtitle={`Raise and track feedback, suggestions and grievances at ${company.name}.`}
        icon={<MessageSquareWarning className="h-5 w-5" />}
        actions={newButton}
      />

      {/* Reviewer-only stat row */}
      {isReviewer && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Open cases"
            value={openCount}
            delta="needs action"
            deltaTone="accent2"
            icon={<Inbox className="h-4 w-4" />}
          />
          <StatCard
            label="Unassigned"
            value={unassignedCount}
            delta="to route"
            deltaTone="warning"
            icon={<UserPlus className="h-4 w-4" />}
          />
          <StatCard
            label="Resolved · 30d"
            value={resolvedCount}
            delta="closed loop"
            deltaTone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatCard
            label="Avg resolution"
            value="5.2d"
            delta="-0.8d"
            deltaTone="success"
            icon={<Clock3 className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Scope switch (only HR can flip between own + queue) */}
      {isReviewer && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Segmented<'mine' | 'queue'>
            value={scope}
            onChange={setScope}
            options={[
              { value: 'queue', label: 'Reviewer queue' },
              { value: 'mine', label: 'My submissions' },
            ]}
          />
          {scope === 'queue' && (
            <Select
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value as 'All' | Status)}
              className="w-44"
              aria-label="Filter queue by status"
            >
              <option value="All">All statuses</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          )}
        </div>
      )}

      {/* ============================= REVIEWER QUEUE (HR only) ============================= */}
      {isReviewer && scope === 'queue' && (
        <div className="space-y-6">
          {/* Kanban-style journey row: case flow */}
          <div className="grid gap-4 lg:grid-cols-4">
            {(['Submitted', 'Acknowledged', 'In progress', 'Resolved'] as Status[]).map((col) => {
              const items = allSubmissions.filter((s) => s.status === col)
              return (
                <div key={col} className="rounded-2xl border border-border bg-surface2/40 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-fg">
                      <span className={cn('h-2 w-2 rounded-full', statusDot[col])} aria-hidden />
                      {col}
                    </span>
                    <Badge tone="neutral">{items.length}</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {items.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-muted-fg">No cases</p>
                    ) : (
                      items.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelected(s)}
                          className="w-full rounded-xl border border-border bg-surface p-3 text-left shadow-card transition-colors hover:bg-muted/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="tnum text-2xs font-bold text-muted-fg">{s.ref}</span>
                            {s.confidential && <Lock className="h-3 w-3 text-primary" />}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[13px] font-semibold text-fg">{s.subject}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <KindTag kind={s.kind} />
                            <Badge tone={priorityTone[s.priority]}>{s.priority}</Badge>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Avatar name={s.confidential ? 'Anonymous Reporter' : s.submittedBy} size="xs" />
                              <span className="text-2xs text-muted-fg">
                                {s.confidential ? 'Confidential' : s.submittedBy.split(' ')[0]}
                              </span>
                            </span>
                            {s.assignee ? (
                              <Avatar name={s.assignee} size="xs" />
                            ) : (
                              <span className="text-2xs font-semibold text-accent2">Unassigned</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Full queue table */}
          <Card className="overflow-hidden p-0">
            <CardHeader>
              <CardTitle>All cases · {company.name}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-fg sm:inline">Reviewers</span>
                <AvatarStack names={reviewerNames} max={4} size="sm" />
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {reviewerQueue.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<Inbox className="h-5 w-5" />}
                    title="No cases match this filter"
                    description="Clear the status filter to see the full queue."
                    action={
                      <Button variant="outline" size="sm" onClick={() => setQueueFilter('All')}>
                        Clear filter
                      </Button>
                    }
                  />
                </div>
              ) : (
                <Table>
                  <thead>
                    <Tr className="border-t-0 hover:bg-transparent">
                      <Th>Ref</Th>
                      <Th>Subject</Th>
                      <Th>Category</Th>
                      <Th>Reporter</Th>
                      <Th>Assignee</Th>
                      <Th>Priority</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Action</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {reviewerQueue.map((s) => (
                      <Tr key={s.id}>
                        <Td className="tnum text-2xs font-bold text-muted-fg">{s.ref}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-fg">{s.subject}</span>
                              <span className="mt-0.5 inline-flex"><KindTag kind={s.kind} /></span>
                            </span>
                            {s.confidential && <Lock className="h-3.5 w-3.5 shrink-0 text-primary" />}
                          </div>
                        </Td>
                        <Td><Badge tone="neutral">{s.category}</Badge></Td>
                        <Td className="text-muted-fg">
                          {s.confidential ? <span className="italic">Confidential</span> : s.submittedBy}
                        </Td>
                        <Td>
                          {s.assignee ? (
                            <span className="flex items-center gap-1.5">
                              <Avatar name={s.assignee} size="xs" />
                              <span className="text-xs text-muted-fg">{s.assignee.split(' ')[0]}</span>
                            </span>
                          ) : (
                            <Badge tone="accent2">Unassigned</Badge>
                          )}
                        </Td>
                        <Td><Badge tone={priorityTone[s.priority]}>{s.priority}</Badge></Td>
                        <Td><StatusPill status={s.status} /></Td>
                        <Td className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelected(s)}>
                            Triage <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          {/* Status mix donut */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Case status mix</CardTitle>
                <Badge tone="info">Last 90d</Badge>
              </CardHeader>
              <CardBody>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STATUS_MIX}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="rgb(var(--surface))"
                        strokeWidth={2}
                      >
                        {STATUS_MIX.map((slice) => (
                          <Cell key={slice.name} fill={slice.tone} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={axisTooltip} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* SLA progress per open case */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resolution SLA · open cases</CardTitle>
                <Badge tone="neutral">Target 7d</Badge>
              </CardHeader>
              <CardBody className="space-y-4">
                {allSubmissions
                  .filter((s) => s.status !== 'Resolved' && s.status !== 'Closed')
                  .map((s) => {
                    const pct = s.priority === 'High' ? 82 : s.priority === 'Normal' ? 54 : 28
                    const tone = pct >= 80 ? 'danger' : pct >= 50 ? 'accent2' : 'accent'
                    return (
                      <div key={s.id}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
                            <span className="tnum text-2xs font-bold text-muted-fg">{s.ref}</span>
                            <span className="truncate">{s.subject}</span>
                          </span>
                          <span className="tnum text-xs text-muted-fg">{pct}%</span>
                        </div>
                        <ProgressBar value={pct} tone={tone} />
                      </div>
                    )
                  })}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ============================= SELF-SERVICE: MY SUBMISSIONS ============================= */}
      {(!isReviewer || scope === 'mine') && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* List + timeline */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-fg" /> My submissions
              </CardTitle>
              {!isReviewer && newButton}
            </CardHeader>
            <CardBody className="space-y-3">
              {mySubmissions.length === 0 ? (
                <EmptyState
                  icon={<MessageSquareWarning className="h-5 w-5" />}
                  title="Nothing submitted yet"
                  description="Raise feedback, a suggestion, or a confidential grievance — you'll be able to track its status here."
                  action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New submission</Button>}
                />
              ) : (
                mySubmissions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="block w-full rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="tnum text-2xs font-bold text-muted-fg">{s.ref}</span>
                          <KindTag kind={s.kind} />
                          <Badge tone="neutral">{s.category}</Badge>
                          {s.confidential && <ConfidentialChip />}
                        </div>
                        <p className="mt-1.5 truncate font-semibold text-fg">{s.subject}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-fg">{s.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <StatusPill status={s.status} />
                        <span className="tnum text-2xs text-muted-fg">{s.submittedOn}</span>
                      </div>
                    </div>
                    {/* compact horizontal status track */}
                    <div className="mt-3 flex items-center gap-1.5">
                      {STATUS_FLOW.map((stage, i) => {
                        const reached = s.timeline.some((t) => t.stage === stage)
                        const isCurrent = s.timeline[s.timeline.length - 1]?.stage === stage
                        return (
                          <div key={stage} className="flex flex-1 items-center gap-1.5">
                            <span
                              className={cn(
                                'h-1.5 flex-1 rounded-full',
                                reached && isCurrent && 'bg-accent2',
                                reached && !isCurrent && 'bg-success',
                                !reached && 'bg-muted',
                              )}
                              aria-hidden
                            />
                            {i < STATUS_FLOW.length - 1 && null}
                          </div>
                        )
                      })}
                    </div>
                  </button>
                ))
              )}
            </CardBody>
          </Card>

          {/* Side rail: quick actions + confidentiality + tips */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Raise something</CardTitle>
                <IconButton variant="soft" aria-label="New submission" onClick={() => setOpen(true)}>
                  <Plus className="h-[18px] w-[18px]" />
                </IconButton>
              </CardHeader>
              <CardBody className="space-y-2.5">
                {KINDS.map((k) => {
                  const Icon = kindIcon[k]
                  const blurb: Record<Kind, string> = {
                    Grievance: 'A concern you want formally reviewed',
                    Feedback: 'Tell HR what is working or not',
                    Suggestion: 'An idea to improve the workplace',
                  }
                  return (
                    <button
                      key={k}
                      onClick={() => { setFKind(k); setOpen(true) }}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface2/40 p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', kindTile[k])}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-fg">{k}</span>
                        <span className="block truncate text-xs text-muted-fg">{blurb[k]}</span>
                      </span>
                    </button>
                  )
                })}
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-bold text-fg">Your privacy is protected</p>
                </div>
                <p className="text-xs leading-relaxed text-muted-fg">
                  Grievances are visible only to you and authorised HR reviewers — never to other
                  employees or your peers. Marking a case <span className="font-semibold text-fg">Confidential</span> hides
                  your identity from the reviewer queue. Every status change is recorded in a
                  restricted-access audit trail.
                </p>
                <p className="flex items-center gap-1.5 pt-1 text-2xs text-muted-fg">
                  <Lock className="h-3 w-3" /> Access-restricted (BRD 6.19.2)
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ============================= DETAIL DRAWER ============================= */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.ref} · ${selected.kind}` : ''}
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{selected.category}</Badge>
                <Badge tone={priorityTone[selected.priority]}>{selected.priority}</Badge>
                <StatusPill status={selected.status} />
                {selected.confidential && <ConfidentialChip />}
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight text-fg">{selected.subject}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">{selected.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface2/40 p-3 text-sm">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Reporter</p>
                <p className="mt-0.5 font-medium text-fg">
                  {selected.confidential && isReviewer ? 'Confidential' : selected.submittedBy}
                </p>
              </div>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Assignee</p>
                <p className="mt-0.5 font-medium text-fg">{selected.assignee ?? 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Submitted</p>
                <p className="mt-0.5 tnum font-medium text-fg">{selected.submittedOn}</p>
              </div>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Type</p>
                <p className="mt-0.5 font-medium text-fg">{selected.kind}</p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[13px] font-bold text-fg">Status timeline</p>
              <StatusTimeline timeline={selected.timeline} />
            </div>

            {/* Reviewer triage controls — HR only */}
            {isReviewer ? (
              <div className="space-y-3 rounded-xl border border-border bg-surface2/40 p-4">
                <p className="flex items-center gap-2 text-[13px] font-bold text-fg">
                  <ListChecks className="h-4 w-4 text-muted-fg" /> Reviewer actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Route / assign">
                    <Select defaultValue={selected.assignee ?? ''} aria-label="Assign reviewer">
                      <option value="">Unassigned</option>
                      {reviewerNames.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Categorize">
                    <Select defaultValue={selected.category} aria-label="Set category">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Response to reporter">
                  <Textarea placeholder="Write a response or internal note…" rows={3} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => reviewerAction(`${selected.ref} routed`)}>
                    <UserPlus className="h-3.5 w-3.5" /> Route
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reviewerAction(`${selected.ref} categorized`)}>
                    <Tag className="h-3.5 w-3.5" /> Categorize
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => reviewerAction(`Response sent for ${selected.ref}`)}>
                    <Reply className="h-3.5 w-3.5" /> Respond
                  </Button>
                  <Button size="sm" onClick={() => reviewerAction(`${selected.ref} resolved & closed`)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolve & close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-surface2/40 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <p className="text-xs text-muted-fg">
                  This case is visible only to you and authorised HR reviewers. You will be notified by
                  email on each status change.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ============================= SUBMIT MODAL ============================= */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New submission"
        description="Feedback and suggestions are routed to HR; grievances open a tracked, confidential case."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>
              <Send className="h-4 w-4" /> Submit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Type">
            <Segmented<Kind>
              value={fKind}
              onChange={setFKind}
              className="w-full"
              options={KINDS.map((k) => ({ value: k, label: k }))}
            />
          </Field>
          <Field label="Category" required>
            <Select value={fCategory} onChange={(e) => setFCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" required>
            <Input
              value={fSubject}
              onChange={(e) => setFSubject(e.target.value)}
              placeholder="A short one-line summary"
              autoFocus
            />
          </Field>
          <Field label="Description" hint="Be as specific as you can — dates, people involved, what happened.">
            <Textarea
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              placeholder="Describe your feedback or grievance…"
              rows={4}
            />
          </Field>
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface2/40 p-3">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-fg">Mark as confidential</p>
                <p className="mt-0.5 text-xs text-muted-fg">
                  Hide your identity from the reviewer queue. Only the assigned HR reviewer can act on it.
                </p>
              </div>
            </div>
            <Switch checked={fConfidential} onChange={setFConfidential} />
          </div>
          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <ThumbsUp className="h-3 w-3 text-success" />
            You can track the status of this submission any time from “My submissions”.
          </p>
        </div>
      </Modal>
    </div>
  )
}
