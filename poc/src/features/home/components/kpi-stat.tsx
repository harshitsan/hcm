import { type ApexOptions } from 'apexcharts'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import ReactApexChart from 'react-apexcharts'
import { cn } from '@/utils/helpers'
import { Card } from '@/components/ui/card'
import { HelpButton } from '@/components/common/help-button'
import { chartColors, chartFont, type Kpi } from '../data/analytics'

/**
 * A single portfolio metric: label, large value, period-over-period delta and
 * a sparkline. Delta color reflects whether the movement is good for that
 * metric (occupancy up = good, work orders up = bad).
 */
export function KpiStat({ kpi }: { kpi: Kpi }) {
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
    <Card className='gap-0 py-0'>
      <div className='flex flex-col gap-3 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-paragraph-sm text-neutral-1100 font-medium'>
            {kpi.label}
          </span>
          <div className='flex items-center gap-1.5'>
            <span
              className='flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold'
              style={{ color: accent, backgroundColor: `${accent}14` }}
            >
              <Arrow className='size-3' />
              {kpi.delta}
            </span>
            <HelpButton tooltipContent={<p>{kpi.caption}</p>} />
          </div>
        </div>

        <div className='flex items-end justify-between gap-2'>
          <div className='min-w-0'>
            <div className='text-h3 text-neutral-1600 font-semibold'>
              {kpi.value}
            </div>
            <p className='text-paragraph-sm text-neutral-1000 mt-1 truncate'>
              {kpi.caption}
            </p>
          </div>
          <div className={cn('h-10 w-24 shrink-0')}>
            <ReactApexChart
              options={sparkOptions}
              series={[{ name: kpi.label, data: kpi.spark }]}
              type='area'
              height={40}
              width='100%'
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
