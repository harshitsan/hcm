import { cn } from '@/utils/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { CircularLoader } from '@/components/common/circular-loader'

interface CardLoaderProps {
  text?: string
  height?: number
  className?: string
}

export function CardLoader({
  text = 'Fetching data…',
  height = 134,
  className,
}: CardLoaderProps) {
  return (
    <Card
      className={cn(
        'flex w-full items-center justify-center gap-2 px-3 py-2',
        className
      )}
      style={{ height: `${height}px` }}
    >
      <CardContent className='flex min-h-[100px] items-center justify-center p-0'>
        <CircularLoader size='sm' text={text} />
      </CardContent>
    </Card>
  )
}
