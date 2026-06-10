/**
 * Rules & flows — Journey 3 + the parent→child enforcement model made visible.
 * A rule lives at exactly one level (Platform / Your portfolio / This company)
 * and lands on every company below it — live, never copied. This page shows
 * that: parent rules arrive read-only ("from above"), reach lines recompute as
 * companies join or pause, and every rule carries its full change record.
 */
import { Fragment, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  History,
  Layers,
  Lock,
  Pencil,
  PencilLine,
  Play,
  Plus,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  Btn,
  Card,
  Drawer,
  Field,
  Input,
  Pill,
  SectionTitle,
  Segmented,
  Select,
  SentenceChip,
  Stat,
  Timeline,
  statusTone,
} from '../ui'
import { useApp } from '../store'
import FlowsView from './Flows'
import {
  APPROVER_OPTIONS,
  TEAM_OPTIONS,
  WHERE_OPTIONS,
  WHO_OPTIONS,
  coverageFor,
  headcountFor,
  reachFor,
  type ChildControl,
  type Rule,
  type RuleLevel,
  type RuleStatus,
} from '../data'
import { cn } from '../lib'

const CATEGORIES = ['Time off', 'Attendance', 'Documents', 'Onboarding'] as const
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

/** click-to-cycle through a chip's options */
function next(options: readonly string[], current: string): string {
  return options[(options.indexOf(current) + 1) % options.length]
}

function StepChip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold leading-none">{children}</span>
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
  const { persona, company, companies, rules, updateRule, addRule, toast } = useApp()

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

  /* ── view switch: the rules themselves vs the flows that route them ── */
  const [view, setView] = useState<'Rules' | 'Approval flows'>('Rules')

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
  const [chain, setChain] = useState<string[]>([])
  const [notify, setNotify] = useState<string[]>([])

  /* ── history drawer ── */
  const [historyId, setHistoryId] = useState<string | null>(null)
  const historyRule = rules.find((r) => r.id === historyId) ?? null

  const openNew = () => {
    setEditingId(null)
    setName('')
    setCategory('Time off')
    setLevelLabel('This company')
    setControlLabel('Use as-is')
    setWho(WHO_OPTIONS[0])
    setWhere(WHERE_OPTIONS[0])
    setTeam(TEAM_OPTIONS[0])
    setChain([])
    setNotify([])
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
    setChain(r.chain)
    setNotify(r.notify)
    setOpen(true)
  }

  const nextApprover = APPROVER_OPTIONS.find((o) => !chain.includes(o))

  const toggleNotify = (n: string) =>
    setNotify((ns) => (ns.includes(n) ? ns.filter((x) => x !== n) : [...ns, n]))

  /* composer derivations — live, so the blast radius is never a surprise */
  const level = LEVEL_OF_LABEL[levelLabel]
  const childControl = CONTROL_OF_LABEL[controlLabel]
  const composerReach = reachFor(
    { level, ownerCompanyId: 'acme', headcount: headcountFor(who, where, team) },
    companies,
  )

  const save = (status: RuleStatus) => {
    const fields = {
      name: name.trim() || 'Untitled rule',
      category,
      status,
      level,
      ownerCompanyId: level === 'Company' ? 'acme' : undefined,
      childControl,
      appliesTo: { who, where, team },
      headcount: headcountFor(who, where, team),
      chain,
      notify,
      updated: 'just now',
    }
    if (editingId) {
      const existing = rules.find((r) => r.id === editingId)
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
  const act = (r: Rule, status: RuleStatus, what: string, msg: string) => {
    updateRule(r.id, {
      status,
      updated: 'just now',
      history: [...r.history, { who: persona.name, what, when: 'just now' }],
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
    return (
      <Card key={r.id} className="p-5">
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
          {r.level !== 'Company' && <ChildControlPill control={r.childControl} />}
          <span className="ml-auto text-[12px] text-muted">updated {r.updated}</span>
        </div>

        {/* the sentence — always visible; reach is live from store companies */}
        <p className="mt-3 text-[13.5px]">
          Applies to <b className="text-accent-ink">{r.appliesTo.who}</b> in{' '}
          <b className="text-accent-ink">{r.appliesTo.where}</b> ·{' '}
          <b className="text-accent-ink">{r.appliesTo.team}</b>{' '}
          {r.level === 'Company' ? (
            <span className="font-bold">→ {r.headcount} people</span>
          ) : (
            <span>
              · Runs in <b>{reach.companies} companies</b> → <b>{reach.people} people</b>
            </span>
          )}
        </p>

        {/* the pipeline */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <StepChip>Person asks</StepChip>
          <ArrowRight className="h-3 w-3 text-muted" />
          {r.chain.length === 0 ? (
            <>
              <span className="text-[12px] italic text-muted">runs instantly — no approvals</span>
              <ArrowRight className="h-3 w-3 text-muted" />
            </>
          ) : (
            r.chain.map((step) => (
              <Fragment key={step}>
                <StepChip>{step}</StepChip>
                <ArrowRight className="h-3 w-3 text-muted" />
              </Fragment>
            ))
          )}
          <StepChip>Done ✓</StepChip>
        </div>

        {/* precedence outcome, never the mechanism */}
        {r.shadowedBy && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone="amber">Quiet</Pill>
            <span className="text-[12px] text-muted">
              Covered by: {r.shadowedBy} — this rule stays out of the way.
            </span>
          </div>
        )}

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
              <Segmented options={['Rules', 'Approval flows'] as const} value={view} onChange={setView} />
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

      {view === 'Approval flows' ? (
        <FlowsView />
      ) : (
        <>
          {/* how parent rules are landing — per company, measured live */}
          {(persona.id === 'operator' || persona.id === 'portfolio') && landing.length > 0 && (
            <Card className="mb-8 p-6">
              <SectionTitle hint="Inheritance and every local change, measured — not assumed.">
                Where they land
              </SectionTitle>
              <div className="space-y-3">
                {landing.map((r) => (
                  <div key={r.id} className="grid items-center gap-2 sm:grid-cols-[260px,1fr]">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-bold tracking-tight">{r.name}</span>
                      <SetAtPill level={r.level} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {coverageFor(r, companies).map((cv) => {
                        const co = companies.find((c) => c.id === cv.companyId)
                        if (!co) return null
                        return (
                          <span
                            key={cv.companyId}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card py-1 pl-2 pr-1"
                          >
                            <span className="h-2 w-2 rounded-full" style={{ background: co.accent }} />
                            <span className="text-[11px] font-bold">{co.short}</span>
                            {cv.state === 'Enforced' && <Pill tone="green">✓ {cv.ack}%</Pill>}
                            {cv.state === 'Adjusted' && <Pill tone="amber">△ adjusted · {cv.ack}%</Pill>}
                            {cv.state === 'Pending' && <Pill tone="neutral">… {cv.ack}%</Pill>}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11.5px] text-muted">✓ enforced · △ child adjusted it · % read-and-confirmed</p>
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
          </section>

          {/* who it applies to — the sentence builder */}
          <section>
            <SectionLabel hint="Tap a highlighted part to change it.">Who does this apply to</SectionLabel>
            <p className="text-[15px] leading-loose">
              Applies to{' '}
              <SentenceChip onClick={() => setWho(next(WHO_OPTIONS, who))}>{who}</SentenceChip> in{' '}
              <SentenceChip onClick={() => setWhere(next(WHERE_OPTIONS, where))}>{where}</SentenceChip> ·{' '}
              <SentenceChip onClick={() => setTeam(next(TEAM_OPTIONS, team))}>{team}</SentenceChip>
            </p>
            <div className="mt-2 font-display text-[30px] font-medium leading-none tracking-tight">
              → {composerReach.companies} {composerReach.companies === 1 ? 'company' : 'companies'} ·{' '}
              {composerReach.people} people
            </div>
            <p className="mt-1.5 text-[12px] text-muted">
              live reach — it updates as you change the level and the sentence
            </p>
          </section>

          {/* approval steps */}
          <section>
            <SectionLabel>Approval steps</SectionLabel>
            <div className="flex flex-wrap items-center gap-1.5">
              {chain.map((step, i) => (
                <Fragment key={step}>
                  {i > 0 && <ArrowRight className="h-3 w-3 text-muted" />}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card2 px-2.5 py-1 text-[11.5px] font-bold leading-none">
                    {step}
                    <button
                      type="button"
                      aria-label={`Remove ${step}`}
                      onClick={() => setChain((c) => c.filter((_, j) => j !== i))}
                      className="text-muted transition-colors hover:text-red"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </Fragment>
              ))}
              {nextApprover && (
                <button
                  type="button"
                  onClick={() => setChain((c) => [...c, nextApprover])}
                  className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11.5px] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                >
                  + Add step
                </button>
              )}
            </div>
            {chain.length === 0 && (
              <p className="mt-2 text-[12px] italic text-muted">
                No steps — it just runs. Fine for low-stakes rules.
              </p>
            )}
          </section>

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

          {/* simulate before publish */}
          <section>
            <Card glow className="p-5">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
                <Sparkles className="h-4 w-4" /> Try it before you turn it on
              </div>
              <p className="text-[13.5px] leading-relaxed">
                <b>Priya</b> (Design · Bengaluru) triggers “<b>{name.trim() || 'this rule'}</b>”
                {chain.length > 0 ? (
                  <>
                    {' '}
                    → goes to <b>{chain.join(', then ')}</b>
                  </>
                ) : (
                  <>
                    {' '}
                    → <b>approved instantly</b>
                  </>
                )}
                {notify.length > 0 ? (
                  <>
                    {' '}
                    → <b>{notify.join(' + ')}</b> {notify.length === 1 ? 'gets' : 'get'} told.
                  </>
                ) : (
                  <> → no one is told yet.</>
                )}
              </p>
              <p className="mt-2 text-[11.5px] text-muted">A worked example — it updates live as you change the rule.</p>
            </Card>
          </section>
        </div>
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
    </div>
  )
}
