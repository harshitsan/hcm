import { cn } from '@/utils/helpers'
import { Card } from '@/components/ui/card'
import { HelpButton } from '@/components/common/help-button'

interface ChartCardProps {
  title: string
  subtitle?: string
  /** Tooltip text for the inline help (?) button, like the leads cards. */
  help?: React.ReactNode
  /** Right-aligned slot for legends, totals, or controls. */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/**
 * Card shell shared by every chart on the dashboard so titles, padding and
 * dividers stay consistent.
 */
export function ChartCard({
  title,
  subtitle,
  help,
  action,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <div className='border-grey-200 flex items-start justify-between gap-3 border-b px-5 py-4'>
        <div className='min-w-0'>
          <h3 className='text-paragraph-md text-neutral-1600 truncate font-semibold'>
            {title}
          </h3>
          {subtitle && (
            <p className='text-paragraph-sm text-neutral-1100 mt-0.5'>
              {subtitle}
            </p>
          )}
        </div>
        {(action || help) && (
          <div className='flex shrink-0 items-center gap-2'>
            {action}
            {help && <HelpButton tooltipContent={help} />}
          </div>
        )}
      </div>
      <div className='px-2 py-3 sm:px-4'>{children}</div>
    </Card>
  )
}

/** Small colored dot + label used in chart legends. */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className='text-paragraph-sm text-neutral-1100 flex items-center gap-1.5'>
      <span
        className='size-2 rounded-full'
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
