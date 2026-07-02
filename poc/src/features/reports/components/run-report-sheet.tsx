import { useEffect, useMemo, useState } from 'react'
import { CalendarBlank, Clock, DownloadSimple } from 'phosphor-react'
import { toast } from 'sonner'
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
import {
  DEPARTMENTS,
  type Company,
  type ReportDef,
} from '../data/report-catalog'
import {
  categoryRows,
  EFFECTIVE_CUTOVER,
  SELF_EMPLOYEE,
  type ReportRow,
} from '../data/report-rows'

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

/**
 * Parameterised run of a standard report (RPT-01): period + department
 * parameters, as-of (bitemporal) mode (RPT-19), company scoping, optional
 * group-by-company segmentation and export.
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
  const [dept, setDept] = useState('all')
  const [period, setPeriod] = useState('this-quarter')
  const [asOf, setAsOf] = useState('')
  const [byCompany, setByCompany] = useState(false)

  useEffect(() => {
    if (!open) return
    setDept('all')
    setPeriod('this-quarter')
    setAsOf('')
    setByCompany(false)
  }, [open])

  const asOfPast = asOf !== '' && asOf < EFFECTIVE_CUTOVER

  const rows = useMemo(() => {
    if (!report) return []
    return categoryRows[report.category].filter(
      (r) =>
        companies.includes(r.company) &&
        (dept === 'all' || r.department === dept) &&
        (!selfOnly || r.employee === SELF_EMPLOYEE)
    )
  }, [report, companies, dept, selfOnly])

  const grouped = useMemo(() => {
    if (!byCompany) return null
    const map = new Map<Company, ReportRow[]>()
    rows.forEach((r) => map.set(r.company, [...(map.get(r.company) ?? []), r]))
    return [...map.entries()]
  }, [rows, byCompany])

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
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[720px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            {report.name}
          </SheetTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            {report.description}{' '}
            {selfOnly
              ? '· scoped to your own records'
              : `· scope: ${companies.join(', ')}`}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
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
                  <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
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
              Showing effective-dated values as they were in effect on {asOf}
              (before the {EFFECTIVE_CUTOVER} change) — not current values.
            </div>
          )}

          {/* Live preview — re-runs reflect current in-memory data (RPT-01) */}
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
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
        </div>

        <div className='border-grey-200 flex items-center justify-between gap-3 border-t px-5 py-4'>
          <span className='text-neutral-1000 text-xs'>
            {rows.length} record(s) · {period.replace('-', ' ')}
          </span>
          <div className='flex items-center gap-2'>
            {onSchedule && (
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
              onClick={() =>
                toast.success(
                  `${report.name} exported (XLSX) for sharing — ${rows.length} in-scope record(s)`
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
