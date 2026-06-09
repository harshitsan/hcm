/**
 * Platform console home — what the Provider/Portfolio admin lands on (platform scope).
 * Tenant summary, attention queue, your companies, and recent platform activity.
 * NOT an HR inbox — that lives inside a company (company scope).
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle2, AlertTriangle, Users, Plus, ArrowRight, LayoutGrid, ScrollText, ChevronRight,
} from 'lucide-react'
import { useApp } from '../app/store'
import type { Company } from '../data/mock'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, IconButton, PageHeader, StatCard, Avatar,
} from '../components/ui'
import { cn } from '../lib/cn'

const statusTone = (s: Company['status']) => (s === 'Active' ? 'success' : s === 'Suspended' ? 'warning' : 'neutral')

// recent cross-tenant activity (deterministic mock).
// Each entry is tagged with the company ids it concerns so the feed can be
// scoped to the persona's authorizedCompanies — a portfolio manager must never
// learn that out-of-portfolio tenants exist (or their lifecycle status).
const ACTIVITY = [
  { actor: 'Anita Rao', action: 'Created', tone: 'success' as const, entity: 'Company · Orbit Media', detail: 'Status: Draft', time: '2 days ago', companyIds: ['c7'] },
  { actor: 'OpsMaven', action: 'Enabled', tone: 'accent' as const, entity: 'Group · Kensium Group', detail: 'Cross-company sharing (opt-in)', time: '4 days ago', companyIds: ['c1', 'c2', 'c3', 'c4', 'c5'] },
  { actor: 'OpsMaven', action: 'Context switch', tone: 'neutral' as const, entity: 'Company', detail: 'Kensium LLC → Kensium Pvt Ltd', time: '4 days ago', companyIds: ['c1', 'c2'] },
  { actor: 'System', action: 'Suspended', tone: 'warning' as const, entity: 'Company · Delta Logistics', detail: 'Non-payment — data retained', time: '6 days ago', companyIds: ['c6'] },
]

export default function PlatformHome() {
  const { persona, authorizedCompanies, enterCompany } = useApp()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const active = authorizedCompanies.filter((c) => c.status === 'Active').length
    const attention = authorizedCompanies.filter((c) => c.status !== 'Active')
    const headcount = authorizedCompanies.reduce((s, c) => s + c.employees, 0)
    return { total: authorizedCompanies.length, active, attention, headcount }
  }, [authorizedCompanies])

  // Scope the activity feed to the persona's portfolio — only surface entries
  // that concern a company the persona is authorized to see.
  const activity = useMemo(() => {
    const authorizedIds = new Set(authorizedCompanies.map((c) => c.id))
    return ACTIVITY.filter((a) => a.companyIds.some((id) => authorizedIds.has(id)))
  }, [authorizedCompanies])

  const open = (c: Company) => { enterCompany(c.id); navigate('/') }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good afternoon, ${persona?.name.split(' ')[0] ?? 'there'}`}
        subtitle="Your platform console — tenants, governance and health across SatelliteHR."
        icon={<LayoutGrid className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/portfolio')}>
              Portfolio analytics <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/admin/companies')}>
              <Plus className="h-4 w-4" /> Create company
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Companies" value={stats.total} delta={`${authorizedCompanies.length} tenants`} deltaTone="primary" icon={<Building2 className="h-4 w-4" />} />
        <StatCard label="Active" value={stats.active} delta="live" deltaTone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Need attention" value={stats.attention.length} delta="draft / suspended" deltaTone="warning" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Total employees" value={stats.headcount} delta="across tenants" deltaTone="info" icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Companies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your companies</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/companies')}>Manage all <ArrowRight className="h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {authorizedCompanies.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-2xs font-bold text-white', c.color)}>{c.initials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="tnum truncate text-2xs text-muted-fg">{c.code} · {c.jurisdiction} · {c.employees} employees</p>
                  </div>
                  <Badge tone={statusTone(c.status)} dot>{c.status}</Badge>
                  <Button size="sm" variant="subtle" onClick={() => open(c)}>Open <ChevronRight className="h-3.5 w-3.5" /></Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {/* Right rail: attention + activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Needs attention</CardTitle><Badge tone="warning">{stats.attention.length}</Badge></CardHeader>
            <CardBody className="space-y-2">
              {stats.attention.length === 0 ? (
                <p className="py-2 text-sm text-muted-fg">All tenants are active.</p>
              ) : stats.attention.map((c) => (
                <button key={c.id} onClick={() => open(c)} className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-warning/50 cursor-pointer">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-2xs font-bold text-white', c.color)}>{c.initials}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{c.name}</span>
                    <span className="block truncate text-2xs text-muted-fg">{c.jurisdiction}</span>
                  </span>
                  <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                </button>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent platform activity</CardTitle>
              <IconButton size="sm" variant="ghost" aria-label="Open audit log" onClick={() => navigate('/admin/audit')}><ScrollText className="h-4 w-4" /></IconButton>
            </CardHeader>
            <CardBody className="space-y-3">
              {activity.length === 0 ? (
                <p className="py-2 text-sm text-muted-fg">No recent activity in your portfolio.</p>
              ) : activity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Avatar name={a.actor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px]">
                      <span className="font-semibold">{a.actor}</span>{' '}
                      <Badge tone={a.tone}>{a.action}</Badge>
                    </p>
                    <p className="truncate text-2xs text-muted-fg">{a.entity} · {a.detail}</p>
                  </div>
                  <span className="shrink-0 text-2xs text-muted-fg">{a.time}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
