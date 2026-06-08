import { useMemo, useState } from 'react'
import {
  UserRound, Pencil, ShieldCheck, Bell, FileText, Download, Plus, Mail, Phone,
  MapPin, Building2, CalendarDays, BadgeCheck, Laptop, Lock, Inbox, ChevronRight,
  CheckCircle2, Clock, Save, Smartphone, Headphones, KeyRound, ScrollText,
} from 'lucide-react'
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState,
  Field, IconButton, Input, Modal, PageHeader, ProgressBar, Select, Switch, Textarea,
  Tooltip, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- module-scope mock data */

type ChangeStatus = 'Approved' | 'Pending' | 'Rejected'
type ChangeRequest = {
  id: string
  field: string
  from: string
  to: string
  raised: string
  status: ChangeStatus
}

type EditableKey = 'phone' | 'personalEmail' | 'emergencyName' | 'emergencyPhone' | 'address'
type EditableField = { key: EditableKey; label: string; icon: typeof Phone; value: string }

type SensitiveField = { label: string; value: string; note: string }

type AssetState = 'Issued' | 'Acknowledged' | 'Return due'
type MyAsset = { id: string; name: string; tag: string; issued: string; state: AssetState; icon: typeof Laptop }

type QuickDoc = { id: string; name: string; kind: 'Letter' | 'Document'; date: string; new?: boolean }

const SENSITIVE_FIELDS: SensitiveField[] = [
  { label: 'Legal name', value: '—', note: 'Statutory · HR-managed' },
  { label: 'Date of birth', value: '14 Feb 1992', note: 'Statutory · HR-managed' },
  { label: 'Bank account', value: '•••• •••• 4821', note: 'Sensitive · change request' },
  { label: 'PAN', value: 'ABXP•••• 7K', note: 'Statutory · change request' },
  { label: 'Aadhaar', value: '•••• •••• 9032', note: 'Statutory · change request' },
]

const CHANGE_REQUESTS: ChangeRequest[] = [
  { id: 'cr-1', field: 'Bank account', from: '•••• 1190', to: '•••• 4821', raised: '02 Jun 2026', status: 'Pending' },
  { id: 'cr-2', field: 'Legal name', from: 'Meera Iyer', to: 'Meera Iyer-Rao', raised: '21 May 2026', status: 'Approved' },
  { id: 'cr-3', field: 'PAN', from: 'ABXP•••• 1A', to: 'ABXP•••• 7K', raised: '08 May 2026', status: 'Rejected' },
]

const MY_ASSETS: MyAsset[] = [
  { id: 'as-1', name: 'MacBook Pro 14"', tag: 'KEN-LAP-2291', issued: '12 Jan 2026', state: 'Acknowledged', icon: Laptop },
  { id: 'as-2', name: 'iPhone 15', tag: 'KEN-MOB-0418', issued: '12 Jan 2026', state: 'Issued', icon: Smartphone },
  { id: 'as-3', name: 'Sony WH-1000XM5', tag: 'KEN-AUD-0073', issued: '03 Feb 2026', state: 'Return due', icon: Headphones },
]

const QUICK_DOCS: QuickDoc[] = [
  { id: 'qd-1', name: 'Appointment Letter', kind: 'Letter', date: '10 May 2023', new: true },
  { id: 'qd-2', name: 'Confirmation Letter', kind: 'Letter', date: '10 Nov 2023' },
  { id: 'qd-3', name: 'Salary Revision FY26', kind: 'Letter', date: '01 Apr 2026', new: true },
  { id: 'qd-4', name: 'PF Statement 2025-26', kind: 'Document', date: '15 Apr 2026' },
]

// Self-service "journey" — onboarding/self-service touchpoints (US-EMP onboarding journey).
const JOURNEY: { stage: string; items: { label: string; done: boolean }[] }[] = [
  {
    stage: 'Profile',
    items: [
      { label: 'Confirm personal details', done: true },
      { label: 'Add emergency contact', done: true },
    ],
  },
  {
    stage: 'Assets',
    items: [
      { label: 'Acknowledge laptop', done: true },
      { label: 'Acknowledge phone', done: false },
    ],
  },
  {
    stage: 'Policies',
    items: [
      { label: 'Code of Conduct v3', done: true },
      { label: 'Data Privacy 2026', done: false },
    ],
  },
  {
    stage: 'Letters',
    items: [
      { label: 'Download appointment letter', done: false },
    ],
  },
]

const PREF_EVENTS: { key: string; label: string }[] = [
  { key: 'leave', label: 'Leave approvals & status' },
  { key: 'policy', label: 'Policy acknowledgments due' },
  { key: 'letters', label: 'New letters & documents' },
  { key: 'asset', label: 'Asset issuance & recovery' },
]

const STATUS_TONE: Record<ChangeStatus, 'warning' | 'success' | 'danger'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
}

const ASSET_TONE: Record<AssetState, 'success' | 'accent2' | 'warning'> = {
  Acknowledged: 'success',
  Issued: 'accent2',
  'Return due': 'warning',
}

/* ----------------------------------------------------------------- presentational helpers */

function ReadField({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">{label}</p>
        <p className="truncate text-sm font-semibold text-fg">{value}</p>
      </div>
    </div>
  )
}

function JourneyColumn({ stage, items }: { stage: string; items: { label: string; done: boolean }[] }) {
  const doneCount = items.filter((i) => i.done).length
  return (
    <div className="w-60 shrink-0 rounded-2xl border border-border bg-surface2/40 p-3 sm:w-auto">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[13px] font-bold text-fg">{stage}</span>
        <Badge tone={doneCount === items.length ? 'success' : 'neutral'}>
          {doneCount}/{items.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5"
          >
            {it.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-warning" />
            )}
            <span className={cn('text-[13px] font-medium', it.done ? 'text-muted-fg line-through' : 'text-fg')}>
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page */

export default function Profile() {
  const { persona, role, company } = useApp()
  const { employees, getEmployee, getDepartment, leaveBalances } = useCompanyData()
  const { push } = useToast()

  // Limited-access variant: deterministic, keyed off the demo persona id (no randomness).
  const isLimited = persona?.id === 'p5'

  // Resolve "me": prefer the persona's linked employee record, else the first employee.
  const me = useMemo(() => {
    const linked = persona?.employeeId ? getEmployee(persona.employeeId) : null
    return linked ?? employees[0] ?? null
  }, [persona, getEmployee, employees])

  const manager = useMemo(() => (me?.managerId ? getEmployee(me.managerId) : null), [me, getEmployee])
  const department = useMemo(() => (me ? getDepartment(me.departmentId) : null), [me, getDepartment])

  // Peers in my department for the avatar cluster (exclude me).
  const teamNames = useMemo(
    () => employees.filter((e) => me && e.departmentId === me.departmentId && e.id !== me.id).map((e) => e.name),
    [employees, me],
  )

  // Editable (non-sensitive) fields seeded from my record — employee-editable per US-EMP-02.
  const editableSeed: EditableField[] = useMemo(
    () => [
      { key: 'phone', label: 'Personal phone', icon: Phone, value: me?.phone ?? '+91 90000 00000' },
      { key: 'personalEmail', label: 'Personal email', icon: Mail, value: 'meera.personal@gmail.com' },
      { key: 'emergencyName', label: 'Emergency contact', icon: UserRound, value: 'Lakshmi Iyer (Mother)' },
      { key: 'emergencyPhone', label: 'Emergency phone', icon: Phone, value: '+91 90123 45678' },
      { key: 'address', label: 'Current address', icon: MapPin, value: '14 Brigade Road, Bengaluru 560001' },
    ],
    [me],
  )
  const [editable, setEditable] = useState<EditableField[]>(editableSeed)

  // Edit non-sensitive fields modal.
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState<Record<EditableKey, string>>(
    () => Object.fromEntries(editableSeed.map((f) => [f.key, f.value])) as Record<EditableKey, string>,
  )

  const openEdit = () => {
    setDraft(Object.fromEntries(editable.map((f) => [f.key, f.value])) as Record<EditableKey, string>)
    setEditOpen(true)
  }
  const saveEdit = () => {
    setEditable((prev) => prev.map((f) => ({ ...f, value: draft[f.key].trim() || f.value })))
    setEditOpen(false)
    push({ title: 'Profile updated · audit entry written', tone: 'success' })
  }

  // Sensitive-field change request modal (US-EMP-03).
  const [crOpen, setCrOpen] = useState(false)
  const [crField, setCrField] = useState(SENSITIVE_FIELDS[2].label)
  const [crValue, setCrValue] = useState('')
  const [crReason, setCrReason] = useState('')
  const [requests, setRequests] = useState<ChangeRequest[]>(CHANGE_REQUESTS)

  const submitCr = () => {
    if (!crValue.trim()) {
      push({ title: 'Enter the requested new value', tone: 'warning' })
      return
    }
    const current = SENSITIVE_FIELDS.find((f) => f.label === crField)?.value ?? '—'
    setRequests((prev) => [
      { id: `cr-${prev.length + 1}`, field: crField, from: current, to: crValue.trim(), raised: '09 Jun 2026', status: 'Pending' },
      ...prev,
    ])
    setCrOpen(false)
    setCrValue('')
    setCrReason('')
    push({ title: 'Change request raised · routed to HR for review', tone: 'success' })
  }

  // Notification preferences shortcut.
  const [prefOpen, setPrefOpen] = useState(false)
  const [channels, setChannels] = useState({ email: true, inApp: true, sms: false })
  const [events, setEvents] = useState<Record<string, boolean>>({ leave: true, policy: true, letters: true, asset: false })

  // Assets — acknowledge action (US-EMP-30).
  const [assets, setAssets] = useState<MyAsset[]>(MY_ASSETS)
  const ackAsset = (id: string) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, state: 'Acknowledged' } : a)))
    push({ title: 'Asset receipt acknowledged · recorded with timestamp', tone: 'success' })
  }

  const pendingCr = requests.filter((r) => r.status === 'Pending').length

  if (!me) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="My Profile" subtitle="Your self-service record." icon={<UserRound className="h-5 w-5" />} />
        <EmptyState icon={<UserRound className="h-5 w-5" />} title="No employee record linked" description="Your login is not linked to an employee record in this company." />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Profile"
        subtitle={`Your self-service record at ${company.name}.`}
        icon={<UserRound className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Tooltip label="Documents & letters">
              <IconButton variant="outline" aria-label="Documents and letters" onClick={() => push({ title: 'Opening Documents & Letters', tone: 'info' })}>
                <FileText className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Notification preferences">
              <IconButton variant="outline" aria-label="Notification preferences" onClick={() => setPrefOpen(true)}>
                <Bell className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            {!isLimited && (
              <Tooltip label="Edit my details">
                <IconButton variant="solid" aria-label="Edit my details" onClick={openEdit}>
                  <Pencil className="h-[18px] w-[18px]" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        }
      />

      {isLimited && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-bold text-fg">Limited Access</p>
            <p className="text-[13px] text-muted-fg">
              Your role is read-only by default. Editing and change requests are hidden unless your company enables them by policy.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Identity + employment */}
        <div className="space-y-5 lg:col-span-2">
          {/* Identity card */}
          <Card>
            <CardBody>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={me.name} size="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold tracking-tight text-fg">{me.name}</h2>
                      <Badge tone="info" dot>{me.status}</Badge>
                      {me.type === 'Contractor' && <Badge tone="accent2">Contractor</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-fg">{me.title}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-fg">
                      <BadgeCheck className="h-3.5 w-3.5 text-success" /> Employee ID {me.id.toUpperCase()} · self-service scoped to you only
                    </p>
                  </div>
                </div>
                {teamNames.length > 0 && (
                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <span className="text-2xs font-bold uppercase tracking-wide text-muted-fg">My team</span>
                    <AvatarStack names={teamNames} max={5} size="sm" />
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Personal info */}
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              {!isLimited && (
                <Tooltip label="Edit non-sensitive fields">
                  <IconButton size="sm" variant="ghost" aria-label="Edit personal information" onClick={openEdit}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                </Tooltip>
              )}
            </CardHeader>
            <CardBody>
              <div className="grid gap-5 sm:grid-cols-2">
                <ReadField icon={Mail} label="Work email" value={me.email} />
                {editable.map((f) => (
                  <ReadField key={f.key} icon={f.icon} label={f.label} value={f.value} />
                ))}
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-2xs text-muted-fg">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                {isLimited
                  ? 'These fields are read-only for your role.'
                  : 'Contact and emergency fields are employee-editable. Each change writes an audit entry.'}
              </p>
            </CardBody>
          </Card>

          {/* Employment info */}
          <Card>
            <CardHeader>
              <CardTitle>Employment information</CardTitle>
              <Badge tone="neutral">Read-only</Badge>
            </CardHeader>
            <CardBody>
              <div className="grid gap-5 sm:grid-cols-2">
                <ReadField icon={Building2} label="Department" value={department?.name ?? '—'} />
                <ReadField icon={BadgeCheck} label="Position" value={me.title} />
                <ReadField icon={MapPin} label="Location" value={me.location} />
                <ReadField icon={UserRound} label="Reports to" value={manager?.name ?? 'Executive'} />
                <ReadField icon={CalendarDays} label="Joining date" value={me.joinDate} />
                <ReadField icon={BadgeCheck} label="Worker type" value={me.type} />
              </div>
            </CardBody>
          </Card>

          {/* Sensitive fields + change requests */}
          <Card>
            <CardHeader>
              <CardTitle>Sensitive fields</CardTitle>
              {!isLimited && (
                <Button size="sm" variant="outline" onClick={() => setCrOpen(true)}>
                  <Plus className="h-4 w-4" /> Raise change request
                </Button>
              )}
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {SENSITIVE_FIELDS.map((f) => (
                  <div key={f.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
                      <Lock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">{f.label}</p>
                      <p className="truncate text-sm font-semibold text-fg tnum">{f.value}</p>
                      <p className="text-2xs text-muted-fg">{f.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[13px] font-bold text-fg">My change requests</span>
                  {pendingCr > 0 && <Badge tone="warning">{pendingCr} pending</Badge>}
                </div>
                {requests.length === 0 ? (
                  <p className="px-4 pb-3 text-sm text-muted-fg">No change requests yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {requests.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-fg">{r.field}</p>
                          <p className="truncate text-2xs text-muted-fg tnum">
                            {r.from} → {r.to} · raised {r.raised}
                          </p>
                        </div>
                        <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Self-service journey */}
          <Card>
            <CardHeader>
              <CardTitle>My self-service journey</CardTitle>
              <Badge tone="accent">Onboarding touchpoints</Badge>
            </CardHeader>
            <CardBody>
              <div className="flex gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                {JOURNEY.map((col) => (
                  <JourneyColumn key={col.stage} stage={col.stage} items={col.items} />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Leave balance summary */}
          <Card>
            <CardHeader>
              <CardTitle>My leave balance</CardTitle>
              <Badge tone="primary">{leaveBalances.length} types</Badge>
            </CardHeader>
            <CardBody>
              <div className="grid h-40 grid-cols-2 items-center gap-2">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RTooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid rgb(var(--border))', fontSize: 12, background: 'rgb(var(--surface))' }}
                      />
                      <Pie
                        data={leaveBalances.map((b) => ({ name: b.type, value: Math.max(0, b.total - b.used) }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={62}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {leaveBalances.map((b, i) => (
                          <Cell
                            key={b.type}
                            fill={i % 2 === 0 ? 'rgb(var(--accent))' : 'rgb(var(--accent2))'}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2.5">
                  {leaveBalances.map((b) => (
                    <li key={b.type}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-fg">{b.type}</span>
                        <span className="tnum text-muted-fg">{b.total - b.used}/{b.total}</span>
                      </div>
                      <ProgressBar className="mt-1" value={(b.used / b.total) * 100} tone={b.tone} />
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-2xs text-muted-fg">Days remaining per leave type for your company policy.</p>
            </CardBody>
          </Card>

          {/* My assets */}
          <Card>
            <CardHeader>
              <CardTitle>My assets</CardTitle>
              <Badge tone="neutral">{assets.length} issued</Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              {assets.map((a) => {
                const Icon = a.icon
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{a.name}</p>
                      <p className="truncate text-2xs text-muted-fg tnum">{a.tag} · issued {a.issued}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge tone={ASSET_TONE[a.state]} dot>{a.state}</Badge>
                      {a.state === 'Issued' && !isLimited && (
                        <Button size="sm" variant="ghost" onClick={() => ackAsset(a.id)}>
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardBody>
          </Card>

          {/* Documents & letters quick links */}
          <Card>
            <CardHeader>
              <CardTitle>Documents &amp; letters</CardTitle>
              <Tooltip label="Open all documents">
                <IconButton size="sm" variant="ghost" aria-label="Open all documents" onClick={() => push({ title: 'Opening Documents', tone: 'info' })}>
                  <ChevronRight className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            </CardHeader>
            <CardBody className="space-y-1.5">
              {QUICK_DOCS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => push({ title: `Downloading ${d.name}`, tone: 'info' })}
                  className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {d.kind === 'Letter' ? <ScrollText className="h-4 w-4 text-info" /> : <FileText className="h-4 w-4 text-muted-fg" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
                      {d.name}
                      {d.new && <Badge tone="accent2">New</Badge>}
                    </p>
                    <p className="truncate text-2xs text-muted-fg">{d.kind} · {d.date}</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-fg opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </CardBody>
          </Card>

          {/* Notification preferences shortcut */}
          <Card>
            <CardBody>
              <button
                type="button"
                onClick={() => setPrefOpen(true)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-fg">Notification preferences</p>
                  <p className="text-2xs text-muted-fg">
                    Email always on · {Object.values(events).filter(Boolean).length} event types subscribed
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-fg" />
              </button>
            </CardBody>
          </Card>

          {/* Security / scope note */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-surface2/40 px-4 py-3">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-fg" />
            <p className="text-2xs text-muted-fg">
              {role === 'employee'
                ? 'Single-company, self-only access. You can never see other employees’ records or switch company context.'
                : 'Viewing the self-service profile. All data is scoped to your current company tenant.'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit non-sensitive fields modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit my details"
        description="Update your non-sensitive contact and emergency information."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}><Save className="h-4 w-4" /> Save changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          {editableSeed.map((f) => (
            <Field key={f.key} label={f.label}>
              <Input
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            </Field>
          ))}
          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <ShieldCheck className="h-3 w-3 text-success" /> Each saved change is logged to the audit trail (field, previous and new value, actor, timestamp).
          </p>
        </div>
      </Modal>

      {/* Sensitive-field change request modal */}
      <Modal
        open={crOpen}
        onClose={() => setCrOpen(false)}
        title="Raise a change request"
        description="Sensitive fields are changed via an HR-reviewed workflow, not edited directly."
        footer={
          <>
            <Button variant="outline" onClick={() => setCrOpen(false)}>Cancel</Button>
            <Button onClick={submitCr}><Inbox className="h-4 w-4" /> Submit to HR</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Field" required>
            <Select value={crField} onChange={(e) => setCrField(e.target.value)}>
              {SENSITIVE_FIELDS.map((f) => (
                <option key={f.label} value={f.label}>{f.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Current value">
            <Input value={SENSITIVE_FIELDS.find((f) => f.label === crField)?.value ?? '—'} readOnly disabled />
          </Field>
          <Field label="Requested new value" required>
            <Input value={crValue} onChange={(e) => setCrValue(e.target.value)} placeholder="Enter the corrected value" autoFocus />
          </Field>
          <Field label="Reason for change" hint="Helps HR review and approve faster.">
            <Textarea value={crReason} onChange={(e) => setCrReason(e.target.value)} placeholder="e.g. Updated bank account after branch change." />
          </Field>
          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <Clock className="h-3 w-3" /> Routed to HR via the workflow engine. You will be notified of the decision.
          </p>
        </div>
      </Modal>

      {/* Notification preferences modal */}
      <Modal
        open={prefOpen}
        onClose={() => setPrefOpen(false)}
        title="Notification preferences"
        description="Choose how you receive alerts. Email is mandatory and always on."
        footer={
          <>
            <Button variant="outline" onClick={() => setPrefOpen(false)}>Cancel</Button>
            <Button onClick={() => { setPrefOpen(false); push({ title: 'Preferences saved', tone: 'success' }) }}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[13px] font-bold text-fg">Channels</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-fg"><Mail className="h-4 w-4 text-muted-fg" /> Email <Badge tone="neutral">Required</Badge></span>
                <Switch checked={channels.email} onChange={() => undefined} />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-fg"><Bell className="h-4 w-4 text-muted-fg" /> In-app</span>
                <Switch checked={channels.inApp} onChange={(v) => setChannels((c) => ({ ...c, inApp: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-fg"><Smartphone className="h-4 w-4 text-muted-fg" /> SMS</span>
                <Switch checked={channels.sms} onChange={(v) => setChannels((c) => ({ ...c, sms: v }))} />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-bold text-fg">Event subscriptions</p>
            <div className="space-y-3">
              {PREF_EVENTS.map((ev) => (
                <div key={ev.key} className="flex items-center justify-between">
                  <span className="text-sm text-fg">{ev.label}</span>
                  <Switch checked={!!events[ev.key]} onChange={(v) => setEvents((e) => ({ ...e, [ev.key]: v }))} />
                </div>
              ))}
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <Lock className="h-3 w-3" /> Mandatory notifications always reach you by email regardless of these settings.
          </p>
        </div>
      </Modal>
    </div>
  )
}
