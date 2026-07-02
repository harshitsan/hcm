import { ShieldOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AccessDeniedPanelProps {
  title?: string
  description: string
}

/**
 * Shown when RBAC / tenant-boundary enforcement denies access to audit data.
 * Deliberately reveals nothing about the protected data (FR 6.29.5).
 */
export function AccessDeniedPanel({
  title = 'Access denied',
  description,
}: AccessDeniedPanelProps) {
  return (
    <Card className='border-grey-200 w-full border bg-white'>
      <CardContent className='flex flex-col items-center gap-3 px-6 py-12 text-center'>
        <div className='bg-red-1300 flex h-12 w-12 items-center justify-center rounded-full'>
          <ShieldOff className='text-red-1400 h-6 w-6' />
        </div>
        <h3 className='text-neutral-1600 text-paragraph-md font-semibold'>
          {title}
        </h3>
        <p className='text-neutral-1000 max-w-xl text-sm'>{description}</p>
        <p className='text-neutral-1000 text-xs'>
          This denied attempt is recorded as a security event. No audit data
          has been revealed.
        </p>
      </CardContent>
    </Card>
  )
}
