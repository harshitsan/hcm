import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/common/data-table/table'
import { type ProbationCase } from '../data/probation'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

type ClassChangeStatus = 'pending-approval' | 'approved' | 'cancelled'

/** Class-change row derived from a probation case at confirmation time. */
interface ClassChangeRow {
  caseId: string
  employeeName: string
  employeeCode: string
  originalClass: string
  destinationClass: string
  oldDepartment: string
  newDepartment: string
  oldPosition: string
  newPosition: string
  status: ClassChangeStatus
}

/** Confirmation moves Contract staff to Full-time; others keep their class. */
function destinationClass(employeeClass: string) {
  return employeeClass === 'Contract' ? 'Full-time' : employeeClass
}

/**
 * Class changes are triggered by the confirmation decision: a case with a
 * Confirm decision produces a pending/approved class change; a separation
 * cancels the class change.
 */
function toClassChangeRow(c: ProbationCase): ClassChangeRow | null {
  let status: ClassChangeStatus
  if (c.decision === 'Confirm' && c.status === 'pending-approval')
    status = 'pending-approval'
  else if (c.status === 'confirmed') status = 'approved'
  else if (c.status === 'separation-initiated') status = 'cancelled'
  else return null
  return {
    caseId: c.id,
    employeeName: c.employeeName,
    employeeCode: c.employeeCode,
    originalClass: `${c.employeeClass} · Probationer`,
    destinationClass: `${destinationClass(c.employeeClass)} · Confirmed`,
    oldDepartment: c.department,
    newDepartment: c.department,
    oldPosition: c.positionLevel,
    newPosition: c.positionLevel,
    status,
  }
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'cancelled', label: 'Cancelled' },
]

const classChangeColumns: ColumnDef<ClassChangeRow>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.employeeName}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.employeeCode}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'originalClass',
    header: ({ column }) => (
      <SortHeader column={column} label='Original class' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.originalClass}</span>
    ),
  },
  {
    accessorKey: 'destinationClass',
    header: ({ column }) => (
      <SortHeader column={column} label='Destination class' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.destinationClass}</span>
    ),
  },
  {
    id: 'department',
    header: () => (
      <span className='text-paragraph-sm font-medium'>
        Department (old → new)
      </span>
    ),
    cell: ({ row }) => (
      <span className='text-sm'>
        {row.original.oldDepartment}
        {row.original.oldDepartment !== row.original.newDepartment &&
          ` → ${row.original.newDepartment}`}
      </span>
    ),
  },
  {
    id: 'position',
    header: () => (
      <span className='text-paragraph-sm font-medium'>
        Position (old → new)
      </span>
    ),
    cell: ({ row }) => (
      <span className='text-sm'>
        {row.original.oldPosition}
        {row.original.oldPosition !== row.original.newPosition &&
          ` → ${row.original.newPosition}`}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

interface ClassChangeListProps {
  cases: ProbationCase[]
  onSelect: (caseId: string) => void
}

/**
 * Class Change Employees List — a filtered view over the confirmation grid
 * showing class movements triggered by confirmation decisions.
 */
export function ClassChangeList({ cases, onSelect }: ClassChangeListProps) {
  const [status, setStatus] = useState('all')

  const rows = useMemo(
    () =>
      cases
        .map(toClassChangeRow)
        .filter((r): r is ClassChangeRow => r !== null)
        .filter((r) => status === 'all' || r.status === status),
    [cases, status]
  )

  return (
    <div className='w-full'>
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger variant='secondary' className='h-7 w-[170px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={classChangeColumns}
        data={rows}
        variant='no-status'
        onRowClick={(row: ClassChangeRow) => onSelect(row.caseId)}
      />
      <p className='text-paragraph-sm text-neutral-1000 mt-2'>
        Class changes follow the confirmation decision — approving a
        confirmation approves the class change; an initiated separation
        cancels it. Click a row to open the underlying confirmation case.
      </p>
    </div>
  )
}
