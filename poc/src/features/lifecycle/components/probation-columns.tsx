import type { ColumnDef } from '@tanstack/react-table'
import {
  type PeerReview,
  type PeriodicReview,
  type ProbationCase,
} from '../data/probation'
import { fmtDate } from '../data/shared'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

export const probationColumns: ColumnDef<ProbationCase>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.employeeName}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.employeeCode} · {row.original.employeeClass}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: ({ column }) => <SortHeader column={column} label='Department' />,
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.department}</span>
    ),
  },
  {
    accessorKey: 'positionLevel',
    header: ({ column }) => <SortHeader column={column} label='Position' />,
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.positionLevel}</span>
    ),
  },
  {
    accessorKey: 'manager',
    header: ({ column }) => <SortHeader column={column} label='Manager' />,
    cell: ({ row }) => <span className='text-sm'>{row.original.manager}</span>,
  },
  {
    accessorKey: 'joinDate',
    header: ({ column }) => <SortHeader column={column} label='Joined' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.joinDate)}</span>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => <SortHeader column={column} label='Review due' />,
    cell: ({ row }) => (
      <div className='flex flex-col text-sm'>
        <span>{fmtDate(row.original.dueDate)}</span>
        {row.original.extendedTo && (
          <span className='text-neutral-1000 text-xs'>
            extended to {fmtDate(row.original.extendedTo)}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

export const peerReviewColumns: ColumnDef<PeerReview>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <span className='text-neutral-1600 font-medium'>
        {row.original.employeeName}
      </span>
    ),
  },
  {
    accessorKey: 'reviewer',
    header: ({ column }) => <SortHeader column={column} label='Reviewer' />,
    cell: ({ row }) => <span className='text-sm'>{row.original.reviewer}</span>,
  },
  {
    accessorKey: 'requestedBy',
    header: ({ column }) => <SortHeader column={column} label='Requested by' />,
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.requestedBy}</span>
    ),
  },
  {
    accessorKey: 'reviewDate',
    header: ({ column }) => <SortHeader column={column} label='Review date' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.reviewDate)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

export const periodicReviewColumns: ColumnDef<PeriodicReview>[] = [
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
    accessorKey: 'department',
    header: ({ column }) => <SortHeader column={column} label='Department' />,
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.department}</span>
    ),
  },
  {
    accessorKey: 'manager',
    header: ({ column }) => <SortHeader column={column} label='Manager' />,
    cell: ({ row }) => <span className='text-sm'>{row.original.manager}</span>,
  },
  {
    accessorKey: 'periodFrom',
    header: ({ column }) => <SortHeader column={column} label='Period from' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.periodFrom)}</span>
    ),
  },
  {
    accessorKey: 'periodTo',
    header: ({ column }) => <SortHeader column={column} label='Period to' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.periodTo)}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]
