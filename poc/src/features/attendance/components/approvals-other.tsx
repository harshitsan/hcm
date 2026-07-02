import { Button } from '@/components/ui/button'
import { employeeName, fmtDate, fmtHours } from '../data/shared'
import { type RequestsStore } from '../hooks/use-requests'
import { StatusBadge } from './badges'

function ActionButtons({
  status,
  onDecide,
}: {
  status: string
  onDecide: (approve: boolean) => void
}) {
  if (status !== 'pending') return null
  return (
    <span className='inline-flex gap-1.5'>
      <Button variant='outline' className='h-6 px-2 text-xs' onClick={() => onDecide(false)}>
        Reject
      </Button>
      <Button className='h-6 px-2 text-xs' onClick={() => onDecide(true)}>
        Approve
      </Button>
    </span>
  )
}

/**
 * Comp off (TNA-33), out time (TNA-36) and WFH (TNA-38) approver decisions —
 * approvals update balances/attendance and notify the requester.
 */
export function ApprovalsOther({ requests }: { requests: RequestsStore }) {
  return (
    <div className='w-full space-y-5'>
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Comp Off Requests ({requests.compOff.length})
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>Comp off date</th>
                <th className='px-2 font-medium'>Days</th>
                <th className='px-2 font-medium'>Earned from</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.compOff.map((c) => (
                <tr key={c.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{employeeName(c.employeeId)}</td>
                  <td className='px-2'>{fmtDate(c.compOffDate)}</td>
                  <td className='px-2'>{c.days}</td>
                  <td className='text-neutral-1000 px-2'>{c.earnedFrom}</td>
                  <td className='px-2'>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className='px-2 text-right'>
                    <ActionButtons
                      status={c.status}
                      onDecide={(a) => requests.decideCompOff(c.id, a)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Out Time Requests ({requests.outTime.length})
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>Type</th>
                <th className='px-2 font-medium'>From → To</th>
                <th className='px-2 font-medium'>Hours</th>
                <th className='px-2 font-medium'>Policy</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.outTime.map((o) => (
                <tr key={o.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{employeeName(o.employeeId)}</td>
                  <td className='px-2'>{o.type}</td>
                  <td className='px-2'>
                    {o.fromDateTime.replace('T', ' ')} → {o.toDateTime.replace('T', ' ')}
                  </td>
                  <td className='px-2'>{fmtHours(o.hours)}</td>
                  <td className='text-destructive px-2 text-xs'>{o.policyNote ?? '—'}</td>
                  <td className='px-2'>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className='px-2 text-right'>
                    <ActionButtons
                      status={o.status}
                      onDecide={(a) => requests.decideOutTime(o.id, a)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Work From Home Requests ({requests.wfh.length})
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Employee</th>
                <th className='px-2 font-medium'>From → To</th>
                <th className='px-2 font-medium'>Days / Hours</th>
                <th className='px-2 font-medium'>Policy</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 text-right font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.wfh.map((w) => (
                <tr key={w.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{employeeName(w.employeeId)}</td>
                  <td className='px-2'>
                    {fmtDate(w.fromDate)} → {fmtDate(w.toDate)}
                  </td>
                  <td className='px-2'>
                    {w.days} / {fmtHours(w.hours)}
                  </td>
                  <td className='text-destructive px-2 text-xs'>{w.policyNote ?? '—'}</td>
                  <td className='px-2'>
                    <StatusBadge status={w.status} />
                  </td>
                  <td className='px-2 text-right'>
                    <ActionButtons
                      status={w.status}
                      onDecide={(a) => requests.decideWfh(w.id, a)}
                    />
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
