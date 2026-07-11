import { Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Canonical empty state: message + optional inline "Clear search/filters"
 * action (consistency matrix #10 — reuses directory's Clear-filters idiom).
 */
export function EmptyStateCard({
  message,
  action,
}: {
  message: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card className='border-gray-200'>
      <CardContent className='py-10 text-center'>
        <p className='text-neutral-1000 text-sm'>{message}</p>
        {action && <div className='mt-3 flex justify-center'>{action}</div>}
      </CardContent>
    </Card>
  )
}

/** Canonical blocked state — the role can see the surface but not act on it. */
export function BlockedStateCard({ message }: { message: React.ReactNode }) {
  return (
    <Card className='border-gray-200'>
      <CardContent className='py-10 text-center'>
        <Lock className='text-neutral-800 mx-auto mb-2 size-5' />
        <p className='text-neutral-1000 text-sm'>{message}</p>
      </CardContent>
    </Card>
  )
}
