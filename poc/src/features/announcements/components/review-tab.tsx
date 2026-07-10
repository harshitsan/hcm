import { useMemo, useState } from 'react'
import { BellRinging, EnvelopeSimple, PencilSimple } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type Announcement,
  type AnnouncementStatus,
} from '../data/announcements'
import { type OrgConfig } from '../data/org'
import { type AnnouncementsStore } from '../hooks/use-announcements'
import { targetingSummary, todayIso } from '../utils/audience'
import { ComposeOverlay } from './compose-overlay'
import { StatusBadge, TypeBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Saved-but-not-yet-live states the reviewer can still edit. */
const REVIEWABLE_STATUSES: AnnouncementStatus[] = [
  'Draft',
  'Pending approval',
  'Approved',
  'Scheduled',
  'On Hold',
  'Rejected',
  'Withdrawn',
]

/**
 * True when the announcer review reminder is due: within "notify the
 * announcer before (days)" of the scheduled publish date (PDF pointer #5).
 */
function reviewReminderDue(a: Announcement): boolean {
  if (a.notifyAnnouncerBeforeDays <= 0) return false
  if (!['Scheduled', 'Approved', 'Draft', 'Pending approval'].includes(a.status))
    return false
  const today = new Date(`${todayIso()}T00:00:00Z`).getTime()
  const start = new Date(`${a.startDate}T00:00:00Z`).getTime()
  const windowStart = start - a.notifyAnnouncerBeforeDays * 24 * 60 * 60 * 1000
  return today >= windowStart && today <= start
}

interface ReviewTabProps {
  store: AnnouncementsStore
  orgConfig: OrgConfig
}

/**
 * Review announcements (PDF Transaction > Review Announcements): the
 * announcement coordinator/reviewer sees every saved (not yet live)
 * announcement, gets review-due reminders per the "notify the announcer
 * before" setting, and can open any record to edit and save it. The simulated
 * email notification log lives here too.
 */
export function ReviewTab({ store, orgConfig }: ReviewTabProps) {
  const [editing, setEditing] = useState<Announcement | null>(null)

  const reviewable = useMemo(
    () =>
      store.announcements
        .filter((a) => REVIEWABLE_STATUSES.includes(a.status))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [store.announcements]
  )

  const dueForReview = reviewable.filter(reviewReminderDue)

  return (
    <div className='w-full space-y-4'>
      {dueForReview.length > 0 && (
        <div className='rounded-[8px] border border-gray-200 bg-white px-4 py-3'>
          <div className='mb-1 flex items-center gap-2'>
            <BellRinging size={16} className='text-orange-1200' weight='fill' />
            <p className='text-neutral-1600 text-sm font-medium'>
              Review reminders — publish date approaching
            </p>
          </div>
          <ul className='space-y-0.5'>
            {dueForReview.map((a) => (
              <li key={a.id} className='text-paragraph-sm text-neutral-1000'>
                “{a.title}” publishes on {dateFmt.format(new Date(a.startDate))}{' '}
                — reminder configured {a.notifyAnnouncerBeforeDays} day
                {a.notifyAnnouncerBeforeDays === 1 ? '' : 's'} before. Review and
                make any changes now.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className='mb-3 flex items-center justify-between'>
          <div>
            <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
              Review announcements ({reviewable.length})
            </h2>
            <p className='text-paragraph-sm text-neutral-1000'>
              Saved announcements awaiting review — edit the format as needed
              and save.
            </p>
          </div>
        </div>
        <div className='overflow-hidden rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Publish date</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewable.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-neutral-1000 py-8 text-center text-sm'
                  >
                    Nothing awaiting review — all announcements are live or
                    completed.
                  </TableCell>
                </TableRow>
              ) : (
                reviewable.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-neutral-1600 text-sm font-medium'>
                          {a.title}
                        </span>
                        {reviewReminderDue(a) && (
                          <Badge variant='overdue'>Review due</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={a.type} />
                    </TableCell>
                    <TableCell className='text-neutral-1900 text-sm'>
                      {dateFmt.format(new Date(a.startDate))}
                    </TableCell>
                    <TableCell className='text-neutral-1000 max-w-[260px] truncate text-sm'>
                      {a.visibleToAll
                        ? 'All employees'
                        : targetingSummary(a.targeting)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end'>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label={`Edit ${a.title}`}
                          onClick={() => setEditing(a)}
                        >
                          <PencilSimple size={14} weight='fill' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <div className='mb-3 flex items-center gap-2'>
          <EnvelopeSimple size={16} className='text-blue-1400' weight='fill' />
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Email notification log ({store.notifications.length})
          </h2>
        </div>
        <div className='overflow-hidden rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Announcement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className='text-neutral-1900 text-sm'>
                    {dateFmt.format(new Date(n.at))}
                  </TableCell>
                  <TableCell>
                    <Badge variant='booked'>{n.channel}</Badge>
                  </TableCell>
                  <TableCell className='text-neutral-1900 text-sm'>{n.to}</TableCell>
                  <TableCell className='text-neutral-1600 text-sm font-medium'>
                    {n.subject}
                  </TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>
                    {n.announcementTitle}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ComposeOverlay
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        announcement={editing}
        orgConfig={orgConfig}
        onCreate={() => undefined}
        onUpdate={(id, draft) => {
          store.updateAnnouncement(id, draft)
          setEditing(null)
        }}
      />
    </div>
  )
}
