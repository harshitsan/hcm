import { useMemo, useState } from 'react'
import {
  CalendarCheck, Plus, CalendarPlus, Filter, Video, Clock3, ClipboardList,
  Star, Check, UserPlus, PhoneCall, ShieldCheck, MessageSquare, ThumbsUp,
  ThumbsDown, MinusCircle, ArrowRight, Briefcase, CircleDot, CheckCircle2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RTooltip, Cell,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle,
  Drawer, EmptyState, Field, IconButton, PageHeader, ProgressBar,
  Segmented, Select, StatCard, Switch, Textarea, Tooltip, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- types */
type Recommendation = 'strong-yes' | 'yes' | 'no' | 'strong-no'
type CardStatus = 'submitted' | 'draft' | 'pending'
type RefStatus = 'Pending' | 'In progress' | 'Completed'
type Mode = 'Video' | 'Onsite' | 'Phone'

type Interview = {
  id: string
  candidate: string
  role: string
  stage: 'Screening' | 'Technical' | 'System Design' | 'Hiring Manager' | 'Culture'
  day: string
  slot: string
  mode: Mode
  panel: string[] // employee names
  acknowledged: boolean
  myTask: boolean // assigned to the current panel member
}

type Criterion = { id: string; label: string; hint: string }

type Scorecard = {
  id: string
  candidate: string
  role: string
  panelist: string
  status: CardStatus
  overall: number // 0-5
  recommendation: Recommendation | null
  comment: string
}

type RefCheck = {
  id: string
  candidate: string
  referee: string
  relation: string
  status: RefStatus
  rating: number // 0-5
  note: string
}

/* ----------------------------------------------------------------- deterministic mock data */
const RATING_SCALE = [1, 2, 3, 4, 5]

const SCORECARD_CRITERIA: Criterion[] = [
  { id: 'tech', label: 'Technical depth', hint: 'Mastery of core concepts for the role' },
  { id: 'problem', label: 'Problem solving', hint: 'Decomposition, trade-offs, edge cases' },
  { id: 'comm', label: 'Communication', hint: 'Clarity, structure, listening' },
  { id: 'collab', label: 'Collaboration & values', hint: 'Teamwork, ownership, culture add' },
  { id: 'role', label: 'Role alignment', hint: 'Fit to the requisition expectations' },
]

const RECO_META: Record<Recommendation, { label: string; tone: 'success' | 'info' | 'warning' | 'danger'; icon: typeof ThumbsUp }> = {
  'strong-yes': { label: 'Strong hire', tone: 'success', icon: ThumbsUp },
  yes: { label: 'Hire', tone: 'info', icon: ThumbsUp },
  no: { label: 'No hire', tone: 'warning', icon: MinusCircle },
  'strong-no': { label: 'Strong no', tone: 'danger', icon: ThumbsDown },
}

const STAGE_TONE: Record<Interview['stage'], 'neutral' | 'info' | 'primary' | 'accent' | 'accent2'> = {
  Screening: 'neutral',
  Technical: 'info',
  'System Design': 'primary',
  'Hiring Manager': 'accent',
  Culture: 'accent2',
}

const MODE_ICON: Record<Mode, typeof Video> = {
  Video: Video,
  Onsite: Briefcase,
  Phone: PhoneCall,
}

// Journey columns: the panel-member flow for an assigned interview.
type JourneyTone = 'neutral' | 'info' | 'accent' | 'accent2' | 'success'
const JOURNEY: { key: string; label: string; desc: string; tone: JourneyTone }[] = [
  { key: 'assigned', label: 'Assigned', desc: 'Panel invite received', tone: 'neutral' },
  { key: 'accepted', label: 'Accepted', desc: 'Acknowledged & confirmed', tone: 'info' },
  { key: 'scheduled', label: 'Scheduled', desc: 'Slot on the calendar', tone: 'accent' },
  { key: 'scored', label: 'Scorecard', desc: 'Structured feedback', tone: 'accent2' },
  { key: 'decided', label: 'Decision', desc: 'Used in debrief', tone: 'success' },
]
// static class maps so Tailwind JIT keeps these utilities (no dynamic interpolation)
const JOURNEY_RING: Record<JourneyTone, string> = {
  neutral: 'bg-muted', info: 'bg-info/15', accent: 'bg-accent/15', accent2: 'bg-accent2/15', success: 'bg-success/15',
}
const JOURNEY_DOT: Record<JourneyTone, string> = {
  neutral: 'bg-muted-fg', info: 'bg-info', accent: 'bg-accent', accent2: 'bg-accent2', success: 'bg-success',
}

// recommendation pick-button styles (static so JIT keeps them)
const RECO_ACTIVE: Record<Recommendation, string> = {
  'strong-yes': 'border-success bg-success/12 text-success',
  yes: 'border-info bg-info/12 text-info',
  no: 'border-warning bg-warning/15 text-warning',
  'strong-no': 'border-danger bg-danger/12 text-danger',
}

const CARD_STATUS_TONE: Record<CardStatus, 'success' | 'warning' | 'neutral'> = {
  submitted: 'success',
  draft: 'warning',
  pending: 'neutral',
}
const CARD_STATUS_LABEL: Record<CardStatus, string> = {
  submitted: 'Submitted',
  draft: 'Draft saved',
  pending: 'Awaiting',
}

const REF_TONE: Record<RefStatus, 'neutral' | 'warning' | 'success'> = {
  Pending: 'neutral',
  'In progress': 'warning',
  Completed: 'success',
}

/* ----------------------------------------------------------------- small presentational helpers (module scope) */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} of 5`}>
      {RATING_SCALE.map((n) => (
        <Star key={n} className={cn('h-3.5 w-3.5', n <= rating ? 'fill-warning text-warning' : 'text-border')} />
      ))}
    </span>
  )
}

function RatingRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string
  hint: string
  value: number
  onChange: (n: number) => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-surface2/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">{label}</p>
          <p className="mt-0.5 text-xs text-muted-fg">{hint}</p>
        </div>
        <span className="tnum shrink-0 text-sm font-bold text-fg">{value || '–'}<span className="text-muted-fg">/5</span></span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5" role="group" aria-label={`${label} rating`}>
        {RATING_SCALE.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`${label}: ${n} of 5`}
            aria-pressed={n <= value}
            onClick={() => onChange(n)}
            className={cn(
              'inline-flex h-8 flex-1 items-center justify-center rounded-lg border text-sm font-bold transition-colors',
              disabled && 'cursor-default opacity-70',
              n <= value
                ? 'border-warning bg-warning/15 text-warning'
                : 'border-border bg-surface text-muted-fg hover:border-muted-fg/40',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page */
export default function Interviews() {
  const { role, company, persona } = useApp()
  const { employees } = useCompanyData()
  const { push } = useToast()

  const isAdmin = role === 'company_hr_admin' || role === 'provider_admin' || role === 'portfolio_manager'
  const meName = persona?.name ?? employees[0]?.name ?? 'You'

  // pull a few real people to populate panels deterministically
  const panelPool = useMemo(() => employees.map((e) => e.name), [employees])
  const p = useMemo(
    () => (i: number) => panelPool[i % Math.max(1, panelPool.length)] ?? `Panelist ${i + 1}`,
    [panelPool],
  )

  /* ---- upcoming interviews (deterministic) ---- */
  const interviews = useMemo<Interview[]>(
    () => [
      {
        id: 'iv1', candidate: 'Meera Krishnan', role: 'Senior Backend Engineer', stage: 'Technical',
        day: 'Today', slot: '11:00 – 11:45', mode: 'Video',
        panel: [meName, p(1), p(3)], acknowledged: true, myTask: true,
      },
      {
        id: 'iv2', candidate: 'Daniel Osei', role: 'Account Executive', stage: 'Hiring Manager',
        day: 'Today', slot: '15:30 – 16:15', mode: 'Onsite',
        panel: [meName, p(2)], acknowledged: false, myTask: true,
      },
      {
        id: 'iv3', candidate: 'Priya Anand', role: 'Data Analyst', stage: 'System Design',
        day: 'Tomorrow', slot: '10:00 – 11:00', mode: 'Video',
        panel: [meName, p(4), p(5), p(6)], acknowledged: true, myTask: true,
      },
      {
        id: 'iv4', candidate: 'Tariq Aziz', role: 'DevOps Engineer', stage: 'Screening',
        day: 'Thu, 12 Jun', slot: '09:30 – 10:00', mode: 'Phone',
        panel: [p(2), p(7)], acknowledged: true, myTask: false,
      },
      {
        id: 'iv5', candidate: 'Lin Wei', role: 'Product Recruiter', stage: 'Culture',
        day: 'Fri, 13 Jun', slot: '14:00 – 14:45', mode: 'Video',
        panel: [meName, p(3), p(8)], acknowledged: false, myTask: true,
      },
    ],
    [meName, p],
  )

  /* ---- submitted scorecards summary per candidate ---- */
  const scorecards = useMemo<Scorecard[]>(
    () => [
      { id: 'sc1', candidate: 'Meera Krishnan', role: 'Senior Backend Engineer', panelist: p(1), status: 'submitted', overall: 5, recommendation: 'strong-yes', comment: 'Excellent system thinking; clean trade-off analysis.' },
      { id: 'sc2', candidate: 'Meera Krishnan', role: 'Senior Backend Engineer', panelist: p(3), status: 'submitted', overall: 4, recommendation: 'yes', comment: 'Solid depth, communication could be crisper.' },
      { id: 'sc3', candidate: 'Meera Krishnan', role: 'Senior Backend Engineer', panelist: meName, status: 'pending', overall: 0, recommendation: null, comment: '' },
      { id: 'sc4', candidate: 'Daniel Osei', role: 'Account Executive', panelist: p(2), status: 'draft', overall: 3, recommendation: null, comment: 'Strong rapport; verifying quota history.' },
      { id: 'sc5', candidate: 'Daniel Osei', role: 'Account Executive', panelist: meName, status: 'pending', overall: 0, recommendation: null, comment: '' },
      { id: 'sc6', candidate: 'Priya Anand', role: 'Data Analyst', panelist: p(4), status: 'submitted', overall: 4, recommendation: 'yes', comment: 'Sharp SQL, good product intuition.' },
      { id: 'sc7', candidate: 'Priya Anand', role: 'Data Analyst', panelist: p(5), status: 'submitted', overall: 2, recommendation: 'no', comment: 'Struggled with ambiguity in the case.' },
    ],
    [meName, p],
  )

  /* ---- reference checks ---- */
  const refChecks = useMemo<RefCheck[]>(
    () => [
      { id: 'rf1', candidate: 'Meera Krishnan', referee: 'Anita Rao', relation: 'Former manager', status: 'Completed', rating: 5, note: 'Would rehire without hesitation; led the payments rewrite.' },
      { id: 'rf2', candidate: 'Daniel Osei', referee: 'James Hale', relation: 'Skip-level lead', status: 'In progress', rating: 0, note: 'Call scheduled for Thu; consent confirmed.' },
      { id: 'rf3', candidate: 'Priya Anand', referee: 'Sara Cohen', relation: 'Peer (2 yrs)', status: 'Pending', rating: 0, note: 'Awaiting referee availability.' },
    ],
    [],
  )

  /* ---- derived stats ---- */
  const myUpcoming = interviews.filter((i) => i.myTask).length
  const needAck = interviews.filter((i) => i.myTask && !i.acknowledged).length
  const myPending = scorecards.filter((s) => s.panelist === meName && s.status !== 'submitted').length
  const submittedCount = scorecards.filter((s) => s.status === 'submitted').length

  // average score per candidate (submitted only) — bar chart
  const candidateScores = useMemo(() => {
    const byCand = new Map<string, number[]>()
    for (const s of scorecards) {
      if (s.status !== 'submitted') continue
      const arr = byCand.get(s.candidate) ?? []
      arr.push(s.overall)
      byCand.set(s.candidate, arr)
    }
    return Array.from(byCand.entries()).map(([name, arr]) => ({
      name: name.split(' ')[0],
      avg: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10,
    }))
  }, [scorecards])

  /* ---- local UI state ---- */
  const [scope, setScope] = useState<'mine' | 'all'>(isAdmin ? 'all' : 'mine')
  const [stageFilter, setStageFilter] = useState<'All' | Interview['stage']>('All')
  const [acks, setAcks] = useState<Record<string, boolean>>({})

  // scorecard drawer
  const [drawerIv, setDrawerIv] = useState<Interview | null>(null)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [reco, setReco] = useState<Recommendation | null>(null)
  const [shareWithPanel, setShareWithPanel] = useState(false)

  // panel assignment drawer (admin)
  const [assignIv, setAssignIv] = useState<Interview | null>(null)
  const [assignPick, setAssignPick] = useState('')

  const visibleInterviews = useMemo(() => {
    return interviews.filter(
      (i) =>
        (scope === 'all' || i.myTask) &&
        (stageFilter === 'All' || i.stage === stageFilter),
    )
  }, [interviews, scope, stageFilter])

  const isAcked = (iv: Interview) => acks[iv.id] ?? iv.acknowledged

  const acknowledge = (iv: Interview) => {
    setAcks((prev) => ({ ...prev, [iv.id]: true }))
    push({ title: `Accepted · ${iv.candidate.split(' ')[0]}'s ${iv.stage} interview`, tone: 'success' })
  }

  const openScorecard = (iv: Interview) => {
    setDrawerIv(iv)
    setRatings({})
    setComment('')
    setReco(null)
    setShareWithPanel(false)
  }

  const filledCount = SCORECARD_CRITERIA.filter((c) => (ratings[c.id] ?? 0) > 0).length
  const cardComplete = filledCount === SCORECARD_CRITERIA.length && reco !== null

  const saveDraft = () => {
    push({ title: 'Draft saved — finish it after the interview', tone: 'info' })
    setDrawerIv(null)
  }

  const submitScorecard = () => {
    if (!cardComplete) {
      push({ title: 'Rate every criterion and pick a recommendation', tone: 'warning' })
      return
    }
    push({ title: 'Scorecard submitted · recorded to the audit trail', tone: 'success' })
    setDrawerIv(null)
  }

  const saveAssignment = () => {
    if (!assignPick) {
      push({ title: 'Pick a colleague to add to the panel', tone: 'warning' })
      return
    }
    push({ title: `${assignPick.split(' ')[0]} added to ${assignIv?.candidate.split(' ')[0]}'s panel`, tone: 'success' })
    setAssignIv(null)
    setAssignPick('')
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Interviews"
        subtitle={`Panels, scorecards & reference checks for ${company.name}.`}
        icon={<CalendarCheck className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Tooltip label="Filter by stage">
              <IconButton variant="outline" aria-label="Filter interviews">
                <Filter className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Add to calendar">
              <IconButton variant="outline" aria-label="Add interview to calendar">
                <CalendarPlus className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <Tooltip label="Schedule interview">
                <IconButton
                  variant="solid"
                  aria-label="Schedule interview"
                  onClick={() => push({ title: 'Open the requisition to schedule a new interview', tone: 'info' })}
                >
                  <Plus className="h-[18px] w-[18px]" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        }
      />

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="My upcoming" value={myUpcoming} delta="assigned to me" deltaTone="primary" icon={<CalendarCheck className="h-4 w-4" />} />
        <StatCard label="Need acknowledgement" value={needAck} delta={needAck ? 'action needed' : 'all clear'} deltaTone={needAck ? 'accent2' : 'success'} icon={<Clock3 className="h-4 w-4" />} />
        <StatCard label="My scorecards due" value={myPending} delta="to complete" deltaTone="warning" icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Submitted (panel)" value={submittedCount} delta="this cycle" deltaTone="info" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      {/* Journey row */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My panel-member journey</CardTitle>
          <Badge tone="info" dot>Assignment-scoped</Badge>
        </CardHeader>
        <CardBody>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {JOURNEY.map((step, idx) => (
              <div key={step.key} className="flex min-w-[150px] flex-1 items-stretch">
                <div className="flex-1 rounded-xl border border-border bg-surface2/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', JOURNEY_RING[step.tone])}>
                      <span className={cn('h-2 w-2 rounded-full', JOURNEY_DOT[step.tone])} />
                    </span>
                    <span className="text-sm font-bold text-fg">{step.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-fg">{step.desc}</p>
                  <Badge tone={step.tone} className="mt-2.5">Step {idx + 1}</Badge>
                </div>
                {idx < JOURNEY.length - 1 && (
                  <div className="flex items-center px-1 text-muted-fg" aria-hidden>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming interviews list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming interviews</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
                  aria-label="Filter by stage"
                  className="h-8 w-36 text-[13px]"
                >
                  <option value="All">All stages</option>
                  {(Object.keys(STAGE_TONE) as Interview['stage'][]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                <Segmented<'mine' | 'all'>
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: 'mine', label: 'My panels' },
                    { value: 'all', label: 'All' },
                  ]}
                />
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {visibleInterviews.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheck className="h-5 w-5" />}
                  title="No interviews here"
                  description={scope === 'mine' ? 'You have no assigned interviews for this filter.' : 'No interviews match this stage filter.'}
                  action={<Button variant="outline" size="sm" onClick={() => { setScope(isAdmin ? 'all' : 'mine'); setStageFilter('All') }}>Reset filters</Button>}
                />
              ) : (
                visibleInterviews.map((iv) => {
                  const ModeIcon = MODE_ICON[iv.mode]
                  const acked = isAcked(iv)
                  return (
                    <article
                      key={iv.id}
                      className="rounded-2xl border border-border bg-surface2/30 p-4 transition-colors hover:border-primary/40"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar name={iv.candidate} size="md" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-fg">{iv.candidate}</p>
                              <Badge tone={STAGE_TONE[iv.stage]}>{iv.stage}</Badge>
                              {iv.myTask && !acked && <Badge tone="accent2" dot>Acknowledge</Badge>}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-fg">{iv.role}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-fg">
                              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {iv.day} · <span className="tnum">{iv.slot}</span></span>
                              <span className="inline-flex items-center gap-1.5"><ModeIcon className="h-3.5 w-3.5" /> {iv.mode}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Panel</span>
                            <AvatarStack names={iv.panel} size="xs" max={4} />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => push({ title: `Joining ${iv.candidate.split(' ')[0]}'s ${iv.mode.toLowerCase()} room`, tone: 'info' })}
                            >
                              <Video className="h-4 w-4" /> Join
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="sm" onClick={() => { setAssignIv(iv); setAssignPick('') }}>
                                <UserPlus className="h-4 w-4" /> Panel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {iv.myTask && (
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                          {!acked ? (
                            <Button variant="outline" size="sm" onClick={() => acknowledge(iv)}>
                              <Check className="h-4 w-4" /> Acknowledge
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                              <CheckCircle2 className="h-4 w-4" /> Accepted
                            </span>
                          )}
                          <Button size="sm" onClick={() => openScorecard(iv)}>
                            <ClipboardList className="h-4 w-4" /> Open scorecard
                          </Button>
                        </div>
                      )}
                    </article>
                  )
                })
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column: average scores chart + reference checks */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Avg score by candidate</CardTitle>
              <Badge tone="accent">Submitted only</Badge>
            </CardHeader>
            <CardBody>
              {candidateScores.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-fg">No submitted scorecards yet.</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={candidateScores} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--muted-fg))' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: 'rgb(var(--muted-fg))' }} axisLine={false} tickLine={false} />
                      <RTooltip
                        cursor={{ fill: 'rgb(var(--muted))' }}
                        contentStyle={{
                          background: 'rgb(var(--surface))',
                          border: '1px solid rgb(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {candidateScores.map((d, i) => (
                          <Cell key={d.name} fill={i % 2 === 0 ? 'rgb(var(--accent))' : 'rgb(var(--accent2))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reference checks</CardTitle>
              <Tooltip label="New reference check">
                <IconButton
                  variant="outline"
                  size="sm"
                  aria-label="New reference check"
                  onClick={() => push({ title: 'Record a new reference-check note', tone: 'info' })}
                >
                  <Plus className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            </CardHeader>
            <CardBody className="space-y-3">
              {refChecks.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-surface2/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{r.candidate}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-fg">{r.referee} · {r.relation}</p>
                    </div>
                    <Badge tone={REF_TONE[r.status]} dot>{r.status}</Badge>
                  </div>
                  {r.status === 'Completed' && <div className="mt-2"><Stars rating={r.rating} /></div>}
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-fg">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {r.note}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Submitted scorecards summary per candidate */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Scorecards by candidate</CardTitle>
          <Badge tone="neutral">{scorecards.length} cards · {submittedCount} submitted</Badge>
        </CardHeader>
        <CardBody className="space-y-5">
          {Array.from(new Set(scorecards.map((s) => s.candidate))).map((cand) => {
            const cards = scorecards.filter((s) => s.candidate === cand)
            const submitted = cards.filter((c) => c.status === 'submitted')
            const avg = submitted.length
              ? Math.round((submitted.reduce((a, c) => a + c.overall, 0) / submitted.length) * 10) / 10
              : 0
            return (
              <div key={cand} className="rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={cand} />
                    <div>
                      <p className="font-semibold text-fg">{cand}</p>
                      <p className="text-xs text-muted-fg">{cards[0]?.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-fg">Panel avg</span>
                    <span className="tnum text-lg font-extrabold text-fg">{avg || '–'}<span className="text-sm text-muted-fg">/5</span></span>
                    <div className="hidden w-28 sm:block"><ProgressBar value={(avg / 5) * 100} tone="accent" /></div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {cards.map((c) => {
                    const reco = c.recommendation ? RECO_META[c.recommendation] : null
                    const RecoIcon = reco?.icon
                    const mine = c.panelist === meName
                    return (
                      <div key={c.id} className="rounded-xl border border-border bg-surface2/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={c.panelist} size="xs" />
                            <span className="text-xs font-semibold text-fg">{mine ? 'You' : c.panelist}</span>
                          </div>
                          <Badge tone={CARD_STATUS_TONE[c.status]} dot>{CARD_STATUS_LABEL[c.status]}</Badge>
                        </div>
                        {c.status === 'submitted' ? (
                          <>
                            <div className="mt-2 flex items-center justify-between">
                              <Stars rating={c.overall} />
                              {reco && RecoIcon && (
                                <Badge tone={reco.tone}><RecoIcon className="h-3 w-3" /> {reco.label}</Badge>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-muted-fg">{c.comment}</p>
                          </>
                        ) : c.status === 'draft' ? (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-fg">
                            <CircleDot className="h-3.5 w-3.5 text-warning" /> {c.comment || 'Draft in progress.'}
                          </p>
                        ) : (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-fg">
                            <Clock3 className="h-3.5 w-3.5" /> Not yet submitted{mine ? ' — your turn' : ''}.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </CardBody>
      </Card>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-fg">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Assignment-scoped: you only see candidates and interviews assigned to you. Submissions are immutable and written to the audit trail with actor and timestamp.
      </p>

      {/* Scorecard Drawer */}
      <Drawer
        open={drawerIv !== null}
        onClose={() => setDrawerIv(null)}
        title="Structured scorecard"
        width="max-w-lg"
      >
        {drawerIv && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface2/40 p-3">
              <div className="flex items-center gap-3">
                <Avatar name={drawerIv.candidate} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-fg">{drawerIv.candidate}</p>
                  <p className="truncate text-xs text-muted-fg">{drawerIv.role} · {drawerIv.stage}</p>
                </div>
                <Badge tone={STAGE_TONE[drawerIv.stage]} className="ml-auto">{drawerIv.day}</Badge>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-fg">Evaluation criteria</p>
                <span className="text-xs text-muted-fg">{filledCount}/{SCORECARD_CRITERIA.length} rated</span>
              </div>
              <ProgressBar value={(filledCount / SCORECARD_CRITERIA.length) * 100} tone="accent" className="mb-3" />
              <div className="space-y-2.5">
                {SCORECARD_CRITERIA.map((c) => (
                  <RatingRow
                    key={c.id}
                    label={c.label}
                    hint={c.hint}
                    value={ratings[c.id] ?? 0}
                    onChange={(n) => setRatings((prev) => ({ ...prev, [c.id]: n }))}
                  />
                ))}
              </div>
            </div>

            <Field label="Comments" hint="Justify your ratings beyond the numbers.">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What stood out? Strengths, risks, follow-ups…"
              />
            </Field>

            <div>
              <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-fg">Overall recommendation</span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(RECO_META) as Recommendation[]).map((r) => {
                  const meta = RECO_META[r]
                  const Icon = meta.icon
                  const active = reco === r
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setReco(r)}
                      className={cn(
                        'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                        active ? RECO_ACTIVE[r] : 'border-border bg-surface text-muted-fg hover:border-muted-fg/40',
                      )}
                    >
                      <Icon className="h-4 w-4" /> {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface2/40 p-3">
              <Switch checked={shareWithPanel} onChange={setShareWithPanel} label="Share my notes with the panel after debrief" />
              <p className="mt-1.5 text-xs text-muted-fg">Off by default — each panelist's judgement stays independent until the debrief.</p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={saveDraft}>Save draft</Button>
              <Button onClick={submitScorecard} disabled={!cardComplete}>
                <ThumbsUp className="h-4 w-4" /> Submit scorecard
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Panel assignment Drawer (admin only) */}
      {isAdmin && (
        <Drawer
          open={assignIv !== null}
          onClose={() => setAssignIv(null)}
          title="Assign panel member"
        >
          {assignIv && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-surface2/40 p-3">
                <p className="text-sm font-semibold text-fg">{assignIv.candidate}</p>
                <p className="mt-0.5 text-xs text-muted-fg">{assignIv.role} · {assignIv.stage} · {assignIv.day}</p>
              </div>

              <div>
                <p className="mb-2 text-[13px] font-semibold text-fg">Current panel</p>
                <div className="flex flex-wrap gap-2">
                  {assignIv.panel.map((n) => (
                    <span key={n} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-fg">
                      <Avatar name={n} size="xs" /> {n}
                    </span>
                  ))}
                </div>
              </div>

              <Field label="Add a colleague" required hint="Only people in this company appear — tenant-scoped.">
                <Select value={assignPick} onChange={(e) => setAssignPick(e.target.value)} aria-label="Select colleague to add">
                  <option value="">Select a colleague…</option>
                  {panelPool
                    .filter((n) => !assignIv.panel.includes(n))
                    .map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                </Select>
              </Field>

              <div className="rounded-xl border border-border bg-info/5 p-3 text-xs text-muted-fg">
                <p className="flex items-center gap-1.5 font-semibold text-info"><UserPlus className="h-3.5 w-3.5" /> What happens next</p>
                <p className="mt-1.5">An email invite is sent and the assignment appears in their inbox. They acknowledge, schedule, and submit a scorecard against this requisition's criteria.</p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setAssignIv(null)}>Cancel</Button>
                <Button onClick={saveAssignment} disabled={!assignPick}>
                  <UserPlus className="h-4 w-4" /> Add to panel
                </Button>
              </div>
            </div>
          )}
        </Drawer>
      )}
    </div>
  )
}
