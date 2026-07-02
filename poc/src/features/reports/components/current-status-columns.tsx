import type { ColumnDef } from '@tanstack/react-table'
import { LongText } from '@/components/common/long-text'
import { type EmployeeStatusRow } from '../data/current-status'
import { StatusBadge } from './badges'

/** Columns for the real-time Employee Current Status screen (RPT-44). */
export const currentStatusColumns: ColumnDef<EmployeeStatusRow>[] = [
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.department}</span>
    ),
  },
  {
    accessorKey: 'positionLevel',
    header: 'Position Level',
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.positionLevel}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Employee Name',
    cell: ({ row }) => (
      <LongText className='text-neutral-1600 text-sm font-medium'>
        {row.original.name}
      </LongText>
    ),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => <span className='text-sm'>{row.original.location}</span>,
  },
  {
    accessorKey: 'project',
    header: 'Project',
    cell: ({ row }) => <span className='text-sm'>{row.original.project}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Current Status',
    cell: ({ row }) => (
      <div className='p-1.5'>
        <StatusBadge status={row.original.status} />
      </div>
    ),
  },
]
