import { CircleQuestionMark } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HelpButtonProps {
  tooltipContent: React.ReactNode
  className?: string
  iconClassName?: string
  tooltipClassName?: string
  sideOffset?: number
}

export function HelpButton({
  tooltipContent,
  className = '',
  iconClassName,
  tooltipClassName,
  sideOffset = 4,
}: HelpButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant='icon' className={className}>
          <CircleQuestionMark
            className={cn(
              'fill-grey-1100 size-5 text-neutral-100',
              iconClassName
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          'max-w-[220px] bg-black/80 [&_svg]:!hidden [&>svg]:!hidden',
          tooltipClassName
        )}
        sideOffset={sideOffset}
      >
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  )
}
