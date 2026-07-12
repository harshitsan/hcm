import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { type ChangeRequest } from '../data/profile'
import { type ProfileStore } from '../hooks/use-profile'
import { StatusBadge } from './status-badge'
import { formatDate } from './utils'

interface ChangeApprovalsTabProps {
  profile: ProfileStore
}

interface PendingDecision {
  request: ChangeRequest
  action: 'approve' | 'reject'
}

/**
 * Company Admin approvals queue for sensitive profile edits: each pending
 * change request shows the old value, the requested value and the employee's
 * reason. Approving applies the new value to the profile record; rejecting
 * keeps the old value. Every decision is recorded in the audit trail.
 */
export function ChangeApprovalsTab({ profile }: ChangeApprovalsTabProps) {
  const [decision, setDecision] = useState<PendingDecision | null>(null)
  const [comment, setComment] = useState('')

  const pending = useMemo(
    () =>
      profile.changeRequests.filter((cr) => cr.status === 'Pending approval'),
    [profile.changeRequests]
  )
  const decided = useMemo(
    () =>
      profile.changeRequests.filter((cr) => cr.status !== 'Pending approval'),
    [profile.changeRequests]
  )

  const openDecision = (request: ChangeRequest, action: 'approve' | 'reject') => {
    setComment('')
    setDecision({ request, action })
  }

  const confirmDecision = () => {
    if (!decision) return
    if (decision.action === 'approve') {
      profile.approveChange(decision.request.id, comment.trim())
    } else {
      profile.rejectChange(decision.request.id, comment.trim())
    }
    setDecision(null)
    setComment('')
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Edits to sensitive profile fields land here instead of writing
          directly to the record. Approving applies the requested value;
          rejecting keeps the current value. Both outcomes notify the employee
          and are recorded in the audit trail.
        </p>
        <Badge variant='pending'>{pending.length} awaiting review</Badge>
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50'>
              <TableHead>Field</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Current value → requested value</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-neutral-1000 py-6 text-center text-sm'>
                  No pending change requests — sensitive-field edits will queue
                  here for review.
                </TableCell>
              </TableRow>
            )}
            {pending.map((cr) => (
              <TableRow key={cr.id}>
                <TableCell className='font-medium'>{cr.fieldLabel}</TableCell>
                <TableCell>{cr.requestedBy}</TableCell>
                <TableCell className='max-w-[280px]'>
                  <span className='text-neutral-1000 line-through'>
                    {cr.currentValue}
                  </span>{' '}
                  <span className='font-medium'>{cr.requestedValue}</span>
                </TableCell>
                <TableCell className='text-paragraph-sm text-neutral-1000 max-w-[220px]'>
                  {cr.reason || '—'}
                </TableCell>
                <TableCell>{formatDate(cr.submittedOn)}</TableCell>
                <TableCell>
                  <span className='flex gap-2'>
                    <Button
                      className='h-6 rounded-[6px] px-2 text-xs'
                      onClick={() => openDecision(cr, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant='outline'
                      className='h-6 rounded-[6px] px-2 text-xs'
                      onClick={() => openDecision(cr, 'reject')}
                    >
                      Reject
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className='text-paragraph-sm text-neutral-1000 mb-2 font-medium'>
          Decided requests
        </h3>
        <div className='rounded-md border bg-white'>
          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50'>
                <TableHead>Field</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Decided by</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decided.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='text-neutral-1000 py-6 text-center text-sm'>
                    No decided requests yet.
                  </TableCell>
                </TableRow>
              )}
              {decided.map((cr) => (
                <TableRow key={cr.id}>
                  <TableCell className='font-medium'>{cr.fieldLabel}</TableCell>
                  <TableCell>{cr.requestedBy}</TableCell>
                  <TableCell className='text-paragraph-sm max-w-[260px]'>
                    {cr.currentValue} → {cr.requestedValue}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={cr.status} />
                  </TableCell>
                  <TableCell className='text-paragraph-sm'>
                    {cr.decidedBy ?? '—'}
                    {cr.decidedOn ? ` · ${formatDate(cr.decidedOn)}` : ''}
                  </TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000 max-w-[220px]'>
                    {cr.decisionComment ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open) setDecision(null)
        }}
        title={
          decision?.action === 'approve'
            ? `Approve change to ${decision.request.fieldLabel}?`
            : `Reject change to ${decision?.request.fieldLabel}?`
        }
        desc={
          decision ? (
            <div className='space-y-1'>
              <p>
                {decision.request.currentValue} →{' '}
                <span className='font-medium'>
                  {decision.request.requestedValue}
                </span>
              </p>
              <p>
                {decision.action === 'approve'
                  ? 'The requested value will be applied to the profile record.'
                  : 'The profile record will keep its current value.'}
              </p>
            </div>
          ) : (
            ''
          )
        }
        confirmText={
          decision?.action === 'approve' ? 'Approve change' : 'Reject change'
        }
        destructive={decision?.action === 'reject'}
        handleConfirm={confirmDecision}
      >
        <div className='space-y-1'>
          <label
            htmlFor='decision-comment'
            className='text-paragraph-sm text-neutral-1000'
          >
            Comment for the employee (optional)
          </label>
          <Textarea
            id='decision-comment'
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder='e.g. Verified against the supporting document'
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
