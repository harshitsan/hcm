/**
 * Lightweight inline-SVG chart primitives for the reporting module — no
 * charting dependency. Four primitives (horizontal bar, vertical column,
 * donut, trend line) plus a stacked bar, all labeled and accessible
 * (role="img" + aria-label), matching the app's visual language.
 */

/** Reporting palette drawn from the app theme tokens. */
export const CHART_COLORS = [
  '#1f5adb', // blue-1400
  '#31b97e', // green-1700
  '#f2af29', // yellow-600
  '#f1552f', // orange-1200 (signal)
  '#50c9ce', // green-1600 (teal)
  '#c879ff', // purple-100
  '#e12c2c', // red-600
  '#95d5bd', // green-400
] as const

export interface ChartDatum {
  label: string
  value: number
  color?: string
}

const colorAt = (i: number, override?: string) =>
  override ?? CHART_COLORS[i % CHART_COLORS.length]

const fmt = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(1)

/** Bordered card wrapper so every chart reads consistently in a grid. */
export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
      <p className='text-neutral-1600 text-sm font-semibold'>{title}</p>
      {subtitle && (
        <p className='text-neutral-1000 mb-2 text-xs'>{subtitle}</p>
      )}
      <div className={subtitle ? '' : 'mt-2'}>{children}</div>
    </div>
  )
}

/** Horizontal bar chart — one labeled bar per category, value at the end. */
export function HBarChart({
  data,
  suffix = '',
  monochrome = false,
}: {
  data: ChartDatum[]
  suffix?: string
  monochrome?: boolean
}) {
  const rowH = 26
  const labelW = 118
  const valueW = 52
  const width = 380
  const barMax = width - labelW - valueW
  const max = Math.max(1, ...data.map((d) => d.value))
  const height = data.length * rowH

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width='100%'
      role='img'
      aria-label={`Horizontal bar chart: ${data
        .map((d) => `${d.label} ${fmt(d.value)}${suffix}`)
        .join(', ')}`}
    >
      {data.map((d, i) => {
        const y = i * rowH
        const w = Math.max(2, (d.value / max) * barMax)
        return (
          <g key={d.label}>
            <text
              x={labelW - 8}
              y={y + rowH / 2 + 3.5}
              textAnchor='end'
              fontSize='11'
              fill='#525866'
            >
              {d.label.length > 18 ? `${d.label.slice(0, 17)}…` : d.label}
              <title>{d.label}</title>
            </text>
            <rect
              x={labelW}
              y={y + 5}
              width={barMax}
              height={rowH - 10}
              rx={4}
              fill='#f1f3f5'
            />
            <rect
              x={labelW}
              y={y + 5}
              width={w}
              height={rowH - 10}
              rx={4}
              fill={monochrome ? CHART_COLORS[0] : colorAt(i, d.color)}
            />
            <text
              x={labelW + w + 6}
              y={y + rowH / 2 + 3.5}
              fontSize='11'
              fontWeight={600}
              fill='#0e121b'
            >
              {fmt(d.value)}
              {suffix}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Vertical column chart with value labels above each column. */
export function ColumnChart({
  data,
  suffix = '',
}: {
  data: ChartDatum[]
  suffix?: string
}) {
  const width = 380
  const height = 170
  const padB = 22
  const padT = 16
  const max = Math.max(1, ...data.map((d) => d.value))
  const slot = width / data.length
  const barW = Math.min(44, slot * 0.55)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width='100%'
      role='img'
      aria-label={`Column chart: ${data
        .map((d) => `${d.label} ${fmt(d.value)}${suffix}`)
        .join(', ')}`}
    >
      <line
        x1={0}
        y1={height - padB}
        x2={width}
        y2={height - padB}
        stroke='#e1e4ea'
      />
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * (height - padB - padT))
        const x = i * slot + (slot - barW) / 2
        const y = height - padB - h
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={4}
              fill={colorAt(i, d.color)}
            />
            <text
              x={i * slot + slot / 2}
              y={y - 4}
              textAnchor='middle'
              fontSize='10.5'
              fontWeight={600}
              fill='#0e121b'
            >
              {fmt(d.value)}
              {suffix}
            </text>
            <text
              x={i * slot + slot / 2}
              y={height - padB + 14}
              textAnchor='middle'
              fontSize='10'
              fill='#525866'
            >
              {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
              <title>{d.label}</title>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Donut chart with center metric and a labeled legend. */
export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: ChartDatum[]
  centerLabel: string
  centerValue: string
}) {
  const total = Math.max(
    1,
    data.reduce((sum, d) => sum + d.value, 0)
  )
  const r = 44
  const c = 2 * Math.PI * r
  let acc = 0

  return (
    <div className='flex flex-wrap items-center gap-4'>
      <svg
        viewBox='0 0 120 120'
        width='128'
        height='128'
        role='img'
        aria-label={`Donut chart, ${centerLabel} ${centerValue}: ${data
          .map(
            (d) =>
              `${d.label} ${fmt(d.value)} (${Math.round((d.value / total) * 100)}%)`
          )
          .join(', ')}`}
      >
        <circle
          cx='60'
          cy='60'
          r={r}
          fill='none'
          stroke='#f1f3f5'
          strokeWidth='14'
        />
        {data.map((d, i) => {
          const frac = d.value / total
          const dash = frac * c
          const offset = c * 0.25 - acc
          acc += dash
          return (
            <circle
              key={d.label}
              cx='60'
              cy='60'
              r={r}
              fill='none'
              stroke={colorAt(i, d.color)}
              strokeWidth='14'
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={offset}
            />
          )
        })}
        <text
          x='60'
          y='57'
          textAnchor='middle'
          fontSize='16'
          fontWeight={600}
          fill='#0e121b'
        >
          {centerValue}
        </text>
        <text x='60' y='72' textAnchor='middle' fontSize='8.5' fill='#525866'>
          {centerLabel}
        </text>
      </svg>
      <ul className='min-w-0 flex-1 space-y-1.5'>
        {data.map((d, i) => (
          <li
            key={d.label}
            className='flex items-center justify-between gap-2 text-xs'
          >
            <span className='flex min-w-0 items-center gap-1.5'>
              <span
                aria-hidden
                className='h-2.5 w-2.5 shrink-0 rounded-full'
                style={{ backgroundColor: colorAt(i, d.color) }}
              />
              <span className='text-neutral-1000 truncate'>{d.label}</span>
            </span>
            <span className='font-semibold'>
              {fmt(d.value)}{' '}
              <span className='text-neutral-1000 font-normal'>
                ({Math.round((d.value / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface TrendPoint {
  label: string
  value: number
}

/** Trend line with area fill, point markers and value labels. */
export function TrendLineChart({
  points,
  suffix = '',
}: {
  points: TrendPoint[]
  suffix?: string
}) {
  const width = 380
  const height = 150
  const padB = 20
  const padT = 18
  const padX = 24
  const values = points.map((p) => p.value)
  const max = Math.max(1, ...values)
  const min = Math.min(...values, max)
  const span = Math.max(1, max - min)
  const innerW = width - padX * 2
  const x = (i: number) =>
    padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) =>
    height - padB - ((v - min) / span) * (height - padB - padT)
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width='100%'
      role='img'
      aria-label={`Trend line: ${points
        .map((p) => `${p.label} ${fmt(p.value)}${suffix}`)
        .join(', ')}`}
    >
      <line
        x1={0}
        y1={height - padB}
        x2={width}
        y2={height - padB}
        stroke='#e1e4ea'
      />
      <polygon
        points={`${padX},${height - padB} ${line} ${x(points.length - 1)},${height - padB}`}
        fill='#1f5adb'
        opacity={0.08}
      />
      <polyline
        points={line}
        fill='none'
        stroke='#1f5adb'
        strokeWidth='2'
        strokeLinejoin='round'
        strokeLinecap='round'
      />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.value)} r='3' fill='#1f5adb' />
          <text
            x={x(i)}
            y={y(p.value) - 7}
            textAnchor='middle'
            fontSize='10'
            fontWeight={600}
            fill='#0e121b'
          >
            {fmt(p.value)}
            {suffix}
          </text>
          <text
            x={x(i)}
            y={height - padB + 13}
            textAnchor='middle'
            fontSize='9.5'
            fill='#525866'
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export interface StackedCategory {
  label: string
  /** One value per series, in series order. */
  values: number[]
}

/** Stacked column chart with a series legend. */
export function StackedBarChart({
  series,
  categories,
}: {
  series: { name: string; color?: string }[]
  categories: StackedCategory[]
}) {
  const width = 380
  const height = 170
  const padB = 22
  const padT = 14
  const max = Math.max(
    1,
    ...categories.map((c) => c.values.reduce((s, v) => s + v, 0))
  )
  const slot = width / categories.length
  const barW = Math.min(44, slot * 0.55)

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width='100%'
        role='img'
        aria-label={`Stacked bar chart: ${categories
          .map(
            (c) =>
              `${c.label} — ${c.values
                .map((v, i) => `${series[i]?.name} ${fmt(v)}`)
                .join(', ')}`
          )
          .join('; ')}`}
      >
        <line
          x1={0}
          y1={height - padB}
          x2={width}
          y2={height - padB}
          stroke='#e1e4ea'
        />
        {categories.map((cat, ci) => {
          const xPos = ci * slot + (slot - barW) / 2
          let stackY = height - padB
          const total = cat.values.reduce((s, v) => s + v, 0)
          return (
            <g key={cat.label}>
              {cat.values.map((v, si) => {
                const h = (v / max) * (height - padB - padT)
                stackY -= h
                return (
                  <rect
                    key={series[si]?.name ?? si}
                    x={xPos}
                    y={stackY}
                    width={barW}
                    height={Math.max(0, h - 1)}
                    rx={2}
                    fill={colorAt(si, series[si]?.color)}
                  >
                    <title>{`${cat.label} · ${series[si]?.name}: ${fmt(v)}`}</title>
                  </rect>
                )
              })}
              <text
                x={ci * slot + slot / 2}
                y={stackY - 4}
                textAnchor='middle'
                fontSize='10'
                fontWeight={600}
                fill='#0e121b'
              >
                {fmt(total)}
              </text>
              <text
                x={ci * slot + slot / 2}
                y={height - padB + 14}
                textAnchor='middle'
                fontSize='10'
                fill='#525866'
              >
                {cat.label.length > 12
                  ? `${cat.label.slice(0, 11)}…`
                  : cat.label}
                <title>{cat.label}</title>
              </text>
            </g>
          )
        })}
      </svg>
      <div className='mt-1 flex flex-wrap gap-x-3 gap-y-1'>
        {series.map((s, i) => (
          <span
            key={s.name}
            className='text-neutral-1000 flex items-center gap-1.5 text-xs'
          >
            <span
              aria-hidden
              className='h-2.5 w-2.5 rounded-[3px]'
              style={{ backgroundColor: colorAt(i, s.color) }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}
