import { chartColors, leasingFunnel } from '../data/analytics'
import { ChartCard } from './chart-card'

const numberFmt = new Intl.NumberFormat('en-US')

/**
 * Signature element: the leasing funnel from first inquiry to signed lease.
 * Each stage is a tapering bar; the gap between two stages shows the
 * stage-to-stage conversion rate, the number leasing teams actually manage to.
 */
export function LeasingFunnel() {
  const top = leasingFunnel[0].value
  // Navy -> bright blue gradient across the stages.
  const stageColors = [
    chartColors.navy,
    chartColors.blue,
    chartColors.blueBright,
    chartColors.blueLight,
    chartColors.teal,
  ]

  const overall =
    Math.round((leasingFunnel[leasingFunnel.length - 1].value / top) * 1000) /
    10

  return (
    <ChartCard
      title='Leasing funnel'
      subtitle='Inquiry to signed lease, this period'
      help='Inquiry to signed lease this period, with stage-to-stage conversion.'
      action={
        <span className='text-paragraph-sm text-neutral-1100'>
          <span className='text-green-1300 font-semibold'>{overall}%</span>{' '}
          overall
        </span>
      }
    >
      <div className='flex flex-col gap-1 px-2 py-1'>
        {leasingFunnel.map((stage, i) => {
          const widthPct = Math.max((stage.value / top) * 100, 14)
          const prev = i === 0 ? null : leasingFunnel[i - 1]
          const conversion = prev
            ? Math.round((stage.value / prev.value) * 1000) / 10
            : null

          return (
            <div key={stage.label}>
              {conversion !== null && (
                <div className='flex items-center gap-2 py-1 ps-1'>
                  <span className='bg-grey-200 h-px flex-1' />
                  <span className='text-caption text-neutral-1000 font-medium tracking-wide uppercase'>
                    {conversion}% advance
                  </span>
                  <span className='bg-grey-200 h-px flex-1' />
                </div>
              )}

              <div className='flex items-center gap-3'>
                <div
                  className='flex h-12 items-center justify-between rounded-md px-3 transition-all'
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${stageColors[i]}, ${stageColors[i]}cc)`,
                  }}
                >
                  <span className='truncate text-sm font-medium text-white'>
                    {stage.label}
                  </span>
                  <span className='ps-2 text-sm font-semibold text-white'>
                    {numberFmt.format(stage.value)}
                  </span>
                </div>
                <span className='text-paragraph-sm text-neutral-1000 hidden truncate sm:inline'>
                  {stage.hint}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}
