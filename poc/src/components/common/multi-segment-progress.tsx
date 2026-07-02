import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { NO_DATA_AVAILABLE } from '@/config/ui-messages'
import { cn } from '@/utils/helpers'
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip'

export interface ProgressSegment {
  value: number
  color: string
  label?: string
  tooltipContent?: string | React.ReactNode
}

export interface MultiSegmentProgressProps {
  segments: ProgressSegment[]
  height?: string
  className?: string
  showLabels?: boolean
  labelClassName?: string
  showTooltips?: boolean
  tooltipClassName?: string
}

// Custom tooltip content without arrow
function CustomTooltipContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot='tooltip-content'
        className={cn(
          'text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md bg-black/80 px-3 py-1.5 text-xs text-balance',
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export function MultiSegmentProgress({
  segments,
  height = 'h-2',
  className,
  showLabels = false,
  labelClassName,
  showTooltips = false,
  tooltipClassName,
}: MultiSegmentProgressProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  if (total === 0) {
    return (
      <div className={cn('w-full', className)}>
        <div
          className={cn(
            'w-full overflow-hidden rounded-full bg-gray-200',
            height
          )}
        >
          <div className='flex h-full'>
            <div className='w-full bg-gray-300' />
          </div>
        </div>
        {showLabels && (
          <div
            className={cn(
              'mt-2 flex justify-between text-xs text-gray-500',
              labelClassName
            )}
          >
            <span>{NO_DATA_AVAILABLE}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-gray-200',
          height
        )}
      >
        <div className='flex h-full'>
          {segments.map((segment, index) => {
            const percentage = 33.33
            const segmentElement = (
              <div
                key={index}
                className={cn(
                  'h-full transition-opacity hover:opacity-80',
                  segment.color
                )}
                style={{ width: `${percentage}%` }}
              />
            )

            if (showTooltips && segment.tooltipContent) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>{segmentElement}</TooltipTrigger>
                  <CustomTooltipContent
                    className={cn('max-w-xs', tooltipClassName)}
                    side='top'
                    sideOffset={5}
                    avoidCollisions={true}
                    hideWhenDetached={false}
                  >
                    {segment.tooltipContent}
                  </CustomTooltipContent>
                </Tooltip>
              )
            }

            return segmentElement
          })}
        </div>
      </div>
      {showLabels && (
        <div
          className={cn(
            'mt-2 flex justify-between text-xs text-gray-500',
            labelClassName
          )}
        >
          {segments.map((segment, index) => (
            <div key={index} className='flex items-center gap-1'>
              <div className={cn('h-2 w-2 rounded-full', segment.color)} />
              <span>{segment.label || `Segment ${index + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
