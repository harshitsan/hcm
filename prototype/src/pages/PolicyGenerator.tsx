/**
 * New policy — the Policy Studio generator, given its dedicated space.
 * Same three steps as before (start from → who it covers → make each clause
 * work), same state and handlers — but as a full page that mirrors the
 * Add-company journey: phase rail on the left, one Card per step on the right.
 */
import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calculator,
  Check,
  Eye,
  FileSignature,
  GraduationCap,
  ListChecks,
  MessagesSquare,
  Plus,
  Sparkles,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Btn, Card, Field, Input, Pill, Segmented, Select, SentenceChip } from '../ui'
import { useApp } from '../store'
import {
  EXTRA_DIMENSIONS,
  POLICY_CHANNELS,
  POLICY_TEMPLATES,
  TEAM_OPTIONS,
  WHERE_OPTIONS,
  WHO_OPTIONS,
  coverageBreakdown,
  type ChildControl,
  type ClauseBinding,
  type ClauseBindingKind,
  type ClauseSensor,
  type PolicyClause,
  type PolicyTemplate,
  type RuleLevel,
} from '../data'
import { cn } from '../lib'

/* ── binding iconography — one icon per kind, everywhere ── */

const BINDING_ICONS: Record<ClauseBindingKind, LucideIcon> = {
  sign: FileSignature,
  watch: Eye,
  report: MessagesSquare,
  number: Calculator,
  deadline: Timer,
  checklist: ListChecks,
  training: GraduationCap,
}

function BindingIcon({ kind, className }: { kind: ClauseBindingKind; className?: string }) {
  const I = BINDING_ICONS[kind]
  return <I className={className} />
}

const KIND_LABEL: Record<ClauseBindingKind, string> = {
  sign: 'People sign this',
  watch: 'The system watches',
  report: 'People can report',
  number: 'It sets a number',
  deadline: 'It has a deadline',
  checklist: 'It spawns tasks',
  training: 'It requires training',
}

/* ── the sensor question: how do we know? ── */

const SENSOR_LABEL: Record<ClauseSensor, string> = {
  platform: 'the platform sees it',
  connector: 'a connected system tells us (Phase II)',
  person: 'a person reports it',
}

type SensorChoice = 'The platform sees it' | 'A connected system' | 'A person reports it'
const SENSOR_CHOICES = ['The platform sees it', 'A connected system', 'A person reports it'] as const
const SENSOR_OF_CHOICE: Record<SensorChoice, ClauseSensor> = {
  'The platform sees it': 'platform',
  'A connected system': 'connector',
  'A person reports it': 'person',
}
const CHOICE_OF_SENSOR: Record<ClauseSensor, SensorChoice> = {
  platform: 'The platform sees it',
  connector: 'A connected system',
  person: 'A person reports it',
}

/** which kinds each sensor can honestly power */
const KIND_BY_SENSOR: Record<ClauseSensor, ClauseBindingKind[]> = {
  platform: ['watch', 'number', 'deadline', 'checklist', 'training', 'sign'],
  person: ['report'],
  connector: ['watch'],
}

function howFor(kind: ClauseBindingKind, sensor: ClauseSensor): string {
  switch (kind) {
    case 'sign':
      return 'Read-and-sign tracked — receipts on the record'
    case 'watch':
      return sensor === 'connector'
        ? 'A connected system flags it — via connector (Phase II)'
        : 'Fires automatically; each firing is a ticket'
    case 'report':
      return 'Anyone can report a concern — or something good'
    case 'number':
      return 'Sets a number other parts of the system read'
    case 'deadline':
      return 'Deadline tracked — % met, misses escalate'
    case 'checklist':
      return 'Tasks fire at the right moment, each with an owner'
    case 'training':
      return 'Completion tracked; overdue → reminder → escalation'
  }
}

const FLOW_OPTIONS = ['Manager → HR', 'HR only', 'POSH committee', 'Dept head → HR', 'No flow — just recorded'] as const
const NO_FLOW = 'No flow — just recorded'

/* ── level labels (same plain language as rules) ── */

type LevelLabel = 'Platform' | 'Your portfolio' | 'This company'
const LEVEL_OF_LABEL: Record<LevelLabel, RuleLevel> = {
  Platform: 'Platform',
  'Your portfolio': 'Portfolio',
  'This company': 'Company',
}

/* ── what children may do with it — same plain labels as rules ── */

type ControlLabel = 'Use as-is' | 'Can adjust' | 'Opt in'
const CONTROL_CHOICES = ['Use as-is', 'Can adjust', 'Opt in'] as const
const CONTROL_OF_LABEL: Record<ControlLabel, ChildControl> = {
  'Use as-is': 'locked',
  'Can adjust': 'adjustable',
  'Opt in': 'optional',
}
const CONTROL_EXPLAINER: Record<ChildControl, string> = {
  locked: "Compliance-grade. Children can't change a word.",
  adjustable: 'Children may tighten or localise — never weaken.',
  optional: 'A starting point. Nothing runs until a company adopts it.',
}

function SectionLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{children}</div>
      {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

/** click-to-cycle through a chip's options */
function next(options: readonly string[], current: string): string {
  return options[(options.indexOf(current) + 1) % options.length]
}

const TEXTAREA =
  'w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13.5px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'

const BLANK_SIGN_CLAUSE: PolicyClause = {
  id: 'c1',
  title: 'Read & accept this policy',
  body: 'Everyone covered confirms they have read and accepted it. Signatures are tracked per company and team.',
  binding: { kind: 'sign', sensor: 'platform', how: 'Read-and-sign tracked — receipts on the record' },
}

/* ── the three steps, on the rail ── */

const STEP_TITLES = ['Start from', 'Who it covers', 'Make each clause work'] as const
const STEP_HINTS: Record<number, string | undefined> = {
  0: 'Pick a starting point — everything stays editable.',
  1: undefined,
  2: 'Every clause can work — signed, watched, reported, measured.',
}

export default function PolicyGenerator() {
  const { policies, addPolicy, persona, company, companies, toast } = useApp()
  const navigate = useNavigate()

  const levelChoices: readonly LevelLabel[] =
    persona.id === 'operator'
      ? ['Platform', 'Your portfolio', 'This company']
      : persona.id === 'portfolio'
        ? ['Your portfolio', 'This company']
        : []

  /* ── generator state — same shape as the old drawer ── */
  const [step, setStep] = useState(0)
  const [tpl, setTpl] = useState<PolicyTemplate | null>(null)
  const [variant, setVariant] = useState('India')
  const [genName, setGenName] = useState('')
  const [genArea, setGenArea] = useState('Workplace')
  const [levelLabel, setLevelLabel] = useState<LevelLabel>('This company')
  const [who, setWho] = useState<string>(WHO_OPTIONS[0])
  const [where, setWhere] = useState<string>(WHERE_OPTIONS[0])
  const [team, setTeam] = useState<string>(TEAM_OPTIONS[0])
  const [controlLabel, setControlLabel] = useState<ControlLabel>('Can adjust')
  const [excluded, setExcluded] = useState<string[]>([])
  const [also, setAlso] = useState<{ dim: string; value: string }[]>([])
  const [exceptions, setExceptions] = useState<string[]>([])
  const [exceptionInput, setExceptionInput] = useState('')
  const [genClauses, setGenClauses] = useState<PolicyClause[]>([])
  const [focus, setFocus] = useState(0)
  const [channels, setChannels] = useState<string[]>(['Platform sign-off'])
  const [effective, setEffective] = useState('')

  const level: RuleLevel = persona.id === 'hradmin' ? 'Company' : LEVEL_OF_LABEL[levelLabel]
  const childControl: ChildControl = CONTROL_OF_LABEL[controlLabel]

  /* the companies in reach at this level — and which are still switched on */
  const scopeCompanies =
    level === 'Platform' ? companies : level === 'Portfolio' ? companies.filter((c) => c.inPortfolio) : []
  const includedIds = scopeCompanies.filter((c) => !excluded.includes(c.id)).map((c) => c.id)
  const isSubset = level !== 'Company' && includedIds.length < scopeCompanies.length
  const genCoverage = coverageBreakdown(
    level,
    'acme',
    isSubset ? includedIds : undefined,
    { who, where, team },
    also.length > 0 ? also : undefined,
    companies,
  )
  const landsIn = level === 'Company' ? 1 : includedIds.length

  const toggleCompany = (id: string) => {
    if (excluded.includes(id)) {
      setExcluded((xs) => xs.filter((x) => x !== id))
      return
    }
    if (includedIds.length <= 1) {
      toast('At least one company has to stay on')
      return
    }
    setExcluded((xs) => [...xs, id])
  }

  const addException = () => {
    const x = exceptionInput.trim()
    if (x !== '' && !exceptions.includes(x)) setExceptions((xs) => [...xs, x])
    setExceptionInput('')
  }

  /* the recap, composed live — the same sentence the policy publishes with */
  const recap =
    `Covers ${who} in ${where} · ${team}` +
    also.map((c) => `, and ${c.value}`).join('') +
    (exceptions.length > 0 ? ` — except: ${exceptions.join(' · ')}` : '') +
    ` across ${landsIn} ${landsIn === 1 ? 'company' : 'companies'}.`

  const pickTemplate = (t: PolicyTemplate) => {
    setTpl(t)
    setGenArea(t.area)
    setGenName(t.countryVariants ? `${t.name} — ${variant}` : t.name)
    if (t.light) {
      toast("This one's an outline — full clauses come with the real catalog")
      setGenClauses([{ ...BLANK_SIGN_CLAUSE }])
    } else {
      setGenClauses(t.clauses.map((c) => ({ ...c })))
    }
    setFocus(0)
    setStep(1)
  }

  const setClause = (i: number, patch: Partial<PolicyClause>) =>
    setGenClauses((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  const setBinding = (i: number, b: ClauseBinding | undefined) =>
    setGenClauses((cs) => cs.map((c, j) => (j === i ? { ...c, binding: b } : c)))

  const addClause = () => {
    setGenClauses((cs) => [...cs, { id: 'c' + (cs.length + 1), title: 'New clause', body: '' }])
    setFocus(genClauses.length)
  }

  const toggleChannel = (ch: string) => {
    if (ch === 'Platform sign-off' && channels.includes(ch)) {
      toast('Platform sign-off is the Phase-1 floor')
      return
    }
    setChannels((cs) => (cs.includes(ch) ? cs.filter((x) => x !== ch) : [...cs, ch]))
  }

  const saveGen = (status: 'Draft' | 'Waiting for approval') => {
    addPolicy({
      id: 'pol' + (policies.length + 1),
      name: genName.trim() || 'Untitled policy',
      area: genArea,
      level,
      ownerCompanyId: level === 'Company' ? 'acme' : undefined,
      childControl,
      appliesTo: { who, where, team },
      appliesAlso: also.length > 0 ? also : undefined,
      exceptions: exceptions.length > 0 ? exceptions : undefined,
      includedCompanies: isSubset ? includedIds : undefined,
      status,
      version: 1,
      effectiveFrom: effective.trim() || 'on approval',
      channels,
      clauses: genClauses,
      versions: [{ v: 1, date: 'today', changes: ['First draft'], material: true }],
      history: [{ who: persona.name, what: `Created from the ${tpl?.name ?? 'blank'} template`, when: 'today' }],
    })
    toast(
      status === 'Draft'
        ? 'Saved as a draft — nothing runs until you send it'
        : 'Sent for approval — it publishes once approved',
    )
    navigate('/rules')
  }

  const focused = genClauses[focus] as PolicyClause | undefined
  const focusedSensor: ClauseSensor = focused?.binding?.sensor ?? 'platform'

  const pickSensor = (s: ClauseSensor) => {
    if (!focused) return
    const allowed = KIND_BY_SENSOR[s]
    if (focused.binding) {
      const kind = allowed.includes(focused.binding.kind) ? focused.binding.kind : allowed[0]
      setBinding(focus, { ...focused.binding, sensor: s, kind, how: howFor(kind, s) })
    } else {
      setBinding(focus, { kind: allowed[0], sensor: s, how: howFor(allowed[0], s) })
    }
  }

  const pickKind = (k: ClauseBindingKind) => {
    if (!focused) return
    if (focused.binding?.kind === k) {
      setBinding(focus, undefined) // unbind — the clause becomes plain text
      return
    }
    setBinding(
      focus,
      focused.binding
        ? { ...focused.binding, kind: k, sensor: focusedSensor, how: howFor(k, focusedSensor) }
        : { kind: k, sensor: focusedSensor, how: howFor(k, focusedSensor) },
    )
  }

  /* ── step bodies — the drawer content, given room ── */

  const stepBody = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {POLICY_TEMPLATES.map((t) => (
              <Card key={t.id} className={cn('p-4', t.light && 'opacity-75')} onClick={() => pickTemplate(t)}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13.5px] font-bold tracking-tight">{t.name}</span>
                  <Pill tone="outline">{t.area}</Pill>
                  {t.light && <Pill tone="neutral">outline only</Pill>}
                </div>
                <p className="mt-1.5 text-[12px] text-muted">{t.desc}</p>
                {!t.light && (
                  <div className="mt-2 space-y-0.5">
                    {t.covers.map((c) => (
                      <div key={c} className="text-[11.5px] text-ink-soft">
                        ✓ {c}
                      </div>
                    ))}
                    {t.slas.map((s) => (
                      <div key={s} className="text-[11.5px] font-medium text-accent-ink">
                        ⏱ {s}
                      </div>
                    ))}
                    <div className="pt-1 text-[11.5px] font-semibold text-muted">{t.clauses.length} working clauses</div>
                  </div>
                )}
                {t.countryVariants && (
                  <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                    <Segmented options={t.countryVariants} value={variant} onChange={setVariant} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      case 1:
        return (
          <div className="grid gap-7 xl:grid-cols-[1fr,320px]">
            <div className="space-y-7">
              {/* 1 · where it lives + what children may do with it */}
              <section>
                <SectionLabel hint="A policy set higher up lands on every company below it — live, never copied.">
                  Where does it live?
                </SectionLabel>
                {levelChoices.length > 0 ? (
                  <Segmented options={levelChoices} value={levelLabel} onChange={setLevelLabel} />
                ) : (
                  <p className="text-[13px] font-semibold">Lives in {company.name}</p>
                )}
                {level !== 'Company' && (
                  <div className="mt-4">
                    <SectionLabel>What can companies below do?</SectionLabel>
                    <Segmented options={CONTROL_CHOICES} value={controlLabel} onChange={setControlLabel} />
                    <p className="mt-2 text-[12px] text-muted">{CONTROL_EXPLAINER[childControl]}</p>
                  </div>
                )}
              </section>

              {/* 2 · which companies it lands in */}
              {level !== 'Company' && (
                <section>
                  <SectionLabel hint="Tap a company to leave it out — or bring it back.">Which companies</SectionLabel>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scopeCompanies.map((c) => {
                      const on = includedIds.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCompany(c.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                            on
                              ? 'border-line bg-card text-ink hover:bg-card2'
                              : 'border-dashed border-line/80 bg-transparent text-muted hover:text-ink',
                          )}
                        >
                          <span
                            className={cn('h-2 w-2 rounded-full', !on && 'opacity-40')}
                            style={{ background: c.accent }}
                          />
                          <span className={cn(!on && 'line-through')}>{c.name}</span>
                          {on ? <X className="h-3 w-3 text-muted" /> : <Plus className="h-3 w-3" />}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-[12px] text-muted">
                    It lands in {includedIds.length} of {scopeCompanies.length} companies — leave one out and it simply
                    never applies there.
                  </p>
                </section>
              )}

              {/* 3 · who it covers — a sentence that grows, never a filter grid */}
              <section>
                <SectionLabel hint="Tap a highlighted part to change it — add clauses for precision.">
                  Who it covers
                </SectionLabel>
                <p className="text-[15px] leading-loose">
                  Covers <SentenceChip onClick={() => setWho(next(WHO_OPTIONS, who))}>{who}</SentenceChip> in{' '}
                  <SentenceChip onClick={() => setWhere(next(WHERE_OPTIONS, where))}>{where}</SentenceChip> ·{' '}
                  <SentenceChip onClick={() => setTeam(next(TEAM_OPTIONS, team))}>{team}</SentenceChip>
                  {also.map((c) => {
                    const dim = EXTRA_DIMENSIONS.find((d) => d.id === c.dim)
                    return (
                      <Fragment key={c.dim}>
                        {' '}
                        <span className="inline-block">
                          <span className="text-muted">and</span>{' '}
                          <SentenceChip
                            onClick={() => {
                              const opts = dim?.options.map((o) => o.value) ?? []
                              setAlso((cs) =>
                                cs.map((x) => (x.dim === c.dim ? { ...x, value: next(opts, x.value) } : x)),
                              )
                            }}
                          >
                            {c.value}
                          </SentenceChip>
                          <button
                            type="button"
                            aria-label={`Remove ${dim?.label ?? c.dim}`}
                            onClick={() => setAlso((cs) => cs.filter((x) => x.dim !== c.dim))}
                            className="ml-0.5 align-middle text-muted transition-colors hover:text-red"
                          >
                            <X className="inline h-3 w-3" />
                          </button>
                        </span>
                      </Fragment>
                    )
                  })}
                </p>
                {/* the dimension catalog — add precision one clause at a time */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {EXTRA_DIMENSIONS.filter((d) => !also.some((c) => c.dim === d.id)).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setAlso((cs) => [...cs, { dim: d.id, value: d.options[0].value }])}
                      className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                    >
                      + and… {d.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              </section>

              {/* 4 · except — carve-outs that publish with the policy */}
              <section>
                <SectionLabel hint="Exceptions are part of the policy — they publish with it, in plain words.">
                  Except…
                </SectionLabel>
                {exceptions.length > 0 && (
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {exceptions.map((x) => (
                      <span
                        key={x}
                        className="inline-flex items-center gap-1.5 rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold leading-none"
                      >
                        {x}
                        <button
                          type="button"
                          aria-label={`Remove ${x}`}
                          onClick={() => setExceptions((xs) => xs.filter((y) => y !== x))}
                          className="text-muted transition-colors hover:text-red"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={exceptionInput}
                    onChange={(e) => setExceptionInput(e.target.value)}
                    placeholder="e.g. Not for interns"
                  />
                  <Btn variant="outline" size="sm" onClick={addException}>
                    Add
                  </Btn>
                </div>
              </section>
            </div>

            {/* 5 · the coverage panel — the itemized truth behind the big number */}
            <section className="xl:sticky xl:top-4 xl:self-start">
              <Card glow className="p-4">
                <div className="font-display text-[30px] font-medium leading-none tracking-tight">
                  → {genCoverage.total} {genCoverage.total === 1 ? 'person' : 'people'}
                </div>
                <p className="mt-1.5 text-[12px] text-muted">live reach — exactly who's covered, right now</p>
                <div className="mt-3 space-y-1.5">
                  {genCoverage.rows.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-[12.5px]">
                      <span
                        className={cn('h-2 w-2 shrink-0 rounded-full', !r.included && 'opacity-40')}
                        style={{ background: r.accent }}
                      />
                      <span className={cn('font-semibold', !r.included && 'text-muted line-through')}>{r.name}</span>
                      {r.included ? (
                        <span className="ml-auto text-[12px] text-muted">{r.people} people</span>
                      ) : (
                        <Pill tone="neutral" className="ml-auto">
                          left out
                        </Pill>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-muted">{recap}</p>
              </Card>
            </section>
          </div>
        )
      case 2:
        return (
          <div>
            <div className="grid gap-5 lg:grid-cols-[224px,1fr]">
              {/* clause rail — sticky, so long policies stay navigable */}
              <div className="space-y-1 lg:sticky lg:top-4 lg:self-start">
                {genClauses.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFocus(i)}
                    className={cn(
                      'flex w-full items-center gap-1.5 rounded-xl px-2.5 py-2 text-left text-[12px] font-semibold transition-colors',
                      i === focus ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-card2',
                    )}
                  >
                    {c.binding ? (
                      <BindingIcon kind={c.binding.kind} className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                    )}
                    <span className="truncate">{c.title || 'Untitled clause'}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addClause}
                  className="w-full rounded-xl border border-dashed border-line px-2.5 py-2 text-left text-[12px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                >
                  + Add a clause
                </button>
              </div>

              {/* the focused clause */}
              {focused ? (
                <Card className="p-4">
                  <Field label="Clause title">
                    <Input value={focused.title} onChange={(e) => setClause(focus, { title: e.target.value })} />
                  </Field>
                  <div className="mt-3">
                    <Field label="What it says">
                      <textarea
                        rows={3}
                        value={focused.body}
                        onChange={(e) => setClause(focus, { body: e.target.value })}
                        placeholder="One short paragraph is enough."
                        className={TEXTAREA}
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <SectionLabel>How do we know?</SectionLabel>
                    <Segmented
                      options={SENSOR_CHOICES}
                      value={CHOICE_OF_SENSOR[focusedSensor]}
                      onChange={(v) => pickSensor(SENSOR_OF_CHOICE[v])}
                    />
                    {focusedSensor === 'connector' && (
                      <div className="mt-2">
                        <Pill tone="amber">via connector — Phase II</Pill>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <SectionLabel hint="Pick what this clause does — tap again to make it plain text.">
                      What it does
                    </SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {KIND_BY_SENSOR[focusedSensor].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => pickKind(k)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                            focused.binding?.kind === k
                              ? 'bg-accent-soft text-accent-ink'
                              : 'bg-card2 text-muted hover:text-ink',
                          )}
                        >
                          <BindingIcon kind={k} className="h-3.5 w-3.5" /> {KIND_LABEL[k]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {focused.binding && (
                    <>
                      <div className="mt-4">
                        <Field label="Who acts when it fires">
                          <Select
                            value={focused.binding.flow ?? NO_FLOW}
                            onChange={(e) =>
                              setBinding(focus, {
                                ...focused.binding!,
                                flow: e.target.value === NO_FLOW ? undefined : e.target.value,
                              })
                            }
                          >
                            {FLOW_OPTIONS.map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </Select>
                        </Field>
                      </div>
                      <p className="mt-3 rounded-xl bg-card2/70 px-3 py-2.5 text-[12px] font-medium">
                        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-accent-ink" />
                        {howFor(focused.binding.kind, focused.binding.sensor)}
                        {focused.binding.flow && <span className="text-ink-soft"> → {focused.binding.flow}</span>}
                      </p>
                      <p className="mt-1.5 text-[11px] text-muted">
                        How we know: {SENSOR_LABEL[focused.binding.sensor]}
                      </p>
                    </>
                  )}
                </Card>
              ) : (
                <p className="text-[12.5px] text-muted">Add a clause to start.</p>
              )}
            </div>

            {/* publish where + when — used to live in the drawer footer */}
            <div className="mt-7 space-y-5 border-t border-line/70 pt-6">
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Publish where?
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {POLICY_CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                        channels.includes(ch) ? 'bg-accent-soft text-accent-ink' : 'bg-card2 text-muted hover:text-ink',
                      )}
                    >
                      {ch}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => toast('DocuSign lands with the connector — Phase II')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-card2 px-3 py-1.5 text-[12px] font-semibold text-muted"
                  >
                    DocuSign e-sign · via connector <Pill tone="amber">Phase II</Pill>
                  </button>
                </div>
              </div>
              <div className="max-w-xs">
                <Field label="Effective from">
                  <Input
                    value={effective}
                    onChange={(e) => setEffective(e.target.value)}
                    placeholder="e.g. 1 Aug 2026"
                  />
                </Field>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* slim top row — the page IS the wizard */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Btn variant="ghost" size="sm" onClick={() => navigate('/rules')}>
          <ArrowLeft className="h-4 w-4" /> Back to policies
        </Btn>
        <h1 className="font-display text-[24px] font-medium leading-tight tracking-tight">New policy</h1>
        <p className="text-[13.5px] text-muted">A policy is a document where every clause works.</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* left rail — the three steps */}
        <div className="w-64 shrink-0 pt-2">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">The steps</div>
          <ul className="space-y-0.5">
            {STEP_TITLES.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'current' : 'next'
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      if (i < step) setStep(i)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors',
                      state === 'done' ? 'hover:bg-card2' : 'cursor-default',
                    )}
                  >
                    {state === 'done' ? (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green text-card">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : state === 'current' ? (
                      <span className="h-5 w-5 shrink-0 rounded-full border-[3px] border-accent bg-card" />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-full border-2 border-line bg-card" />
                    )}
                    <span
                      className={cn(
                        'text-[13px]',
                        state === 'current'
                          ? 'font-bold text-ink'
                          : state === 'done'
                            ? 'font-medium text-ink-soft'
                            : 'font-medium text-muted',
                      )}
                    >
                      {i + 1} · {s}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-6 px-2 text-[11.5px] text-muted">Draft saves itself ✓</p>

          {/* what you started from */}
          {tpl && (
            <Card className="mt-5 p-4">
              <div className="text-[13px] font-bold tracking-tight">{genName || tpl.name}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Pill tone="outline">{genArea}</Pill>
                <span className="text-[11.5px] font-semibold text-muted">
                  {genClauses.length} {genClauses.length === 1 ? 'clause' : 'clauses'}
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* right — the current step */}
        <div className="min-w-0 flex-1">
          <Card className="p-7">
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Step {step + 1} of 3
            </div>
            <h2 className="font-display text-[24px] font-medium leading-tight tracking-tight">{STEP_TITLES[step]}</h2>
            {STEP_HINTS[step] && <p className="mt-1 text-[13px] text-muted">{STEP_HINTS[step]}</p>}
            <div className="mt-6">{stepBody()}</div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
              <Btn variant="ghost" onClick={() => (step === 0 ? navigate('/rules') : setStep(step - 1))}>
                Back
              </Btn>
              {step < 2 ? (
                <Btn variant="dark" disabled={step === 0 && tpl == null} onClick={() => setStep(step + 1)}>
                  Continue
                </Btn>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Btn variant="outline" onClick={() => saveGen('Draft')}>
                    Save draft
                  </Btn>
                  <Btn variant="dark" onClick={() => saveGen('Waiting for approval')}>
                    Send for approval
                  </Btn>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
