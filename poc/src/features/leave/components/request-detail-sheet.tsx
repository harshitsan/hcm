import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
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
import { toast } from 'sonner'
import { EMPLOYEES, fmtDate, rangesOverlap, todayISO } from '../data/shared'
import { pendingStep, type LeaveRequest } from '../data/requests'
import { type FmlaReason } from '../data/config'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import {
  ClarificationBadge,
  FmlaBadge,
  LopBadge,
  PeriodChangedBadge,
  StatusBadge,
  TentativeBadge,
} from './badges'

interface RequestDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: LeaveRequest | null
  store: LeaveRequestsStore
  remainingFor: (employeeId: string, typeId: string) => number
  fmlaReasons: FmlaReason[]
  /** The viewer can act on the pending approval level. */
  canApprove: boolean
  /** Approving as an immediate supervisor (LVE-44 limit applies). */
  asSupervisor: boolean
  /** The viewer owns this request (withdraw/cancel/confirm actions). */
  isOwner: boolean
  /** Admins can process pending cancellations. */
  isAdmin: boolean
}

/** Statuses that occupy the calendar for the "other employees" panel. */
const OCCUPYING = [
  'pending',
  'approved',
  'needs-clarification',
  'cancellation-requested',
]

type DecisionAction = 'approve' | 'reject' | 'clarify' | 'cancel'

/**
 * Request detail / approval screen per the Kensium PDF: applicant details
 * with the policy-document line, other employees on leave in the period +
 * available employees, the applicant's past time-off history, pending tasks
 * / KT tasks, approver document upload, the clarification Q&A thread, the
 * approver period-change action, and the mandatory comments + action
 * dropdown decision footer (LVE-12/15/30/39, ETOA-01…08, ETOR-NC).
 */
export function RequestDetailSheet({
  open,
  onOpenChange,
  request: r,
  store,
  remainingFor,
  fmlaReasons,
  canApprove,
  asSupervisor,
  isOwner,
  isAdmin,
}: RequestDetailSheetProps) {
  // Decision footer (comments are mandatory per the PDF).
  const [comment, setComment] = useState('')
  const [action, setAction] = useState<DecisionAction | ''>('')
  const [fmlaReason, setFmlaReason] = useState('')
  // Clarification answer box.
  const [answer, setAnswer] = useState('')
  // Change-period inline action.
  const [changingPeriod, setChangingPeriod] = useState(false)
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [periodNote, setPeriodNote] = useState('')
  // Approver document upload (fake file pick — name only).
  const [docName, setDocName] = useState('')

  if (!r) return null
  const step = pendingStep(r.steps)
  const approverView = canApprove || isAdmin
  const approverName = step?.approver ?? 'Approver'
  const rejectionOptions = fmlaReasons.filter((x) => x.kind === 'rejection')
  const openClarification = r.clarifications.find((c) => c.answer === null)

  // Approval context: overlapping requests from other employees + who is
  // still available to cover, and the applicant's own past history.
  const othersInPeriod = store.requests.filter(
    (x) =>
      x.id !== r.id &&
      x.employeeId !== r.employeeId &&
      OCCUPYING.includes(x.status) &&
      rangesOverlap(x.from, x.to, r.from, r.to)
  )
  const onLeaveIds = new Set(othersInPeriod.map((x) => x.employeeId))
  const availableEmployees = EMPLOYEES.filter(
    (e) => e.active && e.id !== r.employeeId && !onLeaveIds.has(e.id)
  )
  const pastHistory = store.requests
    .filter((x) => x.employeeId === r.employeeId && x.id !== r.id)
    .sort((a, b) => (a.from < b.from ? 1 : -1))
    .slice(0, 6)

  const close = () => {
    setComment('')
    setAction('')
    setFmlaReason('')
    setAnswer('')
    setChangingPeriod(false)
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
    switch (action) {
      case 'approve':
        store.approve(r.id, asSupervisor, comment.trim())
        break
      case 'reject':
        if (r.fmla && !fmlaReason) {
          toast.error('FMLA requests must use a configured rejection reason')
          return
        }
        store.reject(r.id, comment.trim(), r.fmla ? fmlaReason : null)
        break
      case 'clarify':
        store.askClarification(r.id, comment.trim(), approverName)
        break
      case 'cancel':
        if (r.status === 'approved') store.cancelApproved(r.id)
        else store.withdraw(r.id)
        break
    }
    close()
  }

  const submitPeriodChange = () => {
    if (!newFrom || !newTo || !periodNote.trim()) {
      toast.error('New From/To dates and a note are required')
      return
    }
    store.changePeriod(r.id, newFrom, newTo, periodNote.trim(), approverName)
    setChangingPeriod(false)
    setNewFrom('')
    setNewTo('')
    setPeriodNote('')
  }

  const decisionOptions: { value: DecisionAction; label: string }[] =
    r.status === 'approved'
      ? [{ value: 'cancel', label: 'Cancel Time Off' }]
      : [
          { value: 'approve', label: 'Approve' },
          { value: 'reject', label: 'Reject' },
          { value: 'clarify', label: 'Need clarification' },
          { value: 'cancel', label: 'Cancel' },
        ]
  const showDecision =
    canApprove &&
    ((r.status === 'pending' && !!step) ||
      (r.status === 'approved' && r.from > todayISO()))

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex flex-wrap items-center gap-2 font-semibold'>
            {r.typeName} · {r.employeeName}
            <StatusBadge status={r.status} />
            {r.tentative && <TentativeBadge />}
            {r.fmla && <FmlaBadge />}
            {r.periodChangedByApprover && <PeriodChangedBadge />}
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-5 py-5 text-sm'>
          <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
            <div>
              <span className='text-neutral-1000 block text-xs'>Applicant</span>
              {r.employeeName} ({r.employeeCode})
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Department / Location</span>
              {r.department} · {r.location}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Time Off period</span>
              {fmtDate(r.from)} → {fmtDate(r.to)}
              {r.fromTime && r.toTime && ` (${r.fromTime}–${r.toTime})`}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>No. of {r.unit}</span>
              <span className='flex items-center gap-1.5'>
                {r.amount} {r.unit}
                {r.lopAmount > 0 && <LopBadge amount={r.lopAmount} unit={r.unit} />}
              </span>
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Balance Time Off</span>
              {remainingFor(r.employeeId, r.typeId)} {r.unit}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Submitted</span>
              {fmtDate(r.submittedOn)}
              {r.onBehalfOf && ` · recorded by ${r.onBehalfOf}`}
            </div>
            {/* Tentative is display-only (disabled) while approving/rejecting/
                cancelling, per the PDF. */}
            <div>
              <span className='text-neutral-1000 block text-xs'>Tentative</span>
              <label className='text-neutral-1000 flex cursor-not-allowed items-center gap-1.5'>
                <input type='checkbox' checked={r.tentative} disabled readOnly />
                {r.tentative ? 'Yes' : 'No'} (locked during approval)
              </label>
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Policy document</span>
              <span className='flex items-center gap-1.5'>
                {r.typeName} policy
                <button
                  type='button'
                  className='text-blue-1400 cursor-pointer underline'
                  onClick={() =>
                    toast.info(`Opening the uploaded ${r.typeName} policy document…`)
                  }
                >
                  View policy
                </button>
              </span>
            </div>
          </div>

          {r.periodChangedByApprover && (
            <div className='rounded-[6px] border border-blue-200 bg-blue-50 p-3 text-xs'>
              <strong>Period changed by {r.periodChangedByApprover.changedBy}.</strong>{' '}
              Originally applied for {fmtDate(r.periodChangedByApprover.originalFrom)} →{' '}
              {fmtDate(r.periodChangedByApprover.originalTo)}. Note: “
              {r.periodChangedByApprover.note}”
            </div>
          )}

          <div>
            <span className='text-neutral-1000 block text-xs'>Reason</span>
            {r.reason}
            {r.tentativeReason && (
              <p className='text-orange-600'>Tentative: {r.tentativeReason}</p>
            )}
            {r.fmlaQualifyingReason && (
              <p className='text-blue-1400'>FMLA qualifying reason: {r.fmlaQualifyingReason}</p>
            )}
          </div>

          {(r.attachments?.length ?? 0) > 0 && (
            <div>
              <span className='text-neutral-1000 block text-xs'>
                Supporting documents
              </span>
              {r.attachments?.join(', ')}
            </div>
          )}

          {(r.notifyPeers.length > 0 || r.notifyEmails.length > 0) && (
            <div>
              <span className='text-neutral-1000 block text-xs'>
                Message to employees / to be notified
              </span>
              {[...r.notifyPeers, ...r.notifyEmails].join(', ')}
            </div>
          )}

          {/* Clarification Q&A thread (ETOR-NC) */}
          {(r.clarifications.length > 0 || r.status === 'needs-clarification') && (
            <>
              <Separator />
              <div>
                <h3 className='text-neutral-1600 mb-2 flex items-center gap-2 font-medium'>
                  Clarifications
                  <ClarificationBadge
                    count={r.clarifications.length}
                    open={!!openClarification}
                  />
                </h3>
                <div className='space-y-2'>
                  {r.clarifications.map((c, i) => (
                    <div
                      key={i}
                      className='space-y-1 rounded-[6px] border border-gray-200 px-3 py-2 text-xs'
                    >
                      <div>
                        <span className='text-neutral-1000'>
                          {c.askedBy} asked on {fmtDate(c.askedOn)}:
                        </span>{' '}
                        <span className='font-medium'>“{c.question}”</span>
                      </div>
                      {c.answer ? (
                        <div>
                          <span className='text-neutral-1000'>
                            Answered on {fmtDate(c.answeredOn)}:
                          </span>{' '}
                          “{c.answer}”
                        </div>
                      ) : (
                        <div className='text-vanilla-500'>Awaiting answer from the applicant.</div>
                      )}
                    </div>
                  ))}
                </div>
                {openClarification && (isOwner || approverView) && (
                  <div className='mt-2 space-y-2 rounded-[6px] border border-gray-200 p-3'>
                    <Label>
                      {isOwner
                        ? 'Your answer'
                        : 'Answer on behalf of the applicant'}
                    </Label>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder='Provide the clarification requested by the approver'
                      rows={2}
                    />
                    <div className='flex justify-end'>
                      <Button
                        size='sm'
                        disabled={!answer.trim()}
                        onClick={() => {
                          store.answerClarification(r.id, answer.trim())
                          setAnswer('')
                        }}
                      >
                        Submit clarification
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Approver-only context (visible to approvers and admins per PDF) */}
          {approverView && (
            <>
              <Separator />
              <div>
                <h3 className='text-neutral-1600 mb-2 font-medium'>
                  Time off of other employees in this period
                </h3>
                {othersInPeriod.length === 0 ? (
                  <p className='text-neutral-1000 text-xs'>
                    No other employee has applied for time off overlapping{' '}
                    {fmtDate(r.from)} → {fmtDate(r.to)}.
                  </p>
                ) : (
                  <div className='space-y-1.5'>
                    {othersInPeriod.map((x) => (
                      <div
                        key={x.id}
                        className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-xs'
                      >
                        <span>
                          <strong>{x.employeeName}</strong> · {x.typeName} ·{' '}
                          {fmtDate(x.from)} → {fmtDate(x.to)}
                        </span>
                        <StatusBadge status={x.status} />
                      </div>
                    ))}
                  </div>
                )}
                <p className='text-neutral-1000 mt-2 text-xs'>
                  <button
                    type='button'
                    className='text-blue-1400 cursor-pointer underline'
                    onClick={() =>
                      toast.info('Available employees list refreshed from the shift roster')
                    }
                  >
                    Available employees
                  </button>{' '}
                  during this period:{' '}
                  <span className='text-neutral-1600'>
                    {availableEmployees.map((e) => e.name).join(', ') || '—'}
                  </span>
                </p>
              </div>

              <div>
                <h3 className='text-neutral-1600 mb-2 font-medium'>
                  Past time off history — {r.employeeName}
                </h3>
                {pastHistory.length === 0 ? (
                  <p className='text-neutral-1000 text-xs'>No prior requests on record.</p>
                ) : (
                  <div className='space-y-1.5'>
                    {pastHistory.map((x) => (
                      <div
                        key={x.id}
                        className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-xs'
                      >
                        <span>
                          {x.typeName} · {fmtDate(x.from)} → {fmtDate(x.to)} ·{' '}
                          {x.amount} {x.unit}
                        </span>
                        <StatusBadge status={x.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <h3 className='text-neutral-1600 mb-2 font-medium'>Pending tasks</h3>
                  {r.pendingTasks.length === 0 ? (
                    <p className='text-neutral-1000 text-xs'>None recorded.</p>
                  ) : (
                    <ul className='list-disc space-y-1 pl-4 text-xs'>
                      {r.pendingTasks.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className='text-neutral-1600 mb-2 font-medium'>Pending KT tasks</h3>
                  {r.pendingKtTasks.length === 0 ? (
                    <p className='text-neutral-1000 text-xs'>None recorded.</p>
                  ) : (
                    <ul className='list-disc space-y-1 pl-4 text-xs'>
                      {r.pendingKtTasks.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <h3 className='text-neutral-1600 mb-2 font-medium'>Upload document</h3>
                {r.approverAttachments.length > 0 && (
                  <p className='mb-1.5 text-xs'>
                    Attached by approvers: {r.approverAttachments.join(', ')}
                  </p>
                )}
                <div className='flex items-center gap-2'>
                  <Input
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder='e.g. coverage-plan.pdf'
                    className='h-8'
                  />
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={!docName.trim()}
                    onClick={() => {
                      store.addApproverAttachment(r.id, docName.trim())
                      setDocName('')
                    }}
                  >
                    Attach
                  </Button>
                </div>
              </div>

              {/* ETOA-06: approver edits the applied period */}
              {['pending', 'needs-clarification'].includes(r.status) && (
                <div>
                  {!changingPeriod ? (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        setNewFrom(r.from)
                        setNewTo(r.to)
                        setChangingPeriod(true)
                      }}
                    >
                      Change period…
                    </Button>
                  ) : (
                    <div className='space-y-2 rounded-[6px] border border-gray-200 p-3'>
                      <Label>Change the applied Time Off period</Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          type='date'
                          value={newFrom}
                          onChange={(e) => setNewFrom(e.target.value)}
                          className='h-8'
                        />
                        <span className='text-neutral-1000 text-xs'>to</span>
                        <Input
                          type='date'
                          value={newTo}
                          onChange={(e) => setNewTo(e.target.value)}
                          className='h-8'
                        />
                      </div>
                      <Input
                        value={periodNote}
                        onChange={(e) => setPeriodNote(e.target.value)}
                        placeholder='Note to the applicant (mandatory)'
                        className='h-8'
                      />
                      <div className='flex justify-end gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setChangingPeriod(false)}
                        >
                          Cancel
                        </Button>
                        <Button size='sm' onClick={submitPeriodChange}>
                          Update period
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <Separator />

          <div>
            <h3 className='text-neutral-1600 mb-2 font-medium'>Approval workflow</h3>
            <div className='space-y-2'>
              {r.steps.map((s) => (
                <div
                  key={`${s.level}-${s.name}`}
                  className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='min-w-0'>
                    <div className='font-medium'>
                      L{s.level} · {s.name}{' '}
                      <span className='text-neutral-1000 text-xs'>
                        ({s.mode}
                        {s.mode === 'parallel' && `, ${s.rule} rule`}, SLA {s.slaHours}h)
                      </span>
                    </div>
                    <div className='text-neutral-1000 text-xs'>
                      {s.approver}
                      {s.delegatedFrom && ` — delegate for ${s.delegatedFrom}`}
                      {s.escalated && ' — escalated after SLA breach'}
                      {s.actedBy && ` · acted by ${s.actedBy} on ${fmtDate(s.actedOn)}`}
                      {s.note && ` · “${s.note}”`}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className='text-neutral-1600 mb-2 font-medium'>History</h3>
            <div className='space-y-1.5'>
              {r.history.map((h, i) => (
                <div key={i} className='text-xs'>
                  <span className='text-neutral-1000'>
                    {new Date(h.at).toLocaleString('en-GB')} · {h.actor}
                  </span>{' '}
                  — <strong>{h.action}</strong>: {h.detail}
                </div>
              ))}
            </div>
          </div>

          {/* Decision block: mandatory comments + action dropdown + Submit,
              matching the PDF's approval/rejection/clarification screens. */}
          {showDecision && (
            <div className='space-y-3 rounded-[6px] border border-gray-300 p-3'>
              <h3 className='text-neutral-1600 font-medium'>Decision</h3>
              {action === 'reject' && r.fmla && (
                <div className='space-y-1'>
                  <Label>Configured FMLA rejection reason</Label>
                  <Select value={fmlaReason} onValueChange={setFmlaReason}>
                    <SelectTrigger variant='secondary' className='w-full'>
                      <SelectValue placeholder='Select a rejection reason' />
                    </SelectTrigger>
                    <SelectContent>
                      {rejectionOptions.map((x) => (
                        <SelectItem key={x.id} value={x.reason}>
                          {x.fmlaType}: {x.reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className='space-y-1'>
                <Label>Comments (mandatory)</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    action === 'clarify'
                      ? 'Type the question to send back to the applicant'
                      : 'Enter the comments required to submit this action'
                  }
                  rows={2}
                />
              </div>
              <div className='flex items-center justify-end gap-2'>
                <Select
                  value={action}
                  onValueChange={(v) => setAction(v as DecisionAction)}
                >
                  <SelectTrigger variant='secondary' className='h-8 w-[190px]'>
                    <SelectValue placeholder='Select action' />
                  </SelectTrigger>
                  <SelectContent>
                    {decisionOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
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

        <div className='border-gray-200 flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4'>
          {canApprove && r.status === 'pending' && step && (
            <Button size='sm' variant='outline' onClick={() => store.escalate(r.id)}>
              Escalate (SLA)
            </Button>
          )}
          {isAdmin && r.status === 'cancellation-requested' && (
            <Button size='sm' onClick={() => store.processCancellation(r.id)}>
              Process cancellation
            </Button>
          )}
          {isOwner && r.tentative && ['pending', 'approved'].includes(r.status) && (
            <Button size='sm' variant='outline' onClick={() => store.confirmTentative(r.id)}>
              Confirm tentative
            </Button>
          )}
          {isOwner && r.status === 'pending' && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                store.withdraw(r.id)
                close()
              }}
            >
              Withdraw
            </Button>
          )}
          {isOwner && r.status === 'approved' && r.from > todayISO() && (
            <Button size='sm' variant='outline' onClick={() => store.cancelApproved(r.id)}>
              Cancel leave
            </Button>
          )}
          <Button size='sm' variant='outline' onClick={close}>
            Close
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
