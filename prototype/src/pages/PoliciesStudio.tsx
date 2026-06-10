/**
 * Policy Studio — BRD §E through the OpsMaven lens. A policy is a document of
 * CLAUSES, and every clause can WORK: signed, watched, reported, measured.
 * Mounted by Rules.tsx as the default view of "Rules & flows".
 */
import { Fragment, useState } from 'react'
import {
  Calculator,
  ChevronRight,
  Eye,
  FileSignature,
  GraduationCap,
  ListChecks,
  Lock,
  MessagesSquare,
  Plus,
  Sparkles,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  Btn,
  Card,
  Drawer,
  Field,
  Input,
  Pill,
  Progress,
  Segmented,
  Select,
  SentenceChip,
  Timeline,
  Toggle,
  statusTone,
} from '../ui'
import { useApp } from '../store'
import {
  EXTRA_DIMENSIONS,
  POLICY_CHANNELS,
  POLICY_TEMPLATES,
  TEAM_OPTIONS,
  WHERE_OPTIONS,
  WHO_OPTIONS,
  coverageBreakdown,
  headcountFor,
  reachFor,
  type ChildControl,
  type ClauseBinding,
  type ClauseBindingKind,
  type ClauseSensor,
  type Policy,
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

/** where the policy is set — same pattern as rules */
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

const trunc = (s: string) => (s.length > 24 ? s.slice(0, 23) + '…' : s)

/** the one-line coverage recap on every card — who · where — n exceptions */
function compactCover(p: Policy): string {
  const parts = [p.appliesTo.where]
  if (p.appliesTo.team !== 'every team') parts.push(p.appliesTo.team)
  for (const c of p.appliesAlso ?? []) parts.push(c.value)
  const ex = p.exceptions?.length ?? 0
  return (
    `Covers ${p.appliesTo.who} · ${parts.join(' · ')}` +
    (ex > 0 ? ` — ${ex} ${ex === 1 ? 'exception' : 'exceptions'}` : '')
  )
}

const TEXTAREA =
  'w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13.5px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'

const BLANK_SIGN_CLAUSE: PolicyClause = {
  id: 'c1',
  title: 'Read & accept this policy',
  body: 'Everyone covered confirms they have read and accepted it. Signatures are tracked per company and team.',
  binding: { kind: 'sign', sensor: 'platform', how: 'Read-and-sign tracked — receipts on the record' },
}

type Mark = 'untouched' | 'material' | 'cosmetic'
const MARKS = ['untouched', 'material', 'cosmetic'] as const

export default function PoliciesStudio() {
  const { policies, addPolicy, updatePolicy, publishPolicy, persona, company, companies, observations, toast } = useApp()

  /* who may touch what — mirrors rules exactly */
  const canEdit = (p: Policy): boolean =>
    persona.id === 'operator' ? true : persona.id === 'portfolio' ? p.level !== 'Platform' : p.level === 'Company'

  const levelChoices: readonly LevelLabel[] =
    persona.id === 'operator'
      ? ['Platform', 'Your portfolio', 'This company']
      : persona.id === 'portfolio'
        ? ['Your portfolio', 'This company']
        : []

  /* ── detail drawer ── */
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = policies.find((p) => p.id === detailId) ?? null

  /* ── generator ── */
  const [genOpen, setGenOpen] = useState(false)
  const [genStep, setGenStep] = useState<1 | 2 | 3>(1)
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

  /* ── new version ── */
  const [nvId, setNvId] = useState<string | null>(null)
  const [nvBodies, setNvBodies] = useState<string[]>([])
  const [nvMarks, setNvMarks] = useState<Mark[]>([])
  const [nvOverride, setNvOverride] = useState(false)
  const [nvEffective, setNvEffective] = useState('')
  const nvPolicy = policies.find((p) => p.id === nvId) ?? null

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

  /* ── actions ── */

  const sendForApproval = (p: Policy) => {
    updatePolicy(p.id, {
      status: 'Waiting for approval',
      history: [...p.history, { who: persona.name, what: 'Sent for approval', when: 'today' }],
    })
    toast('Sent for approval — reviewers usually reply within 2 days')
  }

  const approveAndPublish = (p: Policy) => {
    publishPolicy(p.id)
    toast('Published — it lands in Documents inboxes for signing')
  }

  const openNewVersion = (p: Policy) => {
    setDetailId(null)
    setNvId(p.id)
    setNvBodies(p.clauses.map((c) => c.body))
    setNvMarks(p.clauses.map(() => 'untouched' as Mark))
    setNvOverride(false)
    setNvEffective('')
  }

  const openGenerator = () => {
    setTpl(null)
    setVariant('India')
    setGenName('')
    setGenArea('Workplace')
    setLevelLabel('This company')
    setWho(WHO_OPTIONS[0])
    setWhere(WHERE_OPTIONS[0])
    setTeam(TEAM_OPTIONS[0])
    setControlLabel('Can adjust')
    setExcluded([])
    setAlso([])
    setExceptions([])
    setExceptionInput('')
    setGenClauses([])
    setFocus(0)
    setChannels(['Platform sign-off'])
    setEffective('')
    setGenStep(1)
    setGenOpen(true)
  }

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
    setGenStep(2)
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
    setGenOpen(false)
  }

  /* one primary action per status — shared by card and detail footer */
  const statusAction = (p: Policy) =>
    p.status === 'Draft' ? (
      <Btn variant="dark" size="sm" onClick={() => sendForApproval(p)}>
        Send for approval
      </Btn>
    ) : p.status === 'Waiting for approval' ? (
      <Btn variant="amber" size="sm" onClick={() => approveAndPublish(p)}>
        Approve &amp; publish
      </Btn>
    ) : (
      <Btn variant="ghost" size="sm" onClick={() => openNewVersion(p)}>
        New version
      </Btn>
    )

  const policyCard = (p: Policy) => {
    const editable = canEdit(p)
    const deadlines = p.clauses.filter((c) => c.binding?.kind === 'deadline' && c.binding.deadline)
    const avgMet =
      deadlines.length > 0
        ? Math.round(deadlines.reduce((n, c) => n + (c.binding?.deadline?.met ?? 0), 0) / deadlines.length)
        : 0
    const hasReport = p.clauses.some((c) => c.binding?.kind === 'report')
    return (
      <Card key={p.id} className="p-5" onClick={() => setDetailId(p.id)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold tracking-tight">{p.name}</span>
          <Pill tone="outline">{p.area}</Pill>
          <SetAtPill
            level={p.level}
            named={persona.multiCompany}
            owner={companies.find((c) => c.id === p.ownerCompanyId)}
          />
          <Pill tone={statusTone(p.status)} dot>
            {p.status === 'Waiting for approval' ? 'Waiting' : p.status}
          </Pill>
          <span className="ml-auto text-[12px] text-muted">
            v{p.version} · effective {p.effectiveFrom}
          </span>
          <ChevronRight className="h-4 w-4 text-muted/60" />
        </div>

        {/* the clause strip — the policy's fingerprint */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {p.clauses.map((c) =>
            c.binding ? (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-semibold leading-none"
              >
                <BindingIcon kind={c.binding.kind} className="h-3 w-3 text-accent-ink" />
                {trunc(c.title)}
              </span>
            ) : (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-card2/60 px-2.5 py-1 text-[11.5px] font-medium leading-none text-muted"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                {trunc(c.title)}
              </span>
            ),
          )}
        </div>

        {/* who it covers, in one line */}
        <p className="mt-2 truncate text-[12.5px] text-muted">{compactCover(p)}</p>

        {/* what's working, in one line */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          {p.signPct != null && <span className="font-semibold text-green">✓ {p.signPct}% signed</span>}
          {deadlines.length > 0 && (
            <span className="font-semibold text-accent-ink">
              ⏱ {deadlines.length} {deadlines.length === 1 ? 'deadline' : 'deadlines'}, {avgMet}% met
            </span>
          )}
          {hasReport && <span className="font-semibold">🗣 reports on</span>}
          <span className="text-muted">
            {p.channels.length} {p.channels.length === 1 ? 'channel' : 'channels'}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {editable ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">{statusAction(p)}</div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-[12.5px] font-medium text-muted">
              <Lock className="h-3.5 w-3.5" />
              <span>Set above you — runs here automatically.</span>
            </div>
          )}
        </div>
      </Card>
    )
  }

  /* detail analytics */
  const detailDeadlines = detail
    ? detail.clauses.filter((c) => c.binding?.kind === 'deadline' && c.binding.deadline)
    : []
  const detailAvgMet =
    detailDeadlines.length > 0
      ? Math.round(detailDeadlines.reduce((n, c) => n + (c.binding?.deadline?.met ?? 0), 0) / detailDeadlines.length)
      : 0
  const openConcerns = detail
    ? observations.filter((o) => o.policy === detail.name && o.polarity === 'concern' && o.status === 'open').length
    : 0
  const kudosCount = detail ? observations.filter((o) => o.policy === detail.name && o.polarity === 'kudos').length : 0
  const detailCoverage = detail
    ? coverageBreakdown(
        detail.level,
        detail.ownerCompanyId,
        detail.includedCompanies,
        detail.appliesTo,
        detail.appliesAlso,
        companies,
      )
    : null

  /* new-version derivations */
  const anyMaterial = nvMarks.some((m) => m === 'material')
  const anyCosmetic = nvMarks.some((m) => m === 'cosmetic')
  const nvReach = nvPolicy
    ? reachFor(
        {
          level: nvPolicy.level,
          ownerCompanyId: nvPolicy.ownerCompanyId,
          headcount: headcountFor(nvPolicy.appliesTo.who, nvPolicy.appliesTo.where, nvPolicy.appliesTo.team),
        },
        companies,
      ).people
    : 0
  const resignLine = nvOverride
    ? `All ≈${nvReach} people re-sign — you chose everyone.`
    : anyMaterial
      ? `≈${Math.round(nvReach * 0.95)} people re-sign — covered by the changed clauses. Others get a notice.`
      : anyCosmetic
        ? 'Nobody re-signs — a quiet notice goes out.'
        : 'Nothing marked yet — mark each edited clause material or cosmetic.'

  const publishNewVersion = () => {
    if (!nvPolicy) return
    const v = nvPolicy.version + 1
    const changed = nvPolicy.clauses
      .map((c, i) => ({ title: c.title, mark: nvMarks[i] ?? 'untouched' }))
      .filter((x) => x.mark !== 'untouched')
    const changes = changed.length > 0 ? changed.map((x) => `${x.title} (${x.mark})`) : ['No clause changes']
    const eff = nvEffective.trim() || 'on approval'
    const resign = nvOverride ? `all ≈${nvReach}` : anyMaterial ? `≈${Math.round(nvReach * 0.95)}` : 'nobody'
    updatePolicy(nvPolicy.id, {
      version: v,
      effectiveFrom: eff,
      clauses: nvPolicy.clauses.map((c, i) => ({ ...c, body: nvBodies[i] ?? c.body })),
      versions: [...nvPolicy.versions, { v, date: 'today', changes, material: anyMaterial }],
      history: [
        ...nvPolicy.history,
        { who: persona.name, what: `v${v} published — ${resign} re-sign, effective ${eff}`, when: 'today' },
      ],
    })
    toast(`v${v} published — the diff decides who re-signs`)
    setNvId(null)
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

  return (
    <div className="animate-fade-in">
      {/* the list */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          A policy is a document where every clause works — signed, watched, reported, measured.
        </p>
        <Btn variant="dark" onClick={openGenerator}>
          <Plus className="h-4 w-4" /> New policy
        </Btn>
      </div>
      <div className="space-y-4">{policies.map(policyCard)}</div>

      {/* ── the detail drawer ── */}
      <Drawer
        wide
        open={detail != null}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? ''}
        footer={
          detail != null && (
            <div className="flex items-center justify-end gap-2">
              {canEdit(detail) ? statusAction(detail) : (
                <span className="flex items-center gap-2 text-[12.5px] font-medium text-muted">
                  <Lock className="h-3.5 w-3.5" /> Set above you — runs here automatically.
                </span>
              )}
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-2">
              <SetAtPill
                level={detail.level}
                named={persona.multiCompany}
                owner={companies.find((c) => c.id === detail.ownerCompanyId)}
              />
              <Pill tone={statusTone(detail.status)} dot>
                {detail.status === 'Waiting for approval' ? 'Waiting' : detail.status}
              </Pill>
              <Pill tone="outline">{detail.area}</Pill>
              <span className="text-[12px] text-muted">
                v{detail.version} · effective {detail.effectiveFrom}
              </span>
            </div>

            {/* the full coverage sentence — the write side, read back */}
            <p className="-mt-4 text-[13.5px] leading-relaxed">
              Covers <span className="font-bold text-accent-ink">{detail.appliesTo.who}</span> in{' '}
              <span className="font-bold text-accent-ink">{detail.appliesTo.where}</span> ·{' '}
              <span className="font-bold text-accent-ink">{detail.appliesTo.team}</span>
              {(detail.appliesAlso ?? []).map((c) => (
                <Fragment key={c.dim}>
                  {' '}
                  <span className="text-muted">and</span>{' '}
                  <span className="font-bold text-accent-ink">{c.value}</span>
                </Fragment>
              ))}
            </p>
            {detail.exceptions && detail.exceptions.length > 0 && (
              <p className="-mt-5 text-[12px] text-muted">Except: {detail.exceptions.join(' · ')}</p>
            )}

            <div className="-mt-4 flex flex-wrap items-center gap-1.5">
              {detail.channels.map((ch) => (
                <Pill key={ch} tone="neutral">
                  {ch}
                </Pill>
              ))}
            </div>

            {/* the clauses */}
            <section>
              <SectionLabel>The clauses</SectionLabel>
              <div className="space-y-4">
                {detail.clauses.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-line/70 bg-card p-4">
                    <div className="text-[13px] font-bold">{c.title}</div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{c.body}</p>
                    {c.binding && (
                      <div className="mt-2.5 space-y-1.5">
                        <p className="flex items-start gap-1.5 text-[12.5px] font-semibold text-accent-ink">
                          <BindingIcon kind={c.binding.kind} className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            {c.binding.how}
                            {c.binding.flow && <span className="text-ink-soft"> → {c.binding.flow}</span>}
                          </span>
                        </p>
                        {c.binding.kind === 'report' && c.binding.report && (
                          <p className="text-[12px] text-ink-soft">
                            {c.binding.report.who === 'anyone' ? 'anyone can report' : 'managers can report'}
                            {c.binding.report.anonymous ? ' · always anonymous' : ''}
                            {c.binding.report.repeatThreshold ? ' · ' + c.binding.report.repeatThreshold : ''}
                          </p>
                        )}
                        {c.binding.kind === 'deadline' && c.binding.deadline && (
                          <div>
                            <Progress
                              value={c.binding.deadline.met}
                              tone={c.binding.deadline.met >= 90 ? 'green' : 'amber'}
                            />
                            <p className="mt-1 text-[12px] text-ink-soft">
                              {c.binding.deadline.met}% met · {c.binding.deadline.target}
                            </p>
                          </div>
                        )}
                        {c.binding.kind === 'number' && c.binding.value && (
                          <p className="text-[13px] font-bold">{c.binding.value}</p>
                        )}
                        {c.binding.kind === 'checklist' && c.binding.checklist && (
                          <ul className="space-y-0.5">
                            {c.binding.checklist.map((item) => (
                              <li key={item} className="text-[12px] text-ink-soft">
                                ✓ {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {c.binding.kind === 'training' && c.binding.training && (
                          <div>
                            <p className="mb-1 text-[12px] text-ink-soft">
                              {c.binding.training.course} · {c.binding.training.within} ·{' '}
                              {c.binding.training.completion}% done
                            </p>
                            <Progress
                              value={c.binding.training.completion}
                              tone={c.binding.training.completion >= 90 ? 'green' : 'amber'}
                            />
                          </div>
                        )}
                        <p className="text-[11px] text-muted">How we know: {SENSOR_LABEL[c.binding.sensor]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* where it lands — the itemized truth behind the number */}
            {detailCoverage && (
              <section>
                <SectionLabel hint="Live in every company it lands in — never copied.">Where it lands</SectionLabel>
                <div className="space-y-1.5">
                  {detailCoverage.rows.map((r) => (
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
                <p className="mt-2 text-[12px] text-muted">
                  ≈{detailCoverage.total} people, all told
                </p>
              </section>
            )}

            {/* how it's doing */}
            <section>
              <SectionLabel>How it's doing</SectionLabel>
              <div className="flex flex-wrap items-end gap-6">
                {detail.signPct != null && (
                  <div>
                    <div className="font-display text-[30px] font-medium leading-none tracking-tight text-green">
                      {detail.signPct}%
                    </div>
                    <div className="mt-1 text-[11.5px] text-muted">signed</div>
                  </div>
                )}
                {detailDeadlines.length > 0 && (
                  <div>
                    <div className="font-display text-[30px] font-medium leading-none tracking-tight">
                      {detailAvgMet}%
                    </div>
                    <div className="mt-1 text-[11.5px] text-muted">deadlines met</div>
                  </div>
                )}
                <div>
                  <div className="font-display text-[30px] font-medium leading-none tracking-tight">{openConcerns}</div>
                  <div className="mt-1 text-[11.5px] text-muted">open concerns</div>
                </div>
                <div>
                  <div className="font-display text-[30px] font-medium leading-none tracking-tight">{kudosCount}</div>
                  <div className="mt-1 text-[11.5px] text-muted">kudos</div>
                </div>
              </div>
              <div className="mt-4">
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => toast('Bundled in the real thing — signatures, tickets, timestamps, all of it')}
                >
                  Audit evidence pack
                </Btn>
              </div>
            </section>

            {/* versions */}
            <section>
              <SectionLabel>Versions</SectionLabel>
              <Timeline
                steps={detail.versions.map((v) => ({
                  label: `v${v.v} — ${v.changes.join(' · ')}${v.material && v.v > 1 ? ' · material — re-sign' : ''}`,
                  at: v.date,
                  done: true,
                }))}
              />
            </section>

            {/* the full change record */}
            <section>
              <SectionLabel>Every change, on the record</SectionLabel>
              <Timeline
                steps={detail.history.map((h) => ({ label: h.what, at: h.who + ' · ' + h.when, done: true }))}
              />
            </section>
          </div>
        )}
      </Drawer>

      {/* ── the generator ── */}
      <Drawer
        wide
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="New policy"
        footer={
          genStep === 1 ? (
            <p className="text-[12px] text-muted">Pick a starting point — everything stays editable.</p>
          ) : genStep === 2 ? (
            <div className="flex items-center justify-between">
              <Btn variant="ghost" onClick={() => setGenStep(1)}>
                Back
              </Btn>
              <Btn variant="dark" onClick={() => setGenStep(3)}>
                Continue
              </Btn>
            </div>
          ) : (
            <div className="space-y-3">
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
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[170px] flex-1">
                  <Field label="Effective from">
                    <Input
                      value={effective}
                      onChange={(e) => setEffective(e.target.value)}
                      placeholder="e.g. 1 Aug 2026"
                    />
                  </Field>
                </div>
                <Btn variant="ghost" onClick={() => setGenStep(2)}>
                  Back
                </Btn>
                <Btn variant="outline" onClick={() => saveGen('Draft')}>
                  Save draft
                </Btn>
                <Btn variant="dark" onClick={() => saveGen('Waiting for approval')}>
                  Send for approval
                </Btn>
              </div>
            </div>
          )
        }
      >
        {/* step indicator */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {(['Start from', 'Who it covers', 'Make each clause work'] as const).map((s, i) => (
            <span
              key={s}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none',
                genStep === i + 1 ? 'bg-ink text-card' : 'bg-card2 text-muted',
              )}
            >
              {i + 1} · {s}
            </span>
          ))}
        </div>

        {genStep === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
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
        )}

        {genStep === 2 && (
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

            {/* 5 · the coverage panel — the itemized truth behind the big number */}
            <section>
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
        )}

        {genStep === 3 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: '150px 1fr' }}>
            {/* clause rail */}
            <div className="space-y-1">
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
        )}
      </Drawer>

      {/* ── new version — the diff decides who re-signs ── */}
      <Drawer
        wide
        open={nvPolicy != null}
        onClose={() => setNvId(null)}
        title={nvPolicy ? `New version of ${nvPolicy.name}` : ''}
        footer={
          nvPolicy != null && (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-[170px] flex-1">
                <Field label="Effective from">
                  <Input
                    value={nvEffective}
                    onChange={(e) => setNvEffective(e.target.value)}
                    placeholder="e.g. 1 Aug 2026"
                  />
                </Field>
              </div>
              <Btn variant="dark" onClick={publishNewVersion}>
                Publish v{nvPolicy.version + 1}
              </Btn>
            </div>
          )
        }
      >
        {nvPolicy && (
          <div className="space-y-4">
            <p className="text-[12.5px] text-muted">
              Edit what changed, then mark each clause — material edits make people re-sign, cosmetic ones just send a
              notice.
            </p>
            {nvPolicy.clauses.map((c, i) => (
              <div key={c.id} className="rounded-2xl border border-line/70 bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[13px] font-bold">
                    {c.binding && <BindingIcon kind={c.binding.kind} className="h-3.5 w-3.5 text-accent-ink" />}
                    {c.title}
                  </span>
                  <Segmented
                    options={MARKS}
                    value={nvMarks[i] ?? 'untouched'}
                    onChange={(m) => setNvMarks((ms) => ms.map((x, j) => (j === i ? m : x)))}
                  />
                </div>
                <textarea
                  rows={2}
                  value={nvBodies[i] ?? ''}
                  onChange={(e) => setNvBodies((bs) => bs.map((x, j) => (j === i ? e.target.value : x)))}
                  className={cn(TEXTAREA, 'mt-2.5')}
                />
              </div>
            ))}

            {/* the re-sign preview, live */}
            <Card glow className="p-4">
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
                <Sparkles className="h-4 w-4" /> Who re-signs
              </div>
              <p className="text-[13px] font-semibold leading-relaxed">{resignLine}</p>
              <div className="mt-3">
                <Toggle on={nvOverride} onChange={setNvOverride} label="Everyone re-signs anyway" />
              </div>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}
