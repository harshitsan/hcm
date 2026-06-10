/**
 * Approval flows (BRD §6.25, jargon-free) — who says yes, in what order, and
 * what happens when they're quiet. Steps can hold several roles deciding side
 * by side ("any one" / "all of them" / "any 2 of 3 is enough"), every step
 * carries a deadline with optional nudges, a quiet step climbs a ladder rung
 * by rung, and a step can run only when a condition holds. Mounted inside
 * Rules.tsx — the hero lives there.
 */
import { Fragment, useState } from 'react'
import { AlertTriangle, ArrowRight, History, Landmark, Lock, Pencil, Plus, Sparkles, Users, X } from 'lucide-react'
import { Btn, Card, Drawer, Field, Input, Pill, Segmented, Select, SectionTitle, Timeline, Toggle, statusTone } from '../ui'
import { Pipeline } from '../components/Pipeline'
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
  type StepEscalation,
} from '../data'

const DEADLINES = ['within 1 day', 'within 2 days', 'within 3 days', 'within 5 days'] as const
const MODE_CHOICES = ['any one', 'all of them'] as const
const DECIDER_CHOICES = ['Their own people', 'Your central team'] as const
const RUNG_DELAYS = ['1 day', '2 days', '3 days', '5 days'] as const
const COND_FACTS = ['—', 'the claim', 'the amount', 'the days asked', 'their tenure'] as const
const COND_OPS = ['is above', 'is below'] as const
const REJECT_CHOICES = ['back to the requester', 'it ends there', 'up one level'] as const
const TIMEOUT_CHOICES = ['keeps waiting', 'auto-approved', 'auto-declined'] as const

type LevelChoice = 'Platform-wide' | 'Your portfolio' | 'This company'
const OPERATOR_LEVELS: readonly LevelChoice[] = ['Platform-wide', 'Your portfolio', 'This company']
const PORTFOLIO_LEVELS: readonly LevelChoice[] = ['Your portfolio', 'This company']

/** a step being built in the composer — the full model the pipeline can show */
type DraftStep = {
  roles: string[]
  mode: 'one' | 'all'
  /** with 3+ roles on 'all': "any {k} of {n} is enough" */
  quorum?: number
  sla: string
  /** nudges at 50% and 75% of the deadline */
  remind: boolean
  /** the ladder, rung by rung — empty = it just waits */
  escalations: { after: string; to: string }[]
  /** structured "only when" — fact '—' means the step always runs */
  condFact: string
  condOp: string
  condValue: string
  /** an only-when we couldn't split into the three controls — kept verbatim
   *  so saving never loses it */
  condRaw?: string
}

const blankStep = (): DraftStep => ({
  roles: ['Manager'],
  mode: 'one',
  sla: 'within 1 day',
  remind: false,
  escalations: [],
  condFact: '—',
  condOp: 'is above',
  condValue: '',
})

/** best-effort split of an only-when back into the three controls */
function parseOnlyWhen(raw: string | undefined): Pick<DraftStep, 'condFact' | 'condOp' | 'condValue' | 'condRaw'> {
  if (!raw || !raw.trim()) return { condFact: '—', condOp: 'is above', condValue: '' }
  for (const op of COND_OPS) {
    const idx = raw.indexOf(` ${op} `)
    if (idx > 0) {
      const fact = raw.slice(0, idx)
      const value = raw.slice(idx + op.length + 2)
      if ((COND_FACTS as readonly string[]).includes(fact)) return { condFact: fact, condOp: op, condValue: value }
    }
  }
  return { condFact: '—', condOp: 'is above', condValue: '', condRaw: raw }
}

/** the only-when a draft step resolves to, if any */
function onlyWhenOf(s: DraftStep): string | undefined {
  if (s.condFact === '—') return s.condRaw?.trim() || undefined
  return `${s.condFact} ${s.condOp} ${s.condValue.trim()}`.trim()
}

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

/** the worked example under the live preview */
function workedSentence(
  routes: string,
  steps: DraftStep[],
  resolution: ChainResolution,
  level: RuleLevel,
  onReject: NonNullable<Flow['onReject']>,
  onTimeout: NonNullable<Flow['onTimeout']>,
): string {
  const what = routes.trim() || 'A request'
  const parts = steps
    .filter((s) => s.roles.length > 0)
    .map((s) => {
      const who = s.roles.join(' and ')
      const bits: string[] = []
      if (s.roles.length > 1)
        bits.push(
          s.quorum && s.quorum < s.roles.length
            ? `any ${s.quorum} of ${s.roles.length} is enough`
            : s.mode === 'all'
              ? s.roles.length === 2
                ? 'both'
                : 'all of them'
              : 'any one',
        )
      bits.push(s.sla)
      const firstRung = s.escalations[0]
      const quiet = firstRung ? `; quiet → ${firstRung.to}` : ''
      return `${who} (${bits.join(', ')}${quiet})`
    })
  const reject =
    onReject === 'back to the requester'
      ? 'Rejections go back to the requester'
      : onReject === 'it ends there'
        ? 'A rejection ends it there'
        : 'Rejections climb up one level'
  const silence =
    onTimeout === 'auto-approved'
      ? 'total silence auto-approves'
      : onTimeout === 'auto-declined'
        ? 'total silence auto-declines'
        : 'total silence just keeps waiting'
  const flavor =
    resolution === 'central'
      ? ` ${centralTeamLabel(level)} decides for everyone.`
      : " Each company's own people decide."
  return `${what} → ${parts.length > 0 ? parts.join(' → ') + ' → ' : ''}Done. ${reject}; ${silence}.${flavor}`
}

export default function FlowsView() {
  const { flows, updateFlow, addFlow, persona, company, companies, myCompanies, toast } = useApp()

  /* who may touch what — same posture as rules: things set above you run
     here automatically, read-only by design */
  const canEdit = (f: Flow): boolean =>
    persona.id === 'operator' ? true : persona.id === 'portfolio' ? f.level !== 'Platform' : f.level === 'Company'

  const multi = persona.multiCompany
  const homeId = company.id === 'all' ? persona.homeCompany : company.id
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [routes, setRoutes] = useState('')
  const [purpose, setPurpose] = useState<FlowPurpose>('Time off')
  const [steps, setSteps] = useState<DraftStep[]>([blankStep()])
  const [delegation, setDelegation] = useState(true)
  const [levelLabel, setLevelLabel] = useState<LevelChoice>('This company')
  /** whose people fill the hats — only a real choice for shared flows */
  const [deciderLabel, setDeciderLabel] = useState<(typeof DECIDER_CHOICES)[number]>('Their own people')
  /** what a rejection / total silence does, and how deadlines count */
  const [onReject, setOnReject] = useState<NonNullable<Flow['onReject']>>('back to the requester')
  const [onTimeout, setOnTimeout] = useState<NonNullable<Flow['onTimeout']>>('keeps waiting')
  const [businessHours, setBusinessHours] = useState(false)
  /** set when filling a gap from the map — the new flow belongs to that company */
  const [ownerForNew, setOwnerForNew] = useState<Company | null>(null)

  const editing = flows.find((f) => f.id === editingId) ?? null

  const resetComposer = () => {
    setEditingId(null)
    setName('')
    setRoutes('')
    setPurpose('Time off')
    setSteps([blankStep()])
    setDelegation(true)
    setLevelLabel('This company')
    setDeciderLabel('Their own people')
    setOnReject('back to the requester')
    setOnTimeout('keeps waiting')
    setBusinessHours(false)
    setOwnerForNew(null)
  }

  const openNew = () => {
    resetComposer()
    setOpen(true)
  }

  /** clicked an amber gap in the map → composer arrives pre-filled for that company */
  const openGap = (c: Company, p: FlowPurpose) => {
    const names: Record<FlowPurpose, string> = {
      'Time off': 'Time-off approvals',
      Hiring: 'Job offers',
      Exits: 'Exit clearance',
      'Rule changes': 'Rule changes',
      Expenses: 'Expense approvals',
    }
    resetComposer()
    setName(names[p])
    setRoutes(p === 'Time off' ? 'Every time-off request' : p === 'Hiring' ? 'Every offer before it goes out' : p === 'Exits' ? 'Every departure, before the last day' : p === 'Expenses' ? 'Every expense claim' : 'Any rule change')
    setPurpose(p)
    setOwnerForNew(c)
    setOpen(true)
  }

  /** edit an existing flow — the composer arrives seeded from it */
  const openEdit = (f: Flow) => {
    resetComposer()
    setEditingId(f.id)
    setName(f.name)
    setRoutes(f.routes)
    setPurpose(f.purpose)
    setSteps(
      f.steps.map((s) => ({
        roles: [...s.roles],
        mode: s.mode,
        quorum: s.quorum,
        sla: s.sla,
        remind: s.remind ?? false,
        escalations: s.escalations
          ? s.escalations.map((e) => ({ ...e }))
          : s.escalateTo
            ? [{ after: s.sla.replace('within ', ''), to: s.escalateTo }]
            : [],
        ...parseOnlyWhen(s.onlyWhen),
      })),
    )
    setDelegation(f.delegation)
    setLevelLabel(f.level === 'Platform' ? 'Platform-wide' : f.level === 'Portfolio' ? 'Your portfolio' : 'This company')
    setDeciderLabel(f.resolution === 'central' ? 'Your central team' : 'Their own people')
    setOnReject(f.onReject ?? 'back to the requester')
    setOnTimeout(f.onTimeout ?? 'keeps waiting')
    setBusinessHours(f.businessHours ?? false)
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
    setSteps((ss) =>
      ss.map((s, j) => {
        if (j !== i) return s
        const roles = s.roles.filter((r) => r !== role)
        return { ...s, roles, quorum: s.quorum && s.quorum < roles.length ? s.quorum : undefined }
      }),
    )

  /* the ladder, rung by rung */
  const addRung = (i: number) =>
    setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, escalations: [...s.escalations, { after: '1 day', to: 'Dept head' }] } : s)))
  const patchRung = (i: number, ri: number, patch: Partial<StepEscalation>) =>
    setSteps((ss) =>
      ss.map((s, j) =>
        j === i ? { ...s, escalations: s.escalations.map((e, k) => (k === ri ? { ...e, ...patch } : e)) } : s,
      ),
    )
  const removeRung = (i: number, ri: number) =>
    setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, escalations: s.escalations.filter((_, k) => k !== ri) } : s)))

  /** "any 2 of 3"-style choices for a step with n roles on 'all' */
  const quorumChoices = (n: number): string[] => [
    'all of them',
    ...Array.from({ length: Math.max(0, n - 2) }, (_, k) => `any ${k + 2} of ${n}`),
  ]

  const buildStep = (s: DraftStep, id: string): FlowStep => ({
    id,
    roles: s.roles,
    mode: s.mode,
    quorum: s.mode === 'all' && s.quorum && s.quorum < s.roles.length ? s.quorum : undefined,
    sla: s.sla,
    remind: s.remind || undefined,
    escalateTo: s.escalations[0]?.to,
    escalations: s.escalations.length > 0 ? s.escalations.map((e) => ({ ...e })) : undefined,
    onlyWhen: onlyWhenOf(s),
  })

  /* live preview shares the exact pipeline visual the list uses */
  const previewSteps: FlowStep[] = steps.map((s, i) => buildStep(s, 'preview' + (i + 1)))

  /* the level the draft will save at, and who fills its hats — company flows
     are always filled by the company's own people */
  const draftLevel: RuleLevel = editing
    ? editing.level
    : levelLabel === 'Platform-wide' && persona.id === 'operator'
      ? 'Platform'
      : levelLabel === 'Your portfolio' && (persona.id === 'operator' || persona.id === 'portfolio')
        ? 'Portfolio'
        : 'Company'
  const draftIsShared = draftLevel !== 'Company'
  const draftResolution: ChainResolution = draftIsShared && deciderLabel === 'Your central team' ? 'central' : 'local'

  const save = (status: 'Draft' | 'Running') => {
    const builtSteps = steps.map((s, i) => buildStep(s, 's' + (i + 1)))
    if (editing) {
      /* status preserved — editing changes the path, not whether it runs */
      updateFlow(editing.id, {
        name: name.trim() || editing.name,
        purpose,
        routes: routes.trim() || editing.routes,
        steps: builtSteps,
        resolution: draftResolution,
        delegation,
        onReject,
        onTimeout,
        businessHours: businessHours || undefined,
        history: [...editing.history, { who: persona.name, what: 'Changed who says yes / the tiers', when: 'just now' }],
      })
      toast('Saved — the next request follows the new path')
      setOpen(false)
      return
    }
    addFlow({
      id: 'f' + (flows.length + 1),
      name: name.trim() || 'Untitled flow',
      purpose,
      routes: routes.trim() || 'Requests',
      level: draftLevel,
      ownerCompanyId: draftLevel === 'Company' ? (ownerForNew?.id ?? homeId) : undefined,
      status,
      steps: builtSteps,
      resolution: draftResolution,
      onReject,
      onTimeout,
      businessHours: businessHours || undefined,
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
          {f.onReject && <Pill tone="neutral">rejected? {f.onReject}</Pill>}
          {f.onTimeout && <Pill tone="neutral">all quiet? {f.onTimeout}</Pill>}
          {f.businessHours && <Pill tone="outline">business hours only</Pill>}
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
              <Btn variant="ghost" size="sm" onClick={() => openEdit(f)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Btn>
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
  const visibleFlows = multi ? flows : flows.filter((f) => f.level !== 'Company' || f.ownerCompanyId === homeId)
  const platformFlows = visibleFlows.filter((f) => f.level === 'Platform')
  const portfolioFlows = visibleFlows.filter((f) => f.level === 'Portfolio')
  const byCompany = myCompanies
    .map((c) => ({ c, items: visibleFlows.filter((f) => f.level === 'Company' && f.ownerCompanyId === c.id) }))
    .filter((x) => x.items.length > 0)

  const mapColumns = `1.3fr repeat(${FLOW_PURPOSES.length}, 1fr)`

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
            <div className="min-w-[760px]">
              {/* header row */}
              <div className="grid items-center gap-2 border-b border-line/60 pb-2" style={{ gridTemplateColumns: mapColumns }}>
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
                  style={{ gridTemplateColumns: mapColumns }}
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
        title={editing ? 'Edit flow' : 'New flow'}
        footer={
          editing ? (
            <div className="flex items-center justify-end">
              <Btn variant="dark" onClick={() => save('Running')}>
                Save changes
              </Btn>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <Btn variant="outline" onClick={() => save('Draft')}>
                Save as draft
              </Btn>
              <Btn variant="dark" onClick={() => save('Running')}>
                Turn it on
              </Btn>
            </div>
          )
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

          {/* where it lives — operators and portfolio managers choose; everyone
              else builds for their own company. Fixed once a flow exists. */}
          {editing ? (
            <section>
              <SectionLabel>Where it lives</SectionLabel>
              <FlowLevelPill level={editing.level} owner={ownerOf(editing)} named={multi} />
            </section>
          ) : persona.id === 'operator' || persona.id === 'portfolio' ? (
            <section>
              <SectionLabel
                hint={
                  persona.id === 'operator'
                    ? 'Platform-wide flows route in every company automatically; portfolio flows in your portfolio.'
                    : 'Portfolio flows route in every portfolio company automatically.'
                }
              >
                Where does it live?
              </SectionLabel>
              <Segmented
                options={persona.id === 'operator' ? OPERATOR_LEVELS : PORTFOLIO_LEVELS}
                value={levelLabel}
                onChange={setLevelLabel}
              />
            </section>
          ) : (
            <section>
              <SectionLabel>Where does it live?</SectionLabel>
              <p className="text-[12.5px] text-muted">This company — flows you build live here, beside its own rules.</p>
            </section>
          )}

          {/* whose people fill the hats — only a choice when the flow is shared;
              a company flow is always decided by its own people */}
          {draftIsShared && (
            <section>
              <SectionLabel>Whose people decide?</SectionLabel>
              <Segmented options={DECIDER_CHOICES} value={deciderLabel} onChange={setDeciderLabel} />
              <p className="mt-2 text-[12px] text-muted">
                {draftResolution === 'local'
                  ? 'Each company fills the hats itself.'
                  : `One team decides for everyone — ${centralTeamLabel(draftLevel)}.`}
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
                            onChange={(v) =>
                              patchStep(i, v === 'all of them' ? { mode: 'all' } : { mode: 'one', quorum: undefined })
                            }
                          />
                        </div>
                      )}
                      {/* with 3+ on 'all', maybe fewer yeses are enough */}
                      {s.roles.length > 2 && s.mode === 'all' && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-[12px] text-muted">how many is enough?</span>
                          <Segmented
                            options={quorumChoices(s.roles.length)}
                            value={
                              s.quorum && s.quorum < s.roles.length
                                ? `any ${s.quorum} of ${s.roles.length}`
                                : 'all of them'
                            }
                            onChange={(v) =>
                              patchStep(i, { quorum: v === 'all of them' ? undefined : Number(v.split(' ')[1]) })
                            }
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
                        <div className="flex items-end pb-2.5">
                          <Toggle
                            on={s.remind}
                            onChange={(v) => patchStep(i, { remind: v })}
                            label="Nudge them at 50% and 75% of the deadline"
                          />
                        </div>
                      </div>
                      {/* the ladder — if they stay quiet, it climbs */}
                      <div className="mt-3">
                        <div className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
                          If the deadline passes
                        </div>
                        <div className="space-y-2">
                          {s.escalations.map((e, ri) => (
                            <div key={ri} className="flex items-center gap-2">
                              <span className="shrink-0 text-[12px] text-muted">after</span>
                              <Select
                                value={e.after}
                                onChange={(ev) => patchRung(i, ri, { after: ev.target.value })}
                                className="max-w-[130px]"
                              >
                                {RUNG_DELAYS.map((d) => (
                                  <option key={d}>{d}</option>
                                ))}
                              </Select>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                              <Select
                                value={e.to}
                                onChange={(ev) => patchRung(i, ri, { to: ev.target.value })}
                              >
                                {FLOW_ROLE_OPTIONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </Select>
                              <button
                                type="button"
                                aria-label={`Remove rung ${ri + 1}`}
                                onClick={() => removeRung(i, ri)}
                                className="shrink-0 text-muted transition-colors hover:text-red"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addRung(i)}
                            className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                          >
                            + Add a rung
                          </button>
                        </div>
                        <p className="mt-1 text-[11.5px] text-muted">If they stay quiet, it climbs.</p>
                      </div>
                      {/* the tier condition — fact · is above/below · value */}
                      <div className="mt-3">
                        <div className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
                          Only when (optional)
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <Select value={s.condFact} onChange={(e) => patchStep(i, { condFact: e.target.value })}>
                            {COND_FACTS.map((fct) => (
                              <option key={fct}>{fct}</option>
                            ))}
                          </Select>
                          <Select value={s.condOp} onChange={(e) => patchStep(i, { condOp: e.target.value })}>
                            {COND_OPS.map((op) => (
                              <option key={op}>{op}</option>
                            ))}
                          </Select>
                          <Input
                            value={s.condValue}
                            onChange={(e) => patchStep(i, { condValue: e.target.value })}
                            placeholder="₹50,000 / 5 days"
                          />
                        </div>
                        <p className="mt-1 text-[11.5px] text-muted">
                          {s.condFact === '—' && s.condRaw
                            ? `Keeps its current wording — only when ${s.condRaw}.`
                            : 'Pick — and the step always runs.'}
                        </p>
                      </div>
                    </div>
                  </Fragment>
                )
              })}
              <button
                type="button"
                onClick={() => setSteps((ss) => [...ss, blankStep()])}
                className="mt-3 rounded-full border border-dashed border-line px-3 py-1.5 text-[12px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
              >
                + Add step
              </button>
            </div>
          </section>

          {/* outcome semantics — what a no, or no answer at all, does */}
          <section>
            <SectionLabel hint="What a no — or no answer at all — does.">When it ends badly</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="If someone rejects">
                <Select
                  value={onReject}
                  onChange={(e) => setOnReject(e.target.value as NonNullable<Flow['onReject']>)}
                >
                  {REJECT_CHOICES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="If everyone stays quiet">
                <Select
                  value={onTimeout}
                  onChange={(e) => setOnTimeout(e.target.value as NonNullable<Flow['onTimeout']>)}
                >
                  {TIMEOUT_CHOICES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-3">
              <Toggle on={businessHours} onChange={setBusinessHours} label="Deadlines count business hours only" />
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
              <p className="mt-3 text-[13.5px] font-semibold leading-relaxed">
                {workedSentence(routes, steps, draftResolution, draftLevel, onReject, onTimeout)}
              </p>
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
