import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRole } from '@/context/role-context'
import { fmtDate, todayISO } from '../data/shared'
import { type TransferRequest } from '../data/transfers'
import { type TransfersStore } from '../hooks/use-transfers'
import { ApprovalSteps } from './approval-steps'
import { StatusBadge } from './badges'

interface TransferDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer: TransferRequest | null
  store: TransfersStore
}

/**
 * Transfer workspace: approval routing (incl. group-level step for
 * inter-company moves), downstream impact assessment and effective-date
 * processing with balance reconciliation.
 */
export function TransferDetailSheet({
  open,
  onOpenChange,
  transfer: t,
  store,
}: TransferDetailSheetProps) {
  const { hasRole } = useRole()
  if (!t) return null

  const isCompanyAdmin = hasRole('Company Admin')
  const isGroupAdmin = hasRole('Group Company Admin')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {t.employeeName} · {t.type}
            <StatusBadge status={t.status} />
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {t.employeeCode} · submitted {fmtDate(t.submittedOn)} · effective{' '}
            {fmtDate(t.effectiveDate)} · {t.reason}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          <section className='grid grid-cols-2 gap-2 text-sm'>
            <div className='rounded-[6px] border border-gray-200 px-3 py-2'>
              <p className='text-neutral-1000 text-xs'>Current assignment</p>
              <p>{t.fromDepartment}</p>
              <p>{t.fromLocation}</p>
              <p>{t.fromCompany}</p>
            </div>
            <div className='rounded-[6px] border border-gray-200 px-3 py-2'>
              <p className='text-neutral-1000 text-xs'>Destination</p>
              <p>{t.toDepartment}</p>
              <p>{t.toLocation}</p>
              <p>{t.toCompany}</p>
            </div>
          </section>
          {(t.status === 'pending-approval' || t.status === 'scheduled') && (
            <p className='text-neutral-1000 text-xs'>
              The current assignment remains unchanged until the transfer is
              approved and the effective date is reached.
            </p>
          )}
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Approval workflow</h3>
            <ApprovalSteps
              steps={t.approvals}
              disabled={t.status !== 'pending-approval'}
              canAct={(step) =>
                step.role === 'Group Admin' ? isGroupAdmin : isCompanyAdmin
              }
              onApprove={() => store.approveStep(t)}
              onReject={(note) => store.rejectStep(t, note)}
            />
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Downstream impact assessment
            </h3>
            <div className='space-y-2'>
              <div>
                <p className='text-neutral-1000 mb-1 text-xs font-medium'>
                  Assets
                </p>
                {t.impact.assets.length === 0 ? (
                  <p className='text-neutral-1000 text-xs'>No asset impact.</p>
                ) : (
                  t.impact.assets.map((a) => (
                    <p key={a} className='text-sm'>
                      • {a}
                    </p>
                  ))
                )}
              </div>
              <div>
                <p className='text-neutral-1000 mb-1 text-xs font-medium'>
                  Leave balances (balance engine)
                </p>
                {t.impact.leaveAdjustments.length === 0 ? (
                  <p className='text-neutral-1000 text-xs'>
                    No balance changes at destination.
                  </p>
                ) : (
                  t.impact.leaveAdjustments.map((l) => (
                    <div
                      key={l.leaveType}
                      className='mb-1 flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-1.5 text-sm'
                    >
                      <span>{l.leaveType}</span>
                      <span className='text-neutral-1000 text-xs'>
                        {l.before} → {l.after} · {l.note}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div>
                <p className='text-neutral-1000 mb-1 text-xs font-medium'>
                  Policy differences flagged
                </p>
                {t.impact.policyDiffs.length === 0 ? (
                  <p className='text-neutral-1000 text-xs'>
                    Policies match at the destination.
                  </p>
                ) : (
                  t.impact.policyDiffs.map((p) => (
                    <p key={p} className='text-sm'>
                      ⚑ {p}
                    </p>
                  ))
                )}
              </div>
              {t.balancesReconciled && (
                <Badge variant='completed'>
                  Balances reconciled to destination policy
                </Badge>
              )}
            </div>
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>Effective dating</h3>
            {t.status === 'scheduled' && (
              <>
                <p className='text-neutral-1000 text-xs'>
                  Approved and scheduled for {fmtDate(t.effectiveDate)}.{' '}
                  {t.effectiveDate > todayISO()
                    ? 'The new assignment activates automatically on that date.'
                    : 'The effective date has arrived — process it to activate the new assignment.'}
                </p>
                {isCompanyAdmin && (
                  <Button size='sm' onClick={() => store.processEffective(t)}>
                    Process effective date
                  </Button>
                )}
              </>
            )}
            {t.status === 'effective' && (
              <p className='text-neutral-1000 text-xs'>
                Effective since {fmtDate(t.effectiveDate)} — a new
                effective-dated assignment record was appended and the prior
                record retained (see Audit & Reports → Assignment history).
              </p>
            )}
            {t.status === 'pending-approval' && (
              <p className='text-neutral-1000 text-xs'>
                Effective date locks in once all approvals are granted.
              </p>
            )}
            {t.status === 'rejected' && (
              <p className='text-neutral-1000 text-xs'>
                Rejected — no assignment change was applied.
              </p>
            )}
          </section>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
