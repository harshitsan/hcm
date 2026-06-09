import { useMemo, useState } from 'react'
import {
  Clock, LogIn, LogOut, CalendarCheck, Timer, Laptop, Fingerprint,
  Plug, Upload, Hand, MapPin, FileClock, Check, X,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { useApp } from '../app/store'
import { type Employee } from '../data/mock'
import { useCompanyData } from '../data/companyData'
import { useCan } from '../app/rbac'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field,
  Input, Modal, PageHeader, Select, StatCard, Table, Tabs, Td, Th, Tr, useToast,
} from '../components/ui'

type StatusTone = 'success' | 'primary' | 'warning' | 'danger' | 'neutral' | 'info'

const statusTone = (status: string): StatusTone => {
  switch (status) {
    case 'Present': return 'success'
    case 'WFH': return 'primary'
    case 'On leave': return 'warning'
    case 'Absent': return 'danger'
    default: return 'neutral'
  }
}

const captureMethods: { label: string; icon: typeof Hand }[] = [
  { label: 'Manual', icon: Hand },
  { label: 'Biometric', icon: Fingerprint },
  { label: 'API', icon: Plug },
  { label: 'Import', icon: Upload },
]

// Synthetic "today" snapshot for the team table (deterministic, local to this file).
const teamToday: Record<string, { status: string; in: string; out: string }> = {
  e2: { status: 'Present', in: '09:02', out: '—' },
  e4: { status: 'WFH', in: '09:28', out: '—' },
  e5: { status: 'Present', in: '08:54', out: '—' },
  e6: { status: 'On leave', in: '—', out: '—' },
  e8: { status: 'Present', in: '09:15', out: '—' },
  e9: { status: 'WFH', in: '09:40', out: '—' },
  e10: { status: 'Present', in: '09:06', out: '—' },
  e11: { status: 'Absent', in: '—', out: '—' },
  e13: { status: 'Present', in: '08:48', out: '—' },
}

type RegStatus = 'Pending' | 'Approved' | 'Rejected'
type RegType = 'Missed punch' | 'Late arrival' | 'WFH' | 'Wrong shift' | 'Forgot punch-out'

type Regularization = {
  id: string
  employeeName: string
  employeeId: string
  date: string
  type: RegType
  requestedIn: string
  requestedOut: string
  reason: string
  status: RegStatus
}

const regStatusTone = (status: RegStatus): StatusTone => {
  switch (status) {
    case 'Approved': return 'success'
    case 'Rejected': return 'danger'
    default: return 'warning'
  }
}

const regTypeTone = (type: RegType): StatusTone => {
  switch (type) {
    case 'WFH': return 'primary'
    case 'Late arrival': return 'warning'
    case 'Wrong shift': return 'info'
    default: return 'neutral'
  }
}

const regTypeOptions: RegType[] = ['Missed punch', 'Late arrival', 'WFH', 'Wrong shift', 'Forgot punch-out']

// Deterministic, page-local regularization queue. Employee ids map to the real
// roster so people-manager team-scoping (managerId === persona.employeeId) works.
const regularizations: Regularization[] = [
  { id: 'reg1', employeeName: 'Meera Iyer', employeeId: 'e4', date: 'Jun 5', type: 'Missed punch', requestedIn: '09:05', requestedOut: '18:20', reason: 'Biometric failed at gate; entered via visitor desk.', status: 'Pending' },
  { id: 'reg2', employeeName: 'Imran Khan', employeeId: 'e9', date: 'Jun 4', type: 'WFH', requestedIn: '09:30', requestedOut: '18:30', reason: 'Approved remote day not reflected in roster.', status: 'Pending' },
  { id: 'reg3', employeeName: 'Sanjay Gupta', employeeId: 'e13', date: 'Jun 3', type: 'Forgot punch-out', requestedIn: '08:48', requestedOut: '18:45', reason: 'Left for client visit, forgot to clock out.', status: 'Pending' },
  { id: 'reg4', employeeName: 'Divya Menon', employeeId: 'e8', date: 'Jun 2', type: 'Late arrival', requestedIn: '10:10', requestedOut: '19:00', reason: 'Local train delay; informed lead on chat.', status: 'Approved' },
  { id: 'reg5', employeeName: 'Karan Mehta', employeeId: 'e5', date: 'Jun 5', type: 'Wrong shift', requestedIn: '07:00', requestedOut: '16:00', reason: 'Marked on general shift instead of early shift.', status: 'Pending' },
  { id: 'reg6', employeeName: 'Fatima Sheikh', employeeId: 'e10', date: 'Jun 4', type: 'Missed punch', requestedIn: '09:12', requestedOut: '18:05', reason: 'Card reader offline on 3rd floor.', status: 'Rejected' },
  { id: 'reg7', employeeName: 'Joseph Thomas', employeeId: 'e11', date: 'Jun 3', type: 'WFH', requestedIn: '09:00', requestedOut: '18:00', reason: 'Hub closed for maintenance; worked remotely.', status: 'Pending' },
]

export default function Attendance() {
  const { attendanceWeek, attendanceMix, employees } = useCompanyData()
  const { role, company, persona } = useApp()
  const { push } = useToast()
  const isEmployee = role === 'employee'
  const isManager = role === 'people_manager'
  // Resolve the logged-in employee strictly from the persona (never employees[0]).
  const me = useMemo(
    () => (persona?.employeeId ? employees.find((e) => e.id === persona.employeeId) ?? null : null),
    [persona, employees],
  )
  // Export covers the whole company register — only company-wide roles may run it.
  const canExport = useCan('report.export')

  const [clockedIn, setClockedIn] = useState(true)
  const [tab, setTab] = useState('overview')
  const [regModalOpen, setRegModalOpen] = useState(false)
  // Local, mutable review state for the regularization queue.
  const [regStatus, setRegStatus] = useState<Record<string, RegStatus>>(() =>
    Object.fromEntries(regularizations.map((r) => [r.id, r.status])),
  )

  const presentDays = attendanceWeek.filter((d) => d.status === 'Present').length
  const wfhDays = attendanceWeek.filter((d) => d.status === 'WFH').length
  const avgHours = (() => {
    const worked = attendanceWeek.filter((d) => d.in !== '—' && d.out !== '—')
    if (!worked.length) return '0.0'
    const total = worked.reduce((acc, d) => {
      const [ih, im] = d.in.split(':').map(Number)
      const [oh, om] = d.out.split(':').map(Number)
      return acc + (oh * 60 + om - ih * 60 - im) / 60
    }, 0)
    return (total / worked.length).toFixed(1)
  })()

  const toggleClock = () => {
    setClockedIn((c) => {
      const next = !c
      push({ title: next ? 'Clocked in · 09:12' : 'Clocked out · 18:30', tone: next ? 'success' : 'neutral' })
      return next
    })
  }

  const team = useMemo<Employee[]>(() => {
    // People managers see only their own direct reports; company-wide roles
    // (HR admin / portfolio manager) see the full register.
    const withSnapshot = employees.filter((e) => teamToday[e.id])
    if (isManager) {
      const myId = persona?.employeeId
      return myId ? withSnapshot.filter((e) => e.managerId === myId) : []
    }
    return withSnapshot
  }, [employees, isManager, persona])
  const totalMix = attendanceMix.reduce((a, m) => a + m.value, 0)

  // Regularization queue — scoped like the team table: managers see only their
  // direct reports; company-wide roles see the full queue. Status comes from
  // local review state so approve/reject persists for the session.
  const regRows = useMemo<Regularization[]>(() => {
    const teamIds = new Set(team.map((e) => e.id))
    return regularizations
      .filter((r) => (isManager ? teamIds.has(r.employeeId) : true))
      .map((r) => ({ ...r, status: regStatus[r.id] ?? r.status }))
  }, [team, isManager, regStatus])
  const pendingRegCount = regRows.filter((r) => r.status === 'Pending').length

  const decideReg = (r: Regularization, next: Extract<RegStatus, 'Approved' | 'Rejected'>) => {
    setRegStatus((s) => ({ ...s, [r.id]: next }))
    push({
      title: `${r.employeeName} · ${next === 'Approved' ? 'regularization approved' : 'regularization rejected'}`,
      tone: next === 'Approved' ? 'success' : 'neutral',
    })
  }

  /* ----------------------------------------------------------------- Employee view */
  if (isEmployee) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="My attendance"
          subtitle={`Time & leave · ${company.name}`}
          icon={<Clock className="h-5 w-5" />}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Clock card */}
          <Card className="lg:col-span-1">
            <CardBody className="flex flex-col items-center gap-4 py-7 text-center">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${clockedIn ? 'bg-success/12 text-success' : 'bg-muted text-muted-fg'}`}>
                {clockedIn ? <LogIn className="h-6 w-6" /> : <LogOut className="h-6 w-6" />}
              </span>
              <div>
                <p className="text-2xs font-bold uppercase tracking-wide text-muted-fg">Current status</p>
                <p className="mt-1 text-lg font-extrabold tracking-tight">
                  {clockedIn ? 'Clocked in' : 'Clocked out'}
                </p>
                <p className="mt-0.5 text-sm text-muted-fg">
                  {clockedIn ? `Since 09:12${me ? ` · ${me.location}` : ''}` : 'Last out 18:30 yesterday'}
                </p>
              </div>
              <Button
                variant={clockedIn ? 'danger' : 'primary'}
                size="lg"
                className="w-full"
                onClick={toggleClock}
              >
                {clockedIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                {clockedIn ? 'Clock out' : 'Clock in'}
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setRegModalOpen(true)}>
                <FileClock className="h-4 w-4" /> Regularize attendance
              </Button>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-fg">
                <MapPin className="h-3.5 w-3.5" /> Geo-tagged · Biometric verified
              </span>
            </CardBody>
          </Card>

          {/* This week */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>This week</CardTitle>
              <Badge tone="neutral">Week 23</Badge>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {attendanceWeek.map((d) => (
                  <li key={d.day} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                    <span className="w-10 text-sm font-bold text-fg">{d.day}</span>
                    <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                    <div className="ml-auto flex items-center gap-6 text-sm">
                      <span className="tnum text-muted-fg">
                        <span className="mr-1 text-2xs uppercase">in</span>{d.in}
                      </span>
                      <span className="tnum text-muted-fg">
                        <span className="mr-1 text-2xs uppercase">out</span>{d.out}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Present days" value={presentDays} delta="this week" deltaTone="success" icon={<CalendarCheck className="h-4 w-4" />} />
          <StatCard label="Avg hours / day" value={avgHours} delta="worked" deltaTone="primary" icon={<Timer className="h-4 w-4" />} />
          <StatCard label="WFH days" value={wfhDays} delta="this week" deltaTone="info" icon={<Laptop className="h-4 w-4" />} />
        </div>

        <Modal
          open={regModalOpen}
          onClose={() => setRegModalOpen(false)}
          title="Regularize attendance"
          description="Raise a correction for a missed punch or wrong record (prototype)."
          footer={
            <>
              <Button variant="outline" onClick={() => setRegModalOpen(false)}>Cancel</Button>
              <Button onClick={() => { setRegModalOpen(false); push({ title: 'Regularization request submitted', tone: 'success' }) }}>
                Submit request
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" required>
              <Input type="text" defaultValue="Jun 5" placeholder="e.g. Jun 5" />
            </Field>
            <Field label="Type" required>
              <Select defaultValue="Missed punch">
                {regTypeOptions.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Requested in">
              <Input type="text" defaultValue="09:00" placeholder="HH:MM" />
            </Field>
            <Field label="Requested out">
              <Input type="text" defaultValue="18:00" placeholder="HH:MM" />
            </Field>
            <Field label="Reason" required className="sm:col-span-2">
              <Input type="text" placeholder="Briefly explain the correction" />
            </Field>
          </div>
        </Modal>
      </div>
    )
  }

  /* ----------------------------------------------------------------- Manager / HR view */
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance"
        subtitle={
          isManager
            ? `Your team today · ${team.length} ${team.length === 1 ? 'report' : 'reports'}`
            : `Today across ${company.name} · ${totalMix} on roll`
        }
        icon={<Clock className="h-5 w-5" />}
        actions={
          canExport ? (
            <Button variant="outline" size="sm" onClick={() => push({ title: 'Register exported', tone: 'success' })}>
              <Upload className="h-4 w-4" /> Export register
            </Button>
          ) : undefined
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'team', label: 'Team today' },
          { value: 'regularization', label: 'Regularization' },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Donut */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Today's mix</CardTitle>
              <Badge tone="success" dot>Live</Badge>
            </CardHeader>
            <CardBody>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RTooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid rgb(var(--border))', fontSize: 12, background: 'rgb(var(--surface))' }}
                    />
                    <Pie
                      data={attendanceMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {attendanceMix.map((m) => (
                        <Cell key={m.name} fill={m.tone} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {attendanceMix.map((m) => (
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

          {/* Capture methods + week reference */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Capture & this week</CardTitle>
              <Badge tone="neutral">{presentDays} present · {wfhDays} WFH</Badge>
            </CardHeader>
            <CardBody className="space-y-5">
              <div>
                <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg">Available capture methods</p>
                <div className="flex flex-wrap gap-2">
                  {captureMethods.map((c) => (
                    <span
                      key={c.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-semibold text-fg"
                    >
                      <c.icon className="h-3.5 w-3.5 text-muted-fg" />
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted-fg">Reference week (you)</p>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {attendanceWeek.map((d) => (
                    <li key={d.day} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-10 text-sm font-bold text-fg">{d.day}</span>
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                      <div className="ml-auto flex items-center gap-6 text-sm tnum text-muted-fg">
                        <span>{d.in}</span>
                        <span>{d.out}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'team' && (
        <Card>
          <CardHeader>
            <CardTitle>Team today</CardTitle>
            <Badge tone="primary">{team.length}</Badge>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <thead>
                <Tr className="border-t-0 hover:bg-transparent">
                  <Th>Member</Th>
                  <Th>Status</Th>
                  <Th className="text-right">In</Th>
                  <Th className="text-right">Out</Th>
                </Tr>
              </thead>
              <tbody>
                {team.map((e) => {
                  const t = teamToday[e.id]
                  return (
                    <Tr key={e.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={e.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{e.name}</p>
                            <p className="truncate text-xs text-muted-fg">{e.title}</p>
                          </div>
                        </div>
                      </Td>
                      <Td><Badge tone={statusTone(t.status)}>{t.status}</Badge></Td>
                      <Td className="text-right tnum text-muted-fg">{t.in}</Td>
                      <Td className="text-right tnum text-muted-fg">{t.out}</Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {tab === 'regularization' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Pending review" value={pendingRegCount} delta="needs action" deltaTone="warning" icon={<FileClock className="h-4 w-4" />} />
            <StatCard label="Approved" value={regRows.filter((r) => r.status === 'Approved').length} delta="this week" deltaTone="success" icon={<Check className="h-4 w-4" />} />
            <StatCard label="Rejected" value={regRows.filter((r) => r.status === 'Rejected').length} delta="this week" deltaTone="danger" icon={<X className="h-4 w-4" />} />
            <StatCard label="Total requests" value={regRows.length} delta={isManager ? 'your team' : company.name} deltaTone="primary" icon={<CalendarCheck className="h-4 w-4" />} />
          </div>

          <Card className="overflow-hidden p-0">
            <CardHeader>
              <CardTitle>Regularization requests</CardTitle>
              <Badge tone={pendingRegCount ? 'warning' : 'neutral'}>{pendingRegCount} pending</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {regRows.length ? (
                <Table>
                  <thead>
                    <Tr className="border-t-0 hover:bg-transparent">
                      <Th>Employee</Th>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th className="text-right">In / Out</Th>
                      <Th>Reason</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Action</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {regRows.map((r) => (
                      <Tr key={r.id}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={r.employeeName} size="sm" />
                            <p className="truncate text-sm font-semibold">{r.employeeName}</p>
                          </div>
                        </Td>
                        <Td className="tnum text-muted-fg">{r.date}</Td>
                        <Td><Badge tone={regTypeTone(r.type)}>{r.type}</Badge></Td>
                        <Td className="text-right tnum text-muted-fg">{r.requestedIn} / {r.requestedOut}</Td>
                        <Td className="max-w-xs truncate text-sm text-muted-fg" title={r.reason}>{r.reason}</Td>
                        <Td><Badge tone={regStatusTone(r.status)}>{r.status}</Badge></Td>
                        <Td className="text-right">
                          {r.status === 'Pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => decideReg(r, 'Approved')}>
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => decideReg(r, 'Rejected')}>
                                <X className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-fg">Reviewed</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={<FileClock className="h-6 w-6" />}
                    title="No regularization requests"
                    description={isManager ? 'Your team has no attendance corrections to review.' : 'No attendance corrections have been raised.'}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
