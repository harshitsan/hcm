import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle, XCircle } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/common/data-table/table'
import { selectColumn } from '@/features/workflows/components/table-helpers'
import {
  TEAM_ATTENDANCE_STATUSES,
  CHANGE_REQUEST_STATUSES,
  type AttendanceChangeRequest,
  type TeamAttendanceRequest,
} from '../data/attendance-team'
import { type AttendanceTeamStore } from '../hooks/use-attendance-team'
import { FilterBar, SummaryCards } from './shared'
import { StatusBadge } from './status-badge'
import { applyFilter, EMPTY_FILTER, formatDate, formatDateTime, type PeriodStatusFilter } from './utils'

interface AttendanceTeamTabProps {
  store: AttendanceTeamStore
}

/** Employee name with an inactive marker, matching the travel team lists. */
function EmployeeCell({ name, state }: { name: string; state: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      {name}
      {state === 'Inactive' && <Badge variant='badge_inactive'>Inactive</Badge>}
    </span>
  )
}

const OT_REVIEW_KINDS = ['Overtime', 'Work From Home', 'Comp Off'] as const

/**
 * Attendance team functions (More → Attendance Tracking → Team Functions):
 * Mass Approval grid, employee OT/WFH/comp-off review and pending
 * attendance change requests.
 */
export function AttendanceTeamTab({ store }: AttendanceTeamTabProps) {
  const [massFilter, setMassFilter] = useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [reviewFilter, setReviewFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)
  const [changeFilter, setChangeFilter] =
    useState<PeriodStatusFilter>(EMPTY_FILTER)

  const [selected, setSelected] = useState<TeamAttendanceRequest[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)

  const pendingSelected = selected.filter((r) => r.status === 'Pending approval')

  const clearSelection = () => {
    setSelected([])
    setResetSelectionKey((prev) => prev + 1)
  }

  const decideSelected = (decision: 'Approved' | 'Rejected') => {
    store.decideRequests(
      pendingSelected.map((r) => r.id),
      decision
    )
    clearSelection()
  }

  const massColumns = useMemo<ColumnDef<TeamAttendanceRequest>[]>(
    () => [
      selectColumn<TeamAttendanceRequest>(),
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'kind', header: 'Request type' },
      {
        accessorKey: 'fromDateTime',
        header: 'From',
        cell: ({ row }) => formatDateTime(row.original.fromDateTime),
      },
      {
        accessorKey: 'toDateTime',
        header: 'To',
        cell: ({ row }) => formatDateTime(row.original.toDateTime),
      },
      { accessorKey: 'hours', header: 'Hours' },
      {
        accessorKey: 'raisedOn',
        header: 'Raised on',
        cell: ({ row }) => formatDate(row.original.raisedOn),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    []
  )

  const reviewColumns = useMemo<ColumnDef<TeamAttendanceRequest>[]>(
    () => [
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      { accessorKey: 'kind', header: 'Type' },
      {
        accessorKey: 'fromDateTime',
        header: 'From',
        cell: ({ row }) => formatDateTime(row.original.fromDateTime),
      },
      { accessorKey: 'days', header: 'Days' },
      { accessorKey: 'hours', header: 'Hours' },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className='block max-w-[260px] truncate'>
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) =>
          row.original.status === 'Pending approval' ? (
            <span className='flex gap-1'>
              <Button
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.decideRequests([row.original.id], 'Approved')}
              >
                Approve
              </Button>
              <Button
                variant='outline'
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() => store.decideRequests([row.original.id], 'Rejected')}
              >
                Reject
              </Button>
            </span>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store]
  )

  const changeColumns = useMemo<ColumnDef<AttendanceChangeRequest>[]>(
    () => [
      {
        accessorKey: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <EmployeeCell
            name={row.original.employee}
            state={row.original.employeeState}
          />
        ),
      },
      {
        accessorKey: 'date',
        header: 'Attendance date',
        cell: ({ row }) => formatDate(row.original.date),
      },
      { accessorKey: 'field', header: 'Field' },
      {
        id: 'change',
        header: 'Requested change',
        cell: ({ row }) => (
          <span className='text-paragraph-sm'>
            {row.original.currentValue} → {row.original.requestedValue}
          </span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className='block max-w-[260px] truncate'>
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'raisedOn',
        header: 'Raised on',
        cell: ({ row }) => formatDate(row.original.raisedOn),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) =>
          row.original.status === 'Pending approval' ? (
            <span className='flex gap-1'>
              <Button
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() =>
                  store.decideChangeRequest(row.original.id, 'Approved')
                }
              >
                Approve
              </Button>
              <Button
                variant='outline'
                className='h-6 rounded-[6px] px-2 text-xs'
                onClick={() =>
                  store.decideChangeRequest(row.original.id, 'Rejected')
                }
              >
                Reject
              </Button>
            </span>
          ) : (
            <span className='text-neutral-1000'>—</span>
          ),
      },
    ],
    [store]
  )

  const filteredMass = useMemo(
    () =>
      applyFilter(
        store.requests,
        massFilter,
        (r) => r.fromDateTime,
        (r) => r.status
      ),
    [store.requests, massFilter]
  )

  const filteredReview = useMemo(
    () =>
      applyFilter(
        store.requests.filter((r) =>
          (OT_REVIEW_KINDS as readonly string[]).includes(r.kind)
        ),
        reviewFilter,
        (r) => r.fromDateTime,
        (r) => r.status
      ),
    [store.requests, reviewFilter]
  )

  const filteredChanges = useMemo(
    () =>
      applyFilter(
        store.changeRequests,
        changeFilter,
        (c) => c.date,
        (c) => c.status
      ),
    [store.changeRequests, changeFilter]
  )

  const summary = useMemo(
    () => [
      {
        label: 'Requests pending approval',
        value: store.requests.filter((r) => r.status === 'Pending approval')
          .length,
      },
      {
        label: 'OT / WFH / comp-off in review',
        value: store.requests.filter(
          (r) =>
            (OT_REVIEW_KINDS as readonly string[]).includes(r.kind) &&
            r.status === 'Pending approval'
        ).length,
      },
      {
        label: 'Pending change requests',
        value: store.changeRequests.filter(
          (c) => c.status === 'Pending approval'
        ).length,
      },
      {
        label: 'Decided this period',
        value: store.requests.filter((r) => r.status !== 'Pending approval')
          .length,
      },
    ],
    [store.requests, store.changeRequests]
  )

  return (
    <div className='w-full'>
      <SummaryCards title='Team Attendance Summary' items={summary} />

      <Tabs defaultValue='mass-approval' className='w-full'>
        <TabsList className='mb-3 flex-wrap bg-transparent p-0'>
          <TabsTrigger variant='primary' value='mass-approval'>
            Mass Approval
          </TabsTrigger>
          <TabsTrigger variant='primary' value='ot-review'>
            OT / WFH / Comp-off Review
          </TabsTrigger>
          <TabsTrigger variant='primary' value='change-requests'>
            Pending Change Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value='mass-approval'>
          <FilterBar
            statuses={TEAM_ATTENDANCE_STATUSES}
            value={massFilter}
            onChange={setMassFilter}
          />
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
              Team requests ({filteredMass.length})
            </h2>
            <div className='flex items-center gap-3'>
              <Button
                className='h-7 gap-1 rounded-[6px] px-2'
                disabled={pendingSelected.length === 0}
                onClick={() => decideSelected('Approved')}
              >
                <CheckCircle size={13} weight='bold' />
                Approve selected ({pendingSelected.length})
              </Button>
              <Button
                variant='outline'
                className='h-7 gap-1 rounded-[6px] px-2'
                disabled={pendingSelected.length === 0}
                onClick={() => decideSelected('Rejected')}
              >
                <XCircle size={13} weight='bold' />
                Reject selected
              </Button>
            </div>
          </div>
          <DataTable
            columns={massColumns}
            data={filteredMass}
            variant='no-status'
            resetSelectionKey={resetSelectionKey}
            onSelectionChange={(rows) => setSelected(rows)}
          />
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Only rows still pending approval are affected by a bulk decision;
            already-decided rows in the selection are skipped.
          </p>
        </TabsContent>

        <TabsContent value='ot-review'>
          <FilterBar
            statuses={TEAM_ATTENDANCE_STATUSES}
            value={reviewFilter}
            onChange={setReviewFilter}
          />
          <DataTable
            columns={reviewColumns}
            data={filteredReview}
            variant='no-status'
          />
        </TabsContent>

        <TabsContent value='change-requests'>
          <FilterBar
            statuses={CHANGE_REQUEST_STATUSES}
            value={changeFilter}
            onChange={setChangeFilter}
          />
          <DataTable
            columns={changeColumns}
            data={filteredChanges}
            variant='no-status'
          />
          <p className='text-paragraph-sm text-neutral-1000 mt-2'>
            Approving a change request corrects the employee&apos;s attendance
            record for that day; the original entry stays in the audit trail.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
