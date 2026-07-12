import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { useRole } from '@/context/role-context'
import { type ProbationDecisionTable } from '../data/config'
import {
  D6_NOTE,
  PROBATION_OUTCOMES,
  employmentStatus,
  type ProbationCase,
  type ProbationOutcome,
} from '../data/probation'
import { fmtDate } from '../data/shared'
import { deriveOutcome, type ProbationStore } from '../hooks/use-probation'
import { ApprovalSteps } from './approval-steps'
import { StatusBadge } from './badges'

interface ProbationDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  probationCase: ProbationCase | null
  store: ProbationStore
  decisionTable: ProbationDecisionTable
}

/**
 * Confirmation review workspace: criteria scoring against the effective
 * decision table, exactly-one-outcome decision, Manager → Department Head →
 * HR approval routing and peer-review evidence.
 */
export function ProbationDetailSheet({
  open,
  onOpenChange,
  probationCase: c,
  store,
  decisionTable,
}: ProbationDetailSheetProps) {
  const { hasRole } = useRole()
  const [outcome, setOutcome] = useState<ProbationOutcome | ''>('')
  const [extendOpen, setExtendOpen] = useState(false)
  const [extendMonths, setExtendMonths] = useState('3')
  const [extendReason, setExtendReason] = useState('')
  const [separationOpen, setSeparationOpen] = useState(false)
  const [separationReason, setSeparationReason] = useState('')
  const [gateOpen, setGateOpen] = useState(false)
  if (!c) return null

  // Open disciplinary case gating this employee's confirmation, if any.
  const gate = store.confirmationGate(c)

  const submitOutcome = () => {
    if (outcome === '') return
    if (outcome === 'Confirm' && gate) {
      setGateOpen(true)
      return
    }
    if (outcome === 'Extend') {
      setExtendReason('')
      setExtendMonths('3')
      setExtendOpen(true)
    } else if (outcome === 'Initiate Separation') {
      setSeparationReason('')
      setSeparationOpen(true)
    } else {
      store.submitDecision(c, outcome)
    }
  }

  const isAdmin = hasRole('Company Admin')
  const editable = isAdmin && (c.status === 'pending' || c.status === 'in-review')
  const suggested = deriveOutcome(c, decisionTable)
  const peerFeedback = store.peerReviews.filter(
    (r) => r.employeeName === c.employeeName
  )
  const periodicHistory = store.periodicReviews.filter(
    (r) => r.employeeName === c.employeeName
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex flex-wrap items-center gap-2 font-semibold'>
            {c.employeeName} · Confirmation review
            <StatusBadge status={c.status} />
            <StatusBadge status={employmentStatus(c)} />
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {c.employeeCode} · {c.department} · {c.positionLevel} · due{' '}
            {fmtDate(c.dueDate)} · decision table {c.decisionTableVersion}
            {c.extendedTo && ` · extended to ${fmtDate(c.extendedTo)}`}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          {c.status === 'pending' && isAdmin && (
            <Button size='sm' onClick={() => store.startReview(c)}>
              Initiate confirmation review
            </Button>
          )}

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Evaluation criteria</h3>
            <div className='space-y-2'>
              {c.criteria.map((cr) => (
                <div
                  key={cr.id}
                  className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <span className='text-sm'>{cr.label}</span>
                  <Select
                    value={cr.score === null ? '' : String(cr.score)}
                    onValueChange={(v) => store.setScore(c.id, cr.id, Number(v))}
                    disabled={!editable || c.status === 'pending'}
                  >
                    <SelectTrigger variant='secondary' className='h-7 w-[90px]'>
                      <SelectValue placeholder='Score' />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} / 5
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <p className='text-neutral-1000 text-xs'>
              Rules engine suggestion (decision table {decisionTable.version}):{' '}
              <span className='font-semibold'>
                {suggested ?? 'score all criteria to derive'}
              </span>
            </p>
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Decision</h3>
            {gate && (
              <div className='rounded-[6px] border border-amber-300 bg-amber-50 p-3'>
                <p className='text-sm font-medium text-amber-900'>
                  Confirmation gated — open disciplinary case
                </p>
                <p className='mt-0.5 text-xs text-amber-800'>
                  {c.employeeName} has an open disciplinary case ({gate.id} ·{' '}
                  {gate.actionType}). Confirm stays blocked until that case is
                  resolved on the Disciplinary tab — Extend remains available in
                  the meantime.
                </p>
              </div>
            )}
            {c.status === 'in-review' && isAdmin ? (
              <div className='flex items-center gap-2'>
                <Select
                  value={outcome}
                  onValueChange={(v) => setOutcome(v as ProbationOutcome)}
                >
                  <SelectTrigger variant='secondary' className='w-[220px]'>
                    <SelectValue placeholder='Select exactly one outcome' />
                  </SelectTrigger>
                  <SelectContent>
                    {PROBATION_OUTCOMES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size='sm' disabled={outcome === ''} onClick={submitOutcome}>
                  Submit for approval
                </Button>
              </div>
            ) : (
              <p className='text-neutral-1000 text-sm'>
                {c.decision
                  ? `Selected outcome: ${c.decision}${
                      c.status === 'pending-approval'
                        ? ' — routed for approval, not yet applied'
                        : ''
                    }`
                  : 'No decision submitted yet.'}
              </p>
            )}
            {c.outcomeReason && (
              <p className='text-neutral-1000 text-xs'>
                Outcome reason: {c.outcomeReason}
              </p>
            )}
            <p className='text-neutral-1000 text-xs'>
              Outcomes with a pay implication notify payroll computation (D6) —
              display-only in this POC.
            </p>
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Approval hierarchy (Manager → Department Head → HR)
            </h3>
            <ApprovalSteps
              steps={c.approvals}
              disabled={c.status !== 'pending-approval'}
              canAct={() => isAdmin}
              onApprove={() => store.approveStep(c)}
              onReject={(note) => store.rejectStep(c, note)}
            />
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Peer feedback</h3>
            {peerFeedback.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No peer reviews requested for this employee yet.
              </p>
            ) : (
              peerFeedback.map((r) => (
                <div
                  key={r.id}
                  className='rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>{r.reviewer}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className='text-neutral-1000 text-xs'>
                    {r.feedback ?? 'Awaiting submission'}
                  </p>
                </div>
              ))
            )}
          </section>

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Record history</h3>
            {c.history.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No activity recorded on this confirmation yet.
              </p>
            ) : (
              <div className='space-y-1.5'>
                {c.history.map((h) => (
                  <div
                    key={h.id}
                    className={`rounded-[6px] border px-3 py-2 ${
                      h.payroll
                        ? 'border-blue-200 bg-blue-150'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <p className='text-sm'>{h.text}</p>
                      <span className='text-neutral-1000 shrink-0 text-xs'>
                        {fmtDate(h.date)}
                      </span>
                    </div>
                    {h.payroll && (
                      <p className='text-neutral-1000 text-xs'>
                        Display-only note — {D6_NOTE}.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Periodic review history</h3>
            {periodicHistory.length === 0 ? (
              <p className='text-neutral-1000 text-xs'>
                No interim reviews recorded during this probation.
              </p>
            ) : (
              periodicHistory.map((r) => (
                <div
                  key={r.id}
                  className='rounded-[6px] border border-gray-200 px-3 py-2'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      {fmtDate(r.periodFrom)} → {fmtDate(r.periodTo)}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className='text-neutral-1000 text-xs'>
                    {r.notes ?? 'In progress'}
                  </p>
                </div>
              ))
            )}
          </section>
        </div>

        {/* Extend outcome — extension length + reason */}
        <Dialog
          open={extendOpen}
          onOpenChange={(dialogOpen) => {
            if (!dialogOpen) setExtendOpen(false)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend probation · {c.employeeName}</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <div className='space-y-1'>
                <Label>Extension length</Label>
                <Select value={extendMonths} onValueChange={setExtendMonths}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m} month{m === '1' ? '' : 's'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Reason for extension</Label>
                <Textarea
                  placeholder='Why is more time needed before confirmation?'
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                />
              </div>
              <p className='text-neutral-1000 text-xs'>
                The employee stays on Probation with a new end date once the
                approval chain completes; a fresh evaluation cycle is
                scheduled.
              </p>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setExtendOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!extendReason.trim()) {
                    toast.error('A reason is required to extend probation')
                    return
                  }
                  store.submitDecision(c, 'Extend', {
                    extensionMonths: Number(extendMonths),
                    reason: extendReason.trim(),
                  })
                  setExtendOpen(false)
                }}
              >
                Submit extension
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Initiate Separation outcome — confirmation + reason */}
        <ConfirmDialog
          open={separationOpen}
          onOpenChange={(dialogOpen) => {
            if (!dialogOpen) setSeparationOpen(false)
          }}
          destructive
          title={`Initiate separation · ${c.employeeName}`}
          desc='This routes an “Initiate Separation” outcome through the approval chain. On final approval a Probation Separation exit case is opened in the Exits workflow and payroll computation (D6) is notified — computation stays out of scope in this POC.'
          confirmText='Initiate Separation'
          disabled={separationReason.trim() === ''}
          handleConfirm={() => {
            store.submitDecision(c, 'Initiate Separation', {
              reason: separationReason.trim(),
            })
            setSeparationOpen(false)
          }}
        >
          <div className='space-y-1'>
            <Label>Reason for separation</Label>
            <Textarea
              placeholder='Required — recorded on the case history and audit trail'
              value={separationReason}
              onChange={(e) => setSeparationReason(e.target.value)}
            />
          </div>
        </ConfirmDialog>

        {/* Confirm blocked — open disciplinary case explanation */}
        <ConfirmDialog
          open={gateOpen}
          onOpenChange={(dialogOpen) => {
            if (!dialogOpen) setGateOpen(false)
          }}
          title='Confirmation gated — open disciplinary case'
          desc={
            gate
              ? `${c.employeeName} has an open disciplinary case (${gate.id} · ${gate.actionType}, initiated ${fmtDate(gate.initiatedOn)}). Confirmation cannot proceed while the case is open. Resolve the case on the Disciplinary tab to release this gate — extending probation remains available in the meantime.`
              : 'The disciplinary case has been resolved — you can submit the Confirm outcome now.'
          }
          confirmText='Understood'
          handleConfirm={() => setGateOpen(false)}
        />
      </FloatingSheetContent>
    </Sheet>
  )
}
