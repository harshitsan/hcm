import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { type LayoffBatch, type LayoffEmployee } from '../data/layoffs'
import { fmtDate } from '../data/shared'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

/** Layoff List grid — batch per row, per the Layoff List screen. */
export const layoffColumns: ColumnDef<LayoffBatch>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortHeader column={column} label='Layoff name' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.name}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.id} · {row.original.location}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'initiatedOn',
    header: ({ column }) => (
      <SortHeader column={column} label='Initiated date' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.initiatedOn)}</span>
    ),
  },
  {
    accessorKey: 'initiatedBy',
    header: ({ column }) => (
      <SortHeader column={column} label='Initiated by' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.initiatedBy}</span>
    ),
  },
  {
    id: 'employees',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Number of employees</span>
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.employees.length}</span>
    ),
  },
  {
    id: 'approver',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Location approver</span>
    ),
    cell: ({ row }) => {
      const step = row.original.approvals.find(
        (s) => s.role === 'Location Approver'
      )
      return <span className='text-sm'>{step?.approver ?? '—'}</span>
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

/** Employee picker columns used by the bulk-initiate overlay. */
export const layoffEmployeeColumns: ColumnDef<LayoffEmployee>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.name}
        </span>
        <span className='text-neutral-1000 text-xs'>{row.original.code}</span>
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
      <Badge variant='outline'>{row.original.positionLevel}</Badge>
    ),
  },
]
