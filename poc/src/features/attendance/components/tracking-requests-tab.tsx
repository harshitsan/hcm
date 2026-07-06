import { useMemo, useState, type ReactNode } from 'react'
import { ArrowCounterClockwise, ArrowsClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SwitchWithLabel } from '@/components/common/switch-with-label'
import { OUT_TIME_TYPES } from '../data/requests'
import { fmtDate, fmtHours } from '../data/shared'
import {
  CHANGE_FIELDS,
  inactiveCompOff,
  inactiveOutTime,
  inactiveOvertime,
  inactiveWfh,
  isInactiveEmployee,
  seedChangeRequests,
  trackedEmployeeName,
  type PendingChangeRequest,
} from '../data/tracking'
import { type RequestsStore } from '../hooks/use-requests'
import { type ShiftsStore } from '../hooks/use-shifts'
import { StatusBadge } from './badges'

/** "Last refreshed 14:03:22" helper shared by every tracking list. */
function useRefresh(listName: string) {
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)
  const refresh = () => {
    const at = new Date().toLocaleTimeString('en-GB')
    setRefreshedAt(at)
    toast.success(`${listName} refreshed — showing the latest requests`)
  }
  return { refreshedAt, refresh }
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant='outline' className='h-7 gap-1' onClick={onClick}>
      <ArrowsClockwise size={14} weight='bold' />
      Refresh
    </Button>
  )
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant='outline' className='h-7 gap-1' onClick={onClick}>
      <ArrowCounterClockwise size={14} weight='bold' />
      Reset
    </Button>
  )
}

function SectionHeader({
  title,
  count,
  refreshedAt,
  children,
}: {
  title: string
  count: number
  refreshedAt: string | null
  children: ReactNode
}) {
  return (
    <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
      <div>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          {title} ({count})
        </h2>
        {refreshedAt && (
          <span className='text-neutral-1000 text-xs'>Last refreshed {refreshedAt}</span>
        )}
      </div>
      <div className='flex flex-wrap items-center gap-2'>{children}</div>
    </div>
  )
}

function EmployeeCell({ employeeId }: { employeeId: string }) {
  return (
    <td className='py-2 pr-3 font-medium'>
      {trackedEmployeeName(employeeId)}
      {isInactiveEmployee(employeeId) && (
        <span className='text-neutral-1000 block text-xs font-normal'>inactive</span>
      )}
    </td>
  )
}

/* ------------------------------------------------------------------ */
/* Comp Off (ECO-06)                                                   */
/* ------------------------------------------------------------------ */

function CompOffSection({ requests }: { requests: RequestsStore }) {
  const [showInactive, setShowInactive] = useState(false)
  const { refreshedAt, refresh } = useRefresh('Comp off request list')
  const data = showInactive ? inactiveCompOff : requests.compOff
  return (
    <div>
      <SectionHeader title='Employee Comp Off Requests' count={data.length} refreshedAt={refreshedAt}>
        <SwitchWithLabel
          checked={showInactive}
          onCheckedChange={setShowInactive}
          labelA='Active'
          labelB='Inactive'
        />
        <RefreshButton onClick={refresh} />
      </SectionHeader>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Comp off date</th>
              <th className='px-2 font-medium'>Days</th>
              <th className='px-2 font-medium'>Earned from</th>
              <th className='px-2 font-medium'>Submitted</th>
              <th className='px-2 font-medium'>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className='border-b last:border-0'>
                <EmployeeCell employeeId={c.employeeId} />
                <td className='px-2'>{fmtDate(c.compOffDate)}</td>
                <td className='px-2'>{c.days}</td>
                <td className='text-neutral-1000 px-2'>{c.earnedFrom}</td>
                <td className='px-2'>{fmtDate(c.submittedOn)}</td>
                <td className='px-2'><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Out Time (EOT-06)                                                   */
/* ------------------------------------------------------------------ */

function OutTimeSection({ requests }: { requests: RequestsStore }) {
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const { refreshedAt, refresh } = useRefresh('Out time request list')
  const all = useMemo(
    () => [...requests.outTime, ...inactiveOutTime],
    [requests.outTime]
  )
  const data = all.filter(
    (o) => (type === 'all' || o.type === type) && (status === 'all' || o.status === status)
  )
  const reset = () => {
    setType('all')
    setStatus('all')
    toast.success('Out time filters reset')
  }
  return (
    <div>
      <SectionHeader title='Employee Out Time Requests' count={data.length} refreshedAt={refreshedAt}>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger variant='secondary' className='h-7 w-[130px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All types</SelectItem>
            {OUT_TIME_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
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
        <ResetButton onClick={reset} />
        <RefreshButton onClick={refresh} />
      </SectionHeader>
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
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id} className='border-b last:border-0'>
                <EmployeeCell employeeId={o.employeeId} />
                <td className='px-2'>{o.type}</td>
                <td className='px-2'>
                  {o.fromDateTime.replace('T', ' ')} → {o.toDateTime.replace('T', ' ')}
                </td>
                <td className='px-2'>{fmtHours(o.hours)}</td>
                <td className='text-destructive px-2 text-xs'>{o.policyNote ?? '—'}</td>
                <td className='px-2'><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Overtime (EOV-05)                                                   */
/* ------------------------------------------------------------------ */

function OvertimeSection({ requests }: { requests: RequestsStore }) {
  const [showInactive, setShowInactive] = useState(false)
  const { refreshedAt, refresh } = useRefresh('Overtime request list')
  const data = showInactive ? inactiveOvertime : requests.overtime
  return (
    <div>
      <SectionHeader title='Employee Over Time Requests' count={data.length} refreshedAt={refreshedAt}>
        <SwitchWithLabel
          checked={showInactive}
          onCheckedChange={setShowInactive}
          labelA='Active'
          labelB='Inactive'
        />
        <RefreshButton onClick={refresh} />
      </SectionHeader>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Date</th>
              <th className='px-2 font-medium'>Recorded / Approved</th>
              <th className='px-2 font-medium'>Category</th>
              <th className='px-2 font-medium'>Approver</th>
              <th className='px-2 font-medium'>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id} className='border-b last:border-0'>
                <EmployeeCell employeeId={o.employeeId} />
                <td className='px-2'>{fmtDate(o.date)}</td>
                <td className='px-2'>
                  {fmtHours(o.recordedHours)} / {o.approvedHours !== null ? fmtHours(o.approvedHours) : '—'}
                </td>
                <td className='px-2 capitalize'>{o.category}</td>
                <td className='text-neutral-1000 px-2'>{o.approver}</td>
                <td className='px-2'><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shift Assignment (ESA-06)                                           */
/* ------------------------------------------------------------------ */

function ShiftAssignmentSection({ shifts }: { shifts: ShiftsStore }) {
  const [shiftFilter, setShiftFilter] = useState('all')
  const [status, setStatus] = useState('all')
  const { refreshedAt, refresh } = useRefresh('Shift assignment list')
  const data = shifts.roster.filter(
    (r) =>
      (shiftFilter === 'all' || r.shiftId === shiftFilter) &&
      (status === 'all' || r.status === status)
  )
  const reset = () => {
    setShiftFilter('all')
    setStatus('all')
    toast.success('Shift assignment filters reset')
  }
  const activePatterns = shifts.patterns.filter((p) => p.status === 'active')
  return (
    <div>
      <SectionHeader title='Employee Shift Assignments' count={data.length} refreshedAt={refreshedAt}>
        <Select value={shiftFilter} onValueChange={setShiftFilter}>
          <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All shifts</SelectItem>
            {activePatterns.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
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
        <ResetButton onClick={reset} />
        <RefreshButton onClick={refresh} />
      </SectionHeader>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Shift</th>
              <th className='px-2 font-medium'>From → To</th>
              <th className='px-2 font-medium'>Assigned by</th>
              <th className='px-2 font-medium'>Conflict</th>
              <th className='px-2 font-medium'>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className='border-b last:border-0'>
                <EmployeeCell employeeId={r.employeeId} />
                <td className='px-2'>{shifts.shiftName(r.shiftId)}</td>
                <td className='px-2'>
                  {fmtDate(r.fromDate)} → {fmtDate(r.toDate)}
                </td>
                <td className='text-neutral-1000 px-2'>{r.assignedBy}</td>
                <td className='text-destructive px-2 text-xs'>{r.conflict ?? '—'}</td>
                <td className='px-2'><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Work From Home (WFH-06)                                             */
/* ------------------------------------------------------------------ */

function WfhSection({ requests }: { requests: RequestsStore }) {
  const [showInactive, setShowInactive] = useState(false)
  const { refreshedAt, refresh } = useRefresh('WFH request list')
  const data = showInactive ? inactiveWfh : requests.wfh
  return (
    <div>
      <SectionHeader title='Employee Work From Home Requests' count={data.length} refreshedAt={refreshedAt}>
        <SwitchWithLabel
          checked={showInactive}
          onCheckedChange={setShowInactive}
          labelA='Active'
          labelB='Inactive'
        />
        <RefreshButton onClick={refresh} />
      </SectionHeader>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>From → To</th>
              <th className='px-2 font-medium'>Days / Hours</th>
              <th className='px-2 font-medium'>Policy</th>
              <th className='px-2 font-medium'>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((w) => (
              <tr key={w.id} className='border-b last:border-0'>
                <EmployeeCell employeeId={w.employeeId} />
                <td className='px-2'>
                  {fmtDate(w.fromDate)} → {fmtDate(w.toDate)}
                </td>
                <td className='px-2'>
                  {w.days} / {fmtHours(w.hours)}
                </td>
                <td className='text-destructive px-2 text-xs'>{w.policyNote ?? '—'}</td>
                <td className='px-2'><StatusBadge status={w.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pending Change Requests (PCR-06)                                    */
/* ------------------------------------------------------------------ */

function ChangeRequestSection() {
  const [items, setItems] = useState<PendingChangeRequest[]>(seedChangeRequests)
  const [field, setField] = useState('all')
  const [status, setStatus] = useState('pending')
  const { refreshedAt, refresh } = useRefresh('Pending change request list')
  const data = items.filter(
    (c) => (field === 'all' || c.field === field) && (status === 'all' || c.status === status)
  )
  const reset = () => {
    setField('all')
    setStatus('pending')
    toast.success('Change request filters reset')
  }
  const decide = (id: string, approve: boolean) => {
    setItems((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: approve ? 'approved' : 'rejected' } : c
      )
    )
    toast.success(`Change request ${approve ? 'approved' : 'rejected'}`)
  }
  return (
    <div>
      <SectionHeader title='Pending Change Requests' count={data.length} refreshedAt={refreshedAt}>
        <Select value={field} onValueChange={setField}>
          <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All fields</SelectItem>
            {CHANGE_FIELDS.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger variant='secondary' className='h-7 w-[140px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='approved'>Approved</SelectItem>
            <SelectItem value='rejected'>Rejected</SelectItem>
          </SelectContent>
        </Select>
        <ResetButton onClick={reset} />
        <RefreshButton onClick={refresh} />
      </SectionHeader>
      <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-neutral-1000 border-b text-left text-xs'>
              <th className='py-2 pr-3 font-medium'>Employee</th>
              <th className='px-2 font-medium'>Date</th>
              <th className='px-2 font-medium'>Field</th>
              <th className='px-2 font-medium'>Current → Requested</th>
              <th className='px-2 font-medium'>Reason</th>
              <th className='px-2 font-medium'>Status</th>
              <th className='px-2 text-right font-medium'>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className='text-neutral-1000 py-6 text-center'>
                  No change requests match the current filters.
                </td>
              </tr>
            )}
            {data.map((c) => (
              <tr key={c.id} className='border-b last:border-0'>
                <EmployeeCell employeeId={c.employeeId} />
                <td className='px-2'>{fmtDate(c.date)}</td>
                <td className='px-2'>{c.field}</td>
                <td className='px-2'>
                  {c.currentValue} → <span className='font-medium'>{c.requestedValue}</span>
                </td>
                <td className='text-neutral-1000 px-2 text-xs'>{c.reason}</td>
                <td className='px-2'><StatusBadge status={c.status} /></td>
                <td className='px-2 text-right'>
                  {c.status === 'pending' && (
                    <span className='inline-flex gap-1.5'>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => decide(c.id, false)}
                      >
                        Reject
                      </Button>
                      <Button className='h-6 px-2 text-xs' onClick={() => decide(c.id, true)}>
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
  )
}

/**
 * Attendance Tracking request console (ECO-06/EOT-06/EOV-05/ESA-06/WFH-06/
 * PCR-06): one sub-tab per Kensium tracking screen, each with the
 * active-inactive toggle and/or reset + refresh controls the stories call for.
 */
export function TrackingRequestsTab({
  requests,
  shifts,
}: {
  requests: RequestsStore
  shifts: ShiftsStore
}) {
  return (
    <Tabs defaultValue='comp-off'>
      <TabsList className='mb-2 flex-wrap'>
        <TabsTrigger value='comp-off'>Comp Off</TabsTrigger>
        <TabsTrigger value='out-time'>Out Time</TabsTrigger>
        <TabsTrigger value='overtime'>Over Time</TabsTrigger>
        <TabsTrigger value='shift-assignment'>Shift Assignment</TabsTrigger>
        <TabsTrigger value='wfh'>Work From Home</TabsTrigger>
        <TabsTrigger value='change-requests'>Change Requests</TabsTrigger>
      </TabsList>
      <TabsContent value='comp-off'>
        <CompOffSection requests={requests} />
      </TabsContent>
      <TabsContent value='out-time'>
        <OutTimeSection requests={requests} />
      </TabsContent>
      <TabsContent value='overtime'>
        <OvertimeSection requests={requests} />
      </TabsContent>
      <TabsContent value='shift-assignment'>
        <ShiftAssignmentSection shifts={shifts} />
      </TabsContent>
      <TabsContent value='wfh'>
        <WfhSection requests={requests} />
      </TabsContent>
      <TabsContent value='change-requests'>
        <ChangeRequestSection />
      </TabsContent>
    </Tabs>
  )
}
