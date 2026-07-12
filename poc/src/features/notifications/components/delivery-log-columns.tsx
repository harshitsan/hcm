import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import {
  EVENT_TYPE_LABELS,
  OUTBOX_MODEL_LABELS,
  type DeliveryRecord,
} from '../data/notifications'
import {
  AttemptBadge,
  DeliveryStatusBadge,
  ModelBadge,
} from './notification-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Persisted delivery records (NTF-18): per-channel attempts with status,
 * timestamps and error reasons. Records are immutable — there are no edit or
 * delete affordances by design.
 */
export const deliveryLogColumns: ColumnDef<DeliveryRecord>[] = [
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
    accessorKey: 'id',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Record'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Record
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.id} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1600 text-sm font-medium'>
            {row.original.id}
          </span>
          <LongText className='text-paragraph-sm text-neutral-1000'>
            {row.original.subject}
          </LongText>
        </div>
      </HighlightedCell>
    ),
  },
  {
    id: 'eventType',
    accessorFn: (row) => EVENT_TYPE_LABELS[row.eventType],
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Event'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Event
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell
        value={EVENT_TYPE_LABELS[row.original.eventType]}
        columnId={column.id}
      >
        <span className='text-neutral-1900 text-sm'>
          {EVENT_TYPE_LABELS[row.original.eventType]}
        </span>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'recipient',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Recipient'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Recipient
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.recipient} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1900 text-sm'>
            {row.original.recipient}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000'>
            {row.original.recipientType === 'non-user'
              ? 'Non-user (email only)'
              : row.original.templateVersion}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    id: 'model',
    accessorFn: (row) => OUTBOX_MODEL_LABELS[row.model],
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Model'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Model
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell
        value={OUTBOX_MODEL_LABELS[row.original.model]}
        columnId={column.id}
      >
        <div className='p-1.5'>
          <ModelBadge model={row.original.model} />
        </div>
      </HighlightedCell>
    ),
  },
  {
    id: 'attempts',
    header: () => <span className='text-sm font-medium'>Channel attempts</span>,
    cell: ({ row }) => (
      <div className='flex flex-wrap gap-1 py-1'>
        {row.original.attempts.map((a, i) => (
          <span key={`${a.channel}-${i}`} title={a.error ?? a.timestamp}>
            <AttemptBadge channel={a.channel} status={a.status} />
          </span>
        ))}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'finalStatus',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Outcome'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Outcome
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.finalStatus} columnId={column.id}>
        <div className='flex flex-col gap-0.5 p-1.5'>
          <div>
            <DeliveryStatusBadge status={row.original.finalStatus} />
          </div>
          {row.original.note && (
            <span className='text-paragraph-sm text-neutral-1000'>
              {row.original.note}
            </span>
          )}
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Generated'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Generated
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {dateFmt.format(new Date(row.original.createdAt))}
      </span>
    ),
  },
]
