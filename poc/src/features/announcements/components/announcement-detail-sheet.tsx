import { useState } from 'react'
import { toast } from 'sonner'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { type Announcement } from '../data/announcements'
import { type AnnouncementsStore } from '../hooks/use-announcements'
import { targetingSummary } from '../utils/audience'
import {
  ACTION_LABELS,
  availableActions,
  type WorkflowAction,
} from '../utils/workflow'
import { StatusBadge, TypeBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

interface AnnouncementDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: Announcement | null
  store: AnnouncementsStore
}

/**
 * Row-click detail sheet: full announcement record, enrollments/comments,
 * the bitemporal history timeline (ANN-16), and the decision footer — the
 * lifecycle action dropdown with a mandatory comment retained on the history
 * line (ANN-24..29), replacing the old toolbar-only workflow dropdown.
 */
export function AnnouncementDetailSheet({
  open,
  onOpenChange,
  announcement: a,
  store,
}: AnnouncementDetailSheetProps) {
  const { role } = useRole()
  const [action, setAction] = useState<WorkflowAction | ''>('')
  const [comment, setComment] = useState('')

  if (!a) return null
  const actions = availableActions(a, role)

  const close = () => {
    setAction('')
    setComment('')
    onOpenChange(false)
  }

  const submitDecision = () => {
    if (!action) {
      toast.error('Select an action from the dropdown')
      return
    }
    if (!comment.trim()) {
      toast.error('Comments are mandatory before submitting')
      return
    }
    store.runAction(a.id, action, comment.trim())
    setAction('')
    setComment('')
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex flex-wrap items-center gap-2 font-semibold'>
            {a.title}
            <StatusBadge status={a.status} />
            <TypeBadge type={a.type} />
            {a.kind !== 'General' && (
              <Badge variant={a.kind === 'Vacancy' ? 'overdue' : 'open'}>
                {a.kind}
              </Badge>
            )}
            {a.hidden && <Badge variant='badge_inactive'>Hidden</Badge>}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5 text-sm'>
          <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
            <div>
              <span className='text-neutral-1000 block text-xs'>Publish date</span>
              {dateFmt.format(new Date(a.startDate))}
              {a.startTime && ` · ${a.startTime}`}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Expiry date</span>
              {a.endDate ? dateFmt.format(new Date(a.endDate)) : 'No expiry'}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Company</span>
              {a.tenant}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Created</span>
              {dateFmt.format(new Date(a.createdAt))} by {a.creator}
            </div>
            {a.type === 'Recurring' && (
              <div>
                <span className='text-neutral-1000 block text-xs'>Recurrence</span>
                {a.recurrencePattern}
                {a.eventBasis !== 'None' && ` · ${a.eventBasis}`}
              </div>
            )}
            {a.status === 'Pending approval' && a.pendingWith && (
              <div>
                <span className='text-neutral-1000 block text-xs'>Pending with</span>
                {a.pendingWith}
              </div>
            )}
            <div className='col-span-2'>
              <span className='text-neutral-1000 block text-xs'>Audience</span>
              {a.visibleToAll
                ? a.targeting.groups.length > 0
                  ? `All employees — groups: ${a.targeting.groups.join(', ')}`
                  : 'All employees'
                : targetingSummary(a.targeting)}
            </div>
            {a.notifyByEmail && (
              <div className='col-span-2'>
                <span className='text-neutral-1000 block text-xs'>
                  Email notification
                </span>
                {a.notifySubject || a.title}
              </div>
            )}
            {a.link && (
              <div className='col-span-2'>
                <span className='text-neutral-1000 block text-xs'>Hyperlink</span>
                {a.link}
              </div>
            )}
            {a.attachment && (
              <div className='col-span-2'>
                <span className='text-neutral-1000 block text-xs'>Attachment</span>
                {a.attachment}
              </div>
            )}
          </div>

          <div>
            <span className='text-neutral-1000 block text-xs'>Message</span>
            <p className='whitespace-pre-line'>{a.body}</p>
          </div>

          {a.enrollments.length > 0 && (
            <div>
              <span className='text-neutral-1000 block text-xs'>
                {a.kind === 'Vacancy' ? 'Applications' : 'Enrollments'} (
                {a.enrollments.length})
              </span>
              {a.enrollments.join(', ')}
            </div>
          )}

          {a.comments.length > 0 && (
            <div>
              <span className='text-neutral-1000 block text-xs'>
                Timeline comments ({a.comments.length})
              </span>
              <div className='space-y-1'>
                {a.comments.map((c) => (
                  <p key={c.id} className='text-xs'>
                    <span className='font-medium'>{c.author}</span>{' '}
                    <span className='text-neutral-1000'>
                      ({dateFmt.format(new Date(c.at))})
                    </span>{' '}
                    {c.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Bitemporal history — prior values retained, never overwritten (ANN-16) */}
          <div>
            <h3 className='text-neutral-1600 mb-2 font-medium'>History</h3>
            <div className='space-y-1.5'>
              {[...a.history].reverse().map((h, i) => (
                <div key={i} className='flex gap-2 text-xs'>
                  <span className='text-neutral-1000 shrink-0'>
                    {dateFmt.format(new Date(h.at))}
                  </span>
                  <span>{h.event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decision block: mandatory comment + action dropdown (ANN-24..29) */}
          {actions.length > 0 && (
            <div className='space-y-3 rounded-[6px] border border-gray-300 p-3'>
              <h3 className='text-neutral-1600 font-medium'>Decision</h3>
              <div className='space-y-1'>
                <Label>Comments (mandatory)</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder='Enter the comments required to submit this action'
                  rows={2}
                />
              </div>
              <div className='flex items-center justify-end gap-2'>
                <Select
                  value={action}
                  onValueChange={(v) => setAction(v as WorkflowAction)}
                >
                  <SelectTrigger variant='secondary' className='h-8 w-[190px]'>
                    <SelectValue placeholder='Select action' />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {ACTION_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size='sm'
                  disabled={!action || !comment.trim()}
                  onClick={submitDecision}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className='border-gray-200 flex items-center justify-end gap-2 border-t px-5 py-4'>
          <Button size='sm' variant='outline' onClick={close}>
            Close
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
