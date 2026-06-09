import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  Cpu, Plus, Play, Zap, Inbox, FileCheck2, Receipt, Landmark, CalendarClock,
  TrendingUp, FileSpreadsheet, CheckCircle2, XCircle, Clock3, AlertTriangle,
  Plug, Database, Building2, CircleDollarSign, ChevronRight, Bell, FileSignature,
  Send, Calculator, Workflow, ShieldCheck, RefreshCw,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip,
  XAxis, YAxis,
} from 'recharts'
import { useApp } from '../app/store'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, Drawer, EmptyState,
  Field, Input, Modal, PageHeader, Select, StatCard, Stepper, Switch, Table,
  Td, Th, Tooltip, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- types */
type EngineKey = 'payslip' | 'statutory' | 'accrual' | 'incentive' | 'fnf'
type ApprovalKind = 'Manager' | 'HR' | 'None'

type Engine = {
  key: EngineKey
  name: string
  icon: ComponentType<{ className?: string }>
  desc: string
  trigger: string
  input: string
  owner: string
  approval: ApprovalKind
  output: string
  lastRun: string
  nextRun: string
  active: boolean
  /** per-step status line for the Run-now pipeline drawer */
  pipeline: string[]
}

type RunStatus = 'Completed' | 'Awaiting approval' | 'Failed'
type RunRow = {
  id: string
  engine: EngineKey
  period: string
  records: number
  status: RunStatus
  when: string
}

type ApprovalRow = {
  id: string
  engine: EngineKey
  title: string
  scope: string
  amount: string
  people: number
  raisedBy: string
  sla: string
}
type ApprovalState = 'pending' | 'approved' | 'rejected'

type Connector = {
  key: string
  name: string
  icon: ComponentType<{ className?: string }>
  detail: string
  status: 'Connected' | 'Error'
  synced: string
}

/* ----------------------------------------------------------------- pipeline (shared automation model) */
// Trigger fired -> Inputs pulled -> Computed -> Approval requested -> Approved -> Letter generated -> Delivered
const PIPELINE_STEPS = [
  'Trigger fired',
  'Inputs pulled',
  'Computed',
  'Approval requested',
  'Approved',
  'Letter generated',
  'Delivered',
]

/* ----------------------------------------------------------------- engines (deterministic) */
const ENGINES: Engine[] = [
  {
    key: 'payslip',
    name: 'Payslip Generation',
    icon: Receipt,
    desc: 'Builds monthly payslips from attendance, leave and payroll inputs, then delivers PDFs to every employee.',
    trigger: 'Monthly · 25th',
    input: 'Attendance + Leave',
    owner: 'HR Admin',
    approval: 'HR',
    output: 'Payslip PDF',
    lastRun: 'May 25, 2026',
    nextRun: 'Jun 25, 2026',
    active: true,
    pipeline: [
      'Payroll cut-off reached for the cycle',
      'Pulled attendance + approved leave for 268 employees',
      'Gross, deductions & net pay computed',
      'Routed to HR for payroll sign-off',
      'Approved by HR Head',
      'Generated 268 payslip PDFs',
      'Delivered in-app + emailed to employees',
    ],
  },
  {
    key: 'statutory',
    name: 'PF / ESIC Submission',
    icon: Landmark,
    desc: 'Compiles statutory contributions on payroll lock and files the challan with the PF/ESIC portal.',
    trigger: 'On payroll lock',
    input: 'Payroll',
    owner: 'Finance Ops',
    approval: 'HR',
    output: 'Statutory file',
    lastRun: 'May 26, 2026',
    nextRun: 'On payroll lock',
    active: true,
    pipeline: [
      'Payroll locked for May 2026',
      'Pulled contribution base from locked payroll',
      'PF (12%) + ESIC (0.75%) computed per employee',
      'Routed to HR for statutory sign-off',
      'Approved by HR Head',
      'Generated ECR challan file',
      'Submitted to PF / ESIC portal',
    ],
  },
  {
    key: 'accrual',
    name: 'Leave Balance Accrual',
    icon: CalendarClock,
    desc: 'Credits monthly leave entitlement per the accrual policy and updates every employee balance.',
    trigger: 'Monthly · 1st',
    input: 'Accrual policy',
    owner: 'HR Admin',
    approval: 'None',
    output: 'Balance update',
    lastRun: 'Jun 1, 2026',
    nextRun: 'Jul 1, 2026',
    active: true,
    pipeline: [
      'First of the month reached',
      'Loaded accrual policy + eligibility',
      'Accrued 1.5 days per employee, capped at policy max',
      'No approval required for accrual',
      'Auto-posted',
      'Balance ledger entries generated',
      'Updated balances shown to employees',
    ],
  },
  {
    key: 'incentive',
    name: 'Incentive Calculation',
    icon: TrendingUp,
    desc: 'Pulls revenue targets from the CRM, computes incentives, raises a manager approval, then issues a letter monthly.',
    trigger: 'On revenue close (CRM)',
    input: 'Revenue targets — CRM API',
    owner: 'Sales Ops',
    approval: 'Manager',
    output: 'Incentive letter',
    lastRun: 'May 31, 2026',
    nextRun: 'Jun 30, 2026',
    active: true,
    pipeline: [
      'Revenue close event received from CRM',
      'Pulled targets & attainment for 12 reps via CRM API',
      'Computed incentive = slab × attainment (₹3.2L total)',
      'Raised approval request to Sales Manager',
      'Approved by Sales Manager',
      'Generated 12 incentive letters',
      'Delivered to the sales team in-app',
    ],
  },
  {
    key: 'fnf',
    name: 'Full & Final Settlement',
    icon: FileSpreadsheet,
    desc: 'On exit clearance, computes the settlement from the F&F worksheet and issues the settlement letter.',
    trigger: 'On exit clearance',
    input: 'F&F worksheet',
    owner: 'HR Admin',
    approval: 'HR',
    output: 'Settlement letter',
    lastRun: 'May 22, 2026',
    nextRun: 'On exit clearance',
    active: false,
    pipeline: [
      'Exit clearance completed for an employee',
      'Pulled F&F worksheet (dues, recoveries, leave encashment)',
      'Net settlement computed',
      'Routed to HR for settlement sign-off',
      'Awaiting HR approval',
      'Settlement letter pending generation',
      'Pending delivery to employee',
    ],
  },
]

const ENGINE_BY_KEY = new Map(ENGINES.map((e) => [e.key, e]))
const engineName = (k: EngineKey) => ENGINE_BY_KEY.get(k)?.name ?? k

const APPROVAL_TONE: Record<ApprovalKind, 'warning' | 'info' | 'neutral'> = {
  Manager: 'warning',
  HR: 'info',
  None: 'neutral',
}

/* ----------------------------------------------------------------- pending approvals (deterministic) */
const APPROVALS_SEED: ApprovalRow[] = [
  {
    id: 'ap1', engine: 'incentive',
    title: 'Incentive payout', scope: 'Sales team',
    amount: '₹3.2L', people: 12, raisedBy: 'Incentive Calculation', sla: 'Due in 1 day',
  },
  {
    id: 'ap2', engine: 'fnf',
    title: 'Full & final settlement', scope: 'Joseph Thomas · exit',
    amount: '₹1.84L', people: 1, raisedBy: 'F&F Settlement', sla: 'Due in 2 days',
  },
  {
    id: 'ap3', engine: 'payslip',
    title: 'Payroll sign-off', scope: 'June cycle', amount: '₹1.42Cr',
    people: 268, raisedBy: 'Payslip Generation', sla: 'Due in 3 days',
  },
]

/* ----------------------------------------------------------------- connectors (external inputs) */
const CONNECTORS: Connector[] = [
  { key: 'crm', name: 'CRM Revenue API', icon: CircleDollarSign, detail: 'Targets & attainment for incentives', status: 'Connected', synced: '2h ago' },
  { key: 'payroll', name: 'Payroll', icon: Database, detail: 'Earnings, deductions & locks', status: 'Connected', synced: '1h ago' },
  { key: 'pfesic', name: 'PF / ESIC Portal', icon: Landmark, detail: 'Statutory challan submission', status: 'Error', synced: 'Auth expired' },
  { key: 'bank', name: 'Bank', icon: Building2, detail: 'Salary & settlement disbursal', status: 'Connected', synced: '30m ago' },
]

/* ----------------------------------------------------------------- run history (deterministic) */
const RUN_HISTORY: RunRow[] = [
  { id: 'r1', engine: 'accrual', period: 'Jun 2026', records: 268, status: 'Completed', when: 'Jun 1, 09:00' },
  { id: 'r2', engine: 'incentive', period: 'May 2026', records: 12, status: 'Awaiting approval', when: 'May 31, 18:30' },
  { id: 'r3', engine: 'payslip', period: 'May 2026', records: 268, status: 'Completed', when: 'May 25, 22:10' },
  { id: 'r4', engine: 'statutory', period: 'May 2026', records: 268, status: 'Failed', when: 'May 26, 06:05' },
  { id: 'r5', engine: 'fnf', period: 'May 2026', records: 3, status: 'Completed', when: 'May 22, 14:40' },
  { id: 'r6', engine: 'accrual', period: 'May 2026', records: 266, status: 'Completed', when: 'May 1, 09:00' },
  { id: 'r7', engine: 'incentive', period: 'Apr 2026', records: 11, status: 'Completed', when: 'Apr 30, 19:15' },
]

const RUN_STATUS_TONE: Record<RunStatus, 'success' | 'warning' | 'danger'> = {
  Completed: 'success',
  'Awaiting approval': 'warning',
  Failed: 'danger',
}

/* ----------------------------------------------------------------- runs trend (deterministic) */
const RUNS_TREND = [
  { month: 'Jan', value: 18 },
  { month: 'Feb', value: 21 },
  { month: 'Mar', value: 24 },
  { month: 'Apr', value: 22 },
  { month: 'May', value: 28 },
  { month: 'Jun', value: 9 },
]

const axisStyle = { fontSize: 11, fill: 'rgb(var(--muted-fg))' }
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}
const gridStroke = 'rgb(var(--border))'

/* ----------------------------------------------------------------- engine card */
function EngineCard({
  engine,
  active,
  onToggle,
  onRun,
}: {
  engine: Engine
  active: boolean
  onToggle: (v: boolean) => void
  onRun: () => void
}) {
  const Icon = engine.icon
  return (
    <Card className={cn('flex flex-col p-4 transition-colors', !active && 'opacity-80')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-fg">{engine.name}</h3>
            <Badge tone={active ? 'success' : 'neutral'} dot className="mt-1">
              {active ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </div>
        <Switch checked={active} onChange={onToggle} />
      </div>

      <p className="mt-3 text-xs text-muted-fg">{engine.desc}</p>

      {/* the shared automation model, surfaced compactly */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border pt-3">
        <Meta icon={<Zap className="h-3.5 w-3.5" />} label="Trigger" value={engine.trigger} />
        <Meta icon={<Plug className="h-3.5 w-3.5" />} label="Input" value={engine.input} />
        <Meta icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Owner" value={engine.owner} />
        <Meta
          icon={<Workflow className="h-3.5 w-3.5" />}
          label="Approval"
          value={<Badge tone={APPROVAL_TONE[engine.approval]}>{engine.approval}</Badge>}
        />
        <Meta icon={<FileSignature className="h-3.5 w-3.5" />} label="Output" value={engine.output} />
        <Meta icon={<RefreshCw className="h-3.5 w-3.5" />} label="Last run" value={engine.lastRun} />
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-fg">
          <Clock3 className="h-3.5 w-3.5" /> Next · <span className="tnum text-fg">{engine.nextRun}</span>
        </span>
        <Button size="sm" variant="subtle" onClick={onRun} disabled={!active}>
          <Play className="h-3.5 w-3.5" /> Run now
        </Button>
      </div>
    </Card>
  )
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-fg">
        <span className="text-muted-fg">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[13px] font-semibold text-fg">{value}</dd>
    </div>
  )
}

/* ----------------------------------------------------------------- page */
export default function AutoOps() {
  const { company } = useApp()
  const { push } = useToast()

  // engine enable/pause — local state, seeded deterministically
  const [enabled, setEnabled] = useState<Record<EngineKey, boolean>>(() =>
    ENGINES.reduce(
      (acc, e) => ({ ...acc, [e.key]: e.active }),
      {} as Record<EngineKey, boolean>,
    ),
  )
  const toggleEngine = (key: EngineKey, v: boolean) => {
    setEnabled((p) => ({ ...p, [key]: v }))
    push({
      title: `${engineName(key)} ${v ? 'enabled' : 'paused'}`,
      tone: v ? 'success' : 'neutral',
    })
  }

  // pending approvals — approving advances toward "Queued for letter + delivery"
  const [approvals, setApprovals] = useState<Record<string, ApprovalState>>(() =>
    APPROVALS_SEED.reduce(
      (acc, a) => ({ ...acc, [a.id]: 'pending' as ApprovalState }),
      {} as Record<string, ApprovalState>,
    ),
  )
  const decide = (row: ApprovalRow, state: ApprovalState) => {
    setApprovals((p) => ({ ...p, [row.id]: state }))
    if (state === 'approved') {
      push({ title: `Approved · ${row.title} · queued for letter + delivery`, tone: 'success' })
    } else {
      push({ title: `Rejected · ${row.title} returned to ${row.raisedBy}`, tone: 'danger' })
    }
  }
  const pendingCount = useMemo(
    () => APPROVALS_SEED.filter((a) => approvals[a.id] === 'pending').length,
    [approvals],
  )

  // run-now drawer
  const [drawerEngine, setDrawerEngine] = useState<Engine | null>(null)

  // new-engine modal (stub)
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTrigger, setNewTrigger] = useState('event')
  const createEngine = () => {
    push({
      title: `Engine “${newName.trim() || 'Untitled engine'}” drafted · paused until configured`,
      tone: 'success',
    })
    setNewOpen(false)
    setNewName('')
    setNewTrigger('event')
  }

  const activeCount = useMemo(
    () => ENGINES.filter((e) => enabled[e.key]).length,
    [enabled],
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Cpu className="h-5 w-5" />}
        title="Auto-Operations"
        subtitle="Automated engines — triggered, approved, delivered."
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New engine
          </Button>
        }
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Active engines"
          value={<span className="tnum">{activeCount}</span>}
          delta={`of ${ENGINES.length}`}
          deltaTone="neutral"
          icon={<Cpu className="h-4 w-4" />}
        />
        <StatCard
          label="Runs this month"
          value={<span className="tnum">128</span>}
          delta="+14%"
          deltaTone="success"
          icon={<Play className="h-4 w-4" />}
        />
        <StatCard
          label="Pending approvals"
          value={<span className="tnum text-warning">{pendingCount}</span>}
          icon={<Clock3 className="h-4 w-4 text-warning" />}
        />
        <StatCard
          label="Letters auto-sent"
          value={<span className="tnum text-success">541</span>}
          delta="this month"
          deltaTone="success"
          icon={<Send className="h-4 w-4 text-success" />}
        />
      </div>

      {/* Engines */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-fg">Engines</h2>
        <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
          {company.name}
        </span>
      </div>
      <div className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {ENGINES.map((e) => (
          <EngineCard
            key={e.key}
            engine={e}
            active={enabled[e.key]}
            onToggle={(v) => toggleEngine(e.key, v)}
            onRun={() => setDrawerEngine(e)}
          />
        ))}
      </div>

      {/* Pending approvals + Connectors */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
            <Badge tone={pendingCount ? 'warning' : 'success'} dot>
              {pendingCount ? `${pendingCount} waiting` : 'All clear'}
            </Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            {pendingCount === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="No approvals pending"
                description="Engine-raised requests will appear here for the right approver."
              />
            ) : (
              APPROVALS_SEED.map((row) => {
                const state = approvals[row.id]
                if (state !== 'pending') {
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
                        state === 'approved'
                          ? 'border-success/40 bg-success/5'
                          : 'border-danger/40 bg-danger/5',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-xl',
                            state === 'approved' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
                          )}
                        >
                          {state === 'approved'
                            ? <CheckCircle2 className="h-4 w-4" />
                            : <XCircle className="h-4 w-4" />}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-fg">{row.title} · {row.scope}</p>
                          <p className="text-2xs text-muted-fg">
                            {state === 'approved'
                              ? 'Queued for letter + delivery'
                              : `Returned to ${row.raisedBy}`}
                          </p>
                        </div>
                      </div>
                      <Badge tone={state === 'approved' ? 'success' : 'danger'}>
                        {state === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                  )
                }
                return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                        <Bell className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-fg">
                          {row.title} · {row.scope} · <span className="tnum">{row.amount}</span> · {row.people} {row.people === 1 ? 'employee' : 'employees'}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-2xs text-muted-fg">
                          <span className="inline-flex items-center gap-1">
                            <Cpu className="h-3 w-3" /> {row.raisedBy}
                          </span>
                          <span className="text-border">·</span>
                          <span className="inline-flex items-center gap-1 text-warning">
                            <Clock3 className="h-3 w-3" /> {row.sla}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => decide(row, 'rejected')}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => decide(row, 'approved')}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardBody>
        </Card>

        {/* Connectors / external inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Connectors</CardTitle>
            <Tooltip label="External inputs feed the engines">
              <Badge tone="neutral"><Plug className="h-3 w-3" /> Sources</Badge>
            </Tooltip>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {CONNECTORS.map((c) => {
              const Icon = c.icon
              const ok = c.status === 'Connected'
              return (
                <div
                  key={c.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        ok ? 'bg-muted text-fg' : 'bg-danger/15 text-danger',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-fg">{c.name}</p>
                      <p className="truncate text-2xs text-muted-fg">{c.detail}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <Badge tone={ok ? 'success' : 'danger'} dot>{c.status}</Badge>
                    <span className="text-2xs text-muted-fg tnum">{c.synced}</span>
                  </div>
                </div>
              )
            })}
            <p className="flex items-center gap-1.5 pt-1 text-2xs text-muted-fg">
              <AlertTriangle className="h-3.5 w-3.5 text-danger" />
              PF / ESIC portal token expired — statutory runs will queue until reconnected.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Run history */}
      <Card className="overflow-hidden p-0">
        <CardHeader>
          <CardTitle>Run history</CardTitle>
          <Badge tone="info"><RefreshCw className="h-3 w-3" /> Last 30 days</Badge>
        </CardHeader>
        <div className="grid gap-0 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Table>
              <thead>
                <Tr className="border-t-0 hover:bg-transparent">
                  <Th>Engine</Th>
                  <Th>Period</Th>
                  <Th className="text-right">Records</Th>
                  <Th>Status</Th>
                  <Th>When</Th>
                </Tr>
              </thead>
              <tbody>
                {RUN_HISTORY.map((r) => {
                  const Icon = ENGINE_BY_KEY.get(r.engine)?.icon ?? Cpu
                  return (
                    <Tr key={r.id}>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-semibold text-fg">{engineName(r.engine)}</span>
                        </span>
                      </Td>
                      <Td className="text-muted-fg">{r.period}</Td>
                      <Td className="text-right font-semibold text-fg tnum">{r.records}</Td>
                      <Td><Badge tone={RUN_STATUS_TONE[r.status]} dot>{r.status}</Badge></Td>
                      <Td className="text-muted-fg tnum">{r.when}</Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
          <div className="border-t border-border p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Runs · 6 months</span>
              <Badge tone="neutral">Trend</Badge>
            </div>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={RUNS_TREND} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="ao-runs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Runs"
                    stroke="rgb(var(--primary))"
                    strokeWidth={2}
                    fill="url(#ao-runs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      {/* Run-now pipeline drawer */}
      <Drawer
        open={!!drawerEngine}
        onClose={() => setDrawerEngine(null)}
        title={drawerEngine ? `Run · ${drawerEngine.name}` : 'Run engine'}
        width="max-w-lg"
      >
        {drawerEngine && (() => {
          const eng = drawerEngine
          const EngIcon = eng.icon
          // F&F is paused/awaiting; everyone else has run through delivery.
          const current = eng.key === 'fnf' ? 4 : PIPELINE_STEPS.length
          return (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface2/50 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <EngIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-fg">{eng.name}</p>
                  <p className="mt-0.5 text-xs text-muted-fg">{eng.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border p-3">
                <Meta icon={<Zap className="h-3.5 w-3.5" />} label="Trigger" value={eng.trigger} />
                <Meta icon={<Plug className="h-3.5 w-3.5" />} label="Input source" value={eng.input} />
                <Meta
                  icon={<Workflow className="h-3.5 w-3.5" />}
                  label="Approval"
                  value={<Badge tone={APPROVAL_TONE[eng.approval]}>{eng.approval}</Badge>}
                />
                <Meta icon={<FileSignature className="h-3.5 w-3.5" />} label="Output" value={eng.output} />
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <h4 className="text-[13px] font-bold tracking-tight text-fg">Pipeline</h4>
                </div>
                <Stepper steps={PIPELINE_STEPS} current={current} />
              </div>

              {/* per-step status lines */}
              <ol className="space-y-2.5">
                {PIPELINE_STEPS.map((label, i) => {
                  const state = i < current ? 'done' : i === current ? 'active' : 'todo'
                  return (
                    <li
                      key={label}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border px-3 py-2.5',
                        state === 'done' && 'border-success/30 bg-success/5',
                        state === 'active' && 'border-primary/40 bg-primary/5',
                        state === 'todo' && 'border-border bg-surface',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                          state === 'done' && 'bg-success text-white',
                          state === 'active' && 'bg-primary/15 text-primary ring-2 ring-primary',
                          state === 'todo' && 'bg-muted text-muted-fg',
                        )}
                      >
                        {state === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={cn(
                          'text-[13px] font-semibold',
                          state === 'todo' ? 'text-muted-fg' : 'text-fg',
                        )}>
                          {label}
                        </p>
                        <p className="mt-0.5 text-2xs text-muted-fg">{eng.pipeline[i]}</p>
                      </div>
                      {state === 'active' && (
                        <ChevronRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-primary" />
                      )}
                    </li>
                  )
                })}
              </ol>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setDrawerEngine(null)}>Close</Button>
                <Button
                  onClick={() => {
                    push({
                      title:
                        eng.key === 'fnf'
                          ? `${eng.name} run started · awaiting HR approval`
                          : `${eng.name} run completed · ${eng.output} delivered`,
                      tone: eng.key === 'fnf' ? 'warning' : 'success',
                    })
                    setDrawerEngine(null)
                  }}
                >
                  <Play className="h-4 w-4" /> Run now
                </Button>
              </div>
            </div>
          )
        })()}
      </Drawer>

      {/* New-engine modal (stub) */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New engine"
        description="Define a trigger, inputs and approval routing. The engine starts paused until configured."
        footer={
          <>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={createEngine}>
              <Plus className="h-4 w-4" /> Create engine
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Engine name" required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bonus Disbursal"
            />
          </Field>
          <Field label="Trigger type">
            <Select value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)}>
              <option value="event">Event (e.g. payroll lock)</option>
              <option value="schedule">Schedule (e.g. monthly · 25th)</option>
              <option value="external">External input (e.g. CRM API)</option>
            </Select>
          </Field>
          <div className="flex items-start gap-2 rounded-xl border border-accent2/30 bg-accent2/10 p-3">
            <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-accent2" />
            <p className="text-xs text-accent2">
              Engines follow the same model: Trigger → Conditions → Action → Approval routing → Output → Delivery.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-fg">
            <Inbox className="h-3.5 w-3.5" />
            <span>Inputs &amp; approval steps are configured after the engine is created.</span>
          </div>
        </div>
      </Modal>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-fg">
        <FileCheck2 className="h-3.5 w-3.5 text-success" />
        Every engine run, approval decision and delivered letter is recorded in the audit trail.
      </p>
    </div>
  )
}
