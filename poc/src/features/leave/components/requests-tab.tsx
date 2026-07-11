import { useMemo, useState } from 'react'
import { Plus, ShieldWarning, UserPlus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DataTable } from '@/components/common/data-table/table'
import { selectColumn } from '@/features/workflows/components/table-helpers'
import { type FmlaReason } from '../data/config'
import { type LeaveType } from '../data/leave-types'
import { pendingStep, type LeaveRequest } from '../data/requests'
import {
  DEPARTMENTS,
  EMPLOYEES,
  EMPLOYEE_CLASSES,
  employeeById,
  rangesOverlap,
  todayISO,
} from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { ApplyLeaveOverlay } from './apply-leave-overlay'
import { AssignLeaveDialog } from './assign-leave-dialog'
import { EncashmentPanel } from './encashment-panel'
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

/**
 * Manager / HR Admin request desk per the PDF's Employee Time Off Requests
 * screen: active/inactive toggle, date-range + status (default Pending) +
 * employee-class + department filters with a one-click reset (EOHR-01/05,
 * ETOR-01/02), Assign Time Off, record-on-behalf for Employee (Non-User)
 * staff (LVE-17/29) and administrative overrides (LVE-07). Approve / Reject
 * run inline from the row (with SLA indicator) or in bulk via row selection;
 * Need clarification / Cancel / View run from the row's detail sheet.
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
  // ETOR-01: filter by employee class (Regular / Probationary / …).
  const [classFilter, setClassFilter] = useState('all')
  // EOHR-01: From / To date range instead of a single month picker.
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  // ETOR-05: toggle which employees' requests appear — active, inactive or all.
  const [empStatus, setEmpStatus] = useState('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recordFor, setRecordFor] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  // Mass approval: checkbox selection + a reset key bumped after bulk acts.
  const [selectedRows, setSelectedRows] = useState<LeaveRequest[]>([])
  const [selectionKey, setSelectionKey] = useState(0)
  // One reject dialog serves both the inline row action and bulk rejects.
  const [rejectTargets, setRejectTargets] = useState<LeaveRequest[]>([])
  const [rejectReason, setRejectReason] = useState('')

  const filtersDirty =
    deptFilter !== 'all' ||
    statusFilter !== 'pending' ||
    classFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    empStatus !== 'active'

  const resetFilters = () => {
    setDeptFilter('all')
    setStatusFilter('pending')
    setClassFilter('all')
    setFromDate('')
    setToDate('')
    setEmpStatus('active')
  }

  const data = useMemo(() => {
    // ETOR-02: virtual statuses beyond the raw request status.
    const statusMatch = (r: LeaveRequest) => {
      switch (statusFilter) {
        case 'all':
          return true
        case 'pending-with-me': {
          const step = pendingStep(r.steps)
          return (
            r.status === 'pending' &&
            step !== undefined &&
            step.approver.includes(actor)
          )
        }
        case 'taken':
          return r.status === 'approved' && r.from <= todayISO()
        case 'tentative':
          return (
            r.tentative && (r.status === 'pending' || r.status === 'approved')
          )
        default:
          return r.status === statusFilter
      }
    }
    return requests.requests.filter(
      (r) =>
        (deptFilter === 'all' || r.department === deptFilter) &&
        statusMatch(r) &&
        (classFilter === 'all' ||
          employeeById(r.employeeId)?.employeeClass === classFilter) &&
        ((fromDate === '' && toDate === '') ||
          rangesOverlap(
            r.from,
            r.to,
            fromDate || '0000-01-01',
            toDate || '9999-12-31'
          )) &&
        (empStatus === 'all' ||
          (employeeById(r.employeeId)?.active ?? true) ===
            (empStatus === 'active'))
    )
  }, [
    actor,
    classFilter,
    deptFilter,
    empStatus,
    fromDate,
    requests.requests,
    statusFilter,
    toDate,
  ])

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
      label: 'With Loss of Pay portion',
      value: requests.requests.filter((r) => r.lopAmount > 0).length,
    },
  ]

  const selected = requests.requests.find((r) => r.id === selectedId) ?? null
  const selectedPending = selectedRows.filter((r) => r.status === 'pending')

  const clearSelection = () => {
    setSelectedRows([])
    setSelectionKey((k) => k + 1)
  }

  const approveMany = (targets: LeaveRequest[]) => {
    for (const r of targets) {
      requests.approve(r.id, false)
    }
    clearSelection()
  }

  const rejectMany = () => {
    const reason = rejectReason.trim()
    if (!reason) return
    for (const r of rejectTargets) {
      requests.reject(r.id, reason, null)
    }
    setRejectTargets([])
    setRejectReason('')
    clearSelection()
  }

  const columns = useMemo(
    () => [
      selectColumn<LeaveRequest>(),
      ...requestColumns(true, {
        onApprove: (r) => requests.approve(r.id, false),
        onReject: (r) => setRejectTargets([r]),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests.approve]
  )
  const nonUsers = EMPLOYEES.filter((e) => !e.selfService && e.active)

  return (
    <div className='w-full'>
      <LeaveSummaryCards title='Leave Requests Summary' items={cards} />

      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          All Requests ({data.length})
        </h2>
        <div className='flex flex-wrap items-center gap-2'>
          {filtersDirty && (
            <Button variant='outline' className='h-7' onClick={resetFilters}>
              Reset filters
            </Button>
          )}
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
          {/* EOHR-01: From / To range filter (matches overlap with the range) */}
          <Input
            type='date'
            aria-label='From date'
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className='h-7 w-[140px]'
          />
          <Input
            type='date'
            aria-label='To date'
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className='h-7 w-[140px]'
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='pending'>Pending approval</SelectItem>
              <SelectItem value='pending-with-me'>Pending with me</SelectItem>
              <SelectItem value='needs-clarification'>Needs clarification</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='taken'>Taken</SelectItem>
              <SelectItem value='tentative'>Tentative</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='cancellation-requested'>Cancellation requested</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
              <SelectItem value='withdrawn'>Withdrawn</SelectItem>
              <SelectItem value='all'>All statuses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[150px]'>
              <SelectValue placeholder='Employee class' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All classes</SelectItem>
              {EMPLOYEE_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
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
          <span
            title={
              recordFor
                ? undefined
                : 'Pick a non-user employee first — leave is recorded on their behalf'
            }
          >
            <Button
              variant='red'
              disabled={!recordFor}
              onClick={() => setRecordOpen(true)}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              Record Leave
            </Button>
          </span>
        </div>
      </div>

      {/* Mass approval bar — appears once rows are checked. */}
      {selectedRows.length > 0 && (
        <div className='mb-3 flex flex-wrap items-center gap-2 rounded-[8px] border border-gray-200 bg-white px-3 py-2'>
          <span className='text-neutral-1000 text-sm'>
            {selectedRows.length} selected ({selectedPending.length} pending)
          </span>
          <Button
            variant='outline'
            className='h-7'
            disabled={selectedPending.length === 0}
            onClick={() => approveMany(selectedPending)}
          >
            Approve Selected ({selectedPending.length})
          </Button>
          <Button
            variant='outline'
            className='text-red-1400 h-7'
            disabled={selectedPending.length === 0}
            onClick={() => setRejectTargets(selectedPending)}
          >
            Reject Selected ({selectedPending.length})
          </Button>
          <Button variant='ghost' className='h-7' onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        variant='no-status'
        onRowClick={(row: LeaveRequest) => setSelectedId(row.id)}
        onSelectionChange={setSelectedRows}
        resetSelectionKey={selectionKey}
      />

      {/* Encashment (payout) requests awaiting the Time Off Admin's decision. */}
      <div className='mt-6'>
        <EncashmentPanel balances={balances} />
      </div>

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
      {/* Shared reject dialog — a reason is mandatory (LVE-13). */}
      <ConfirmDialog
        open={rejectTargets.length > 0}
        onOpenChange={(o) => {
          if (!o) {
            setRejectTargets([])
            setRejectReason('')
          }
        }}
        title={
          rejectTargets.length > 1
            ? `Reject ${rejectTargets.length} requests?`
            : `Reject ${rejectTargets[0]?.employeeName ?? ''}'s request?`
        }
        desc='The applicants are notified and any deducted balance is restored. A reason is required.'
        confirmText={
          rejectTargets.length > 1
            ? `Reject ${rejectTargets.length} requests`
            : 'Reject request'
        }
        destructive
        disabled={rejectReason.trim().length === 0}
        handleConfirm={rejectMany}
      >
        <Textarea
          placeholder='Reason for rejection (required)'
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className='min-h-[70px]'
        />
      </ConfirmDialog>
    </div>
  )
}
