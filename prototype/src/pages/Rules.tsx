/**
 * Rules & flows — Journey 3 + the parent→child enforcement model made visible.
 * A rule lives at exactly one level (Platform / Your portfolio / This company)
 * and lands on every company below it — live, never copied. This page shows
 * that: parent rules arrive read-only ("from above"), reach lines recompute as
 * companies join or pause, and every rule carries its full change record.
 */
import { Fragment, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  History,
  Landmark,
  Layers,
  Lock,
  Pencil,
  PencilLine,
  Play,
  Plus,
  Sparkles,
  SlidersHorizontal,
  Users,
  X,
  Zap,
  Calculator,
} from 'lucide-react'
import {
  Avatar,
  Btn,
  Card,
  Drawer,
  Field,
  Input,
  Pill,
  Progress,
  SectionTitle,
  Segmented,
  Select,
  SentenceChip,
  Stat,
  Timeline,
  Toggle,
  statusTone,
} from '../ui'
import { useApp } from '../store'
import FlowsView from './Flows'
import PoliciesStudio from './PoliciesStudio'
import { Pipeline } from '../components/Pipeline'
import {
  APPROVER_OPTIONS,
  EXTRA_DIMENSIONS,
  PEOPLE,
  TEAM_OPTIONS,
  TEAM_SIGN_SPLIT,
  WHERE_OPTIONS,
  WHO_OPTIONS,
  centralTeamLabel,
  coverageFor,
  extendedHeadcount,
  headcountFor,
  holderFor,
  reachFor,
  signStatsFor,
  unroutableFor,
  type ChainResolution,
  type ChildControl,
  type FlowStep,
  type Rule,
  type RuleLevel,
  type RuleStatus,
} from '../data'
import { cn } from '../lib'

const CATEGORIES = ['Time off', 'Attendance', 'Documents', 'Onboarding', 'Pay', 'Exits'] as const
const NOTIFY_OPTIONS = ['Person', 'Manager', 'HR'] as const

/* ── plain-language labels ⇄ data values ── */

type LevelLabel = 'Platform' | 'Your portfolio' | 'This company'
const LEVEL_OF_LABEL: Record<LevelLabel, RuleLevel> = {
  Platform: 'Platform',
  'Your portfolio': 'Portfolio',
  'This company': 'Company',
}
const LABEL_OF_LEVEL: Record<RuleLevel, LevelLabel> = {
  Platform: 'Platform',
  Portfolio: 'Your portfolio',
  Company: 'This company',
}

type ControlLabel = 'Use as-is' | 'Can adjust' | 'Opt in'
const CONTROL_CHOICES = ['Use as-is', 'Can adjust', 'Opt in'] as const
const CONTROL_OF_LABEL: Record<ControlLabel, ChildControl> = {
  'Use as-is': 'locked',
  'Can adjust': 'adjustable',
  'Opt in': 'optional',
}
const LABEL_OF_CONTROL: Record<ChildControl, ControlLabel> = {
  locked: 'Use as-is',
  adjustable: 'Can adjust',
  optional: 'Opt in',
}
const CONTROL_EXPLAINER: Record<ChildControl, string> = {
  locked: "Compliance-grade. Children can't change a word.",
  adjustable: 'Children may tighten or localise — never weaken.',
  optional: 'A starting point. Nothing runs until a company adopts it.',
}

/* whose people fill the approver hats — plain labels ⇄ data values */
type DecideLabel = 'Their own people' | 'Your central team'
const DECIDE_CHOICES = ['Their own people', 'Your central team'] as const
const DECIDE_OF_LABEL: Record<DecideLabel, ChainResolution> = {
  'Their own people': 'local',
  'Your central team': 'central',
}
const LABEL_OF_DECIDE: Record<ChainResolution, DecideLabel> = {
  local: 'Their own people',
  central: 'Your central team',
}

/** click-to-cycle through a chip's options */
function next(options: readonly string[], current: string): string {
  return options[(options.indexOf(current) + 1) % options.length]
}

/* ── what kind of rule is it — words people sign, a trigger, or a number ── */

type RuleKind = 'paper' | 'trigger' | 'number'
const KIND_CHOICES = ['Words people sign', 'It fires on a trigger', 'It sets a number'] as const
type KindLabel = (typeof KIND_CHOICES)[number]
const KIND_OF_LABEL: Record<KindLabel, RuleKind> = {
  'Words people sign': 'paper',
  'It fires on a trigger': 'trigger',
  'It sets a number': 'number',
}
const LABEL_OF_KIND: Record<RuleKind, KindLabel> = {
  paper: 'Words people sign',
  trigger: 'It fires on a trigger',
  number: 'It sets a number',
}

/* ── who says yes — nothing, an existing flow, or steps built right here ── */

type ApprovalMode = 'none' | 'flow' | 'steps'
const SAYS_CHOICES = ['It just runs', 'Use a flow', 'Build the steps'] as const
type SaysLabel = (typeof SAYS_CHOICES)[number]
const MODE_OF_SAYS: Record<SaysLabel, ApprovalMode> = {
  'It just runs': 'none',
  'Use a flow': 'flow',
  'Build the steps': 'steps',
}
const SAYS_OF_MODE: Record<ApprovalMode, SaysLabel> = {
  none: 'It just runs',
  flow: 'Use a flow',
  steps: 'Build the steps',
}

const FEED_OPTIONS = ['Payroll (Phase II)', 'Offer letters', 'Tax statements', 'Leave balances'] as const
const REVIEW_OPTIONS = ['—', 'every 6 months', 'every 12 months', 'every 24 months'] as const

/* precedence, made visible at authoring time — higher level wins where they overlap */
const PRECEDENCE: Record<RuleLevel, number> = { Platform: 3, Portfolio: 2, Company: 1 }

const dedupe = (xs: string[]): string[] => [...new Set(xs)]

/** best-effort money parse — "₹2,00,000" → 200000, "₹20L" → 2000000 */
function moneyOf(raw: string): number {
  const flat = raw.replace(/[,\s]/g, '')
  const m = flat.match(/(\d+(?:\.\d+)?)(L)?/i)
  if (!m) return NaN
  return parseFloat(m[1]) * (m[2] ? 100000 : 1)
}

/* ── the step builder — local to this file, full sophistication ── */

const DEADLINES = ['within 1 day', 'within 2 days', 'within 3 days', 'within 5 days'] as const
const AFTER_OPTIONS: readonly string[] = ['1 day', '2 days', '3 days', '5 days']
const COND_FACTS: readonly string[] = ['the claim', 'the offer', 'the amount', 'the request']
const COND_OPS = ['is above', 'is below'] as const

/** a step being built — decide is 'one' | 'all' | '2' | '3'… ("any k of n is enough") */
type DraftStep = {
  roles: string[]
  decide: string
  sla: string
  remind: boolean
  /** the if-they're-quiet ladder, in order */
  ladder: { after: string; to: string }[]
  /** structured only-when — fact '' means it always runs */
  fact: string
  op: string
  value: string
}

function freshStep(): DraftStep {
  return { roles: ['Manager'], decide: 'one', sla: 'within 1 day', remind: false, ladder: [], fact: '', op: 'is above', value: '' }
}

/** seed a draft back from a saved step (edit mode) */
function stepToDraft(s: FlowStep): DraftStep {
  const m = s.onlyWhen?.match(/^(.+?)\s+(is above|is below)\s+(.+)$/)
  return {
    roles: [...s.roles],
    decide: s.quorum && s.quorum < s.roles.length ? String(s.quorum) : s.mode,
    sla: s.sla,
    remind: s.remind ?? false,
    ladder: s.escalations
      ? s.escalations.map((e) => ({ after: e.after, to: e.to }))
      : s.escalateTo
        ? [{ after: '1 day', to: s.escalateTo }]
        : [],
    fact: m ? m[1] : s.onlyWhen ? 'the claim' : '',
    op: m ? m[2] : 'is above',
    value: m ? m[3] : (s.onlyWhen ?? ''),
  }
}

function draftsToSteps(drafts: DraftStep[]): FlowStep[] {
  return drafts
    .filter((d) => d.roles.length > 0)
    .map((d, i) => {
      const q = Number(d.decide)
      const ladder = d.ladder.filter((l) => l.to !== '')
      return {
        id: 's' + (i + 1),
        roles: [...d.roles],
        mode: d.decide === 'one' ? ('one' as const) : ('all' as const),
        quorum: !isNaN(q) && q > 0 && q < d.roles.length ? q : undefined,
        sla: d.sla,
        remind: d.remind || undefined,
        escalateTo: ladder[0]?.to,
        escalations: ladder.length > 0 ? ladder.map((l) => ({ after: l.after, to: l.to })) : undefined,
        onlyWhen: d.fact !== '' && d.value.trim() !== '' ? `${d.fact} ${d.op} ${d.value.trim()}` : undefined,
      }
    })
}

/** the full builder: roles side by side, how many must say yes, deadlines,
 *  nudges, the if-they're-quiet ladder, and an only-when condition */
function StepBuilder({ steps, onChange }: { steps: DraftStep[]; onChange: (next: DraftStep[]) => void }) {
  const patchStep = (i: number, p: Partial<DraftStep>) =>
    onChange(steps.map((s, j) => (j === i ? { ...s, ...p } : s)))
  const removeStep = (i: number) => onChange(steps.filter((_, j) => j !== i))
  return (
    <div>
      {steps.map((s, i) => {
        const nextRole = APPROVER_OPTIONS.find((o) => !s.roles.includes(o))
        const n = s.roles.length
        return (
          <Fragment key={i}>
            {i > 0 && (
              <div className="flex justify-center py-1.5">
                <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted" />
              </div>
            )}
            <div className="rounded-2xl border border-line p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Step {i + 1}</span>
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

              {/* who wears the hats on this step */}
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
                      onClick={() => {
                        const roles = s.roles.filter((x) => x !== r)
                        const q = Number(s.decide)
                        patchStep(i, {
                          roles,
                          decide: roles.length <= 1 ? 'one' : !isNaN(q) && q >= roles.length ? 'all' : s.decide,
                        })
                      }}
                      className="text-muted transition-colors hover:text-red"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {nextRole && (
                  <button
                    type="button"
                    onClick={() => patchStep(i, { roles: [...s.roles, nextRole] })}
                    className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    + role
                  </button>
                )}
              </div>

              {/* several people on one step — how many must say yes */}
              {n > 1 && (
                <div className="mt-2.5">
                  <Field label="How many must say yes?">
                    <Select value={s.decide} onChange={(e) => patchStep(i, { decide: e.target.value })}>
                      <option value="one">any one of them</option>
                      <option value="all">all of them</option>
                      {Array.from({ length: Math.max(0, n - 2) }, (_, k) => k + 2).map((k) => (
                        <option key={k} value={String(k)}>
                          any {k} of {n} is enough
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              )}

              <div className="mt-3 grid items-end gap-3 sm:grid-cols-2">
                <Field label="Deadline">
                  <Select value={s.sla} onChange={(e) => patchStep(i, { sla: e.target.value })}>
                    {!DEADLINES.includes(s.sla as (typeof DEADLINES)[number]) && <option value={s.sla}>{s.sla}</option>}
                    {DEADLINES.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
                <div className="pb-2">
                  <Toggle on={s.remind} onChange={(v) => patchStep(i, { remind: v })} label="Nudge at 50% and 75%" />
                </div>
              </div>

              {/* the if-they're-quiet ladder, rung by rung */}
              <div className="mt-3">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">If they're quiet</span>
                {s.ladder.length === 0 && (
                  <p className="text-[12px] italic text-muted">Nothing — it just waits with them.</p>
                )}
                <div className="space-y-2">
                  {s.ladder.map((rung, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <span className="shrink-0 text-[12px] text-muted">after</span>
                      <div className="w-28 shrink-0">
                        <Select
                          value={rung.after}
                          onChange={(e) =>
                            patchStep(i, {
                              ladder: s.ladder.map((l, lj) => (lj === ri ? { ...l, after: e.target.value } : l)),
                            })
                          }
                        >
                          {!AFTER_OPTIONS.includes(rung.after) && <option value={rung.after}>{rung.after}</option>}
                          {AFTER_OPTIONS.map((a) => (
                            <option key={a}>{a}</option>
                          ))}
                        </Select>
                      </div>
                      <span className="shrink-0 text-[12px] text-muted">it moves to</span>
                      <div className="min-w-0 flex-1">
                        <Select
                          value={rung.to}
                          onChange={(e) =>
                            patchStep(i, {
                              ladder: s.ladder.map((l, lj) => (lj === ri ? { ...l, to: e.target.value } : l)),
                            })
                          }
                        >
                          {APPROVER_OPTIONS.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </Select>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove this hand-off"
                        onClick={() => patchStep(i, { ladder: s.ladder.filter((_, lj) => lj !== ri) })}
                        className="shrink-0 text-muted transition-colors hover:text-red"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    patchStep(i, {
                      ladder: [
                        ...s.ladder,
                        { after: AFTER_OPTIONS[Math.min(s.ladder.length, AFTER_OPTIONS.length - 1)], to: 'Dept head' },
                      ],
                    })
                  }
                  className="mt-2 rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                >
                  {s.ladder.length === 0 ? '+ If quiet, hand it on' : '+ If still quiet, hand it on'}
                </button>
              </div>

              {/* only when — the step runs only if this is true */}
              <div className="mt-3">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Only when (optional)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-44">
                    <Select value={s.fact} onChange={(e) => patchStep(i, { fact: e.target.value })}>
                      <option value="">— it always runs</option>
                      {s.fact !== '' && !COND_FACTS.includes(s.fact) && <option value={s.fact}>{s.fact}</option>}
                      {COND_FACTS.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </Select>
                  </div>
                  {s.fact !== '' && (
                    <>
                      <div className="w-32">
                        <Select value={s.op} onChange={(e) => patchStep(i, { op: e.target.value })}>
                          {COND_OPS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="w-32">
                        <Input
                          value={s.value}
                          onChange={(e) => patchStep(i, { value: e.target.value })}
                          placeholder="₹50,000"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Fragment>
        )
      })}
      <button
        type="button"
        onClick={() => onChange([...steps, freshStep()])}
        className="mt-3 rounded-full border border-dashed border-line px-3 py-1.5 text-[12px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
      >
        + Add a step
      </button>
    </div>
  )
}

function StepChip({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const look = 'rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold leading-none'
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cn(look, 'cursor-pointer transition-colors hover:bg-accent-soft')}>
        {children}
      </button>
    )
  return <span className={look}>{children}</span>
}

function SectionLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{children}</div>
      {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

/** where the rule is set — who controls it. Multi-company viewers see the
 *  owning company by NAME (an ambiguous "this company" means nothing in the
 *  all-companies view). */
function SetAtPill({
  level,
  owner,
  named,
}: {
  level: RuleLevel
  owner?: { name: string; accent: string }
  named?: boolean
}) {
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

/** what companies below may do with a parent rule */
function ChildControlPill({ control }: { control: ChildControl }) {
  if (control === 'locked')
    return (
      <Pill tone="neutral">
        <Lock className="h-3 w-3" /> Companies use it as-is
      </Pill>
    )
  if (control === 'adjustable')
    return (
      <Pill tone="neutral">
        <SlidersHorizontal className="h-3 w-3" /> Companies can adjust it
      </Pill>
    )
  return <Pill tone="neutral">Companies opt in</Pill>
}

export default function Rules() {
  const { persona, company, companies, myCompanies, rules, updateRule, addRule, flows, toast } = useApp()

  /* who may touch what: operator edits anything; portfolio edits portfolio +
     company; everyone else edits only their own company's rules */
  const canEdit = (r: Rule): boolean =>
    persona.id === 'operator' ? true : persona.id === 'portfolio' ? r.level !== 'Platform' : r.level === 'Company'

  const levelChoices: readonly LevelLabel[] =
    persona.id === 'operator'
      ? ['Platform', 'Your portfolio', 'This company']
      : persona.id === 'portfolio'
        ? ['Your portfolio', 'This company']
        : []

  /* ── view switch: policies (the composed form) vs rules vs the flows that route them ── */
  const [view, setView] = useState<'Policies' | 'Rules' | 'Approval flows'>('Policies')

  /* ── composer state ── */
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Rule['category']>('Time off')
  const [levelLabel, setLevelLabel] = useState<LevelLabel>('This company')
  const [controlLabel, setControlLabel] = useState<ControlLabel>('Use as-is')
  const [who, setWho] = useState<string>(WHO_OPTIONS[0])
  const [where, setWhere] = useState<string>(WHERE_OPTIONS[0])
  const [team, setTeam] = useState<string>(TEAM_OPTIONS[0])
  const [also, setAlso] = useState<{ dim: string; value: string }[]>([])
  const [notify, setNotify] = useState<string[]>([])
  const [decide, setDecide] = useState<ChainResolution>('local')
  /* what kind of rule — words people sign, a trigger, or a number */
  const [kind, setKind] = useState<RuleKind>('paper')
  const [docText, setDocText] = useState('')
  const [signRequired, setSignRequired] = useState(false)
  const [trigWhen, setTrigWhen] = useState('')
  const [trigThen, setTrigThen] = useState<string[]>([''])
  const [variants, setVariants] = useState<{ where: string; value: string }[]>([{ where: '', value: '' }])
  const [feeds, setFeeds] = useState<string[]>([])
  /* who says yes — nothing, an existing flow, or steps built right here */
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('none')
  const [flowChoice, setFlowChoice] = useState('')
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([freshStep()])
  /* when does it apply */
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [reviewEvery, setReviewEvery] = useState<string>('—')
  const [exceptions, setExceptions] = useState<string[]>([])
  const [exceptionInput, setExceptionInput] = useState('')
  /* try it before you turn it on */
  const [simPersonId, setSimPersonId] = useState('p5')
  const [simAmount, setSimAmount] = useState('')

  /* ── history drawer ── */
  const [historyId, setHistoryId] = useState<string | null>(null)
  const historyRule = rules.find((r) => r.id === historyId) ?? null

  /* ── rule detail drawer — the full picture: policy text + who has signed ── */
  const [detailId, setDetailId] = useState<string | null>(null)
  const detailRule = rules.find((r) => r.id === detailId) ?? null
  /* signing stats, scoped to what the viewer governs */
  const detailStats = detailRule
    ? signStatsFor(detailRule, companies).filter((s) => myCompanies.some((c) => c.id === s.companyId))
    : []
  const detailSigned = detailStats.reduce((n, s) => n + s.signed, 0)
  const detailTotal = detailStats.reduce((n, s) => n + s.total, 0)
  const detailPct = detailTotal > 0 ? Math.round((detailSigned / detailTotal) * 100) : 0

  /* ── who-wears-the-hat drawer ── */
  const [hat, setHat] = useState<{ ruleId: string; role: string } | null>(null)
  const hatRule = rules.find((r) => r.id === hat?.ruleId) ?? null
  const hatScope = hatRule
    ? hatRule.level === 'Platform'
      ? companies
      : companies.filter((c) => c.inPortfolio)
    : []

  const openNew = () => {
    setEditingId(null)
    setName('')
    setCategory('Time off')
    setLevelLabel('This company')
    setControlLabel('Use as-is')
    setWho(WHO_OPTIONS[0])
    setWhere(WHERE_OPTIONS[0])
    setTeam(TEAM_OPTIONS[0])
    setAlso([])
    setNotify([])
    setDecide('local')
    setKind('paper')
    setDocText('')
    setSignRequired(false)
    setTrigWhen('')
    setTrigThen([''])
    setVariants([{ where: '', value: '' }])
    setFeeds([])
    setApprovalMode('none')
    setFlowChoice(flows[0]?.id ?? '')
    setDraftSteps([freshStep()])
    setEffectiveFrom('')
    setReviewEvery('—')
    setExceptions([])
    setExceptionInput('')
    setSimAmount('')
    setOpen(true)
  }

  const openEdit = (r: Rule) => {
    setEditingId(r.id)
    setName(r.name)
    setCategory(r.category)
    setLevelLabel(LABEL_OF_LEVEL[r.level])
    setControlLabel(LABEL_OF_CONTROL[r.childControl])
    setWho(r.appliesTo.who)
    setWhere(r.appliesTo.where)
    setTeam(r.appliesTo.team)
    setAlso(r.appliesAlso ?? [])
    setNotify(r.notify)
    setDecide(r.resolution)
    /* the kind comes back from what the rule IS */
    setKind(r.automation ? 'trigger' : r.computes ? 'number' : 'paper')
    setDocText(r.doc?.summary ?? '')
    setSignRequired(r.doc?.requiresSignature ?? false)
    setTrigWhen(r.automation?.when ?? '')
    setTrigThen(r.automation && r.automation.then.length > 0 ? [...r.automation.then] : [''])
    setVariants(
      r.computes && r.computes.variants.length > 0
        ? r.computes.variants.map((v) => ({ ...v }))
        : [{ where: '', value: '' }],
    )
    setFeeds(r.computes ? [...r.computes.feeds] : [])
    /* who says yes — steps win, then the flow, then a plain chain becomes steps */
    setApprovalMode(r.steps && r.steps.length > 0 ? 'steps' : r.flowId ? 'flow' : r.chain.length > 0 ? 'steps' : 'none')
    setFlowChoice(r.flowId ?? flows[0]?.id ?? '')
    setDraftSteps(
      r.steps && r.steps.length > 0
        ? r.steps.map(stepToDraft)
        : r.chain.length > 0
          ? r.chain.map((role) => ({ ...freshStep(), roles: [role] }))
          : [freshStep()],
    )
    setEffectiveFrom(r.effectiveFrom ?? '')
    setReviewEvery(r.reviewEvery ?? '—')
    setExceptions(r.exceptions ?? [])
    setExceptionInput('')
    setSimAmount('')
    setOpen(true)
  }

  const toggleNotify = (n: string) =>
    setNotify((ns) => (ns.includes(n) ? ns.filter((x) => x !== n) : [...ns, n]))

  const toggleFeed = (f: string) =>
    setFeeds((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]))

  const addException = () => {
    const x = exceptionInput.trim()
    if (x !== '' && !exceptions.includes(x)) setExceptions((xs) => [...xs, x])
    setExceptionInput('')
  }

  /* composer derivations — live, so the blast radius is never a surprise.
     headcount stores the BASE sentence; every "and..." clause scales it. */
  const level = LEVEL_OF_LABEL[levelLabel]
  const childControl = CONTROL_OF_LABEL[controlLabel]
  const baseReach = reachFor(
    { level, ownerCompanyId: 'acme', headcount: headcountFor(who, where, team) },
    companies,
  )
  const composerReach = { ...baseReach, people: extendedHeadcount(baseReach.people, also) }

  /* who says yes, resolved live — the chain stays DERIVED so hats, reach and
     the can't-run warning keep working no matter how the steps were authored */
  const selectedFlow = flows.find((f) => f.id === flowChoice)
  const builtSteps = draftsToSteps(draftSteps)
  const liveSteps: FlowStep[] =
    approvalMode === 'steps' ? builtSteps : approvalMode === 'flow' ? (selectedFlow?.steps ?? []) : []
  const liveChain = dedupe(liveSteps.flatMap((s) => s.roles))

  /* precedence, visible while you author: a running rule of the same category
     at another level either sits above you (yours goes quiet) or below (yours wins) */
  const overlapping = rules.filter(
    (r) => r.status === 'Running' && r.category === category && r.level !== level && r.id !== editingId,
  )
  const aboveMe = overlapping
    .filter((r) => PRECEDENCE[r.level] > PRECEDENCE[level])
    .sort((a, b) => PRECEDENCE[b.level] - PRECEDENCE[a.level])[0]
  const belowMe = overlapping.filter((r) => PRECEDENCE[r.level] < PRECEDENCE[level])[0]
  const levelWord = (r: Rule): string =>
    r.level === 'Platform'
      ? 'platform-wide'
      : r.level === 'Portfolio'
        ? 'portfolio'
        : (companies.find((c) => c.id === r.ownerCompanyId)?.name ?? 'company')

  /* the simulation — a real person, a real amount, the resolved path */
  const simPerson = PEOPLE.find((p) => p.id === simPersonId) ?? PEOPLE[4]
  const companyNameOf = (id: string) => companies.find((c) => c.id === id)?.name ?? id
  const needsAmount = liveSteps.some((s) => s.onlyWhen && /amount|claim|offer/i.test(s.onlyWhen))
  type SimStatus = 'runs' | 'maybe' | 'skipped'
  const resolved: { step: FlowStep; status: SimStatus }[] = liveSteps.map((step) => {
    let status: SimStatus = 'runs'
    if (step.onlyWhen) {
      const threshold = moneyOf(step.onlyWhen)
      const amt = moneyOf(simAmount)
      if (simAmount.trim() === '' || isNaN(threshold) || isNaN(amt)) status = 'maybe'
      else {
        const below = /below|under/i.test(step.onlyWhen)
        status = (below ? amt < threshold : amt > threshold) ? 'runs' : 'skipped'
      }
    }
    return { step, status }
  })
  /* worst case before anyone is chased: each step's deadline + its first rung */
  const worstDays = resolved
    .filter((x) => x.status !== 'skipped')
    .reduce((days, { step }) => {
      const sla = Number(step.sla.match(/\d+/)?.[0] ?? 0)
      const rung = Number(step.escalations?.[0]?.after.match(/\d+/)?.[0] ?? 0)
      return days + sla + rung
    }, 0)

  const save = (status: RuleStatus) => {
    const existing = editingId ? rules.find((r) => r.id === editingId) : undefined
    const ruleName = name.trim() || 'Untitled rule'
    const fields = {
      name: ruleName,
      category,
      status,
      level,
      ownerCompanyId: level === 'Company' ? 'acme' : undefined,
      childControl,
      appliesTo: { who, where, team },
      appliesAlso: also.length > 0 ? also : undefined,
      headcount: headcountFor(who, where, team),
      /* ALWAYS derived from however the steps were authored */
      chain: liveChain,
      flowId: approvalMode === 'flow' && selectedFlow ? selectedFlow.id : undefined,
      steps: approvalMode === 'steps' && builtSteps.length > 0 ? builtSteps : undefined,
      effectiveFrom: effectiveFrom.trim() !== '' ? effectiveFrom.trim() : undefined,
      reviewEvery: reviewEvery === '—' ? undefined : reviewEvery,
      exceptions: exceptions.length > 0 ? exceptions : undefined,
      /* company-level rules: always the company's own people */
      resolution: level === 'Company' ? ('local' as const) : decide,
      notify,
      updated: 'just now',
      /* with policy text attached, the rule IS a document people read & sign */
      doc:
        kind === 'paper' && docText.trim()
          ? {
              summary: docText.trim(),
              sections: [{ title: 'The policy', body: docText.trim() }],
              requiresSignature: signRequired,
            }
          : undefined,
      /* the rule as a trigger — when X happens, do Y */
      automation:
        kind === 'trigger'
          ? {
              when: trigWhen.trim() || 'Something happens',
              then: trigThen.map((t) => t.trim()).filter((t) => t !== ''),
              firedThisWeek: existing?.automation?.firedThisWeek ?? 0,
            }
          : undefined,
      /* the rule as a number — variants by place, read by other parts */
      computes:
        kind === 'number'
          ? {
              what: ruleName,
              variants: variants
                .map((v) => ({ where: v.where.trim(), value: v.value.trim() }))
                .filter((v) => v.where !== '' || v.value !== ''),
              feeds,
            }
          : undefined,
    }
    if (editingId) {
      updateRule(editingId, {
        ...fields,
        history: [
          ...(existing?.history ?? []),
          { who: persona.name, what: 'Changed: updated who it covers / approval steps', when: 'today' },
        ],
      })
    } else {
      addRule({
        id: 'r' + (rules.length + 1),
        ...fields,
        history: [
          {
            who: persona.name,
            what:
              level === 'Company'
                ? 'Created for ' + company.name
                : 'Created at ' + (level === 'Platform' ? 'platform' : 'portfolio') + ' level',
            when: 'today',
          },
        ],
      })
    }
    toast(
      status === 'Draft'
        ? 'Saved as a draft — nothing runs until you send it'
        : 'Sent — reviewers usually reply within 2 days',
    )
    setOpen(false)
  }

  /** every lifecycle click goes on the record */
  /** the audit names the scope: subsets list companies, never just a count */
  const scopeNames = (r: Rule): string => {
    const inScope =
      r.level === 'Platform'
        ? companies
        : r.level === 'Portfolio'
          ? companies.filter((c) => c.inPortfolio)
          : companies.filter((c) => c.id === (r.ownerCompanyId ?? 'acme'))
    if (r.level === 'Platform') return `all ${inScope.length} companies`
    return inScope.map((c) => c.name).join(', ')
  }

  const act = (r: Rule, status: RuleStatus, what: string, msg: string) => {
    const reach = reachFor(r, companies)
    const event =
      status === 'Running'
        ? `${what} — in ${scopeNames(r)} · ${reach.people} people`
        : what
    updateRule(r.id, {
      status,
      updated: 'just now',
      history: [...r.history, { who: persona.name, what: event, when: 'just now' }],
    })
    toast(msg)
  }

  const running = rules.filter((r) => r.status === 'Running').length
  const fromAboveCount = rules.filter((r) => r.level !== 'Company').length
  const drafts = rules.filter((r) => r.status === 'Draft').length

  const fromAbove = rules.filter((r) => r.level !== 'Company')
  const ownRules = rules.filter((r) => r.level === 'Company')

  /* parent rules whose landing we can measure — running only, drafts excluded */
  const landing = rules.filter((r) => r.level !== 'Company' && r.status === 'Running')

  const ruleCard = (r: Rule) => {
    const editable = canEdit(r)
    const reach = reachFor(r, companies)
    const cardFlow = r.flowId ? flows.find((f) => f.id === r.flowId) : undefined
    /* hats are clickable for multi-company viewers when each company fills them itself */
    const hatsClickable = persona.multiCompany && r.level !== 'Company' && r.resolution === 'local'
    const stuck = persona.multiCompany ? unroutableFor(r, companies) : []
    const stuckNames = stuck.map((id) => companies.find((c) => c.id === id)?.name ?? id).join(', ')
    const stuckRoles = r.chain.filter((role) => stuck.some((id) => !holderFor(id, role))).join(' + ')
    return (
      <Card key={r.id} className="p-5" onClick={() => setDetailId(r.id)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold tracking-tight">{r.name}</span>
          <SetAtPill
            level={r.level}
            named={persona.multiCompany}
            owner={companies.find((c) => c.id === r.ownerCompanyId)}
          />
          <Pill tone="outline">{r.category}</Pill>
          <Pill tone={statusTone(r.status)} dot>
            {r.status}
          </Pill>
          {r.effectiveFrom && <Pill tone="amber">from {r.effectiveFrom}</Pill>}
          {r.level !== 'Company' && <ChildControlPill control={r.childControl} />}
          <span className="ml-auto text-[12px] text-muted">
            {r.reviewEvery && <span>review {r.reviewEvery} · </span>}updated {r.updated}
          </span>
          <ChevronRight className="h-4 w-4 text-muted/60" />
        </div>

        {/* the sentence — always visible; "and..." clauses keep it a sentence
            no matter how precise it gets; reach is live from store companies */}
        <p className="mt-3 text-[13.5px]">
          Applies to <b className="text-accent-ink">{r.appliesTo.who}</b> in{' '}
          <b className="text-accent-ink">{r.appliesTo.where}</b> ·{' '}
          <b className="text-accent-ink">{r.appliesTo.team}</b>
          {(r.appliesAlso ?? []).map((c) => (
            <span key={c.dim}>
              {' '}
              and <b className="text-accent-ink">{c.value}</b>
            </span>
          ))}{' '}
          {r.level === 'Company' ? (
            <span className="font-bold">→ {extendedHeadcount(r.headcount, r.appliesAlso)} people</span>
          ) : (
            <span>
              · Runs in <b>{reach.companies} companies</b> →{' '}
              <b>{extendedHeadcount(reach.people, r.appliesAlso)} people</b>
            </span>
          )}
        </p>

        {/* carve-outs, in plain words */}
        {r.exceptions && r.exceptions.length > 0 && (
          <p className="mt-1 text-[12px] text-muted">Except: {r.exceptions.join(' · ')}</p>
        )}

        {/* the rule as a TRIGGER: when X → then Y; every firing opens a ticket */}
        {r.automation && (
          <div className="mt-3 rounded-2xl bg-card2/70 px-4 py-3">
            <p className="text-[12.5px] leading-relaxed">
              <Zap className="mr-1 inline h-3.5 w-3.5 text-accent-ink" />
              <b>When</b> {r.automation.when} → {r.automation.then[0]}
              {r.automation.then.length > 1 && (
                <span className="text-muted"> · +{r.automation.then.length - 1} more steps</span>
              )}
            </p>
            <p className="mt-1 text-[11.5px] font-semibold text-accent-ink">
              Fired {r.automation.firedThisWeek}× this week → {r.automation.firedThisWeek}{' '}
              {r.automation.firedThisWeek === 1 ? 'ticket' : 'tickets'} to {r.chain[0] ?? 'no one'} — nothing
              happens without a yes.
            </p>
          </div>
        )}

        {/* the rule as a NUMBER: it sets a value the rest of the system reads */}
        {r.computes && (
          <div className="mt-3 rounded-2xl bg-card2/70 px-4 py-3">
            <p className="text-[12.5px] leading-relaxed">
              <Calculator className="mr-1 inline h-3.5 w-3.5 text-accent-ink" />
              Sets <b>{r.computes.what}</b>:{' '}
              {r.computes.variants.map((v, i) => (
                <span key={v.where}>
                  {i > 0 && <span className="text-muted"> · </span>}
                  <b className="text-accent-ink">{v.where}</b> → <b>{v.value}</b>
                </span>
              ))}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">Read by: {r.computes.feeds.join(' · ')}</p>
          </div>
        )}

        {/* the pipeline — its chips act on their own, never open the detail */}
        <div onClick={(e) => e.stopPropagation()}>
          {r.steps && r.steps.length > 0 ? (
            <div className="mt-3">
              <Pipeline steps={r.steps} start="It fires" />
            </div>
          ) : cardFlow ? (
            <div className="mt-3">
              <Pipeline steps={cardFlow.steps} />
              <button
                type="button"
                onClick={() => setView('Approval flows')}
                className="mt-1.5 block text-[11.5px] font-medium text-muted transition-colors hover:text-accent-ink"
              >
                routes via the “{cardFlow.name}” flow →
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StepChip>{r.automation ? 'Rule fires' : 'Person asks'}</StepChip>
              <ArrowRight className="h-3 w-3 text-muted" />
              {r.chain.length === 0 ? (
                <>
                  <span className="text-[12px] italic text-muted">runs instantly — no approvals</span>
                  <ArrowRight className="h-3 w-3 text-muted" />
                </>
              ) : (
                r.chain.map((step) => (
                  <Fragment key={step}>
                    <StepChip onClick={hatsClickable ? () => setHat({ ruleId: r.id, role: step }) : undefined}>
                      {step}
                    </StepChip>
                    <ArrowRight className="h-3 w-3 text-muted" />
                  </Fragment>
                ))
              )}
              <StepChip>Done ✓</StepChip>
            </div>
          )}
        </div>

        {/* who fills the hats — each company's own people, or one central desk */}
        {r.chain.length > 0 && r.level !== 'Company' && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
            {r.resolution === 'local' ? (
              <>
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  Hats filled by each company — Beta asks → Beta's {r.chain[0]} decides.
                </span>
              </>
            ) : (
              <>
                <Landmark className="h-4 w-4 shrink-0" />
                <span>One desk for everyone — {centralTeamLabel(r.level)} decides.</span>
              </>
            )}
          </p>
        )}

        {/* somewhere in scope, a hat has no head — the rule can't run there */}
        {stuck.length > 0 && (
          <div className="mt-2 flex min-w-0 items-center gap-1.5 rounded-xl bg-accent-soft px-3 py-2 text-[12px] font-medium text-accent-ink">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Can't run in {stuckNames} yet — nobody wears the {stuckRoles} hat there.
            </span>
          </div>
        )}

        {/* precedence outcome, never the mechanism */}
        {r.shadowedBy && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone="amber">Quiet</Pill>
            <span className="text-[12px] text-muted">
              Covered by: {r.shadowedBy} — this rule stays out of the way.
            </span>
          </div>
        )}

        {/* actions act on their own, never open the detail */}
        <div onClick={(e) => e.stopPropagation()}>
        {editable ? (
          /* one primary action per state */
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {r.status === 'Draft' && (
              <Btn
                variant="dark"
                size="sm"
                onClick={() =>
                  act(r, 'Waiting for approval', 'Sent for approval', 'Sent — reviewers usually reply within 2 days')
                }
              >
                Send for approval
              </Btn>
            )}
            {r.status === 'Waiting for approval' && (
              <Btn
                variant="amber"
                size="sm"
                onClick={() => act(r, 'Running', 'Approved and running', 'Running — applies from today')}
              >
                Approve &amp; run
              </Btn>
            )}
            {r.status === 'Running' && (
              <Btn
                variant="ghost"
                size="sm"
                onClick={() =>
                  act(r, 'Paused', 'Paused — nothing new will trigger', 'Paused — nothing new will trigger')
                }
              >
                Pause
              </Btn>
            )}
            {r.status === 'Paused' && (
              <Btn variant="outline" size="sm" onClick={() => act(r, 'Running', 'Resumed', 'Back on')}>
                Resume
              </Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => openEdit(r)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => setHistoryId(r.id)}>
              <History className="h-3.5 w-3.5" /> History
            </Btn>
          </div>
        ) : (
          /* set above you — read-only, by design */
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-muted">
            <Lock className="h-3.5 w-3.5" />
            <span>Set above you — runs here automatically.</span>
            {r.childControl === 'adjustable' && (
              <Btn
                variant="ghost"
                size="sm"
                onClick={() =>
                  toast('Your adjusted copy starts from the parent baseline — it can tighten, never weaken')
                }
              >
                Adjust for {company.name}
              </Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => setHistoryId(r.id)}>
              <History className="h-3.5 w-3.5" /> History
            </Btn>
          </div>
        )}
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* hero */}
      <Card glow className="mb-5 p-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Rules &amp; flows</div>
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-tight">
              Set it once. It runs itself.
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted">
              Every rule has the same shape — who it covers, who approves, who hears about it.
            </p>
            <div className="mt-4">
              <Segmented options={['Policies', 'Rules', 'Approval flows'] as const} value={view} onChange={setView} />
            </div>
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Play />} value={running} label="Running" />
            <Stat
              icon={<Layers />}
              value={fromAboveCount}
              label={persona.id === 'operator' ? 'Platform & portfolio' : 'Set above'}
            />
            <Stat icon={<PencilLine />} value={drafts} label="Drafts" />
            <Btn variant="dark" onClick={openNew}>
              <Plus className="h-4 w-4" /> New rule
            </Btn>
          </div>
        </div>
      </Card>

      {view === 'Policies' ? (
        <PoliciesStudio />
      ) : view === 'Approval flows' ? (
        <FlowsView />
      ) : (
        <>
          {/* how parent rules are landing — companies as rows with FULL NAMES,
              same geometry as the flow map: never make anyone decode an initial */}
          {(persona.id === 'operator' || persona.id === 'portfolio') && landing.length > 0 && (
            <Card className="mb-8 p-6">
              <SectionTitle hint="Inheritance and every local change, measured — not assumed.">
                Where they land
              </SectionTitle>
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div
                    className="grid items-center gap-2 border-b border-line/60 pb-2"
                    style={{ gridTemplateColumns: `1.3fr repeat(${landing.length}, 1fr)` }}
                  >
                    <div />
                    {landing.map((r) => (
                      <div
                        key={r.id}
                        className="px-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
                      >
                        {r.name}
                      </div>
                    ))}
                  </div>
                  {myCompanies.map((co) => (
                    <div
                      key={co.id}
                      className="grid items-center gap-2 border-b border-line/40 py-2.5 last:border-b-0"
                      style={{ gridTemplateColumns: `1.3fr repeat(${landing.length}, 1fr)` }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: co.accent }} />
                        <span className="truncate text-[12.5px] font-bold">{co.name}</span>
                        {co.status !== 'Live' && (
                          <Pill tone={statusTone(co.status)} className="shrink-0">
                            {co.status === 'Getting set up' ? 'setting up' : 'paused'}
                          </Pill>
                        )}
                      </div>
                      {landing.map((r) => {
                        const cv = coverageFor(r, companies).find((x) => x.companyId === co.id)
                        const noApprover = unroutableFor(r, companies).includes(co.id)
                        return (
                          <div key={r.id} className="flex justify-center">
                            {!cv ? (
                              <span className="text-[11px] text-muted">—</span>
                            ) : noApprover ? (
                              <Pill tone="amber">no approver</Pill>
                            ) : cv.state === 'Enforced' ? (
                              <Pill tone="green">✓ {cv.ack}%</Pill>
                            ) : cv.state === 'Adjusted' ? (
                              <Pill tone="amber">△ adjusted · {cv.ack}%</Pill>
                            ) : (
                              <Pill tone="neutral">… {cv.ack}%</Pill>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-[11.5px] text-muted">
                ✓ enforced · △ child adjusted it · % read-and-signed · “no approver” = a hat with no head there
              </p>
            </Card>
          )}

          {/* rules from a higher level — they land here live, never copied */}
          {fromAbove.length > 0 && (
            <div className="mb-8">
              <SectionTitle
                hint={
                  persona.id === 'operator'
                    ? 'One rule here lands on every company in scope — live, never copied.'
                    : 'Set at a higher level — they run here automatically, nothing to install.'
                }
              >
                {persona.id === 'operator' ? 'Platform & portfolio' : 'From above'}
              </SectionTitle>
              <div className="space-y-4">{fromAbove.map(ruleCard)}</div>
            </div>
          )}

          {/* rules owned at company level — for a parent, each one names its company */}
          <div>
            <SectionTitle
              hint={persona.multiCompany ? 'Each rule names the company it belongs to.' : 'Made here — yours to change.'}
            >
              {persona.multiCompany ? 'Company rules' : `${company.id === 'all' ? 'Acme Tech' : company.name}'s rules`}
            </SectionTitle>
            <div className="space-y-4">{ownRules.map(ruleCard)}</div>
          </div>
        </>
      )}

      {/* ── the composer ── */}
      <Drawer
        wide
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit rule' : 'New rule'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Btn variant="outline" onClick={() => save('Draft')}>
              Save as draft
            </Btn>
            <Btn variant="dark" onClick={() => save('Waiting for approval')}>
              Save &amp; send for approval
            </Btn>
          </div>
        }
      >
        <div className="space-y-7">
          {/* what kind of rule is it — the shape decides what you fill in */}
          <section>
            <SectionLabel hint="Words people sign, something that fires on its own, or a number the system reads.">
              What kind of rule is it?
            </SectionLabel>
            <Segmented options={KIND_CHOICES} value={LABEL_OF_KIND[kind]} onChange={(v) => setKind(KIND_OF_LABEL[v])} />

            {/* words people sign — the policy text, and whether everyone signs it */}
            {kind === 'paper' && (
              <div className="mt-4">
                <textarea
                  rows={3}
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder="What does the policy say? One short paragraph is enough for the prototype."
                  className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13.5px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                {docText.trim() !== '' && (
                  <div className="mt-3">
                    <Toggle on={signRequired} onChange={setSignRequired} label="Every employee must sign it" />
                    {signRequired && (
                      <p className="mt-2 text-[12px] text-muted">
                        It will land in every employee's Documents inbox across {composerReach.companies}{' '}
                        {composerReach.companies === 1 ? 'company' : 'companies'} — signing is tracked per company.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* it fires on a trigger — when X happens, then Y, in order */}
            {kind === 'trigger' && (
              <div className="mt-4 space-y-3.5">
                <Field label="When does it fire?">
                  <Input
                    value={trigWhen}
                    onChange={(e) => setTrigWhen(e.target.value)}
                    placeholder="e.g. someone checks in 5–10 minutes late, three times in a month"
                  />
                </Field>
                <div>
                  <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
                    Then what happens, in order
                  </span>
                  <div className="space-y-2">
                    {trigThen.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-card">
                          {i + 1}
                        </span>
                        <Input
                          value={t}
                          onChange={(e) => setTrigThen((ts) => ts.map((x, j) => (j === i ? e.target.value : x)))}
                          placeholder={
                            i === 0
                              ? 'e.g. a half day is proposed — HR decides'
                              : 'e.g. the person and their manager are told why'
                          }
                        />
                        {trigThen.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove step ${i + 1}`}
                            onClick={() => setTrigThen((ts) => ts.filter((_, j) => j !== i))}
                            className="shrink-0 text-muted transition-colors hover:text-red"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTrigThen((ts) => [...ts, ''])}
                    className="mt-2 rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    + Add a step
                  </button>
                  <p className="mt-2 text-[12px] text-muted">
                    Every firing opens a ticket in the approver's inbox — nothing happens silently.
                  </p>
                </div>
              </div>
            )}

            {/* it sets a number — the value by place, and who reads it */}
            {kind === 'number' && (
              <div className="mt-4 space-y-3.5">
                <div>
                  <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">The value, place by place</span>
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={v.where}
                          onChange={(e) =>
                            setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, where: e.target.value } : x)))
                          }
                          placeholder="Metro cities"
                        />
                        <Input
                          value={v.value}
                          onChange={(e) =>
                            setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                          }
                          placeholder="50% of basic pay"
                        />
                        {variants.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove variant ${i + 1}`}
                            onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}
                            className="shrink-0 text-muted transition-colors hover:text-red"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setVariants((vs) => [...vs, { where: '', value: '' }])}
                    className="mt-2 rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    + Add a variant
                  </button>
                </div>
                <div>
                  <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Read by</span>
                  <div className="flex flex-wrap gap-1.5">
                    {FEED_OPTIONS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFeed(f)}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                          feeds.includes(f) ? 'bg-accent-soft text-accent-ink' : 'bg-card2 text-muted hover:text-ink',
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] text-muted">
                    Other parts of the system read this number — change it here, it changes everywhere.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* where it lives — who controls it */}
          <section>
            <SectionLabel hint="A rule set higher up lands on every company below it — live, never copied.">
              Where does it live?
            </SectionLabel>
            {levelChoices.length > 0 ? (
              <Segmented options={levelChoices} value={levelLabel} onChange={setLevelLabel} />
            ) : (
              <p className="text-[13px] font-semibold">Lives in {company.name}</p>
            )}
          </section>

          {/* posture toward the companies below */}
          {level !== 'Company' && (
            <section>
              <SectionLabel>What can companies below do?</SectionLabel>
              <Segmented options={CONTROL_CHOICES} value={controlLabel} onChange={setControlLabel} />
              <p className="mt-2 text-[12px] text-muted">{CONTROL_EXPLAINER[childControl]}</p>
            </section>
          )}

          {/* what is it */}
          <section>
            <SectionLabel>What is it</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-[1fr,180px]">
              <Field label="Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Work from anywhere"
                />
              </Field>
              <Field label="Category">
                <Select value={category} onChange={(e) => setCategory(e.target.value as Rule['category'])}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* precedence, visible while you author — updates live with category & level */}
            {(aboveMe || belowMe) && (
              <div className="mt-3 space-y-2.5">
                {aboveMe && (
                  <div className="flex items-start gap-2 rounded-2xl bg-accent-soft/70 px-4 py-3 text-[12.5px] font-medium text-accent-ink">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Heads up — “{aboveMe.name}” ({levelWord(aboveMe)}) already covers{' '}
                      {category.toLowerCase()} and sits above you. Yours will stay quiet where they overlap.
                    </span>
                  </div>
                )}
                {belowMe && (
                  <div className="flex items-start gap-2 rounded-2xl bg-card2/70 px-4 py-3 text-[12.5px] font-medium text-ink-soft">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Yours will win — “{belowMe.name}” ({levelWord(belowMe)}) goes quiet where you overlap.
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* who it applies to — the sentence builder. It stays a SENTENCE no
              matter how precise it gets: every new dimension is one more
              "and..." clause, never a filter grid. */}
          <section>
            <SectionLabel hint="Tap a highlighted part to change it — add clauses for precision.">
              Who does this apply to
            </SectionLabel>
            <p className="text-[15px] leading-loose">
              Applies to{' '}
              <SentenceChip onClick={() => setWho(next(WHO_OPTIONS, who))}>{who}</SentenceChip> in{' '}
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
            <div className="mt-3 font-display text-[30px] font-medium leading-none tracking-tight">
              → {composerReach.companies} {composerReach.companies === 1 ? 'company' : 'companies'} ·{' '}
              {composerReach.people} {composerReach.people === 1 ? 'person' : 'people'}
            </div>
            <p className="mt-1.5 text-[12px] text-muted">
              live reach — every clause narrows it, so you always see exactly who's covered
            </p>
          </section>

          {/* who says yes — nothing, an existing flow, or steps built right here */}
          <section>
            <SectionLabel hint="No steps at all, an existing flow, or steps built right here.">Who says yes</SectionLabel>
            <Segmented
              options={SAYS_CHOICES}
              value={SAYS_OF_MODE[approvalMode]}
              onChange={(v) => {
                const m = MODE_OF_SAYS[v]
                setApprovalMode(m)
                if (m === 'flow' && !flows.some((f) => f.id === flowChoice)) setFlowChoice(flows[0]?.id ?? '')
              }}
            />
            {approvalMode === 'none' && (
              <p className="mt-2 text-[12px] italic text-muted">
                No steps — it just runs. Fine for low-stakes rules.
              </p>
            )}
            {approvalMode === 'flow' && (
              <div className="mt-3 space-y-3">
                <Select value={flowChoice} onChange={(e) => setFlowChoice(e.target.value)}>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.routes}
                    </option>
                  ))}
                </Select>
                {selectedFlow ? (
                  <div className="rounded-2xl bg-card2/50 p-3.5">
                    <Pipeline steps={selectedFlow.steps} />
                  </div>
                ) : (
                  <p className="text-[12px] italic text-muted">No flows to pick from yet.</p>
                )}
              </div>
            )}
            {approvalMode === 'steps' && (
              <div className="mt-3">
                <StepBuilder steps={draftSteps} onChange={setDraftSteps} />
              </div>
            )}
          </section>

          {/* whose people fill those hats — only meaningful above company level */}
          {level !== 'Company' && liveChain.length > 0 && (
            <section>
              <SectionLabel hint="The steps above are hats, not people.">Whose people decide?</SectionLabel>
              <Segmented
                options={DECIDE_CHOICES}
                value={LABEL_OF_DECIDE[decide]}
                onChange={(v) => setDecide(DECIDE_OF_LABEL[v])}
              />
              <p className="mt-2 text-[12px] text-muted">
                {decide === 'local'
                  ? "Each company fills the hats itself — Acme asks, Acme's Finance decides."
                  : `One team decides for everyone — ${centralTeamLabel(level)}.`}
              </p>
            </section>
          )}

          {/* who hears */}
          <section>
            <SectionLabel>Who hears about it</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {NOTIFY_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNotify(n)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                    notify.includes(n)
                      ? 'bg-accent-soft text-accent-ink'
                      : 'bg-card2 text-muted hover:text-ink',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* when does it apply — a start date, a review rhythm, carve-outs */}
          <section>
            <SectionLabel hint="A start date, a review rhythm, and any carve-outs — in plain words.">
              When does it apply
            </SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Effective from">
                <Input
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  placeholder="e.g. 1 Aug 2026"
                />
              </Field>
              <Field label="Review it">
                <Select value={reviewEvery} onChange={(e) => setReviewEvery(e.target.value)}>
                  {REVIEW_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-3">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Except…</span>
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
            </div>
          </section>

          {/* simulate before publish — a real person, a real amount, the resolved path */}
          <section>
            <Card glow className="p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
                <Sparkles className="h-4 w-4" /> Try it before you turn it on
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pick a person">
                  <Select value={simPersonId} onChange={(e) => setSimPersonId(e.target.value)}>
                    {PEOPLE.slice(0, 8).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.dept}, {companyNameOf(p.companyId)}
                      </option>
                    ))}
                  </Select>
                </Field>
                {needsAmount && (
                  <Field label="Try an amount">
                    <Input
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      placeholder="₹75,000"
                    />
                  </Field>
                )}
              </div>
              <p className="mt-3.5 text-[13.5px] leading-relaxed">
                <b>{simPerson.name.split(' ')[0]}</b> ({simPerson.dept} · {companyNameOf(simPerson.companyId)})
                triggers “<b>{name.trim() || 'this rule'}</b>”
                {liveSteps.length === 0 ? (
                  <>
                    {' '}
                    → <b>approved instantly</b>.
                  </>
                ) : (
                  <> — the path:</>
                )}
              </p>
              {resolved.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  {resolved.map(({ step, status }, i) => (
                    <div
                      key={step.id}
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5',
                        status === 'runs' && 'bg-card2/70',
                        status === 'maybe' && 'border border-dashed border-line',
                        status === 'skipped' && 'bg-card2/40 opacity-60',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px]">
                        <span className="font-bold">{i + 1}.</span>
                        {step.roles.map((role) => {
                          const holder = holderFor(simPerson.companyId, role)
                          return (
                            <span key={role} className="inline-flex items-center gap-1.5 font-semibold">
                              {role}
                              {holder ? (
                                <span className="font-normal text-muted">— {holder}</span>
                              ) : (
                                <Pill tone="amber">no one yet</Pill>
                              )}
                            </span>
                          )
                        })}
                        {step.roles.length > 1 && (
                          <span className="text-[11.5px] font-semibold text-muted">
                            {step.quorum && step.quorum < step.roles.length
                              ? `any ${step.quorum} of ${step.roles.length} is enough`
                              : step.mode === 'all'
                                ? 'all of them'
                                : 'any one of them'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        ⏱ {step.sla}
                        {step.remind && <span> · nudges at 50/75%</span>}
                        {step.onlyWhen &&
                          (status === 'maybe' ? (
                            <span className="font-semibold text-accent-ink"> · only if {step.onlyWhen}</span>
                          ) : status === 'skipped' ? (
                            <span> · skipped — only when {step.onlyWhen}</span>
                          ) : (
                            <span> · runs — {step.onlyWhen}</span>
                          ))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {liveSteps.length > 0 && worstDays > 0 && (
                <p className="mt-2.5 text-[12px] font-semibold text-accent-ink">
                  Worst case ≈ {worstDays} days before anyone is chased.
                </p>
              )}
              <p className="mt-2 text-[12.5px]">
                {notify.length > 0 ? (
                  <>
                    Then <b>{notify.join(' + ')}</b> {notify.length === 1 ? 'gets' : 'get'} told.
                  </>
                ) : (
                  <>No one is told yet.</>
                )}
              </p>
              <p className="mt-2 text-[11.5px] text-muted">A worked example — it updates live as you change the rule.</p>
            </Card>
          </section>
        </div>
      </Drawer>

      {/* ── the rule's full picture: the policy text + who has signed ── */}
      <Drawer
        wide
        open={detailRule != null}
        onClose={() => setDetailId(null)}
        title={detailRule?.name ?? ''}
        footer={
          detailRule != null && (
            <div className="flex items-center justify-end gap-2">
              <Btn
                variant="ghost"
                onClick={() => {
                  const id = detailRule.id
                  setDetailId(null)
                  setHistoryId(id)
                }}
              >
                <History className="h-3.5 w-3.5" /> History
              </Btn>
              {canEdit(detailRule) && detailRule.status === 'Draft' && (
                <Btn
                  variant="dark"
                  onClick={() =>
                    act(
                      detailRule,
                      'Waiting for approval',
                      'Sent for approval',
                      'Sent — reviewers usually reply within 2 days',
                    )
                  }
                >
                  Send for approval
                </Btn>
              )}
              {canEdit(detailRule) && detailRule.status === 'Waiting for approval' && (
                <Btn
                  variant="amber"
                  onClick={() => act(detailRule, 'Running', 'Approved and running', 'Running — applies from today')}
                >
                  Approve &amp; run
                </Btn>
              )}
              {canEdit(detailRule) && detailRule.status === 'Running' && (
                <Btn
                  variant="outline"
                  onClick={() =>
                    act(detailRule, 'Paused', 'Paused — nothing new will trigger', 'Paused — nothing new will trigger')
                  }
                >
                  Pause
                </Btn>
              )}
              {canEdit(detailRule) && detailRule.status === 'Paused' && (
                <Btn variant="outline" onClick={() => act(detailRule, 'Running', 'Resumed', 'Back on')}>
                  Resume
                </Btn>
              )}
            </div>
          )
        }
      >
        {detailRule && (
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-2">
              <SetAtPill
                level={detailRule.level}
                named={persona.multiCompany}
                owner={companies.find((c) => c.id === detailRule.ownerCompanyId)}
              />
              <Pill tone={statusTone(detailRule.status)} dot>
                {detailRule.status}
              </Pill>
              <Pill tone="outline">{detailRule.category}</Pill>
            </div>

            {/* the policy text — when the rule IS a document */}
            <section>
              <SectionLabel>What it says</SectionLabel>
              {detailRule.doc ? (
                <div className="space-y-4">
                  <p className="text-[13.5px] font-semibold">{detailRule.doc.summary}</p>
                  {detailRule.doc.whatChanged && (
                    <div className="flex items-start gap-2 rounded-2xl bg-accent-soft/60 p-3.5 text-[12.5px] font-medium text-accent-ink">
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span>{detailRule.doc.whatChanged}</span>
                    </div>
                  )}
                  {detailRule.doc.sections.map((s) => (
                    <div key={s.title}>
                      <div className="mb-1 text-[13px] font-bold">{s.title}</div>
                      <p className="text-[13px] leading-relaxed text-muted">{s.body}</p>
                    </div>
                  ))}
                </div>
              ) : detailRule.automation || detailRule.computes ? null : (
                <p className="text-[13px] text-muted">No document attached — this rule is pure automation.</p>
              )}

              {/* the rule as a trigger — the full playbook, step by step */}
              {detailRule.automation && (
                <div className="space-y-3">
                  <p className="text-[13.5px] font-semibold">
                    <Zap className="mr-1 inline h-4 w-4 text-accent-ink" />
                    When {detailRule.automation.when}:
                  </p>
                  <ol className="space-y-2">
                    {detailRule.automation.then.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 rounded-2xl bg-card2 px-4 py-3 text-[13px] font-medium">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-card">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="text-[12px] text-muted">
                    Every firing opens a ticket in {detailRule.chain[0] ?? 'the approver'}'s inbox — fired{' '}
                    {detailRule.automation.firedThisWeek}× this week. Nothing happens without a yes.
                  </p>
                </div>
              )}

              {/* the rule as a number — variants by region, and who reads it */}
              {detailRule.computes && (
                <div className="space-y-3">
                  <p className="text-[13.5px] font-semibold">
                    <Calculator className="mr-1 inline h-4 w-4 text-accent-ink" />
                    {detailRule.computes.what}
                  </p>
                  <div className="space-y-2">
                    {detailRule.computes.variants.map((v) => (
                      <div key={v.where} className="flex items-center justify-between rounded-2xl bg-card2 px-4 py-3">
                        <span className="text-[13px] font-semibold">{v.where}</span>
                        <span className="text-[13px] font-bold text-accent-ink">{v.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] text-muted">
                    Other parts of the system read this number — {detailRule.computes.feeds.join(', ')} — so
                    changing it here changes them everywhere, after approval.
                  </p>
                </div>
              )}
            </section>

            {/* who has signed — scoped to what the viewer governs */}
            {detailRule.doc?.requiresSignature && (
              <section>
                <SectionLabel>Who has signed</SectionLabel>
                <div className="font-display text-[34px] font-medium leading-none tracking-tight">{detailPct}%</div>
                <p className="mt-1.5 text-[12px] text-muted">
                  {detailSigned} of {detailTotal} signed across{' '}
                  {detailStats.length === 1 ? 'your company' : `your ${detailStats.length} companies`}
                </p>
                {detailStats.length > 1 ? (
                  /* the parent's view — one row per company */
                  <div className="mt-4 space-y-2.5">
                    {detailStats.map((s) => {
                      const co = companies.find((c) => c.id === s.companyId)
                      if (!co) return null
                      return (
                        <div key={s.companyId} className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: co.accent }} />
                          <span className="w-24 shrink-0 truncate text-[13px] font-bold tracking-tight">{co.name}</span>
                          <Progress value={s.pct} tone={s.pct >= 80 ? 'green' : 'amber'} className="flex-1" />
                          <span className="text-[12px] font-bold">
                            {s.signed}/{s.total}
                          </span>
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={() => toast(`Reminder queued for ${s.total - s.signed} people at ${co.name}`)}
                          >
                            Nudge
                          </Btn>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* the HR-admin view — one row per team */
                  <div className="mt-4 space-y-2.5">
                    {TEAM_SIGN_SPLIT.map((t) => (
                      <div key={t.team} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 truncate text-[13px] font-bold tracking-tight">{t.team}</span>
                        <Progress value={t.pct} tone={t.pct >= 80 ? 'green' : 'amber'} className="flex-1" />
                        <span className="text-[12px] font-bold">{t.pct}%</span>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast(
                            `Reminder queued for ${detailTotal - detailSigned} people at ${
                              companies.find((c) => c.id === detailStats[0]?.companyId)?.name ?? 'your company'
                            }`,
                          )
                        }
                      >
                        Nudge
                      </Btn>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-[11.5px] text-muted">
                  People sign from their Documents inbox — every receipt lands in Activity.
                </p>
              </section>
            )}

            {/* where it runs — the live blast radius */}
            <section>
              <SectionLabel>Where it runs</SectionLabel>
              {(() => {
                const reach = reachFor(detailRule, companies)
                return (
                  <p className="text-[13.5px]">
                    Runs in <b>{reach.companies} {reach.companies === 1 ? 'company' : 'companies'}</b> →{' '}
                    <b>{reach.people} people</b>
                  </p>
                )
              })()}
              <p className="mt-1.5 text-[12.5px] text-muted">
                {detailRule.chain.length === 0
                  ? 'No approval steps — it runs instantly.'
                  : detailRule.resolution === 'central'
                    ? `One desk decides for everyone — ${centralTeamLabel(detailRule.level)}.`
                    : `Approvals go to ${detailRule.chain.join(', then ')} — each company's own people.`}
              </p>
            </section>
          </div>
        )}
      </Drawer>

      {/* ── the change record — who · what · when, on every rule ── */}
      <Drawer
        open={historyRule != null}
        onClose={() => setHistoryId(null)}
        title="Every change, on the record"
      >
        {historyRule && (
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-bold tracking-tight">{historyRule.name}</span>
              <SetAtPill level={historyRule.level} />
            </div>
            <Timeline
              steps={historyRule.history.map((h) => ({ label: h.what, at: h.who + ' · ' + h.when, done: true }))}
            />
            <p className="mt-6 text-[12px] leading-relaxed text-muted">
              Children inherit live — when a company joins, rules apply by themselves. That's why you see
              “joined — inherited automatically” here.
            </p>
          </div>
        )}
      </Drawer>

      {/* ── who wears this hat, company by company ── */}
      <Drawer
        open={hat != null && hatRule != null}
        onClose={() => setHat(null)}
        title={`Who wears the ${hat?.role ?? ''} hat?`}
      >
        {hat && hatRule && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-bold tracking-tight">{hatRule.name}</span>
              <SetAtPill level={hatRule.level} />
            </div>
            <ul className="space-y-2.5">
              {hatScope.map((c, i) => {
                const holder = holderFor(c.id, hat.role)
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-2xl border border-line/70 bg-card px-4 py-3"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.accent }} />
                    <span className="w-28 shrink-0 text-[13px] font-bold tracking-tight">{c.name}</span>
                    {holder ? (
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <Avatar name={holder} hue={i} size="sm" />
                        <span className="truncate text-[13px] font-semibold">{holder}</span>
                        <Pill tone="green" className="ml-auto shrink-0">
                          ready
                        </Pill>
                      </span>
                    ) : (
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <Pill tone="amber" className="shrink-0">
                          no one yet
                        </Pill>
                        <span className="truncate text-[12px] text-muted">
                          this rule can't run here until someone takes the hat
                        </span>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-5 text-[12px] leading-relaxed text-muted">
              One rule, many hats — each company fills the role with its own person. New people inherit the
              hat with the role, not by name.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
