import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { useRole } from '@/context/role-context'
import { type LayoffBatch } from '../data/layoffs'
import { fmtDate } from '../data/shared'
import { type LayoffsStore } from '../hooks/use-layoffs'
import { ApprovalSteps } from './approval-steps'
import { StatusBadge } from './badges'

interface LayoffDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: LayoffBatch | null
  store: LayoffsStore
}

/**
 * Layoff batch workspace — included employees, the location-approver routing
 * chain, withdraw before final approval and exit recording once approved.
 */
export function LayoffDetailSheet({
  open,
  onOpenChange,
  batch: b,
  store,
}: LayoffDetailSheetProps) {
  const { hasRole } = useRole()
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  if (!b) return null

  const canAct = hasRole('Company Admin', 'Group Company Admin')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[560px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {b.name}
            <StatusBadge status={b.status} />
          </SheetTitle>
          <p className='text-neutral-1000 text-xs'>
            {b.id} · {b.location} · initiated {fmtDate(b.initiatedOn)} by{' '}
            {b.initiatedBy}
          </p>
        </SheetHeader>

        <div className='flex-1 space-y-5 overflow-y-auto px-5 py-5'>
          <section className='space-y-1'>
            <h3 className='text-sm font-semibold'>Reason</h3>
            <p className='text-neutral-1000 text-sm'>{b.reason}</p>
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Employees in this batch ({b.employees.length})
            </h3>
            {b.employees.map((e) => (
              <div
                key={e.code}
                className='flex items-center justify-between rounded-[6px] border border-gray-200 bg-white px-3 py-2'
              >
                <div className='flex min-w-0 flex-col'>
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {e.name}
                  </span>
                  <span className='text-neutral-1000 text-xs'>
                    {e.code} · {e.department}
                  </span>
                </div>
                <Badge variant='outline'>{e.positionLevel}</Badge>
              </div>
            ))}
          </section>
          <Separator />

          <section className='space-y-2'>
            <h3 className='text-sm font-semibold'>
              Approval workflow (location approver)
            </h3>
            <ApprovalSteps
              steps={b.approvals}
              disabled={b.status !== 'pending-approval'}
              canAct={() => canAct}
              onApprove={() => store.approveStep(b)}
              onReject={(note) => store.rejectStep(b, note)}
            />
          </section>

          {b.status === 'pending-approval' && (
            <section className='space-y-2'>
              <Separator />
              <Button
                size='sm'
                variant='outline'
                onClick={() => setConfirmWithdraw(true)}
              >
                Withdraw batch
              </Button>
              <p className='text-neutral-1000 text-xs'>
                Withdrawing releases the reserved headcount back to{' '}
                {b.location}.
              </p>
            </section>
          )}

          {b.status === 'approved' && (
            <section className='space-y-2'>
              <Separator />
              <Button size='sm' onClick={() => store.recordExits(b)}>
                Record exits ({b.employees.length})
              </Button>
              <p className='text-neutral-1000 text-xs'>
                Opens an exit case with exit type “Layoff” for every employee
                in the batch — track them on the Exits tab.
              </p>
            </section>
          )}

          {b.status === 'exited' && (
            <p className='text-neutral-1000 text-xs'>
              Exit cases were opened for all {b.employees.length} employee(s) —
              clearance and finalization continue on the Exits tab.
            </p>
          )}
        </div>

        <ConfirmDialog
          open={confirmWithdraw}
          onOpenChange={setConfirmWithdraw}
          title='Withdraw layoff batch?'
          desc={`All ${b.employees.length} employee(s) in “${b.name}” will be removed from layoff processing and the headcount released.`}
          confirmText='Withdraw'
          destructive
          handleConfirm={() => {
            store.withdrawBatch(b)
            setConfirmWithdraw(false)
            onOpenChange(false)
          }}
        />
      </FloatingSheetContent>
    </Sheet>
  )
}
