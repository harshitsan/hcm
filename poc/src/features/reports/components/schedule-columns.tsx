import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/common/long-text'
import { type ReportSchedule } from '../data/schedules'
import { StatusBadge } from './badges'

/** Columns for the scheduled report deliveries table (RPT-09). */
export const scheduleColumns: ColumnDef<ReportSchedule>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label='Select all'
        variant='blue'
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        variant='blue'
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: 'reportName',
    header: 'Report',
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <LongText className='text-neutral-1600 font-medium'>
          {row.original.reportName}
        </LongText>
        <span className='text-paragraph-sm text-neutral-1000 truncate'>
          scope: {row.original.scope}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'frequency',
    header: 'Frequency',
    cell: ({ row }) => (
      <span className='text-sm'>
        {row.original.frequency} · {row.original.time}
      </span>
    ),
  },
  {
    accessorKey: 'recipients',
    header: 'Recipients',
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 max-w-[260px] text-sm'>
        {row.original.recipients.join(', ')}
      </LongText>
    ),
  },
  {
    accessorKey: 'format',
    header: 'Format',
    cell: ({ row }) => <span className='text-sm'>{row.original.format}</span>,
  },
  {
    accessorKey: 'nextRun',
    header: 'Delivery timeline',
    cell: ({ row }) => (
      <div className='flex flex-col text-sm'>
        <span className='text-neutral-1000 text-xs'>
          Last run · {row.original.lastRun}
        </span>
        <span>Next run · {row.original.nextRun}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className='p-1.5'>
        <StatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: 'createdBy',
    header: 'Created by',
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.createdBy}</span>
    ),
  },
]
