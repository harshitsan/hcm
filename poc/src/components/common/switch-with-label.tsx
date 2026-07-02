import { cn } from '@/utils/helpers'
import { Switch } from '@/components/ui/switch'

interface SwitchWithLabelProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  labelA: string
  labelB: string
  variant?: 'default' | 'blue'
  className?: string
  labelClassName?: string
}

export function SwitchWithLabel({
  checked,
  onCheckedChange,
  labelA,
  labelB,
  variant = 'blue',
  className = '',
  labelClassName = '',
}: SwitchWithLabelProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn('text-grey-1200 text-xs font-medium', labelClassName)}
      >
        {labelA}
      </span>
      <Switch
        variant={variant}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <span
        className={cn('text-grey-1200 text-xs font-medium', labelClassName)}
      >
        {labelB}
      </span>
    </div>
  )
}
