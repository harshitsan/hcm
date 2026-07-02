import { cn } from '@/utils/helpers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BarChartSkeletonLoader({ className }: { className?: string }) {
  return (
    <Card className={cn('relative h-full w-full border-none px-3', className)}>
      <CardHeader className='flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-3'>
        <Skeleton className='h-4 w-32' />
        <div className='flex items-center justify-between'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-4'>
            <Skeleton className='h-6 w-16 sm:w-20' />
            <Skeleton className='h-6 w-12 sm:w-16' />
            <Skeleton className='h-4 w-4' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='border-none !px-3 pt-0 shadow-none'>
        <div className='flex h-[175px] flex-col gap-3 sm:h-[210px] sm:gap-4'>
          {/* Chart skeleton */}
          <div className='hidden flex-1 items-end gap-1 px-3 sm:flex sm:gap-2'>
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className='flex flex-1 flex-col items-center gap-1 sm:gap-2'
              >
                <Skeleton
                  className='w-full bg-gray-200'
                  style={{ height: `${Math.random() * 150 + 40}px` }}
                />
                <Skeleton className='h-2 w-8 sm:h-3 sm:w-12' />
              </div>
            ))}
          </div>
          <div className='flex flex-1 items-end gap-1 px-3 sm:hidden sm:gap-2'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className='flex flex-1 flex-col items-center gap-1 sm:gap-2'
              >
                <Skeleton
                  className='w-full bg-gray-200'
                  style={{ height: `${Math.random() * 150 + 40}px` }}
                />
                <Skeleton className='h-2 w-8 sm:h-3 sm:w-12' />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
