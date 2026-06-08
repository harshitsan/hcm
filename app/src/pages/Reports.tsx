import { useMemo, useState } from 'react'
import {
  BarChart3, Users, TrendingDown, Clock3, FileSignature, Star, Play, Plus,
  LineChart as LineChartIcon, Table2, Filter, ShieldCheck, Download,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../app/store'
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
  const { push } = useToast()
  const isEmployee = role === 'employee'
  const [range, setRange] = useState<'6m' | '12m'>('6m')
  const [preview, setPreview] = useState<SavedReport | null>(null)
  const [builder, setBuilder] = useState(false)

  const reports = useMemo(
    () => [...savedReports].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [],
  )

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

  if (isEmployee) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Team and company analytics live with HR."
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Reports aren't available to you"
          description="Analytics are scoped to HR admins and managers. You can view your own attendance and leave from the Time section."
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
            <Button onClick={() => setBuilder(true)}>
              <Plus className="h-4 w-4" /> New report
            </Button>
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

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-fg">
        <ShieldCheck className="h-3.5 w-3.5" />
        Always filtered to what you're allowed to see.
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
            <Button variant="outline" onClick={() => push({ title: 'Exported report.csv', tone: 'success' })}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
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
