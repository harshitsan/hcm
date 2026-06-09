import { useMemo, useState } from 'react'
import {
  BarChart3, Users, TrendingDown, Clock3, FileSignature, Star, Play, Plus,
  LineChart as LineChartIcon, Table2, Filter, ShieldCheck, Download,
  UserX, CalendarCheck, Laptop, Wallet, Activity,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../app/store'
import { useCan, useRbac, rbacRoleFor } from '../app/rbac'
import { savedReports } from '../data/mock'
import { useCompanyData } from '../data/companyData'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState,
  PageHeader, Segmented, StatCard, Modal, Table, Th, Td, Tr, ProgressBar,
  Field, Input, Select, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'
import type { ReactNode } from 'react'

type ReportType = (typeof savedReports)[number]['type']
type SavedReport = (typeof savedReports)[number]
type Tone = 'primary' | 'info' | 'accent' | 'neutral'

/** dummy rows shown in a Table-type report preview */
const DEMO_ROWS = [
  { dept: 'Engineering', headcount: 96, attrition: '5.1%', openRoles: 3 },
  { dept: 'Sales', headcount: 54, attrition: '8.4%', openRoles: 2 },
  { dept: 'Operations', headcount: 41, attrition: '4.2%', openRoles: 1 },
  { dept: 'Finance', headcount: 22, attrition: '3.0%', openRoles: 0 },
  { dept: 'People & Culture', headcount: 18, attrition: '6.6%', openRoles: 1 },
]
/** dummy hiring funnel for Funnel-type previews */
const DEMO_FUNNEL = [
  { stage: 'Applied', value: 100 },
  { stage: 'Screened', value: 54 },
  { stage: 'Interviewed', value: 28 },
  { stage: 'Offered', value: 8 },
  { stage: 'Hired', value: 5 },
]

/* --------------------------------------------------------------------------
 * HR-admin analytics — deterministic page-local series (fixed literals only).
 * 6 months of operations data + a few categories. No randomness / wall-clock.
 * ------------------------------------------------------------------------ */
/** Monthly absenteeism rate (%) split by department — trend over 6 months. */
const ABSENTEEISM_BY_MONTH = [
  { month: 'Jan', Engineering: 3.1, Sales: 4.6, Operations: 5.2 },
  { month: 'Feb', Engineering: 2.8, Sales: 5.1, Operations: 4.7 },
  { month: 'Mar', Engineering: 3.6, Sales: 4.2, Operations: 5.8 },
  { month: 'Apr', Engineering: 2.4, Sales: 3.8, Operations: 4.4 },
  { month: 'May', Engineering: 3.0, Sales: 4.9, Operations: 5.1 },
  { month: 'Jun', Engineering: 2.6, Sales: 3.5, Operations: 4.0 },
]
/** Company-wide attendance split — present / WFH / on-leave headcount by month. */
const ATTENDANCE_BY_MONTH = [
  { month: 'Jan', present: 198, wfh: 42, leave: 24 },
  { month: 'Feb', present: 204, wfh: 38, leave: 22 },
  { month: 'Mar', present: 191, wfh: 51, leave: 28 },
  { month: 'Apr', present: 212, wfh: 44, leave: 18 },
  { month: 'May', present: 207, wfh: 47, leave: 21 },
  { month: 'Jun', present: 219, wfh: 40, leave: 16 },
]
/** Asset inventory — allocated vs available units by category. */
const ASSETS_BY_CATEGORY = [
  { category: 'Laptops', allocated: 248, available: 32 },
  { category: 'Monitors', allocated: 186, available: 54 },
  { category: 'Phones', allocated: 94, available: 21 },
  { category: 'Access cards', allocated: 263, available: 47 },
  { category: 'Peripherals', allocated: 412, available: 88 },
]
/** Asset allocation share — donut over status buckets. */
const ASSET_STATUS = [
  { name: 'Allocated', value: 1203, tone: 'rgb(var(--accent))' },
  { name: 'Available', value: 242, tone: 'rgb(var(--info))' },
  { name: 'In repair', value: 38, tone: 'rgb(var(--warning))' },
]
/** Monthly payroll cost (₹ lakh) — total plus a department split. */
const PAYROLL_BY_MONTH = [
  { month: 'Jan', total: 184, Engineering: 96, Sales: 52, Operations: 36 },
  { month: 'Feb', total: 188, Engineering: 98, Sales: 53, Operations: 37 },
  { month: 'Mar', total: 192, Engineering: 99, Sales: 55, Operations: 38 },
  { month: 'Apr', total: 197, Engineering: 102, Sales: 56, Operations: 39 },
  { month: 'May', total: 201, Engineering: 104, Sales: 57, Operations: 40 },
  { month: 'Jun', total: 206, Engineering: 107, Sales: 58, Operations: 41 },
]

const typeTone: Record<ReportType, Tone> = {
  Bar: 'primary', Line: 'info', Table: 'neutral', Funnel: 'accent',
}
const typeIcon: Record<ReportType, typeof BarChart3> = {
  Bar: BarChart3, Line: LineChartIcon, Table: Table2, Funnel: Filter,
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

function ChartCard({
  title, badge, children,
}: {
  title: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {badge}
      </CardHeader>
      <CardBody>
        <div className="h-60">{children}</div>
      </CardBody>
    </Card>
  )
}

export default function Reports() {
  const { headcountByDept, headcountTrend, leaveByMonth, attendanceMix } = useCompanyData()
  const { role, company } = useApp()
  const { effModule } = useRbac()
  const canExport = useCan('report.export')
  const { push } = useToast()
  // Reports is a governed module: only roles with at least read access (HR admins,
  // portfolio managers, provider) see company-wide analytics. People Managers are
  // not granted the reports module, so they get the same access-denied view as employees.
  const canSeeReports = effModule(rbacRoleFor(role ?? 'employee'), 'reports') !== 'hidden'
  const [range, setRange] = useState<'6m' | '12m'>('6m')
  const [preview, setPreview] = useState<SavedReport | null>(null)
  const [builder, setBuilder] = useState(false)

  const reports = useMemo(
    () => [...savedReports].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [],
  )

  // Headline analytics metrics, derived from the deterministic page-local series.
  const analytics = useMemo(() => {
    const absRates = ABSENTEEISM_BY_MONTH.map(
      (m) => (m.Engineering + m.Sales + m.Operations) / 3,
    )
    const avgAbsenteeism = absRates.reduce((a, b) => a + b, 0) / absRates.length
    const attRates = ATTENDANCE_BY_MONTH.map((m) => {
      const total = m.present + m.wfh + m.leave
      return ((m.present + m.wfh) / total) * 100
    })
    const avgAttendance = attRates.reduce((a, b) => a + b, 0) / attRates.length
    const assetsAllocated = ASSET_STATUS.find((s) => s.name === 'Allocated')?.value ?? 0
    const assetsTotal = ASSET_STATUS.reduce((a, s) => a + s.value, 0)
    const latestPayroll = PAYROLL_BY_MONTH[PAYROLL_BY_MONTH.length - 1].total
    return {
      avgAbsenteeism: avgAbsenteeism.toFixed(1),
      avgAttendance: avgAttendance.toFixed(1),
      assetsAllocated,
      assetUtil: Math.round((assetsAllocated / assetsTotal) * 100),
      latestPayroll,
    }
  }, [])

  // The range toggle actually re-shapes the series (synthetic earlier months for 12 mo).
  const olderMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const trendData =
    range === '12m'
      ? [...olderMonths.map((m, i) => ({ month: m, value: 236 + i * 5 })), ...headcountTrend]
      : headcountTrend
  const leaveData =
    range === '12m'
      ? [...olderMonths.map((m, i) => ({ month: m, annual: 14 + i * 3, sick: 7 + (i % 3) })), ...leaveByMonth]
      : leaveByMonth

  const funnelTones = ['accent', 'info', 'primary', 'warning', 'success'] as const
  const previewBody = (r: SavedReport) => {
    if (r.type === 'Table') {
      return (
        <Table>
          <thead>
            <Tr className="border-t-0"><Th>Department</Th><Th>Headcount</Th><Th>Attrition</Th><Th>Open roles</Th></Tr>
          </thead>
          <tbody>
            {DEMO_ROWS.map((row) => (
              <Tr key={row.dept}>
                <Td className="font-semibold">{row.dept}</Td>
                <Td className="tnum">{row.headcount}</Td>
                <Td className="tnum">{row.attrition}</Td>
                <Td className="tnum">{row.openRoles}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )
    }
    if (r.type === 'Funnel') {
      return (
        <div className="space-y-3 py-1">
          {DEMO_FUNNEL.map((s, i) => (
            <div key={s.stage}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold">{s.stage}</span>
                <span className="tnum text-muted-fg">{s.value}</span>
              </div>
              <ProgressBar value={s.value} tone={funnelTones[i % funnelTones.length]} />
            </div>
          ))}
        </div>
      )
    }
    if (r.type === 'Line') {
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="prev-ln" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--success))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <RTooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" name="Headcount" stroke="rgb(var(--success))" strokeWidth={2} fill="url(#prev-ln)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )
    }
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={headcountByDept} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="dept" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
            <RTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--muted) / 0.4)' }} />
            <Bar dataKey="value" name="Employees" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (!canSeeReports) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Company analytics live with HR."
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Reports aren't available to you"
          description="Company-wide analytics are scoped to HR admins. You can view your own attendance and leave from the Time section."
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports & Analytics"
        subtitle={`Live people metrics for ${company.name}.`}
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <>
            <Segmented
              options={[{ value: '6m', label: '6 mo' }, { value: '12m', label: '12 mo' }]}
              value={range}
              onChange={setRange}
            />
            {canExport && (
              <Button onClick={() => setBuilder(true)}>
                <Plus className="h-4 w-4" /> New report
              </Button>
            )}
          </>
        }
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Headcount" value={company.employees} delta="+8 MTD" deltaTone="success" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Attrition" value="6.2%" delta="-0.8 pt" deltaTone="success" icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="Avg tenure" value="3.4 yr" delta="+0.2" deltaTone="info" icon={<Clock3 className="h-4 w-4" />} />
        <StatCard label="Offers out" value="4" delta="2 depts" deltaTone="warning" icon={<FileSignature className="h-4 w-4" />} />
      </div>

      {/* Operations KPI row — headline metrics for the analytics section */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Avg absenteeism" value={`${analytics.avgAbsenteeism}%`} delta="-0.4 pt" deltaTone="success" icon={<UserX className="h-4 w-4" />} />
        <StatCard label="Avg attendance" value={`${analytics.avgAttendance}%`} delta="+1.2 pt" deltaTone="success" icon={<CalendarCheck className="h-4 w-4" />} />
        <StatCard label="Assets allocated" value={analytics.assetsAllocated} delta={`${analytics.assetUtil}% util`} deltaTone="info" icon={<Laptop className="h-4 w-4" />} />
        <StatCard label="Monthly payroll" value={`₹${analytics.latestPayroll}L`} delta="+2.5%" deltaTone="warning" icon={<Wallet className="h-4 w-4" />} />
      </div>

      {/* Saved views */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Saved views</CardTitle>
            <Badge tone="neutral">{reports.length}</Badge>
          </div>
          <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">
            Pinned first
          </span>
        </CardHeader>
        <CardBody className="grid gap-2 sm:grid-cols-2">
          {reports.map((r) => {
            const Icon = typeIcon[r.type]
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface2/40 px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <Star
                  className={cn(
                    'h-4 w-4 shrink-0',
                    r.pinned ? 'fill-warning text-warning' : 'text-muted-fg/50',
                  )}
                />
                <Badge tone={typeTone[r.type]} className="shrink-0">
                  <Icon className="h-3 w-3" /> {r.type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-2xs text-muted-fg">Updated {r.updated}</p>
                </div>
                <Button size="sm" variant="subtle" onClick={() => setPreview(r)}>
                  <Play className="h-3.5 w-3.5" /> Run
                </Button>
              </div>
            )
          })}
        </CardBody>
      </Card>

      {/* Live charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Headcount by department — bar */}
        <ChartCard title="Headcount by department" badge={<Badge tone="primary">{company.employees} total</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={headcountByDept} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="dept" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <RTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--muted) / 0.4)' }} />
              <Bar dataKey="value" name="Employees" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Headcount trend — area */}
        <ChartCard title="Headcount trend" badge={<Badge tone="success">+16% YoY</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="rep-hc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--success))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} domain={['dataMin - 10', 'dataMax + 8']} />
              <RTooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" name="Headcount" stroke="rgb(var(--success))" strokeWidth={2} fill="url(#rep-hc)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Leave by month — stacked bar */}
        <ChartCard title="Leave taken by month" badge={<Badge tone="info">Annual + sick</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaveData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <RTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--muted) / 0.4)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="annual" name="Annual" stackId="l" fill="rgb(var(--accent))" maxBarSize={36} />
              <Bar dataKey="sick" name="Sick" stackId="l" fill="rgb(var(--warning))" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attendance mix — donut */}
        <ChartCard title="Attendance mix · today" badge={<Badge tone="neutral">Snapshot</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={attendanceMix}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={84}
                paddingAngle={2}
                stroke="rgb(var(--surface))"
                strokeWidth={2}
              >
                {attendanceMix.map((slice) => (
                  <Cell key={slice.name} fill={slice.tone} />
                ))}
              </Pie>
              <RTooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Operations analytics */}
      <div className="mb-3 mt-8 flex items-center gap-2">
        <Activity className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold tracking-tight">Operations analytics</h2>
        <Badge tone="neutral">Last 6 months</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Absenteeism — monthly rate by department (line trend) */}
        <ChartCard title="Absenteeism rate by department" badge={<Badge tone="warning">{analytics.avgAbsenteeism}% avg</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ABSENTEEISM_BY_MONTH} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} unit="%" />
              <RTooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Engineering" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Sales" stroke="rgb(var(--info))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Operations" stroke="rgb(var(--warning))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attendance — present / WFH / on-leave trend (stacked area) */}
        <ChartCard title="Attendance mix by month" badge={<Badge tone="info">{analytics.avgAttendance}% present</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ATTENDANCE_BY_MONTH} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="att-present" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="att-wfh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--info))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="rgb(var(--info))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="att-leave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--warning))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="rgb(var(--warning))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <RTooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="present" name="Present" stackId="a" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#att-present)" />
              <Area type="monotone" dataKey="wfh" name="WFH" stackId="a" stroke="rgb(var(--info))" strokeWidth={2} fill="url(#att-wfh)" />
              <Area type="monotone" dataKey="leave" name="On leave" stackId="a" stroke="rgb(var(--warning))" strokeWidth={2} fill="url(#att-leave)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Assets — allocated vs available by category (grouped bar) */}
        <ChartCard title="Assets by category" badge={<Badge tone="accent">{analytics.assetUtil}% utilised</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ASSETS_BY_CATEGORY} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="category" tick={axisStyle} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
              <RTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--muted) / 0.4)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="allocated" name="Allocated" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={26} />
              <Bar dataKey="available" name="Available" fill="rgb(var(--info))" radius={[6, 6, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Asset allocation share — donut */}
        <ChartCard title="Asset allocation share" badge={<Badge tone="neutral">{analytics.assetsAllocated} allocated</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ASSET_STATUS}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={84}
                paddingAngle={2}
                stroke="rgb(var(--surface))"
                strokeWidth={2}
              >
                {ASSET_STATUS.map((slice) => (
                  <Cell key={slice.name} fill={slice.tone} />
                ))}
              </Pie>
              <RTooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Payroll cost by department — stacked bar */}
        <ChartCard title="Payroll cost by department" badge={<Badge tone="primary">₹ lakh / mo</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PAYROLL_BY_MONTH} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} unit="L" />
              <RTooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(var(--muted) / 0.4)' }} formatter={(v) => `₹${v}L`} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Engineering" name="Engineering" stackId="p" fill="rgb(var(--accent))" maxBarSize={36} />
              <Bar dataKey="Sales" name="Sales" stackId="p" fill="rgb(var(--info))" maxBarSize={36} />
              <Bar dataKey="Operations" name="Operations" stackId="p" fill="rgb(var(--warning))" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Total payroll cost trend — area */}
        <ChartCard title="Total payroll cost trend" badge={<Badge tone="warning">₹{analytics.latestPayroll}L latest</Badge>}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PAYROLL_BY_MONTH} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="pay-total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} unit="L" domain={['dataMin - 6', 'dataMax + 4']} />
              <RTooltip contentStyle={tooltipStyle} formatter={(v) => `₹${v}L`} />
              <Area type="monotone" dataKey="total" name="Total payroll" stroke="rgb(var(--primary))" strokeWidth={2} fill="url(#pay-total)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-fg">
        <ShieldCheck className="h-3.5 w-3.5" />
        Company-wide analytics for {company.name}.
      </p>

      {/* Run → report preview */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        size="xl"
        title={preview?.name}
        description={preview ? `${preview.type} report · updated ${preview.updated} · ${company.name}` : undefined}
        footer={
          <>
            {canExport && (
              <Button variant="outline" onClick={() => push({ title: 'Exported report.csv', tone: 'success' })}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            )}
            <Button onClick={() => setPreview(null)}>Close</Button>
          </>
        }
      >
        {preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success" dot>Ran just now</Badge>
              <Badge tone="neutral">{range === '12m' ? 'Last 12 months' : 'Last 6 months'}</Badge>
              <Badge tone="neutral">Scope: {company.name}</Badge>
            </div>
            {previewBody(preview)}
          </div>
        )}
      </Modal>

      {/* New report builder */}
      <Modal
        open={builder}
        onClose={() => setBuilder(false)}
        size="lg"
        title="New report"
        description="Build a quick report (prototype — dummy data)."
        footer={
          <>
            <Button variant="outline" onClick={() => setBuilder(false)}>Cancel</Button>
            <Button onClick={() => { setBuilder(false); push({ title: 'Report created & saved', tone: 'success' }) }}>
              Create report
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Report name" required className="sm:col-span-2">
            <Input placeholder="e.g. Headcount by location" />
          </Field>
          <Field label="Type">
            <Select defaultValue="Bar"><option>Bar</option><option>Line</option><option>Table</option><option>Funnel</option></Select>
          </Field>
          <Field label="Metric">
            <Select defaultValue="Headcount"><option>Headcount</option><option>Attrition</option><option>Leave taken</option><option>Offers</option></Select>
          </Field>
          <Field label="Group by">
            <Select defaultValue="Department"><option>Department</option><option>Location</option><option>Month</option></Select>
          </Field>
          <Field label="Range">
            <Select defaultValue="6 months"><option>6 months</option><option>12 months</option></Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
