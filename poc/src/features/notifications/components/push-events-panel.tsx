import { Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { seedPushEvents } from '../data/push-events'

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Read-only stream of push events the engine emits for the mobile app (F7).
 * Push delivery itself is owned by the app team — this panel only shows what
 * was emitted.
 */
export function PushEventsPanel() {
  return (
    <Card className='gap-3 border-none bg-white py-4'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
          <Smartphone className='text-blue-1400 size-4' />
          Mobile push events
        </CardTitle>
        <p className='text-paragraph-sm text-neutral-1000'>
          These events are emitted for the mobile app to deliver; push delivery
          is handled by the app team.
        </p>
      </CardHeader>
      <CardContent className='space-y-2 px-4'>
        {seedPushEvents.map((e) => (
          <div
            key={e.id}
            className='border-gray-200 rounded-[6px] border px-3 py-2'
          >
            <div className='mb-0.5 flex flex-wrap items-center gap-2'>
              <Badge variant='open'>{e.event}</Badge>
              <span className='text-paragraph-sm text-neutral-1000'>
                {dateTimeFmt.format(new Date(e.emittedAt))}
              </span>
            </div>
            <p className='text-neutral-1600 text-sm'>
              To {e.targetUser} — {e.payloadSummary}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
