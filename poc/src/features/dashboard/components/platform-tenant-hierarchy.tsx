import { useState } from 'react'
import { type ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Layers,
  Network,
} from 'lucide-react'
import {
  companyMrrUsd,
  platformChartColors,
  platformChartFont,
  platformPortfolios,
  tenantGrowthByQuarter,
  type PlatformCompany,
  type TenantNodeStatus,
} from '../data/platform-metrics'
import { formatUsd } from '../hooks/use-platform-metrics'
import { LegendDot, PlatformPanel } from './platform-panel'

const STATUS_BADGE: Record<TenantNodeStatus, string> = {
  Active: 'bg-green-1200 text-green-1300',
  Suspended: 'bg-red-100 text-red-1000',
  Onboarding: 'bg-blue-100 text-blue-800',
}

function StatusBadge({ status }: { status: TenantNodeStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}
    >
      {status}
    </span>
  )
}

function seatTotal(companies: PlatformCompany[]): number {
  return companies.reduce((n, c) => n + c.seats, 0)
}

function CompanyRow({ company, depth }: { company: PlatformCompany; depth: number }) {
  return (
    <li
      className='flex items-center gap-2 border-b border-gray-100 py-2 last:border-0'
      style={{ paddingLeft: `${depth * 24}px` }}
    >
      <Building2 aria-hidden='true' className='text-neutral-800 size-4 shrink-0' />
      <span className='text-paragraph-sm text-neutral-1600 flex-1 truncate'>
        {company.name}
      </span>
      <span className='text-paragraph-sm text-neutral-1000 hidden shrink-0 sm:inline'>
        {company.plan}
      </span>
      <span className='text-paragraph-sm text-neutral-1200 w-20 shrink-0 text-right tabular-nums'>
        {company.seats.toLocaleString('en-US')} seats
      </span>
      <span className='text-paragraph-sm text-neutral-1200 hidden w-20 shrink-0 text-right tabular-nums md:inline'>
        {formatUsd(companyMrrUsd(company))}
      </span>
      <StatusBadge status={company.status} />
    </li>
  )
}

function ExpandableNode({
  icon: Icon,
  label,
  meta,
  seats,
  status,
  depth,
  defaultOpen,
  children,
}: {
  icon: typeof Layers
  label: string
  meta?: string
  seats: number
  status: TenantNodeStatus
  depth: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <li className='border-b border-gray-100 last:border-0'>
      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className='hover:bg-neutral-100 flex w-full items-center gap-2 rounded py-2 text-left'
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        <Chevron aria-hidden='true' className='text-neutral-800 size-4 shrink-0' />
        <Icon aria-hidden='true' className='text-blue-800 size-4 shrink-0' />
        <span className='text-paragraph-sm text-neutral-1600 flex-1 truncate font-medium'>
          {label}
          {meta && (
            <span className='text-neutral-1000 ml-2 font-normal'>{meta}</span>
          )}
        </span>
        <span className='text-paragraph-sm text-neutral-1200 w-24 shrink-0 text-right tabular-nums'>
          {seats.toLocaleString('en-US')} seats
        </span>
        <StatusBadge status={status} />
      </button>
      {open && <ul className='list-none'>{children}</ul>}
    </li>
  )
}

/** Expandable portfolio → group companies → companies hierarchy panel. */
export function TenantHierarchyPanel() {
  return (
    <PlatformPanel
      title='Tenant hierarchy'
      subtitle='Portfolio → group companies → companies, with seats, plan and MRR per node'
      className='min-h-0'
    >
      <ul className='list-none'>
        {platformPortfolios.map((pf) => {
          const pfCompanies = [
            ...pf.groups.flatMap((g) => g.companies),
            ...pf.directCompanies,
          ]
          return (
            <ExpandableNode
              key={pf.id}
              icon={Layers}
              label={pf.name}
              meta={`Managed by ${pf.manager}`}
              seats={seatTotal(pfCompanies)}
              status={pf.status}
              depth={0}
            >
              {pf.groups.map((g) => (
                <ExpandableNode
                  key={g.id}
                  icon={Network}
                  label={g.name}
                  meta={`${g.companies.length} companies`}
                  seats={seatTotal(g.companies)}
                  status={g.status}
                  depth={1}
                >
                  {g.companies.map((c) => (
                    <CompanyRow key={c.id} company={c} depth={2} />
                  ))}
                </ExpandableNode>
              ))}
              {pf.directCompanies.map((c) => (
                <CompanyRow key={c.id} company={c} depth={1} />
              ))}
            </ExpandableNode>
          )
        })}
      </ul>
    </PlatformPanel>
  )
}

/** Tenants onboarded per quarter (bars) + cumulative tenants (line). */
export function TenantGrowthChart() {
  const latest = tenantGrowthByQuarter[tenantGrowthByQuarter.length - 1]

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      fontFamily: platformChartFont,
      zoom: { enabled: false },
    },
    colors: [platformChartColors.teal, platformChartColors.blue],
    stroke: { width: [0, 3], curve: 'smooth' },
    plotOptions: { bar: { borderRadius: 3, columnWidth: '45%' } },
    dataLabels: { enabled: false },
    grid: {
      borderColor: platformChartColors.grid,
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    legend: { show: false },
    labels: tenantGrowthByQuarter.map((q) => q.label),
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: platformChartColors.axis,
          fontFamily: platformChartFont,
        },
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        formatter: (v: number) => String(Math.round(v)),
        style: {
          colors: platformChartColors.axis,
          fontFamily: platformChartFont,
        },
      },
    },
    tooltip: { shared: true, intersect: false },
  }

  return (
    <PlatformPanel
      title='Tenant growth'
      subtitle={`Companies onboarded per quarter · ${latest.cumulative} tenants live as of Q3 '26`}
      action={
        <div className='flex items-center gap-3'>
          <LegendDot color={platformChartColors.teal} label='Onboarded' />
          <LegendDot color={platformChartColors.blue} label='Cumulative' />
        </div>
      }
    >
      <ReactApexChart
        options={options}
        series={[
          {
            name: 'Onboarded',
            type: 'column',
            data: tenantGrowthByQuarter.map((q) => q.onboarded),
          },
          {
            name: 'Cumulative',
            type: 'line',
            data: tenantGrowthByQuarter.map((q) => q.cumulative),
          },
        ]}
        type='line'
        height={260}
      />
    </PlatformPanel>
  )
}
