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
import { toast } from 'sonner'
import { fmtDate, todayISO } from '../data/shared'
import { pendingStep, type LeaveRequest } from '../data/requests'
import { type FmlaReason } from '../data/config'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { FmlaBadge, LopBadge, StatusBadge, TentativeBadge } from './badges'

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

/**
 * Request detail: applicant context, workflow levels, full history and
 * role-gated actions (LVE-12/15/30/39).
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
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [fmlaReason, setFmlaReason] = useState('')

  if (!r) return null
  const step = pendingStep(r.steps)
  const rejectionOptions = fmlaReasons.filter((x) => x.kind === 'rejection')

  const doReject = () => {
    if (!rejectReason.trim()) {
      toast.error('A rejection reason is mandatory')
      return
    }
    if (r.fmla && !fmlaReason) {
      toast.error('FMLA requests must use a configured rejection reason')
      return
    }
    store.reject(r.id, rejectReason, r.fmla ? fmlaReason : null)
    setRejecting(false)
    setRejectReason('')
    setFmlaReason('')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[520px]'>
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {r.typeName} · {r.employeeName}
            <StatusBadge status={r.status} />
            {r.tentative && <TentativeBadge />}
            {r.fmla && <FmlaBadge />}
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
              <span className='text-neutral-1000 block text-xs'>Dates</span>
              {fmtDate(r.from)} → {fmtDate(r.to)}
              {r.fromTime && r.toTime && ` (${r.fromTime}–${r.toTime})`}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Amount</span>
              <span className='flex items-center gap-1.5'>
                {r.amount} {r.unit}
                {r.lopAmount > 0 && <LopBadge amount={r.lopAmount} unit={r.unit} />}
              </span>
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Current balance</span>
              {remainingFor(r.employeeId, r.typeId)} {r.unit}
            </div>
            <div>
              <span className='text-neutral-1000 block text-xs'>Submitted</span>
              {fmtDate(r.submittedOn)}
              {r.onBehalfOf && ` · recorded by ${r.onBehalfOf}`}
            </div>
          </div>

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

          {(r.notifyPeers.length > 0 || r.notifyEmails.length > 0) && (
            <div>
              <span className='text-neutral-1000 block text-xs'>Notified peers</span>
              {[...r.notifyPeers, ...r.notifyEmails].join(', ')}
            </div>
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

          {rejecting && (
            <div className='space-y-3 rounded-[6px] border border-red-200 p-3'>
              {r.fmla && (
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
                <Label>Rejection reason (mandatory)</Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder='Tell the applicant why'
                />
              </div>
              <div className='flex justify-end gap-2'>
                <Button variant='outline' size='sm' onClick={() => setRejecting(false)}>
                  Back
                </Button>
                <Button
                  size='sm'
                  className='bg-destructive hover:bg-destructive/90 text-white'
                  onClick={doReject}
                >
                  Confirm rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className='border-grey-200 flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4'>
          {canApprove && r.status === 'pending' && step && !rejecting && (
            <>
              <Button
                size='sm'
                onClick={() => {
                  store.approve(r.id, asSupervisor)
                  onOpenChange(false)
                }}
              >
                Approve ({step.name})
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='text-destructive'
                onClick={() => setRejecting(true)}
              >
                Reject…
              </Button>
              <Button size='sm' variant='outline' onClick={() => store.escalate(r.id)}>
                Escalate (SLA)
              </Button>
            </>
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
                onOpenChange(false)
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
          <Button size='sm' variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
