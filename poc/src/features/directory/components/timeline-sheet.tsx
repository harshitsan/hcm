import { useRole } from '@/context/role-context'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type Employee } from '../data/directory'
import { canViewPrivateComments, type TimelineStore } from '../hooks/use-timeline'
import { TimelineFeed } from './timeline-feed'

interface TimelineSheetProps {
  employee: Employee | null
  timeline: TimelineStore
  onOpenChange: (open: boolean) => void
}

/**
 * "View timeline" drill-down for a directory employee: their milestone feed
 * with comment threads and a composer. Private comments surface only for
 * admin/HR roles (with a badge) or when authored by the viewer.
 */
export function TimelineSheet({
  employee,
  timeline,
  onOpenChange,
}: TimelineSheetProps) {
  const { role } = useRole()
  const seesPrivate = canViewPrivateComments(role)

  return (
    <Sheet open={employee !== null} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md font-semibold'>
            Employee Timeline — {employee?.name ?? ''}
          </SheetTitle>
        </SheetHeader>

        {employee && (
          <div className='flex-1 overflow-y-auto px-5 py-4'>
            <p className='text-neutral-1000 mb-4 text-xs'>
              {seesPrivate
                ? 'You are viewing as an admin/HR role — private comments are included and flagged with a badge.'
                : 'You see public comments plus your own private notes; private HR annotations are hidden.'}
            </p>
            <TimelineFeed
              events={timeline.eventsFor(employee.id, role)}
              getComments={(eventId) => timeline.commentsFor(eventId, role)}
              onAddComment={timeline.addComment}
              emptyText='No timeline events recorded for this employee (or the event types are disabled in Timeline settings).'
            />
          </div>
        )}
      </FloatingSheetContent>
    </Sheet>
  )
}
