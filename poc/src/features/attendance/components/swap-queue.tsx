import { Button } from '@/components/ui/button'
import { employeeName, fmtDate } from '../data/shared'
import { type ShiftsStore } from '../hooks/use-shifts'
import { StatusBadge } from './badges'

/**
 * Shift-swap approval queue (TNA-14). Shared between the Shifts & Rosters tab
 * and Approvals → Swaps & Overtime so there is exactly ONE queue: a decision
 * made in either place updates the same store. Swaps are never applied
 * directly — approving flips both employees' roster for that day.
 */
export function SwapQueue({
  shifts,
  pendingOnly = false,
}: {
  shifts: ShiftsStore
  /** Show only requests still waiting on a decision. */
  pendingOnly?: boolean
}) {
  const visible = pendingOnly
    ? shifts.swaps.filter((s) => s.status === 'pending')
    : shifts.swaps

  if (visible.length === 0) {
    return (
      <p className='text-paragraph-sm text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-4'>
        No shift swap requests waiting for a decision.
      </p>
    )
  }

  return (
    <div className='space-y-3'>
      {visible.map((s) => (
        <div key={s.id} className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <p className='text-sm font-medium'>
                {employeeName(s.requesterId)} ({shifts.shiftName(s.requesterShiftId)}) ⇄{' '}
                {employeeName(s.counterpartyId)} ({shifts.shiftName(s.counterpartyShiftId)})
                {' · '}
                {fmtDate(s.date)}
              </p>
              <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
                Submitted {fmtDate(s.submittedOn)} — “{s.reason}”
                {s.decidedBy && ` · decided by ${s.decidedBy}: ${s.decisionNote}`}
              </p>
              {s.status === 'pending' && (
                <p className='text-neutral-1000 pt-1 text-xs'>
                  The roster stays unchanged until this request is approved;
                  approving swaps the two assignments for {fmtDate(s.date)}.
                </p>
              )}
              {s.warning && (
                <p className='text-destructive pt-1 text-xs font-medium'>
                  Warning: {s.warning}
                </p>
              )}
            </div>
            <div className='flex flex-col items-end gap-2'>
              <StatusBadge status={s.status} />
              {s.status === 'pending' && (
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    className='h-7 text-xs'
                    onClick={() =>
                      shifts.decideSwap(s.id, false, 'Coverage would be short that day')
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    className='h-7 text-xs'
                    onClick={() => shifts.decideSwap(s.id, true, 'Roster updated')}
                  >
                    {s.warning ? 'Approve Despite Warning' : 'Approve Swap'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
