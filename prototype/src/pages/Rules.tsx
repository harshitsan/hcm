/**
 * Rules & flows — Journey 3: "Set a rule and trust it runs itself."
 * One repeated composition: define the rule → who it applies to → approval
 * steps → who hears → see it run. The composer ends with a worked example
 * (simulate-before-publish) so nobody publishes blind.
 */
import { Fragment, useState } from 'react'
import { ArrowRight, Hourglass, Pencil, PencilLine, Play, Plus, Sparkles, X } from 'lucide-react'
import { Btn, Card, Drawer, Field, Input, Pill, Select, SentenceChip, Stat, statusTone } from '../ui'
import { useApp } from '../store'
import {
  APPROVER_OPTIONS,
  TEAM_OPTIONS,
  WHERE_OPTIONS,
  WHO_OPTIONS,
  headcountFor,
  type Rule,
  type RuleStatus,
} from '../data'
import { cn } from '../lib'

const CATEGORIES = ['Time off', 'Attendance', 'Documents', 'Onboarding'] as const
const NOTIFY_OPTIONS = ['Person', 'Manager', 'HR'] as const

/** click-to-cycle through a chip's options */
function next(options: readonly string[], current: string): string {
  return options[(options.indexOf(current) + 1) % options.length]
}

function StepChip({ children }: { children: React.ReactNode }) {
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

export default function Rules() {
  const { rules, updateRule, addRule, toast } = useApp()

  /* ── composer state ── */
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Rule['category']>('Time off')
  const [who, setWho] = useState<string>(WHO_OPTIONS[0])
  const [where, setWhere] = useState<string>(WHERE_OPTIONS[0])
  const [team, setTeam] = useState<string>(TEAM_OPTIONS[0])
  const [chain, setChain] = useState<string[]>([])
  const [notify, setNotify] = useState<string[]>([])

  const openNew = () => {
    setEditingId(null)
    setName('')
    setCategory('Time off')
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

  const save = (status: RuleStatus) => {
    const fields = {
      name: name.trim() || 'Untitled rule',
      category,
      status,
      appliesTo: { who, where, team },
      headcount: headcountFor(who, where, team),
      chain,
      notify,
      updated: 'just now',
    }
    if (editingId) updateRule(editingId, fields)
    else addRule({ id: 'r' + (rules.length + 1), ...fields })
    toast(
      status === 'Draft'
        ? 'Saved as a draft — nothing runs until you send it'
        : 'Sent — reviewers usually reply within 2 days',
    )
    setOpen(false)
  }

  const running = rules.filter((r) => r.status === 'Running').length
  const waiting = rules.filter((r) => r.status === 'Waiting for approval').length
  const drafts = rules.filter((r) => r.status === 'Draft').length

  const liveCount = headcountFor(who, where, team)

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
          </div>
          <div className="flex items-center gap-6 pb-1">
            <Stat icon={<Play />} value={running} label="Running" />
            <Stat icon={<Hourglass />} value={waiting} label="Waiting" />
            <Stat icon={<PencilLine />} value={drafts} label="Drafts" />
            <Btn variant="dark" onClick={openNew}>
              <Plus className="h-4 w-4" /> New rule
            </Btn>
          </div>
        </div>
      </Card>

      {/* rules list */}
      <div className="space-y-4">
        {rules.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight">{r.name}</span>
              <Pill tone="outline">{r.category}</Pill>
              <Pill tone={statusTone(r.status)} dot>
                {r.status}
              </Pill>
              <span className="ml-auto text-[12px] text-muted">updated {r.updated}</span>
            </div>

            {/* the sentence — always visible */}
            <p className="mt-3 text-[13.5px]">
              Applies to <b className="text-accent-ink">{r.appliesTo.who}</b> in{' '}
              <b className="text-accent-ink">{r.appliesTo.where}</b> ·{' '}
              <b className="text-accent-ink">{r.appliesTo.team}</b>{' '}
              <span className="font-bold">→ {r.headcount} people</span>
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

            {/* one primary action per state */}
            <div className="mt-4 flex items-center gap-2">
              {r.status === 'Draft' && (
                <Btn
                  variant="dark"
                  size="sm"
                  onClick={() => {
                    updateRule(r.id, { status: 'Waiting for approval', updated: 'just now' })
                    toast('Sent — reviewers usually reply within 2 days')
                  }}
                >
                  Send for approval
                </Btn>
              )}
              {r.status === 'Waiting for approval' && (
                <Btn
                  variant="amber"
                  size="sm"
                  onClick={() => {
                    updateRule(r.id, { status: 'Running', updated: 'just now' })
                    toast('Running — applies from today')
                  }}
                >
                  Approve &amp; run
                </Btn>
              )}
              {r.status === 'Running' && (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateRule(r.id, { status: 'Paused', updated: 'just now' })
                    toast('Paused — nothing new will trigger')
                  }}
                >
                  Pause
                </Btn>
              )}
              {r.status === 'Paused' && (
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateRule(r.id, { status: 'Running', updated: 'just now' })
                    toast('Back on')
                  }}
                >
                  Resume
                </Btn>
              )}
              <Btn variant="ghost" size="sm" onClick={() => openEdit(r)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Btn>
            </div>
          </Card>
        ))}
      </div>

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
              → {liveCount} people
            </div>
            <p className="mt-1.5 text-[12px] text-muted">live count — so you always know exactly who's covered</p>
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
    </div>
  )
}
