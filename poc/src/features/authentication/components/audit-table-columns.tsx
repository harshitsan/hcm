import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { companyName } from '../data/companies'
import { AUTH_EVENT_LABELS, type AuthAuditEvent } from '../data/auth-audit'
import { AUTH_METHOD_LABELS } from '../data/auth-users'
import { EventTypeBadge, OutcomeBadge } from './auth-badges'

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function sortableHeader(label: string) {
  return function Header({ column }: { column: Column<AuthAuditEvent, unknown> }) {
    return (
      <SearchableHeader column={column} columnName={label}>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {label}
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    )
  }
}

/**
 * Read-only audit log columns (AUTH-15) — no selection column on purpose:
 * records cannot be edited or removed from the review interface.
 */
export const auditTableColumns: ColumnDef<AuthAuditEvent>[] = [
  {
    accessorKey: 'timestamp',
    header: sortableHeader('Timestamp'),
    cell: ({ row, column }) => {
      const formatted = dateTimeFmt.format(new Date(row.original.timestamp))
      return (
        <HighlightedCell value={formatted} columnId={column.id}>
          <span className='text-neutral-1900 text-sm whitespace-nowrap'>
            {formatted}
          </span>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'actor',
    header: sortableHeader('Actor'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.actor} columnId={column.id}>
        <LongText className='text-neutral-1600 max-w-[200px] text-sm font-medium'>
          {row.original.actor}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    id: 'eventType',
    accessorFn: (event) => AUTH_EVENT_LABELS[event.eventType],
    header: sortableHeader('Event'),
    cell: ({ row, column }) => (
      <HighlightedCell
        value={AUTH_EVENT_LABELS[row.original.eventType]}
        columnId={column.id}
      >
        <EventTypeBadge eventType={row.original.eventType} />
      </HighlightedCell>
    ),
  },
  {
    id: 'method',
    accessorFn: (event) =>
      event.method ? AUTH_METHOD_LABELS[event.method] : '—',
    header: sortableHeader('Method'),
    cell: ({ row, column }) => {
      const label = row.original.method
        ? AUTH_METHOD_LABELS[row.original.method]
        : '—'
      return (
        <HighlightedCell value={label} columnId={column.id}>
          <span className='text-neutral-1900 text-sm'>{label}</span>
        </HighlightedCell>
      )
    },
  },
  {
    id: 'company',
    accessorFn: (event) =>
      event.companyId ? companyName(event.companyId) : 'Platform',
    header: sortableHeader('Company'),
    cell: ({ row, column }) => {
      const label = row.original.companyId
        ? companyName(row.original.companyId)
        : 'Platform'
      return (
        <HighlightedCell value={label} columnId={column.id}>
          <span className='text-neutral-1900 text-sm'>{label}</span>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'outcome',
    size: 50,
    meta: { requiresWholeWordMatch: true },
    header: sortableHeader('Outcome'),
    cell: ({ row, column }) => (
      <div className='p-1.5'>
        <HighlightedCell value={row.original.outcome} columnId={column.id}>
          <OutcomeBadge outcome={row.original.outcome} />
        </HighlightedCell>
      </div>
    ),
  },
  {
    accessorKey: 'detail',
    header: sortableHeader('Detail'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.detail} columnId={column.id}>
        <LongText className='text-neutral-1000 max-w-[320px] text-xs'>
          {row.original.detail}
        </LongText>
      </HighlightedCell>
    ),
  },
]
