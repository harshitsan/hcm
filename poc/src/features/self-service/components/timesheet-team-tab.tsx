import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/data-table/table'
import {
  seedUtilizationRows,
  utilizationPct,
  UTILIZATION_STATUSES,
  type UtilizationRow,
} from '../data/timesheet-team'
import { FilterBar, SummaryCards } from './shared'
import { StatusBadge } from './status-badge'
import { applyFilter, EMPTY_FILTER, type PeriodStatusFilter } from './utils'

/** Employee name with an inactive marker, matching the other team lists. */
function EmployeeCell({ name, state }: { name: string; state: string }) {
  return (
    <span className='flex items-center gap-1.5'>
      {name}
      {state === 'Inactive' && <Badge variant='badge_inactive'>Inactive</Badge>}
    </span>
  )
}

/** Colour-coded utilization percentage cell. */
function UtilizationCell({ row }: { row: UtilizationRow }) {
  const pct = utilizationPct(row)
  const variant =
    row.status === 'Pending for submission'
      ? 'badge_inactive'
      : pct >= 85
        ? 'badge_active'
        : pct >= 70
          ? 'pending'
          : 'overdue'
  return <Badge variant={variant}>{pct}%</Badge>
}

/**
 * Timesheet Utilization Summary team view (More → Time Management → Team
 * Functions): allocated vs submitted vs productive hours per employee-week.
 */
export function TimesheetTeamTab() {
  const [filter, setFilter] = useState<PeriodStatusFilter>(EMPTY_FILTER)

  const columns = useMemo<ColumnDef<UtilizationRow>[]>(
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
      { accessorKey: 'department', header: 'Department' },
      {
        id: 'period',
        header: 'Week',
        cell: ({ row }) =>
          `${row.original.periodStart} → ${row.original.periodEnd}`,
      },
      { accessorKey: 'allocatedHours', header: 'Allocated (h)' },
      {
        accessorKey: 'submittedHours',
        header: 'Submitted (h)',
        cell: ({ row }) =>
          row.original.status === 'Pending for submission'
            ? '—'
            : row.original.submittedHours,
      },
      { accessorKey: 'productiveHours', header: 'Productive (h)' },
      { accessorKey: 'nonProductiveHours', header: 'Non-productive (h)' },
      {
        id: 'utilization',
        header: 'Utilization',
        cell: ({ row }) => <UtilizationCell row={row.original} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    []
  )

  const filtered = useMemo(
    () =>
      applyFilter(
        seedUtilizationRows,
        filter,
        (r) => r.periodStart,
        (r) => r.status
      ),
    [filter]
  )

  const summary = useMemo(() => {
    const submitted = seedUtilizationRows.filter(
      (r) => r.status !== 'Pending for submission'
    )
    const avg =
      submitted.length === 0
        ? 0
        : Math.round(
            submitted.reduce((sum, r) => sum + utilizationPct(r), 0) /
              submitted.length
          )
    return [
      { label: 'Team members tracked', value: new Set(seedUtilizationRows.map((r) => r.employee)).size },
      { label: 'Average utilization', value: `${avg}%` },
      {
        label: 'Pending submissions',
        value: seedUtilizationRows.filter(
          (r) => r.status === 'Pending for submission'
        ).length,
      },
      {
        label: 'Hours submitted',
        value: submitted.reduce((sum, r) => sum + r.submittedHours, 0),
      },
    ]
  }, [])

  return (
    <div className='w-full'>
      <SummaryCards title='Timesheet Utilization Summary' items={summary} />
      <FilterBar
        statuses={UTILIZATION_STATUSES}
        value={filter}
        onChange={setFilter}
      />
      <DataTable columns={columns} data={filtered} variant='no-status' />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Utilization = productive hours over allocated hours for the week.
        Weeks still pending submission show no submitted hours.
      </p>
    </div>
  )
}
