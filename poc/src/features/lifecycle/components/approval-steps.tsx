import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { fmtDate, pendingStep, type ApprovalStep } from '../data/shared'
import { StatusBadge } from './badges'

interface ApprovalStepsProps {
  steps: ApprovalStep[]
  /** Whether the active role may act on the current pending step. */
  canAct: (step: ApprovalStep) => boolean
  onApprove: () => void
  onReject: (note: string) => void
  disabled?: boolean
}

/**
 * Ordered approval chain with act-on-current-step controls. The pending step
 * stays unapplied until every prior approver has acted (per approver graph).
 */
export function ApprovalSteps({
  steps,
  canAct,
  onApprove,
  onReject,
  disabled = false,
}: ApprovalStepsProps) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const current = pendingStep(steps)

  return (
    <div className='space-y-2'>
      {steps.map((step, i) => (
        <div
          key={`${step.role}-${i}`}
          className='flex items-center justify-between rounded-[6px] border border-gray-200 bg-white px-3 py-2'
        >
          <div className='flex min-w-0 flex-col'>
            <span className='text-neutral-1600 text-sm font-medium'>
              {i + 1}. {step.role}
            </span>
            <span className='text-neutral-1000 truncate text-xs'>
              {step.approver}
              {step.actedOn ? ` · ${fmtDate(step.actedOn)}` : ''}
              {step.note ? ` · “${step.note}”` : ''}
            </span>
          </div>
          <StatusBadge status={step.status} />
        </div>
      ))}

      {current && !disabled && canAct(current) && (
        <div className='space-y-2 pt-1'>
          {rejecting ? (
            <>
              <Textarea
                placeholder='Reason for rejection'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setRejecting(false)}
                >
                  Back
                </Button>
                <Button
                  size='sm'
                  className='bg-destructive hover:bg-destructive/90 text-white'
                  onClick={() => {
                    onReject(note || 'Rejected')
                    setRejecting(false)
                    setNote('')
                  }}
                >
                  Confirm rejection
                </Button>
              </div>
            </>
          ) : (
            <div className='flex gap-2'>
              <Button size='sm' onClick={onApprove}>
                Approve as {current.role}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setRejecting(true)}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
      {current && !disabled && !canAct(current) && (
        <p className='text-neutral-1000 text-xs'>
          Waiting on {current.role} ({current.approver}) — your role cannot act
          on this step.
        </p>
      )}
    </div>
  )
}
