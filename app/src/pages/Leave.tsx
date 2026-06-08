import { useMemo, useState } from 'react'
import { CalendarDays, Check, Plus, X, CalendarRange, Inbox } from 'lucide-react'
import { useApp } from '../app/store'
import { type LeaveRequest } from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input,
  Modal, PageHeader, ProgressBar, Select, Table, Td, Th, Tr, Textarea, Tabs, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

type LeaveType = LeaveRequest['type']
const LEAVE_TYPES: LeaveType[] = ['Annual', 'Sick', 'Casual', 'Maternity', 'Comp-off']

const statusTone = (s: LeaveRequest['status']): 'warning' | 'success' | 'danger' =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning'

const typeTone = (t: LeaveType): 'primary' | 'info' | 'accent' | 'success' | 'warning' => {
  const map: Record<LeaveType, 'primary' | 'info' | 'accent' | 'success' | 'warning'> = {
    Annual: 'primary', Sick: 'info', Casual: 'accent', Maternity: 'success', 'Comp-off': 'warning',
  }
  return map[t]
}

/** inclusive day count between two yyyy-mm-dd dates */
function dayCount(from: string, to: string): number {
  if (!from || !to) return 0
  const a = new Date(from + 'T00:00:00').getTime()
  const b = new Date(to + 'T00:00:00').getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0
  return Math.floor((b - a) / 86_400_000) + 1
}

const fmtShort = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export default function Leave() {
  const { leaveBalances, leaveRequests } = useCompanyData()
  const { role } = useApp()
  const { push } = useToast()
  const isEmployee = role === 'employee'

  const tabs = useMemo(() => {
    const t = [{ value: 'mine', label: 'My leave' }]
    if (!isEmployee) {
      t.push({ value: 'approvals', label: 'Approvals' })
      t.push({ value: 'calendar', label: 'Team calendar' })
    }
    return t
  }, [isEmployee])
  const [tab, setTab] = useState('mine')

  // My requests (local, seeded with this user's existing items)
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([
    { id: 'm1', employee: 'You', type: 'Annual', from: '2026-06-10', to: '2026-06-12', days: 3, status: 'Pending', reason: 'Family function' },
    { id: 'm2', employee: 'You', type: 'Casual', from: '2026-06-03', to: '2026-06-03', days: 1, status: 'Approved', reason: 'Personal errand' },
  ])

  // Approvals queue (local)
  const [pending, setPending] = useState<LeaveRequest[]>(
    leaveRequests.filter((r) => r.status === 'Pending'),
  )

  // Request modal
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ type: LeaveType; from: string; to: string; reason: string }>({
    type: 'Annual', from: '', to: '', reason: '',
  })
  const days = dayCount(form.from, form.to)

  const submit = () => {
    const id = `m${Date.now()}`
    setMyRequests((p) => [
      { id, employee: 'You', type: form.type, from: form.from, to: form.to, days, status: 'Pending', reason: form.reason },
      ...p,
    ])
    push({ title: `${form.type} leave requested · ${days} day${days === 1 ? '' : 's'}`, tone: 'success' })
    setOpen(false)
    setForm({ type: 'Annual', from: '', to: '', reason: '' })
  }

  const decide = (id: string, verb: 'Approved' | 'Rejected') => {
    setPending((p) => p.filter((r) => r.id !== id))
    push({ title: `Leave ${verb.toLowerCase()}`, tone: verb === 'Approved' ? 'success' : 'danger' })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave"
        subtitle="Request time off, track balances and approvals."
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Request leave
          </Button>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />

      {/* -------------------------------------------------------- My leave */}
      {tab === 'mine' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {leaveBalances.map((b) => {
              const left = b.total - b.used
              return (
                <Card key={b.type} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-muted-fg">{b.type}</span>
                    <Badge tone={b.tone}>{b.used} used</Badge>
                  </div>
                  <div className="mt-2 flex items-end gap-1.5">
                    <span className="text-2xl font-extrabold tracking-tight tnum">{left}</span>
                    <span className="mb-1 text-xs text-muted-fg tnum">/ {b.total} days left</span>
                  </div>
                  <ProgressBar className="mt-3" value={(left / b.total) * 100} tone={b.tone} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => { setForm((f) => ({ ...f, type: b.type as LeaveType })); setOpen(true) }}
                  >
                    Request leave
                  </Button>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My requests</CardTitle>
              <Badge tone="primary">{myRequests.length}</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {myRequests.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<CalendarDays className="h-5 w-5" />}
                    title="No requests yet"
                    description="Request leave and it will show up here."
                  />
                </div>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Type</Th><Th>Dates</Th><Th className="text-right">Days</Th><Th>Reason</Th><Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((r) => (
                      <Tr key={r.id}>
                        <Td><Badge tone={typeTone(r.type)}>{r.type}</Badge></Td>
                        <Td className="whitespace-nowrap text-muted-fg">
                          {fmtShort(r.from)}{r.to !== r.from ? ` – ${fmtShort(r.to)}` : ''}
                        </Td>
                        <Td className="text-right tnum font-semibold">{r.days}</Td>
                        <Td className="max-w-[16rem] truncate text-muted-fg">{r.reason || '—'}</Td>
                        <Td><Badge tone={statusTone(r.status)} dot>{r.status}</Badge></Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* -------------------------------------------------------- Approvals */}
      {tab === 'approvals' && !isEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
            <Badge tone="warning">{pending.length} waiting</Badge>
          </CardHeader>
          <CardBody className="p-0">
            {pending.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Inbox className="h-5 w-5" />}
                  title="All caught up"
                  description="No leave requests are waiting on you."
                />
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Employee</Th><Th>Type</Th><Th>Dates</Th><Th className="text-right">Days</Th>
                    <Th>Reason</Th><Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((r) => (
                    <Tr key={r.id}>
                      <Td className="font-semibold">{r.employee}</Td>
                      <Td><Badge tone={typeTone(r.type)}>{r.type}</Badge></Td>
                      <Td className="whitespace-nowrap text-muted-fg">{r.from}{r.to !== r.from ? ` – ${r.to}` : ''}</Td>
                      <Td className="text-right tnum font-semibold">{r.days}</Td>
                      <Td className="max-w-[14rem] truncate text-muted-fg">{r.reason}</Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="subtle" onClick={() => decide(r.id, 'Approved')}>
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => decide(r.id, 'Rejected')}>
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* -------------------------------------------------------- Team calendar */}
      {tab === 'calendar' && !isEmployee && <TeamCalendar />}

      {/* -------------------------------------------------------- Request modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request leave"
        description="Submit a time-off request for approval."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.from || !form.to || days === 0} onClick={submit}>
              Submit request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Leave type" required>
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LeaveType }))}>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" required>
              <Input type="date" value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} />
            </Field>
            <Field label="To" required>
              <Input type="date" value={form.to} min={form.from || undefined} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} />
            </Field>
          </div>
          <Field label="Reason">
            <Textarea
              placeholder="Add a short note for your manager…"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </Field>
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-fg">Duration</span>
            <span className="font-bold tnum">{days} day{days === 1 ? '' : 's'}</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ----------------------------------------------------------------- Team calendar */
function TeamCalendar() {
  // June 2026 — 1 Jun is a Monday. Map a few people on leave onto day numbers.
  const onLeave: Record<number, { who: string; tone: 'primary' | 'info' | 'accent' }[]> = {}
  const seed: { day: number; who: string; type: LeaveType }[] = [
    { day: 10, who: 'Meera Iyer', type: 'Annual' },
    { day: 11, who: 'Meera Iyer', type: 'Annual' },
    { day: 12, who: 'Meera Iyer', type: 'Annual' },
    { day: 9, who: 'Divya Menon', type: 'Sick' },
    { day: 3, who: 'Sanjay Gupta', type: 'Casual' },
  ]
  for (const s of seed) {
    const tone = s.type === 'Annual' ? 'primary' : s.type === 'Sick' ? 'info' : 'accent'
    ;(onLeave[s.day] ??= []).push({ who: s.who, tone })
  }

  const dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const cells: (number | null)[] = []
  for (let i = 0; i < 35; i++) {
    const d = i + 1
    cells.push(d <= 30 ? d : null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team calendar · June 2026</CardTitle>
        <div className="flex items-center gap-3 text-2xs font-semibold text-muted-fg">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Annual</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info" /> Sick</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Casual</span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-7 gap-1">
          {dows.map((d) => (
            <div key={d} className="pb-1 text-center text-2xs font-bold uppercase tracking-wide text-muted-fg">{d}</div>
          ))}
          {cells.map((day, i) => {
            const people = day ? onLeave[day] : undefined
            const weekend = i % 7 >= 5
            return (
              <div
                key={i}
                className={cn(
                  'min-h-[72px] rounded-lg border border-border p-1.5 text-left transition-colors',
                  day ? 'bg-surface hover:bg-muted/50' : 'border-transparent bg-transparent',
                  weekend && day && 'bg-surface2/60',
                )}
              >
                {day && (
                  <>
                    <span className="text-2xs font-semibold text-muted-fg tnum">{day}</span>
                    <div className="mt-1 space-y-1">
                      {people?.map((p, j) => (
                        <div
                          key={j}
                          className={cn(
                            'flex items-center gap-1 truncate rounded px-1 py-0.5 text-2xs font-medium',
                            p.tone === 'primary' && 'bg-primary/10 text-primary',
                            p.tone === 'info' && 'bg-info/12 text-info',
                            p.tone === 'accent' && 'bg-accent/12 text-accent',
                          )}
                          title={p.who}
                        >
                          <CalendarRange className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{p.who.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
