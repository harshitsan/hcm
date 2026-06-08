import { useMemo, useState } from 'react'
import {
  ArrowLeftRight, Upload, Download, Plus, History, ShieldCheck, FileSpreadsheet,
  FileJson, FileText, FileCode2, UploadCloud, FlaskConical, CircleCheck, RotateCcw,
  TriangleAlert, CircleX, Layers, Database, Users2, Building2, Boxes, ClipboardList,
  ChevronRight, Lock, CheckCircle2, Clock3,
} from 'lucide-react'
import {
  Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'
import { useApp } from '../app/store'
import { useCompanyData } from '../data/companyData'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, IconButton,
  Input, Modal, PageHeader, ProgressBar, Segmented, Select, Stepper, Table, Td, Th, Tr,
  Tooltip, AvatarStack, useToast,
} from '../components/ui'
import { cn } from '../lib/cn'
import type { ReactNode } from 'react'

/* ----------------------------------------------------------------- types */
type Format = 'CSV' | 'XLS' | 'XLSX' | 'JSON'
type JobKind = 'Import' | 'Export'
type JobStatus =
  | 'Completed'
  | 'Partially completed'
  | 'In-progress'
  | 'Validating'
  | 'Submitted'
  | 'Failed'
  | 'Rolled back'
type Severity = 'Error' | 'Warning'

type EntityDef = {
  id: string
  label: string
  layer: 'Foundation' | 'Organizational' | 'Workforce' | 'Transactional'
  seq: number
  icon: typeof Users2
  records: number
}

type ImportJob = {
  id: string
  kind: JobKind
  entity: string
  file: string
  format: Format
  records: number
  failed: number
  status: JobStatus
  actor: string
  when: string
  size: string
}

type ValidationRow = {
  row: number
  field: string
  value: string
  message: string
  severity: Severity
}

/* ----------------------------------------------------------------- constants */
const FORMATS: { id: Format; label: string; icon: typeof FileSpreadsheet; note: string }[] = [
  { id: 'CSV', label: 'CSV', icon: FileText, note: 'Comma-separated' },
  { id: 'XLS', label: 'XLS', icon: FileSpreadsheet, note: 'Excel 97–2003' },
  { id: 'XLSX', label: 'XLSX', icon: FileSpreadsheet, note: 'Excel workbook' },
  { id: 'JSON', label: 'JSON', icon: FileJson, note: 'Structured records' },
]

const MAX_MB = 50
const MAX_RECORDS = 10_000

const ENTITIES: EntityDef[] = [
  { id: 'company', label: 'Company', layer: 'Foundation', seq: 1, icon: Building2, records: 1 },
  { id: 'location', label: 'Locations', layer: 'Foundation', seq: 2, icon: Building2, records: 6 },
  { id: 'department', label: 'Departments', layer: 'Organizational', seq: 3, icon: Layers, records: 8 },
  { id: 'group', label: 'Groups', layer: 'Organizational', seq: 4, icon: Boxes, records: 12 },
  { id: 'position', label: 'Positions', layer: 'Organizational', seq: 5, icon: ClipboardList, records: 34 },
  { id: 'employee', label: 'Employees', layer: 'Workforce', seq: 6, icon: Users2, records: 312 },
  { id: 'leave', label: 'Leave records', layer: 'Transactional', seq: 7, icon: Database, records: 1840 },
  { id: 'attendance', label: 'Attendance', layer: 'Transactional', seq: 8, icon: Database, records: 9120 },
]

const LAYERS: EntityDef['layer'][] = ['Foundation', 'Organizational', 'Workforce', 'Transactional']
const LAYER_TONE: Record<EntityDef['layer'], 'info' | 'accent' | 'primary' | 'accent2'> = {
  Foundation: 'info',
  Organizational: 'accent',
  Workforce: 'primary',
  Transactional: 'accent2',
}

const WIZARD_STEPS = ['Choose entity', 'Upload file', 'Validate in sandbox', 'Confirm & commit']

const RECENT_JOBS: ImportJob[] = [
  { id: 'job-1', kind: 'Import', entity: 'Employees', file: 'employees_jun26.xlsx', format: 'XLSX', records: 312, failed: 0, status: 'Completed', actor: 'Priya Sharma', when: '2026-06-08 14:20', size: '1.4 MB' },
  { id: 'job-2', kind: 'Import', entity: 'Attendance', file: 'attendance_may.csv', format: 'CSV', records: 9120, failed: 41, status: 'Partially completed', actor: 'Anita Rao', when: '2026-06-08 11:02', size: '4.8 MB' },
  { id: 'job-3', kind: 'Export', entity: 'Departments', file: 'departments_export.json', format: 'JSON', records: 8, failed: 0, status: 'Completed', actor: 'Priya Sharma', when: '2026-06-07 17:45', size: '12 KB' },
  { id: 'job-4', kind: 'Import', entity: 'Leave records', file: 'leave_migration.xlsx', format: 'XLSX', records: 1840, failed: 0, status: 'Validating', actor: 'Anita Rao', when: '2026-06-07 16:10', size: '0.9 MB' },
  { id: 'job-5', kind: 'Import', entity: 'Positions', file: 'positions_v2.csv', format: 'CSV', records: 34, failed: 7, status: 'Failed', actor: 'Priya Sharma', when: '2026-06-07 09:31', size: '18 KB' },
  { id: 'job-6', kind: 'Import', entity: 'Groups', file: 'groups_seed.json', format: 'JSON', records: 12, failed: 0, status: 'Rolled back', actor: 'Anita Rao', when: '2026-06-06 13:55', size: '6 KB' },
  { id: 'job-7', kind: 'Export', entity: 'Employees', file: 'employees_full.xlsx', format: 'XLSX', records: 312, failed: 0, status: 'Completed', actor: 'Priya Sharma', when: '2026-06-06 10:12', size: '1.6 MB' },
  { id: 'job-8', kind: 'Import', entity: 'Locations', file: 'sites_apac.csv', format: 'CSV', records: 6, failed: 0, status: 'In-progress', actor: 'Anita Rao', when: '2026-06-06 09:40', size: '4 KB' },
]

const SANDBOX_ERRORS: ValidationRow[] = [
  { row: 14, field: 'email', value: 'ravi.kumar@', message: 'Invalid email format', severity: 'Error' },
  { row: 27, field: 'departmentId', value: 'd99', message: 'Referenced department does not exist', severity: 'Error' },
  { row: 41, field: 'joinDate', value: '31/02/2026', message: 'Not a valid calendar date', severity: 'Error' },
  { row: 58, field: 'managerId', value: 'e404', message: 'Manager not found — would orphan record', severity: 'Error' },
  { row: 73, field: 'phone', value: '98200', message: 'Phone too short — defaulting to blank', severity: 'Warning' },
  { row: 90, field: 'location', value: 'Pune', message: 'Location not in catalog — will be created', severity: 'Warning' },
]

/* job status → badge tone + icon */
const STATUS_META: Record<JobStatus, { tone: 'success' | 'info' | 'warning' | 'danger' | 'accent' | 'accent2' | 'neutral'; icon: typeof CircleCheck }> = {
  'Completed': { tone: 'success', icon: CircleCheck },
  'Partially completed': { tone: 'warning', icon: TriangleAlert },
  'In-progress': { tone: 'accent2', icon: Clock3 },
  'Validating': { tone: 'info', icon: FlaskConical },
  'Submitted': { tone: 'neutral', icon: Clock3 },
  'Failed': { tone: 'danger', icon: CircleX },
  'Rolled back': { tone: 'accent', icon: RotateCcw },
}

const DONUT_COLORS: Record<string, string> = {
  Completed: 'rgb(var(--success))',
  Running: 'rgb(var(--accent2))',
  Failed: 'rgb(var(--danger))',
  'Rolled back': 'rgb(var(--accent))',
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid rgb(var(--border))',
  fontSize: 12,
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
}

/* ----------------------------------------------------------------- small presentational pieces */
function FormatPill({ format }: { format: Format }) {
  const meta = FORMATS.find((f) => f.id === format)
  const Icon = meta?.icon ?? FileCode2
  return (
    <Badge tone="neutral">
      <Icon className="h-3 w-3" /> {format}
    </Badge>
  )
}

function StatusPill({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <Badge tone={meta.tone} dot>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  )
}

function LimitChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface2/50 px-3 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <div className="leading-tight">
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">{label}</p>
        <p className="text-sm font-bold text-fg tnum">{value}</p>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- import wizard (modal body) */
function ImportWizard({
  step,
  setStep,
  entityId,
  setEntityId,
  format,
  setFormat,
  onConfirm,
  onRollback,
}: {
  step: number
  setStep: (n: number) => void
  entityId: string
  setEntityId: (id: string) => void
  format: Format
  setFormat: (f: Format) => void
  onConfirm: () => void
  onRollback: () => void
}) {
  const entity = ENTITIES.find((e) => e.id === entityId) ?? ENTITIES[5]
  const errorCount = SANDBOX_ERRORS.filter((r) => r.severity === 'Error').length
  const warnCount = SANDBOX_ERRORS.filter((r) => r.severity === 'Warning').length
  const validRows = entity.records - errorCount

  return (
    <div className="space-y-5">
      <Stepper steps={WIZARD_STEPS} current={step} onStepClick={(i) => i <= step && setStep(i)} />

      {/* Step 1 — choose entity */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-fg">
            Pick the entity to import. Dependencies load in sequence:
            Foundation → Organizational → Workforce → Transactional.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENTITIES.map((e) => {
              const Icon = e.icon
              const active = e.id === entityId
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEntityId(e.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-surface2/40 hover:bg-muted/50',
                  )}
                >
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-fg')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{e.label}</p>
                    <p className="text-2xs text-muted-fg">~{e.records.toLocaleString()} records</p>
                  </div>
                  <Badge tone={LAYER_TONE[e.layer]}>{e.seq}</Badge>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2 — upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-fg">Format</span>
            <Segmented<Format>
              value={format}
              onChange={setFormat}
              options={FORMATS.map((f) => ({ value: f.id, label: f.label }))}
            />
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface2/50 px-6 py-8 text-center">
            <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-fg">Drag &amp; drop your {format} file</p>
            <p className="mt-0.5 text-xs text-muted-fg">
              {entity.label} · CSV, XLS, XLSX or JSON · up to {MAX_MB} MB / {MAX_RECORDS.toLocaleString()} records
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <LimitChip icon={<FileCode2 className="h-4 w-4" />} label="Formats" value="CSV · XLS · XLSX · JSON" />
            <LimitChip icon={<Database className="h-4 w-4" />} label="Max size" value={`${MAX_MB} MB`} />
            <LimitChip icon={<Layers className="h-4 w-4" />} label="Per batch" value={`${MAX_RECORDS.toLocaleString()}`} />
          </div>
          <p className="flex items-center gap-1.5 text-2xs text-muted-fg">
            <ShieldCheck className="h-3 w-3 text-success" />
            Oversized or unsupported files are rejected before processing with a clear message.
          </p>
        </div>
      )}

      {/* Step 3 — validate in sandbox (errors table) */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-surface2/40 px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold text-success tnum">{validRows.toLocaleString()}</p>
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Valid</p>
            </div>
            <div className="rounded-xl border border-border bg-surface2/40 px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold text-danger tnum">{errorCount}</p>
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Errors</p>
            </div>
            <div className="rounded-xl border border-border bg-surface2/40 px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold text-warning tnum">{warnCount}</p>
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted-fg">Warnings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-info/10 px-3 py-2 text-xs font-medium text-info">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            Running in sandbox — nothing is written to the live tenant until you confirm.
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <thead>
                <Tr className="border-t-0 hover:bg-transparent">
                  <Th className="w-12">Row</Th>
                  <Th>Field</Th>
                  <Th>Value</Th>
                  <Th>Message</Th>
                  <Th className="text-right">Severity</Th>
                </Tr>
              </thead>
              <tbody>
                {SANDBOX_ERRORS.map((r) => (
                  <Tr key={r.row}>
                    <Td className="tnum font-semibold text-muted-fg">{r.row}</Td>
                    <Td><code className="rounded bg-muted px-1.5 py-0.5 text-2xs font-semibold">{r.field}</code></Td>
                    <Td className="font-mono text-xs text-muted-fg">{r.value}</Td>
                    <Td className="text-fg">{r.message}</Td>
                    <Td className="text-right">
                      <Badge tone={r.severity === 'Error' ? 'danger' : 'warning'}>
                        {r.severity === 'Error' ? <CircleX className="h-3 w-3" /> : <TriangleAlert className="h-3 w-3" />}
                        {r.severity}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      {/* Step 4 — confirm / rollback */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface2/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-fg">Ready to commit</p>
                  <p className="text-2xs text-muted-fg">{entity.label} · {format} · sandbox passed</p>
                </div>
              </div>
              <Badge tone="info">{validRows.toLocaleString()} rows</Badge>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-2xs font-semibold text-muted-fg">
                <span>Commit progress</span><span className="tnum">100%</span>
              </div>
              <ProgressBar value={100} tone="success" />
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-xs font-medium text-warning">
            <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            If anything fails, the whole batch rolls back atomically — no partial corruption is left behind.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onConfirm}>
              <CircleCheck className="h-4 w-4" /> Confirm &amp; commit
            </Button>
            <Button variant="outline" onClick={onRollback}>
              <RotateCcw className="h-4 w-4" /> Rollback batch
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- main page */
export default function DataPorting() {
  const { role, company } = useApp()
  const { employees } = useCompanyData()
  const { push } = useToast()

  const isAdmin = role === 'provider_admin' || role === 'company_hr_admin'

  /* wizard / export modal state */
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [entityId, setEntityId] = useState('employee')
  const [format, setFormat] = useState<Format>('XLSX')

  const [exportOpen, setExportOpen] = useState(false)
  const [exportEntity, setExportEntity] = useState('employee')
  const [exportFormat, setExportFormat] = useState<Format>('CSV')
  const [exportScope, setExportScope] = useState('all')

  const [kindFilter, setKindFilter] = useState<'all' | JobKind>('all')

  /* derived job stats */
  const jobs = useMemo(
    () => (kindFilter === 'all' ? RECENT_JOBS : RECENT_JOBS.filter((j) => j.kind === kindFilter)),
    [kindFilter],
  )

  const donutData = useMemo(() => {
    const completed = RECENT_JOBS.filter((j) => j.status === 'Completed' || j.status === 'Partially completed').length
    const running = RECENT_JOBS.filter((j) => ['In-progress', 'Validating', 'Submitted'].includes(j.status)).length
    const failed = RECENT_JOBS.filter((j) => j.status === 'Failed').length
    const rolled = RECENT_JOBS.filter((j) => j.status === 'Rolled back').length
    return [
      { name: 'Completed', value: completed },
      { name: 'Running', value: running },
      { name: 'Failed', value: failed },
      { name: 'Rolled back', value: rolled },
    ]
  }, [])

  const totalRecords = useMemo(
    () => RECENT_JOBS.reduce((sum, j) => sum + j.records, 0),
    [],
  )

  const recentActors = useMemo(
    () => Array.from(new Set(RECENT_JOBS.map((j) => j.actor))),
    [],
  )

  const closeWizard = () => {
    setWizardOpen(false)
    setStep(0)
  }
  const confirmImport = () => {
    push({ title: 'Import committed · audit event written', tone: 'success' })
    closeWizard()
  }
  const rollbackImport = () => {
    push({ title: 'Batch rolled back atomically — tenant unchanged', tone: 'warning' })
    closeWizard()
  }
  const runExport = () => {
    const ent = ENTITIES.find((e) => e.id === exportEntity)?.label ?? 'data'
    push({ title: `Export queued · ${ent} as ${exportFormat}`, tone: 'info' })
    setExportOpen(false)
  }

  /* ---------- employee self-service view (non-admins) ---------- */
  if (!isAdmin) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Data & Portability"
          subtitle={`Your personal data export for ${company.name}.`}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Export my data</CardTitle>
              <Badge tone="info">Self-service</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-muted-fg">
                You can download a copy of your own records. Bulk import and tenant-wide
                exports are restricted to administrators.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { label: 'My profile & contact', icon: Users2 },
                  { label: 'My leave history', icon: Database },
                  { label: 'My attendance', icon: Clock3 },
                  { label: 'My documents', icon: FileText },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 px-3 py-2.5"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-fg">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-fg">{item.label}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => push({ title: `Preparing ${item.label.toLowerCase()}…`, tone: 'info' })}
                      >
                        <Download className="h-3.5 w-3.5" /> CSV
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Why so limited?</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm text-muted-fg">
              <p className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-fg" />
                Import/export of company data is an administrative action gated by role-based access.
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Your personal export is always available to you under data-portability rules.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  /* ---------- admin view ---------- */
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Import / Export"
        subtitle={`Bulk migrate, validate & port ${company.name}'s data — sandbox-first, rollback-safe.`}
        icon={<ArrowLeftRight className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Tooltip label="View job history">
              <IconButton variant="outline" aria-label="View job history" onClick={() => push({ title: 'Showing recent jobs', tone: 'neutral' })}>
                <History className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="New export">
              <IconButton variant="outline" aria-label="New export" onClick={() => setExportOpen(true)}>
                <Download className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
            <Tooltip label="New import">
              <IconButton variant="solid" aria-label="New import" onClick={() => { setStep(0); setWizardOpen(true) }}>
                <Plus className="h-[18px] w-[18px]" />
              </IconButton>
            </Tooltip>
          </div>
        }
      />

      {/* limits banner */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <LimitChip icon={<FileCode2 className="h-4 w-4" />} label="Formats" value="CSV·XLS·XLSX·JSON" />
        <LimitChip icon={<Database className="h-4 w-4" />} label="Max file size" value={`${MAX_MB} MB`} />
        <LimitChip icon={<Layers className="h-4 w-4" />} label="Per-batch limit" value={`${MAX_RECORDS.toLocaleString()}`} />
        <LimitChip icon={<Users2 className="h-4 w-4" />} label="Live workforce" value={`${employees.length} on file`} />
      </div>

      {/* dependency journey + outcome donut */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Import sequence</CardTitle>
            <Badge tone="neutral">Foundation → Transactional</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {LAYERS.map((layer, li) => {
                const items = ENTITIES.filter((e) => e.layer === layer)
                return (
                  <div key={layer} className="flex items-stretch gap-3">
                    <div className="w-44 shrink-0 rounded-xl border border-border bg-surface2/40 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge tone={LAYER_TONE[layer]} dot>{layer}</Badge>
                      </div>
                      <div className="space-y-2">
                        {items.map((e) => {
                          const Icon = e.icon
                          return (
                            <div key={e.id} className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 shadow-sm">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-fg">
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-fg">{e.label}</p>
                                <p className="text-2xs text-muted-fg tnum">{e.records.toLocaleString()}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {li < LAYERS.length - 1 && (
                      <div className="flex shrink-0 items-center text-muted-fg/60">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-2xs text-muted-fg">
              <ShieldCheck className="h-3 w-3 text-success" />
              Referential integrity is enforced — dependent entities import only after their foundations.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job outcomes</CardTitle>
            <Badge tone="info">{RECENT_JOBS.length} recent</Badge>
          </CardHeader>
          <CardBody>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={DONUT_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[d.name] }} />
                  <span className="text-muted-fg">{d.name}</span>
                  <span className="ml-auto font-bold tnum">{d.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-2xs text-muted-fg">
              {totalRecords.toLocaleString()} records moved across recent jobs.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* recent jobs table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Recent import / export jobs</CardTitle>
            <Badge tone="neutral">{jobs.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <AvatarStack names={recentActors} size="xs" className="hidden sm:flex" />
            <Segmented<'all' | JobKind>
              value={kindFilter}
              onChange={setKindFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'Import', label: 'Imports' },
                { value: 'Export', label: 'Exports' },
              ]}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {jobs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<History className="h-5 w-5" />}
                title="No jobs in this view"
                description="Switch the filter or start a new import to see jobs here."
              />
            </div>
          ) : (
            <Table>
              <thead>
                <Tr className="border-t-0 hover:bg-transparent">
                  <Th>Job</Th>
                  <Th>Entity</Th>
                  <Th>Format</Th>
                  <Th className="text-right">Records</Th>
                  <Th>Status</Th>
                  <Th>Actor</Th>
                  <Th className="text-right">When</Th>
                  <Th className="w-10" />
                </Tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <Tr key={j.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          j.kind === 'Import' ? 'bg-accent/12 text-accent' : 'bg-accent2/15 text-accent2',
                        )}>
                          {j.kind === 'Import' ? <Upload className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-fg">{j.file}</p>
                          <p className="text-2xs uppercase tracking-wide text-muted-fg">{j.kind} · {j.size}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-muted-fg">{j.entity}</Td>
                    <Td><FormatPill format={j.format} /></Td>
                    <Td className="text-right">
                      <span className="tnum font-semibold text-fg">{j.records.toLocaleString()}</span>
                      {j.failed > 0 && (
                        <span className="ml-1.5 text-2xs font-semibold text-danger tnum">−{j.failed}</span>
                      )}
                    </Td>
                    <Td><StatusPill status={j.status} /></Td>
                    <Td className="text-muted-fg">{j.actor}</Td>
                    <Td className="text-right tnum text-2xs text-muted-fg">{j.when}</Td>
                    <Td className="text-right">
                      {j.status === 'Completed' || j.status === 'Partially completed' ? (
                        <Tooltip label="Roll back this job">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Roll back ${j.file}`}
                            onClick={() => push({ title: `Rolled back ${j.file}`, tone: 'warning' })}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      ) : (
                        <Tooltip label="Download log">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Download log for ${j.file}`}
                            onClick={() => push({ title: `Downloading log · ${j.file}`, tone: 'info' })}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-fg">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Every import and export is sandbox-validated, rollback-safe, and written to the tenant-isolated audit trail.
      </p>

      {/* IMPORT WIZARD MODAL */}
      <Modal
        open={wizardOpen}
        onClose={closeWizard}
        title="Import data"
        description="Choose an entity, upload a file, validate in sandbox, then commit or roll back."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => (step === 0 ? closeWizard() : setStep(step - 1))}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < WIZARD_STEPS.length - 1 && (
              <Button onClick={() => setStep(step + 1)}>
                {step === 2 ? 'Proceed to commit' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </>
        }
      >
        <ImportWizard
          step={step}
          setStep={setStep}
          entityId={entityId}
          setEntityId={setEntityId}
          format={format}
          setFormat={setFormat}
          onConfirm={confirmImport}
          onRollback={rollbackImport}
        />
      </Modal>

      {/* EXPORT BUILDER MODAL */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Build an export"
        description="Pick an entity, a format, and the scope of records to export."
        footer={
          <>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={runExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Entity">
            <Select value={exportEntity} onChange={(e) => setExportEntity(e.target.value)}>
              {ENTITIES.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Format">
            <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as Format)}>
              {FORMATS.map((f) => (
                <option key={f.id} value={f.id}>{f.label} — {f.note}</option>
              ))}
            </Select>
          </Field>
          <Field label="Scope" hint="Row-level security is applied — only this company's data is exported.">
            <Select value={exportScope} onChange={(e) => setExportScope(e.target.value)}>
              <option value="all">All records</option>
              <option value="active">Active only</option>
              <option value="dept">By department</option>
              <option value="changed">Changed since last export</option>
            </Select>
          </Field>
          <div className="flex items-center gap-2 rounded-lg bg-info/10 px-3 py-2 text-xs font-medium text-info">
            <Database className="h-3.5 w-3.5 shrink-0" />
            Exports over {MAX_RECORDS.toLocaleString()} records are chunked automatically to stay within the per-batch limit.
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
            <Input value={`${exportEntity}_export.${exportFormat.toLowerCase()}`} readOnly aria-label="Output file name" />
            <Badge tone="neutral">{exportFormat}</Badge>
          </div>
        </div>
      </Modal>
    </div>
  )
}
