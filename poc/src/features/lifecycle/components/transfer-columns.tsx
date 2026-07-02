import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { fmtDate } from '../data/shared'
import { type TransferRequest } from '../data/transfers'
import { StatusBadge } from './badges'
import { SortHeader } from './columns-shared'

export const transferColumns: ColumnDef<TransferRequest>[] = [
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
    accessorKey: 'type',
    header: ({ column }) => <SortHeader column={column} label='Type' />,
    cell: ({ row }) => <Badge variant='outline'>{row.original.type}</Badge>,
  },
  {
    id: 'move',
    header: () => <span className='text-paragraph-sm font-medium'>Move</span>,
    cell: ({ row }) => {
      const t = row.original
      const from =
        t.type === 'Inter-Department'
          ? t.fromDepartment
          : t.type === 'Inter-Location'
            ? t.fromLocation
            : t.fromCompany
      const to =
        t.type === 'Inter-Department'
          ? t.toDepartment
          : t.type === 'Inter-Location'
            ? t.toLocation
            : t.toCompany
      return (
        <span className='text-sm'>
          {from} → {to}
        </span>
      )
    },
  },
  {
    accessorKey: 'effectiveDate',
    header: ({ column }) => <SortHeader column={column} label='Effective' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.effectiveDate)}</span>
    ),
  },
  {
    id: 'approvals',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Approvals</span>
    ),
    cell: ({ row }) => {
      const approved = row.original.approvals.filter(
        (s) => s.status === 'approved'
      ).length
      return (
        <span className='text-sm'>
          {approved}/{row.original.approvals.length}
          {row.original.approvals.some((s) => s.role === 'Group Admin') &&
            ' · group-level'}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]
