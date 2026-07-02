import { useMemo, useState } from 'react'
import { Bell, Link2, Lock, Paperclip, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type Announcement, type AnnouncementImage } from '../data/announcements'
import { FEED_EMPLOYEE, NON_USER_EMPLOYEE } from '../data/org'
import { type AnnouncementsStore } from '../hooks/use-announcements'
import { isVisibleToEmployee, targetingSummary } from '../utils/audience'
import { TypeBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

interface FeedTabProps {
  store: AnnouncementsStore
  images: AnnouncementImage[]
}

/**
 * Self-service feed (ANN-07/23): only currently-visible announcements that
 * the rules engine resolves for the signed-in employee, newest first, with
 * search, unread markers, and a clear empty state (ANN-40). Employees without
 * system access are excluded entirely (ANN-08/13).
 */
export function FeedTab({ store, images }: FeedTabProps) {
  const { role } = useRole()
  const [query, setQuery] = useState('')
  const [openItem, setOpenItem] = useState<Announcement | null>(null)

  const isNonUser = role === 'Employee (Non-User)'
  const employee = isNonUser ? NON_USER_EMPLOYEE : FEED_EMPLOYEE

  const visible = useMemo(() => {
    const matching = store.announcements.filter((a) =>
      isVisibleToEmployee(a, employee)
    )
    const searched = query.trim()
      ? matching.filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.body.toLowerCase().includes(query.toLowerCase())
        )
      : matching
    return [...searched].sort((a, b) => b.startDate.localeCompare(a.startDate))
  }, [store.announcements, employee, query])

  if (isNonUser) {
    return (
      <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
        <Lock className='text-neutral-1000 size-8' />
        <p className='text-neutral-1600 text-paragraph-md font-medium'>
          No system access
        </p>
        <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
          In-system announcements are delivered only to employees with system
          access. As {NON_USER_EMPLOYEE.name}, you are excluded from the
          reachable audience — important messages reach you through your
          manager or notice boards instead.
        </p>
      </div>
    )
  }

  const milestoneImage = (a: Announcement) =>
    a.eventBasis === 'None'
      ? null
      : (images.find((img) => img.eventType === a.eventBasis) ?? null)

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My announcements ({visible.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Viewing as {employee.name} — {employee.department},{' '}
            {employee.location}, {employee.company} ({employee.workforceType})
          </p>
        </div>
        <div className='relative'>
          <Search className='text-neutral-1000 absolute top-1/2 left-2 size-3.5 -translate-y-1/2' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search announcements…'
            className='h-7 w-[240px] pl-7'
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className='border-grey-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
          <Bell className='text-neutral-1000 size-8' />
          <p className='text-neutral-1600 text-paragraph-md font-medium'>
            No announcements available
          </p>
          <p className='text-paragraph-sm text-neutral-1000'>
            {query.trim()
              ? 'Nothing matches your search — try different keywords.'
              : 'There is nothing new for you right now. New messages will appear here.'}
          </p>
        </div>
      ) : (
        <div className='space-y-2'>
          {visible.map((a) => (
            <button
              key={a.id}
              type='button'
              onClick={() => {
                setOpenItem(a)
                store.markRead(a.id)
              }}
              className='border-grey-200 hover:border-blue-1400 w-full rounded-[6px] border bg-white px-4 py-3 text-left transition-colors'
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='flex min-w-0 items-center gap-2'>
                  {!a.read && (
                    <span className='bg-blue-1400 size-2 shrink-0 rounded-full' />
                  )}
                  <span className='text-neutral-1600 truncate font-medium'>
                    {a.title}
                  </span>
                  {!a.read && <Badge variant='open'>New</Badge>}
                  <TypeBadge type={a.type} />
                </div>
                <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
                  {dateFmt.format(new Date(a.startDate))}
                </span>
              </div>
              <p className='text-paragraph-sm text-neutral-1000 mt-1 line-clamp-2'>
                {a.body}
              </p>
              <div className='text-paragraph-sm text-neutral-1000 mt-1 flex items-center gap-3'>
                {a.link && (
                  <span className='text-blue-1400 flex items-center gap-1'>
                    <Link2 className='size-3.5' /> Link
                  </span>
                )}
                {a.attachment && (
                  <span className='flex items-center gap-1'>
                    <Paperclip className='size-3.5' /> {a.attachment}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(openItem)}
        onOpenChange={(open) => !open && setOpenItem(null)}
      >
        <DialogContent className='sm:max-w-[520px]'>
          {openItem && (
            <>
              <DialogHeader>
                <DialogTitle>{openItem.title}</DialogTitle>
                <DialogDescription>
                  Published {dateFmt.format(new Date(openItem.startDate))} by{' '}
                  {openItem.creator} · Audience:{' '}
                  {targetingSummary(openItem.targeting)}
                </DialogDescription>
              </DialogHeader>
              <p className='text-neutral-1600 text-sm whitespace-pre-line'>
                {openItem.body}
              </p>
              {milestoneImage(openItem) && (
                <div className='bg-blue-150 text-blue-1400 rounded-[6px] px-3 py-2 text-sm'>
                  Milestone visual: {milestoneImage(openItem)?.name} (
                  {milestoneImage(openItem)?.eventType},{' '}
                  {milestoneImage(openItem)?.years} year
                  {milestoneImage(openItem)?.years === 1 ? '' : 's'})
                </div>
              )}
              <div className='flex items-center gap-2'>
                {openItem.link && (
                  <Button
                    variant='outline'
                    className='h-7 gap-1 rounded-[6px] px-2'
                    onClick={() =>
                      toast.info(`Opening ${openItem.link} isn’t available in this demo`)
                    }
                  >
                    <Link2 className='size-3.5' />
                    Open link
                  </Button>
                )}
                {openItem.attachment && (
                  <Button
                    variant='outline'
                    className='h-7 gap-1 rounded-[6px] px-2'
                    onClick={() =>
                      toast.info('Downloads aren’t available in this demo')
                    }
                  >
                    <Paperclip className='size-3.5' />
                    {openItem.attachment}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
