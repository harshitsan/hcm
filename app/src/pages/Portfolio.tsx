import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers, Users, Briefcase, Inbox, CalendarDays, LogIn, ShieldCheck, Lock,
  Download, RefreshCw, Megaphone, ScrollText, FileCheck2, MapPin, ArrowRight,
  CheckCircle2, AlertTriangle, ListChecks,
} from 'lucide-react'
import {
  Cell, Legend, Pie, PieChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../app/store'
import { getCompanyData } from '../data/companyData'
import { type Company } from '../data/mock'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle,
  EmptyState, IconButton, PageHeader, ProgressBar, StatCard, Table, Td, Th, Tr,
  Tooltip, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- tokens */
type Tone = 'success' | 'warning' | 'neutral' | 'primary' | 'info' | 'accent' | 'accent2' | 'danger'

const statusTone: Record<Company['status'], 'success' | 'warning' | 'neutral'> = {
  Active: 'success',
  Suspended: 'warning',
  Draft: 'neutral',
}

const axisStyle = { fontSize: 11, fill: 'rgb(var(--muted-fg))' }
const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}
const gridStroke = 'rgb(var(--border))'

/* ----------------------------------------------------------------- deterministic per-company alignment

   Policy-alignment % is a stable, deterministic figure per company id — it never
   uses Math.random()/Date.now(). The numbers map each authorized company to a fixed
   "% of standardized policies adopted" score used across the dashboard. */
const ALIGNMENT_BY_COMPANY: Record<string, number> = {
  c1: 96, c2: 88, c3: 72, c4: 64, c5: 81, c6: 40, c7: 33, c8: 58,
}
const alignmentOf = (id: string): number => ALIGNMENT_BY_COMPANY[id] ?? 70

const alignTone = (pct: number): 'success' | 'warning' | 'danger' =>
  pct >= 85 ? 'success' : pct >= 60 ? 'warning' : 'danger'

/* Standardized policy catalogue pushed across the portfolio (module-scope, fixed). */
type PolicyRow = {
  id: string
  policy: string
  version: string
  category: string
  /** company ids that have adopted this exact standardized instance */
  adopted: string[]
}
const STANDARD_POLICIES: PolicyRow[] = [
  { id: 'sp1', policy: 'Code of Conduct', version: 'v3.0', category: 'Compliance', adopted: ['c1', 'c2', 'c3', 'c5'] },
  { id: 'sp2', policy: 'Leave Policy', version: 'v2.1', category: 'HR', adopted: ['c1', 'c2', 'c3', 'c4', 'c5'] },
  { id: 'sp3', policy: 'Information Security', version: 'v2.0', category: 'Security', adopted: ['c1', 'c2', 'c5'] },
  { id: 'sp4', policy: 'Remote Work Policy', version: 'v1.4', category: 'HR', adopted: ['c1', 'c2', 'c4'] },
  { id: 'sp5', policy: 'Travel & Expense', version: 'v1.0', category: 'Finance', adopted: ['c1'] },
]

/* Cross-company audited actions (fixed timeline — no wall-clock at render). */
type AuditRow = {
  id: string
  time: string
  action: string
  scope: string
  outcome: 'Success' | 'Partial' | 'Logged'
}
const CROSS_COMPANY_AUDIT: AuditRow[] = [
  { id: 'pa1', time: '2026-06-08 14:02', action: 'Policy push · Code of Conduct v3.0', scope: '4 companies', outcome: 'Success' },
  { id: 'pa2', time: '2026-06-08 11:20', action: 'Consolidated report exported (PDF)', scope: 'Whole portfolio', outcome: 'Logged' },
  { id: 'pa3', time: '2026-06-07 16:45', action: 'Portfolio-wide announcement scheduled', scope: '5 companies', outcome: 'Success' },
  { id: 'pa4', time: '2026-06-07 09:08', action: 'Bulk employee import · staging', scope: '1 company', outcome: 'Partial' },
  { id: 'pa5', time: '2026-06-06 18:30', action: 'Context switch · Kensium LLC → Kensium Pvt Ltd', scope: '1 company', outcome: 'Logged' },
]
const outcomeTone: Record<AuditRow['outcome'], Tone> = {
  Success: 'success',
  Partial: 'warning',
  Logged: 'info',
}

/* Static dot-color map — never build Tailwind class names dynamically (JIT purge). */
const dotClass: Record<Tone, string> = {
  success: 'bg-success', warning: 'bg-warning', neutral: 'bg-muted-fg', primary: 'bg-primary',
  info: 'bg-info', accent: 'bg-accent', accent2: 'bg-accent2', danger: 'bg-danger',
}

/* Standardization journey (kanban-style flow across the portfolio). */
type JourneyCol = {
  id: string
  title: string
  hint: string
  tone: Tone
  items: { id: string; label: string; companies: string[] }[]
}
const JOURNEY: JourneyCol[] = [
  {
    id: 'authored', title: 'Authored', hint: 'Standardized templates', tone: 'neutral',
    items: [
      { id: 'j1', label: 'Travel & Expense v1.0', companies: ['Kensium Pvt Ltd'] },
      { id: 'j2', label: 'Asset Handling v1.2', companies: ['Kensium Pvt Ltd', 'Kensium LLC'] },
    ],
  },
  {
    id: 'deploying', title: 'Deploying', hint: 'Per-company instances', tone: 'accent2',
    items: [
      { id: 'j3', label: 'Information Security v2.0', companies: ['Readywire', 'Digiteon'] },
      { id: 'j4', label: 'Remote Work v1.4', companies: ['99x'] },
    ],
  },
  {
    id: 'ack', title: 'Acknowledging', hint: 'Sign-off in progress', tone: 'warning',
    items: [
      { id: 'j5', label: 'Code of Conduct v3.0', companies: ['Kensium LLC', 'Readywire', '99x'] },
    ],
  },
  {
    id: 'aligned', title: 'Aligned', hint: 'Fully adopted', tone: 'success',
    items: [
      { id: 'j6', label: 'Leave Policy v2.1', companies: ['Kensium Pvt Ltd', 'Kensium LLC', 'Readywire', 'Digiteon', '99x'] },
    ],
  },
]

/* ----------------------------------------------------------------- main */
export default function Portfolio() {
  const { role, persona, authorizedCompanies, company: current, setCompanyId } = useApp()
  const { push } = useToast()
  const navigate = useNavigate()

  // Audited cross-company actions are write-capable for the portfolio manager;
  // the provider admin oversees; everyone else lands on a read-only notice.
  const canManage = role === 'provider_admin' || role === 'portfolio_manager'

  /* Consolidated, deterministic roll-up across ONLY the authorized companies.
     People counts come from the shared company data layer (deterministic per id);
     open roles / pending / on-leave use fixed per-company seeds below. */
  const OPEN_ROLES: Record<string, number> = useMemo(
    () => ({ c1: 6, c2: 4, c3: 2, c4: 1, c5: 3, c6: 0, c7: 1, c8: 2 }),
    [],
  )
  const PENDING: Record<string, number> = useMemo(
    () => ({ c1: 8, c2: 5, c3: 3, c4: 2, c5: 4, c6: 0, c7: 1, c8: 3 }),
    [],
  )

  const rows = useMemo(
    () =>
      authorizedCompanies.map((c) => {
        const data = getCompanyData(c.id)
        const onLeave = data.employees.filter((e) => e.status === 'On Leave').length
        return {
          company: c,
          headcount: c.employees,
          onLeave,
          openRoles: OPEN_ROLES[c.id] ?? 0,
          pending: PENDING[c.id] ?? 0,
          alignment: alignmentOf(c.id),
          // sample of real people for the avatar cluster
          people: data.employees.slice(0, 6).map((e) => e.name),
        }
      }),
    [authorizedCompanies, OPEN_ROLES, PENDING],
  )

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          headcount: a.headcount + r.headcount,
          openRoles: a.openRoles + r.openRoles,
          pending: a.pending + r.pending,
          onLeave: a.onLeave + r.onLeave,
        }),
        { headcount: 0, openRoles: 0, pending: 0, onLeave: 0 },
      ),
    [rows],
  )

  const avgAlignment = useMemo(
    () => (rows.length ? Math.round(rows.reduce((a, r) => a + r.alignment, 0) / rows.length) : 0),
    [rows],
  )

  // headcount-by-company bar series + status donut (deterministic from authorized set)
  const headcountSeries = useMemo(
    () => rows.map((r) => ({ name: r.company.initials, value: r.headcount })),
    [rows],
  )
  const statusMix = useMemo(() => {
    const active = rows.filter((r) => r.company.status === 'Active').length
    const suspended = rows.filter((r) => r.company.status === 'Suspended').length
    const draft = rows.filter((r) => r.company.status === 'Draft').length
    return [
      { name: 'Active', value: active, tone: '#16a34a' },
      { name: 'Suspended', value: suspended, tone: '#d97706' },
      { name: 'Draft', value: draft, tone: '#64748b' },
    ].filter((s) => s.value > 0)
  }, [rows])

  const openCompany = (c: Company) => {
    setCompanyId(c.id)
    push({ title: `Now viewing ${c.name} · switch audited`, tone: 'primary' })
    navigate('/')
  }

  /* ------------------------------------------------- access gate */
  if (!canManage) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Portfolio"
          subtitle="Cross-company management is scoped to portfolio managers and platform admins."
          icon={<Layers className="h-5 w-5" />}
        />
        <EmptyState
          icon={<Lock className="h-5 w-5" />}
          title="Portfolio view isn't available to your role"
          description="Consolidated cross-company dashboards are limited to Portfolio Managers and Platform / Provider Admins. Your access is scoped to a single company."
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Portfolio"
        subtitle={`Consolidated view across ${authorizedCompanies.length} authorized companies${persona ? ` · ${persona.name}` : ''}.`}
        icon={<Layers className="h-5 w-5" />}
        actions={
          <>
            <Tooltip label="Push standardized policy">
              <IconButton variant="outline" aria-label="Push standardized policy" onClick={() => push({ title: 'Policy push — pick companies', tone: 'primary' })}>
                <FileCheck2 className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Portfolio-wide announcement">
              <IconButton variant="outline" aria-label="Portfolio-wide announcement" onClick={() => push({ title: 'Announcement composer', tone: 'accent' })}>
                <Megaphone className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Export consolidated report">
              <IconButton variant="outline" aria-label="Export consolidated report" onClick={() => push({ title: 'Consolidated export queued · audited', tone: 'info' })}>
                <Download className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="Refresh roll-up">
              <IconButton variant="solid" aria-label="Refresh roll-up" onClick={() => push({ title: 'Roll-up refreshed', tone: 'success' })}>
                <RefreshCw className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
          </>
        }
      />

      {/* Consolidated KPI stat cards — summed across authorized companies */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total headcount" value={totals.headcount.toLocaleString()} delta={`${authorizedCompanies.length} companies`} deltaTone="primary" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Open roles" value={totals.openRoles} delta="across portfolio" deltaTone="info" icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Pending approvals" value={totals.pending} delta="needs action" deltaTone="warning" icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="On leave today" value={totals.onLeave} delta={`${avgAlignment}% avg alignment`} deltaTone="accent2" icon={<CalendarDays className="h-4 w-4" />} />
      </div>

      {/* Per-company cards */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-fg">Companies in your portfolio</h2>
          <Badge tone="neutral">{authorizedCompanies.length} authorized · row-level secured</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.company.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white', r.company.color)}>
                    {r.company.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-fg">
                      {r.company.name}
                      {r.company.id === current.id && <span className="ml-1.5 text-2xs font-bold text-primary">· current</span>}
                    </p>
                    <p className="flex items-center gap-1 text-2xs text-muted-fg">
                      <MapPin className="h-3 w-3" /> {r.company.jurisdiction}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone[r.company.status]} dot>{r.company.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface2/50 py-2">
                  <p className="tnum text-base font-extrabold text-fg">{r.headcount}</p>
                  <p className="text-2xs text-muted-fg">Headcount</p>
                </div>
                <div className="rounded-lg bg-surface2/50 py-2">
                  <p className="tnum text-base font-extrabold text-fg">{r.openRoles}</p>
                  <p className="text-2xs text-muted-fg">Open roles</p>
                </div>
                <div className="rounded-lg bg-surface2/50 py-2">
                  <p className="tnum text-base font-extrabold text-fg">{r.pending}</p>
                  <p className="text-2xs text-muted-fg">Pending</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-fg">Policy alignment</span>
                  <span className="tnum font-bold text-fg">{r.alignment}%</span>
                </div>
                <ProgressBar value={r.alignment} tone={alignTone(r.alignment)} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <AvatarStack names={r.people} max={4} size="xs" />
                <Button size="sm" variant="outline" onClick={() => openCompany(r.company)} aria-label={`Open ${r.company.name}`}>
                  <LogIn className="h-3.5 w-3.5" /> Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Headcount by company</CardTitle>
            <Badge tone="primary">{totals.headcount.toLocaleString()} total</Badge>
          </CardHeader>
          <CardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={headcountSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
                  <RTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--muted) / 0.4)' }} />
                  <Bar dataKey="value" name="Employees" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company status mix</CardTitle>
            <Badge tone="neutral">Snapshot</Badge>
          </CardHeader>
          <CardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={2}
                    stroke="rgb(var(--surface))"
                    strokeWidth={2}
                  >
                    {statusMix.map((slice) => (
                      <Cell key={slice.name} fill={slice.tone} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Standardization journey — kanban-style flow */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Standardization journey</CardTitle>
            <Badge tone="accent2">Policy roll-out</Badge>
          </div>
          <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
            Authored → Deploying → Acknowledging → Aligned
          </span>
        </CardHeader>
        <CardBody className="p-4">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {JOURNEY.map((col) => (
              <div key={col.id} className="w-64 shrink-0 rounded-xl border border-border bg-surface2/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', dotClass[col.tone])} />
                    <span className="text-sm font-bold text-fg">{col.title}</span>
                  </div>
                  <Badge tone={col.tone}>{col.items.length}</Badge>
                </div>
                <p className="mb-3 text-2xs text-muted-fg">{col.hint}</p>
                <div className="space-y-2.5">
                  {col.items.map((it) => (
                    <div key={it.id} className="rounded-lg border border-border bg-surface p-3 shadow-card">
                      <p className="text-sm font-semibold text-fg">{it.label}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <AvatarStack names={it.companies} max={3} size="xs" />
                        <span className="text-2xs text-muted-fg">{it.companies.length} co.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Policy / standardization alignment table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ListChecks className="h-4 w-4" /></span>
            <div>
              <CardTitle>Policy &amp; standardization alignment</CardTitle>
              <p className="text-2xs text-muted-fg">Which authorized companies have adopted each standardized policy instance</p>
            </div>
          </div>
          <Badge tone="primary">{avgAlignment}% avg</Badge>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <thead>
              <Tr className="border-t-0 hover:bg-transparent">
                <Th>Standardized policy</Th>
                <Th>Category</Th>
                <Th className="text-center">Adoption</Th>
                <Th>Coverage</Th>
                <Th className="text-right">Status</Th>
              </Tr>
            </thead>
            <tbody>
              {STANDARD_POLICIES.map((p) => {
                const inScope = p.adopted.filter((id) => authorizedCompanies.some((c) => c.id === id))
                const pct = authorizedCompanies.length
                  ? Math.round((inScope.length / authorizedCompanies.length) * 100)
                  : 0
                return (
                  <Tr key={p.id}>
                    <Td>
                      <p className="font-semibold text-fg">{p.policy}</p>
                      <p className="text-2xs text-muted-fg">{p.version}</p>
                    </Td>
                    <Td><Badge tone="neutral">{p.category}</Badge></Td>
                    <Td className="text-center tnum text-muted-fg">
                      {inScope.length}/{authorizedCompanies.length}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} tone={alignTone(pct)} className="w-24" />
                        <span className="tnum text-xs font-semibold text-fg">{pct}%</span>
                      </div>
                    </Td>
                    <Td className="text-right">
                      {pct >= 85 ? (
                        <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> Aligned</Badge>
                      ) : pct >= 60 ? (
                        <Badge tone="warning">Rolling out</Badge>
                      ) : (
                        <Badge tone="danger"><AlertTriangle className="h-3 w-3" /> Diverged</Badge>
                      )}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Audited cross-company actions */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ScrollText className="h-4 w-4" /></span>
            <CardTitle>Audited cross-company actions</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/audit')}>
            Full audit log <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <ul className="divide-y divide-border">
            {CROSS_COMPANY_AUDIT.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                <Avatar name={persona?.name ?? 'Portfolio Manager'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">{a.action}</p>
                  <p className="truncate text-2xs text-muted-fg tnum">{a.time} · {a.scope}</p>
                </div>
                <Badge tone={outcomeTone[a.outcome]}>{a.outcome}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-muted-fg">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Every cross-company action — context switch, policy push, export, announcement — is immutably logged with actor,
        companies affected, and outcome. Visibility is row-level secured to your authorized portfolio only.
      </p>
    </div>
  )
}
