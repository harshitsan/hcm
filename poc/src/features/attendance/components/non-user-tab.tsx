import { Info } from 'phosphor-react'
import { EMPLOYEES, fmtDate, fmtHours } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'
import { type RequestsStore } from '../hooks/use-requests'
import { SourceBadge, StatusBadge } from './badges'

/** Persona shown when the role switcher is on Employee (Non-User). */
const NON_USER_ID = 'emp-09'

/**
 * Employee (Non-User) records view (TNA-18): attendance captured on their
 * behalf by HR via manual entry, biometric, API or file import — identical to
 * user employees — with corrections raised by the admin as requester.
 */
export function NonUserTab({
  attendance,
  requests,
}: {
  attendance: AttendanceStore
  requests: RequestsStore
}) {
  const me = EMPLOYEES.find((e) => e.id === NON_USER_ID)
  const records = attendance.records
    .filter((r) => r.employeeId === NON_USER_ID && !r.duplicateOfId)
    .sort((a, b) => b.date.localeCompare(a.date))
  const corrections = requests.corrections.filter((c) => c.employeeId === NON_USER_ID)

  return (
    <div className='w-full space-y-4'>
      <div className='flex items-start gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
        <Info size={16} weight='bold' className='text-neutral-1000 mt-0.5 shrink-0' />
        <p className='text-paragraph-sm text-neutral-1000'>
          {me?.name} ({me?.code}) has no self-service login. Attendance is
          captured and managed by HR on their behalf; overtime and statutory
          evaluations apply the same as for user employees. Corrections are
          raised by the Company Admin as the requester.
        </p>
      </div>

      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Attendance Records ({records.length})
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Date</th>
                <th className='px-2 font-medium'>Punches</th>
                <th className='px-2 font-medium'>Source</th>
                <th className='px-2 font-medium'>Entered by</th>
                <th className='px-2 font-medium'>Effective</th>
                <th className='px-2 font-medium'>Overtime</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{fmtDate(r.date)}</td>
                  <td className='px-2'>
                    {r.punchIn} → {r.punchOut ?? 'missing'}
                  </td>
                  <td className='px-2'>
                    <SourceBadge source={r.source} />
                  </td>
                  <td className='px-2'>{r.enteredBy ?? '—'}</td>
                  <td className='px-2'>{fmtHours(r.effectiveHours)}</td>
                  <td className='px-2'>{r.overtimeHours > 0 ? fmtHours(r.overtimeHours) : '—'}</td>
                  <td className='px-2'>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className='text-neutral-1000 py-3 text-center'>
                    No attendance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Corrections Raised on My Behalf ({corrections.length})
        </h3>
        <div className='space-y-2'>
          {corrections.map((c) => (
            <div
              key={c.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-4 py-3'
            >
              <div>
                <p className='text-sm font-medium'>
                  {fmtDate(c.date)} — requested {c.requestedIn} → {c.requestedOut}
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Raised by {c.requestedBy} · “{c.justification}”
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {corrections.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-4'>
              No corrections raised.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
