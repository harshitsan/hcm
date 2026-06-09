/**
 * Shared Policies — platform/group governance console.
 *
 * Three governance layers on one screen:
 *  1. Inheritance — author a policy as clauses, let children override, see every override.
 *  2. Level precedence — the platform admin orders Platform/Portfolio/Group/Company; a
 *     same-category policy at a higher-priority level SHADOWS lower ones.
 *  3. Approval gate — a policy moves Draft → Pending → Approved → Enforced; it can only be
 *     enforced after its approval chain clears.
 */
import { useState } from 'react'
import {
  ShieldCheck, Plus, Layers, Lock, FileText, ArrowRight, Trash2, ListChecks,
  CheckCircle2, Pencil, ChevronUp, ChevronDown, GitBranch, Check, X, Clock, EyeOff,
  Rocket, Undo2,
} from 'lucide-react'
import { useToast } from '../components/ui'
import {
  Badge, Button, Card, CardBody, Drawer, EmptyState, Field, IconButton,
  Input, Modal, PageHeader, Select, StatCard, Switch, Textarea,
} from '../components/ui'
import {
  usePolicies, POLICY_LEVELS,
  type SharedPolicy, type Clause, type PolicyLevel, type PolicyStatus, type ApprovalStep,
} from '../app/policies'
import { useApp } from '../app/store'
import { companies } from '../data/mock'
import { cn } from '../lib/cn'

const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? id
const catTone = (c: string) =>
  c === 'Compliance' ? 'warning' : c === 'Security' ? 'info' : c === 'HR' ? 'primary' : c === 'Finance' ? 'accent' : 'neutral'

const statusTone: Record<PolicyStatus, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = {
  Draft: 'neutral', 'Pending Approval': 'warning', Approved: 'info', Enforced: 'success', Rejected: 'danger',
}
const APPROVER_ROLES = ['Legal', 'HR Council', 'Finance', 'Security Office', 'Portfolio Manager', 'Platform Admin']

// "paste your policy" → one clause per line (strips bullets / numbering)
function toClauses(text: string): Clause[] {
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter((l) => l.length > 0)
    .map((t, i) => ({ id: `c${i + 1}`, text: t, mandatory: false }))
}

export default function SharedPolicies() {
  const {
    shared, addSharedPolicy, overridesForPolicy, usageForPolicy, logForPolicy, snapshotCount,
    levelPriority, moveLevel, effectiveFor, submitForApproval, decideApproval, enforcePolicy, unenforce,
  } = usePolicies()
  const { role, persona } = useApp()
  const { push } = useToast()
  const actor = persona?.name ?? 'Admin'
  const isPlatformAdmin = role === 'provider_admin'
  const canActOnStep = (step: ApprovalStep) => isPlatformAdmin || (role === 'portfolio_manager' && step.role !== 'Platform Admin')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? shared.find((p) => p.id === selectedId) ?? null : null
  const [open, setOpen] = useState(false)

  // authoring state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('HR')
  const [level, setLevel] = useState<PolicyLevel>('Group')
  const [paste, setPaste] = useState('')
  const [draft, setDraft] = useState<Clause[]>([])
  const [allowOverride, setAllowOverride] = useState(true)
  const [chain, setChain] = useState<string[]>(['Legal', 'Platform Admin'])

  const reset = () => {
    setName(''); setCategory('HR'); setLevel('Group'); setPaste(''); setDraft([])
    setAllowOverride(true); setChain(['Legal', 'Platform Admin'])
  }
  const generate = () => setDraft(toClauses(paste))
  const publish = () => {
    if (!name.trim() || draft.length === 0) { push({ title: 'Add a name and at least one clause', tone: 'warning' }); return }
    addSharedPolicy({
      name: name.trim(), category, ownerScope: level, allowOverride, clauses: draft,
      approval: chain.map((r, i) => ({ id: `ap-${i}-${r}`, role: r, state: 'pending' as const })),
    })
    push({ title: `“${name.trim()}” saved as draft`, tone: 'success' })
    setOpen(false); reset()
  }

  // lifecycle actions
  const onSubmit = (p: SharedPolicy) => { submitForApproval(p.id, actor); push({ title: `Submitted “${p.name}” for approval`, tone: 'info' }) }
  const onDecide = (p: SharedPolicy, step: ApprovalStep, decision: 'approved' | 'rejected') => {
    decideApproval(p.id, step.id, decision, actor)
    push({ title: `${decision === 'approved' ? 'Approved' : 'Rejected'} · ${step.role}`, tone: decision === 'approved' ? 'success' : 'warning' })
  }
  const onEnforce = (p: SharedPolicy) => { enforcePolicy(p.id); push({ title: `“${p.name}” is now enforced`, tone: 'success' }) }
  const onPullBack = (p: SharedPolicy) => { unenforce(p.id); push({ title: `Pulled “${p.name}” back from enforcement`, tone: 'warning' }) }

  const enforcedCount = shared.filter((p) => p.enforced).length
  const pendingCount = shared.filter((p) => p.status === 'Pending Approval').length
  const shadowedCount = shared.filter((p) => effectiveFor(p).shadowedBy).length

  // the first pending step is the one that can be acted on (sequential chain)
  const currentStep = (p: SharedPolicy) => p.approval.find((s) => s.state === 'pending') ?? null

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Shared Policies"
        subtitle="Govern policies across levels — set precedence, route approvals, and enforce only what's cleared."
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New shared policy</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Enforced" value={enforcedCount} delta="live across tenants" deltaTone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Pending approval" value={pendingCount} delta="awaiting sign-off" deltaTone="warning" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Shadowed" value={shadowedCount} delta="overridden by precedence" deltaTone="info" icon={<EyeOff className="h-4 w-4" />} />
        <StatCard label="On own snapshot" value={snapshotCount} delta="vs master" deltaTone="accent" icon={<Pencil className="h-4 w-4" />} />
      </div>

      {/* Enforcement precedence */}
      <Card className="mb-6">
        <CardBody>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Layers className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-bold tracking-tight">Enforcement precedence</p>
                <p className="text-2xs text-muted-fg">When two enforced policies of the same category overlap, the higher-priority level wins.</p>
              </div>
            </div>
            {!isPlatformAdmin && <Badge tone="neutral"><Lock className="h-3 w-3" /> Platform-admin only</Badge>}
          </div>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {levelPriority.map((lvl, i) => (
              <li key={lvl} className="flex items-center gap-2 rounded-xl border border-border bg-surface2/40 px-3 py-2">
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-2xs font-bold',
                  i === 0 ? 'bg-primary text-primary-fg' : 'bg-muted text-muted-fg')}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{lvl}</p>
                  <p className="text-2xs text-muted-fg">{i === 0 ? 'Wins on conflict' : i === levelPriority.length - 1 ? 'Lowest priority' : `Beats levels ${i + 2}+`}</p>
                </div>
                {isPlatformAdmin && (
                  <div className="flex flex-col">
                    <button type="button" aria-label={`Raise ${lvl}`} disabled={i === 0}
                      onClick={() => moveLevel(lvl, -1)}
                      className="flex h-4 w-5 items-center justify-center rounded text-muted-fg transition-colors enabled:hover:text-fg enabled:hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label={`Lower ${lvl}`} disabled={i === levelPriority.length - 1}
                      onClick={() => moveLevel(lvl, 1)}
                      className="flex h-4 w-5 items-center justify-center rounded text-muted-fg transition-colors enabled:hover:text-fg enabled:hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* Policy list */}
      <div className="space-y-3">
        {shared.map((p) => {
          const customized = usageForPolicy(p.id).filter((u) => u.customized).length
          const eff = effectiveFor(p)
          const step = currentStep(p)
          return (
            <Card key={p.id} className="transition-colors hover:border-accent/50">
              <CardBody className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button type="button" onClick={() => setSelectedId(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{p.name} <span className="font-medium text-muted-fg">{p.version}</span></p>
                    <p className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge tone="accent"><Layers className="h-3 w-3" /> {p.ownerScope} · {p.owner}</Badge>
                      <Badge tone={catTone(p.category)}>{p.category}</Badge>
                      <span className="tnum text-2xs text-muted-fg">{p.clauses.length} clauses · {p.appliesTo.length} companies</span>
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge tone={statusTone[p.status]} dot>{p.status}</Badge>
                  {p.enforced && (eff.shadowedBy
                    ? <Badge tone="info"><EyeOff className="h-3 w-3" /> Shadowed by {eff.shadowedBy.ownerScope}</Badge>
                    : <Badge tone="success">Effective</Badge>)}
                  {customized > 0 && <Badge tone="warning">{customized} on snapshot</Badge>}
                  {/* primary lifecycle action */}
                  {p.status === 'Draft' && <Button size="sm" variant="outline" onClick={() => onSubmit(p)}><GitBranch className="h-4 w-4" /> Submit</Button>}
                  {p.status === 'Pending Approval' && <Button size="sm" variant="outline" onClick={() => setSelectedId(p.id)}><Clock className="h-4 w-4" /> Review{step ? ` · ${step.role}` : ''}</Button>}
                  {p.status === 'Approved' && <Button size="sm" onClick={() => onEnforce(p)}><Rocket className="h-4 w-4" /> Enforce</Button>}
                  {p.status === 'Enforced' && isPlatformAdmin && <Button size="sm" variant="ghost" onClick={() => onPullBack(p)}><Undo2 className="h-4 w-4" /> Pull back</Button>}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* policy detail + governance */}
      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.name} width="max-w-xl">
        {selected && (() => {
          const eff = effectiveFor(selected)
          const step = currentStep(selected)
          return (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[selected.status]} dot>{selected.status}</Badge>
              <Badge tone="accent"><Layers className="h-3 w-3" /> {selected.ownerScope} · {selected.owner}</Badge>
              <Badge tone={catTone(selected.category)}>{selected.category}</Badge>
              <Badge tone="neutral">{selected.version}</Badge>
              {selected.allowOverride
                ? <Badge tone="neutral"><Pencil className="h-3 w-3" /> Children may override</Badge>
                : <Badge tone="neutral"><Lock className="h-3 w-3" /> Locked</Badge>}
            </div>

            {/* Precedence */}
            <div className={cn('rounded-xl border p-3', eff.shadowedBy ? 'border-info/30 bg-info/5' : selected.enforced ? 'border-success/30 bg-success/5' : 'border-border bg-surface2/40')}>
              <p className="mb-1 flex items-center gap-2 text-2xs font-bold uppercase tracking-wide text-muted-fg/80">
                <Layers className="h-3 w-3" /> Precedence
              </p>
              {!selected.enforced ? (
                <p className="text-[13px] text-muted-fg">Not enforced yet — precedence applies only to enforced policies.</p>
              ) : eff.shadowedBy ? (
                <p className="text-[13px]">Shadowed by <span className="font-semibold">{eff.shadowedBy.name}</span> ({eff.shadowedBy.ownerScope}) — a higher-priority level governs the <span className="font-semibold">{selected.category}</span> topic for overlapping companies.</p>
              ) : (
                <p className="text-[13px]">Effective — this is the winning <span className="font-semibold">{selected.category}</span> policy at level <span className="font-semibold">{selected.ownerScope}</span> for its companies.</p>
              )}
            </div>

            {/* Approval timeline */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Approval chain ({selected.approval.length})</p>
                {selected.status === 'Approved' && <Button size="sm" onClick={() => onEnforce(selected)}><Rocket className="h-4 w-4" /> Enforce now</Button>}
                {selected.status === 'Draft' && <Button size="sm" variant="outline" onClick={() => onSubmit(selected)}><GitBranch className="h-4 w-4" /> Submit for approval</Button>}
                {selected.status === 'Enforced' && isPlatformAdmin && <Button size="sm" variant="ghost" onClick={() => onPullBack(selected)}><Undo2 className="h-4 w-4" /> Pull back</Button>}
              </div>
              {selected.approval.length === 0 ? (
                <p className="text-[13px] text-muted-fg">No approvers — submitting enforces directly.</p>
              ) : (
                <ol className="space-y-1.5">
                  {selected.approval.map((s, i) => {
                    const isCurrent = step?.id === s.id && selected.status === 'Pending Approval'
                    return (
                      <li key={s.id} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2',
                        s.state === 'approved' ? 'border-success/30 bg-success/5' : s.state === 'rejected' ? 'border-danger/30 bg-danger/5' : isCurrent ? 'border-warning/40 bg-warning/5' : 'border-border')}>
                        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                          s.state === 'approved' ? 'bg-success text-white' : s.state === 'rejected' ? 'bg-danger text-white' : 'bg-muted text-muted-fg')}>
                          {s.state === 'approved' ? <Check className="h-3 w-3" /> : s.state === 'rejected' ? <X className="h-3 w-3" /> : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold">{s.role}</p>
                          <p className="text-2xs text-muted-fg">
                            {s.state === 'pending' ? (isCurrent ? 'Awaiting decision' : 'Queued') : `${s.state === 'approved' ? 'Approved' : 'Rejected'} by ${s.actor} · ${s.at}`}
                          </p>
                        </div>
                        {isCurrent && canActOnStep(s) && (
                          <div className="flex items-center gap-1">
                            <Button size="sm" onClick={() => onDecide(selected, s, 'approved')}><Check className="h-4 w-4" /> Approve</Button>
                            <Button size="sm" variant="ghost" onClick={() => onDecide(selected, s, 'rejected')}><X className="h-4 w-4" /></Button>
                          </div>
                        )}
                        {isCurrent && !canActOnStep(s) && <Badge tone="neutral">Not your step</Badge>}
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            <div>
              <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Clauses ({selected.clauses.length})</p>
              <ul className="space-y-1.5">
                {selected.clauses.map((c, i) => (
                  <li key={c.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
                    <span className="tnum mt-0.5 text-2xs font-bold text-muted-fg/70">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-[13px]">{c.text}</span>
                    {c.mandatory && <Badge tone="warning">Mandatory</Badge>}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Who's using this policy</p>
              <ul className="space-y-1.5">
                {usageForPolicy(selected.id).map((u) => (
                  <li key={u.companyId} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span className="text-[13px] font-semibold">{companyName(u.companyId)}</span>
                    {u.customized
                      ? <Badge tone="warning"><Pencil className="h-3 w-3" /> Own snapshot · {u.overrides} change{u.overrides > 1 ? 's' : ''}</Badge>
                      : <Badge tone="success" dot>Group master</Badge>}
                  </li>
                ))}
              </ul>
            </div>

            {overridesForPolicy(selected.id).length > 0 && (
              <div>
                <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">
                  Snapshot differences ({overridesForPolicy(selected.id).length})
                </p>
                <ul className="space-y-2.5">
                  {overridesForPolicy(selected.id).map((o) => (
                    <li key={o.companyId + o.clauseId} className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                      <p className="mb-1.5 flex items-center gap-2 text-2xs font-bold uppercase tracking-wide text-muted-fg/80">
                        <Pencil className="h-3 w-3 text-warning" /> {companyName(o.companyId)} · clause {o.clauseId}
                      </p>
                      <p className="text-2xs text-muted-fg line-through">{o.original}</p>
                      <p className="mt-1 flex items-start gap-1.5 text-[13px] font-medium">
                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" /> {o.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">Change log ({logForPolicy(selected.id).length})</p>
              {logForPolicy(selected.id).length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="No changes yet" description="Every member company is on the group master." />
              ) : (
                <ul className="space-y-1.5">
                  {logForPolicy(selected.id).map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                      <span className="flex items-center gap-2 text-2xs">
                        <Badge tone={e.action === 'Customized' ? 'warning' : 'neutral'}>{e.action}</Badge>
                        <span className="font-semibold text-fg">{companyName(e.companyId)}</span>
                        <span className="text-muted-fg">clause {e.clauseId}</span>
                      </span>
                      <span className="text-2xs text-muted-fg">{e.at}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          )
        })()}
      </Drawer>

      {/* authoring: paste → clauses, level + approval chain */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); reset() }}
        title="New shared policy"
        description="Paste your policy text, set the level, and route an approval chain — it's saved as a draft you submit for sign-off."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button onClick={publish}>Save as draft</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Policy name" required className="sm:col-span-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remote Work Policy" /></Field>
            <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value)}><option>HR</option><option>Compliance</option><option>Security</option><option>Finance</option></Select></Field>
            <Field label="Level" hint="Higher levels win on conflict.">
              <Select value={level} onChange={(e) => setLevel(e.target.value as PolicyLevel)}>
                {POLICY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
          </div>

          <Field label="Paste your policy" hint="One clause per line. Bullets and numbering are stripped automatically.">
            <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} className="min-h-[110px]" placeholder={'- Treat colleagues with respect\n- Report conflicts of interest\n- Protect confidential information'} />
          </Field>
          <Button variant="outline" size="sm" onClick={generate}><ListChecks className="h-4 w-4" /> Generate clauses</Button>

          {draft.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-border bg-surface2/40 p-3">
              <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg/70">{draft.length} clauses · tick = mandatory</p>
              {draft.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Toggle mandatory"
                    onClick={() => setDraft((d) => d.map((x) => (x.id === c.id ? { ...x, mandatory: !x.mandatory } : x)))}
                    className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer', c.mandatory ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-surface text-transparent hover:border-muted-fg/40')}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <Input value={c.text} onChange={(e) => setDraft((d) => d.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))} className="h-8 flex-1 text-[13px]" />
                  <IconButton size="sm" variant="ghost" aria-label={`Remove clause ${i + 1}`} onClick={() => setDraft((d) => d.filter((x) => x.id !== c.id))}><Trash2 className="h-4 w-4" /></IconButton>
                </div>
              ))}
            </div>
          )}

          {/* approval chain builder */}
          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-muted-fg/70"><GitBranch className="h-3.5 w-3.5" /> Approval chain (in order)</p>
              <span className="text-2xs text-muted-fg">Must clear before enforcement</span>
            </div>
            {chain.length === 0 ? (
              <p className="mb-2 text-[13px] text-muted-fg">No approvers — submitting will approve directly.</p>
            ) : (
              <ol className="mb-2 space-y-1.5">
                {chain.map((r, i) => (
                  <li key={`${r}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-surface2/40 px-2.5 py-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-2xs font-bold text-muted-fg">{i + 1}</span>
                    <span className="flex-1 text-[13px] font-semibold">{r}</span>
                    <IconButton size="sm" variant="ghost" aria-label={`Remove ${r}`} onClick={() => setChain((c) => c.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></IconButton>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex flex-wrap gap-1.5">
              {APPROVER_ROLES.map((r) => (
                <button key={r} type="button" onClick={() => setChain((c) => [...c, r])}
                  className="rounded-lg border border-dashed border-border px-2.5 py-1 text-2xs font-semibold text-muted-fg transition-colors hover:border-primary/40 hover:text-primary cursor-pointer">
                  <Plus className="mr-1 inline h-3 w-3" />{r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Switch checked={allowOverride} onChange={setAllowOverride} label="Allow children to override clauses" />
            <Badge tone="neutral">Saves as Draft</Badge>
          </div>
        </div>
      </Modal>
    </div>
  )
}
