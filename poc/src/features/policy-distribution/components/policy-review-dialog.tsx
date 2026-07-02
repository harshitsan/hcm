import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { seedPolicies } from '../data/policies'
import { type Assignment } from '../data/distributions'
import { AckTypeBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

interface PolicyReviewDialogProps {
  assignment: Assignment | null
  onOpenChange: (open: boolean) => void
  onAcknowledge: (assignmentId: string) => void
}

/**
 * Full policy review interface. Required/Optional items need an explicit
 * confirmation checkbox before the acknowledge action unlocks; Read-Only
 * items are information-only with no acknowledgment button.
 */
export function PolicyReviewDialog({
  assignment,
  onOpenChange,
  onAcknowledge,
}: PolicyReviewDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const policy = assignment
    ? seedPolicies.find((p) => p.id === assignment.policyId)
    : null

  const close = (open: boolean) => {
    if (!open) setConfirmed(false)
    onOpenChange(open)
  }

  if (!assignment) return null
  const readOnly = assignment.ackType === 'Read-Only'
  const canAct =
    assignment.status === 'Pending' || assignment.status === 'Overdue'

  return (
    <Dialog open onOpenChange={close}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {assignment.policyTitle} · {assignment.policyVersion}
            <AckTypeBadge type={assignment.ackType} />
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Presented for information only — no acknowledgment is required.'
              : assignment.dueDate
                ? `Acknowledgment due by ${dateFmt.format(new Date(assignment.dueDate))}.`
                : 'No deadline applies to this item.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='border-grey-200 max-h-[320px] rounded-[6px] border bg-white p-4'>
          <div className='space-y-3'>
            {policy && (
              <p className='text-paragraph-sm text-neutral-1000'>
                {policy.category} · last updated{' '}
                {dateFmt.format(new Date(policy.lastUpdated))}
              </p>
            )}
            {(policy?.content ?? 'Policy content unavailable.')
              .split('\n\n')
              .map((para, i) => (
                <p key={i} className='text-neutral-1600 text-sm leading-6'>
                  {para}
                </p>
              ))}
          </div>
        </ScrollArea>

        {!readOnly && canAct && (
          <label className='flex items-start gap-2'>
            <Checkbox
              variant='blue'
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(!!v)}
              className='mt-0.5'
            />
            <span className='text-neutral-1600 text-sm'>
              I confirm that I have read and understood this policy in full.
              {assignment.ackType === 'Optional' &&
                ' (Optional — recommended but not enforced.)'}
            </span>
          </label>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => close(false)}>
            Close
          </Button>
          {!readOnly && canAct && (
            <Button
              disabled={!confirmed}
              onClick={() => {
                onAcknowledge(assignment.id)
                close(false)
              }}
            >
              Acknowledge policy
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
