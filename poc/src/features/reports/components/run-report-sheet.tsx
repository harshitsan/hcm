import { useEffect, useMemo, useState } from 'react'
import {
  CalendarBlank,
  Clock,
  DownloadSimple,
  LockSimple,
  ShieldCheck,
} from 'phosphor-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import { ROLE_ACTORS } from '../data/governance'
import {
  DEPARTMENTS,
  type Company,
  type ReportDef,
} from '../data/report-catalog'
import {
  reportInsight,
  type InsightChart,
  type ReportInsight,
} from '../data/report-insights'
import {
  EFFECTIVE_CUTOVER,
  reportRows,
  SELF_EMPLOYEE,
  type ReportRow,
} from '../data/report-rows'
import {
  ChartCard,
  ColumnChart,
  DonutChart,
  HBarChart,
  StackedBarChart,
  TrendLineChart,
} from './charts'

interface RunReportSheetProps {
  report: ReportDef | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Companies the viewer is authorized for (RPT-12/17/18/20). */
  companies: Company[]
  /** Employee (User) self-service run — own records only (RPT-15). */
  selfOnly?: boolean
  /** Cross-company viewers can segment results by company (RPT-17/18). */
  allowCompanyGrouping?: boolean
  onSchedule?: (reportName: string) => void
}

function renderChart(chart: InsightChart) {
  switch (chart.kind) {
    case 'hbar':
      return (
        <ChartCard title={chart.title} subtitle={chart.subtitle}>
          <HBarChart
            data={chart.data}
            suffix={chart.suffix}
            monochrome={chart.monochrome}
          />
        </ChartCard>
      )
    case 'column':
      return (
        <ChartCard title={chart.title} subtitle={chart.subtitle}>
          <ColumnChart data={chart.data} suffix={chart.suffix} />
        </ChartCard>
      )
    case 'donut':
      return (
        <ChartCard title={chart.title} subtitle={chart.subtitle}>
          <DonutChart
            data={chart.data}
            centerLabel={chart.centerLabel}
            centerValue={chart.centerValue}
          />
        </ChartCard>
      )
    case 'trend':
      return (
        <ChartCard title={chart.title} subtitle={chart.subtitle}>
          <TrendLineChart points={chart.points} suffix={chart.suffix} />
        </ChartCard>
      )
    case 'stacked':
      return (
        <ChartCard title={chart.title} subtitle={chart.subtitle}>
          <StackedBarChart
            series={chart.series}
            categories={chart.categories}
          />
        </ChartCard>
      )
  }
}

function InsightSection({ insight }: { insight: ReportInsight }) {
  return (
    <>
      {/* Headline KPIs */}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {insight.kpis.map((k) => (
          <div
            key={k.label}
            className='rounded-[8px] border border-gray-200 bg-white px-4 py-3'
          >
            <p className='text-paragraph-sm font-medium text-black'>
              {k.label}
            </p>
            <p className='py-1 text-2xl font-medium text-black'>{k.value}</p>
            <p className='text-neutral-1000 text-xs'>{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        {insight.charts.map((chart, i) => (
          <div
            key={chart.title}
            className={
              insight.charts.length % 2 === 1 &&
              i === insight.charts.length - 1
                ? 'lg:col-span-2'
                : ''
            }
          >
            {renderChart(chart)}
          </div>
        ))}
      </div>

      {/* Domain data table */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <p className='text-neutral-1600 mb-2 text-sm font-semibold'>
          {insight.table.title}
        </p>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                {insight.table.columns.map((c) => (
                  <th key={c} className='px-2 py-2 font-medium whitespace-nowrap'>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {insight.table.rows.map((row) => (
                <tr key={row[0]} className='border-b last:border-0'>
                  {row.map((cell, ci) => (
                    <td
                      key={`${row[0]}-${insight.table.columns[ci]}`}
                      className={
                        ci === 0
                          ? 'px-2 py-2 font-medium whitespace-nowrap'
                          : 'px-2 py-2'
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/**
 * Parameterised run of a standard report (RPT-01): a real report view with
 * headline KPIs, charts and a domain data table for the flagship reports,
 * plus period + department parameters, as-of (bitemporal) mode (RPT-19),
 * company scoping, optional group-by-company segmentation and export.
 * Comp-dark reports never render pay figures; consolidated portfolio/group
 * runs are audited.
 */
export function RunReportSheet({
  report,
  open,
  onOpenChange,
  companies,
  selfOnly = false,
  allowCompanyGrouping = false,
  onSchedule,
}: RunReportSheetProps) {
  const { role, hasRole } = useRole()
  const [dept, setDept] = useState('all')
  const [period, setPeriod] = useState('this-quarter')
  const [asOf, setAsOf] = useState('')
  const [byCompany, setByCompany] = useState(false)

  const isEmployeeRole = hasRole('Employee (User)', 'Employee (Non-User)')
  // Comp-dark reports are locked outright for non-admin roles (RPT-38).
  const compLocked = Boolean(report?.comp) && isEmployeeRole

  useEffect(() => {
    if (!open) return
    setDept('all')
    setPeriod('this-quarter')
    setAsOf('')
    setByCompany(false)
  }, [open])

  // Consolidated portfolio/group runs are recorded in the audit trail
  // (RPT-17/18) — once per run sheet open.
  useEffect(() => {
    if (!open || !report?.consolidated) return
    publishAuditEvent({
      module: 'Reports & Analytics',
      action: 'Consolidated report run',
      actor: ROLE_ACTORS[role],
      actorRole: role,
      entityType: 'Company',
      actionType: 'create',
      recordId: report.id,
      recordName: report.name,
      changes: [
        {
          field: 'Row-level security scope',
          previousValue: null,
          newValue: companies.join(', ') || 'none',
        },
      ],
    })
    // Re-publish only when a different consolidated report is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report?.id])

  const asOfPast = asOf !== '' && asOf < EFFECTIVE_CUTOVER

  const rows = useMemo(() => {
    if (!report || compLocked) return []
    return reportRows(report).filter(
      (r) =>
        companies.includes(r.company) &&
        (dept === 'all' || r.department === dept) &&
        (!selfOnly || r.employee === SELF_EMPLOYEE)
    )
  }, [report, companies, dept, selfOnly, compLocked])

  const grouped = useMemo(() => {
    if (!byCompany) return null
    const map = new Map<Company, ReportRow[]>()
    rows.forEach((r) => map.set(r.company, [...(map.get(r.company) ?? []), r]))
    return [...map.entries()]
  }, [rows, byCompany])

  // Full report view — KPIs, charts, domain table (RPT-01). Self-service
  // runs stay scoped to own records, and comp-dark reports never chart pay.
  const insight = useMemo(() => {
    if (!report || selfOnly || compLocked || report.comp) return null
    return reportInsight(report.id, companies)
  }, [report, companies, selfOnly, compLocked])

  if (!report) return null

  const value = (r: ReportRow) => (asOfPast ? r.priorValue : r.value)

  const renderRows = (list: ReportRow[]) =>
    list.map((r) => (
      <tr key={r.id} className='border-b last:border-0'>
        <td className='py-2 pr-3 font-medium'>{r.employee}</td>
        <td className='text-neutral-1000 px-2 text-xs'>
          {r.company} · {r.department}
        </td>
        <td className='max-w-[220px] truncate px-2'>{r.detail}</td>
        <td className='px-2 font-semibold'>{value(r)}</td>
        <td className='text-neutral-1000 px-2 text-xs'>{r.date}</td>
      </tr>
    ))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[880px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {report.name}
          </SheetTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            {report.description}{' '}
            {selfOnly
              ? '· scoped to your own records'
              : `· scope: ${companies.length > 0 ? companies.join(', ') : 'none (no active grants)'}`}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
          {/* Comp-dark lock for non-admin roles (RPT-38) */}
          {compLocked ? (
            <div className='flex flex-col items-center gap-2 rounded-[8px] border border-gray-200 bg-white px-6 py-12 text-center'>
              <LockSimple size={28} weight='bold' className='text-neutral-1000' />
              <p className='text-neutral-1600 text-sm font-semibold'>
                Compensation data is restricted
              </p>
              <p className='text-neutral-1000 max-w-[420px] text-sm'>
                This report contains compensation/payroll data and is
                available to HR, Admin and Finance roles only. Your role
                &ldquo;{role}&rdquo; cannot run it.
              </p>
            </div>
          ) : (
            <>
              {/* Comp-dark notice for authorised roles — no pay figures */}
              {report.comp && (
                <div className='bg-orange-200 text-orange-1400 flex items-start gap-2 rounded-[6px] px-3 py-2 text-xs'>
                  <LockSimple size={14} className='mt-0.5 shrink-0' />
                  Comp-dark: compensation and payroll figures are limited to
                  HR / Admin / Finance and are not rendered in this
                  environment — value columns show &ldquo;Restricted&rdquo;
                  instead of amounts.
                </div>
              )}

              {/* Row-level security note on consolidated runs (RPT-17/18) */}
              {report.consolidated && (
                <div className='bg-blue-150 text-blue-1400 flex items-start gap-2 rounded-[6px] px-3 py-2 text-xs'>
                  <ShieldCheck size={14} className='mt-0.5 shrink-0' />
                  Row-level security applies — you see only companies within
                  your portfolio/group ({companies.join(', ') || 'none'}).
                  This consolidated run has been recorded in the audit trail.
                </div>
              )}

              {/* Parameters (RPT-01) */}
              <div className='flex flex-wrap items-end gap-3'>
                <div className='space-y-1'>
                  <Label className='text-xs'>Period</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='this-month'>This month</SelectItem>
                      <SelectItem value='this-quarter'>This quarter</SelectItem>
                      <SelectItem value='ytd'>Year to date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!selfOnly && (
                  <div className='space-y-1'>
                    <Label className='text-xs'>Department</Label>
                    <Select value={dept} onValueChange={setDept}>
                      <SelectTrigger
                        variant='secondary'
                        className='h-7 w-[170px]'
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All departments</SelectItem>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className='space-y-1'>
                  <Label className='text-xs'>As-of date (point in time)</Label>
                  <Input
                    type='date'
                    value={asOf}
                    onChange={(e) => setAsOf(e.target.value)}
                    className='h-7 w-[160px]'
                  />
                </div>
                {allowCompanyGrouping && !selfOnly && (
                  <label className='flex h-7 items-center gap-2 text-sm'>
                    <Switch checked={byCompany} onCheckedChange={setByCompany} />
                    Group by company
                  </label>
                )}
              </div>

              {asOfPast && (
                <div className='bg-blue-150 text-blue-1400 flex items-start gap-2 rounded-[6px] px-3 py-2 text-xs'>
                  <CalendarBlank size={14} className='mt-0.5 shrink-0' />
                  Showing effective-dated values as they were in effect on{' '}
                  {asOf} (before the {EFFECTIVE_CUTOVER} change) — not current
                  values.
                </div>
              )}

              {/* KPIs + charts + domain table (RPT-01) */}
              {insight && <InsightSection insight={insight} />}

              {/* Record preview — re-runs reflect current in-memory data */}
              <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
                {insight && (
                  <p className='text-neutral-1600 mb-2 px-1 text-sm font-semibold'>
                    Underlying records{' '}
                    <span className='text-neutral-1000 text-xs font-normal'>
                      sample rows behind this report · as-of aware
                    </span>
                  </p>
                )}
                {rows.length === 0 ? (
                  <p className='text-neutral-1000 py-6 text-center text-sm'>
                    No in-scope records for the selected parameters.
                  </p>
                ) : grouped ? (
                  <div className='space-y-4'>
                    {grouped.map(([company, list]) => (
                      <div key={company}>
                        <p className='text-neutral-1600 mb-1 text-xs font-semibold'>
                          {company} · {list.length} record(s)
                        </p>
                        <table className='w-full text-sm'>
                          <tbody>{renderRows(list)}</tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-neutral-1000 border-b text-left text-xs'>
                        <th className='py-2 pr-3 font-medium'>Subject</th>
                        <th className='px-2 font-medium'>Company · Dept</th>
                        <th className='px-2 font-medium'>Detail</th>
                        <th className='px-2 font-medium'>
                          {asOfPast ? `Value as of ${asOf}` : 'Current value'}
                        </th>
                        <th className='px-2 font-medium'>Date</th>
                      </tr>
                    </thead>
                    <tbody>{renderRows(rows)}</tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>

        <div className='border-gray-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
          <span className='text-neutral-1000 text-xs'>
            {compLocked
              ? 'Access denied for your role'
              : `${rows.length} record(s) · ${period.replace('-', ' ')}`}
          </span>
          <div className='flex items-center gap-2'>
            {onSchedule && !compLocked && (
              <Button
                variant='outline'
                className='h-7 gap-1'
                onClick={() => onSchedule(report.name)}
              >
                <Clock size={14} weight='bold' />
                Schedule delivery
              </Button>
            )}
            <Button
              className='h-7 gap-1'
              disabled={compLocked}
              onClick={() =>
                toast.success(
                  `${report.name} exported (XLSX) for sharing — ${rows.length} in-scope record(s)${report.comp ? ' · compensation values remain restricted' : ''}`
                )
              }
            >
              <DownloadSimple size={14} weight='bold' />
              Export
            </Button>
          </div>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
