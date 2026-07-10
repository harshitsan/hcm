import { useMemo, useState } from 'react'
import { Plus, ShieldWarning, UserPlus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { type FmlaReason } from '../data/config'
import { type LeaveType } from '../data/leave-types'
import { type LeaveRequest } from '../data/requests'
import { DEPARTMENTS, EMPLOYEES, employeeById } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { ApplyLeaveOverlay } from './apply-leave-overlay'
import { AssignLeaveDialog } from './assign-leave-dialog'
import { LeaveSummaryCards } from './leave-summary-cards'
import { OverrideDialog } from './override-dialog'
import { RequestDetailSheet } from './request-detail-sheet'
import { requestColumns } from './request-columns'

interface RequestsTabProps {
  requests: LeaveRequestsStore
  balances: BalancesStore
  leaveTypes: LeaveType[]
  fmlaReasons: FmlaReason[]
  actor: string
}

const MONTH_FMT = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
})

function monthLabel(m: string) {
  return MONTH_FMT.format(new Date(`${m}-01`))
}

/**
 * Manager / HR Admin request desk per the PDF's Employee Time Off Requests
 * screen: active/inactive toggle, period + status (default Pending) +
 * department filters, Assign Time Off, record-on-behalf for Employee
 * (Non-User) staff (LVE-17/29) and administrative overrides (LVE-07).
 * Approve / Reject / Need clarification / Cancel / View run from the
 * row's detail sheet.
 */
export function RequestsTab({
  requests,
  balances,
  leaveTypes,
  fmlaReasons,
  actor,
}: RequestsTabProps) {
  const [deptFilter, setDeptFilter] = useState('all')
  // Per the PDF the grid defaults to "Pending Approval".
  const [statusFilter, setStatusFilter] = useState('pending')
  const [periodFilter, setPeriodFilter] = useState('all')
  // ETOR-05: toggle which employees' requests appear — active, inactive or all.
  const [empStatus, setEmpStatus] = useState('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recordFor, setRecordFor] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  // Months covered by any request, for the period filter.
  const months = useMemo(() => {
    const set = new Set<string>()
    for (const r of requests.requests) {
      set.add(r.from.slice(0, 7))
      set.add(r.to.slice(0, 7))
    }
    return [...set].sort()
  }, [requests.requests])

  const data = useMemo(
    () =>
      requests.requests.filter(
        (r) =>
          (deptFilter === 'all' || r.department === deptFilter) &&
          (statusFilter === 'all' || r.status === statusFilter) &&
          (periodFilter === 'all' ||
            (r.from.slice(0, 7) <= periodFilter &&
              periodFilter <= r.to.slice(0, 7))) &&
          (empStatus === 'all' ||
            (employeeById(r.employeeId)?.active ?? true) ===
              (empStatus === 'active'))
      ),
    [deptFilter, empStatus, periodFilter, requests.requests, statusFilter]
  )

  const cards = [
    { label: 'Total requests', value: requests.requests.length },
    {
      label: 'Pending approval',
      value: requests.requests.filter((r) => r.status === 'pending').length,
    },
    {
      label: 'Needs clarification',
      value: requests.requests.filter(
        (r) => r.status === 'needs-clarification'
      ).length,
    },
    {
      label: 'Escalated (SLA breach)',
      value: requests.requests.filter((r) =>
        r.steps.some((s) => s.escalated)
      ).length,
    },
    {
      label: 'With LOP portion',
      value: requests.requests.filter((r) => r.lopAmount > 0).length,
    },
  ]

  const selected = requests.requests.find((r) => r.id === selectedId) ?? null
  const columns = useMemo(() => requestColumns(true), [])
  const nonUsers = EMPLOYEES.filter((e) => !e.selfService && e.active)

  return (
    <div className='w-full'>
      <LeaveSummaryCards title='Leave Requests Summary' items={cards} />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          All Requests ({data.length})
        </h2>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={empStatus} onValueChange={setEmpStatus}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Active employees</SelectItem>
              <SelectItem value='inactive'>Inactive employees</SelectItem>
              <SelectItem value='all'>All employees</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[130px]'>
              <SelectValue placeholder='Period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All periods</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='pending'>Pending approval</SelectItem>
              <SelectItem value='needs-clarification'>Needs clarification</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='cancellation-requested'>Cancellation requested</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
              <SelectItem value='withdrawn'>Withdrawn</SelectItem>
              <SelectItem value='all'>All statuses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            className='h-7 gap-1'
            onClick={() => setAssignOpen(true)}
          >
            <UserPlus size={14} weight='bold' />
            Assign Time Off
          </Button>
          <Button
            variant='outline'
            className='h-7 gap-1'
            onClick={() => setOverrideOpen(true)}
          >
            <ShieldWarning size={14} weight='bold' />
            Override…
          </Button>
          <Select value={recordFor} onValueChange={setRecordFor}>
            <SelectTrigger variant='secondary' className='h-7 w-[210px]'>
              <SelectValue placeholder='Record on behalf of…' />
            </SelectTrigger>
            <SelectContent>
              {nonUsers.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} (non-user · {e.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='red'
            disabled={!recordFor}
            onClick={() => setRecordOpen(true)}
            className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
          >
            <Plus size={10} weight='bold' />
            Record Leave
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        variant='no-status'
        onRowClick={(row: LeaveRequest) => setSelectedId(row.id)}
      />

      {recordFor && (
        <ApplyLeaveOverlay
          open={recordOpen}
          onOpenChange={setRecordOpen}
          employeeId={recordFor}
          leaveTypes={leaveTypes}
          fmlaReasons={fmlaReasons}
          remainingFor={balances.remainingFor}
          hasOverlap={requests.hasOverlap}
          onSubmit={requests.submit}
          onBehalfOf={`${actor} (HR)`}
        />
      )}
      <AssignLeaveDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        requestsStore={requests}
        balancesStore={balances}
        leaveTypes={leaveTypes}
        assignedBy={actor}
      />
      <OverrideDialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        balances={balances}
        leaveTypes={leaveTypes}
      />
      <RequestDetailSheet
        open={selected !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null)
        }}
        request={selected}
        store={requests}
        remainingFor={balances.remainingFor}
        fmlaReasons={fmlaReasons}
        canApprove
        asSupervisor={false}
        isOwner={false}
        isAdmin
      />
    </div>
  )
}
