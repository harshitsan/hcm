import { useMemo, useState } from 'react'
import { ChartBar, MagnifyingGlassPlus } from 'phosphor-react'
import { type Role } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  headcountSlices,
  selfMetrics,
  type DashboardLayout,
  type HeadcountSlice,
} from '../data/dashboards'
import { DEPARTMENTS, type Company } from '../data/report-catalog'
import { SELF_EMPLOYEE } from '../data/report-rows'

interface DashboardsTabProps {
  role: Role
  /** Default layout applied for the role per tenant config (RPT-05, RPT-22). */
  layout: DashboardLayout
  companies: Company[]
}

interface Drill {
  title: string
  rows: string[]
}

/**
 * Interactive role-based dashboard (RPT-04, RPT-05): KPIs + charts computed
 * over the viewer's authorized companies, filterable, with drill-down into
 * the underlying slices. Employees get a self-scoped variant (RPT-14) and
 * portfolio/group admins a consolidated view with per-company drill
 * (RPT-17, RPT-18).
 */
export function DashboardsTab({ role, layout, companies }: DashboardsTabProps) {
  const [company, setCompany] = useState('all')
  const [dept, setDept] = useState('all')
  const [drill, setDrill] = useState<Drill | null>(null)

  const isEmployee = role === 'Employee (User)'
  const consolidated = companies.length > 1

  const slices = useMemo(
    () =>
      headcountSlices.filter(
        (s) =>
          companies.includes(s.company) &&
          (company === 'all' || s.company === company) &&
          (dept === 'all' || s.department === dept)
      ),
    [companies, company, dept]
  )

  const total = (fn: (s: HeadcountSlice) => number) =>
    slices.reduce((sum, s) => sum + fn(s), 0)

  const headcount = total((s) => s.headcount)
  const onLeave = total((s) => s.onLeaveToday)
  const openPositions = total((s) => s.openPositions)
  const avgAttrition =
    slices.length === 0
      ? 0
      : slices.reduce((sum, s) => sum + s.attritionPct, 0) / slices.length

  const drillSlices = (title: string, pick: (s: HeadcountSlice) => string) =>
    setDrill({ title, rows: slices.map(pick) })

  const deptBars = useMemo(() => {
    const map = new Map<string, number>()
    slices.forEach((s) =>
      map.set(s.department, (map.get(s.department) ?? 0) + s.headcount)
    )
    const max = Math.max(1, ...map.values())
    return [...map.entries()].map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / max) * 100),
    }))
  }, [slices])

  const companyBars = useMemo(() => {
    const map = new Map<Company, number>()
    slices.forEach((s) =>
      map.set(s.company, (map.get(s.company) ?? 0) + s.headcount)
    )
    const max = Math.max(1, ...map.values())
    return [...map.entries()].map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / max) * 100),
    }))
  }, [slices])

  if (isEmployee) {
    // RPT-14 — self-service dashboard scoped strictly to own records.
    return (
      <div className='w-full'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My Dashboard
            <span className='text-neutral-1000 ml-2 text-xs'>
              default layout “{layout}” · scoped to {SELF_EMPLOYEE}'s records
              only
            </span>
          </h2>
          <Badge variant='open'>Own data only</Badge>
        </div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4'>
          {selfMetrics.map((m) => (
            <div
              key={m.id}
              className='rounded-[8px] border border-gray-200 bg-white p-4'
            >
              <p className='text-paragraph-sm font-medium text-black'>
                {m.label}
              </p>
              <p className='py-1 text-2xl font-medium text-black'>{m.value}</p>
              <p className='text-neutral-1000 text-xs'>{m.hint}</p>
              <Button
                variant='outline'
                className='mt-2 h-7 gap-1'
                onClick={() => setDrill({ title: m.label, rows: m.drill })}
              >
                <MagnifyingGlassPlus size={12} weight='bold' />
                Drill down
              </Button>
            </div>
          ))}
        </div>
        <p className='text-neutral-1000 mt-3 text-xs'>
          Other employees' data and company-wide aggregates are outside your
          access scope and never contribute to these metrics.
        </p>
        <DrillDialog drill={drill} onClose={() => setDrill(null)} />
      </div>
    )
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          {consolidated ? 'Consolidated Dashboard' : 'Company Dashboard'}
          <span className='text-neutral-1000 ml-2 text-xs'>
            default layout “{layout}” for {role} · {companies.length} authorized
            company(ies)
          </span>
        </h2>
        <div className='flex items-center gap-2'>
          {consolidated && (
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All authorized companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
      </div>

      {/* KPI cards with drill-down (RPT-04) */}
      <div className='mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <KpiCard
          label='Headcount'
          value={headcount.toLocaleString('en-US')}
          onDrill={() =>
            drillSlices(
              'Headcount by unit',
              (s) => `${s.company} · ${s.department} — ${s.headcount} employees`
            )
          }
        />
        <KpiCard
          label='On leave today'
          value={String(onLeave)}
          onDrill={() =>
            drillSlices(
              'On leave today by unit',
              (s) =>
                `${s.company} · ${s.department} — ${s.onLeaveToday} on leave`
            )
          }
        />
        <KpiCard
          label='Avg attrition'
          value={`${avgAttrition.toFixed(1)}%`}
          onDrill={() =>
            drillSlices(
              'Attrition by unit',
              (s) =>
                `${s.company} · ${s.department} — ${s.attritionPct}% attrition`
            )
          }
        />
        <KpiCard
          label='Open positions'
          value={String(openPositions)}
          onDrill={() =>
            drillSlices(
              'Open positions by unit',
              (s) => `${s.company} · ${s.department} — ${s.openPositions} open`
            )
          }
        />
      </div>

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <BarPanel
          title='Headcount by department'
          bars={deptBars}
          onBarClick={(label) => setDept(label)}
        />
        {consolidated ? (
          <BarPanel
            title='Headcount by company (drill to a company)'
            bars={companyBars}
            onBarClick={(label) => setCompany(label)}
          />
        ) : (
          <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
            <p className='text-neutral-1600 mb-2 text-sm font-semibold'>
              Attrition by department
            </p>
            <ul className='space-y-2 text-sm'>
              {slices.map((s) => (
                <li key={s.id} className='flex justify-between'>
                  <span>{s.department}</span>
                  <span className='font-medium'>{s.attritionPct}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DrillDialog drill={drill} onClose={() => setDrill(null)} />
    </div>
  )
}

function KpiCard({
  label,
  value,
  onDrill,
}: {
  label: string
  value: string
  onDrill: () => void
}) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white px-4 py-3'>
      <p className='text-paragraph-sm font-medium text-black'>{label}</p>
      <p className='py-1 text-3xl font-medium text-black'>{value}</p>
      <Button variant='outline' className='h-6 gap-1 text-xs' onClick={onDrill}>
        <MagnifyingGlassPlus size={12} weight='bold' />
        Drill down
      </Button>
    </div>
  )
}

function BarPanel({
  title,
  bars,
  onBarClick,
}: {
  title: string
  bars: { label: string; value: number; pct: number }[]
  onBarClick: (label: string) => void
}) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <p className='text-neutral-1600 mb-3 flex items-center gap-1 text-sm font-semibold'>
        <ChartBar size={14} weight='bold' />
        {title}
      </p>
      <div className='space-y-2'>
        {bars.map((b) => (
          <button
            key={b.label}
            type='button'
            onClick={() => onBarClick(b.label)}
            className='block w-full text-left'
          >
            <div className='mb-0.5 flex justify-between text-xs'>
              <span>{b.label}</span>
              <span className='font-medium'>{b.value}</span>
            </div>
            <div className='h-2 w-full rounded bg-gray-100'>
              <div
                className='bg-blue-1400 h-2 rounded'
                style={{ width: `${b.pct}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function DrillDialog({
  drill,
  onClose,
}: {
  drill: Drill | null
  onClose: () => void
}) {
  return (
    <Dialog open={drill !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{drill?.title}</DialogTitle>
        </DialogHeader>
        <ul className='space-y-2 text-sm'>
          {drill?.rows.map((row) => (
            <li key={row} className='border-b pb-2 last:border-0'>
              {row}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
