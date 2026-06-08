import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Workflow, Plus, X, ChevronUp, ChevronDown, Play, CheckCircle2, Bell, Clock,
  AlertTriangle, ArrowDownToLine, Lock, Sparkles, User, Loader2,
} from 'lucide-react'
import { useApp } from '../app/store'
import { workflowTemplates, approverRoles, departments } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, PageHeader,
  Segmented, Select, Stepper, Switch, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Mode = 'sequential' | 'parallel'
type Step = { id: number; role: string; mode: Mode }

const SEED: Step[] = [
  { id: 1, role: 'Manager', mode: 'sequential' },
  { id: 2, role: 'Dept Head', mode: 'sequential' },
  { id: 3, role: 'HR Admin', mode: 'sequential' },
]

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'sequential', label: 'Sequential' },
  { value: 'parallel', label: 'Parallel' },
]

const templatePresets: Record<string, string[]> = {
  'Standard Leave': ['Manager', 'HR Admin'],
  Onboarding: ['HR Admin', 'Manager', 'Dept Head'],
  'Exit Clearance': ['Manager', 'Finance', 'HR Admin', 'CEO'],
  'Expense Approval': ['Manager', 'Finance'],
  Blank: ['Manager'],
}

function prefersReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function WorkflowBuilder() {
  const { role, company } = useApp()
  const { push } = useToast()
  const readOnly = role === 'employee' || role === 'people_manager'

  const [template, setTemplate] = useState(workflowTemplates[0])
  const [scopeDept, setScopeDept] = useState('all')
  const [scopeLoc, setScopeLoc] = useState('all')
  const [group, setGroup] = useState('all')

  const [steps, setSteps] = useState<Step[]>(SEED)
  const nextId = useRef(SEED.length + 1)

  const [remind50, setRemind50] = useState(true)
  const [remind75, setRemind75] = useState(true)
  const [escalate, setEscalate] = useState(true)

  // run-preview: activeIndex -1 idle, 0..n-1 stepping, >=n approved
  const [activeIndex, setActiveIndex] = useState(-1)
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const setStep = (id: number, patch: Partial<Step>) =>
    setSteps((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const addStep = () =>
    setSteps((p) => [...p, { id: nextId.current++, role: 'HR Admin', mode: 'sequential' }])

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
    const roles = templatePresets[t] ?? ['Manager']
    setSteps(roles.map((r) => ({ id: nextId.current++, role: r, mode: 'sequential' })))
    setActiveIndex(-1)
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

  const activate = () => {
    if (readOnly) return
    push({ title: `“${template}” workflow activated for ${company.name}`, tone: 'success' })
  }

  const approved = activeIndex !== -1 && activeIndex >= steps.length
  const locations = ['Mumbai HQ', 'Pune Office', 'Delhi Office', 'Chennai Hub', 'Remote']

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<Workflow className="h-5 w-5" />}
        title="Workflow Builder"
        subtitle="Configuration, not customization — design approval routing in minutes."
        actions={
          readOnly ? (
            <Badge tone="neutral"><Lock className="h-3 w-3" /> Read-only</Badge>
          ) : (
            <>
              <Button variant="outline" onClick={runPreview} disabled={running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run preview
              </Button>
              <Button onClick={activate}>
                <CheckCircle2 className="h-4 w-4" /> Activate workflow
              </Button>
            </>
          )
        }
      />

      <div className="mb-6">
        <Stepper steps={['Template', 'Applies to', 'Steps', 'Preview', 'Activate']} current={2} />
      </div>

      {/* Template + Applies to */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Start from a template</CardTitle>
          <Badge tone="primary"><Sparkles className="h-3 w-3" /> {steps.length} steps</Badge>
        </CardHeader>
        <CardBody className="space-y-5">
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
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-fg">
                <User className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Request submitted</p>
                <p className="text-2xs text-muted-fg">A sample request enters the chain</p>
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
                      'flex flex-col gap-3 rounded-xl border bg-surface px-4 py-3 transition-all sm:flex-row sm:items-center',
                      stepActive
                        ? 'border-primary ring-2 ring-primary/30 shadow-card'
                        : stepDone
                          ? 'border-success/40 bg-success/5'
                          : 'border-border',
                    )}
                  >
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
                      {stepDone ? '✓' : i + 1}
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
                {approved ? 'Approved ✓' : 'Final approval'}
              </p>
            </div>

            {!readOnly && (
              <Button variant="outline" className="mt-4 w-full" onClick={addStep}>
                <Plus className="h-4 w-4" /> Add step
              </Button>
            )}
          </CardBody>
        </Card>

        {/* SLA + preview side panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SLA & reminders</CardTitle>
              <Badge tone="info"><Clock className="h-3 w-3" /> 48h target</Badge>
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
                label="Escalate" hint="At 100% — route to next level"
                checked={escalate} onChange={setEscalate} disabled={readOnly}
              />
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
