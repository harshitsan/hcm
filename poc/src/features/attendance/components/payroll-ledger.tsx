import { useMemo } from 'react'
import { Info, LockSimple } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { buildPayrollLedger } from '../data/payroll-ledger'
import { employeeName, fmtDate, fmtHours } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'
import { OtBadge } from './badges'

/**
 * OT / comp-off ledger (D6): one display-only row per employee per day with
 * regular hours, overtime hours and comp-off accrued. Every row is flagged
 * "Ready for payroll computation (D6)" — NO pay amounts are calculated here.
 * Night shifts crossing midnight appear as two rows so the overtime lands on
 * the calendar day it was actually worked.
 */
export function PayrollLedger({
  attendance,
  lockedThrough,
}: {
  attendance: AttendanceStore
  /** Payroll lock date — rows on or before it are shown as frozen. */
  lockedThrough: string
}) {
  const rows = useMemo(
    () => buildPayrollLedger(attendance.records, lockedThrough),
    [attendance.records, lockedThrough]
  )

  return (
    <div>
      <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
        OT & Comp-off Ledger ({rows.length})
        <span className='text-neutral-1000 ml-2 text-xs'>
          per employee per day — regular hours, overtime and comp-off accrued,
          computation-ready for payroll (D6)
        </span>
      </h3>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Date</th>
              <th className='px-2 font-medium'>Regular hours</th>
              <th className='px-2 font-medium'>OT hours</th>
              <th className='px-2 font-medium'>OT category</th>
              <th className='px-2 font-medium'>Comp-off accrued</th>
              <th className='px-2 font-medium'>Payroll status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{employeeName(row.employeeId)}</td>
                <td className='px-2'>
                  <span className='inline-flex items-center gap-1'>
                    {fmtDate(row.date)}
                    {row.note && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='inline-flex'>
                            <Info size={13} className='text-blue-1200' weight='bold' />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side='top' className='max-w-[260px]'>
                          {row.note}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </td>
                <td className='px-2'>
                  {row.regularHours > 0 ? fmtHours(row.regularHours) : '—'}
                </td>
                <td className='px-2 font-medium'>
                  {row.otHours > 0 ? fmtHours(row.otHours) : '—'}
                </td>
                <td className='px-2'>
                  <OtBadge category={row.otCategory} />
                </td>
                <td className='px-2'>
                  {row.compOffDays > 0 ? `${row.compOffDays} day(s)` : '—'}
                </td>
                <td className='px-2'>
                  <span className='inline-flex items-center gap-1.5'>
                    <Badge variant='completed'>
                      Ready for payroll computation (D6)
                    </Badge>
                    {row.locked && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='inline-flex'>
                            <Badge variant='badge_inactive'>
                              <LockSimple size={11} weight='fill' className='mr-1' />
                              Period locked
                            </Badge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side='top' className='max-w-[240px]'>
                          This period is locked for payroll — corrections up to{' '}
                          {fmtDate(lockedThrough)} are frozen. Contact HR to unlock.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className='text-neutral-1000 border-t pt-2 text-xs'>
          Display only — no pay amounts are calculated here. The payroll module
          (D6) consumes these hour and comp-off values when it computes pay.
        </p>
      </div>
    </div>
  )
}
