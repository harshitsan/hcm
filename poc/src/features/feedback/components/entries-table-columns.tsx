import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ShieldAlert, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type FeedbackEntry } from '../data/entries'
import { EntryStatusBadge, EntryTypeBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

/** Submitter cell — anonymous identities stay withheld everywhere (FBG-30). */
function renderSubmitterCell(entry: FeedbackEntry) {
  if (entry.anonymous) {
    return (
      <span className='text-neutral-1000 flex items-center gap-1 text-sm'>
        <ShieldAlert className='size-3.5' />
        Anonymous ({entry.anonymousRef})
      </span>
    )
  }
  if (entry.onBehalfOf) {
    return (
      <span className='text-neutral-1900 flex items-center gap-1 text-sm'>
        <UserRound className='size-3.5' />
        {entry.onBehalfOf}
        <Badge variant='pending'>On behalf</Badge>
      </span>
    )
  }
  return <span className='text-neutral-1900 text-sm'>{entry.submittedBy}</span>
}

const selectColumn: ColumnDef<FeedbackEntry> = {
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
}

function sortableSearchHeader(label: string) {
  return function Header({
    column,
  }: {
    column: Column<FeedbackEntry, unknown>
  }) {
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

const entryColumn: ColumnDef<FeedbackEntry> = {
  accessorKey: 'subject',
  header: sortableSearchHeader('Entry'),
  cell: ({ row, column }) => {
    const entry = row.original
    return (
      <HighlightedCell value={entry.subject} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {entry.subject}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {entry.id} · form v{entry.schemaVersion}
          </span>
        </div>
      </HighlightedCell>
    )
  },
}

const typeColumn: ColumnDef<FeedbackEntry> = {
  accessorKey: 'type',
  size: 60,
  header: sortableSearchHeader('Type'),
  cell: ({ row }) => (
    <div className='p-1.5'>
      <EntryTypeBadge type={row.original.type} />
    </div>
  ),
}

const categoryColumn: ColumnDef<FeedbackEntry> = {
  accessorKey: 'category',
  header: sortableSearchHeader('Category'),
  cell: ({ row, column }) => (
    <HighlightedCell value={row.original.category} columnId={column.id}>
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.category}
      </LongText>
    </HighlightedCell>
  ),
}

const statusColumn: ColumnDef<FeedbackEntry> = {
  accessorKey: 'status',
  size: 60,
  meta: { requiresWholeWordMatch: true },
  header: sortableSearchHeader('Status'),
  cell: ({ row, column }) => (
    <div className='p-1.5'>
      <HighlightedCell value={row.original.status} columnId={column.id}>
        <EntryStatusBadge status={row.original.status} />
      </HighlightedCell>
    </div>
  ),
}

const submittedOnColumn: ColumnDef<FeedbackEntry> = {
  accessorKey: 'submittedOn',
  meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
  header: sortableSearchHeader('Submitted on'),
  cell: ({ row }) => (
    <span className='text-sm'>
      {dateFmt.format(new Date(row.original.submittedOn))}
    </span>
  ),
}

/**
 * Reviewer worklist columns (FBG-19). The idle-age cell turns into an SLA
 * breach badge once an open entry passes the configured approver threshold.
 */
export function createWorklistColumns(
  approverReminderDays: number
): ColumnDef<FeedbackEntry>[] {
  return [
    selectColumn,
    entryColumn,
    typeColumn,
    categoryColumn,
    {
      id: 'submitter',
      header: () => <span className='px-2 text-sm font-medium'>Submitter</span>,
      cell: ({ row }) => renderSubmitterCell(row.original),
    },
    {
      accessorKey: 'company',
      header: sortableSearchHeader('Company'),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.company} columnId={column.id}>
          <span className='text-neutral-1900 text-sm'>{row.original.company}</span>
        </HighlightedCell>
      ),
    },
    statusColumn,
    {
      accessorKey: 'assignedTo',
      header: sortableSearchHeader('Assigned to'),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.assignedTo} columnId={column.id}>
          <span className='text-neutral-1900 text-sm'>{row.original.assignedTo}</span>
        </HighlightedCell>
      ),
    },
    submittedOnColumn,
    {
      id: 'idleAge',
      size: 70,
      header: () => <span className='px-2 text-sm font-medium'>Idle</span>,
      cell: ({ row }) => {
        const entry = row.original
        const open = entry.status === 'Submitted' || entry.status === 'Under Review'
        const idle = daysSince(entry.lastActionOn)
        if (!open) return <span className='text-neutral-1000 text-sm'>—</span>
        return idle >= approverReminderDays ? (
          <Badge variant='overdue'>{idle}d — SLA</Badge>
        ) : (
          <span className='text-neutral-1900 text-sm'>{idle}d</span>
        )
      },
    },
  ]
}

/** Employee "my entries" columns (FBG-04) — no reviewer-only fields. */
export const myEntriesColumns: ColumnDef<FeedbackEntry>[] = [
  selectColumn,
  entryColumn,
  typeColumn,
  categoryColumn,
  {
    id: 'visibility',
    header: () => <span className='px-2 text-sm font-medium'>Submitted as</span>,
    cell: ({ row }) => {
      const entry = row.original
      return entry.anonymous ? (
        <span className='text-neutral-1000 flex items-center gap-1 text-sm'>
          <ShieldAlert className='size-3.5' />
          Anonymous ({entry.anonymousRef})
        </span>
      ) : (
        <span className='text-neutral-1900 text-sm'>Named submission</span>
      )
    },
  },
  statusColumn,
  submittedOnColumn,
  {
    accessorKey: 'lastActionOn',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: sortableSearchHeader('Last update'),
    cell: ({ row }) => (
      <span className='text-sm'>
        {dateFmt.format(new Date(row.original.lastActionOn))}
      </span>
    ),
  },
]
