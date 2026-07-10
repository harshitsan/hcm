import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { type ExitCase } from '../data/exits'
import { fmtDate } from '../data/shared'
import { ExitStatusBadge } from './exit-status-badge'
import { SortHeader } from './columns-shared'

export const exitColumns: ColumnDef<ExitCase>[] = [
  {
    accessorKey: 'employeeName',
    header: ({ column }) => <SortHeader column={column} label='Employee' />,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1600 font-medium'>
          {row.original.employeeName}
        </span>
        <span className='text-neutral-1000 text-xs'>
          {row.original.employeeCode} · {row.original.department}
          {row.original.raisedBy === 'Admin (proxy)' && ' · raised by admin'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'exitType',
    header: ({ column }) => <SortHeader column={column} label='Exit type' />,
    cell: ({ row }) => <Badge variant='outline'>{row.original.exitType}</Badge>,
  },
  {
    accessorKey: 'requestedOn',
    header: ({ column }) => <SortHeader column={column} label='Requested' />,
    cell: ({ row }) => (
      <span className='text-sm'>{fmtDate(row.original.requestedOn)}</span>
    ),
  },
  {
    accessorKey: 'lastWorkingDay',
    header: ({ column }) => <SortHeader column={column} label='Last working day' />,
    cell: ({ row }) => {
      const e = row.original
      if (e.exitType === 'Suspension' && e.suspensionFrom && e.suspensionTill) {
        return (
          <div className='flex flex-col text-sm'>
            <span>
              {fmtDate(e.suspensionFrom)} – {fmtDate(e.suspensionTill)}
            </span>
            <span className='text-neutral-1000 text-xs'>
              suspension window{e.suspensionWithPay ? ' · with pay' : ' · without pay'}
            </span>
          </div>
        )
      }
      return (
        <div className='flex flex-col text-sm'>
          <span>{fmtDate(e.approvedLwd ?? e.lastWorkingDay)}</span>
          <span className='text-neutral-1000 text-xs'>
            {e.approvedLwd
              ? 'approved LWD'
              : `${e.noticePeriodDays} day notice`}
          </span>
        </div>
      )
    },
  },
  {
    id: 'clearance',
    header: () => (
      <span className='text-paragraph-sm font-medium'>Clearance</span>
    ),
    cell: ({ row }) => {
      const cleared = row.original.clearances.filter(
        (c) => c.status === 'cleared'
      ).length
      return (
        <span className='text-sm'>
          {cleared}/{row.original.clearances.length} functions
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortHeader column={column} label='Status' />,
    cell: ({ row }) => <ExitStatusBadge status={row.original.status} />,
  },
]
