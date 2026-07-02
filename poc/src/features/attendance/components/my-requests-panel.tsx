import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type CorrectionRequest } from '../data/requests'
import { CURRENT_EMPLOYEE_ID, employeeName, fmtDate, fmtHours } from '../data/shared'
import { type RequestsStore } from '../hooks/use-requests'
import { type ShiftsStore } from '../hooks/use-shifts'
import { StatusBadge } from './badges'
import { CorrectionDialog } from './correction-dialog'
import {
  CompOffDialog,
  OutTimeDialog,
  OvertimeDialog,
  SwapDialog,
  WfhDialog,
} from './request-dialogs'

const KIND_LABEL: Record<CorrectionRequest['kind'], string> = {
  'missed-punch': 'Missed punch',
  'late-arrival': 'Late arrival',
  'early-exit': 'Early exit',
}

type DialogKind = 'correction' | 'swap' | 'overtime' | 'comp-off' | 'out-time' | 'wfh' | null

/**
 * Employee request center (TNA-06/11/27/31/33/36/38): raise corrections,
 * shift swaps, overtime, comp off, out time and WFH requests, and track each
 * request's status as the workflow engine routes and the notification engine
 * informs at every step.
 */
export function MyRequestsPanel({
  requests,
  shifts,
  payrollCutoffDay,
}: {
  requests: RequestsStore
  shifts: ShiftsStore
  payrollCutoffDay: number
}) {
  const [openDialog, setOpenDialog] = useState<DialogKind>(null)
  const [outTimeStatus, setOutTimeStatus] = useState('all')
  const afterPayrollCutoff = new Date().getDate() > payrollCutoffDay

  const mine = {
    corrections: requests.corrections.filter((c) => c.employeeId === CURRENT_EMPLOYEE_ID),
    swaps: shifts.swaps.filter((s) => s.requesterId === CURRENT_EMPLOYEE_ID),
    overtime: requests.overtime.filter((o) => o.employeeId === CURRENT_EMPLOYEE_ID),
    compOff: requests.compOff.filter((c) => c.employeeId === CURRENT_EMPLOYEE_ID),
    wfh: requests.wfh.filter((w) => w.employeeId === CURRENT_EMPLOYEE_ID),
  }
  const myOutTime = useMemo(
    () =>
      requests.outTime.filter(
        (o) =>
          o.employeeId === CURRENT_EMPLOYEE_ID &&
          (outTimeStatus === 'all' || o.status === outTimeStatus)
      ),
    [outTimeStatus, requests.outTime]
  )

  const newButtons: { kind: Exclude<DialogKind, null>; label: string }[] = [
    { kind: 'correction', label: 'Correction' },
    { kind: 'swap', label: 'Shift Swap' },
    { kind: 'overtime', label: 'Overtime' },
    { kind: 'comp-off', label: 'Comp Off' },
    { kind: 'out-time', label: 'Out Time' },
    { kind: 'wfh', label: 'Work From Home' },
  ]

  return (
    <div className='w-full space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white p-4'>
        <div>
          <h3 className='text-sm font-medium'>Raise a request</h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-0.5'>
            Requests route level by level through the configured approver graph;
            you are notified on approval, rejection and escalation.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {newButtons.map((b) => (
            <Button
              key={b.kind}
              variant='outline'
              className='h-7 gap-1'
              onClick={() => setOpenDialog(b.kind)}
            >
              <Plus size={12} weight='bold' />
              {b.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Corrections (TNA-11) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          My Correction Requests ({mine.corrections.length})
        </h3>
        <div className='space-y-2'>
          {mine.corrections.map((c) => (
            <div
              key={c.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-4 py-3'
            >
              <div>
                <p className='text-sm font-medium'>
                  {KIND_LABEL[c.kind]} · {fmtDate(c.date)} — requested {c.requestedIn} →{' '}
                  {c.requestedOut}
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Level {c.approvalLevel}
                  {c.escalatedTo ? ` · escalated to ${c.escalatedTo}` : ` · SLA ${c.slaHoursLeft}h left`}
                  {' · '}“{c.justification}”
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {mine.corrections.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-4'>
              No correction requests yet.
            </p>
          )}
        </div>
      </div>

      {/* Swaps (TNA-06) */}
      <div>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          My Shift Swap Requests ({mine.swaps.length})
          <span className='text-neutral-1000 ml-2 text-xs'>
            approval updates the roster for both of you automatically
          </span>
        </h3>
        <div className='space-y-2'>
          {mine.swaps.map((s) => (
            <div
              key={s.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-gray-200 bg-white px-4 py-3'
            >
              <div>
                <p className='text-sm font-medium'>
                  Swap with {employeeName(s.counterpartyId)} on {fmtDate(s.date)}
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  “{s.reason}”
                  {s.decisionNote && ` · outcome: ${s.decisionNote}`}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
          {mine.swaps.length === 0 && (
            <p className='text-paragraph-sm text-neutral-1000 rounded-[8px] border border-gray-200 bg-white p-4'>
              No swap requests yet.
            </p>
          )}
        </div>
      </div>

      {/* Overtime + Comp off (TNA-31/33) */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            My Overtime Requests ({mine.overtime.length})
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>OT date</th>
                  <th className='px-2 font-medium'>Recorded</th>
                  <th className='px-2 font-medium'>Approved</th>
                  <th className='px-2 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.overtime.map((o) => (
                  <tr key={o.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>{fmtDate(o.date)}</td>
                    <td className='px-2'>{fmtHours(o.recordedHours)}</td>
                    <td className='px-2'>
                      {o.approvedHours !== null ? fmtHours(o.approvedHours) : '—'}
                    </td>
                    <td className='px-2'>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            My Comp Off Requests ({mine.compOff.length})
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Comp off date</th>
                  <th className='px-2 font-medium'>Days</th>
                  <th className='px-2 font-medium'>Earned from</th>
                  <th className='px-2 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.compOff.map((c) => (
                  <tr key={c.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>{fmtDate(c.compOffDate)}</td>
                    <td className='px-2'>{c.days}</td>
                    <td className='text-neutral-1000 px-2'>{c.earnedFrom}</td>
                    <td className='px-2'>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Out time with filter (TNA-36) + WFH (TNA-38) */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-neutral-1600 text-sm font-medium'>
              My Out Time Requests ({myOutTime.length})
            </h3>
            <Select value={outTimeStatus} onValueChange={setOutTimeStatus}>
              <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='approved'>Approved</SelectItem>
                <SelectItem value='rejected'>Rejected</SelectItem>
                <SelectItem value='blocked'>Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>Type</th>
                  <th className='px-2 font-medium'>From → To</th>
                  <th className='px-2 font-medium'>Hours</th>
                  <th className='px-2 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {myOutTime.map((o) => (
                  <tr key={o.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>{o.type}</td>
                    <td className='px-2'>
                      {o.fromDateTime.replace('T', ' ')} → {o.toDateTime.replace('T', ' ')}
                    </td>
                    <td className='px-2'>{fmtHours(o.hours)}</td>
                    <td className='px-2'>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
            My WFH Requests ({mine.wfh.length})
          </h3>
          <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-neutral-1000 border-b text-left text-xs'>
                  <th className='py-2 pr-3 font-medium'>From → To</th>
                  <th className='px-2 font-medium'>Days / Hours</th>
                  <th className='px-2 font-medium'>Policy</th>
                  <th className='px-2 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.wfh.map((w) => (
                  <tr key={w.id} className='border-b last:border-0'>
                    <td className='py-2 pr-3'>
                      {fmtDate(w.fromDate)} → {fmtDate(w.toDate)}
                    </td>
                    <td className='px-2'>
                      {w.days} / {fmtHours(w.hours)}
                    </td>
                    <td className='text-destructive px-2 text-xs'>{w.policyNote ?? '—'}</td>
                    <td className='px-2'>
                      <StatusBadge status={w.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CorrectionDialog
        open={openDialog === 'correction'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        employeeId={CURRENT_EMPLOYEE_ID}
        requestedBy={employeeName(CURRENT_EMPLOYEE_ID)}
        afterPayrollCutoff={afterPayrollCutoff}
        onSubmit={requests.submitCorrection}
      />
      <SwapDialog
        open={openDialog === 'swap'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        shifts={shifts}
      />
      <OvertimeDialog
        open={openDialog === 'overtime'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        requests={requests}
      />
      <CompOffDialog
        open={openDialog === 'comp-off'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        requests={requests}
      />
      <OutTimeDialog
        open={openDialog === 'out-time'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        requests={requests}
      />
      <WfhDialog
        open={openDialog === 'wfh'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        requests={requests}
      />
    </div>
  )
}
