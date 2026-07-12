/**
 * Tiny inline-SVG chart primitives for the landing dashboards. The POC adds
 * no chart library — these draw with plain SVG and inherit their colour from
 * the surrounding text (`currentColor`), so callers pick a Tailwind text
 * class to theme them.
 */

function scalePoints(values: number[], width: number, height: number, pad = 3) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const step = values.length > 1 ? innerW / (values.length - 1) : 0
  return values.map((v, i) => ({
    x: pad + i * step,
    y: pad + innerH - ((v - min) / span) * innerH,
  }))
}

/** Line sparkline with a soft area fill and an end-point dot. */
export function Sparkline({
  values,
  width = 220,
  height = 48,
  className = 'text-blue-1200',
  area = true,
}: {
  values: number[]
  width?: number
  height?: number
  className?: string
  area?: boolean
}) {
  if (values.length === 0) return null
  const pts = scalePoints(values, width, height)
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = `M ${pts[0].x} ${height - 2} L ${pts
    .map((p) => `${p.x} ${p.y}`)
    .join(' L ')} L ${pts[pts.length - 1].x} ${height - 2} Z`
  const last = pts[pts.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-auto w-full ${className}`}
      role='img'
      aria-hidden='true'
      preserveAspectRatio='none'
    >
      {area && <path d={areaPath} fill='currentColor' opacity={0.12} />}
      <polyline
        points={line}
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx={last.x} cy={last.y} r={2.6} fill='currentColor' />
    </svg>
  )
}

/** Compact bar chart; the last bar is emphasised as the current period. */
export function MiniBars({
  values,
  width = 220,
  height = 56,
  className = 'text-blue-1200',
  labels,
}: {
  values: number[]
  width?: number
  height?: number
  className?: string
  /** Optional short labels rendered beneath each bar. */
  labels?: string[]
}) {
  if (values.length === 0) return null
  const max = Math.max(...values) || 1
  const labelRoom = labels ? 12 : 0
  const chartH = height - labelRoom
  const gap = 6
  const barW = (width - gap * (values.length - 1)) / values.length

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-auto w-full ${className}`}
      role='img'
      aria-hidden='true'
      preserveAspectRatio='none'
    >
      {values.map((v, i) => {
        const h = Math.max(2, (v / max) * (chartH - 4))
        const x = i * (barW + gap)
        const isLast = i === values.length - 1
        return (
          <g key={i}>
            <rect
              x={x}
              y={chartH - h}
              width={barW}
              height={h}
              rx={2}
              fill='currentColor'
              opacity={isLast ? 1 : 0.35}
            />
            {labels?.[i] !== undefined && (
              <text
                x={x + barW / 2}
                y={height - 2}
                textAnchor='middle'
                fontSize={7}
                fill='currentColor'
                opacity={0.7}
              >
                {labels[i]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
