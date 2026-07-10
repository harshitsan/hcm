import { useRole } from '@/context/role-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimelineFeed } from '@/features/directory/components/timeline-feed'
import {
  SELF_EMPLOYEE_ID,
  SELF_EMPLOYEE_NAME,
} from '@/features/directory/data/timeline'
import { useTimeline } from '@/features/directory/hooks/use-timeline'

/**
 * "My Timeline": the signed-in mock employee's own milestone feed — one
 * colored dot per configured event type, expandable comment threads and a
 * composer that mock-notifies HR on every new comment.
 */
export function MyTimelineTab() {
  const { role } = useRole()
  const timeline = useTimeline()

  return (
    <Card className='border-gray-200'>
      <CardHeader>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          My Timeline — {SELF_EMPLOYEE_NAME}
        </CardTitle>
        <p className='text-neutral-1000 text-xs'>
          Milestones recorded against your employee record, newest first.
          Comments marked Private are visible to you and HR only; every comment
          sends HR a notification.
        </p>
      </CardHeader>
      <CardContent>
        <TimelineFeed
          events={timeline.eventsFor(SELF_EMPLOYEE_ID, role, true)}
          getComments={(eventId) => timeline.commentsFor(eventId, role)}
          onAddComment={timeline.addComment}
          emptyText='No milestones recorded on your timeline yet.'
        />
      </CardContent>
    </Card>
  )
}
