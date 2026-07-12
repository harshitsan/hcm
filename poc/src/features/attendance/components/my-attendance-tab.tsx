import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type AttendanceException, type AttendanceRecord } from '../data/attendance'
import { type CorrectionKind } from '../data/requests'
import {
  CURRENT_EMPLOYEE_ID,
  employeeById,
  employeeName,
  fmtBreaks,
  fmtDate,
  fmtHours,
  todayIso,
} from '../data/shared'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { type AttendanceStore } from '../hooks/use-attendance'
import { type RequestsStore } from '../hooks/use-requests'
import { type ShiftsStore } from '../hooks/use-shifts'
import { StatusBadge } from './badges'
import { CorrectionDialog, type CorrectionPrefill } from './correction-dialog'
import { SummaryCards } from './summary-cards'

const EXCEPTION_LABEL: Record<AttendanceException, string> = {
  'missed-punch': 'Missed punch',
  'late-arrival': 'Late arrival',
  'early-exit': 'Early exit',
  'over-break': 'Over break',
}

/** Map an attendance exception onto the correction-request kinds (TNA-11). */
function correctionKindFor(exception: AttendanceException): CorrectionKind {
  return exception === 'over-break' ? 'missed-punch' : exception
}

/**
 * Employee self-service (TNA-17/28/42/48): my attendance breakdown with
 * breaks and effective duration, my shift assignments with filters, and the
 * holiday list with optional-holiday opt-in up to the permitted allowance.
 */
export function MyAttendanceTab({
  attendance,
  shifts,
  config,
  requests,
  payrollCutoffDay,
}: {
  attendance: AttendanceStore
  shifts: ShiftsStore
  config: AttendanceConfigStore
  requests: RequestsStore
  payrollCutoffDay: number
}) {
  const [from, setFrom] = useState('2026-06-01')
  const [to, setTo] = useState('2026-07-31')
  const [assignStatus, setAssignStatus] = useState('all')
  const [correctionFor, setCorrectionFor] = useState<AttendanceRecord | null>(null)

  const me = employeeById(CURRENT_EMPLOYEE_ID)

  // Pre-fill the correction flow with the flagged day's record (TNA-11).
  const correctionPrefill = useMemo<CorrectionPrefill | undefined>(
    () =>
      correctionFor
        ? {
            date: correctionFor.date,
            kind: correctionFor.exception
              ? correctionKindFor(correctionFor.exception)
              : 'missed-punch',
            requestedIn: correctionFor.punchIn,
            requestedOut: correctionFor.punchOut ?? '18:00',
          }
        : undefined,
    [correctionFor]
  )

  const myRecords = useMemo(
    () =>
      attendance.records
        .filter(
          (r) =>
            r.employeeId === CURRENT_EMPLOYEE_ID &&
            !r.duplicateOfId &&
            r.date >= from &&
            r.date <= to
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [attendance.records, from, to]
  )

  const myAssignments = shifts.roster.filter(
    (r) =>
      r.employeeId === CURRENT_EMPLOYEE_ID &&
      (assignStatus === 'all' || r.status === assignStatus)
  )

  const myHolidays = config.activeCalendar.holidays.filter(
    (h) => h.scope === 'Company-wide' || h.scope === me?.location
  )
  const optional = myHolidays.filter((h) => h.kind === 'optional')

  const workedTotal = myRecords.reduce((s, r) => s + r.workedHours, 0)
  const effectiveTotal = myRecords.reduce((s, r) => s + r.effectiveHours, 0)
  const otTotal = myRecords.reduce((s, r) => s + r.overtimeHours, 0)
  const exceptions = myRecords.filter((r) => r.exception !== null).length

  return (
    <div className='w-full space-y-5'>
      <SummaryCards
        title={`My Attendance — ${me?.name ?? ''} (${me?.code ?? ''})`}
        items={[
          { label: 'Worked hours', value: fmtHours(workedTotal) },
          { label: 'Effective hours', value: fmtHours(effectiveTotal) },
          { label: 'Overtime accrued', value: fmtHours(otTotal) },
          { label: 'Exceptions', value: exceptions },
        ]}
      />

      {/* My attendance details (TNA-17/48) */}
      <div>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            My Attendance Details ({myRecords.length})
          </h3>
          <div className='flex items-center gap-2'>
            <Input
              type='date'
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className='h-7 w-[150px]'
              aria-label='From date'
            />
            <span className='text-neutral-1000 text-xs'>to</span>
            <Input
              type='date'
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className='h-7 w-[150px]'
              aria-label='To date'
            />
            <Button
              variant='outline'
              className='h-7 text-xs'
              onClick={() => {
                setFrom(todayIso())
                setTo(todayIso())
              }}
            >
              Today&apos;s Data
            </Button>
          </div>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Date</th>
                <th className='px-2 font-medium'>Planned</th>
                <th className='px-2 font-medium'>Actual start–end</th>
                <th className='px-2 font-medium'>At work</th>
                <th className='px-2 font-medium'>Breaks</th>
                <th className='px-2 font-medium'>Effective</th>
                <th className='px-2 font-medium'>Category</th>
                <th className='px-2 font-medium'>Status</th>
                <th className='px-2 font-medium'>Action</th>
              </tr>
            </thead>
            <tbody>
              {myRecords.map((r) => (
                <tr key={r.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{fmtDate(r.date)}</td>
                  <td className='px-2'>{fmtHours(r.plannedHours)}</td>
                  <td className='px-2'>
                    {r.punchIn} → {r.punchOut ?? 'missing'}
                  </td>
                  <td className='px-2'>{fmtHours(r.workedHours)}</td>
                  <td className='px-2'>{fmtBreaks(r.breaksCount, r.breakMinutes)}</td>
                  <td className='px-2 font-medium'>{fmtHours(r.effectiveHours)}</td>
                  <td className='px-2 capitalize'>{r.workCategory.replace(/-/g, ' ')}</td>
                  <td className='px-2'>
                    <StatusBadge status={r.status} />
                    {r.exception && (
                      <span className='text-neutral-1000 block text-xs'>
                        {EXCEPTION_LABEL[r.exception]}
                      </span>
                    )}
                  </td>
                  <td className='px-2'>
                    {r.exception ? (
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => setCorrectionFor(r)}
                      >
                        Raise correction
                      </Button>
                    ) : (
                      <span className='text-neutral-1000'>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {myRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className='text-neutral-1000 py-3 text-center'>
                    No attendance in the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My shift assignments (TNA-42) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            My Shift Assignments ({myAssignments.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              published roster including approved swaps
            </span>
          </h3>
          <Select value={assignStatus} onValueChange={setAssignStatus}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='pending-approval'>Pending approval</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Shift</th>
                <th className='px-2 font-medium'>From → End date</th>
                <th className='px-2 font-medium'>Start – End time</th>
                <th className='px-2 font-medium'>Assigned by</th>
                <th className='px-2 font-medium'>Assigned on</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {myAssignments.map((r) => {
                const pattern = shifts.patterns.find((p) => p.id === r.shiftId)
                return (
                  <tr key={r.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3 font-medium'>{shifts.shiftName(r.shiftId)}</td>
                    <td className='px-2'>
                      {fmtDate(r.fromDate)} → {fmtDate(r.toDate)}
                    </td>
                    <td className='px-2'>
                      {pattern ? `${pattern.startTime} – ${pattern.endTime}` : '—'}
                    </td>
                    <td className='px-2'>{r.assignedBy}</td>
                    <td className='px-2'>{fmtDate(r.assignedOn)}</td>
                    <td className='px-2'>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                )
              })}
              {myAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className='text-neutral-1000 py-3 text-center'>
                    No shift assignments match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holidays applicable to my location + optional opt-in (TNA-08/17) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Holidays for {me?.location} ({myHolidays.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            opted {config.optedHolidayIds.length} of {config.activeCalendar.optionalAllowance}{' '}
            optional holidays — unopted optional days count as working days
          </span>
        </h3>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Holiday</th>
                <th className='px-2 font-medium'>Date</th>
                <th className='px-2 font-medium'>Scope</th>
                <th className='px-2 font-medium'>Type</th>
                <th className='px-2 font-medium'>Opt in</th>
              </tr>
            </thead>
            <tbody>
              {myHolidays.map((h) => (
                <tr key={h.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{h.name}</td>
                  <td className='px-2'>{fmtDate(h.date)}</td>
                  <td className='px-2'>{h.scope}</td>
                  <td className='px-2'>
                    {h.kind === 'optional' ? (
                      <Badge variant='open'>Optional</Badge>
                    ) : (
                      <Badge variant='badge_active'>Mandatory</Badge>
                    )}
                  </td>
                  <td className='px-2'>
                    {h.kind === 'optional' ? (
                      <Checkbox
                        variant='blue'
                        checked={config.optedHolidayIds.includes(h.id)}
                        onCheckedChange={() => config.toggleOptionalHoliday(h.id)}
                        aria-label={`Opt into ${h.name}`}
                      />
                    ) : (
                      <span className='text-neutral-1000'>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {optional.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 pt-2'>
              No optional holidays configured for your location this year.
            </p>
          )}
        </div>
      </div>

      <CorrectionDialog
        open={correctionFor !== null}
        onOpenChange={(open) => !open && setCorrectionFor(null)}
        employeeId={CURRENT_EMPLOYEE_ID}
        requestedBy={employeeName(CURRENT_EMPLOYEE_ID)}
        afterPayrollCutoff={new Date().getDate() > payrollCutoffDay}
        payrollLockedThrough={config.payrollLock.lockedThrough}
        onSubmit={requests.submitCorrection}
        prefill={correctionPrefill}
      />
    </div>
  )
}
