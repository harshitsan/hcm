import { useEffect, useMemo, useState } from 'react'
import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { cn } from '@/utils/helpers'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type ChartTooltipDetails = {
  category?: string
  series_name?: string
  value?: number
  data_point_index?: number
  series_index?: number
}

function getTooltipDetailsFromConfig(config: unknown): ChartTooltipDetails {
  const c = config as {
    dataPointIndex?: number
    seriesIndex?: number
    w?: {
      globals?: {
        labels?: string[]
        seriesNames?: string[]
        series?: (number | number[])[]
      }
      config?: {
        series?: { name?: string; data?: number[] }[]
      }
    }
  } | null
  if (!c?.w?.globals) return {}
  const { dataPointIndex = -1, seriesIndex = -1 } = c
  const globals = c.w.globals
  const labels = globals.labels
  const seriesNames = globals.seriesNames
  const seriesData = globals.series
  const category =
    Array.isArray(labels) &&
    dataPointIndex >= 0 &&
    dataPointIndex < labels.length
      ? labels[dataPointIndex]
      : undefined
  const series_name =
    Array.isArray(seriesNames) &&
    seriesIndex >= 0 &&
    seriesIndex < seriesNames.length
      ? seriesNames[seriesIndex]
      : undefined
  let value: number | undefined
  if (
    Array.isArray(seriesData) &&
    seriesIndex >= 0 &&
    seriesIndex < seriesData.length
  ) {
    const seg = seriesData[seriesIndex]
    if (
      Array.isArray(seg) &&
      dataPointIndex >= 0 &&
      dataPointIndex < seg.length
    ) {
      value = Number(seg[dataPointIndex])
    } else if (typeof seg === 'number') {
      value = seg
    }
  }
  return {
    category,
    series_name,
    value: value !== undefined && Number.isFinite(value) ? value : undefined,
    data_point_index: dataPointIndex >= 0 ? dataPointIndex : undefined,
    series_index: seriesIndex >= 0 ? seriesIndex : undefined,
  }
}

interface ChartProps {
  options: ApexOptions
  series: number[] | { name: string; data: number[] }[]
  type:
    | 'line'
    | 'area'
    | 'bar'
    | 'pie'
    | 'donut'
    | 'radialBar'
    | 'scatter'
    | 'bubble'
    | 'heatmap'
    | 'treemap'
    | 'boxPlot'
    | 'candlestick'
    | 'radar'
    | 'polarArea'
    | 'rangeBar'
    | 'rangeArea'
  chartKey?: string
  height?: string | number
  width?: string | number
  className?: string
  itemsPerPage?: number
  showPagination?: boolean
  /** Called when user hovers a data point and the tooltip is shown; receives tooltip details for the hovered data point */
  onTooltipShow?: (details: ChartTooltipDetails) => void
}

export function Chart({
  options,
  series,
  type,
  chartKey = 'my-key',
  height = '100%',
  width = '100%',
  className = '',
  itemsPerPage = 7,
  showPagination = true,
  onTooltipShow,
}: ChartProps) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [chartKey])

  const { paginatedSeries, paginatedOptions, totalPages } = useMemo(() => {
    if (!showPagination || !Array.isArray(series)) {
      return {
        paginatedSeries: series,
        paginatedOptions: options,
        totalPages: 1,
      }
    }

    const firstSeries = series[0]
    const dataLength =
      typeof firstSeries === 'object' && 'data' in firstSeries
        ? firstSeries.data.length
        : options.xaxis?.categories?.length || 0

    const totalPages = Math.ceil(dataLength / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    const paginatedSeries = series.map((s) => {
      if (typeof s === 'object' && 'data' in s) {
        return {
          ...s,
          data: s.data.slice(startIndex, endIndex),
        } as { name: string; data: number[] }
      }
      return s
    }) as typeof series

    const paginatedOptions = {
      ...options,
      xaxis: {
        ...options.xaxis,
        categories:
          options.xaxis?.categories?.slice(startIndex, endIndex) || [],
      },
    }

    return {
      paginatedSeries,
      paginatedOptions,
      totalPages,
    }
  }, [series, options, currentPage, itemsPerPage, showPagination])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Sanitize series so null/NaN/undefined don't cause ApexCharts to throw (e.g. "reading 'length' of null")
  const safeSeries = useMemo(() => {
    const base = Array.isArray(paginatedSeries) ? paginatedSeries : []
    if (base.length === 0) return base
    return base.map((s) => {
      if (
        typeof s === 'object' &&
        s !== null &&
        'data' in s &&
        Array.isArray(s.data)
      ) {
        return {
          ...s,
          data: s.data.map((v) =>
            typeof v === 'number' && Number.isFinite(v) ? v : 0
          ),
        }
      }
      if (typeof s === 'number' && Number.isFinite(s)) return s
      return 0
    }) as typeof paginatedSeries
  }, [paginatedSeries])

  const safeHeight =
    typeof height === 'number' && !Number.isFinite(height) ? '100%' : height
  const safeWidth =
    typeof width === 'number' && !Number.isFinite(width) ? '100%' : width

  const safeOptions = useMemo(() => {
    const xaxis = paginatedOptions.xaxis ?? {}
    const categories = xaxis.categories
    return {
      ...paginatedOptions,
      xaxis: {
        ...xaxis,
        categories: Array.isArray(categories) ? categories : [],
      },
    }
  }, [paginatedOptions])

  const optionsWithTooltipEvent = useMemo(() => {
    if (!onTooltipShow) return safeOptions
    const existingDataPointMouseEnter = (
      safeOptions.chart as {
        events?: {
          dataPointMouseEnter?: (
            e: unknown,
            ctx: unknown,
            config: unknown
          ) => void
        }
      }
    )?.events?.dataPointMouseEnter
    return {
      ...safeOptions,
      chart: {
        ...safeOptions.chart,
        events: {
          ...(safeOptions.chart as { events?: Record<string, unknown> })
            ?.events,
          dataPointMouseEnter: (
            event: unknown,
            chartContext: unknown,
            config: unknown
          ) => {
            if (typeof existingDataPointMouseEnter === 'function') {
              existingDataPointMouseEnter(event, chartContext, config)
            }
            const details = getTooltipDetailsFromConfig(config)
            onTooltipShow(details)
          },
        },
      },
    }
  }, [safeOptions, onTooltipShow])

  return (
    <div className={className}>
      <ReactApexChart
        key={`${chartKey}-${currentPage}`}
        options={optionsWithTooltipEvent}
        series={safeSeries}
        type={type}
        height={safeHeight}
        width={safeWidth}
      />
      <div id='html-dist'></div>

      {showPagination && totalPages > 1 && (
        <div className='absolute right-0 bottom-2 left-0 flex items-center justify-center space-x-0.5'>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation() // ✅ prevents overlay opening
                handlePageChange(index + 1)
              }}
              className={cn(
                `h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                  currentPage === index + 1
                    ? 'bg-blue-1700 !h-1.5 !w-3 rounded-full'
                    : 'hover:bg-neutral-2200 bg-neutral-2200'
                }`
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------
// Reusable Funnel Chart (planning funnel)
// ----------------------------------------

export interface FunnelStage {
  name: string
  value: number
  variance: string
  top: number
  bottom: number
  colors: { main: string; light: string }
}

interface FunnelChartProps {
  stages: FunnelStage[]
  hoveredIndex?: number | null
  onHoverChange?: (index: number | null) => void
  className?: string
}

export function FunnelChart({
  stages,
  hoveredIndex,
  onHoverChange,
  className = '',
}: FunnelChartProps) {
  const [internalHover, setInternalHover] = useState<number | null>(null)
  const activeHover = hoveredIndex ?? internalHover

  const handleHover = (index: number | null) => {
    setInternalHover(index)
    onHoverChange?.(index)
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div className='pointer-events-none absolute inset-0'>
        {stages.map((stage, index) => {
          const { colors, top, bottom } = stage

          const topOffset = (100 - top) / 2
          const bottomOffset = (100 - bottom) / 2

          const lightTop = Math.min(100, top + 25)
          const lightBottom = Math.min(lightTop, bottom + 25)
          const lightTopOffset = (100 - lightTop) / 2
          const lightBottomOffset = (100 - lightBottom) / 2

          const isHovered = activeHover === index

          return (
            <div key={stage.name}>
              <div
                className='absolute right-[100px] left-[120px] transition-opacity duration-200 sm:right-[140px] sm:left-[150px] md:right-[180px] md:left-[200px]'
                style={{
                  top: `${index * 46}px`,
                  height: '46px',
                  backgroundColor: colors.light,
                  clipPath: `polygon(${lightTopOffset}% 0%, ${100 - lightTopOffset}% 0%, ${100 - lightBottomOffset}% 100%, ${lightBottomOffset}% 100%)`,
                  zIndex: 1,
                  opacity: isHovered ? 1 : 0.7,
                }}
              />
              <div
                className='absolute right-[100px] left-[120px] transition-all duration-200 sm:right-[140px] sm:left-[150px] md:right-[180px] md:left-[200px]'
                style={{
                  top: `${index * 46}px`,
                  height: '46px',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'center',
                  backgroundColor: colors.main,
                  clipPath: `polygon(${topOffset}% 0%, ${100 - topOffset}% 0%, ${100 - bottomOffset}% 100%, ${bottomOffset}% 100%)`,
                  zIndex: 2,
                  opacity: isHovered ? 1 : 0.9,
                  filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
                }}
              />
            </div>
          )
        })}
      </div>

      <div className='relative z-10'>
        {stages.map((stage, index) => {
          const isHovered = activeHover === index
          return (
            <Tooltip key={stage.name}>
              <TooltipTrigger asChild>
                <div
                  className='relative flex cursor-pointer items-center border-b border-gray-100 transition-all duration-200 last:border-b-0'
                  style={{ minHeight: '46px' }}
                  onMouseEnter={() => handleHover(index)}
                  onMouseLeave={() => handleHover(null)}
                >
                  <div className='z-10 min-w-[120px] shrink-0 px-2 sm:min-w-[150px] sm:px-4 md:min-w-[200px]'>
                    <span
                      className={`text-xs transition-colors duration-200 sm:text-sm ${
                        isHovered
                          ? 'text-neutral-1600 font-semibold'
                          : 'text-neutral-1800'
                      }`}
                    >
                      {stage.name}
                    </span>
                  </div>

                  <div className='relative flex flex-1 items-center justify-center' />

                  <div className='z-10 flex min-w-[100px] shrink-0 items-center justify-end gap-2 px-2 sm:min-w-[140px] sm:gap-3 sm:px-4 md:min-w-[180px]'>
                    <span
                      className={`text-xs font-semibold transition-colors duration-200 sm:text-sm ${
                        isHovered ? 'text-neutral-1400' : 'text-neutral-1600'
                      }`}
                    >
                      {stage.value.toLocaleString()}
                    </span>
                    <span className='text-grey-1200 text-[10px] whitespace-nowrap sm:text-xs'>
                      {stage.variance}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side='top'
                sideOffset={8}
                showArrow={false}
                className='w-fit !rounded-none !border-0 !bg-transparent !p-0 !shadow-none'
              >
                <div className='font-geist text-paragraph-sm overflow-hidden rounded-lg'>
                  <div className='bg-black px-3 py-2 font-semibold text-white'>
                    {stage.name}
                  </div>
                  <div className='bg-gray-800 px-3 py-2 text-white'>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <span>Value</span>
                        <span className='font-medium'>
                          {stage.value.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <span>Variance</span>
                        <span className='font-medium'>{stage.variance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

// ----------------------------------------
// Reusable Half Funnel Chart (horizontal, top only)
// ----------------------------------------

export interface HalfFunnelStage {
  label: string
  value: number // Normalized value (0-100)
  originalValue?: number
  displayValue: string
  variance: string
  color: string
  lightColor: string
}

interface HalfFunnelChartProps {
  stages: HalfFunnelStage[]
  height?: number
  className?: string
}

export function HalfFunnelChart({
  stages,
  height = 300,
  className = '',
}: HalfFunnelChartProps) {
  const svgWidth = 1200
  const svgHeight = height
  const maxFunnelHeight = 5400
  const baseY = svgHeight
  const step = svgWidth / stages.length

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-white',
        className
      )}
    >
      <div className='relative h-[300px] w-full'>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width='100%'
          height={`${svgHeight}px`}
          preserveAspectRatio='none'
          className='absolute inset-0'
        >
          {stages.map((d, i) => {
            // Current segment height
            const h1 = (d.value / 100) * maxFunnelHeight

            // Next segment height (for slanted edge)
            const nextValue =
              i + 1 < stages.length ? stages[i + 1].value : d.value * 0.5
            const h2 = (nextValue / 100) * maxFunnelHeight

            const x1 = i * step
            const x2 = x1 + step

            // Calculate bounding box for tooltip trigger
            const minY = Math.min(baseY - h1, baseY - h2)
            const maxY = baseY
            const tooltipY = minY
            const tooltipHeight = maxY - minY

            return (
              <g key={d.label}>
                {/* Light shadow layer */}
                <polygon
                  points={`
                    ${x1},${baseY - h1 - 10}
                    ${x2},${baseY - h2 - 10}
                    ${x2},${baseY}
                    ${x1},${baseY}
                  `}
                  fill={d.lightColor}
                  opacity={0.45}
                />

                {/* Main funnel segment */}
                <polygon
                  points={`
                    ${x1},${baseY - h1}
                    ${x2},${baseY - h2}
                    ${x2},${baseY}
                    ${x1},${baseY}
                  `}
                  fill={d.color}
                />

                {/* Transparent overlay for tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <foreignObject
                      x={x1}
                      y={tooltipY}
                      width={x2 - x1}
                      height={tooltipHeight}
                      style={{
                        cursor: 'pointer',
                        overflow: 'visible',
                      }}
                    >
                      <div className='h-full w-full' />
                    </foreignObject>
                  </TooltipTrigger>
                  <TooltipContent
                    side='top'
                    sideOffset={8}
                    showArrow={false}
                    className='w-fit !rounded-none !border-0 !bg-transparent !p-0 !shadow-none'
                  >
                    <div className='font-geist text-paragraph-sm overflow-hidden rounded-lg'>
                      {/* Heading with solid black background */}
                      <div className='bg-black px-3 py-2 font-semibold text-white'>
                        {d.label}
                      </div>
                      {/* Values with darker gray background */}
                      <div className='bg-gray-800 px-3 py-2 text-white'>
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between gap-3'>
                            <span>Value</span>
                            <span className='font-medium'>
                              {d.displayValue}
                            </span>
                          </div>
                          <div className='flex items-center justify-between gap-3'>
                            <span>Variance</span>
                            <span className='font-medium'>{d.variance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
