import {
  MODULE_ADOPTION_TOTAL_COMPANIES,
  moduleAdoption,
  platformChartColors,
} from '../data/platform-metrics'
import { PlatformPanel } from './platform-panel'

/**
 * Horizontal adoption bars per module — each row carries the explicit
 * "x of N companies · %" text so the data is never colour-only.
 */
export function ModuleAdoptionPanel() {
  return (
    <PlatformPanel
      title='Module adoption'
      subtitle={`Modules enabled across the ${MODULE_ADOPTION_TOTAL_COMPANIES} tenant companies`}
    >
      <ul className='flex list-none flex-col gap-3'>
        {moduleAdoption.map((m) => {
          const pct = Math.round(
            (m.companies / MODULE_ADOPTION_TOTAL_COMPANIES) * 100
          )
          return (
            <li key={m.module} className='flex flex-col gap-1'>
              <div className='text-paragraph-sm flex items-center justify-between gap-2'>
                <span className='text-neutral-1600 font-medium'>
                  {m.module}
                </span>
                <span className='text-neutral-1200 tabular-nums'>
                  {m.companies} of {MODULE_ADOPTION_TOTAL_COMPANIES} companies
                  · {pct}%
                </span>
              </div>
              <div
                className='h-2 w-full overflow-hidden rounded-full bg-neutral-300'
                role='progressbar'
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${m.module} adoption: ${pct} percent`}
              >
                <div
                  className='h-full rounded-full'
                  style={{
                    width: `${pct}%`,
                    backgroundColor: platformChartColors.blue,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </PlatformPanel>
  )
}
