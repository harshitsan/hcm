/**
 * Approval flows (BRD §6.25, jargon-free) — who says yes, in what order, and
 * what happens when they're quiet. Steps can hold several roles deciding side
 * by side ("any one" / "all of them"), every step carries a deadline, and a
 * quiet step can move on to someone else. Mounted inside Rules.tsx — the hero
 * lives there.
 */
import { Fragment, useState } from 'react'
import { ArrowRight, History, Lock, Plus, Sparkles, X } from 'lucide-react'
import { Btn, Card, Drawer, Field, Input, Pill, Segmented, Select, Timeline, Toggle, statusTone } from '../ui'
import { useApp } from '../store'
import { FLOW_ROLE_OPTIONS, type Flow, type FlowStep, type RuleLevel } from '../data'

const DEADLINES = ['within 1 day', 'within 2 days', 'within 3 days', 'within 5 days'] as const
const MODE_CHOICES = ['any one', 'all of them'] as const

/** a step being built in the composer — escalateTo '' means "no one" */
type DraftStep = { roles: string[]; mode: 'one' | 'all'; sla: string; escalateTo: string }

function SectionLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{children}</div>
      {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

/** where the flow is set — who controls it */
function FlowLevelPill({ level }: { level: RuleLevel }) {
  if (level === 'Platform') return <Pill tone="ink">Platform-wide</Pill>
  if (level === 'Portfolio') return <Pill tone="amber">Your portfolio</Pill>
  return <Pill tone="outline">This company</Pill>
}

function NodeChip({ children, done }: { children: string; done?: boolean }) {
  return (
    <span
      className={
        done
          ? 'whitespace-nowrap rounded-full bg-green-soft px-2.5 py-1 text-[11.5px] font-bold leading-none text-green'
          : 'whitespace-nowrap rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold leading-none'
      }
    >
      {children}
    </span>
  )
}

/** the pipeline — request in, step groups (parallel roles stack), done */
function Pipeline({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NodeChip>Request comes in</NodeChip>
      {steps.map((s) => (
        <Fragment key={s.id}>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
          <div className="flex flex-col items-center gap-1">
            {s.roles.length > 1 ? (
              <div className="rounded-2xl border border-line p-2">
                <div className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {s.mode === 'all' ? 'all of them' : 'any one of them'}
                </div>
                <div className="flex flex-col items-stretch gap-1">
                  {s.roles.map((r) => (
                    <span key={r} className="rounded-full bg-card2 px-2.5 py-1 text-center text-[11.5px] font-bold leading-none">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <NodeChip>{s.roles[0] ?? '—'}</NodeChip>
            )}
            <div className="text-center text-[11px] leading-snug text-muted">
              <div>⏱ {s.sla}</div>
              {s.escalateTo && <div>quiet? → {s.escalateTo}</div>}
            </div>
          </div>
        </Fragment>
      ))}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
      <NodeChip done>Done ✓</NodeChip>
    </div>
  )
}

/** the worked example under the live preview */
function workedSentence(routes: string, steps: DraftStep[]): string {
  const what = routes.trim() || 'A request'
  const parts = steps
    .filter((s) => s.roles.length > 0)
    .map((s) => {
      const who = s.roles.join(' and ')
      const bits: string[] = []
      if (s.roles.length > 1) bits.push(s.mode === 'all' ? (s.roles.length === 2 ? 'both' : 'all of them') : 'any one')
      bits.push(s.sla)
      const quiet = s.escalateTo ? `; quiet → ${s.escalateTo}` : ''
      return `${who} (${bits.join(', ')}${quiet})`
    })
  return `${what} → ${parts.length > 0 ? parts.join(' → ') + ' → ' : ''}Done.`
}

export default function FlowsView() {
  const { flows, updateFlow, addFlow, persona, company, toast } = useApp()

  /* who may touch what — same posture as rules: things set above you run
     here automatically, read-only by design */
  const canEdit = (f: Flow): boolean =>
    persona.id === 'operator' ? true : persona.id === 'portfolio' ? f.level !== 'Platform' : f.level === 'Company'

  /* ── history drawer ── */
  const [historyId, setHistoryId] = useState<string | null>(null)
  const historyFlow = flows.find((f) => f.id === historyId) ?? null

  /* ── composer state ── */
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [routes, setRoutes] = useState('')
  const [steps, setSteps] = useState<DraftStep[]>([{ roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: '' }])
  const [delegation, setDelegation] = useState(true)
  const [levelLabel, setLevelLabel] = useState<'Platform-wide' | 'This company'>('This company')

  const openNew = () => {
    setName('')
    setRoutes('')
    setSteps([{ roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: '' }])
    setDelegation(true)
    setLevelLabel('This company')
    setOpen(true)
  }

  const patchStep = (i: number, patch: Partial<DraftStep>) =>
    setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const removeStep = (i: number) => setSteps((ss) => ss.filter((_, j) => j !== i))
  const addRole = (i: number) =>
    setSteps((ss) =>
      ss.map((s, j) => {
        if (j !== i) return s
        const nextRole = FLOW_ROLE_OPTIONS.find((o) => !s.roles.includes(o))
        return nextRole ? { ...s, roles: [...s.roles, nextRole] } : s
      }),
    )
  const removeRole = (i: number, role: string) =>
    setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, roles: s.roles.filter((r) => r !== role) } : s)))

  /* live preview shares the exact pipeline visual the list uses */
  const previewSteps: FlowStep[] = steps.map((s, i) => ({
    id: 'preview' + (i + 1),
    roles: s.roles,
    mode: s.mode,
    sla: s.sla,
    escalateTo: s.escalateTo || undefined,
  }))

  const save = (status: 'Draft' | 'Running') => {
    const level: RuleLevel = persona.id === 'operator' && levelLabel === 'Platform-wide' ? 'Platform' : 'Company'
    addFlow({
      id: 'f' + (flows.length + 1),
      name: name.trim() || 'Untitled flow',
      routes: routes.trim() || 'Requests',
      level,
      ownerCompanyId: level === 'Company' ? (company.id === 'all' ? 'acme' : company.id) : undefined,
      status,
      steps: steps.map((s, i) => ({
        id: 's' + (i + 1),
        roles: s.roles,
        mode: s.mode,
        sla: s.sla,
        escalateTo: s.escalateTo || undefined,
      })),
      usedBy: 0,
      delegation,
      history: [{ who: persona.name, what: 'Created', when: 'today' }],
    })
    toast(
      status === 'Running'
        ? 'Running — it routes from the next request'
        : 'Saved as a draft — nothing routes until you turn it on',
    )
    setOpen(false)
  }

  const turnOn = (f: Flow) => {
    updateFlow(f.id, {
      status: 'Running',
      history: [...f.history, { who: persona.name, what: 'Turned on', when: 'just now' }],
    })
    toast('Running — it routes from the next request')
  }

  const pause = (f: Flow) => {
    updateFlow(f.id, {
      status: 'Draft',
      history: [...f.history, { who: persona.name, what: 'Paused', when: 'just now' }],
    })
    toast('Paused — nothing routes until you turn it back on')
  }

  const flowCard = (f: Flow) => {
    const editable = canEdit(f)
    return (
      <Card key={f.id} className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold tracking-tight">{f.name}</span>
          <FlowLevelPill level={f.level} />
          <Pill tone={statusTone(f.status)} dot>
            {f.status}
          </Pill>
          <span className="ml-auto text-[12px] text-muted">used by {f.usedBy} rules</span>
        </div>
        <p className="mt-1 text-[12.5px] text-muted">routes: {f.routes}</p>

        {/* the pipeline */}
        <div className="mt-4">
          <Pipeline steps={f.steps} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {f.delegation && <Pill tone="neutral">Approvers can hand off when away</Pill>}
          {editable ? (
            <>
              {f.status === 'Draft' && (
                <Btn variant="dark" size="sm" onClick={() => turnOn(f)}>
                  Turn it on
                </Btn>
              )}
              {f.status === 'Running' && (
                <Btn variant="ghost" size="sm" onClick={() => pause(f)}>
                  Pause
                </Btn>
              )}
              <Btn variant="ghost" size="sm" onClick={() => setHistoryId(f.id)}>
                <History className="h-3.5 w-3.5" /> History
              </Btn>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
                <Lock className="h-3.5 w-3.5" /> Set above you — runs here automatically.
              </span>
              <Btn variant="ghost" size="sm" onClick={() => setHistoryId(f.id)}>
                <History className="h-3.5 w-3.5" /> History
              </Btn>
            </>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div>
      {/* intro + new flow */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          A flow is who says yes, in what order, and what happens when they're quiet.
        </p>
        <Btn variant="dark" onClick={openNew}>
          <Plus className="h-4 w-4" /> New flow
        </Btn>
      </div>

      <div className="space-y-4">{flows.map(flowCard)}</div>

      {/* ── the composer ── */}
      <Drawer
        wide
        open={open}
        onClose={() => setOpen(false)}
        title="New flow"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Btn variant="outline" onClick={() => save('Draft')}>
              Save as draft
            </Btn>
            <Btn variant="dark" onClick={() => save('Running')}>
              Turn it on
            </Btn>
          </div>
        }
      >
        <div className="space-y-7">
          {/* what is it */}
          <section>
            <SectionLabel>What is it</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Expense approvals" />
              </Field>
              <Field label="What does it route?">
                <Input value={routes} onChange={(e) => setRoutes(e.target.value)} placeholder="e.g. Expense claims" />
              </Field>
            </div>
          </section>

          {/* where it lives — operators choose, everyone else builds for their company */}
          {persona.id === 'operator' && (
            <section>
              <SectionLabel hint="Platform-wide flows route in every company automatically.">
                Where does it live?
              </SectionLabel>
              <Segmented
                options={['Platform-wide', 'This company'] as const}
                value={levelLabel}
                onChange={setLevelLabel}
              />
            </section>
          )}

          {/* steps builder */}
          <section>
            <SectionLabel hint="Several people on one step decide side by side.">
              Who says yes, in order
            </SectionLabel>
            <div>
              {steps.map((s, i) => {
                const nextRole = FLOW_ROLE_OPTIONS.find((o) => !s.roles.includes(o))
                return (
                  <Fragment key={i}>
                    {i > 0 && (
                      <div className="flex justify-center py-1.5">
                        <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted" />
                      </div>
                    )}
                    <div className="rounded-2xl border border-line p-3.5">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Step {i + 1}
                        </span>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove step ${i + 1}`}
                            onClick={() => removeStep(i)}
                            className="text-muted transition-colors hover:text-red"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {s.roles.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1.5 rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold leading-none"
                          >
                            {r}
                            <button
                              type="button"
                              aria-label={`Remove ${r}`}
                              onClick={() => removeRole(i, r)}
                              className="text-muted transition-colors hover:text-red"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {nextRole && (
                          <button
                            type="button"
                            onClick={() => addRole(i)}
                            className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                          >
                            + role
                          </button>
                        )}
                      </div>
                      {s.roles.length > 1 && (
                        <div className="mt-2.5">
                          <Segmented
                            options={MODE_CHOICES}
                            value={s.mode === 'all' ? 'all of them' : 'any one'}
                            onChange={(v) => patchStep(i, { mode: v === 'all of them' ? 'all' : 'one' })}
                          />
                        </div>
                      )}
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Deadline">
                          <Select value={s.sla} onChange={(e) => patchStep(i, { sla: e.target.value })}>
                            {DEADLINES.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="If the deadline passes">
                          <Select value={s.escalateTo} onChange={(e) => patchStep(i, { escalateTo: e.target.value })}>
                            <option value="">None — it just waits</option>
                            {FLOW_ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </Select>
                        </Field>
                      </div>
                    </div>
                  </Fragment>
                )
              })}
              <button
                type="button"
                onClick={() =>
                  setSteps((ss) => [...ss, { roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: '' }])
                }
                className="mt-3 rounded-full border border-dashed border-line px-3 py-1.5 text-[12px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
              >
                + Add step
              </button>
            </div>
          </section>

          {/* hand-off while away */}
          <section>
            <SectionLabel hint="If someone is away, they can pass their step to a stand-in.">
              While people are away
            </SectionLabel>
            <Toggle on={delegation} onChange={setDelegation} label="Approvers can hand off when away" />
          </section>

          {/* live preview */}
          <section>
            <Card glow className="p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
                <Sparkles className="h-4 w-4" /> How it will run
              </div>
              <Pipeline steps={previewSteps} />
              <p className="mt-3 text-[13.5px] font-semibold leading-relaxed">{workedSentence(routes, steps)}</p>
              <p className="mt-1.5 text-[11.5px] text-muted">A worked example — it updates live as you build.</p>
            </Card>
          </section>
        </div>
      </Drawer>

      {/* ── the change record — who · what · when, on every flow ── */}
      <Drawer open={historyFlow != null} onClose={() => setHistoryId(null)} title="Every change, on the record">
        {historyFlow && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-bold tracking-tight">{historyFlow.name}</span>
              <FlowLevelPill level={historyFlow.level} />
            </div>
            <Timeline
              steps={historyFlow.history.map((h) => ({ label: h.what, at: h.who + ' · ' + h.when, done: true }))}
            />
            <p className="mt-6 text-[12px] leading-relaxed text-muted">
              Every change to who-approves-what, on the record.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
