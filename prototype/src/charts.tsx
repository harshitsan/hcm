/**
 * Hand-rolled SVG charts tuned to the reference aesthetic:
 * thick rounded amber strokes, soft cream tracks, big friendly numbers.
 */
import { cn } from './lib'

/* ── Gauge: 270° arc like the "80% Employee Satisfactory" dial ───────── */

export function Gauge({
  value,
  label,
  size = 150,
  className,
}: {
  value: number // 0-100
  label?: string
  size?: number
  className?: string
}) {
  const sw = 11
  const r = (size - sw) / 2
  const c = size / 2
  const start = 135 // degrees
  const sweep = 270
  const polar = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)]
  }
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from)
    const [x2, y2] = polar(to)
    const large = to - from > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }
  const end = start + (sweep * Math.min(100, Math.max(0, value))) / 100
  const [dx, dy] = polar(end)
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <path d={arc(start, start + sweep)} fill="none" stroke="rgb(var(--line) / 0.8)" strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(start, Math.max(start + 0.5, end))} fill="none" stroke="rgb(var(--accent))" strokeWidth={sw} strokeLinecap="round" />
        <circle cx={dx} cy={dy} r={sw / 2 + 2.5} fill="rgb(var(--card))" stroke="rgb(var(--accent))" strokeWidth={3} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-bold leading-none tracking-tight">{Math.round(value)}%</span>
        {label && <span className="mt-1 max-w-[80%] text-center text-[10.5px] font-medium leading-tight text-muted">{label}</span>}
      </div>
    </div>
  )
}

/* ── Donut: used / remaining ─────────────────────────────────────────── */

export function Donut({
  value,
  max,
  size = 64,
  stroke = 8,
  tone = 'amber',
  center,
  className,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  tone?: 'amber' | 'green' | 'ink'
  center?: React.ReactNode
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = size / 2
  const circ = 2 * Math.PI * r
  const frac = max <= 0 ? 0 : Math.min(1, value / max)
  const color = tone === 'amber' ? 'rgb(var(--accent))' : tone === 'green' ? 'rgb(var(--green))' : 'rgb(var(--ink))'
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgb(var(--line) / 0.7)" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ * frac} ${circ}`}
        />
      </svg>
      {center && <div className="absolute inset-0 flex items-center justify-center">{center}</div>}
    </div>
  )
}

/* ── Spark: soft line like the "Average Team KPI" chart ──────────────── */

export function Spark({
  points,
  labels,
  height = 90,
  className,
}: {
  points: number[]
  labels?: string[]
  height?: number
  className?: string
}) {
  const w = 100
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map((p) => 8 + (1 - (p - min) / span) * (height - 20))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="block w-full" style={{ height }}>
        <path d={`${d} L ${w} ${height} L 0 ${height} Z`} fill="rgb(var(--accent) / 0.12)" stroke="none" />
        <path d={d} fill="none" stroke="rgb(var(--accent))" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {labels && (
        <div className="mt-1.5 flex justify-between text-[10.5px] font-medium text-muted">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Bars: rounded pill columns like "Employment Status" ─────────────── */

export function Bars({
  data,
  height = 130,
  className,
}: {
  data: { label: string; value: number; tone?: 'amber' | 'ink' | 'line' | 'green'; hint?: string }[]
  height?: number
  className?: string
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <div className={cn('flex items-end justify-between gap-3', className)} style={{ height }}>
      {data.map((d) => {
        const h = Math.max(0.14, d.value / max)
        return (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            {d.hint && <span className="text-[10.5px] font-bold text-ink-soft">{d.hint}</span>}
            <div
              className={cn(
                'w-full max-w-[52px] rounded-[14px] transition-all',
                (d.tone ?? 'amber') === 'amber' && 'bg-accent',
                d.tone === 'ink' && 'bg-ink',
                d.tone === 'line' && 'bg-line',
                d.tone === 'green' && 'bg-green',
              )}
              style={{ height: `${h * 100}%` }}
            />
            <span className="text-[10.5px] font-medium text-muted">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── WeekBars: thin vertical pills (image-2 progress widget) ─────────── */

export function WeekBars({
  data,
  height = 86,
  highlight,
  className,
}: {
  data: { label: string; value: number }[] // value 0-1
  height?: number
  highlight?: number // index to render amber
  className?: string
}) {
  return (
    <div className={cn('flex items-end gap-2.5', className)} style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <div className="relative flex h-full w-[10px] items-end overflow-hidden rounded-full bg-line/60">
            <div
              className={cn('w-full rounded-full', i === highlight ? 'bg-accent' : 'bg-ink/80')}
              style={{ height: `${Math.round(d.value * 100)}%` }}
            />
          </div>
          <span className={cn('text-[10px] font-semibold', i === highlight ? 'text-ink' : 'text-muted')}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}
