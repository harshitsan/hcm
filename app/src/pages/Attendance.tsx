import { useMemo, useState } from 'react'
import {
  Clock, LogIn, LogOut, CalendarCheck, Timer, Laptop, Fingerprint,
  Plug, Upload, Hand, MapPin,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { useApp } from '../app/store'
import { attendanceWeek, attendanceMix, employees, type Employee } from '../data/mock'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader,
  StatCard, Table, Tabs, Td, Th, Tr, useToast,
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

export default function Attendance() {
  const { role, company } = useApp()
  const { push } = useToast()
  const isEmployee = role === 'employee'

  const [clockedIn, setClockedIn] = useState(true)
  const [tab, setTab] = useState('overview')

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

  const team = useMemo<Employee[]>(
    () => employees.filter((e) => teamToday[e.id]),
    [],
  )
  const totalMix = attendanceMix.reduce((a, m) => a + m.value, 0)

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
                  {clockedIn ? 'Since 09:12 · Mumbai HQ' : 'Last out 18:30 yesterday'}
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
      </div>
    )
  }

  /* ----------------------------------------------------------------- Manager / HR view */
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance"
        subtitle={`Today across ${company.name} · ${totalMix} on roll`}
        icon={<Clock className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={() => push({ title: 'Register exported', tone: 'success' })}>
            <Upload className="h-4 w-4" /> Export register
          </Button>
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'team', label: 'Team today' },
        ]}
      />

      {tab === 'overview' ? (
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
              <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
                {presentDays} present · {wfhDays} WFH
              </span>
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
      ) : (
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
    </div>
  )
}
