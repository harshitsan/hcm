import { useMemo, useState } from 'react'
import {
  FileSignature, Plus, Sparkles, Layers, Search, Download, Mail, MonitorSmartphone,
  Printer, CheckCircle2, Clock3, Send, Stamp, ShieldCheck, FileText, Workflow,
  ChevronRight, Users,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  AvatarStack, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState,
  Field, IconButton, Input, Modal, PageHeader, ProgressBar, Segmented, Select,
  Stepper, Table, Tabs, Td, Th, Tooltip, Tr, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'

/* ----------------------------------------------------------------- types */
type TemplateKey =
  | 'appointment' | 'confirmation' | 'transfer' | 'experience'
  | 'relieving' | 'salary' | 'noc'

type LetterTemplate = {
  key: TemplateKey
  name: string
  blurb: string
  mergeFields: string[]
  issued: number
  autoTrigger: string | null
}

type DeliveryChannel = 'Email' | 'In-app' | 'Print'
type DeliveryStatus = 'Delivered' | 'Viewed' | 'Sent' | 'Queued' | 'Bounced'

type DistributionRow = {
  id: string
  employee: string
  template: TemplateKey
  channel: DeliveryChannel
  status: DeliveryStatus
  issued: string
  signed: boolean
}

type MyLetter = {
  id: string
  template: TemplateKey
  issued: string
  channel: DeliveryChannel
  status: DeliveryStatus
  size: string
}

/* ----------------------------------------------------------------- static config */
const TEMPLATES: LetterTemplate[] = [
  {
    key: 'appointment', name: 'Appointment Letter',
    blurb: 'Offer-to-employment confirmation issued on joining.',
    mergeFields: ['Name', 'Designation', 'Department', 'CTC', 'Join date'],
    issued: 128, autoTrigger: 'On candidate → employee conversion',
  },
  {
    key: 'confirmation', name: 'Confirmation Letter',
    blurb: 'Issued when probation is confirmed.',
    mergeFields: ['Name', 'Designation', 'Confirmation date', 'Reviewer'],
    issued: 41, autoTrigger: 'On probation outcome = Confirm',
  },
  {
    key: 'transfer', name: 'Transfer Letter',
    blurb: 'Inter-department / inter-location moves.',
    mergeFields: ['Name', 'From unit', 'To unit', 'Effective date'],
    issued: 17, autoTrigger: 'On transfer effective date',
  },
  {
    key: 'experience', name: 'Experience Certificate',
    blurb: 'Tenure & role summary for an exiting employee.',
    mergeFields: ['Name', 'Tenure', 'Designation', 'Last working day'],
    issued: 33, autoTrigger: null,
  },
  {
    key: 'relieving', name: 'Relieving Letter',
    blurb: 'Confirms clearance & release on exit.',
    mergeFields: ['Name', 'Last working day', 'Clearance status'],
    issued: 29, autoTrigger: 'On exit clearance complete',
  },
  {
    key: 'salary', name: 'Salary Certificate',
    blurb: 'Income proof for loans, visas & verification.',
    mergeFields: ['Name', 'Designation', 'Annual CTC', 'Period'],
    issued: 64, autoTrigger: null,
  },
  {
    key: 'noc', name: 'NOC Letter',
    blurb: 'No-objection for travel, higher studies or visas.',
    mergeFields: ['Name', 'Purpose', 'Valid till'],
    issued: 12, autoTrigger: null,
  },
]

const TEMPLATE_NAME: Record<TemplateKey, string> = TEMPLATES.reduce(
  (acc, t) => ({ ...acc, [t.key]: t.name }),
  {} as Record<TemplateKey, string>,
)

const TEMPLATE_ICON: Record<TemplateKey, typeof FileText> = {
  appointment: Stamp, confirmation: CheckCircle2, transfer: Send,
  experience: FileText, relieving: FileSignature, salary: FileText, noc: ShieldCheck,
}

const CHANNEL_ICON: Record<DeliveryChannel, typeof Mail> = {
  Email: Mail, 'In-app': MonitorSmartphone, Print: Printer,
}

const STATUS_TONE: Record<DeliveryStatus, 'success' | 'accent' | 'info' | 'warning' | 'danger'> = {
  Delivered: 'success', Viewed: 'accent', Sent: 'info', Queued: 'warning', Bounced: 'danger',
}

const GENERATE_STEPS = ['Pick template', 'Merge data', 'Approve & sign', 'Distribute']

/* ----------------------------------------------------------------- deterministic mock data */
const DISTRIBUTION: DistributionRow[] = [
  { id: 'dt1', employee: 'Meera Iyer', template: 'salary', channel: 'Email', status: 'Delivered', issued: 'Jun 6', signed: true },
  { id: 'dt2', employee: 'Riya Singh', template: 'appointment', channel: 'In-app', status: 'Viewed', issued: 'Jun 5', signed: true },
  { id: 'dt3', employee: 'Imran Khan', template: 'confirmation', channel: 'Email', status: 'Sent', issued: 'Jun 5', signed: true },
  { id: 'dt4', employee: 'Sanjay Gupta', template: 'transfer', channel: 'In-app', status: 'Viewed', issued: 'Jun 4', signed: true },
  { id: 'dt5', employee: 'Fatima Sheikh', template: 'relieving', channel: 'Print', status: 'Queued', issued: 'Jun 4', signed: false },
  { id: 'dt6', employee: 'Joseph Thomas', template: 'experience', channel: 'Email', status: 'Bounced', issued: 'Jun 3', signed: true },
  { id: 'dt7', employee: 'Divya Menon', template: 'salary', channel: 'Email', status: 'Delivered', issued: 'Jun 3', signed: true },
  { id: 'dt8', employee: 'Ananya Bose', template: 'noc', channel: 'In-app', status: 'Sent', issued: 'Jun 2', signed: true },
]

const MY_LETTERS: MyLetter[] = [
  { id: 'ml1', template: 'appointment', issued: 'Sep 6, 2021', channel: 'In-app', status: 'Viewed', size: '142 KB' },
  { id: 'ml2', template: 'confirmation', issued: 'Mar 8, 2022', channel: 'Email', status: 'Delivered', size: '128 KB' },
  { id: 'ml3', template: 'salary', issued: 'Jun 6, 2026', channel: 'Email', status: 'Delivered', size: '96 KB' },
  { id: 'ml4', template: 'noc', issued: 'Apr 18, 2026', channel: 'In-app', status: 'Sent', size: '88 KB' },
]

// generated trend over the last six months (fixed, deterministic)
const ISSUED_TREND = [
  { month: 'Jan', value: 38 },
  { month: 'Feb', value: 31 },
  { month: 'Mar', value: 52 },
  { month: 'Apr', value: 44 },
  { month: 'May', value: 67 },
  { month: 'Jun', value: 49 },
]

const CHANNEL_MIX = [
  { name: 'Email', value: 58, tone: '#2563eb' },
  { name: 'In-app', value: 31, tone: '#f97316' },
  { name: 'Print', value: 11, tone: '#64748b' },
]

// kanban / journey columns for the issuance flow
const FLOW_COLUMNS: { key: string; label: string; tone: 'neutral' | 'warning' | 'info' | 'success' }[] = [
  { key: 'drafting', label: 'Drafting', tone: 'neutral' },
  { key: 'approval', label: 'In approval', tone: 'warning' },
  { key: 'signing', label: 'Signing authority', tone: 'info' },
  { key: 'distributed', label: 'Distributed', tone: 'success' },
]

const FLOW_ITEMS: { id: string; column: string; template: TemplateKey; people: string[]; note: string }[] = [
  { id: 'fl1', column: 'drafting', template: 'experience', people: ['Joseph Thomas'], note: 'Tenure merge pending' },
  { id: 'fl2', column: 'drafting', template: 'noc', people: ['Karan Mehta'], note: 'Visa — valid till Dec' },
  { id: 'fl3', column: 'approval', template: 'transfer', people: ['Sanjay Gupta'], note: 'Awaiting Dept Head' },
  { id: 'fl4', column: 'approval', template: 'confirmation', people: ['Imran Khan', 'Riya Singh'], note: 'Batch · 2 letters' },
  { id: 'fl5', column: 'signing', template: 'relieving', people: ['Fatima Sheikh'], note: 'HR signature queued' },
  { id: 'fl6', column: 'distributed', template: 'salary', people: ['Meera Iyer', 'Divya Menon', 'Sneha Kapoor'], note: 'Emailed · 3 recipients' },
  { id: 'fl7', column: 'distributed', template: 'appointment', people: ['Riya Singh'], note: 'In-app · viewed' },
]

const axisStyle = { fontSize: 11, fill: 'rgb(var(--muted-fg))' }
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}
const gridStroke = 'rgb(var(--border))'

/* ----------------------------------------------------------------- module-scope components */
function TemplateCard({
  template,
  onGenerate,
}: {
  template: LetterTemplate
  onGenerate: (key: TemplateKey) => void
}) {
  const Icon = TEMPLATE_ICON[template.key]
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-card transition-colors hover:border-muted-fg/30">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        {template.autoTrigger ? (
          <Tooltip label={`Auto-generates: ${template.autoTrigger}`}>
            <Badge tone="accent2">
              <Workflow className="h-3 w-3" /> Auto
            </Badge>
          </Tooltip>
        ) : (
          <Badge tone="neutral">Manual</Badge>
        )}
      </div>
      <h3 className="mt-3 text-sm font-bold tracking-tight text-fg">{template.name}</h3>
      <p className="mt-1 flex-1 text-xs text-muted-fg">{template.blurb}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {template.mergeFields.slice(0, 3).map((f) => (
          <span key={f} className="rounded-md bg-muted px-1.5 py-0.5 text-2xs font-medium text-muted-fg">
            {`{${f}}`}
          </span>
        ))}
        {template.mergeFields.length > 3 && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-2xs font-medium text-muted-fg">
            +{template.mergeFields.length - 3}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-2xs font-semibold uppercase tracking-wide text-muted-fg tnum">
          {template.issued} issued
        </span>
        <Button size="sm" variant="subtle" onClick={() => onGenerate(template.key)}>
          <Sparkles className="h-3.5 w-3.5" /> Generate
        </Button>
      </div>
    </div>
  )
}

function ChannelCell({ channel }: { channel: DeliveryChannel }) {
  const Icon = CHANNEL_ICON[channel]
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-fg">
      <Icon className="h-3.5 w-3.5" /> {channel}
    </span>
  )
}

function FlowItemCard({
  template,
  people,
  note,
}: {
  template: TemplateKey
  people: string[]
  note: string
}) {
  const Icon = TEMPLATE_ICON[template]
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-[13px] font-semibold text-fg">{TEMPLATE_NAME[template]}</span>
      </div>
      <p className="mt-2 text-2xs text-muted-fg">{note}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <AvatarStack names={people} size="xs" max={3} />
        {people.length > 1 && (
          <Badge tone="neutral">
            <Users className="h-3 w-3" /> {people.length}
          </Badge>
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page */
export default function Letters() {
  const { role, company } = useApp()
  const { employees } = useCompanyData()
  const { push } = useToast()
  const isEmployee = role === 'employee'

  const tabs = useMemo(() => {
    const t = [{ value: 'mine', label: 'My letters' }]
    if (!isEmployee) {
      t.unshift({ value: 'templates', label: 'Templates' })
      t.push({ value: 'distribution', label: 'Distribution' })
      t.push({ value: 'flow', label: 'Issuance flow' })
    }
    return t
  }, [isEmployee])
  const [tab, setTab] = useState(isEmployee ? 'mine' : 'templates')

  // template gallery search
  const [query, setQuery] = useState('')
  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TEMPLATES
    return TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q),
    )
  }, [query])

  // distribution channel filter
  const [channelFilter, setChannelFilter] = useState<'All' | DeliveryChannel>('All')
  const filteredDistribution = useMemo(
    () => DISTRIBUTION.filter((r) => channelFilter === 'All' || r.channel === channelFilter),
    [channelFilter],
  )

  // generate modal
  const [genOpen, setGenOpen] = useState(false)
  const [genMode, setGenMode] = useState<'single' | 'batch'>('single')
  const [genTemplate, setGenTemplate] = useState<TemplateKey>('appointment')
  const [genEmployee, setGenEmployee] = useState('')
  const [genChannel, setGenChannel] = useState<DeliveryChannel>('Email')

  const openGenerate = (key: TemplateKey) => {
    setGenTemplate(key)
    setGenMode('single')
    setGenEmployee(employees[0]?.name ?? '')
    setGenChannel('Email')
    setGenOpen(true)
  }

  const submitGenerate = () => {
    if (genMode === 'single' && !genEmployee) {
      push({ title: 'Pick an employee for this letter', tone: 'warning' })
      return
    }
    const label = TEMPLATE_NAME[genTemplate]
    if (genMode === 'batch') {
      push({ title: `Batch queued · ${label} for ${employees.length} employees (PDF)`, tone: 'success' })
    } else {
      push({ title: `${label} generated for ${genEmployee} · routed for signing`, tone: 'success' })
    }
    setGenOpen(false)
  }

  const stats = useMemo(() => {
    const total = DISTRIBUTION.length
    const delivered = DISTRIBUTION.filter((r) => r.status === 'Delivered' || r.status === 'Viewed').length
    const pending = DISTRIBUTION.filter((r) => r.status === 'Sent' || r.status === 'Queued').length
    const bounced = DISTRIBUTION.filter((r) => r.status === 'Bounced').length
    return { total, delivered, pending, bounced }
  }, [])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Letters & Certificates"
        subtitle={
          isEmployee
            ? `Your official HR letters at ${company.name}.`
            : `Generate, sign & distribute HR letters for ${company.name}.`
        }
        icon={<FileSignature className="h-5 w-5" />}
        actions={
          !isEmployee && (
            <>
              <Tooltip label="Batch generate (PDF)">
                <IconButton
                  variant="outline"
                  aria-label="Batch generate letters"
                  onClick={() => {
                    setGenMode('batch')
                    setGenTemplate('appointment')
                    setGenChannel('Email')
                    setGenOpen(true)
                  }}
                >
                  <Layers className="h-[18px] w-[18px]" />
                </IconButton>
              </Tooltip>
              <Tooltip label="Generate a letter">
                <IconButton
                  variant="solid"
                  aria-label="Generate a letter"
                  onClick={() => openGenerate('appointment')}
                >
                  <Plus className="h-[18px] w-[18px]" />
                </IconButton>
              </Tooltip>
            </>
          )
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-5" />

      {/* ------------------------------------------------ Templates (HR only) */}
      {tab === 'templates' && !isEmployee && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="pl-9"
                aria-label="Search templates"
              />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-fg">
              <Workflow className="h-3.5 w-3.5 text-accent2" />
              Templates marked <span className="font-semibold text-accent2">Auto</span> issue on workflow triggers.
            </p>
          </div>

          {filteredTemplates.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No templates match"
              description="Try a different search term."
              action={
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((t) => (
                <TemplateCard key={t.key} template={t} onGenerate={openGenerate} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ Distribution (HR only) */}
      {tab === 'distribution' && !isEmployee && (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-fg">Issued this cycle</span>
                <Send className="h-4 w-4 text-muted-fg" />
              </div>
              <span className="mt-2 block text-2xl font-extrabold tracking-tight tnum">{stats.total}</span>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-fg">Delivered / viewed</span>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <span className="mt-2 block text-2xl font-extrabold tracking-tight tnum text-success">{stats.delivered}</span>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-fg">In transit</span>
                <Clock3 className="h-4 w-4 text-warning" />
              </div>
              <span className="mt-2 block text-2xl font-extrabold tracking-tight tnum text-warning">{stats.pending}</span>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-fg">Bounced</span>
                <Mail className="h-4 w-4 text-danger" />
              </div>
              <span className="mt-2 block text-2xl font-extrabold tracking-tight tnum text-danger">{stats.bounced}</span>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Letters issued · last 6 months</CardTitle>
                <Badge tone="info">Trend</Badge>
              </CardHeader>
              <CardBody>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ISSUED_TREND} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                      <defs>
                        <linearGradient id="lt-issued" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />
                      <RTooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Letters"
                        stroke="rgb(var(--accent))"
                        strokeWidth={2}
                        fill="url(#lt-issued)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery channel mix</CardTitle>
                <Badge tone="neutral">Snapshot</Badge>
              </CardHeader>
              <CardBody>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={CHANNEL_MIX}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={84}
                        paddingAngle={2}
                        stroke="rgb(var(--surface))"
                        strokeWidth={2}
                      >
                        {CHANNEL_MIX.map((slice) => (
                          <Cell key={slice.name} fill={slice.tone} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-4">
                  {CHANNEL_MIX.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-1.5 text-xs text-muted-fg">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.tone }} />
                      {c.name} · <span className="tnum font-semibold text-fg">{c.value}%</span>
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tracking table */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution &amp; delivery tracking</CardTitle>
              <Segmented<'All' | DeliveryChannel>
                value={channelFilter}
                onChange={setChannelFilter}
                options={[
                  { value: 'All', label: 'All' },
                  { value: 'Email', label: 'Email' },
                  { value: 'In-app', label: 'In-app' },
                  { value: 'Print', label: 'Print' },
                ]}
              />
            </CardHeader>
            <CardBody className="p-0">
              {filteredDistribution.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<Send className="h-5 w-5" />}
                    title="No deliveries on this channel"
                    description="Switch the channel filter to see other letters."
                  />
                </div>
              ) : (
                <Table>
                  <thead>
                    <Tr className="border-t-0 hover:bg-transparent">
                      <Th>Employee</Th>
                      <Th>Letter</Th>
                      <Th>Channel</Th>
                      <Th>Status</Th>
                      <Th>Signed</Th>
                      <Th>Issued</Th>
                      <Th className="w-10" />
                    </Tr>
                  </thead>
                  <tbody>
                    {filteredDistribution.map((r) => (
                      <Tr key={r.id}>
                        <Td className="font-semibold text-fg">{r.employee}</Td>
                        <Td className="text-muted-fg">{TEMPLATE_NAME[r.template]}</Td>
                        <Td><ChannelCell channel={r.channel} /></Td>
                        <Td>
                          <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge>
                        </Td>
                        <Td>
                          {r.signed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                              <Stamp className="h-3.5 w-3.5" /> Signed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-fg">Awaiting</span>
                          )}
                        </Td>
                        <Td className="text-muted-fg tnum">{r.issued}</Td>
                        <Td className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Resend ${TEMPLATE_NAME[r.template]} to ${r.employee}`}
                            onClick={() => push({ title: `Re-sent to ${r.employee} · ${r.channel}`, tone: 'info' })}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          <p className="flex items-center gap-1.5 text-xs text-muted-fg">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Issued letters are version-controlled and retained for 7 years in the audit trail.
          </p>
        </div>
      )}

      {/* ------------------------------------------------ Issuance flow / kanban (HR only) */}
      {tab === 'flow' && !isEmployee && (
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-fg">Generation lifecycle</h3>
                <p className="mt-0.5 text-xs text-muted-fg">
                  Every letter flows through merge → approval → signing authority → distribution.
                </p>
              </div>
              <Stepper steps={GENERATE_STEPS} current={2} />
            </div>
          </Card>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {FLOW_COLUMNS.map((col) => {
              const items = FLOW_ITEMS.filter((i) => i.column === col.key)
              return (
                <div key={col.key} className="w-72 shrink-0 rounded-2xl border border-border bg-surface2/40 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-fg">
                      <span className={cn('h-2 w-2 rounded-full', {
                        neutral: 'bg-muted-fg', warning: 'bg-warning', info: 'bg-info', success: 'bg-success',
                      }[col.tone])} />
                      {col.label}
                    </span>
                    <Badge tone={col.tone === 'neutral' ? 'neutral' : col.tone}>{items.length}</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {items.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-muted-fg">Nothing here</p>
                    ) : (
                      items.map((i) => (
                        <FlowItemCard key={i.id} template={i.template} people={i.people} note={i.note} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ My letters (everyone) */}
      {tab === 'mine' && (
        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Download className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-fg">Your official letters</h3>
                <p className="mt-0.5 text-xs text-muted-fg">
                  Download PDFs of letters addressed to you. New letters appear here automatically.
                </p>
              </div>
            </div>
          </Card>

          {MY_LETTERS.length === 0 ? (
            <EmptyState
              icon={<FileSignature className="h-5 w-5" />}
              title="No letters yet"
              description="When HR issues a letter to you, it will be available to download here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MY_LETTERS.map((l) => {
                const Icon = TEMPLATE_ICON[l.template]
                const Channel = CHANNEL_ICON[l.channel]
                return (
                  <Card key={l.id} className="flex flex-col p-4">
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <Badge tone={STATUS_TONE[l.status]} dot>{l.status}</Badge>
                    </div>
                    <h3 className="mt-3 text-sm font-bold tracking-tight text-fg">{TEMPLATE_NAME[l.template]}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-fg">
                      <span>{l.issued}</span>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Channel className="h-3 w-3" /> {l.channel}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-2xs uppercase tracking-wide text-muted-fg tnum">PDF · {l.size}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => push({ title: `Downloading ${TEMPLATE_NAME[l.template]}`, tone: 'info' })}
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ Generate modal (HR only) */}
      {!isEmployee && (
        <Modal
          open={genOpen}
          onClose={() => setGenOpen(false)}
          title={genMode === 'batch' ? 'Batch generate letters' : 'Generate a letter'}
          description={
            genMode === 'batch'
              ? 'Generate one letter type as PDFs for a set of employees.'
              : 'Merge an employee’s data into a template and route it for signing.'
          }
          footer={
            <>
              <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
              <Button onClick={submitGenerate}>
                {genMode === 'batch' ? <Layers className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {genMode === 'batch' ? 'Queue batch (PDF)' : 'Generate & route'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Segmented<'single' | 'batch'>
              value={genMode}
              onChange={setGenMode}
              className="w-full"
              options={[
                { value: 'single', label: 'Single' },
                { value: 'batch', label: 'Batch (PDF)' },
              ]}
            />

            <Field label="Letter template" required>
              <Select
                value={genTemplate}
                onChange={(e) => setGenTemplate(e.target.value as TemplateKey)}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>{t.name}</option>
                ))}
              </Select>
            </Field>

            {genMode === 'single' ? (
              <Field label="Employee" required>
                <Select value={genEmployee} onChange={(e) => setGenEmployee(e.target.value)}>
                  <option value="">Select an employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>{emp.name} · {emp.title}</option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div className="rounded-xl border border-border bg-surface2/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-fg">Recipients</span>
                  <Badge tone="primary">{employees.length} employees</Badge>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <AvatarStack names={employees.map((e) => e.name)} max={6} size="sm" />
                  <span className="text-xs text-muted-fg">All active staff</span>
                </div>
              </div>
            )}

            <Field label="Distribution channel">
              <Select
                value={genChannel}
                onChange={(e) => setGenChannel(e.target.value as DeliveryChannel)}
              >
                <option value="Email">Email</option>
                <option value="In-app">In-app</option>
                <option value="Print">Print</option>
              </Select>
            </Field>

            <div className="flex items-start gap-2 rounded-xl border border-accent2/30 bg-accent2/10 p-3">
              <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-accent2" />
              <p className="text-xs text-accent2">
                This letter will route through the approval &amp; signing-authority workflow before it is
                delivered. Confirmation, relieving and transfer letters can also auto-trigger on lifecycle events.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs text-muted-fg">
              <span className="inline-flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5" /> Merge fields auto-fill from the employee record
              </span>
              <span className="tnum font-semibold text-fg">
                {TEMPLATES.find((t) => t.key === genTemplate)?.mergeFields.length ?? 0} fields
              </span>
            </div>
            <ProgressBar value={genMode === 'batch' ? 35 : 70} tone="accent" />
          </div>
        </Modal>
      )}
    </div>
  )
}
