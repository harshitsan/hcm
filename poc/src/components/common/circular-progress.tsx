import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showPercentage?: boolean
  className?: string
  showTooltip?: boolean
  tooltipContent?: React.ReactNode
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

export function CircularProgress({
  value,
  max,
  size = 70,
  strokeWidth = 4,
  color = '#ef4444',
  backgroundColor = '#EBEBEB',
  showPercentage = false,
  className = '',
  showTooltip = true,
  tooltipContent,
  tooltipPosition = 'top',
}: CircularProgressProps) {
  // Guard against division by zero / invalid max to avoid NaN in SVG attrs
  const safeMax = max > 0 ? max : 1
  const percentage = max > 0 ? Math.round((value / safeMax) * 100) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const progressCircle = (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className='-rotate-90 transform'
        style={{ width: size, height: size }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          strokeLinecap='round'
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className='transition-all duration-300 ease-in-out'
        />
      </svg>

      {/* Center content */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-lg font-medium'>
            {showPercentage ? `${percentage || 0}%` : value || 0}
          </div>
        </div>
      </div>
    </div>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='cursor-pointer'>{progressCircle}</div>
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

  return progressCircle
}
