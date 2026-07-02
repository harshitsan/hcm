import { useMemo, useState } from 'react'
import { Plus, ShieldWarning } from 'phosphor-react'
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
import { DEPARTMENTS, EMPLOYEES } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { ApplyLeaveOverlay } from './apply-leave-overlay'
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
 * Company Admin request desk: the full request register, record-on-behalf
 * for Employee (Non-User) staff (LVE-17/29) and administrative overrides
 * (LVE-07).
 */
export function RequestsTab({
  requests,
  balances,
  leaveTypes,
  fmlaReasons,
  actor,
}: RequestsTabProps) {
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recordFor, setRecordFor] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)

  const data = useMemo(
    () =>
      requests.requests.filter(
        (r) =>
          (deptFilter === 'all' || r.department === deptFilter) &&
          (statusFilter === 'all' || r.status === statusFilter)
      ),
    [deptFilter, requests.requests, statusFilter]
  )

  const cards = [
    { label: 'Total requests', value: requests.requests.length },
    {
      label: 'Pending approval',
      value: requests.requests.filter((r) => r.status === 'pending').length,
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

      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          All Requests ({data.length})
        </h2>
        <div className='flex items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='cancellation-requested'>Cancellation requested</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
              <SelectItem value='withdrawn'>Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
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
