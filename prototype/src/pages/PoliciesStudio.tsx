/**
 * Policy Studio — BRD §E through the OpsMaven lens. A policy is a document of
 * CLAUSES, and every clause can WORK: signed, watched, reported, measured.
 * Mounted by Rules.tsx as the default view of "Rules & flows".
 */
import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Timeline,
  Toggle,
  statusTone,
} from '../ui'
import { useApp } from '../store'
import {
  coverageBreakdown,
  headcountFor,
  reachFor,
  type ClauseBindingKind,
  type ClauseSensor,
  type Policy,
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

/* ── the sensor question: how do we know? ── */

const SENSOR_LABEL: Record<ClauseSensor, string> = {
  platform: 'the platform sees it',
  connector: 'a connected system tells us (Phase II)',
  person: 'a person reports it',
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

type Mark = 'untouched' | 'material' | 'cosmetic'
const MARKS = ['untouched', 'material', 'cosmetic'] as const

export default function PoliciesStudio() {
  const { policies, updatePolicy, publishPolicy, persona, companies, observations, toast } = useApp()
  const navigate = useNavigate()

  /* who may touch what — mirrors rules exactly */
  const canEdit = (p: Policy): boolean =>
    persona.id === 'operator' ? true : persona.id === 'portfolio' ? p.level !== 'Platform' : p.level === 'Company'

  /* ── detail drawer ── */
  const [detailId, setDetailId] = useState<string | null>(null)
  const detail = policies.find((p) => p.id === detailId) ?? null

  /* ── new version ── */
  const [nvId, setNvId] = useState<string | null>(null)
  const [nvBodies, setNvBodies] = useState<string[]>([])
  const [nvMarks, setNvMarks] = useState<Mark[]>([])
  const [nvOverride, setNvOverride] = useState(false)
  const [nvEffective, setNvEffective] = useState('')
  const nvPolicy = policies.find((p) => p.id === nvId) ?? null

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

  return (
    <div className="animate-fade-in">
      {/* the list */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          A policy is a document where every clause works — signed, watched, reported, measured.
        </p>
        <Btn variant="dark" onClick={() => navigate('/policies/new')}>
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
