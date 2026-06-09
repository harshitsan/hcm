import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Workflow, Plus, X, ChevronUp, ChevronDown, Play, CheckCircle2, Check, Bell, Clock,
  AlertTriangle, ArrowDownToLine, Lock, Sparkles, Loader2, Save, Zap, Pencil,
  ShieldCheck, Mail, MonitorSmartphone, ListChecks,
} from 'lucide-react'
import { useApp } from '../app/store'
import { workflowTemplates, approverRoles } from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Input, PageHeader,
  Segmented, Select, StatCard, Stepper, Switch, Tabs, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Mode = 'sequential' | 'parallel'
type SlaUnit = 'hours' | 'days'
type Escalation = 'next' | 'auto' | 'notify'
type Step = {
  id: number
  role: string
  mode: Mode
  sla: number
  slaUnit: SlaUnit
  escalation: Escalation
}

type Trigger =
  | 'Leave requested'
  | 'Probation due'
  | 'Offer accepted'
  | 'Exit initiated'
  | 'Expense submitted'
  | 'Monthly schedule'

type NotifyEvent = 'assign' | 'approve' | 'reject' | 'escalate'
type Channel = 'Email' | 'In-app'
type NotifyConfig = { on: boolean; channel: Channel; template: string }
type Notifications = Record<NotifyEvent, NotifyConfig>

const SEED: Step[] = [
  { id: 1, role: 'Manager', mode: 'sequential', sla: 24, slaUnit: 'hours', escalation: 'next' },
  { id: 2, role: 'Dept Head', mode: 'sequential', sla: 24, slaUnit: 'hours', escalation: 'next' },
  { id: 3, role: 'HR Admin', mode: 'sequential', sla: 48, slaUnit: 'hours', escalation: 'notify' },
]

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'sequential', label: 'Sequential' },
  { value: 'parallel', label: 'Parallel' },
]

const slaUnitOptions: { value: SlaUnit; label: string }[] = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

const escalationOptions: { value: Escalation; label: string }[] = [
  { value: 'next', label: 'Escalate to next approver' },
  { value: 'auto', label: 'Auto-approve' },
  { value: 'notify', label: 'Notify HR' },
]

const escalationLabel = (e: Escalation) => escalationOptions.find((o) => o.value === e)!.label

const triggerOptions: Trigger[] = [
  'Leave requested',
  'Probation due',
  'Offer accepted',
  'Exit initiated',
  'Expense submitted',
  'Monthly schedule',
]

const templatePresets: Record<string, string[]> = {
  'Standard Leave': ['Manager', 'HR Admin'],
  Onboarding: ['HR Admin', 'Manager', 'Dept Head'],
  'Exit Clearance': ['Manager', 'Finance', 'HR Admin', 'CEO'],
  'Expense Approval': ['Manager', 'Finance'],
  Blank: ['Manager'],
}

// Map a template name to its default trigger (deterministic).
const templateTrigger: Record<string, Trigger> = {
  'Standard Leave': 'Leave requested',
  Onboarding: 'Offer accepted',
  'Exit Clearance': 'Exit initiated',
  'Expense Approval': 'Expense submitted',
  Blank: 'Leave requested',
}

const notifyEventMeta: { key: NotifyEvent; label: string; hint: string; icon: ReactNode }[] = [
  { key: 'assign', label: 'On assign', hint: 'Approver receives the request', icon: <Bell className="h-4 w-4 text-info" /> },
  { key: 'approve', label: 'On approve', hint: 'Requester notified of approval', icon: <CheckCircle2 className="h-4 w-4 text-success" /> },
  { key: 'reject', label: 'On reject', hint: 'Requester notified of rejection', icon: <X className="h-4 w-4 text-danger" /> },
  { key: 'escalate', label: 'On escalate', hint: 'HR alerted when SLA breaches', icon: <AlertTriangle className="h-4 w-4 text-warning" /> },
]

const DEFAULT_NOTIFICATIONS: Notifications = {
  assign: { on: true, channel: 'Email', template: 'approval_assigned' },
  approve: { on: true, channel: 'In-app', template: 'request_approved' },
  reject: { on: true, channel: 'Email', template: 'request_rejected' },
  escalate: { on: true, channel: 'Email', template: 'sla_escalation' },
}

// Convert a step's SLA into hours for summing.
const slaHours = (s: Step) => (s.slaUnit === 'days' ? s.sla * 24 : s.sla)

// Render an SLA summary string for a set of steps.
function slaSummary(steps: Step[]): string {
  const total = steps.reduce((acc, s) => acc + slaHours(s), 0)
  return total >= 48 && total % 24 === 0 ? `${total / 24}d total` : `${total}h total`
}

const countNotifications = (n: Notifications) =>
  notifyEventMeta.filter((e) => n[e.key].on).length

type RuleStatus = 'Active' | 'Draft'
type SavedRule = {
  id: string
  name: string
  trigger: Trigger
  template: string
  status: RuleStatus
  steps: Step[]
  notifications: Notifications
}

// Deterministic saved-rule library (no runtime randomness / wall-clock).
const SAVED_RULES: SavedRule[] = [
  {
    id: 'wf-leave',
    name: 'Leave Approval',
    trigger: 'Leave requested',
    template: 'Standard Leave',
    status: 'Active',
    steps: [
      { id: 11, role: 'Manager', mode: 'sequential', sla: 24, slaUnit: 'hours', escalation: 'next' },
      { id: 12, role: 'HR Admin', mode: 'sequential', sla: 24, slaUnit: 'hours', escalation: 'notify' },
    ],
    notifications: DEFAULT_NOTIFICATIONS,
  },
  {
    id: 'wf-onboarding',
    name: 'Onboarding',
    trigger: 'Offer accepted',
    template: 'Onboarding',
    status: 'Active',
    steps: [
      { id: 21, role: 'HR Admin', mode: 'sequential', sla: 1, slaUnit: 'days', escalation: 'notify' },
      { id: 22, role: 'Manager', mode: 'parallel', sla: 2, slaUnit: 'days', escalation: 'next' },
      { id: 23, role: 'Dept Head', mode: 'parallel', sla: 2, slaUnit: 'days', escalation: 'next' },
    ],
    notifications: DEFAULT_NOTIFICATIONS,
  },
  {
    id: 'wf-exit',
    name: 'Exit Clearance',
    trigger: 'Exit initiated',
    template: 'Exit Clearance',
    status: 'Active',
    steps: [
      { id: 31, role: 'Manager', mode: 'sequential', sla: 1, slaUnit: 'days', escalation: 'next' },
      { id: 32, role: 'Finance', mode: 'sequential', sla: 2, slaUnit: 'days', escalation: 'next' },
      { id: 33, role: 'HR Admin', mode: 'sequential', sla: 1, slaUnit: 'days', escalation: 'notify' },
      { id: 34, role: 'CEO', mode: 'sequential', sla: 2, slaUnit: 'days', escalation: 'auto' },
    ],
    notifications: DEFAULT_NOTIFICATIONS,
  },
  {
    id: 'wf-expense',
    name: 'Expense Approval',
    trigger: 'Expense submitted',
    template: 'Expense Approval',
    status: 'Active',
    steps: [
      { id: 41, role: 'Manager', mode: 'sequential', sla: 24, slaUnit: 'hours', escalation: 'next' },
      { id: 42, role: 'Finance', mode: 'sequential', sla: 48, slaUnit: 'hours', escalation: 'notify' },
    ],
    notifications: { ...DEFAULT_NOTIFICATIONS, escalate: { on: false, channel: 'Email', template: 'sla_escalation' } },
  },
  {
    id: 'wf-probation',
    name: 'Probation Confirmation',
    trigger: 'Probation due',
    template: 'Blank',
    status: 'Draft',
    steps: [
      { id: 51, role: 'Manager', mode: 'sequential', sla: 3, slaUnit: 'days', escalation: 'next' },
      { id: 52, role: 'HR Admin', mode: 'sequential', sla: 2, slaUnit: 'days', escalation: 'notify' },
    ],
    notifications: { ...DEFAULT_NOTIFICATIONS, reject: { on: false, channel: 'Email', template: 'request_rejected' } },
  },
]

const triggerTone: Record<Trigger, 'primary' | 'info' | 'accent' | 'accent2' | 'warning'> = {
  'Leave requested': 'primary',
  'Probation due': 'warning',
  'Offer accepted': 'info',
  'Exit initiated': 'accent2',
  'Expense submitted': 'accent',
  'Monthly schedule': 'info',
}

function prefersReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function WorkflowBuilder() {
  const { departments } = useCompanyData()
  const { role, company } = useApp()
  const { push } = useToast()
  const readOnly = role === 'employee' || role === 'people_manager'

  const [tab, setTab] = useState<'rules' | 'builder'>('rules')

  const [ruleName, setRuleName] = useState(SAVED_RULES[0].name)
  const [template, setTemplate] = useState(SAVED_RULES[0].template)
  const [trigger, setTrigger] = useState<Trigger>(SAVED_RULES[0].trigger)
  const [scopeDept, setScopeDept] = useState('all')
  const [scopeLoc, setScopeLoc] = useState('all')
  const [group, setGroup] = useState('all')

  const [steps, setSteps] = useState<Step[]>(SEED)
  const nextId = useRef(100)

  const [notifications, setNotifications] = useState<Notifications>(DEFAULT_NOTIFICATIONS)

  const [remind50, setRemind50] = useState(true)
  const [remind75, setRemind75] = useState(true)
  const [escalateReminder, setEscalateReminder] = useState(true)

  // run-preview: activeIndex -1 idle, 0..n-1 stepping, >=n approved
  const [activeIndex, setActiveIndex] = useState(-1)
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const setStep = (id: number, patch: Partial<Step>) =>
    setSteps((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const setNotify = (key: NotifyEvent, patch: Partial<NotifyConfig>) =>
    setNotifications((p) => ({ ...p, [key]: { ...p[key], ...patch } }))

  const addStep = () =>
    setSteps((p) => [
      ...p,
      { id: nextId.current++, role: 'HR Admin', mode: 'sequential', sla: 24, slaUnit: 'hours', escalation: 'next' },
    ])

  const removeStep = (id: number) =>
    setSteps((p) => (p.length <= 1 ? p : p.filter((s) => s.id !== id)))

  const move = (idx: number, dir: -1 | 1) => {
    setSteps((p) => {
      const t = idx + dir
      if (t < 0 || t >= p.length) return p
      const copy = [...p]
      ;[copy[idx], copy[t]] = [copy[t], copy[idx]]
      return copy
    })
  }

  const applyTemplate = (t: string) => {
    setTemplate(t)
    setTrigger(templateTrigger[t] ?? 'Leave requested')
    const roles = templatePresets[t] ?? ['Manager']
    setSteps(
      roles.map((r) => ({
        id: nextId.current++,
        role: r,
        mode: 'sequential' as Mode,
        sla: 24,
        slaUnit: 'hours' as SlaUnit,
        escalation: 'next' as Escalation,
      })),
    )
    setActiveIndex(-1)
  }

  // Load a saved rule into the builder and switch tabs.
  const editRule = (r: SavedRule) => {
    setRuleName(r.name)
    setTemplate(r.template)
    setTrigger(r.trigger)
    setSteps(r.steps.map((s) => ({ ...s, id: nextId.current++ })))
    setNotifications(r.notifications)
    setActiveIndex(-1)
    setTab('builder')
    push({ title: `Editing “${r.name}”`, tone: 'info' })
  }

  const runPreview = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    if (prefersReduced()) {
      setActiveIndex(steps.length)
      setRunning(false)
      push({ title: 'Preview routed — Approved', tone: 'success' })
      return
    }
    setRunning(true)
    setActiveIndex(0)
    steps.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setActiveIndex(i + 1), 700 * (i + 1)))
    })
    timers.current.push(
      window.setTimeout(() => {
        setRunning(false)
        push({ title: 'Preview routed — Approved', tone: 'success' })
      }, 700 * (steps.length + 1)),
    )
  }

  const save = () => {
    if (readOnly) return
    push({ title: `“${ruleName}” saved for ${company.name}`, tone: 'success' })
  }

  const activate = () => {
    if (readOnly) return
    push({ title: `“${ruleName}” workflow activated for ${company.name}`, tone: 'success' })
  }

  const approved = activeIndex !== -1 && activeIndex >= steps.length
  const locations = ['Mumbai HQ', 'Pune Office', 'Delhi Office', 'Chennai Hub', 'Remote']

  // KPI roll-ups (deterministic from SAVED_RULES).
  const activeRules = SAVED_RULES.filter((r) => r.status === 'Active').length
  const avgSlaHours = Math.round(
    SAVED_RULES.reduce((acc, r) => acc + r.steps.reduce((a, s) => a + slaHours(s), 0) / r.steps.length, 0) /
      SAVED_RULES.length,
  )
  const escalationsThisMonth = 14
  const notificationsConfigured = SAVED_RULES.reduce((acc, r) => acc + countNotifications(r.notifications), 0)

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Workflow className="h-5 w-5" />}
        title="Workflows & Automation"
        subtitle="Configuration, not customization — design triggers, approvals & notifications."
        actions={
          readOnly ? (
            <Badge tone="neutral"><Lock className="h-3 w-3" /> Read-only</Badge>
          ) : tab === 'builder' ? (
            <Button onClick={save}>
              <Save className="h-4 w-4" /> Save workflow
            </Button>
          ) : undefined
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={(v) => setTab(v as 'rules' | 'builder')}
        tabs={[
          { value: 'rules', label: 'Rules' },
          { value: 'builder', label: 'Builder' },
        ]}
      />

      {tab === 'rules' ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Active rules" value={activeRules} delta={`of ${SAVED_RULES.length}`} deltaTone="success" icon={<Zap className="h-4 w-4" />} />
            <StatCard label="Avg SLA" value={`${avgSlaHours}h`} delta="per step" deltaTone="info" icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Escalations" value={escalationsThisMonth} delta="this month" deltaTone="warning" icon={<AlertTriangle className="h-4 w-4" />} />
            <StatCard label="Notifications" value={notificationsConfigured} delta="configured" deltaTone="primary" icon={<Bell className="h-4 w-4" />} />
          </div>

          <Card className="overflow-hidden p-0">
            <CardHeader>
              <CardTitle>Automation workflows</CardTitle>
              <Badge tone="primary"><ListChecks className="h-3 w-3" /> {SAVED_RULES.length} rules</Badge>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {SAVED_RULES.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Workflow className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold">{r.name}</p>
                          <Badge tone={r.status === 'Active' ? 'success' : 'neutral'} dot>{r.status}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-fg">
                          <span className="inline-flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <Badge tone={triggerTone[r.trigger]}>{r.trigger}</Badge>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ListChecks className="h-3 w-3" /> {r.steps.length} {r.steps.length === 1 ? 'step' : 'steps'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {slaSummary(r.steps)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Bell className="h-3 w-3" /> {countNotifications(r.notifications)} alerts
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:pl-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editRule(r)}
                        disabled={readOnly}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Stepper steps={['Trigger', 'Template', 'Steps', 'Notify', 'Activate']} current={2} />
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={runPreview} disabled={running}>
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Run preview
                </Button>
                <Button variant="subtle" onClick={activate}>
                  <CheckCircle2 className="h-4 w-4" /> Activate
                </Button>
              </div>
            )}
          </div>

          {/* Trigger + Template + Applies to */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Trigger & scope</CardTitle>
              <Badge tone="primary"><Sparkles className="h-3 w-3" /> {steps.length} steps</Badge>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Workflow name">
                  <Input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    disabled={readOnly}
                    placeholder="e.g. Leave Approval"
                  />
                </Field>
                <Field label="Trigger" hint="What starts this workflow">
                  <Select value={trigger} onChange={(e) => setTrigger(e.target.value as Trigger)} disabled={readOnly}>
                    {triggerOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-fg">Start from a template</span>
                <div className="flex flex-wrap gap-2">
                  {workflowTemplates.map((t) => (
                    <button
                      key={t}
                      disabled={readOnly}
                      onClick={() => applyTemplate(t)}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                        readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                        template === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-muted-fg hover:bg-muted hover:text-fg',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Company">
                  <Select value={company.id} disabled>
                    <option value={company.id}>{company.name}</option>
                  </Select>
                </Field>
                <Field label="Department">
                  <Select value={scopeDept} onChange={(e) => setScopeDept(e.target.value)} disabled={readOnly}>
                    <option value="all">All departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Location">
                  <Select value={scopeLoc} onChange={(e) => setScopeLoc(e.target.value)} disabled={readOnly}>
                    <option value="all">All locations</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Employee group">
                  <Select value={group} onChange={(e) => setGroup(e.target.value)} disabled={readOnly}>
                    <option value="all">All employees</option>
                    <option value="ft">Full-time only</option>
                    <option value="contract">Contractors only</option>
                    <option value="probation">On probation</option>
                  </Select>
                </Field>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Builder chain */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Approval steps</CardTitle>
                <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
                  Routes top → bottom
                </span>
              </CardHeader>
              <CardBody>
                {/* Trigger node */}
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface2/50 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Zap className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{trigger}</p>
                    <p className="text-2xs text-muted-fg">Trigger — a request enters the chain</p>
                  </div>
                </div>

                {steps.map((s, i) => {
                  const stepActive = running && activeIndex === i
                  const stepDone = activeIndex > i
                  return (
                    <div key={s.id}>
                      <div className="flex justify-center py-1.5">
                        <span className={cn('h-5 w-px', stepDone ? 'bg-success' : 'bg-border')} />
                      </div>
                      <div
                        className={cn(
                          'rounded-xl border bg-surface px-4 py-3 transition-all',
                          stepActive
                            ? 'border-primary ring-2 ring-primary/30 shadow-card'
                            : stepDone
                              ? 'border-success/40 bg-success/5'
                              : 'border-border',
                        )}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <span
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tnum transition-colors',
                              stepDone
                                ? 'bg-success text-white'
                                : stepActive
                                  ? 'bg-primary text-primary-fg'
                                  : 'bg-muted text-muted-fg',
                            )}
                          >
                            {stepDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            {readOnly ? (
                              <p className="text-sm font-semibold">{s.role}</p>
                            ) : (
                              <Select value={s.role} onChange={(e) => setStep(s.id, { role: e.target.value })}>
                                {approverRoles.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </Select>
                            )}
                          </div>
                          {readOnly ? (
                            <Badge tone="neutral">{s.mode}</Badge>
                          ) : (
                            <Segmented
                              options={modeOptions}
                              value={s.mode}
                              onChange={(v) => setStep(s.id, { mode: v })}
                            />
                          )}
                          {!readOnly && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon" variant="ghost" aria-label="Move up"
                                disabled={i === 0} onClick={() => move(i, -1)}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon" variant="ghost" aria-label="Move down"
                                disabled={i === steps.length - 1} onClick={() => move(i, 1)}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon" variant="ghost" aria-label="Remove step"
                                disabled={steps.length <= 1} onClick={() => removeStep(s.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Per-step SLA + escalation */}
                        <div className="mt-3 grid gap-3 border-t border-border/70 pt-3 sm:grid-cols-2 sm:pl-10">
                          {readOnly ? (
                            <>
                              <div className="flex items-center gap-2 text-2xs text-muted-fg">
                                <Clock className="h-3.5 w-3.5 text-info" />
                                <span className="font-semibold text-fg">{s.sla} {s.slaUnit}</span> SLA
                              </div>
                              <div className="flex items-center gap-2 text-2xs text-muted-fg">
                                <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                                {escalationLabel(s.escalation)}
                              </div>
                            </>
                          ) : (
                            <>
                              <Field label="SLA" hint="Time-to-action before escalation">
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min={1}
                                    value={s.sla}
                                    onChange={(e) => setStep(s.id, { sla: Math.max(1, Number(e.target.value) || 1) })}
                                    className="w-20"
                                  />
                                  <Segmented
                                    options={slaUnitOptions}
                                    value={s.slaUnit}
                                    onChange={(v) => setStep(s.id, { slaUnit: v })}
                                  />
                                </div>
                              </Field>
                              <Field label="On SLA breach" hint="Escalation target">
                                <Select
                                  value={s.escalation}
                                  onChange={(e) => setStep(s.id, { escalation: e.target.value as Escalation })}
                                >
                                  {escalationOptions.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </Select>
                              </Field>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Final node */}
                <div className="flex justify-center py-1.5">
                  <span className={cn('h-5 w-px', approved ? 'bg-success' : 'bg-border')} />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all',
                    approved ? 'border-success bg-success/10' : 'border-dashed border-border bg-surface2/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                      approved ? 'bg-success text-white' : 'bg-muted text-muted-fg',
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <p className={cn('text-sm font-semibold', approved ? 'text-success' : 'text-muted-fg')}>
                    {approved ? 'Approved' : 'Final approval'}
                  </p>
                </div>

                {!readOnly && (
                  <Button variant="outline" className="mt-4 w-full" onClick={addStep}>
                    <Plus className="h-4 w-4" /> Add step
                  </Button>
                )}
              </CardBody>
            </Card>

            {/* SLA reminders + Notifications + preview side panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SLA reminders</CardTitle>
                  <Badge tone="info"><Clock className="h-3 w-3" /> {slaSummary(steps)}</Badge>
                </CardHeader>
                <CardBody className="space-y-4">
                  <SlaRow
                    icon={<Bell className="h-4 w-4 text-info" />}
                    label="Remind approver" hint="At 50% of SLA window"
                    checked={remind50} onChange={setRemind50} disabled={readOnly}
                  />
                  <SlaRow
                    icon={<Bell className="h-4 w-4 text-warning" />}
                    label="Second reminder" hint="At 75% of SLA window"
                    checked={remind75} onChange={setRemind75} disabled={readOnly}
                  />
                  <SlaRow
                    icon={<AlertTriangle className="h-4 w-4 text-danger" />}
                    label="Escalate" hint="At 100% — per-step escalation target"
                    checked={escalateReminder} onChange={setEscalateReminder} disabled={readOnly}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <Badge tone="primary"><Bell className="h-3 w-3" /> {countNotifications(notifications)} on</Badge>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-2xs text-muted-fg">
                    Templates & triggers — pick a channel and template per event.
                  </p>
                  {notifyEventMeta.map((e) => {
                    const cfg = notifications[e.key]
                    return (
                      <div
                        key={e.key}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 transition-colors',
                          cfg.on ? 'border-border bg-surface' : 'border-dashed border-border bg-surface2/50',
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <span className="mt-0.5">{e.icon}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{e.label}</p>
                              <p className="text-2xs text-muted-fg">{e.hint}</p>
                            </div>
                          </div>
                          {readOnly ? (
                            <Badge tone={cfg.on ? 'success' : 'neutral'}>{cfg.on ? 'On' : 'Off'}</Badge>
                          ) : (
                            <Switch checked={cfg.on} onChange={(v) => setNotify(e.key, { on: v })} />
                          )}
                        </div>
                        {cfg.on && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {readOnly ? (
                              <>
                                <Badge tone="info">
                                  {cfg.channel === 'Email' ? <Mail className="h-3 w-3" /> : <MonitorSmartphone className="h-3 w-3" />}
                                  {cfg.channel}
                                </Badge>
                                <Badge tone="neutral">{cfg.template}</Badge>
                              </>
                            ) : (
                              <>
                                <Select
                                  value={cfg.channel}
                                  onChange={(ev) => setNotify(e.key, { channel: ev.target.value as Channel })}
                                >
                                  <option value="Email">Email</option>
                                  <option value="In-app">In-app</option>
                                </Select>
                                <Input
                                  value={cfg.template}
                                  onChange={(ev) => setNotify(e.key, { template: ev.target.value })}
                                  placeholder="template_name"
                                  aria-label={`${e.label} template`}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Run preview</CardTitle>
                  {approved && <Badge tone="success" dot>Approved</Badge>}
                </CardHeader>
                <CardBody className="space-y-3">
                  <p className="text-sm text-muted-fg">
                    Simulate a sample request flowing through all {steps.length} steps.
                  </p>
                  <Button variant="subtle" className="w-full" onClick={runPreview} disabled={running}>
                    {running ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Routing…</>
                    ) : (
                      <><Play className="h-4 w-4" /> Run sample request</>
                    )}
                  </Button>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-2xs text-muted-fg">
                    <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" />
                    {approved
                      ? 'Routed cleanly through every approver.'
                      : running
                        ? `Now at step ${Math.min(activeIndex + 1, steps.length)} of ${steps.length}.`
                        : 'Respects reduced-motion — jumps to result if set.'}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SlaRow({
  icon, label, hint, checked, onChange, disabled,
}: {
  icon: ReactNode
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-2xs text-muted-fg">{hint}</p>
        </div>
      </div>
      {disabled ? (
        <Badge tone={checked ? 'success' : 'neutral'}>{checked ? 'On' : 'Off'}</Badge>
      ) : (
        <Switch checked={checked} onChange={onChange} />
      )}
    </div>
  )
}
