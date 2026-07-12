import { Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Sparkline } from './sparkline'

export interface KpiDelta {
  /** Short movement copy, e.g. "+4 this quarter". */
  text: string
  direction: 'up' | 'down' | 'flat'
  /** Whether the movement is good news — colours the delta. */
  tone: 'good' | 'bad' | 'neutral'
}

export interface DrillKpi {
  label: string
  value: string
  hint?: string
  delta?: KpiDelta
  icon?: LucideIcon
  iconClass?: string
  /** Tiny trend behind the number. */
  spark?: number[]
  sparkClass?: string
  /** Module route the card drills into. */
  to?: string
}

const TONE_CLASS: Record<KpiDelta['tone'], string> = {
  good: 'text-green-1300',
  bad: 'text-red-1400',
  neutral: 'text-neutral-1000',
}

function DeltaLine({ delta }: { delta: KpiDelta }) {
  const Icon =
    delta.direction === 'up'
      ? TrendingUp
      : delta.direction === 'down'
        ? TrendingDown
        : Minus
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${TONE_CLASS[delta.tone]}`}
    >
      <Icon className='size-3.5 shrink-0' />
      {delta.text}
    </span>
  )
}

/**
 * KPI stat card for the role dashboards — number, movement, optional
 * sparkline. When a route is given the whole card is a drill-down link into
 * the owning module.
 */
export function KpiCard({ kpi }: { kpi: DrillKpi }) {
  const Icon = kpi.icon
  const body = (
    <>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-paragraph-sm text-neutral-1000 tracking-wide uppercase'>
          {kpi.label}
        </span>
        {Icon ? (
          <span
            aria-hidden='true'
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${kpi.iconClass ?? 'bg-blue-100 text-blue-1200'}`}
          >
            <Icon className='size-4' />
          </span>
        ) : kpi.to ? (
          <ArrowUpRight className='text-neutral-800 size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100' />
        ) : null}
      </div>
      <div className='flex items-end justify-between gap-2'>
        <span className='font-display text-neutral-1600 text-2xl font-semibold tabular-nums'>
          {kpi.value}
        </span>
        {kpi.spark && kpi.spark.length > 1 && (
          <span className='w-20 shrink-0 pb-1'>
            <Sparkline
              values={kpi.spark}
              width={80}
              height={26}
              className={kpi.sparkClass ?? 'text-blue-1200'}
            />
          </span>
        )}
      </div>
      <div className='flex flex-wrap items-center justify-between gap-1'>
        {kpi.delta ? <DeltaLine delta={kpi.delta} /> : <span />}
        {kpi.hint && (
          <span className='text-paragraph-sm text-neutral-1000'>
            {kpi.hint}
          </span>
        )}
      </div>
    </>
  )

  const cardClass =
    'flex h-full flex-col gap-2 rounded-[8px] border border-gray-200 bg-white p-4'

  if (kpi.to) {
    return (
      <Link
        to={kpi.to}
        className={`${cardClass} group hover:border-neutral-600 transition-colors`}
        aria-label={`${kpi.label} — open module`}
      >
        {body}
      </Link>
    )
  }
  return <div className={cardClass}>{body}</div>
}

/** Responsive grid of KPI cards. */
export function KpiCardGrid({ kpis }: { kpis: DrillKpi[] }) {
  return (
    <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'>
      {kpis.map((k) => (
        <KpiCard key={k.label} kpi={k} />
      ))}
    </div>
  )
}

/**
 * Comp-dark footnote shown under every admin dashboard (R2): dashboards
 * carry no compensation data and follow the same visibility filters as
 * reports.
 */
export function CompDarkNote() {
  return (
    <p className='text-neutral-1000 text-xs'>
      Compensation data is excluded from all dashboards. The figures above
      follow the same visibility rules as reports — you only see the people
      and companies your role covers.
    </p>
  )
}
