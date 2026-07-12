import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LockSimple, MagnifyingGlass, Play, UsersThree } from 'phosphor-react'
import { RoleGate, useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  REPORT_CATEGORIES,
  type Company,
  type ReportDef,
} from '../data/report-catalog'
import { RunReportSheet } from './run-report-sheet'

interface CatalogTabProps {
  reports: ReportDef[]
  /** Companies the viewer may report over (RPT-12/17/18). */
  companies: Company[]
  /** Portfolio/Group admins may segment results by company (RPT-17/18). */
  allowCompanyGrouping: boolean
  onSchedule: (reportName: string) => void
}

/**
 * Standard report library (RPT-01) browsable by category (RPT-26). Reports
 * disabled in the tenant catalog config are hidden (RPT-22); each report
 * runs with parameters, scoping and export via the run sheet.
 */
export function CatalogTab({
  reports,
  companies,
  allowCompanyGrouping,
  onSchedule,
}: CatalogTabProps) {
  const { hasRole } = useRole()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [running, setRunning] = useState<ReportDef | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Consolidated portfolio/group reports are visible only to Portfolio
  // Admin, Group Company Admin and Platform Admin (RPT-17/18).
  const canConsolidated = hasRole(
    'Platform Admin',
    'Portfolio Admin',
    'Group Company Admin'
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter(
      (r) =>
        r.enabled &&
        (!r.consolidated || canConsolidated) &&
        (category === 'all' || r.category === category) &&
        (q === '' ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q))
    )
  }, [reports, category, search, canConsolidated])

  const grouped = useMemo(
    () =>
      REPORT_CATEGORIES.map((cat) => ({
        category: cat,
        items: visible.filter((r) => r.category === cat),
      })).filter((g) => g.items.length > 0),
    [visible]
  )

  const run = (report: ReportDef) => {
    setRunning(report)
    setSheetOpen(true)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Standard Report Catalog ({visible.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            scope:{' '}
            {companies.length > 0
              ? companies.join(', ')
              : 'none (no active grants)'}
          </span>
        </h2>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <MagnifyingGlass
              size={14}
              className='text-neutral-1000 absolute top-1/2 left-2 -translate-y-1/2'
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search reports'
              className='h-7 w-[200px] pl-7'
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {REPORT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* RPT-44 lives on its own screen */}
          <RoleGate roles={['Company Admin']}>
            <Button asChild variant='outline' className='h-7 gap-1'>
              <Link to='/reports/current-status'>
                <UsersThree size={14} weight='bold' />
                Employee Current Status
              </Link>
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className='space-y-4'>
        {grouped.map((group) => (
          <div
            key={group.category}
            className='rounded-[8px] border border-gray-200 bg-white p-4'
          >
            <div className='mb-2 flex items-center gap-2'>
              <h3 className='text-neutral-1600 text-sm font-semibold'>
                {group.category}
              </h3>
              <Badge variant='open'>{group.items.length}</Badge>
              {group.category === 'Consolidated (Portfolio / Group)' && (
                <span className='text-neutral-1000 text-xs'>
                  Row-level security — you see only companies within your
                  portfolio/group; every run is recorded in the audit trail.
                </span>
              )}
            </div>
            <div className='grid grid-cols-1 gap-2 lg:grid-cols-2'>
              {group.items.map((report) => (
                <div
                  key={report.id}
                  className='flex items-center justify-between gap-3 rounded-[6px] border border-gray-100 px-3 py-2'
                >
                  <div className='min-w-0'>
                    <p className='text-neutral-1600 flex items-center gap-1 truncate text-sm font-medium'>
                      {report.name}
                      {report.comp && (
                        <span className='text-neutral-1000 inline-flex shrink-0 items-center gap-0.5 text-xs font-normal'>
                          <LockSimple size={12} weight='bold' />
                          comp-dark
                        </span>
                      )}
                    </p>
                    <p className='text-neutral-1000 truncate text-xs'>
                      {report.description}
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    className='h-7 shrink-0 gap-1'
                    onClick={() => run(report)}
                  >
                    <Play size={12} weight='fill' />
                    Run
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className='text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-6 text-center text-sm'>
            No reports match your search within the tenant catalog.
          </p>
        )}
      </div>

      <RunReportSheet
        report={running}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setRunning(null)
        }}
        companies={companies}
        allowCompanyGrouping={allowCompanyGrouping}
        onSchedule={onSchedule}
      />
    </div>
  )
}
