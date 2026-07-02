import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRole } from '@/context/role-context'
import { type ProbationDecisionTable } from '../data/config'
import {
  PROBATION_OUTCOMES,
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
  if (!c) return null

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
        <SheetHeader className='border-grey-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {c.employeeName} · Confirmation review
            <StatusBadge status={c.status} />
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
                <Button
                  size='sm'
                  disabled={outcome === ''}
                  onClick={() => {
                    if (outcome !== '') store.submitDecision(c, outcome)
                  }}
                >
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
      </FloatingSheetContent>
    </Sheet>
  )
}
