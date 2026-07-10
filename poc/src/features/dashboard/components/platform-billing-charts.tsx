import { type ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import {
  mrrTrend,
  PLAN_COLORS,
  PLAN_SEAT_PRICE_USD,
  platformChartColors,
  platformChartFont,
  platformInvoices,
  type InvoiceStatus,
} from '../data/platform-metrics'
import {
  formatUsd,
  usePlatformMetrics,
} from '../hooks/use-platform-metrics'
import { LegendDot, PlatformPanel } from './platform-panel'

const baseGrid: ApexOptions['grid'] = {
  borderColor: platformChartColors.grid,
  strokeDashArray: 4,
  padding: { left: 8, right: 8 },
}

const axisLabelStyle = {
  style: { colors: platformChartColors.axis, fontFamily: platformChartFont },
}

/** Monthly recurring revenue over the trailing 12 months (up to Jul 2026). */
export function MrrTrendChart() {
  const latest = mrrTrend[mrrTrend.length - 1]
  const first = mrrTrend[0]
  const growthPct = Math.round(
    ((latest.mrrUsd - first.mrrUsd) / first.mrrUsd) * 100
  )

  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: platformChartFont,
      zoom: { enabled: false },
    },
    colors: [platformChartColors.blue],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.25, opacityTo: 0.02, shadeIntensity: 1 },
    },
    grid: baseGrid,
    legend: { show: false },
    xaxis: {
      categories: mrrTrend.map((p) => p.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: axisLabelStyle,
    },
    yaxis: {
      labels: {
        formatter: (v: number) => `$${Math.round(v / 1000)}k`,
        ...axisLabelStyle,
      },
    },
    tooltip: { y: { formatter: (v: number) => formatUsd(v) } },
  }

  return (
    <PlatformPanel
      title='Monthly recurring revenue'
      subtitle={`Aug 2025 – Jul 2026 · currently ${formatUsd(latest.mrrUsd)}/mo (+${growthPct}% over 12 months)`}
      action={<LegendDot color={platformChartColors.blue} label='MRR (USD)' />}
    >
      <ReactApexChart
        options={options}
        series={[{ name: 'MRR', data: mrrTrend.map((p) => p.mrrUsd) }]}
        type='area'
        height={280}
      />
    </PlatformPanel>
  )
}

/** MRR rolled up per group company / standalone tenant. */
export function RevenueByTenantChart() {
  const { revenueByTenant, revenueByPortfolio } = usePlatformMetrics()
  const rows = revenueByTenant.filter((r) => r.mrrUsd > 0)

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: platformChartFont,
    },
    colors: [platformChartColors.blue],
    plotOptions: {
      bar: { borderRadius: 4, horizontal: true, barHeight: '55%' },
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => formatUsd(Number(v)),
      style: { colors: ['#fff'], fontFamily: platformChartFont },
    },
    grid: baseGrid,
    xaxis: {
      categories: rows.map((r) => r.tenant),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        formatter: (v: string) => `$${Math.round(Number(v) / 1000)}k`,
        ...axisLabelStyle,
      },
    },
    yaxis: { labels: axisLabelStyle },
    tooltip: {
      y: {
        formatter: (v: number, opts?: { dataPointIndex?: number }) => {
          const row = rows[opts?.dataPointIndex ?? -1]
          return row ? `${formatUsd(v)} · ${row.portfolio}` : formatUsd(v)
        },
      },
    },
  }

  return (
    <PlatformPanel
      title='Revenue by tenant'
      subtitle='MRR per group company / standalone company'
      action={
        <div className='flex flex-col items-end gap-0.5'>
          {revenueByPortfolio.map((p) => (
            <span
              key={p.portfolio}
              className='text-paragraph-sm text-neutral-1100 tabular-nums'
            >
              {p.portfolio}: {formatUsd(p.mrrUsd)}
            </span>
          ))}
        </div>
      }
    >
      <ReactApexChart
        options={options}
        series={[{ name: 'MRR', data: rows.map((r) => r.mrrUsd) }]}
        type='bar'
        height={280}
      />
    </PlatformPanel>
  )
}

/** Companies per subscription plan (Enterprise / Growth / Starter). */
export function PlanMixChart() {
  const { planMix, companyCount } = usePlatformMetrics()

  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: platformChartFont },
    labels: planMix.map((p) => p.plan),
    colors: planMix.map((p) => PLAN_COLORS[p.plan]),
    stroke: { width: 2, colors: ['#fff'] },
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Companies',
              color: platformChartColors.axis,
              fontSize: '12px',
              formatter: () => String(companyCount),
            },
            value: {
              color: platformChartColors.navy,
              fontSize: '22px',
              fontWeight: 600,
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => `${v} companies` } },
  }

  return (
    <PlatformPanel title='Plan mix' subtitle='Companies by subscription plan'>
      <div className='flex flex-col gap-3'>
        <ReactApexChart
          options={options}
          series={planMix.map((p) => p.companies)}
          type='donut'
          height={210}
        />
        {/* Accessible text legend — counts, seats and MRR per plan. */}
        <ul className='flex flex-col gap-1.5'>
          {planMix.map((p) => (
            <li
              key={p.plan}
              className='text-paragraph-sm flex items-center justify-between gap-2'
            >
              <LegendDot
                color={PLAN_COLORS[p.plan]}
                label={`${p.plan} · $${PLAN_SEAT_PRICE_USD[p.plan]}/seat`}
              />
              <span className='text-neutral-1200 tabular-nums'>
                {p.companies} cos · {p.seats.toLocaleString('en-US')} seats ·{' '}
                {formatUsd(p.mrrUsd)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PlatformPanel>
  )
}

const INVOICE_STATUS_STYLES: Record<
  InvoiceStatus,
  { dot: string; badge: string }
> = {
  Paid: { dot: platformChartColors.green, badge: 'bg-green-1200 text-green-1300' },
  Due: { dot: platformChartColors.amber, badge: 'bg-yellow-200 text-yellow-1000' },
  Overdue: { dot: platformChartColors.red, badge: 'bg-red-100 text-red-1000' },
}

/** Paid / due / overdue rollup plus the most recent invoices. */
export function InvoiceStatusPanel() {
  const { invoiceSummary } = usePlatformMetrics()
  const totalAmount = invoiceSummary.reduce((n, s) => n + s.amountUsd, 0)
  const recent = [...platformInvoices]
    .sort((a, b) => (a.issuedOn < b.issuedOn ? 1 : -1))
    .slice(0, 6)

  return (
    <PlatformPanel
      title='Invoice status'
      subtitle='June + July 2026 billing cycles'
    >
      <div className='flex flex-col gap-4'>
        {/* Stacked proportion bar with explicit counts/amounts beside it. */}
        <div>
          <div
            className='flex h-3 w-full overflow-hidden rounded-full'
            role='img'
            aria-label={invoiceSummary
              .map((s) => `${s.status}: ${s.count} invoices, ${formatUsd(s.amountUsd)}`)
              .join('; ')}
          >
            {invoiceSummary.map((s) => (
              <div
                key={s.status}
                style={{
                  width: `${(s.amountUsd / totalAmount) * 100}%`,
                  backgroundColor: INVOICE_STATUS_STYLES[s.status].dot,
                }}
              />
            ))}
          </div>
          <div className='mt-2 grid grid-cols-3 gap-2'>
            {invoiceSummary.map((s) => (
              <div key={s.status} className='flex flex-col gap-0.5'>
                <LegendDot
                  color={INVOICE_STATUS_STYLES[s.status].dot}
                  label={`${s.status} (${s.count})`}
                />
                <span className='text-paragraph-sm text-neutral-1600 font-medium tabular-nums'>
                  {formatUsd(s.amountUsd)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <table className='w-full border-collapse'>
          <caption className='sr-only'>Most recent platform invoices</caption>
          <thead>
            <tr className='text-paragraph-sm text-neutral-1000 border-b border-gray-200 text-left'>
              <th className='py-1.5 pr-2 font-medium'>Invoice</th>
              <th className='py-1.5 pr-2 font-medium'>Tenant</th>
              <th className='py-1.5 pr-2 text-right font-medium'>Amount</th>
              <th className='py-1.5 font-medium'>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((inv) => (
              <tr
                key={inv.id}
                className='text-paragraph-sm border-b border-gray-100 last:border-0'
              >
                <td className='text-neutral-1200 py-1.5 pr-2 font-mono text-xs'>
                  {inv.id}
                </td>
                <td className='text-neutral-1600 py-1.5 pr-2'>
                  {inv.companyName}
                </td>
                <td className='text-neutral-1600 py-1.5 pr-2 text-right font-medium tabular-nums'>
                  {formatUsd(inv.amountUsd)}
                </td>
                <td className='py-1.5'>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_STYLES[inv.status].badge}`}
                  >
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformPanel>
  )
}
