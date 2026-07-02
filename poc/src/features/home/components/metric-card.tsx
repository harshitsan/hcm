import { type ApexOptions } from 'apexcharts'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpButton } from '@/components/common/help-button'
import { chartColors, chartFont, type Kpi } from '../data/analytics'

/**
 * Compact metric card in the leads dashboard style: title + help, a large
 * value with a colored period-over-period delta, caption and a sparkline.
 */
export function MetricCard({ kpi }: { kpi: Kpi }) {
  const isGood = kpi.goodWhenUp ? kpi.trend === 'up' : kpi.trend === 'down'
  const accent = isGood ? chartColors.greenDark : chartColors.red
  const Arrow = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight

  const sparkOptions: ApexOptions = {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: false },
      fontFamily: chartFont,
    },
    stroke: { curve: 'smooth', width: 2 },
    colors: [accent],
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.28, opacityTo: 0, shadeIntensity: 0.4 },
    },
    tooltip: { enabled: false },
  }

  return (
    <Card className='w-full cursor-pointer gap-2 py-2'>
      <CardHeader className='flex items-center justify-between px-3 pb-0'>
        <CardTitle className='text-paragraph-sm font-semibold'>
          {kpi.label}
        </CardTitle>
        <HelpButton tooltipContent={<p>{kpi.caption}</p>} />
      </CardHeader>
      <CardContent className='px-3 pt-0'>
        <div className='flex items-center justify-between gap-2'>
          <div className='min-w-0'>
            <div className='text-neutral-1600 text-2xl font-medium'>
              {kpi.value}
            </div>
            <div
              className='mt-0.5 flex items-center gap-0.5 text-xs font-medium'
              style={{ color: accent }}
            >
              <Arrow className='size-3' />
              {kpi.delta}
              <span className='text-grey-1200 ms-1 font-normal'>
                vs last period
              </span>
            </div>
          </div>
          <div className='h-9 w-20 shrink-0'>
            <ReactApexChart
              options={sparkOptions}
              series={[{ name: kpi.label, data: kpi.spark }]}
              type='area'
              height={36}
              width='100%'
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StackedMetric {
  value: string | number
  label: string
}

/**
 * Two stacked metrics in one card (e.g. renewals at risk), mirroring the
 * hot-leads card layout.
 */
export function StackedMetricCard({
  title,
  help,
  metrics,
}: {
  title: string
  help?: React.ReactNode
  metrics: StackedMetric[]
}) {
  return (
    <Card className='w-full cursor-pointer gap-4 py-2'>
      <CardHeader className='flex items-center justify-between px-3'>
        <CardTitle className='text-paragraph-sm font-semibold'>
          {title}
        </CardTitle>
        {help && <HelpButton tooltipContent={help} />}
      </CardHeader>
      <CardContent className='space-y-3 px-3 pt-0'>
        {metrics.map((m) => (
          <div key={m.label}>
            <div className='text-neutral-1600 text-2xl font-medium'>
              {m.value}
            </div>
            <div className='text-grey-1200 text-xs font-normal'>{m.label}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
