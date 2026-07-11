import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Input } from '@/components/ui/input'
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
import { useRole } from '@/context/role-context'
import {
  experienceLetterBlocker,
  isFormalResignation,
  type ExitCase,
  type ExitCommentVisibility,
} from '../data/exits'
import { PERSONAS, fmtDate, todayISO } from '../data/shared'
import { type ExitsStore } from '../hooks/use-exits'
import { ExitApprovalPanel } from './exit-approval-panel'
import { ExitConditionsCard } from './exit-conditions-card'
import { ExitResignationForm } from './exit-resignation-form'
import { ExitStatusBadge } from './exit-status-badge'
import { ExitTaskAssignDialog } from './exit-task-assign-dialog'
import { StatusBadge } from './badges'

interface ExitDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exitCase: ExitCase | null
  store: ExitsStore
}

function noticeProgress(e: ExitCase) {
  const start = new Date(e.requestedOn).getTime()
  const end = new Date(e.lastWorkingDay).getTime()
  const now = new Date(todayISO()).getTime()
  if (end <= start) return 100
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
}

/**
 * Exit workspace: enable-exit lifecycle, LWD variants, approval + suggested
 * LWDs, exit conditions, clarification loop, parallel clearance, task
 * assignment, document tracking, comments with visibility and letters.
 */
export function ExitDetailSheet({
  open,
  onOpenChange,
  exitCase: e,
  store,
}: ExitDetailSheetProps) {
  const { role, hasRole } = useRole()
  const [resignOpen, setResignOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [disableReason, setDisableReason] = useState('')
  const [replyFor, setReplyFor] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentVis, setCommentVis] = useState<ExitCommentVisibility>('everyone')
  const [trackName, setTrackName] = useState('')
  const [trackWhen, setTrackWhen] = useState<'before-exit' | 'on-lwd'>('before-exit')
  const [supDocName, setSupDocName] = useState('')
  const [suspFrom, setSuspFrom] = useState('')
  const [suspTill, setSuspTill] = useState('')
  if (!e) return null

  const isAdmin = hasRole('Company Admin', 'Group Company Admin')
  const isEmployee = hasRole('Employee (User)')
  const actor = PERSONAS[role] ?? role
  const progress = noticeProgress(e)
  const outstanding = e.clearances.filter((c) => c.status !== 'cleared')
  const allApproved = e.approvals.every((s) => s.status === 'approved')
  const isSuspension = e.exitType === 'Suspension'
  const isResignation = isFormalResignation(e.exitType)
  const caseClosed = ['finalized', 'disabled', 'withdrawn', 'closed', 'rejected'].includes(
    e.status
  )
  const expBlocker = experienceLetterBlocker(e)

  const visibleComments = (e.comments ?? []).filter(
    (c) => !isEmployee || c.visibility === 'everyone'
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[600px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {e.employeeName} · Exit ({e.exitType})
            <ExitStatusBadge status={e.status} />
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {e.employeeCode} · {e.department} · {e.location} · requested{' '}
            {fmtDate(e.requestedOn)} · raised by {e.raisedBy}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          {/* Case banners */}
          {e.status === 'disabled' && (
            <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
              <p className='text-sm font-medium'>Exit disabled</p>
              <p className='text-neutral-1000 text-xs'>
                Reason: {e.disabledReason ?? '—'} · recorded in the audit trail.
              </p>
            </div>
          )}
          {e.isWithdrawalRequest && (
            <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
              <p className='text-sm font-medium'>Withdrawal request in progress</p>
              <p className='text-neutral-1000 text-xs'>
                The approved resignation is being withdrawn — the same approvers
                re-approve with all steps reset to pending.
              </p>
            </div>
          )}
          {e.revokeInProgress && (
            <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
              <p className='text-sm font-medium'>Revoke in progress</p>
              <p className='text-neutral-1000 text-xs'>
                Post-approval revoke — runs through the entire approval workflow
                again. All exit tasks were auto-closed and assignees notified.
              </p>
            </div>
          )}

          {/* Exit enabled — waiting on the resignation form */}
          {e.status === 'exit-enabled' && (
            <section className='space-y-2'>
              <h3 className='text-sm font-semibold'>Exit enabled — resignation form pending</h3>
              <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white px-3 py-3'>
                <p className='text-neutral-1000 text-xs'>
                  Resignation date {fmtDate(e.resignationDate)} · LWD as per
                  policy {fmtDate(e.policyLwd)} · requested LWD{' '}
                  {fmtDate(e.requestedLwd)}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {(isEmployee || isAdmin) && (
                    <Button size='sm' onClick={() => setResignOpen(true)}>
                      {isEmployee ? 'Fill resignation form' : 'Fill resignation form (proxy)'}
                    </Button>
                  )}
                  {isAdmin && !disabling && (
                    <Button size='sm' variant='outline' onClick={() => setDisabling(true)}>
                      Disable exit
                    </Button>
                  )}
                </div>
                {disabling && (
                  <div className='space-y-2'>
                    <Textarea
                      placeholder='Reason for disabling (mandatory)'
                      value={disableReason}
                      onChange={(ev) => setDisableReason(ev.target.value)}
                    />
                    <div className='flex gap-2'>
                      <Button size='sm' variant='outline' onClick={() => setDisabling(false)}>
                        Back
                      </Button>
                      <Button
                        size='sm'
                        className='bg-destructive hover:bg-destructive/90 text-white'
                        onClick={() => {
                          store.disableExit(e, disableReason)
                          setDisabling(false)
                          setDisableReason('')
                        }}
                      >
                        Confirm disable
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* LWD variants */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Last working day</h3>
            {isEmployee ? (
              <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
                {allApproved && e.approvedLwd ? (
                  <p className='text-sm'>
                    Approved LWD:{' '}
                    <span className='font-medium'>{fmtDate(e.approvedLwd)}</span>
                  </p>
                ) : (
                  <>
                    <p className='text-sm'>
                      Requested LWD:{' '}
                      <span className='font-medium'>
                        {fmtDate(e.requestedLwd ?? e.lastWorkingDay)}
                      </span>
                    </p>
                    <p className='text-neutral-1000 text-xs'>
                      The approved LWD becomes visible once every approval
                      completes.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
                <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
                  <span className='text-neutral-1000 text-xs'>Default (resignation + notice)</span>
                  <span>{fmtDate(e.defaultLwd ?? e.lastWorkingDay)}</span>
                  <span className='text-neutral-1000 text-xs'>LWD as per policy</span>
                  <span>{fmtDate(e.policyLwd ?? e.defaultLwd ?? e.lastWorkingDay)}</span>
                  <span className='text-neutral-1000 text-xs'>Requested by employee</span>
                  <span>{fmtDate(e.requestedLwd)}</span>
                  <span className='text-neutral-1000 text-xs'>Approved (final)</span>
                  <span className='font-medium'>{fmtDate(e.approvedLwd)}</span>
                </div>
                {(e.lwdRecommendations ?? []).length > 0 && (
                  <p className='text-neutral-1000 mt-2 text-xs'>
                    Recommended:{' '}
                    {(e.lwdRecommendations ?? [])
                      .map((r) => `${r.approver} (${r.role}) → ${fmtDate(r.lwd)}`)
                      .join(' · ')}{' '}
                    — the final approver's LWD wins within the same hierarchy.
                  </p>
                )}
              </div>
            )}
          </section>
          <Separator />

          {/* Suspension window */}
          {isSuspension && (
            <>
              <section className='space-y-2'>
                <h3 className='text-sm font-semibold'>Suspension</h3>
                <div className='space-y-2 rounded-[8px] border border-gray-200 bg-white px-3 py-3'>
                  <p className='text-sm'>
                    {fmtDate(e.suspensionFrom)} → {fmtDate(e.suspensionTill)}{' '}
                    <Badge variant='outline'>
                      {e.suspensionWithPay ? 'With pay' : 'Without pay'}
                    </Badge>
                  </p>
                  <p className='text-neutral-1000 text-xs'>
                    The employee loses HRMS access for the suspension window. No
                    amounts are computed — pay treatment is a label only.
                  </p>
                  {isAdmin && e.status === 'pending-approval' && (
                    <div className='flex items-end gap-2'>
                      <div className='flex-1'>
                        <p className='text-neutral-1000 mb-1 text-xs'>Adjust From</p>
                        <Input
                          type='date'
                          value={suspFrom || (e.suspensionFrom ?? '')}
                          onChange={(ev) => setSuspFrom(ev.target.value)}
                        />
                      </div>
                      <div className='flex-1'>
                        <p className='text-neutral-1000 mb-1 text-xs'>Adjust Till</p>
                        <Input
                          type='date'
                          value={suspTill || (e.suspensionTill ?? '')}
                          onChange={(ev) => setSuspTill(ev.target.value)}
                        />
                      </div>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() =>
                          store.adjustSuspension(
                            e,
                            suspFrom || (e.suspensionFrom ?? ''),
                            suspTill || (e.suspensionTill ?? '')
                          )
                        }
                      >
                        Save range
                      </Button>
                    </div>
                  )}
                  {isAdmin && e.status === 'approved' && !e.suspensionReview && (
                    <div className='space-y-1'>
                      <p className='text-xs font-medium'>Suspension review</p>
                      <div className='flex flex-wrap gap-2'>
                        <Button size='sm' onClick={() => store.reviewSuspension(e, 'revoked')}>
                          Revoke suspension
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => store.reviewSuspension(e, 'continued')}
                        >
                          Continue suspension
                        </Button>
                        <Button
                          size='sm'
                          className='bg-destructive hover:bg-destructive/90 text-white'
                          onClick={() => store.reviewSuspension(e, 'terminated')}
                        >
                          Terminate
                        </Button>
                      </div>
                    </div>
                  )}
                  {e.suspensionReview && (
                    <Badge variant='outline'>Review outcome: {e.suspensionReview}</Badge>
                  )}
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Termination-type extras */}
          {((e.policiesDeviated ?? []).length > 0 || e.abscondingDate) && (
            <>
              <section className='space-y-2'>
                <h3 className='text-sm font-semibold'>Case specifics</h3>
                <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2 text-sm'>
                  {(e.policiesDeviated ?? []).length > 0 && (
                    <p>
                      Policies deviated:{' '}
                      <span className='text-neutral-1000 text-xs'>
                        {(e.policiesDeviated ?? []).join(', ')}
                      </span>
                    </p>
                  )}
                  {e.abscondingDate && (
                    <p>
                      Absconding since:{' '}
                      <span className='text-neutral-1000 text-xs'>
                        {fmtDate(e.abscondingDate)}
                      </span>
                    </p>
                  )}
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Notice period */}
          {!isSuspension && e.noticePeriodDays > 0 && (
            <>
              <section className='space-y-2'>
                <h3 className='text-sm font-semibold'>Notice period</h3>
                <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>
                      {e.noticePeriodDays} days · last working day{' '}
                      {fmtDate(e.lastWorkingDay)}
                    </span>
                    <span className='text-neutral-1000 text-xs'>
                      {progress}% served
                    </span>
                  </div>
                  <div className='bg-neutral-2000 mt-2 h-1.5 w-full rounded-full'>
                    <div
                      className='bg-blue-1400 h-1.5 rounded-full'
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Approvals */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Exit approval workflow
              {e.isWithdrawalRequest && ' (withdrawal re-approval)'}
              {e.revokeInProgress && ' (revoke re-approval)'}
            </h3>
            <ExitApprovalPanel exitCase={e} store={store} actor={actor} canAct={isAdmin} />
            <div className='flex flex-wrap gap-2'>
              {e.status === 'pending-approval' &&
                !e.isWithdrawalRequest &&
                !e.revokeInProgress &&
                (isEmployee || isAdmin) && (
                  <Button size='sm' variant='outline' onClick={() => store.withdrawExit(e)}>
                    Withdraw request
                  </Button>
                )}
              {e.status === 'approved' && isResignation && (isEmployee || isAdmin) && (
                <Button size='sm' variant='outline' onClick={() => store.requestWithdrawal(e)}>
                  Withdraw resignation (re-approval)
                </Button>
              )}
              {(e.status === 'approved' || e.status === 'clearance-in-progress') &&
                isAdmin && (
                  <Button size='sm' variant='outline' onClick={() => store.revokeExit(e)}>
                    Revoke exit (full re-approval)
                  </Button>
                )}
              {e.status === 'approved' && isAdmin && !isSuspension && (
                <Button size='sm' onClick={() => store.initiateClearance(e)}>
                  Initiate parallel clearance
                </Button>
              )}
            </div>
          </section>
          <Separator />

          {/* Clarification loop */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Clarifications</h3>
            {(e.clarifications ?? []).length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No clarification requests. Approvers can raise one from the
                approval step (“Need Clarification”).
              </p>
            ) : (
              (e.clarifications ?? []).map((c) => {
                const canReply =
                  c.reply === null &&
                  (isEmployee ? c.askedTo === e.employeeName : isAdmin)
                return (
                  <div
                    key={c.id}
                    className='space-y-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'
                  >
                    <p className='text-sm'>
                      <span className='font-medium'>{c.askedBy}</span>{' '}
                      <span className='text-neutral-1000 text-xs'>
                        asked {c.askedTo} on {fmtDate(c.askedOn)}
                      </span>
                    </p>
                    <p className='text-sm'>“{c.question}”</p>
                    {c.reply ? (
                      <p className='text-neutral-1000 rounded-[6px] border border-gray-200 px-2 py-1 text-xs'>
                        {c.askedTo} replied on {fmtDate(c.repliedOn)}: “{c.reply}”
                      </p>
                    ) : canReply ? (
                      replyFor === c.id ? (
                        <div className='space-y-2'>
                          <Textarea
                            placeholder='Your clarification reply'
                            value={replyText}
                            onChange={(ev) => setReplyText(ev.target.value)}
                          />
                          <div className='flex gap-2'>
                            <Button size='sm' variant='outline' onClick={() => setReplyFor(null)}>
                              Back
                            </Button>
                            <Button
                              size='sm'
                              onClick={() => {
                                store.replyClarification(e, c.id, replyText)
                                setReplyFor(null)
                                setReplyText('')
                              }}
                            >
                              Send reply
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setReplyFor(c.id)
                            setReplyText('')
                          }}
                        >
                          Clarify{!isEmployee && ` (as ${c.askedTo})`}
                        </Button>
                      )
                    ) : (
                      <p className='text-neutral-1000 text-xs'>Awaiting reply from {c.askedTo}.</p>
                    )}
                  </div>
                )
              })
            )}
          </section>
          <Separator />

          {/* Exit conditions (hidden from employee until fully approved) */}
          <ExitConditionsCard
            exitCase={e}
            store={store}
            actor={actor}
            canManage={isAdmin && !caseClosed}
            isEmployeeView={isEmployee}
          />
          {(!isEmployee || allApproved) && <Separator />}

          {/* Clearance */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Functional clearance (parallel)
            </h3>
            {e.clearances.map((c) => (
              <div
                key={c.functionName}
                className='flex items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='text-sm font-medium'>
                    {c.functionName}{' '}
                    <span className='text-neutral-1000 text-xs'>
                      owner: {c.owner}
                    </span>
                  </p>
                  {c.note && (
                    <p className='text-neutral-1000 truncate text-xs'>{c.note}</p>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <StatusBadge status={c.status} />
                  {e.status === 'clearance-in-progress' &&
                    c.status !== 'cleared' &&
                    isAdmin && (
                      <>
                        <Button
                          size='sm'
                          onClick={() =>
                            store.setClearance(e, c.functionName, 'cleared', null)
                          }
                        >
                          Clear
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            store.setClearance(
                              e,
                              c.functionName,
                              'rejected',
                              'Items pending with the employee'
                            )
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                </div>
              </div>
            ))}
            {outstanding.length > 0 && e.status === 'clearance-in-progress' && (
              <p className='text-neutral-1000 text-xs'>
                Outstanding: {outstanding.map((c) => `${c.functionName} (${c.owner})`).join(', ')}
              </p>
            )}
            {e.status === 'clearance-in-progress' && isAdmin && (
              <Button size='sm' onClick={() => store.finalizeExit(e)}>
                Finalize exit
              </Button>
            )}
            {e.status === 'finalized' && (
              <div className='space-y-2'>
                <Badge variant='completed'>
                  Exit closed — completion recorded in the audit trail
                </Badge>
                {isAdmin && (
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' onClick={() => store.issueLetter(e, 'Relieving Letter')}>
                      Generate Relieving Letter
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => store.issueLetter(e, 'Experience Letter')}
                    >
                      Generate Experience Letter
                    </Button>
                  </div>
                )}
                {isAdmin && expBlocker && (
                  <p className='text-neutral-1000 text-xs'>{expBlocker}</p>
                )}
              </div>
            )}
          </section>
          <Separator />

          {/* Offboarding tasks */}
          <section className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-semibold'>
                Offboarding tasks (LWD-relative)
              </h3>
              {isAdmin && !caseClosed && (
                <Button size='sm' variant='outline' onClick={() => setAssignOpen(true)}>
                  Assign task
                </Button>
              )}
            </div>
            {e.tasks.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No tasks generated for this exit type.
              </p>
            ) : (
              e.tasks.map((t) => (
                <label
                  key={t.id}
                  className='flex items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'
                >
                  <span className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={t.done}
                      disabled={!isAdmin || e.status === 'finalized'}
                      onCheckedChange={() => store.toggleTask(e, t.id)}
                      variant='blue'
                    />
                    <span>
                      {t.name}
                      {t.description && (
                        <span className='text-neutral-1000 block text-xs'>
                          {t.description}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className='text-neutral-1000 text-xs'>
                    {t.owner} · {t.due}
                  </span>
                </label>
              ))
            )}
          </section>
          <Separator />

          {/* Document tracking */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Documents to collect</h3>
            {(e.trackedDocuments ?? []).length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No documents tracked for collection on this case.
              </p>
            ) : (
              (e.trackedDocuments ?? []).map((d) => (
                <div
                  key={d.id}
                  className='flex items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{d.name}</p>
                    <p className='text-neutral-1000 text-xs'>
                      collect {d.collectWhen === 'before-exit' ? 'before exit' : 'on LWD'}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <StatusBadge status={d.status === 'submitted' ? 'submitted' : 'pending'} />
                    {isAdmin && !caseClosed && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => store.toggleTrackedDocument(e, d.id)}
                      >
                        Mark {d.status === 'pending' ? 'submitted' : 'pending'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isAdmin && !caseClosed && (
              <div className='flex items-center gap-2'>
                <Input
                  placeholder='Document name'
                  value={trackName}
                  onChange={(ev) => setTrackName(ev.target.value)}
                />
                <Select
                  value={trackWhen}
                  onValueChange={(v) => setTrackWhen(v as 'before-exit' | 'on-lwd')}
                >
                  <SelectTrigger variant='secondary' className='w-[150px] shrink-0'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='before-exit'>Before exit</SelectItem>
                    <SelectItem value='on-lwd'>On LWD</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size='sm'
                  variant='outline'
                  className='shrink-0'
                  disabled={!trackName.trim()}
                  onClick={() => {
                    store.addTrackedDocument(e, trackName, trackWhen)
                    setTrackName('')
                  }}
                >
                  Track
                </Button>
              </div>
            )}
          </section>
          <Separator />

          {/* Supporting documents + HR-only message */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Supporting documents</h3>
            {(e.supportingDocuments ?? []).length === 0 ? (
              <p className='text-neutral-1000 text-xs'>No supporting documents attached.</p>
            ) : (
              (e.supportingDocuments ?? []).map((d) => (
                <div
                  key={d.id}
                  className='flex items-center justify-between rounded-[8px] border border-gray-200 bg-white px-3 py-2 text-sm'
                >
                  <span className='truncate'>{d.name}</span>
                  <span className='text-neutral-1000 shrink-0 text-xs'>
                    {d.uploadedBy} · {fmtDate(d.uploadedOn)}
                  </span>
                </div>
              ))
            )}
            {(isEmployee || isAdmin) && !caseClosed && (
              <div className='flex items-center gap-2'>
                <Input
                  placeholder='File name to attach'
                  value={supDocName}
                  onChange={(ev) => setSupDocName(ev.target.value)}
                />
                <Button
                  size='sm'
                  variant='outline'
                  className='shrink-0'
                  disabled={!supDocName.trim()}
                  onClick={() => {
                    store.addCaseDocument(e, supDocName, actor)
                    setSupDocName('')
                  }}
                >
                  Attach
                </Button>
              </div>
            )}
            {!isEmployee && e.messageToHr && (
              <div className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
                <p className='text-neutral-1000 text-xs font-medium'>
                  Message to HR (visible to HR only)
                </p>
                <p className='text-sm'>“{e.messageToHr}”</p>
              </div>
            )}
          </section>
          <Separator />

          {/* Questionnaire */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Exit questionnaire</h3>
            {e.questionnaire.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No questionnaire configured for this exit type (or the
                questionnaire process is disabled).
              </p>
            ) : (
              <>
                {e.questionnaire.map((q) => (
                  <div key={q.questionId} className='space-y-1'>
                    <p className='text-sm'>
                      {q.question}
                      {q.mandatory && <span className='text-destructive'> *</span>}
                      <span className='text-neutral-1000 text-xs'>
                        {' '}
                        · {q.responder}
                      </span>
                    </p>
                    {e.questionnaireSubmitted ? (
                      <p className='text-neutral-1000 rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'>
                        {q.answer ?? '—'}
                      </p>
                    ) : (
                      <Input
                        value={q.answer ?? ''}
                        disabled={!(isEmployee || isAdmin)}
                        placeholder='Your answer'
                        onChange={(ev) =>
                          store.answerQuestion(e.id, q.questionId, ev.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
                {!e.questionnaireSubmitted && (isEmployee || isAdmin) && (
                  <Button size='sm' onClick={() => store.submitQuestionnaire(e)}>
                    Submit questionnaire
                  </Button>
                )}
                {e.questionnaireSubmitted && (
                  <Badge variant='completed'>
                    Responses recorded — available to HR for exit analysis
                  </Badge>
                )}
              </>
            )}
          </section>
          <Separator />

          {/* Comments */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Comments</h3>
            {visibleComments.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>No comments yet.</p>
            ) : (
              visibleComments.map((c) => (
                <div
                  key={c.id}
                  className='rounded-[8px] border border-gray-200 bg-white px-3 py-2'
                >
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium'>{c.author}</p>
                    <span className='text-neutral-1000 text-xs'>
                      {fmtDate(c.on)}
                      {!isEmployee && c.visibility === 'hr-managers' && ' · HR & managers only'}
                    </span>
                  </div>
                  <p className='text-sm'>{c.text}</p>
                </div>
              ))
            )}
            {(isEmployee || isAdmin) && (
              <div className='space-y-2'>
                <Textarea
                  placeholder='Add a comment'
                  value={commentText}
                  onChange={(ev) => setCommentText(ev.target.value)}
                />
                <div className='flex items-center gap-2'>
                  {isAdmin && (
                    <Select
                      value={commentVis}
                      onValueChange={(v) => setCommentVis(v as ExitCommentVisibility)}
                    >
                      <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='everyone'>Visible to everyone</SelectItem>
                        <SelectItem value='hr-managers'>HR &amp; managers only</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size='sm'
                    disabled={!commentText.trim()}
                    onClick={() => {
                      store.addComment(
                        e,
                        actor,
                        commentText,
                        isAdmin ? commentVis : 'everyone'
                      )
                      setCommentText('')
                    }}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        <ExitResignationForm
          open={resignOpen}
          onOpenChange={setResignOpen}
          exitCase={e}
          onSubmit={(input) => store.submitResignation(e, input)}
        />
        <ExitTaskAssignDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onAssign={(input) => store.assignTask(e, input)}
        />
      </FloatingSheetContent>
    </Sheet>
  )
}
