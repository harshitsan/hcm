import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type Distribution } from '../data/distributions'
import { describeDueRule } from '../utils/audience'
import {
  AckTypeBadge,
  CriticalityBadge,
  DistributionStatusBadge,
} from './status-badges'

/** Per-recipient aggregates computed from the assignments store. */
export interface DistributionAggregates {
  total: number
  acknowledged: number
  pending: number
  overdue: number
  failed: number
}

export type DistributionRow = Distribution & { agg: DistributionAggregates }

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const distributionsTableColumns: ColumnDef<DistributionRow>[] = [
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
    accessorKey: 'policyTitle',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Policy'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Policy
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const d = row.original
      return (
        <HighlightedCell value={d.policyTitle} columnId={column.id}>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <LongText className='text-neutral-1600 font-medium'>
              {`${d.policyTitle} · ${d.policyVersion}`}
            </LongText>
            <span>
              <CriticalityBadge level={d.criticality} />
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'audienceSummary',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Audience'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Audience
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.audienceSummary} columnId={column.id}>
        <LongText className='text-neutral-1900 max-w-[260px] text-sm'>
          {row.original.audienceSummary}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'method',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Method'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Method
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const d = row.original
      const sub =
        d.method === 'Scheduled' && d.scheduledFor
          ? dateFmt.format(new Date(d.scheduledFor))
          : d.method === 'Event-triggered'
            ? `On ${d.eventTrigger ?? 'event'}`
            : d.isBulk
              ? 'Bulk run'
              : null
      return (
        <HighlightedCell value={d.method} columnId={column.id}>
          <div className='flex flex-col text-sm'>
            <span className='text-neutral-1900'>{d.method}</span>
            {sub && (
              <span className='text-paragraph-sm text-neutral-1000'>{sub}</span>
            )}
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'ackType',
    header: () => <span className='text-sm font-medium'>Ack type</span>,
    cell: ({ row }) => <AckTypeBadge type={row.original.ackType} />,
    size: 110,
  },
  {
    id: 'dueRule',
    header: () => <span className='text-sm font-medium'>Due date rule</span>,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {describeDueRule(row.original.dueDateRule)}
      </span>
    ),
  },
  {
    id: 'progress',
    header: () => <span className='text-sm font-medium'>Acknowledgment</span>,
    cell: ({ row }) => {
      const { agg, ackType, status } = row.original
      if (status !== 'Sent') {
        return <span className='text-neutral-1000 text-sm'>—</span>
      }
      if (ackType === 'Read-Only') {
        return (
          <span className='text-neutral-1900 text-sm'>
            {agg.total} delivered · info only
          </span>
        )
      }
      return (
        <div className='text-paragraph-sm flex flex-col'>
          <span className='text-green-1300'>{agg.acknowledged} acknowledged</span>
          <span className='text-neutral-1000'>
            {agg.pending} pending · {agg.overdue} overdue
            {agg.failed > 0 ? ` · ${agg.failed} failed` : ''}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    id: 'distStatus',
    header: () => <span className='text-sm font-medium'>Status</span>,
    cell: ({ row }) => <DistributionStatusBadge status={row.original.status} />,
    size: 110,
  },
]
