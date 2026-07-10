import { useMemo, useState } from 'react'
import {
  Bell,
  Briefcase,
  CalendarCheck,
  Link2,
  Lock,
  Minus,
  Paperclip,
  Plus,
  Search,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type Announcement, type AnnouncementImage } from '../data/announcements'
import { FEED_EMPLOYEE, NON_USER_EMPLOYEE } from '../data/org'
import { type AnnouncementsStore } from '../hooks/use-announcements'
import {
  isVisibleToEmployee,
  renderTemplate,
  targetingSummary,
  todayIso,
} from '../utils/audience'
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
 * View announcements (PDF Transaction > View Announcements): the published
 * announcements widget on the employee portal. Each entry expands with the
 * "+" control, event-based announcements render their template with the
 * event image, expired announcements are hidden (vs today = 2026-07-09),
 * employees can comment on timelines directly from the announcement window,
 * and Vacancy/Event announcements offer Apply/Enroll (PDF #11/#12).
 */
export function FeedTab({ store, images }: FeedTabProps) {
  const { role } = useRole()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

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

  const toggleExpand = (a: Announcement) => {
    const next = expandedId === a.id ? null : a.id
    setExpandedId(next)
    if (next) store.markRead(a.id)
  }

  const postComment = (a: Announcement) => {
    const text = (commentDrafts[a.id] ?? '').trim()
    if (!text) {
      toast.warning('Write a comment before posting')
      return
    }
    store.addComment(a.id, employee.name, text)
    setCommentDrafts((prev) => ({ ...prev, [a.id]: '' }))
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            My announcements ({visible.length})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Viewing as {employee.name} — {employee.position},{' '}
            {employee.department}, {employee.location}, {employee.company} (
            {employee.workforceType}). Expired announcements are hidden as of{' '}
            {dateFmt.format(new Date(todayIso()))}.
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
          {visible.map((a) => {
            const expanded = expandedId === a.id
            const image = milestoneImage(a)
            const enrolled = a.enrollments.includes(employee.name)
            return (
              <div
                key={a.id}
                className='rounded-[8px] border border-gray-200 bg-white'
              >
                <button
                  type='button'
                  onClick={() => toggleExpand(a)}
                  className='w-full px-4 py-3 text-left'
                  aria-expanded={expanded}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex min-w-0 items-center gap-2'>
                      {expanded ? (
                        <Minus className='text-blue-1400 size-4 shrink-0' />
                      ) : (
                        <Plus className='text-blue-1400 size-4 shrink-0' />
                      )}
                      {!a.read && (
                        <span className='bg-blue-1400 size-2 shrink-0 rounded-full' />
                      )}
                      <span className='text-neutral-1600 truncate font-medium'>
                        {a.title}
                      </span>
                      {!a.read && <Badge variant='open'>New</Badge>}
                      <TypeBadge type={a.type} />
                      {a.kind === 'Vacancy' && (
                        <Badge variant='overdue'>Vacancy</Badge>
                      )}
                      {a.kind === 'Event' && <Badge variant='booked'>Event</Badge>}
                      {a.eventBasis !== 'None' && (
                        <Badge variant='completed'>{a.eventBasis}</Badge>
                      )}
                    </div>
                    <span className='text-paragraph-sm text-neutral-1000 shrink-0'>
                      {dateFmt.format(new Date(a.startDate))}
                      {a.startTime ? ` · ${a.startTime}` : ''}
                    </span>
                  </div>
                  {!expanded && (
                    <p className='text-paragraph-sm text-neutral-1000 mt-1 line-clamp-2 pl-6'>
                      {a.body}
                    </p>
                  )}
                </button>

                {expanded && (
                  <div className='border-grey-200 space-y-3 border-t px-4 py-3'>
                    <p className='text-paragraph-sm text-neutral-1000'>
                      Published {dateFmt.format(new Date(a.startDate))} by{' '}
                      {a.creator} · Audience:{' '}
                      {a.visibleToAll
                        ? a.targeting.groups.length > 0
                          ? `All employees — groups: ${a.targeting.groups.join(', ')}`
                          : 'All employees'
                        : targetingSummary(a.targeting)}
                    </p>
                    <p className='text-neutral-1600 text-sm whitespace-pre-line'>
                      {a.body}
                    </p>

                    {a.template && (
                      <div className='bg-blue-150 rounded-[6px] px-3 py-2'>
                        <p className='text-blue-1400 mb-1 text-sm font-medium'>
                          {a.eventBasis !== 'None'
                            ? `${a.eventBasis} greeting`
                            : 'Announcement template'}
                        </p>
                        <p className='text-neutral-1600 text-sm whitespace-pre-line'>
                          {renderTemplate(a.template, {
                            employee: employee.name,
                            event: a.eventBasis === 'None' ? a.title : a.eventBasis,
                            date: dateFmt.format(new Date(todayIso())),
                            company: employee.company,
                          })}
                        </p>
                      </div>
                    )}

                    {image && (
                      <div className='bg-blue-150 text-blue-1400 rounded-[6px] px-3 py-2 text-sm'>
                        Event visual: {image.name} ({image.eventType}
                        {image.years > 0 ? `, ${image.years} years` : ''})
                      </div>
                    )}

                    <div className='flex flex-wrap items-center gap-2'>
                      {a.link && (
                        <Button
                          variant='outline'
                          className='h-7 gap-1 rounded-[6px] px-2'
                          onClick={() =>
                            toast.info(`Opening ${a.link} isn’t available in this demo`)
                          }
                        >
                          <Link2 className='size-3.5' />
                          Open link
                        </Button>
                      )}
                      {a.attachment && (
                        <Button
                          variant='outline'
                          className='h-7 gap-1 rounded-[6px] px-2'
                          onClick={() =>
                            toast.info('Downloads aren’t available in this demo')
                          }
                        >
                          <Paperclip className='size-3.5' />
                          {a.attachment}
                        </Button>
                      )}
                      {a.kind === 'Vacancy' && (
                        <Button
                          className='h-7 gap-1 rounded-[6px] px-2'
                          disabled={enrolled}
                          onClick={() => store.enroll(a.id, employee.name)}
                        >
                          <Briefcase className='size-3.5' />
                          {enrolled ? 'Application submitted' : 'Apply for this vacancy'}
                        </Button>
                      )}
                      {a.kind === 'Event' && (
                        <Button
                          className='h-7 gap-1 rounded-[6px] px-2'
                          disabled={enrolled}
                          onClick={() => store.enroll(a.id, employee.name)}
                        >
                          <CalendarCheck className='size-3.5' />
                          {enrolled ? 'Enrolled' : 'Enroll'}
                        </Button>
                      )}
                      {a.kind !== 'General' && a.enrollments.length > 0 && (
                        <span className='text-paragraph-sm text-neutral-1000'>
                          {a.enrollments.length}{' '}
                          {a.kind === 'Vacancy'
                            ? `application${a.enrollments.length === 1 ? '' : 's'}`
                            : `enrolled: ${a.enrollments.join(', ')}`}
                        </span>
                      )}
                    </div>

                    {/* Comment on employee timelines from the announcement window (PDF #5) */}
                    <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
                      <p className='text-neutral-1600 mb-1.5 text-sm font-medium'>
                        Timeline comments ({a.comments.length})
                      </p>
                      {a.comments.length > 0 && (
                        <ul className='mb-2 space-y-1'>
                          {a.comments.map((c) => (
                            <li key={c.id} className='text-paragraph-sm'>
                              <span className='text-neutral-1600 font-medium'>
                                {c.author}
                              </span>{' '}
                              <span className='text-neutral-1000'>
                                ({dateFmt.format(new Date(c.at))})
                              </span>{' '}
                              <span className='text-neutral-1600'>{c.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className='flex items-center gap-2'>
                        <Input
                          value={commentDrafts[a.id] ?? ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [a.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              postComment(a)
                            }
                          }}
                          placeholder='Comment on the employee timeline…'
                          className='h-7 flex-1'
                        />
                        <Button
                          className='h-7 gap-1 rounded-[6px] px-2'
                          onClick={() => postComment(a)}
                        >
                          <Send className='size-3.5' />
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
