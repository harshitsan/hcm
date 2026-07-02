import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface CircularLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  variant?: 'horizontal' | 'vertical'
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function CircularLoader({
  size = 'md',
  className,
  text,
  variant = 'horizontal',
}: CircularLoaderProps) {
  const isHorizontal = variant === 'horizontal'

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      <Loader2 className={cn('text-primary animate-spin', sizeClasses[size])} />
      {text && (
        <p
          className={cn(
            'text-neutral-1800 text-paragraph-sm font-normal'
            // textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  )
}
