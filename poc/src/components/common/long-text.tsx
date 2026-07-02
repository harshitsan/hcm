import { cn } from '@/utils/helpers'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type LongTextProps = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly contentClassName?: string
  readonly maxLength?: number
  readonly maxWidth?: string
  readonly maxHeight?: string
}

export function LongText({
  children,
  className = '',
  contentClassName = '',
  maxLength = 15,
  maxWidth = 'max-w-md',
  maxHeight = 'max-h-96',
}: LongTextProps) {
  const textContent =
    typeof children === 'string'
      ? children
      : typeof children === 'number'
        ? String(children)
        : ''

  if (!textContent || textContent.length <= maxLength) {
    return <div className={cn(className)}>{children}</div>
  }

  const truncatedText = `${textContent.slice(0, maxLength)}...`

  return (
    <>
      <div className='hidden sm:block'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn('cursor-help', className)}>
                {truncatedText}
              </div>
            </TooltipTrigger>
            <TooltipContent
              className={cn(
                maxWidth,
                'pb-4',
                maxWidth !== 'max-w-md' && '!w-auto'
              )}
              side='top'
            >
              <div className={cn(maxHeight, 'overflow-y-auto', 'w-full')}>
                <p
                  className={cn(
                    'break-words whitespace-pre-wrap',
                    contentClassName
                  )}
                >
                  {textContent}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className='sm:hidden'>
        <Popover>
          <PopoverTrigger asChild>
            <div className={cn('cursor-pointer', className)}>
              {truncatedText}
            </div>
          </PopoverTrigger>
          <PopoverContent className={cn(maxWidth, 'pb-4', contentClassName)}>
            <div className={cn(maxHeight, 'overflow-y-auto')}>
              <p className='break-words whitespace-pre-wrap'>{textContent}</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
