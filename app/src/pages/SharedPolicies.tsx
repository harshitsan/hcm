/**
 * Shared Policies (platform/group console) — author a policy as clauses, enforce
 * it across member companies, allow children to override, and SEE every child
 * override (original → rewritten). Mirrors the child side via usePolicies().
 */
import { useState } from 'react'
import {
  ShieldCheck, Plus, Layers, Lock, Users, FileText, ArrowRight, Trash2, ListChecks,
  CheckCircle2, Pencil,
} from 'lucide-react'
import { useToast } from '../components/ui'
import {
  Badge, Button, Card, CardBody, Drawer, EmptyState, Field, IconButton,
  Input, Modal, PageHeader, Select, StatCard, Switch, Textarea,
} from '../components/ui'
import { usePolicies, type SharedPolicy, type Clause } from '../app/policies'
import { companies } from '../data/mock'
import { cn } from '../lib/cn'

const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? id
const catTone = (c: string) =>
  c === 'Compliance' ? 'warning' : c === 'Security' ? 'info' : c === 'HR' ? 'primary' : c === 'Finance' ? 'accent' : 'neutral'

// "paste your policy" → one clause per line (strips bullets / numbering)
function toClauses(text: string): Clause[] {
  return text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter((l) => l.length > 0)
    .map((t, i) => ({ id: `c${i + 1}`, text: t, mandatory: false }))
}

export default function SharedPolicies() {
  const { shared, addSharedPolicy, overridesForPolicy, totalOverrides } = usePolicies()
  const { push } = useToast()
  const [selected, setSelected] = useState<SharedPolicy | null>(null)
  const [open, setOpen] = useState(false)

  // authoring state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('HR')
  const [scope, setScope] = useState<'Group' | 'Portfolio' | 'Platform'>('Group')
  const [paste, setPaste] = useState('')
  const [draft, setDraft] = useState<Clause[]>([])
  const [enforced, setEnforced] = useState(true)
  const [allowOverride, setAllowOverride] = useState(true)

  const reset = () => { setName(''); setCategory('HR'); setScope('Group'); setPaste(''); setDraft([]); setEnforced(true); setAllowOverride(true) }
  const generate = () => setDraft(toClauses(paste))
  const publish = () => {
    if (!name.trim() || draft.length === 0) { push({ title: 'Add a name and at least one clause', tone: 'warning' }); return }
    addSharedPolicy({
      name: name.trim(), category, owner: 'Kensium Group', ownerScope: scope,
      appliesTo: ['c1', 'c2', 'c3', 'c4', 'c5'], enforced, allowOverride, clauses: draft,
    })
    push({ title: `Published “${name.trim()}” to the group`, tone: 'success' })
    setOpen(false); reset()
  }

  const companiesCovered = new Set(shared.flatMap((p) => p.appliesTo)).size
  const enforcedCount = shared.filter((p) => p.enforced).length

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Shared Policies"
        subtitle="Group policies enforced across member companies — children can tailor clauses where allowed."
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New shared policy</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Shared policies" value={shared.length} delta="group-wide" deltaTone="primary" icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Enforced" value={enforcedCount} delta="adopted by children" deltaTone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Companies covered" value={companiesCovered} delta="member tenants" deltaTone="info" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Child overrides" value={totalOverrides} delta="clauses tailored" deltaTone="warning" icon={<Pencil className="h-4 w-4" />} />
      </div>

      <div className="space-y-3">
        {shared.map((p) => {
          const ov = overridesForPolicy(p.id)
          return (
            <Card key={p.id} className="cursor-pointer transition-colors hover:border-accent/50" onClick={() => setSelected(p)}>
              <CardBody className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{p.name} <span className="font-medium text-muted-fg">{p.version}</span></p>
                  <p className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge tone="accent"><Layers className="h-3 w-3" /> {p.ownerScope} · {p.owner}</Badge>
                    <Badge tone={catTone(p.category)}>{p.category}</Badge>
                    <span className="tnum text-2xs text-muted-fg">{p.clauses.length} clauses · {p.appliesTo.length} companies</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {p.enforced && <Badge tone="success" dot>Enforced</Badge>}
                  {p.allowOverride
                    ? <Badge tone="neutral"><Pencil className="h-3 w-3" /> Override allowed</Badge>
                    : <Badge tone="neutral"><Lock className="h-3 w-3" /> Locked</Badge>}
                  {ov.length > 0 && <Badge tone="warning">{ov.length} override{ov.length > 1 ? 's' : ''}</Badge>}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* policy detail + child overrides */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name} width="max-w-xl">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent"><Layers className="h-3 w-3" /> {selected.ownerScope} · {selected.owner}</Badge>
              <Badge tone={catTone(selected.category)}>{selected.category}</Badge>
              <Badge tone="neutral">{selected.version}</Badge>
              {selected.enforced && <Badge tone="success" dot>Enforced</Badge>}
              {selected.allowOverride
                ? <Badge tone="neutral"><Pencil className="h-3 w-3" /> Children may override</Badge>
                : <Badge tone="neutral"><Lock className="h-3 w-3" /> Locked</Badge>}
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
              <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg/70">
                Child overrides ({overridesForPolicy(selected.id).length})
              </p>
              {overridesForPolicy(selected.id).length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="No overrides" description="Every member company is using the group version of this policy." />
              ) : (
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
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* authoring: paste → clauses */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); reset() }}
        title="New shared policy"
        description="Paste your policy text — each line becomes a clause member companies adopt."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button onClick={publish}>Publish to group</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Policy name" required className="sm:col-span-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remote Work Policy" /></Field>
            <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value)}><option>HR</option><option>Compliance</option><option>Security</option><option>Finance</option></Select></Field>
            <Field label="Owner scope"><Select value={scope} onChange={(e) => setScope(e.target.value as 'Group' | 'Portfolio' | 'Platform')}><option value="Group">Group · Kensium Group</option><option value="Portfolio">Portfolio · OpsMaven</option><option value="Platform">Platform · SatelliteHR</option></Select></Field>
          </div>

          <Field label="Paste your policy" hint="One clause per line. Bullets and numbering are stripped automatically.">
            <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} className="min-h-[120px]" placeholder={'- Treat colleagues with respect\n- Report conflicts of interest\n- Protect confidential information'} />
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

          <div className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <Switch checked={enforced} onChange={setEnforced} label="Enforce across member companies" />
            <Switch checked={allowOverride} onChange={setAllowOverride} label="Allow children to override clauses" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
