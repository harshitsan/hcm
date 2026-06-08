import { useMemo, useState } from 'react'
import {
  ShieldCheck, Check, FileText, Send, Plus, Info, CalendarClock, CheckCircle2,
} from 'lucide-react'
import { useApp } from '../app/store'
import { policies as policySeed, type Policy } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input,
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
  const { role, company } = useApp()
  const { push } = useToast()
  const isEmployee = role === 'employee'

  const [tab, setTab] = useState<'ack' | 'library'>('ack')
  const [acked, setAcked] = useState<Set<string>>(new Set())
  const [newOpen, setNewOpen] = useState(false)

  const toAck = useMemo(
    () => policySeed.filter((p) => p.status === 'Active' && p.due !== '—'),
    [],
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
  const tabs = isEmployee
    ? [{ value: 'ack', label: ackLabel }]
    : [
        { value: 'ack', label: ackLabel },
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
        onChange={(v) => setTab(v === 'library' && !isEmployee ? 'library' : 'ack')}
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
                      {done ? (
                        <Badge tone="success" className="w-full justify-center py-1.5">
                          <Check className="h-3.5 w-3.5" /> Acknowledged
                        </Badge>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => acknowledge(p)}>
                          <Check className="h-3.5 w-3.5" /> Acknowledge
                        </Button>
                      )}
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
