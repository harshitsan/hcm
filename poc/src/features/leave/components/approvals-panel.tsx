import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { type FmlaReason } from '../data/config'
import { type LeaveRequest } from '../data/requests'
import { employeeById } from '../data/shared'
import { type BalancesStore } from '../hooks/use-balances'
import { type LeaveRequestsStore } from '../hooks/use-leave-requests'
import { RequestDetailSheet } from './request-detail-sheet'
import { requestColumns } from './request-columns'

interface ApprovalsPanelProps {
  requests: LeaveRequestsStore
  balances: BalancesStore
  fmlaReasons: FmlaReason[]
  /** Restrict the queue to these employee ids (manager's team). */
  teamIds: string[] | null
  /** Approving as an immediate supervisor (LVE-44 limits apply). */
  asSupervisor: boolean
}

/**
 * Approval queue (LVE-12): pending requests routed to the viewer, with
 * approve / reject-with-reason / escalate actions in the detail sheet.
 */
export function ApprovalsPanel({
  requests,
  balances,
  fmlaReasons,
  teamIds,
  asSupervisor,
}: ApprovalsPanelProps) {
  const [statusFilter, setStatusFilter] = useState('pending')
  // ETOR-05: managers toggle between active and inactive employees.
  const [empStatus, setEmpStatus] = useState('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const data = useMemo(() => {
    let rows = requests.requests
    if (teamIds) rows = rows.filter((r) => teamIds.includes(r.employeeId))
    if (statusFilter !== 'all')
      rows = rows.filter((r) => r.status === statusFilter)
    if (empStatus !== 'all')
      rows = rows.filter(
        (r) => (employeeById(r.employeeId)?.active ?? true) === (empStatus === 'active')
      )
    return rows
  }, [empStatus, requests.requests, statusFilter, teamIds])

  const selected =
    requests.requests.find((r) => r.id === selectedId) ?? null
  const columns = useMemo(() => requestColumns(true), [])

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Requests awaiting decision ({data.length})
        </h2>
        <div className='flex items-center gap-2'>
          <Select value={empStatus} onValueChange={setEmpStatus}>
            <SelectTrigger variant='secondary' className='h-7 w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Active employees</SelectItem>
              <SelectItem value='inactive'>Inactive employees</SelectItem>
              <SelectItem value='all'>All employees</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger variant='secondary' className='h-7 w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='pending'>Pending with me</SelectItem>
              <SelectItem value='cancellation-requested'>
                Cancellation requested
              </SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='all'>All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        variant='no-status'
        onRowClick={(row: LeaveRequest) => setSelectedId(row.id)}
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
        asSupervisor={asSupervisor}
        isOwner={false}
        isAdmin={!asSupervisor}
      />
    </div>
  )
}
