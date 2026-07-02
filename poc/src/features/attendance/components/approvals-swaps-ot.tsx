import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { employeeName, fmtDate, fmtHours } from '../data/shared'
import { type RequestsStore } from '../hooks/use-requests'
import { type ShiftsStore } from '../hooks/use-shifts'
import { OtBadge, StatusBadge } from './badges'

/**
 * Shift-swap decisions with conflict/statutory warnings (TNA-14) and
 * overtime authorization with the supervisor-cap escalation (TNA-10/30/31).
 */
export function ApprovalsSwapsOt({
  shifts,
  requests,
}: {
  shifts: ShiftsStore
  requests: RequestsStore
}) {
  return (
    <div className='w-full space-y-5'>
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Shift Swap Requests ({shifts.swaps.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            approving updates the roster for both employees and notifies them
          </span>
        </h3>
        <div className='space-y-3'>
          {shifts.swaps.map((s) => (
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
      </div>

      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Overtime Requests ({requests.overtime.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            approved overtime is marked authorized and released for payroll
          </span>
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>OT date</th>
                <th className='px-2 font-medium'>Recorded</th>
                <th className='px-2 font-medium'>Approved</th>
                <th className='px-2 font-medium'>Category</th>
                <th className='px-2 font-medium'>Routed to</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.overtime.map((o) => (
                <tr key={o.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{employeeName(o.employeeId)}</td>
                  <td className='px-2'>{fmtDate(o.date)}</td>
                  <td className='px-2'>{fmtHours(o.recordedHours)}</td>
                  <td className='px-2'>
                    {o.approvedHours !== null ? fmtHours(o.approvedHours) : '—'}
                  </td>
                  <td className='px-2'>
                    <OtBadge category={o.category} />
                  </td>
                  <td className='px-2'>
                    {o.approver}
                    {o.needsHigherApproval && (
                      <Badge variant='overdue' className='ml-1.5'>
                        Above cap
                      </Badge>
                    )}
                  </td>
                  <td className='px-2'>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className='px-2 text-right'>
                    {o.status === 'pending' && (
                      <span className='inline-flex gap-1.5'>
                        <Button
                          variant='outline'
                          className='h-6 px-2 text-xs'
                          onClick={() => requests.decideOvertime(o.id, false)}
                        >
                          Reject
                        </Button>
                        <Button
                          className='h-6 px-2 text-xs'
                          onClick={() => requests.decideOvertime(o.id, true)}
                        >
                          Approve
                        </Button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
