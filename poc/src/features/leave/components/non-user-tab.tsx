import { Info } from 'phosphor-react'
import { type FmlaReason } from '../data/config'
import { type LeaveType } from '../data/leave-types'
import { NON_USER_EMPLOYEE_ID, employeeById } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { MyLeaveTab } from './my-leave-tab'

interface NonUserTabProps {
  requests: LeaveRequestsStore
  balances: BalancesStore
  leaveTypes: LeaveType[]
  fmlaReasons: FmlaReason[]
}

/**
 * Employee (Non-User) view (LVE-29): read-only records maintained on the
 * employee's behalf by HR — balances, requests, comp-off and audit-backed
 * overrides all reflect exactly as for self-service staff.
 */
export function NonUserTab({
  requests,
  balances,
  leaveTypes,
  fmlaReasons,
}: NonUserTabProps) {
  const emp = employeeById(NON_USER_EMPLOYEE_ID)
  return (
    <div className='w-full'>
      <div className='bg-blue-150 mb-4 flex items-start gap-2 rounded-[8px] p-3 text-sm'>
        <Info size={18} weight='bold' className='text-blue-1400 mt-0.5 shrink-0' />
        <div>
          <strong>{emp?.name}</strong> has no portal access. HR records leave
          on this employee’s behalf; approvals, cancellations, adjustments and
          overrides update the balances, entitlements and calendars below
          exactly as for self-service employees — with the same
          mandatory-reason audit trail. This read-only kiosk view shows the
          records maintained for them.
        </div>
      </div>
      <MyLeaveTab
        employeeId={NON_USER_EMPLOYEE_ID}
        requests={requests}
        balances={balances}
        leaveTypes={leaveTypes}
        fmlaReasons={fmlaReasons}
        readOnly
      />
    </div>
  )
}
