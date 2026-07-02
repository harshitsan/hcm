import { cn } from '@/utils/helpers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ProspectSkeletonLoaderProps {
  className?: string
}

function ProspectSkeletonLoader({ className }: ProspectSkeletonLoaderProps) {
  return (
    <div>
      <Card className={cn('h-[134px] w-full gap-2 p-3', className)}>
        <CardHeader className='flex items-center justify-between px-0'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-4 rounded-full' />
        </CardHeader>
        <CardContent className='p-0 pt-0'>
          <div className='flex items-center justify-between'>
            {/* Left side - Chart area */}
            <div className='flex flex-col items-center'>
              <Skeleton className='ml-5 h-[80px] w-[80px] rounded-full' />
            </div>

            {/* Right side - Legend */}
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-3 rounded-full' />
                <div className='flex flex-col'>
                  <Skeleton className='h-3 w-16' />
                  {/* <Skeleton className='h-4 w-8' /> */}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-3 rounded-full' />
                <div className='flex flex-col'>
                  <Skeleton className='h-3 w-20' />
                  {/* <Skeleton className='h-4 w-6' /> */}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-3 rounded-full' />
                <div className='flex flex-col'>
                  <Skeleton className='h-3 w-18' />
                  {/* <Skeleton className='h-4 w-8' /> */}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-3 rounded-full' />
                <div className='flex flex-col'>
                  <Skeleton className='h-3 w-14' />
                  {/* <Skeleton className='h-4 w-6' /> */}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProspectSkeletonLoader
