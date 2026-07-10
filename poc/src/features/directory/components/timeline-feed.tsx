import { useState } from 'react'
import { ChatCircle, Paperclip } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  eventTypeColor,
  type CommentVisibility,
  type TimelineComment,
  type TimelineEvent,
} from '../data/timeline'
import { type AddCommentInput } from '../hooks/use-timeline'

interface TimelineFeedProps {
  events: TimelineEvent[]
  /** Comments already filtered for the viewer's visibility. */
  getComments: (eventId: string) => TimelineComment[]
  onAddComment: (eventId: string, input: AddCommentInput) => void
  emptyText?: string
}

/**
 * Vertical chronological feed: one colored dot per configured event type
 * (color codes come from the Employees timeline configuration), each event
 * expandable into its comment thread + composer.
 */
export function TimelineFeed({
  events,
  getComments,
  onAddComment,
  emptyText = 'No timeline events to show.',
}: TimelineFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (events.length === 0) {
    return <p className='text-neutral-1000 text-sm'>{emptyText}</p>
  }

  return (
    <ol>
      {events.map((event, index) => {
        const comments = getComments(event.id)
        const expanded = expandedId === event.id
        return (
          <li key={event.id} className='relative flex gap-3'>
            <div className='flex flex-col items-center'>
              <span
                className='mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white shadow-sm'
                style={{ backgroundColor: eventTypeColor(event.eventType) }}
                aria-hidden
              />
              {index < events.length - 1 && (
                <span className='w-px flex-1 bg-gray-200' />
              )}
            </div>

            <div className='min-w-0 flex-1 pb-5'>
              <div className='flex flex-wrap items-baseline gap-x-2'>
                <span className='text-neutral-1600 text-sm font-medium'>
                  {event.eventType}
                </span>
                <span className='text-neutral-1000 text-xs'>{event.date}</span>
              </div>
              <p className='text-neutral-1900 mt-0.5 text-sm'>
                {event.description}
              </p>

              <button
                type='button'
                className='text-blue-1400 mt-1.5 inline-flex items-center gap-1 text-xs font-medium hover:underline'
                onClick={() => setExpandedId(expanded ? null : event.id)}
              >
                <ChatCircle size={13} weight='bold' />
                {comments.length} comment{comments.length === 1 ? '' : 's'}
                {expanded ? ' — hide' : ''}
              </button>

              {expanded && (
                <div className='mt-2 space-y-3 rounded-[6px] border border-gray-200 bg-white p-3'>
                  {comments.length === 0 ? (
                    <p className='text-neutral-1000 text-xs'>
                      No comments yet — be the first to comment.
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className='rounded-[6px] bg-neutral-100 px-3 py-2'
                        >
                          <div className='flex flex-wrap items-center gap-1.5'>
                            <span className='text-neutral-1600 text-xs font-medium'>
                              {c.author}
                            </span>
                            <span className='text-neutral-1000 text-xs'>
                              · {c.createdOn}
                            </span>
                            {c.visibility === 'private' && (
                              <Badge variant='pending' className='px-1.5 py-0 text-[10px]'>
                                Private
                              </Badge>
                            )}
                          </div>
                          <p className='text-neutral-1900 mt-0.5 text-sm'>
                            {c.text}
                          </p>
                          {c.attachmentName && (
                            <p className='text-neutral-1000 mt-1 inline-flex items-center gap-1 text-xs'>
                              <Paperclip size={12} weight='bold' />
                              {c.attachmentName}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <CommentComposer
                    onSubmit={(input) => onAddComment(event.id, input)}
                  />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function CommentComposer({
  onSubmit,
}: {
  onSubmit: (input: AddCommentInput) => void
}) {
  const [text, setText] = useState('')
  const [visibility, setVisibility] = useState<CommentVisibility>('public')
  const [attachmentName, setAttachmentName] = useState('')

  const submit = () => {
    if (!text.trim()) return
    onSubmit({
      text,
      visibility,
      attachmentName: attachmentName.trim() || undefined,
    })
    setText('')
    setVisibility('public')
    setAttachmentName('')
  }

  return (
    <div className='space-y-2 border-t border-gray-100 pt-3'>
      <Textarea
        placeholder='Write a comment…'
        value={text}
        onChange={(e) => setText(e.target.value)}
        className='min-h-[64px] text-sm'
      />
      <div className='flex flex-wrap items-center gap-2'>
        <Select
          value={visibility}
          onValueChange={(v) => setVisibility(v as CommentVisibility)}
        >
          <SelectTrigger variant='secondary' className='h-8 w-[120px] text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='public'>Public</SelectItem>
            <SelectItem value='private'>Private</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder='Attachment file name (optional)'
          value={attachmentName}
          onChange={(e) => setAttachmentName(e.target.value)}
          className='h-8 flex-1 text-xs sm:min-w-[180px]'
        />
        <Button
          className='h-8 px-3 text-xs'
          disabled={!text.trim()}
          onClick={submit}
        >
          Comment
        </Button>
      </div>
    </div>
  )
}
