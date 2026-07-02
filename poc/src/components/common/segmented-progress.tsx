import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SegmentedProgressProps {
  value: number
  max?: number
  totalSegments?: number
  filledColor?: string
  emptyColor?: string
  height?: string
  gap?: string
  className?: string
  showTooltip?: boolean
  tooltipContent?: React.ReactNode
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

export function SegmentedProgress({
  value,
  max = 100,
  totalSegments = 30,
  filledColor = '#31B97E',
  emptyColor = '#e5e7eb',
  height = 'h-6',
  gap = 'gap-1',
  className = '',
  showTooltip = true,
  tooltipContent,
  tooltipPosition = 'top',
}: SegmentedProgressProps) {
  // Calculate progress percentage
  const progressPercentage = Math.round((value / max) * 100)
  const filledSegments = Math.round((progressPercentage / 100) * totalSegments)

  const progressBar = (
    <div className={`flex ${gap} ${className}`}>
      {Array.from({ length: totalSegments }, (_, index) => (
        <div
          key={index}
          className={`${height} w-0.5 flex-1`}
          style={{
            backgroundColor: index < filledSegments ? filledColor : emptyColor,
          }}
        />
      ))}
    </div>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='cursor-pointer'>{progressBar}</div>
        </TooltipTrigger>
        <TooltipContent
          className='max-w-[220px] [&_svg]:!hidden [&>svg]:!hidden'
          side={tooltipPosition}
          sideOffset={4}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    )
  }

  return progressBar
}
