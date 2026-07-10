import { useState } from 'react'
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
import { fmtDate, pendingStep } from '../data/shared'
import { isFormalResignation, type ExitCase } from '../data/exits'
import { type ExitsStore } from '../hooks/use-exits'
import { StatusBadge } from './badges'

interface ExitApprovalPanelProps {
  exitCase: ExitCase
  store: ExitsStore
  /** Persona name of the signed-in viewer (used for on-behalf approvals). */
  actor: string
  /** Whether the viewer may act on the current pending step. */
  canAct: boolean
}

/**
 * Exit approval chain with per-step suggested LWD, approve-on-behalf,
 * clarification requests and the no-reject rule for formal resignations.
 */
export function ExitApprovalPanel({
  exitCase: e,
  store,
  actor,
  canAct,
}: ExitApprovalPanelProps) {
  const [rejecting, setRejecting] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [lwdDraft, setLwdDraft] = useState('')
  const [clarifying, setClarifying] = useState(false)
  const [clarifyTo, setClarifyTo] = useState(e.employeeName)
  const [clarifyQuestion, setClarifyQuestion] = useState('')

  const current = pendingStep(e.approvals)
  const actionable = e.status === 'pending-approval' && current !== null && canAct
  const recs = e.lwdRecommendations ?? []
  const currentRec = current
    ? recs.find((r) => r.approver === current.approver) ?? null
    : null
  const onBehalf = current !== null && actor !== current.approver
  const noReject = isFormalResignation(e.exitType) && !e.isWithdrawalRequest && !e.revokeInProgress

  const participants = [
    e.employeeName,
    ...e.approvals.map((s) => s.approver),
  ].filter((p, i, arr) => arr.indexOf(p) === i && p !== actor)

  return (
    <div className='space-y-2'>
      {e.approvals.map((step, i) => {
        const rec = recs.find((r) => r.approver === step.approver)
        return (
          <div
            key={`${step.role}-${i}`}
            className='flex items-center justify-between rounded-[8px] border border-gray-200 bg-white px-3 py-2'
          >
            <div className='flex min-w-0 flex-col'>
              <span className='text-neutral-1600 text-sm font-medium'>
                {i + 1}. {step.role}
              </span>
              <span className='text-neutral-1000 truncate text-xs'>
                {step.approver}
                {step.actedOn ? ` · ${fmtDate(step.actedOn)}` : ''}
                {rec ? ` · suggested LWD ${fmtDate(rec.lwd)}` : ''}
                {step.note ? ` · “${step.note}”` : ''}
              </span>
            </div>
            <StatusBadge status={step.status} />
          </div>
        )
      })}

      {actionable && current && (
        <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white px-3 py-3'>
          {/* Suggested LWD — required before this approver can add conditions */}
          <div className='flex items-end gap-2'>
            <div className='flex-1'>
              <p className='text-neutral-1000 mb-1 text-xs'>
                Suggested LWD for the {current.role} step
                {currentRec ? ` (current: ${fmtDate(currentRec.lwd)})` : ''}
              </p>
              <Input
                type='date'
                value={lwdDraft}
                onChange={(ev) => setLwdDraft(ev.target.value)}
              />
            </div>
            <Button
              size='sm'
              variant='outline'
              disabled={!lwdDraft}
              onClick={() => {
                store.suggestLwd(e, lwdDraft)
                setLwdDraft('')
              }}
            >
              Suggest LWD
            </Button>
          </div>

          {rejecting ? (
            <>
              <Textarea
                placeholder='Reason for rejection'
                value={rejectNote}
                onChange={(ev) => setRejectNote(ev.target.value)}
              />
              <div className='flex gap-2'>
                <Button size='sm' variant='outline' onClick={() => setRejecting(false)}>
                  Back
                </Button>
                <Button
                  size='sm'
                  className='bg-destructive hover:bg-destructive/90 text-white'
                  onClick={() => {
                    store.rejectStep(e, rejectNote || 'Rejected')
                    setRejecting(false)
                    setRejectNote('')
                  }}
                >
                  Confirm rejection
                </Button>
              </div>
            </>
          ) : clarifying ? (
            <>
              <Select value={clarifyTo} onValueChange={setClarifyTo}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Ask clarification from…' />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                      {p === e.employeeName ? ' (employee)' : ' (workflow participant)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder='What needs clarification?'
                value={clarifyQuestion}
                onChange={(ev) => setClarifyQuestion(ev.target.value)}
              />
              <div className='flex gap-2'>
                <Button size='sm' variant='outline' onClick={() => setClarifying(false)}>
                  Back
                </Button>
                <Button
                  size='sm'
                  onClick={() => {
                    store.askClarification(e, actor, clarifyTo, clarifyQuestion)
                    setClarifying(false)
                    setClarifyQuestion('')
                  }}
                >
                  Send clarification request
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className='flex flex-wrap gap-2'>
                <Button size='sm' onClick={() => store.approveStep(e, actor)}>
                  {onBehalf
                    ? `Approve on behalf of ${current.approver}`
                    : `Approve as ${current.role}`}
                </Button>
                {!noReject && (
                  <Button size='sm' variant='outline' onClick={() => setRejecting(true)}>
                    Reject
                  </Button>
                )}
                <Button size='sm' variant='outline' onClick={() => setClarifying(true)}>
                  Need Clarification
                </Button>
              </div>
              {noReject && (
                <p className='text-neutral-1000 text-xs'>
                  A formal resignation cannot be rejected — discuss withdrawal
                  with the employee instead.
                </p>
              )}
              {onBehalf && (
                <p className='text-neutral-1000 text-xs'>
                  You are not the assigned approver — the step will be recorded
                  as “Approved by {actor} on behalf of {current.approver}”.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {e.status === 'pending-approval' && current && !canAct && (
        <p className='text-neutral-1000 text-xs'>
          Waiting on {current.role} ({current.approver}) — your role cannot act
          on this step.
        </p>
      )}
    </div>
  )
}
