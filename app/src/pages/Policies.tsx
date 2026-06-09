import { useMemo, useState } from 'react'
import {
  ShieldCheck, Check, FileText, Send, Plus, Info, CalendarClock, CheckCircle2,
  Layers, Lock, Pencil, RotateCcw, Eye,
} from 'lucide-react'
import { useApp } from '../app/store'
import { type Policy } from '../data/mock'
import { useCompanyData } from '../data/companyData'
import { usePolicies, type SharedPolicy } from '../app/policies'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, Drawer, EmptyState, Field, Input,
  Modal, PageHeader, ProgressBar, Select, Table, Td, Th, Tr, Tabs, Textarea, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type Tone = 'primary' | 'info' | 'accent' | 'warning' | 'neutral' | 'success' | 'danger'

const categoryTone = (cat: string): Tone => {
  switch (cat) {
    case 'Compliance': return 'warning'
    case 'Security': return 'info'
    case 'HR': return 'primary'
    case 'Finance': return 'accent'
    default: return 'neutral'
  }
}
const statusTone = (s: Policy['status']): Tone => {
  if (s === 'Active') return 'success'
  if (s === 'Draft') return 'warning'
  return 'neutral'
}
const ackTone = (pct: number): Tone =>
  pct >= 85 ? 'success' : pct >= 65 ? 'warning' : 'danger'

export default function Policies() {
  const { policies: policySeed } = useCompanyData()
  const { role, company } = useApp()
  const { push } = useToast()
  const { policiesForCompany, resolveClauses, overrideClause, resetClause } = usePolicies()
  const isEmployee = role === 'employee'

  const [tab, setTab] = useState<'ack' | 'group' | 'library'>('ack')
  const [acked, setAcked] = useState<Set<string>>(new Set())
  const [newOpen, setNewOpen] = useState(false)
  const [openPolicy, setOpenPolicy] = useState<SharedPolicy | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [previewP, setPreviewP] = useState<Policy | null>(null)

  const inherited = useMemo(() => policiesForCompany(company.id), [policiesForCompany, company.id])
  const startEdit = (text: string, id: string) => { setEditId(id); setEditText(text) }
  const saveEdit = (policyId: string, clauseId: string) => {
    overrideClause(company.id, policyId, clauseId, editText.trim() || '—')
    setEditId(null)
    push({ title: `Clause updated for ${company.name}`, tone: 'success' })
  }
  const resetEdit = (policyId: string, clauseId: string) => {
    resetClause(company.id, policyId, clauseId)
    push({ title: 'Reset to group version', tone: 'neutral' })
  }

  const toAck = useMemo(
    () => policySeed.filter((p) => p.status === 'Active' && p.due !== '—'),
    [policySeed],
  )
  const pendingCount = toAck.filter((p) => !acked.has(p.id)).length

  const acknowledge = (p: Policy) => {
    setAcked((prev) => new Set(prev).add(p.id))
    push({ title: `Acknowledged ${p.name} ${p.version}`, tone: 'success' })
  }

  const ackLabel = (
    <span className="flex items-center gap-2">
      To acknowledge {pendingCount > 0 && <Badge tone="warning">{pendingCount}</Badge>}
    </span>
  )
  const groupLabel = (
    <span className="flex items-center gap-2">Group policies {inherited.length > 0 && <Badge tone="neutral">{inherited.length}</Badge>}</span>
  )
  const tabs = isEmployee
    ? [{ value: 'ack', label: ackLabel }]
    : [
        { value: 'ack', label: ackLabel },
        { value: 'group', label: groupLabel },
        { value: 'library', label: 'Library' },
      ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Policies"
        subtitle={`Policies & documents for ${company.name}.`}
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={
          !isEmployee && (
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" /> New policy
            </Button>
          )
        }
      />

      <Tabs
        tabs={tabs}
        value={tab}
        onChange={(v) => setTab(isEmployee ? 'ack' : (v as 'ack' | 'group' | 'library'))}
        className="mb-6"
      />

      {tab === 'ack' && (
        <>
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-info/30 bg-info/5 px-4 py-3 text-sm text-muted-fg">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <p>
              Acknowledge each active policy before its due date. When a policy changes version,
              you'll be asked to <span className="font-semibold text-fg">re-acknowledge</span> it.
            </p>
          </div>

          {toAck.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Nothing to acknowledge"
              description="You're all caught up. New policies will appear here when published."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {toAck.map((p) => {
                const done = acked.has(p.id)
                return (
                  <Card key={p.id} className={cn('flex flex-col', done && 'opacity-80')}>
                    <CardBody className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </span>
                        <Badge tone={categoryTone(p.category)}>{p.category}</Badge>
                      </div>
                      <h3 className="mt-3 text-sm font-bold tracking-tight">
                        {p.name} <span className="font-medium text-muted-fg">{p.version}</span>
                      </h3>
                      <p className="mt-1 text-xs text-muted-fg">{p.appliesTo}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-fg">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Due <span className="tnum text-fg">{p.due}</span>
                      </div>
                      <div className="mt-4 flex-1" />
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPreviewP(p)}>
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                        {done ? (
                          <Badge tone="success" className="justify-center py-1.5">
                            <Check className="h-3.5 w-3.5" /> Done
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => acknowledge(p)}>
                            <Check className="h-3.5 w-3.5" /> Acknowledge
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'group' && !isEmployee && (
        <>
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-muted-fg">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>Inherited from your group. Enforced policies apply automatically; where override is allowed you can <span className="font-semibold text-fg">tailor a clause</span> for {company.name} — the group sees every change.</p>
          </div>
          {inherited.length === 0 ? (
            <EmptyState icon={<Layers className="h-5 w-5" />} title="No group policies" description="This company isn't part of a group, or the group hasn't shared any policies yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inherited.map((p) => {
                const clauses = resolveClauses(company.id, p)
                const overriddenN = clauses.filter((c) => c.overridden).length
                return (
                  <Card key={p.id} className="flex cursor-pointer flex-col transition-colors hover:border-accent/50" onClick={() => setOpenPolicy(p)}>
                    <CardBody className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
                        <Badge tone={categoryTone(p.category)}>{p.category}</Badge>
                      </div>
                      <h3 className="mt-3 text-sm font-bold tracking-tight">{p.name} <span className="font-medium text-muted-fg">{p.version}</span></h3>
                      <div className="mt-2"><Badge tone="accent"><Layers className="h-3 w-3" /> Inherited · {p.owner}</Badge></div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {p.enforced && <Badge tone="success" dot>Enforced</Badge>}
                        {p.allowOverride ? <Badge tone="neutral"><Pencil className="h-3 w-3" /> Override allowed</Badge> : <Badge tone="neutral"><Lock className="h-3 w-3" /> Locked</Badge>}
                      </div>
                      <div className="mt-3 flex-1" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="tnum text-2xs text-muted-fg">{clauses.length} clauses{overriddenN > 0 ? ` · ${overriddenN} tailored` : ''}</span>
                        <Button size="sm" variant="subtle">Review &amp; tailor</Button>
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'library' && !isEmployee && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Policy library</CardTitle>
              <Badge tone="neutral">{policySeed.length}</Badge>
            </div>
            <span className="hidden text-2xs font-semibold uppercase tracking-wide text-muted-fg sm:inline">
              Re-acknowledgement triggers on version change
            </span>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <thead>
                <Tr className="border-t-0 hover:bg-transparent">
                  <Th>Policy</Th>
                  <Th>Category</Th>
                  <Th>Applies to</Th>
                  <Th className="w-48">Acknowledged</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </thead>
              <tbody>
                {policySeed.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="text-xs text-muted-fg">{p.version}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><Badge tone={categoryTone(p.category)}>{p.category}</Badge></Td>
                    <Td className="text-muted-fg">{p.appliesTo}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={p.ackPct} tone={ackTone(p.ackPct)} className="w-24" />
                        <span className="tnum w-9 text-xs font-semibold text-muted-fg">{p.ackPct}%</span>
                      </div>
                    </Td>
                    <Td><Badge tone={statusTone(p.status)} dot>{p.status}</Badge></Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={p.status !== 'Active'}
                        onClick={() => push({ title: `Distributing ${p.name} ${p.version}`, tone: 'info' })}
                      >
                        <Send className="h-3.5 w-3.5" /> Distribute
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* preview a policy before acknowledging */}
      <Modal
        open={!!previewP}
        onClose={() => setPreviewP(null)}
        size="lg"
        title={previewP ? `${previewP.name} ${previewP.version}` : ''}
        description={previewP ? `${previewP.category} · ${previewP.appliesTo} · due ${previewP.due}` : undefined}
        footer={
          previewP && (
            <>
              <Button variant="ghost" onClick={() => setPreviewP(null)}>Close</Button>
              {!acked.has(previewP.id) && (
                <Button onClick={() => { acknowledge(previewP); setPreviewP(null) }}>
                  <Check className="h-4 w-4" /> Acknowledge
                </Button>
              )}
            </>
          )
        }
      >
        {previewP && (() => {
          const shared = inherited.find((sp) => sp.name.toLowerCase() === previewP.name.toLowerCase())
          return (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={categoryTone(previewP.category)}>{previewP.category}</Badge>
                {shared && <Badge tone="accent"><Layers className="h-3 w-3" /> Inherited · {shared.owner}</Badge>}
                <Badge tone="neutral">{previewP.version}</Badge>
              </div>
              {shared ? (
                <ol className="space-y-1.5">
                  {resolveClauses(company.id, shared).map((c, i) => (
                    <li key={c.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
                      <span className="tnum mt-0.5 text-2xs font-bold text-muted-fg/70">{String(i + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px]">{c.text}</p>
                        {c.overridden && <p className="mt-0.5 text-2xs text-muted-fg">Tailored for {company.name}</p>}
                      </div>
                      {c.mandatory && <Badge tone="warning">Mandatory</Badge>}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="space-y-2 text-sm text-muted-fg">
                  <p>This {previewP.category.toLowerCase()} policy applies to <span className="font-semibold text-fg">{previewP.appliesTo.toLowerCase()}</span>. Please read it in full before acknowledging.</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Follow the standards described in this policy in your day-to-day work.</li>
                    <li>Raise questions with your HR administrator.</li>
                    <li>You'll be asked to re-acknowledge when the version changes.</li>
                  </ul>
                  <p className="flex items-center gap-1.5 text-2xs"><FileText className="h-3.5 w-3.5" /> Full document available in the Library.</p>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* child: review & tailor an inherited group policy */}
      <Drawer open={!!openPolicy} onClose={() => { setOpenPolicy(null); setEditId(null) }} title={openPolicy?.name} width="max-w-xl">
        {openPolicy && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent"><Layers className="h-3 w-3" /> Inherited · {openPolicy.owner}</Badge>
              <Badge tone={categoryTone(openPolicy.category)}>{openPolicy.category}</Badge>
              <Badge tone="neutral">{openPolicy.version}</Badge>
              {openPolicy.enforced && <Badge tone="success" dot>Enforced</Badge>}
              {openPolicy.allowOverride ? <Badge tone="neutral"><Pencil className="h-3 w-3" /> Override allowed</Badge> : <Badge tone="neutral"><Lock className="h-3 w-3" /> Locked</Badge>}
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/5 px-4 py-3 text-sm text-muted-fg">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <p>
                Enforced by <span className="font-semibold text-fg">{openPolicy.owner}</span>.{' '}
                {openPolicy.allowOverride
                  ? <>You can rewrite a clause for <span className="font-semibold text-fg">{company.name}</span>; the group is notified of every change.</>
                  : 'Clauses are locked by the group and can’t be changed here.'}
              </p>
            </div>
            <ul className="space-y-2">
              {resolveClauses(company.id, openPolicy).map((c, i) => (
                <li key={c.id} className={cn('rounded-lg border px-3 py-2.5', c.overridden ? 'border-warning/40 bg-warning/5' : 'border-border')}>
                  <div className="flex items-start gap-2.5">
                    <span className="tnum mt-0.5 text-2xs font-bold text-muted-fg/70">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      {editId === c.id ? (
                        <>
                          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[64px] text-[13px]" />
                          <div className="mt-2 flex items-center gap-2">
                            <Button size="sm" onClick={() => saveEdit(openPolicy.id, c.id)}><Check className="h-3.5 w-3.5" /> Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-[13px]">{c.text}</p>
                          {c.overridden && <p className="mt-1 text-2xs text-muted-fg">Group: <span className="line-through">{c.original}</span></p>}
                        </>
                      )}
                    </div>
                    {c.mandatory && <Badge tone="warning">Mandatory</Badge>}
                  </div>
                  {editId !== c.id && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
                      {c.overridden && <Badge tone="warning"><Pencil className="h-3 w-3" /> Tailored for {company.name}</Badge>}
                      {openPolicy.allowOverride ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEdit(c.text, c.id)}><Pencil className="h-3.5 w-3.5" /> {c.overridden ? 'Edit override' : 'Override'}</Button>
                          {c.overridden && <Button size="sm" variant="ghost" onClick={() => resetEdit(openPolicy.id, c.id)}><RotateCcw className="h-3.5 w-3.5" /> Reset to group</Button>}
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-2xs text-muted-fg"><Lock className="h-3 w-3" /> Locked by group</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Drawer>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New policy"
        description="Draft a policy. It will require acknowledgement once published."
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setNewOpen(false)
                push({ title: 'Draft policy saved', tone: 'success' })
              }}
            >
              Save draft
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Policy name" required>
            <Input placeholder="e.g. Code of Conduct" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select defaultValue="HR">
                <option>HR</option>
                <option>Compliance</option>
                <option>Security</option>
                <option>Finance</option>
              </Select>
            </Field>
            <Field label="Applies to">
              <Select defaultValue="All employees">
                <option>All employees</option>
                <option>Engineering</option>
                <option>Sales, Ops</option>
                <option>All · India</option>
              </Select>
            </Field>
          </div>
          <Field label="Summary" hint="Shown to employees when they acknowledge.">
            <Textarea placeholder="What this policy covers and why it matters." />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
