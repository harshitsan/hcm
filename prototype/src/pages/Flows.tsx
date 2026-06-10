/**
 * Approval flows (BRD §6.25, jargon-free) — who says yes, in what order, and
 * what happens when they're quiet. Steps can hold several roles deciding side
 * by side ("any one" / "all of them"), every step carries a deadline, and a
 * quiet step can move on to someone else. Mounted inside Rules.tsx — the hero
 * lives there.
 */
import { Fragment, useState } from 'react'
import { AlertTriangle, ArrowRight, History, Landmark, Lock, Plus, Sparkles, Users, X } from 'lucide-react'
import { Btn, Card, Drawer, Field, Input, Pill, Segmented, Select, SectionTitle, Timeline, Toggle, statusTone } from '../ui'
import { useApp } from '../store'
import {
  FLOW_PURPOSES,
  FLOW_ROLE_OPTIONS,
  centralTeamLabel,
  unroutableFor,
  type ChainResolution,
  type Company,
  type Flow,
  type FlowPurpose,
  type FlowStep,
  type RuleLevel,
} from '../data'

const DEADLINES = ['within 1 day', 'within 2 days', 'within 3 days', 'within 5 days'] as const
const MODE_CHOICES = ['any one', 'all of them'] as const
const DECIDER_CHOICES = ['Their own people', 'Your central team'] as const

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

/** where the flow is set — who controls it. For multi-company viewers a
 *  company-level flow NAMES its company (never an ambiguous "this company"). */
function FlowLevelPill({ level, owner, named }: { level: RuleLevel; owner?: Company; named?: boolean }) {
  if (level === 'Platform') return <Pill tone="ink">Platform-wide</Pill>
  if (level === 'Portfolio') return <Pill tone="amber">Your portfolio</Pill>
  if (named && owner)
    return (
      <Pill tone="outline">
        <span className="h-2 w-2 rounded-full" style={{ background: owner.accent }} />
        {owner.name}
      </Pill>
    )
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
function workedSentence(routes: string, steps: DraftStep[], resolution: ChainResolution): string {
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
  const flavor =
    resolution === 'central'
      ? ` ${centralTeamLabel('Platform')} decides for everyone.`
      : " Each company's own people decide."
  return `${what} → ${parts.length > 0 ? parts.join(' → ') + ' → ' : ''}Done.${flavor}`
}

export default function FlowsView() {
  const { flows, updateFlow, addFlow, persona, company, companies, myCompanies, toast } = useApp()

  /* who may touch what — same posture as rules: things set above you run
     here automatically, read-only by design */
  const canEdit = (f: Flow): boolean =>
    persona.id === 'operator' ? true : persona.id === 'portfolio' ? f.level !== 'Platform' : f.level === 'Company'

  const multi = persona.multiCompany
  const ownerOf = (f: Flow) => companies.find((c) => c.id === f.ownerCompanyId)

  /** the parent's lens: for one company + one purpose, which flow covers it?
   *  Own flow beats portfolio beats platform — same precedence as rules. */
  const coverFor = (c: Company, p: FlowPurpose): { flow: Flow; via: 'own' | 'inherited' } | null => {
    const running = flows.filter((f) => f.purpose === p && f.status === 'Running')
    const own = running.find((f) => f.level === 'Company' && f.ownerCompanyId === c.id)
    if (own) return { flow: own, via: 'own' }
    const portfolio = running.find((f) => f.level === 'Portfolio' && c.inPortfolio)
    if (portfolio) return { flow: portfolio, via: 'inherited' }
    const platform = running.find((f) => f.level === 'Platform')
    if (platform) return { flow: platform, via: 'inherited' }
    return null
  }

  /* ── history drawer ── */
  const [historyId, setHistoryId] = useState<string | null>(null)
  const historyFlow = flows.find((f) => f.id === historyId) ?? null

  /* ── composer state ── */
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [routes, setRoutes] = useState('')
  const [purpose, setPurpose] = useState<FlowPurpose>('Time off')
  const [steps, setSteps] = useState<DraftStep[]>([{ roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: '' }])
  const [delegation, setDelegation] = useState(true)
  const [levelLabel, setLevelLabel] = useState<'Platform-wide' | 'This company'>('This company')
  /** whose people fill the hats — only a real choice for platform-wide flows */
  const [deciderLabel, setDeciderLabel] = useState<(typeof DECIDER_CHOICES)[number]>('Their own people')
  /** set when filling a gap from the map — the new flow belongs to that company */
  const [ownerForNew, setOwnerForNew] = useState<Company | null>(null)

  const openNew = () => {
    setName('')
    setRoutes('')
    setPurpose('Time off')
    setSteps([{ roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: '' }])
    setDelegation(true)
    setLevelLabel('This company')
    setDeciderLabel('Their own people')
    setOwnerForNew(null)
    setOpen(true)
  }

  /** clicked an amber gap in the map → composer arrives pre-filled for that company */
  const openGap = (c: Company, p: FlowPurpose) => {
    const names: Record<FlowPurpose, string> = {
      'Time off': 'Time-off approvals',
      Hiring: 'Job offers',
      Exits: 'Exit clearance',
      'Rule changes': 'Rule changes',
    }
    setName(names[p])
    setRoutes(p === 'Time off' ? 'Every time-off request' : p === 'Hiring' ? 'Every offer before it goes out' : p === 'Exits' ? 'Every departure, before the last day' : 'Any rule change')
    setPurpose(p)
    setSteps([{ roles: ['Manager'], mode: 'one', sla: 'within 1 day', escalateTo: '' }])
    setDelegation(true)
    setLevelLabel('This company')
    setDeciderLabel('Their own people')
    setOwnerForNew(c)
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

  /* the level the draft will save at, and who fills its hats — company flows
     are always filled by the company's own people */
  const draftIsPlatform = persona.id === 'operator' && levelLabel === 'Platform-wide'
  const draftResolution: ChainResolution = draftIsPlatform && deciderLabel === 'Your central team' ? 'central' : 'local'

  const save = (status: 'Draft' | 'Running') => {
    const level: RuleLevel = draftIsPlatform ? 'Platform' : 'Company'
    addFlow({
      id: 'f' + (flows.length + 1),
      name: name.trim() || 'Untitled flow',
      purpose,
      routes: routes.trim() || 'Requests',
      level,
      ownerCompanyId:
        level === 'Company' ? (ownerForNew?.id ?? (company.id === 'all' ? 'acme' : company.id)) : undefined,
      status,
      steps: steps.map((s, i) => ({
        id: 's' + (i + 1),
        roles: s.roles,
        mode: s.mode,
        sla: s.sla,
        escalateTo: s.escalateTo || undefined,
      })),
      resolution: draftResolution,
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
    /* shared flows whose hats are filled locally can hit a company where a
       hat has no head — say so, plainly */
    const stuckIn =
      f.level !== 'Company' && f.resolution === 'local'
        ? unroutableFor(
            { level: f.level, ownerCompanyId: f.ownerCompanyId, chain: f.steps.flatMap((s) => s.roles), resolution: f.resolution },
            companies,
          )
        : []
    const stuckNames = stuckIn.map((id) => companies.find((c) => c.id === id)?.name ?? id).join(', ')
    return (
      <Card key={f.id} className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold tracking-tight">{f.name}</span>
          <FlowLevelPill level={f.level} owner={ownerOf(f)} named={multi} />
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

        {/* whose people wear the hats — only worth saying on shared flows */}
        {f.level !== 'Company' && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted">
            {f.resolution === 'local' ? (
              <>
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Hats filled by each company — Beta asks → Beta's {f.steps[0]?.roles[0] ?? 'Manager'} decides.
                </span>
              </>
            ) : (
              <>
                <Landmark className="h-3.5 w-3.5 shrink-0" />
                <span>One desk for everyone — {centralTeamLabel(f.level)} decides.</span>
              </>
            )}
          </p>
        )}

        {/* somewhere in scope, a hat has no one in it */}
        {stuckIn.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-accent-soft/70 px-3.5 py-2.5 text-[12px] font-semibold text-accent-ink">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Can't run in {stuckNames} yet — those hats have no one in them.
            </span>
          </div>
        )}

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

  /* what this viewer can see: parents see everything; a company admin sees
     flows set above plus their own — never a sibling's */
  const homeId = company.id === 'all' ? persona.homeCompany : company.id
  const visibleFlows = multi ? flows : flows.filter((f) => f.level !== 'Company' || f.ownerCompanyId === homeId)
  const platformFlows = visibleFlows.filter((f) => f.level === 'Platform')
  const portfolioFlows = visibleFlows.filter((f) => f.level === 'Portfolio')
  const byCompany = myCompanies
    .map((c) => ({ c, items: visibleFlows.filter((f) => f.level === 'Company' && f.ownerCompanyId === c.id) }))
    .filter((x) => x.items.length > 0)

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

      {/* ── THE PARENT'S LENS: every child × every kind of approval ── */}
      {multi && (
        <Card className="mb-5 p-6">
          <SectionTitle hint="Every company × every kind of approval. Amber = nothing routes it there yet — click to fix.">
            Who's covered, at a glance
          </SectionTitle>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* header row */}
              <div className="grid items-center gap-2 border-b border-line/60 pb-2" style={{ gridTemplateColumns: '1.3fr repeat(4, 1fr)' }}>
                <div />
                {FLOW_PURPOSES.map((p) => (
                  <div key={p} className="text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {p}
                  </div>
                ))}
              </div>
              {myCompanies.map((c) => (
                <div
                  key={c.id}
                  className="grid items-center gap-2 border-b border-line/40 py-2.5 last:border-b-0"
                  style={{ gridTemplateColumns: '1.3fr repeat(4, 1fr)' }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.accent }} />
                    <span className="truncate text-[12.5px] font-bold">{c.name}</span>
                    {c.status !== 'Live' && (
                      <Pill tone={statusTone(c.status)} className="shrink-0">
                        {c.status === 'Getting set up' ? 'setting up' : 'paused'}
                      </Pill>
                    )}
                  </div>
                  {FLOW_PURPOSES.map((p) => {
                    const cov = coverFor(c, p)
                    return (
                      <div key={p} className="flex justify-center">
                        {cov?.via === 'own' ? (
                          <Pill tone="green">✓ own flow</Pill>
                        ) : cov ? (
                          <Pill tone="ink">from {cov.flow.level === 'Platform' ? 'platform' : 'portfolio'}</Pill>
                        ) : (
                          <button type="button" onClick={() => openGap(c, p)}>
                            <Pill tone="amber" className="transition-transform hover:scale-105">
                              none yet +
                            </Pill>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11.5px] text-muted">
            ✓ its own flow · dark = covered from above (live, never copied) · amber = a gap worth closing
          </p>
        </Card>
      )}

      {/* ── the flows, grouped by where they live ── */}
      {multi ? (
        <div className="space-y-6">
          {platformFlows.length > 0 && (
            <section>
              <SectionTitle hint="Route in every company automatically.">Platform-wide</SectionTitle>
              <div className="space-y-4">{platformFlows.map(flowCard)}</div>
            </section>
          )}
          {portfolioFlows.length > 0 && (
            <section>
              <SectionTitle hint="Route across the portfolio.">Your portfolio</SectionTitle>
              <div className="space-y-4">{portfolioFlows.map(flowCard)}</div>
            </section>
          )}
          {byCompany.map(({ c, items }) => (
            <section key={c.id}>
              <div className="mb-4 flex items-center gap-2.5">
                <span
                  className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-extrabold text-ink"
                  style={{ background: c.accent }}
                >
                  {c.short}
                </span>
                <h3 className="text-[15px] font-bold tracking-tight">{c.name}</h3>
                <span className="text-[12px] text-muted">— its own flows</span>
              </div>
              <div className="space-y-4">{items.map(flowCard)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-4">{visibleFlows.map(flowCard)}</div>
      )}

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
          {/* filling a gap from the map — say which company this lands in */}
          {ownerForNew && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-accent-soft/60 px-4 py-3">
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-ink"
                style={{ background: ownerForNew.accent }}
              >
                {ownerForNew.short}
              </span>
              <span className="text-[13px] font-semibold">
                Closing a gap: {ownerForNew.name} has nothing routing {purpose.toLowerCase()} yet.
              </span>
            </div>
          )}

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
            <div className="mt-4">
              <Field label="What kind of thing is it?">
                <Segmented options={FLOW_PURPOSES} value={purpose} onChange={setPurpose} />
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

          {/* whose people fill the hats — only a choice when the flow is platform-wide;
              a company flow is always decided by its own people */}
          {draftIsPlatform && (
            <section>
              <SectionLabel>Whose people decide?</SectionLabel>
              <Segmented options={DECIDER_CHOICES} value={deciderLabel} onChange={setDeciderLabel} />
              <p className="mt-2 text-[12px] text-muted">
                {draftResolution === 'local'
                  ? 'Each company fills the hats itself.'
                  : `One team decides for everyone — ${centralTeamLabel('Platform')}.`}
              </p>
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
              <p className="mt-3 text-[13.5px] font-semibold leading-relaxed">{workedSentence(routes, steps, draftResolution)}</p>
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
