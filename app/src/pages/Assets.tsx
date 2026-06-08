import { useMemo, useState } from 'react'
import {
  Laptop, Smartphone, Router, Keyboard, Armchair, Plus, ArrowLeftRight,
  PackageCheck, Undo2, ShieldCheck, Boxes, ClipboardCheck, AlertTriangle,
  CircleCheck, Workflow, UserCheck, Search,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle,
  EmptyState, Field, IconButton, Input, Modal, PageHeader, Segmented, Select,
  StatCard, Table, Td, Th, Tr, Textarea, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- types */
type Category = 'IT Equipment' | 'Mobile Devices' | 'Network Equipment' | 'Peripherals' | 'Furniture'
type LifecycleState =
  | 'Available' | 'Allocated' | 'Issued' | 'In Repair' | 'Returned' | 'Retired'
type AssetRow = {
  id: string
  tag: string
  name: string
  category: Category
  state: LifecycleState
  holderIdx: number | null // index into employees, or null = stock
  ack: 'Acknowledged' | 'Pending' | null
  issuedOn: string
  dueBack: string | null // ISO, only for departing holders
}
type TxnKind = 'Issue' | 'Return' | 'Transfer' | 'Recovery'

/* ----------------------------------------------------------------- constants (deterministic, no Date.now/random) */
const TODAY = new Date('2026-06-09')
const DAY = 86_400_000

const CATEGORIES: Category[] = [
  'IT Equipment', 'Mobile Devices', 'Network Equipment', 'Peripherals', 'Furniture',
]

const CATEGORY_ICON: Record<Category, typeof Laptop> = {
  'IT Equipment': Laptop,
  'Mobile Devices': Smartphone,
  'Network Equipment': Router,
  Peripherals: Keyboard,
  Furniture: Armchair,
}

const STATE_TONE: Record<LifecycleState, 'neutral' | 'info' | 'accent' | 'accent2' | 'success' | 'warning' | 'danger'> = {
  Available: 'success',
  Allocated: 'info',
  Issued: 'accent',
  'In Repair': 'warning',
  Returned: 'accent2',
  Retired: 'neutral',
}

const STATE_HEX: Record<LifecycleState, string> = {
  Available: '#16a34a',
  Allocated: '#4f46e5',
  Issued: 'rgb(var(--accent))',
  'In Repair': '#d97706',
  Returned: 'rgb(var(--accent2))',
  Retired: '#94a3b8',
}

const TXN_META: Record<TxnKind, { icon: typeof PackageCheck; tone: 'accent' | 'accent2' | 'info' | 'warning'; verb: string }> = {
  Issue: { icon: PackageCheck, tone: 'accent', verb: 'Issue to employee' },
  Return: { icon: Undo2, tone: 'accent2', verb: 'Return to stock' },
  Transfer: { icon: ArrowLeftRight, tone: 'info', verb: 'Transfer between employees' },
  Recovery: { icon: ShieldCheck, tone: 'warning', verb: 'Recover (exit / overdue)' },
}

// Allowed lifecycle transitions (BRD 6.20.2) — surfaced as a small "journey" rail.
const LIFECYCLE_FLOW: { state: LifecycleState; note: string }[] = [
  { state: 'Available', note: 'In stock, ready to assign' },
  { state: 'Allocated', note: 'Reserved for a hire' },
  { state: 'Issued', note: 'Handed over · acknowledged' },
  { state: 'In Repair', note: 'Out for service' },
  { state: 'Returned', note: 'Handed back · condition noted' },
  { state: 'Retired', note: 'End of life · disposed' },
]

// Seed inventory: deterministic, references employees by index so it re-maps on company switch.
const SEED: Omit<AssetRow, 'id'>[] = [
  { tag: 'IT-0411', name: 'MacBook Pro 14"', category: 'IT Equipment', state: 'Issued', holderIdx: 3, ack: 'Acknowledged', issuedOn: '2026-01-12', dueBack: null },
  { tag: 'IT-0418', name: 'Dell Latitude 7440', category: 'IT Equipment', state: 'Issued', holderIdx: 7, ack: 'Pending', issuedOn: '2026-05-28', dueBack: null },
  { tag: 'IT-0423', name: 'ThinkPad X1 Carbon', category: 'IT Equipment', state: 'In Repair', holderIdx: 4, ack: 'Acknowledged', issuedOn: '2025-11-03', dueBack: null },
  { tag: 'IT-0427', name: 'MacBook Air M3', category: 'IT Equipment', state: 'Available', holderIdx: null, ack: null, issuedOn: '—', dueBack: null },
  { tag: 'MOB-0102', name: 'iPhone 15', category: 'Mobile Devices', state: 'Issued', holderIdx: 5, ack: 'Acknowledged', issuedOn: '2025-09-20', dueBack: '2026-06-12' },
  { tag: 'MOB-0107', name: 'Samsung Galaxy S24', category: 'Mobile Devices', state: 'Allocated', holderIdx: null, ack: null, issuedOn: '—', dueBack: null },
  { tag: 'MOB-0111', name: 'iPad Air 11"', category: 'Mobile Devices', state: 'Returned', holderIdx: 6, ack: 'Acknowledged', issuedOn: '2025-04-15', dueBack: null },
  { tag: 'NET-0031', name: 'Cisco Meraki AP', category: 'Network Equipment', state: 'Available', holderIdx: null, ack: null, issuedOn: '—', dueBack: null },
  { tag: 'NET-0034', name: 'Ubiquiti Switch 24', category: 'Network Equipment', state: 'Issued', holderIdx: 2, ack: 'Acknowledged', issuedOn: '2025-07-08', dueBack: null },
  { tag: 'PER-0205', name: 'Dell U2723QE Monitor', category: 'Peripherals', state: 'Issued', holderIdx: 3, ack: 'Pending', issuedOn: '2026-06-02', dueBack: null },
  { tag: 'PER-0212', name: 'Logitech MX Master 3S', category: 'Peripherals', state: 'Available', holderIdx: null, ack: null, issuedOn: '—', dueBack: null },
  { tag: 'PER-0219', name: 'Keychron K3 Keyboard', category: 'Peripherals', state: 'Issued', holderIdx: 8, ack: 'Pending', issuedOn: '2026-05-30', dueBack: '2026-06-07' },
  { tag: 'FUR-0061', name: 'Herman Miller Aeron', category: 'Furniture', state: 'Issued', holderIdx: 1, ack: 'Acknowledged', issuedOn: '2024-12-01', dueBack: null },
  { tag: 'FUR-0066', name: 'Standing Desk Pro', category: 'Furniture', state: 'Retired', holderIdx: null, ack: null, issuedOn: '—', dueBack: null },
]

/* ----------------------------------------------------------------- helpers */
function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.round((d.getTime() - TODAY.getTime()) / DAY)
}

function isOverdue(row: AssetRow): boolean {
  const d = daysUntil(row.dueBack)
  return d !== null && d < 0 && row.state !== 'Returned'
}

/* ----------------------------------------------------------------- page */
export default function Assets() {
  const { role, persona, company } = useApp()
  const { employees } = useCompanyData()
  const { push } = useToast()

  const isEmployee = role === 'employee'
  // Map seed rows onto real people of the active company (deterministic).
  const seedRows: AssetRow[] = useMemo(
    () =>
      SEED.map((s, i) => ({
        ...s,
        id: `as-${i}`,
        holderIdx: s.holderIdx === null ? null : s.holderIdx % Math.max(1, employees.length),
      })),
    [employees.length],
  )

  const [rows, setRows] = useState<AssetRow[]>(seedRows)
  const [catFilter, setCatFilter] = useState<'All' | Category>('All')
  const [query, setQuery] = useState('')

  // transaction modal
  const [txnOpen, setTxnOpen] = useState(false)
  const [txnKind, setTxnKind] = useState<TxnKind>('Issue')
  const [txnAssetId, setTxnAssetId] = useState<string>(seedRows[3]?.id ?? '')
  const [txnTargetIdx, setTxnTargetIdx] = useState<number>(0)
  const [txnNote, setTxnNote] = useState('')

  const holderName = (idx: number | null) =>
    idx === null || !employees[idx] ? null : employees[idx].name

  /* -------- derived stats -------- */
  const totalCount = rows.length
  const pendingAck = useMemo(() => rows.filter((r) => r.ack === 'Pending').length, [rows])
  const overdueCount = useMemo(() => rows.filter(isOverdue).length, [rows])
  const inRepair = useMemo(() => rows.filter((r) => r.state === 'In Repair').length, [rows])

  const stateMix = useMemo(() => {
    const order: LifecycleState[] = ['Available', 'Allocated', 'Issued', 'In Repair', 'Returned', 'Retired']
    return order
      .map((state) => ({ name: state, value: rows.filter((r) => r.state === state).length, tone: STATE_HEX[state] }))
      .filter((d) => d.value > 0)
  }, [rows])
  const totalMix = stateMix.reduce((a, b) => a + b.value, 0) || 1

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (catFilter !== 'All' && r.category !== catFilter) return false
      if (q === '') return true
      const h = holderName(r.holderIdx)?.toLowerCase() ?? ''
      return r.name.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q) || h.includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, catFilter, query, employees])

  /* -------- employee self-view: assets assigned to the linked employee -------- */
  const selfEmployeeId = persona?.employeeId ?? null
  const selfIdx = useMemo(
    () => (selfEmployeeId ? employees.findIndex((e) => e.id === selfEmployeeId) : 0),
    [employees, selfEmployeeId],
  )
  const myName = employees[selfIdx]?.name ?? persona?.name ?? 'You'
  const myAssets = useMemo(
    () => rows.filter((r) => r.holderIdx === selfIdx && (r.state === 'Issued' || r.state === 'In Repair')),
    [rows, selfIdx],
  )

  /* -------- actions -------- */
  const openTxn = (kind: TxnKind, presetAssetId?: string) => {
    setTxnKind(kind)
    if (presetAssetId) setTxnAssetId(presetAssetId)
    setTxnTargetIdx(0)
    setTxnNote('')
    setTxnOpen(true)
  }

  const submitTxn = () => {
    const asset = rows.find((r) => r.id === txnAssetId)
    if (!asset) {
      push({ title: 'Pick an asset first', tone: 'warning' })
      return
    }
    if ((txnKind === 'Return' || txnKind === 'Recovery') && !txnNote.trim()) {
      push({ title: 'A condition note is required', tone: 'warning' })
      return
    }
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== txnAssetId) return r
        if (txnKind === 'Issue' || txnKind === 'Transfer') {
          return { ...r, state: 'Issued', holderIdx: txnTargetIdx, ack: 'Pending', issuedOn: '2026-06-09', dueBack: null }
        }
        // Return / Recovery
        return { ...r, state: 'Returned', holderIdx: null, ack: null, dueBack: null }
      }),
    )
    push({
      title: `${txnKind} recorded · ${asset.tag}${txnKind === 'Issue' || txnKind === 'Transfer' ? ` → ${employees[txnTargetIdx]?.name ?? ''}` : ''}`,
      tone: 'success',
    })
    setTxnOpen(false)
  }

  const acknowledge = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ack: 'Acknowledged' } : r)))
    push({ title: 'Receipt acknowledged · recorded with timestamp', tone: 'success' })
  }

  /* ===================================================================== EMPLOYEE SELF-VIEW */
  if (isEmployee) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="My Assets"
          subtitle={`Company property assigned to ${myName} at ${company.name}.`}
          icon={<Boxes className="h-5 w-5" />}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Assets held" value={myAssets.length} icon={<Boxes className="h-4 w-4" />} />
          <StatCard
            label="Pending acknowledgement"
            value={myAssets.filter((a) => a.ack === 'Pending').length}
            deltaTone="warning"
            delta={myAssets.some((a) => a.ack === 'Pending') ? 'Action needed' : undefined}
            icon={<ClipboardCheck className="h-4 w-4" />}
          />
          <StatCard label="In repair" value={myAssets.filter((a) => a.state === 'In Repair').length} icon={<AlertTriangle className="h-4 w-4" />} />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Assets assigned to me</CardTitle>
            <Badge tone="info" dot>Self-service</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            {myAssets.length === 0 ? (
              <EmptyState
                icon={<Boxes className="h-5 w-5" />}
                title="No assets assigned"
                description="When IT or HR issues you a laptop, phone or other gear, it will appear here for acknowledgement."
              />
            ) : (
              myAssets.map((a) => {
                const Icon = CATEGORY_ICON[a.category]
                return (
                  <div
                    key={a.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface2/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{a.name}</p>
                        <p className="text-xs text-muted-fg">
                          {a.tag} · {a.category} · issued {a.issuedOn}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATE_TONE[a.state]} dot>{a.state}</Badge>
                      {a.ack === 'Acknowledged' ? (
                        <Badge tone="success"><CircleCheck className="h-3 w-3" /> Acknowledged</Badge>
                      ) : (
                        <Button size="sm" onClick={() => acknowledge(a.id)}>
                          <ClipboardCheck className="h-4 w-4" /> Acknowledge receipt
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardBody>
        </Card>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-fg">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Acknowledging records a timestamped digital receipt. On exit, returns are confirmed here as part of your clearance.
        </p>
      </div>
    )
  }

  /* ===================================================================== HR / ADMIN VIEW */
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Asset Management"
        subtitle={`Inventory, allocation & acknowledgements for ${company.name}.`}
        icon={<Boxes className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <IconButton variant="outline" aria-label="Issue asset" onClick={() => openTxn('Issue')}>
              <PackageCheck className="h-[18px] w-[18px]" />
            </IconButton>
            <IconButton variant="outline" aria-label="Transfer asset" onClick={() => openTxn('Transfer')}>
              <ArrowLeftRight className="h-[18px] w-[18px]" />
            </IconButton>
            <IconButton variant="outline" aria-label="Recover asset" onClick={() => openTxn('Recovery')}>
              <ShieldCheck className="h-[18px] w-[18px]" />
            </IconButton>
            <Button onClick={() => openTxn('Issue')}>
              <Plus className="h-4 w-4" /> New transaction
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total inventory" value={totalCount} icon={<Boxes className="h-4 w-4" />} />
        <StatCard
          label="Pending acknowledgements"
          value={pendingAck}
          deltaTone="warning"
          delta={pendingAck > 0 ? 'Chase' : undefined}
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Overdue returns"
          value={overdueCount}
          deltaTone="danger"
          delta={overdueCount > 0 ? 'Action' : undefined}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard label="In repair" value={inRepair} deltaTone="warning" icon={<Router className="h-4 w-4" />} />
      </div>

      {/* Status donut + lifecycle journey */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Inventory by state</CardTitle>
            <Badge tone="neutral">{totalCount} assets</Badge>
          </CardHeader>
          <CardBody>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RTooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid rgb(var(--border))', fontSize: 12, background: 'rgb(var(--surface))' }}
                  />
                  <Pie data={stateMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                    {stateMix.map((m) => (
                      <Cell key={m.name} fill={m.tone} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-2">
              {stateMix.map((m) => (
                <li key={m.name} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.tone }} />
                    <span className="font-semibold text-fg">{m.name}</span>
                  </span>
                  <span className="tnum text-muted-fg">
                    {m.value} · {Math.round((m.value / totalMix) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {/* Lifecycle journey rail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset lifecycle</CardTitle>
            <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-fg">
              <Workflow className="h-3.5 w-3.5" /> Allowed transitions
            </span>
          </CardHeader>
          <CardBody>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {LIFECYCLE_FLOW.map((s, i) => (
                <div key={s.state} className="flex items-stretch gap-3">
                  <div className="flex min-w-[140px] flex-col rounded-xl border border-border bg-surface2/50 p-3">
                    <Badge tone={STATE_TONE[s.state]} dot>{s.state}</Badge>
                    <p className="mt-2 text-xs text-muted-fg">{s.note}</p>
                    <span className="mt-2 tnum text-lg font-extrabold tracking-tight text-fg">
                      {rows.filter((r) => r.state === s.state).length}
                    </span>
                  </div>
                  {i < LIFECYCLE_FLOW.length - 1 && (
                    <span className="flex items-center text-muted-fg">
                      <ArrowLeftRight className="h-4 w-4 rotate-0" />
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border bg-surface2/40 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCheck className="h-4 w-4" />
              </span>
              <p className="text-xs text-muted-fg">
                <span className="font-semibold text-fg">Onboarding &amp; exit integration.</span>{' '}
                Issue tasks appear in a new hire's onboarding checklist; recovery is a parallel step in exit clearance —
                both require the employee's digital acknowledgement.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Inventory table */}
      <Card className="mt-6">
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>Inventory</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tag, name or holder…"
                className="pl-9"
                aria-label="Search assets"
              />
            </div>
            <Segmented<'All' | Category>
              value={catFilter}
              onChange={setCatFilter}
              options={[{ value: 'All', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c, label: c.split(' ')[0] }))]}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No assets match"
                description="Try a different search or category."
                action={
                  <Button variant="outline" size="sm" onClick={() => { setQuery(''); setCatFilter('All') }}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <thead>
                <Tr className="border-t-0 hover:bg-transparent">
                  <Th>Asset</Th>
                  <Th>Category</Th>
                  <Th>State</Th>
                  <Th>Assigned to</Th>
                  <Th>Acknowledgement</Th>
                  <Th>Due back</Th>
                  <Th className="text-right">Action</Th>
                </Tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const Icon = CATEGORY_ICON[r.category]
                  const holder = holderName(r.holderIdx)
                  const overdue = isOverdue(r)
                  const due = daysUntil(r.dueBack)
                  return (
                    <Tr key={r.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-fg">{r.name}</p>
                            <p className="text-2xs uppercase tracking-wide text-muted-fg">{r.tag}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-muted-fg">{r.category}</Td>
                      <Td><Badge tone={STATE_TONE[r.state]} dot>{r.state}</Badge></Td>
                      <Td>
                        {holder ? (
                          <span className="inline-flex items-center gap-2">
                            <Avatar name={holder} size="xs" />
                            <span className="truncate text-fg">{holder}</span>
                          </span>
                        ) : (
                          <span className="text-muted-fg">In stock</span>
                        )}
                      </Td>
                      <Td>
                        {r.ack === 'Acknowledged' ? (
                          <Badge tone="success"><CircleCheck className="h-3 w-3" /> Acknowledged</Badge>
                        ) : r.ack === 'Pending' ? (
                          <Badge tone="warning" dot>Pending</Badge>
                        ) : (
                          <span className="text-muted-fg">—</span>
                        )}
                      </Td>
                      <Td>
                        {due === null ? (
                          <span className="text-muted-fg">—</span>
                        ) : overdue ? (
                          <Badge tone="danger"><AlertTriangle className="h-3 w-3" /> {Math.abs(due)}d overdue</Badge>
                        ) : (
                          <span className="tnum text-muted-fg">in {due}d</span>
                        )}
                      </Td>
                      <Td className="text-right">
                        {r.holderIdx !== null ? (
                          <Button variant="outline" size="sm" onClick={() => openTxn('Recovery', r.id)}>
                            <ShieldCheck className="h-3.5 w-3.5" /> Recover
                          </Button>
                        ) : r.state === 'Available' ? (
                          <Button variant="outline" size="sm" onClick={() => openTxn('Issue', r.id)}>
                            <PackageCheck className="h-3.5 w-3.5" /> Issue
                          </Button>
                        ) : (
                          <span className="text-muted-fg">—</span>
                        )}
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Pending acknowledgements panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending acknowledgements</CardTitle>
          {pendingAck > 0 && (
            <AvatarStack
              names={rows.filter((r) => r.ack === 'Pending').map((r) => holderName(r.holderIdx) ?? '?')}
              max={5}
              size="sm"
            />
          )}
        </CardHeader>
        <CardBody className="space-y-2.5">
          {pendingAck === 0 ? (
            <EmptyState
              icon={<CircleCheck className="h-5 w-5" />}
              title="All caught up"
              description="Every issued asset has a signed digital receipt."
            />
          ) : (
            rows
              .filter((r) => r.ack === 'Pending')
              .map((r) => {
                const holder = holderName(r.holderIdx)
                const Icon = CATEGORY_ICON[r.category]
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-surface2/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-fg">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg">{r.name} · {r.tag}</p>
                        <p className="text-xs text-muted-fg">{holder ?? '—'} · issued {r.issuedOn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="warning" dot>Awaiting receipt</Badge>
                      <Button variant="outline" size="sm" onClick={() => push({ title: `Reminder sent to ${holder ?? 'holder'}`, tone: 'info' })}>
                        Send reminder
                      </Button>
                    </div>
                  </div>
                )
              })
          )}
        </CardBody>
      </Card>

      {/* Transaction modal */}
      <Modal
        open={txnOpen}
        onClose={() => setTxnOpen(false)}
        title="Record asset transaction"
        description="Issue, return, transfer or recover company gear. Acknowledgements are requested automatically."
        footer={
          <>
            <Button variant="outline" onClick={() => setTxnOpen(false)}>Cancel</Button>
            <Button onClick={submitTxn}>
              <PackageCheck className="h-4 w-4" /> Record {txnKind}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Transaction type">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(TXN_META) as TxnKind[]).map((k) => {
                const Icon = TXN_META[k].icon
                const active = txnKind === k
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTxnKind(k)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors',
                      active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-fg hover:bg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {k}
                  </button>
                )
              })}
            </div>
            <span className="mt-1.5 block text-xs text-muted-fg">{TXN_META[txnKind].verb}</span>
          </Field>

          <Field label="Asset" required>
            <Select value={txnAssetId} onChange={(e) => setTxnAssetId(e.target.value)}>
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.tag} — {r.name} ({r.state})
                </option>
              ))}
            </Select>
          </Field>

          {(txnKind === 'Issue' || txnKind === 'Transfer') && (
            <Field label={txnKind === 'Transfer' ? 'Transfer to' : 'Issue to'} required>
              <Select value={txnTargetIdx} onChange={(e) => setTxnTargetIdx(Number(e.target.value))}>
                {employees.map((emp, i) => (
                  <option key={emp.id} value={i}>
                    {emp.name} · {emp.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field
            label="Condition / handover note"
            required={txnKind === 'Return' || txnKind === 'Recovery'}
            hint={txnKind === 'Return' || txnKind === 'Recovery' ? 'Required for returns and recoveries (BRD 6.20.4).' : 'Optional context for the audit trail.'}
          >
            <Textarea
              value={txnNote}
              onChange={(e) => setTxnNote(e.target.value)}
              placeholder="e.g. Good condition, charger included; minor scuff on lid."
            />
          </Field>

          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <ShieldCheck className="h-3 w-3" /> Written to the company audit trail with actor, timestamp and old/new state.
          </p>
        </div>
      </Modal>
    </div>
  )
}
