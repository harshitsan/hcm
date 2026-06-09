import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox, Users, CalendarDays, Briefcase, Check, X, Clock, ArrowRight, FileCheck2, Megaphone,
} from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { useApp } from '../app/store'
import {
  type InboxItem,
} from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader,
  ProgressBar, StatCard, useToast,
} from '../components/ui'

const slaTone = (pct: number): 'danger' | 'warning' | 'neutral' =>
  pct >= 80 ? 'danger' : pct >= 60 ? 'warning' : 'neutral'
const typeTone: Record<InboxItem['type'], 'primary' | 'info' | 'accent' | 'warning' | 'neutral'> = {
  Leave: 'primary', Onboarding: 'accent', 'Policy Ack': 'info', Transfer: 'warning',
  Offer: 'primary', Timesheet: 'info', Asset: 'neutral',
}

export default function Home() {
  const { inbox: inboxSeed, leaveBalances, headcountTrend, policies } = useCompanyData()
  const { persona, role, company } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()
  const [items, setItems] = useState(inboxSeed)
  const isEmployee = role === 'employee'

  const act = (id: string, verb: 'Approved' | 'Dismissed') => {
    setItems((p) => p.filter((i) => i.id !== id))
    push({ title: `${verb}`, tone: verb === 'Approved' ? 'success' : 'neutral' })
  }

  const greeting = useMemo(() => {
    const h = 14 // fixed for the prototype
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }, [])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting}, ${persona?.name.split(' ')[0]}`}
        subtitle={
          isEmployee
            ? `Here's what needs you today at ${company.name}.`
            : `What needs you today at ${company.name}.`
        }
      />

      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isEmployee ? (
          <>
            <StatCard label="Annual leave left" value="13" delta="of 21" deltaTone="primary" icon={<CalendarDays className="h-4 w-4" />} />
            <StatCard label="This month present" value="18" delta="days" deltaTone="success" icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Policies to sign" value="2" delta="due soon" deltaTone="warning" icon={<FileCheck2 className="h-4 w-4" />} />
            <StatCard label="Announcements" value="3" delta="new" deltaTone="info" icon={<Megaphone className="h-4 w-4" />} />
          </>
        ) : (
          <>
            <StatCard label="Headcount" value={company.employees} delta="+8 MTD" deltaTone="success" icon={<Users className="h-4 w-4" />} />
            <StatCard label="Pending approvals" value={items.length} delta="in your inbox" deltaTone="warning" icon={<Inbox className="h-4 w-4" />} />
            <StatCard label="On leave today" value="9" delta="3% of staff" deltaTone="info" icon={<CalendarDays className="h-4 w-4" />} />
            <StatCard label="Open roles" value="6" delta="4 depts" deltaTone="primary" icon={<Briefcase className="h-4 w-4" />} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Unified inbox — the signature pattern */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{isEmployee ? 'My requests & to-dos' : 'My inbox'}</CardTitle>
              <Badge tone="primary">{items.length}</Badge>
            </div>
            <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
              Everything that needs you · one list
            </span>
          </CardHeader>
          <CardBody className="p-0">
            {items.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Check className="h-5 w-5" />} title="Inbox zero" description="Nothing needs your attention right now." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                    <span className="hidden w-24 shrink-0 sm:block"><Badge tone={typeTone[it.type]}>{it.type}</Badge></span>
                    <Avatar name={it.requester} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{it.title}</p>
                      <p className="truncate text-xs text-muted-fg">
                        {it.requester} · {it.date}
                      </p>
                    </div>
                    <Badge tone={slaTone(it.slaPct)} className="hidden sm:inline-flex">
                      <Clock className="h-3 w-3" /> SLA {it.slaPct}%
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="subtle" onClick={() => act(it.id, 'Approved')}>
                        <Check className="h-3.5 w-3.5" /> {isEmployee ? 'Done' : 'Approve'}
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={() => act(it.id, 'Dismissed')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Right rail */}
        <div className="space-y-6">
          {isEmployee ? (
            <Card>
              <CardHeader>
                <CardTitle>My leave balances</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {leaveBalances.map((b) => (
                  <div key={b.type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold">{b.type}</span>
                      <span className="tnum text-muted-fg">{b.total - b.used} left</span>
                    </div>
                    <ProgressBar value={((b.total - b.used) / b.total) * 100} tone={b.tone} />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/time/leave')}>
                  Request leave <ArrowRight className="h-4 w-4" />
                </Button>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Headcount trend</CardTitle>
                <Badge tone="success">+16% YoY</Badge>
              </CardHeader>
              <CardBody>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={headcountTrend} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <defs>
                        <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <RTooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid rgb(var(--border))', fontSize: 12, background: 'rgb(var(--surface))' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#hc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-fg">
                  <span>Jan</span><span className="font-bold text-fg tnum">{company.employees} today</span><span>Jun</span>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Policies to acknowledge</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {policies.filter((p) => p.status === 'Active' && p.due !== '—').slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name} <span className="text-muted-fg">{p.version}</span></p>
                    <p className="text-2xs text-muted-fg">Due {p.due}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/policies')}>Review</Button>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
