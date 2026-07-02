import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface PageLoaderProps {
  text?: string
  className?: string
}

export function PageLoader({
  text = 'Generating Dashboard',
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm',
        className
      )}
    >
      <div className='flex flex-col items-center gap-4'>
        <Loader2 className='text-primary h-12 w-12 animate-spin' />
        <p className='text-paragraph-lg text-neutral-1800 font-medium'>
          {text}
        </p>
      </div>
    </div>
  )
}
