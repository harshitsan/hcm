import { useMemo, useState } from 'react'
import {
  Gauge, Plus, CalendarPlus, Filter, ShieldCheck, Check, X, Clock3,
  ArrowRightLeft, LogOut, UserCheck, CalendarClock, Milestone, ChevronRight,
  ClipboardList, TrendingUp, Users, AlertTriangle, Target,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip,
  XAxis, YAxis, RadialBar, RadialBarChart, PolarAngleAxis,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle,
  Drawer, EmptyState, Field, IconButton, Modal, PageHeader, ProgressBar,
  Segmented, Select, StatCard, Stepper, Table, Td, Textarea, Th, Tooltip, Tr,
  useToast,
} from '../components/ui'
import { cn } from '../lib/cn'
import type { ReactNode } from 'react'

/* ------------------------------------------------------------------ types */
type Outcome = 'Confirm' | 'Extend' | 'Exit'
type ApprovalState = 'done' | 'active' | 'todo'
type ChainStep = { role: 'Manager' | 'Dept Head' | 'HR'; by: string; state: ApprovalState; note?: string }

type Probation = {
  id: string
  employeeId: string
  title: string
  dept: string
  managerId: string
  startDate: string
  dueDate: string
  dueInDays: number
  progressPct: number
  recommendation: Outcome | null
  chain: ChainStep[]
  criteria: { label: string; score: number }[]
}

type CycleStage = { name: string; state: ApprovalState }
type Cycle = {
  id: string
  name: string
  window: string
  scope: string
  participants: string[]
  progressPct: number
  stages: CycleStage[]
  due: string
  tone: 'accent' | 'accent2' | 'info'
}

type Milestone = {
  id: string
  employeeId: string
  kind: 'Confirmation' | 'Transfer' | 'Exit' | 'Review'
  label: string
  date: string
  feeds: 'Confirmation' | 'Transfer' | 'Exit'
  status: 'Recorded' | 'Pending' | 'Triggered'
}

type Stat = { label: string; value: string; delta?: string; deltaTone?: 'success' | 'warning' | 'accent2' | 'info'; icon: ReactNode }

/* ------------------------------------------------------------------ chart styling */
const axisStyle = { fontSize: 11, fill: 'rgb(var(--muted-fg))' }
const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}
const gridStroke = 'rgb(var(--border))'

/* deterministic completion trend for the active review cycle (no wall-clock) */
const CYCLE_TREND: { week: string; submitted: number; calibrated: number }[] = [
  { week: 'W1', submitted: 8, calibrated: 0 },
  { week: 'W2', submitted: 21, calibrated: 4 },
  { week: 'W3', submitted: 37, calibrated: 14 },
  { week: 'W4', submitted: 52, calibrated: 28 },
  { week: 'W5', submitted: 64, calibrated: 41 },
  { week: 'W6', submitted: 72, calibrated: 58 },
]

const OUTCOME_TONE: Record<Outcome, 'success' | 'warning' | 'danger'> = {
  Confirm: 'success',
  Extend: 'warning',
  Exit: 'danger',
}
const OUTCOME_ICON: Record<Outcome, ReactNode> = {
  Confirm: <UserCheck className="h-3.5 w-3.5" />,
  Extend: <CalendarClock className="h-3.5 w-3.5" />,
  Exit: <LogOut className="h-3.5 w-3.5" />,
}

const CHAIN_STATE_TONE: Record<ApprovalState, 'success' | 'accent2' | 'neutral'> = {
  done: 'success',
  active: 'accent2',
  todo: 'neutral',
}

const MILESTONE_ICON: Record<Milestone['kind'], ReactNode> = {
  Confirmation: <UserCheck className="h-4 w-4" />,
  Transfer: <ArrowRightLeft className="h-4 w-4" />,
  Exit: <LogOut className="h-4 w-4" />,
  Review: <Target className="h-4 w-4" />,
}
const MILESTONE_STATUS_TONE: Record<Milestone['status'], 'success' | 'warning' | 'accent2'> = {
  Recorded: 'success',
  Pending: 'warning',
  Triggered: 'accent2',
}

/* ------------------------------------------------------------------ presentational sub-components (module scope) */
function ChainTrack({ chain }: { chain: ChainStep[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {chain.map((c, i) => (
        <div key={c.role} className="flex items-center gap-1.5">
          <Tooltip label={`${c.role}: ${c.by}${c.note ? ` — ${c.note}` : ''}`}>
            <span
              className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1',
                c.state === 'done' && 'bg-success/15 text-success ring-success/30',
                c.state === 'active' && 'bg-accent2/15 text-accent2 ring-accent2/40',
                c.state === 'todo' && 'bg-muted text-muted-fg ring-border',
              )}
            >
              {c.state === 'done' ? <Check className="h-3 w-3" /> : c.role[0]}
            </span>
          </Tooltip>
          {i < chain.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-fg/60" />
          )}
        </div>
      ))}
    </div>
  )
}

function StageChips({ stages }: { stages: CycleStage[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {stages.map((s) => (
        <span
          key={s.name}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            s.state === 'done' && 'bg-success/12 text-success',
            s.state === 'active' && 'bg-accent2/15 text-accent2',
            s.state === 'todo' && 'bg-muted text-muted-fg',
          )}
        >
          {s.state === 'done' && <Check className="h-3 w-3" />}
          {s.state === 'active' && <CircleActive />}
          {s.name}
        </span>
      ))}
    </div>
  )
}

function CircleActive() {
  return <span className="h-1.5 w-1.5 rounded-full bg-current" />
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const tone = score >= 4 ? 'success' : score >= 3 ? 'accent' : 'warning'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-fg">{label}</span>
        <span className="tnum font-semibold text-muted-fg">{score.toFixed(1)} / 5</span>
      </div>
      <ProgressBar value={(score / 5) * 100} tone={tone} />
    </div>
  )
}

/* ------------------------------------------------------------------ page */
export default function Performance() {
  const { role, company } = useApp()
  const { employees, getEmployee, getDepartment } = useCompanyData()
  const { push } = useToast()

  // STAFFPLUS = anyone except a plain employee. Employees get a self-service view.
  const isEmployee = role === 'employee'
  const isManagerOnly = role === 'people_manager'

  const [tab, setTab] = useState<'probation' | 'cycles' | 'milestones'>('probation')
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | Outcome>('all')
  const [openProbation, setOpenProbation] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [decisionFor, setDecisionFor] = useState<{ id: string; outcome: Outcome } | null>(null)
  const [decisionNote, setDecisionNote] = useState('')

  /* deterministic mock data — bound to real people where natural */
  const probations: Probation[] = useMemo(() => {
    const pick = (id: string, fallback: number) => getEmployee(id) ?? employees[fallback % employees.length]
    const e1 = pick('e9', 8) // Imran Khan (Probation in c1)
    const e2 = pick('e14', 13) // Riya Singh (Onboarding/new)
    const e3 = pick('e11', 10)
    const e4 = pick('e8', 7)
    const mgrName = (id: string) => getEmployee(id)?.name ?? 'Manager'
    return [
      {
        id: 'pr1',
        employeeId: e1.id,
        title: e1.title,
        dept: getDepartment(e1.departmentId)?.name ?? 'Engineering',
        managerId: e1.managerId ?? 'e2',
        startDate: '2026-03-01',
        dueDate: '2026-06-15',
        dueInDays: 6,
        progressPct: 92,
        recommendation: 'Confirm',
        chain: [
          { role: 'Manager', by: mgrName(e1.managerId ?? 'e2'), state: 'done', note: 'Recommends Confirm' },
          { role: 'Dept Head', by: 'Vikram Nair', state: 'active', note: 'Reviewing' },
          { role: 'HR', by: 'Priya Sharma', state: 'todo' },
        ],
        criteria: [
          { label: 'Quality of work', score: 4.4 },
          { label: 'Reliability', score: 4.0 },
          { label: 'Collaboration', score: 4.2 },
          { label: 'Culture fit', score: 3.8 },
        ],
      },
      {
        id: 'pr2',
        employeeId: e2.id,
        title: e2.title,
        dept: getDepartment(e2.departmentId)?.name ?? 'Data',
        managerId: e2.managerId ?? 'e2',
        startDate: '2026-04-12',
        dueDate: '2026-07-12',
        dueInDays: 33,
        progressPct: 64,
        recommendation: 'Extend',
        chain: [
          { role: 'Manager', by: mgrName(e2.managerId ?? 'e2'), state: 'active', note: 'Drafting evaluation' },
          { role: 'Dept Head', by: 'Vikram Nair', state: 'todo' },
          { role: 'HR', by: 'Priya Sharma', state: 'todo' },
        ],
        criteria: [
          { label: 'Quality of work', score: 3.4 },
          { label: 'Reliability', score: 3.0 },
          { label: 'Collaboration', score: 3.6 },
          { label: 'Culture fit', score: 4.0 },
        ],
      },
      {
        id: 'pr3',
        employeeId: e3.id,
        title: e3.title,
        dept: getDepartment(e3.departmentId)?.name ?? 'Operations',
        managerId: e3.managerId ?? 'e5',
        startDate: '2026-02-01',
        dueDate: '2026-06-09',
        dueInDays: 0,
        progressPct: 100,
        recommendation: 'Exit',
        chain: [
          { role: 'Manager', by: mgrName(e3.managerId ?? 'e5'), state: 'done', note: 'Recommends Exit' },
          { role: 'Dept Head', by: 'Karan Mehta', state: 'done', note: 'Endorsed' },
          { role: 'HR', by: 'Priya Sharma', state: 'active', note: 'Separation review' },
        ],
        criteria: [
          { label: 'Quality of work', score: 2.4 },
          { label: 'Reliability', score: 2.0 },
          { label: 'Collaboration', score: 2.8 },
          { label: 'Culture fit', score: 3.0 },
        ],
      },
      {
        id: 'pr4',
        employeeId: e4.id,
        title: e4.title,
        dept: getDepartment(e4.departmentId)?.name ?? 'Platform',
        managerId: e4.managerId ?? 'e2',
        startDate: '2026-03-20',
        dueDate: '2026-06-25',
        dueInDays: 16,
        progressPct: 78,
        recommendation: null,
        chain: [
          { role: 'Manager', by: mgrName(e4.managerId ?? 'e2'), state: 'active', note: 'Evaluation in progress' },
          { role: 'Dept Head', by: 'Vikram Nair', state: 'todo' },
          { role: 'HR', by: 'Priya Sharma', state: 'todo' },
        ],
        criteria: [
          { label: 'Quality of work', score: 4.0 },
          { label: 'Reliability', score: 3.8 },
          { label: 'Collaboration', score: 4.0 },
          { label: 'Culture fit', score: 4.2 },
        ],
      },
    ]
  }, [employees, getEmployee, getDepartment])

  const cycles: Cycle[] = useMemo(() => {
    const names = employees.map((e) => e.name)
    return [
      {
        id: 'cy1',
        name: 'H1 2026 Mid-Year Review',
        window: 'May 15 – Jun 30',
        scope: 'All employees · India',
        participants: names.slice(0, 9),
        progressPct: 72,
        due: 'Jun 30',
        tone: 'accent2',
        stages: [
          { name: 'Self review', state: 'done' },
          { name: 'Manager review', state: 'active' },
          { name: 'Calibration', state: 'todo' },
          { name: 'Sign-off', state: 'todo' },
        ],
      },
      {
        id: 'cy2',
        name: 'Engineering Quarterly OKR',
        window: 'Apr 01 – Jun 28',
        scope: 'Engineering · Platform · Data',
        participants: names.slice(2, 8),
        progressPct: 45,
        due: 'Jun 28',
        tone: 'accent',
        stages: [
          { name: 'Goal set', state: 'done' },
          { name: 'Check-in', state: 'active' },
          { name: 'Rating', state: 'todo' },
        ],
      },
      {
        id: 'cy3',
        name: 'New-Hire 90-Day Reviews',
        window: 'Rolling',
        scope: 'Employees in probation',
        participants: names.slice(5, 9),
        progressPct: 88,
        due: 'Continuous',
        tone: 'info',
        stages: [
          { name: '30-day', state: 'done' },
          { name: '60-day', state: 'done' },
          { name: '90-day', state: 'active' },
        ],
      },
    ]
  }, [employees])

  const milestones: Milestone[] = useMemo(() => {
    const nm = (id: string, fb: string) => getEmployee(id)?.name ?? fb
    return [
      { id: 'm1', employeeId: 'e9', kind: 'Review', label: `90-day review cleared for ${nm('e9', 'Imran Khan')}`, date: 'Jun 5', feeds: 'Confirmation', status: 'Recorded' },
      { id: 'm2', employeeId: 'e9', kind: 'Confirmation', label: 'Confirmation recommendation submitted', date: 'Jun 6', feeds: 'Confirmation', status: 'Triggered' },
      { id: 'm3', employeeId: 'e8', kind: 'Review', label: `Mid-cycle rating set for ${nm('e8', 'Divya Menon')}`, date: 'Jun 4', feeds: 'Transfer', status: 'Recorded' },
      { id: 'm4', employeeId: 'e8', kind: 'Transfer', label: 'Transfer eligibility flagged → Platform team', date: 'Jun 7', feeds: 'Transfer', status: 'Pending' },
      { id: 'm5', employeeId: 'e11', kind: 'Review', label: `Below-bar rating recorded for ${nm('e11', 'Joseph Thomas')}`, date: 'Jun 2', feeds: 'Exit', status: 'Recorded' },
      { id: 'm6', employeeId: 'e11', kind: 'Exit', label: 'Separation lifecycle initiated', date: 'Jun 8', feeds: 'Exit', status: 'Triggered' },
    ]
  }, [getEmployee])

  /* derived */
  const [probationState, setProbationState] = useState<Probation[]>(probations)
  // keep in sync if company switches (probations is memoized on company data)
  const visibleProbations = useMemo(() => {
    const base = probationState.length && probationState[0]?.employeeId === probations[0]?.employeeId
      ? probationState
      : probations
    return outcomeFilter === 'all'
      ? base
      : base.filter((p) => p.recommendation === outcomeFilter)
  }, [probationState, probations, outcomeFilter])

  const stats: Stat[] = useMemo(() => {
    const due = probations.filter((p) => p.dueInDays <= 7).length
    const confirm = probations.filter((p) => p.recommendation === 'Confirm').length
    return [
      { label: 'In probation', value: String(probations.length), delta: `${due} due ≤7d`, deltaTone: 'warning', icon: <UserCheck className="h-4 w-4" /> },
      { label: 'Active cycles', value: String(cycles.length), delta: '72% complete', deltaTone: 'accent2', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Confirm-ready', value: String(confirm), delta: 'this period', deltaTone: 'success', icon: <TrendingUp className="h-4 w-4" /> },
      { label: 'Milestones logged', value: String(milestones.length), delta: 'lifecycle', deltaTone: 'info', icon: <Milestone className="h-4 w-4" /> },
    ]
  }, [probations, cycles.length, milestones.length])

  const drawer = useMemo(
    () => visibleProbations.find((p) => p.id === drawerId) ?? probations.find((p) => p.id === drawerId) ?? null,
    [drawerId, visibleProbations, probations],
  )

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const applyDecision = () => {
    if (!decisionFor) return
    const { id, outcome } = decisionFor
    setProbationState((prev) => {
      const seed = prev.length ? prev : probations
      return seed.map((p) =>
        p.id === id
          ? {
              ...p,
              recommendation: outcome,
              chain: p.chain.map((c) =>
                c.role === 'Manager'
                  ? { ...c, state: 'done' as const, note: `Recommends ${outcome}` }
                  : c.role === 'Dept Head'
                    ? { ...c, state: 'active' as const }
                    : c,
              ),
            }
          : p,
      )
    })
    push({ title: `Recommendation: ${outcome} · routed to Dept Head`, tone: 'success' })
    setDecisionFor(null)
    setDecisionNote('')
  }

  /* ---------------------------------------------------------------- employee self-service view */
  if (isEmployee) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="My Performance & Probation"
          subtitle={`Your review progress and confirmation status at ${company.name}.`}
          icon={<Gauge className="h-5 w-5" />}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Probation confirmation</CardTitle>
              <Badge tone="accent2" dot>In review</Badge>
            </CardHeader>
            <CardBody className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-fg">Probation period</span>
                  <span className="tnum text-muted-fg">92% elapsed · due 15 Jun 2026</span>
                </div>
                <ProgressBar value={92} tone="accent2" />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-fg">Approval chain</p>
                <ChainTrack
                  chain={[
                    { role: 'Manager', by: 'Your manager', state: 'done', note: 'Recommended Confirm' },
                    { role: 'Dept Head', by: 'Vikram Nair', state: 'active', note: 'Reviewing' },
                    { role: 'HR', by: 'Priya Sharma', state: 'todo' },
                  ]}
                />
                <p className="mt-2 text-xs text-muted-fg">
                  Your manager has recommended confirmation. Final outcome is decided by HR.
                </p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Self review</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-muted-fg">H1 2026 Mid-Year Review is open. Submit your self review before Jun 30.</p>
              <Stepper steps={['Self', 'Manager', 'Calibrate', 'Sign-off']} current={1} />
              <Button onClick={() => push({ title: 'Self review draft saved', tone: 'success' })}>
                <ClipboardList className="h-4 w-4" /> Continue self review
              </Button>
            </CardBody>
          </Card>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-fg">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          You can see only your own review and probation status. Manager evaluations stay private until shared.
        </p>
      </div>
    )
  }

  /* ---------------------------------------------------------------- STAFFPLUS view */
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Performance & Probation"
        subtitle={
          isManagerOnly
            ? `Confirmations and review cycles for your team at ${company.name}.`
            : `Probation confirmations, review cycles & lifecycle milestones at ${company.name}.`
        }
        icon={<Gauge className="h-5 w-5" />}
        actions={
          <>
            <Tooltip label="Filter">
              <IconButton variant="outline" aria-label="Filter performance items">
                <Filter className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="New review cycle">
              <IconButton
                variant="outline"
                aria-label="Schedule new review cycle"
                onClick={() => push({ title: 'New review cycle — opens the cycle builder', tone: 'info' })}
              >
                <CalendarPlus className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Start probation evaluation">
              <IconButton
                variant="solid"
                aria-label="Start probation evaluation"
                onClick={() => setOpenProbation(true)}
              >
                <Plus className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
          </>
        }
      />

      {isManagerOnly && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/8 px-4 py-2.5 text-sm text-fg">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            Manager view — limited to your team. You record evaluations and recommend an outcome;
            the Department Head and HR make the final confirmation decision.
          </span>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} delta={s.delta} deltaTone={s.deltaTone} icon={s.icon} />
        ))}
      </div>

      {/* segmented switcher */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'probation', label: 'Confirmations' },
            { value: 'cycles', label: 'Review cycles' },
            { value: 'milestones', label: 'Milestones' },
          ]}
        />
        {tab === 'probation' && (
          <Select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as 'all' | Outcome)}
            className="sm:w-48"
            aria-label="Filter by recommended outcome"
          >
            <option value="all">All recommendations</option>
            <option value="Confirm">Confirm</option>
            <option value="Extend">Extend</option>
            <option value="Exit">Exit</option>
          </Select>
        )}
      </div>

      {/* ---------------------------------------------------------- CONFIRMATIONS BOARD */}
      {tab === 'probation' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Probation confirmations board</CardTitle>
            <Badge tone="neutral">Manager → Dept Head → HR</Badge>
          </CardHeader>
          <CardBody className="p-0">
            {visibleProbations.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<UserCheck className="h-5 w-5" />}
                  title="No matching probations"
                  description="No employees match this recommended outcome filter."
                  action={<Button variant="outline" size="sm" onClick={() => setOutcomeFilter('all')}>Clear filter</Button>}
                />
              </div>
            ) : (
              <Table>
                <thead>
                  <Tr className="border-t-0 hover:bg-transparent">
                    <Th>Employee</Th>
                    <Th>Probation</Th>
                    <Th>Due</Th>
                    <Th>Approval chain</Th>
                    <Th>Recommendation</Th>
                    <Th className="text-right">Decision</Th>
                  </Tr>
                </thead>
                <tbody>
                  {visibleProbations.map((p) => {
                    const emp = getEmployee(p.employeeId)
                    const name = emp?.name ?? 'Employee'
                    const overdue = p.dueInDays <= 0
                    const soon = p.dueInDays > 0 && p.dueInDays <= 7
                    return (
                      <Tr key={p.id} className="cursor-pointer" onClick={() => setDrawerId(p.id)}>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-fg">{name}</p>
                              <p className="truncate text-xs text-muted-fg">{p.title}</p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="w-32">
                            <div className="mb-1 flex items-center justify-between text-2xs text-muted-fg">
                              <span>{p.dept}</span>
                              <span className="tnum">{p.progressPct}%</span>
                            </div>
                            <ProgressBar value={p.progressPct} tone={p.progressPct >= 90 ? 'accent2' : 'accent'} />
                          </div>
                        </Td>
                        <Td>
                          {overdue ? (
                            <Badge tone="danger"><AlertTriangle className="h-3 w-3" /> Due today</Badge>
                          ) : soon ? (
                            <Badge tone="warning"><Clock3 className="h-3 w-3" /> {p.dueInDays}d</Badge>
                          ) : (
                            <span className="tnum text-sm text-muted-fg">{formatDate(p.dueDate)}</span>
                          )}
                        </Td>
                        <Td><ChainTrack chain={p.chain} /></Td>
                        <Td>
                          {p.recommendation ? (
                            <Badge tone={OUTCOME_TONE[p.recommendation]}>
                              {OUTCOME_ICON[p.recommendation]} {p.recommendation}
                            </Badge>
                          ) : (
                            <Badge tone="neutral">Pending</Badge>
                          )}
                        </Td>
                        <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <Tooltip label="Confirm">
                              <IconButton size="sm" variant="ghost" aria-label={`Confirm ${name}`} onClick={() => setDecisionFor({ id: p.id, outcome: 'Confirm' })}>
                                <Check className="h-4 w-4 text-success" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip label="Extend">
                              <IconButton size="sm" variant="ghost" aria-label={`Extend ${name}`} onClick={() => setDecisionFor({ id: p.id, outcome: 'Extend' })}>
                                <CalendarClock className="h-4 w-4 text-warning" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip label="Initiate exit">
                              <IconButton size="sm" variant="ghost" aria-label={`Initiate exit for ${name}`} onClick={() => setDecisionFor({ id: p.id, outcome: 'Exit' })}>
                                <X className="h-4 w-4 text-danger" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* ---------------------------------------------------------- REVIEW CYCLES */}
      {tab === 'cycles' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
            {cycles.map((c) => (
              <Card key={c.id}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-fg">{c.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-fg">
                        <CalendarClock className="h-3.5 w-3.5" /> {c.window}
                      </p>
                    </div>
                    <Badge tone={c.tone} dot>Due {c.due}</Badge>
                  </div>
                  <p className="text-xs text-muted-fg">{c.scope}</p>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-fg">Completion</span>
                      <span className="tnum font-semibold text-muted-fg">{c.progressPct}%</span>
                    </div>
                    <ProgressBar value={c.progressPct} tone={c.tone} />
                  </div>
                  <StageChips stages={c.stages} />
                  <div className="flex items-center justify-between pt-1">
                    <AvatarStack names={c.participants} max={5} size="xs" />
                    <Button variant="outline" size="sm" onClick={() => push({ title: `Opening “${c.name}”`, tone: 'info' })}>
                      Open <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>H1 cycle progress</CardTitle>
                <Badge tone="accent2">live</Badge>
              </CardHeader>
              <CardBody>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CYCLE_TREND} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="perfSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(var(--accent2))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="rgb(var(--accent2))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="perfCal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                      <RTooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="submitted" name="Submitted" stroke="rgb(var(--accent2))" strokeWidth={2} fill="url(#perfSub)" />
                      <Area type="monotone" dataKey="calibrated" name="Calibrated" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#perfCal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-fg">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent2" /> Submitted</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Calibrated</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Overall completion</CardTitle></CardHeader>
              <CardBody>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="68%" outerRadius="100%" data={[{ name: 'done', value: 72 }]} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={10} fill="rgb(var(--accent2))" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <p className="-mt-24 text-center text-2xl font-extrabold tracking-tight tnum">72%</p>
                <p className="mt-12 text-center text-xs text-muted-fg">of reviews submitted across active cycles</p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- MILESTONES → lifecycle journey */}
      {tab === 'milestones' && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-muted-fg">
            Performance milestones feed downstream lifecycle decisions. Each column is a lifecycle outcome the milestone is wired to.
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {(['Confirmation', 'Transfer', 'Exit'] as const).map((lane) => {
              const items = milestones.filter((m) => m.feeds === lane)
              const laneTone: Record<typeof lane, 'success' | 'accent' | 'danger'> = { Confirmation: 'success', Transfer: 'accent', Exit: 'danger' }
              const laneIcon: Record<typeof lane, ReactNode> = {
                Confirmation: <UserCheck className="h-4 w-4" />,
                Transfer: <ArrowRightLeft className="h-4 w-4" />,
                Exit: <LogOut className="h-4 w-4" />,
              }
              return (
                <div key={lane} className="min-w-[280px] flex-1 rounded-2xl border border-border bg-surface2/40 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="flex items-center gap-2 text-sm font-bold text-fg">
                      <span className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg',
                        lane === 'Confirmation' && 'bg-success/12 text-success',
                        lane === 'Transfer' && 'bg-accent/12 text-accent',
                        lane === 'Exit' && 'bg-danger/12 text-danger',
                      )}>
                        {laneIcon[lane]}
                      </span>
                      Feeds {lane}
                    </span>
                    <Badge tone={laneTone[lane]}>{items.length}</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((m) => {
                      const emp = getEmployee(m.employeeId)
                      return (
                        <Card key={m.id} className="shadow-none">
                          <CardBody className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex items-center gap-2 text-xs font-semibold text-muted-fg">
                                {MILESTONE_ICON[m.kind]} {m.kind}
                              </span>
                              <Badge tone={MILESTONE_STATUS_TONE[m.status]}>{m.status}</Badge>
                            </div>
                            <p className="mt-2 text-sm font-medium text-fg">{m.label}</p>
                            <div className="mt-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Avatar name={emp?.name ?? 'Employee'} size="xs" />
                                <span className="text-xs text-muted-fg">{emp?.name ?? 'Employee'}</span>
                              </div>
                              <span className="tnum text-2xs text-muted-fg">{m.date}</span>
                            </div>
                          </CardBody>
                        </Card>
                      )
                    })}
                    {items.length === 0 && (
                      <p className="px-1 py-6 text-center text-xs text-muted-fg">No milestones in this lane.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-fg">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Every recommendation, extension and exit decision is effective-dated and written to the audit trail (actor, before/after, timestamp).
      </p>

      {/* ---------------------------------------------------------- Probation detail drawer */}
      <Drawer open={!!drawer} onClose={() => setDrawerId(null)} title="Probation confirmation">
        {drawer && (() => {
          const emp = getEmployee(drawer.employeeId)
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar name={emp?.name ?? 'Employee'} size="lg" />
                <div>
                  <p className="font-bold text-fg">{emp?.name ?? 'Employee'}</p>
                  <p className="text-sm text-muted-fg">{drawer.title} · {drawer.dept}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface2/40 p-3">
                  <p className="text-2xs uppercase tracking-wide text-muted-fg">Started</p>
                  <p className="mt-0.5 text-sm font-semibold tnum text-fg">{formatDate(drawer.startDate)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/40 p-3">
                  <p className="text-2xs uppercase tracking-wide text-muted-fg">Confirmation due</p>
                  <p className="mt-0.5 text-sm font-semibold tnum text-fg">{formatDate(drawer.dueDate)}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-fg">Approval chain</p>
                <div className="space-y-2">
                  {drawer.chain.map((c) => (
                    <div key={c.role} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.by} size="xs" />
                        <div>
                          <p className="text-sm font-medium text-fg">{c.role}</p>
                          <p className="text-xs text-muted-fg">{c.by}</p>
                        </div>
                      </div>
                      <Badge tone={CHAIN_STATE_TONE[c.state]}>
                        {c.state === 'done' ? 'Approved' : c.state === 'active' ? 'In review' : 'Waiting'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-fg">Evaluation criteria</p>
                <div className="space-y-3">
                  {drawer.criteria.map((c) => (
                    <ScoreBar key={c.label} label={c.label} score={c.score} />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-fg">Recommend outcome</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDecisionFor({ id: drawer.id, outcome: 'Confirm' })}>
                    <UserCheck className="h-4 w-4 text-success" /> Confirm
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDecisionFor({ id: drawer.id, outcome: 'Extend' })}>
                    <CalendarClock className="h-4 w-4 text-warning" /> Extend
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDecisionFor({ id: drawer.id, outcome: 'Exit' })}>
                    <LogOut className="h-4 w-4 text-danger" /> Exit
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
      </Drawer>

      {/* ---------------------------------------------------------- Decision modal */}
      <Modal
        open={!!decisionFor}
        onClose={() => { setDecisionFor(null); setDecisionNote('') }}
        title={decisionFor ? `${decisionFor.outcome} probation` : ''}
        description="Record your recommendation. It routes Manager → Department Head → HR and is audit-logged."
        footer={
          <>
            <Button variant="outline" onClick={() => { setDecisionFor(null); setDecisionNote('') }}>Cancel</Button>
            <Button onClick={applyDecision}>Submit recommendation</Button>
          </>
        }
      >
        <div className="space-y-4">
          {decisionFor && (
            <div className="flex items-center gap-2">
              <Badge tone={OUTCOME_TONE[decisionFor.outcome]}>
                {OUTCOME_ICON[decisionFor.outcome]} {decisionFor.outcome}
              </Badge>
              <span className="text-sm text-muted-fg">
                {decisionFor.outcome === 'Confirm' && 'Confirm employment and trigger a confirmation letter.'}
                {decisionFor.outcome === 'Extend' && 'Extend the probation window with a revised due date.'}
                {decisionFor.outcome === 'Exit' && 'Initiate the separation lifecycle for review by HR.'}
              </span>
            </div>
          )}
          <Field label="Evaluation note" hint="Visible to the Department Head and HR in the approval chain." required>
            <Textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Summarise performance against the probation criteria…"
              autoFocus
            />
          </Field>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- New probation evaluation modal */}
      <Modal
        open={openProbation}
        onClose={() => setOpenProbation(false)}
        title="Start probation evaluation"
        description="Begin a confirmation workflow for an employee on probation."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenProbation(false)}>Cancel</Button>
            <Button onClick={() => { setOpenProbation(false); push({ title: 'Evaluation started · routed to manager', tone: 'success' }) }}>
              Start evaluation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee" required>
            <Select aria-label="Select employee">
              {employees
                .filter((e) => e.status === 'Probation' || e.status === 'Onboarding')
                .map((e) => (
                  <option key={e.id} value={e.id}>{e.name} · {e.title}</option>
                ))}
              {employees.filter((e) => e.status === 'Probation' || e.status === 'Onboarding').length === 0 && (
                <option>No employees in probation</option>
              )}
            </Select>
          </Field>
          <Field label="Confirmation due date" required>
            <Select aria-label="Select due date" defaultValue="2026-09-15">
              <option value="2026-09-15">15 Sep 2026 (90 days)</option>
              <option value="2026-12-15">15 Dec 2026 (180 days)</option>
            </Select>
          </Field>
          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <ShieldCheck className="h-3 w-3" /> Routes Manager → Department Head → HR with SLA reminders.
          </p>
        </div>
      </Modal>
    </div>
  )
}
