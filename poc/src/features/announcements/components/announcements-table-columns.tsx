import type { ColumnDef, HeaderContext } from '@tanstack/react-table'
import { ArrowUpDown, EyeOff, Link2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type Announcement } from '../data/announcements'
import { StatusBadge, TypeBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(value: string | null): string {
  return value ? dateFmt.format(new Date(value)) : '—'
}

function sortableHeader(label: string) {
  return function Header({ column }: HeaderContext<Announcement, unknown>) {
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

/** Management list columns per Kensium: Title, Announcement type, Event based,
 * Start date, End date, Visible to location(s), Creator person, Status (ANN-36). */
export const announcementsTableColumns: ColumnDef<Announcement>[] = [
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
    accessorKey: 'title',
    header: sortableHeader('Title'),
    cell: ({ row, column }) => {
      const a = row.original
      return (
        <HighlightedCell value={a.title} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <div className='flex items-center gap-1.5'>
              <LongText className='text-neutral-1600 font-medium'>
                {a.title}
              </LongText>
              {a.hidden && (
                <EyeOff
                  className='text-neutral-1000 size-3.5 shrink-0'
                  aria-label='Hidden from viewers'
                />
              )}
              {a.link && <Link2 className='text-blue-1400 size-3.5 shrink-0' />}
              {a.attachment && (
                <Paperclip className='text-neutral-1000 size-3.5 shrink-0' />
              )}
            </div>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {a.tenant}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'type',
    header: sortableHeader('Announcement type'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.type} columnId={column.id}>
        <TypeBadge type={row.original.type} />
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'eventBasis',
    header: sortableHeader('Event based'),
    cell: ({ row, column }) => {
      const basis = row.original.eventBasis
      return (
        <HighlightedCell value={basis} columnId={column.id}>
          <span className={basis === 'None' ? 'text-neutral-1000 text-sm' : 'text-neutral-1900 text-sm'}>
            {basis === 'None' ? '—' : basis}
          </span>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'startDate',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: sortableHeader('Start date'),
    cell: ({ row, column }) => (
      <HighlightedCell value={formatDate(row.original.startDate)} columnId={column.id}>
        <span className='text-neutral-1900 text-sm'>
          {formatDate(row.original.startDate)}
        </span>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'endDate',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: sortableHeader('End date'),
    cell: ({ row, column }) => {
      const end = row.original.endDate
      return (
        <HighlightedCell value={formatDate(end)} columnId={column.id}>
          <span className={end ? 'text-neutral-1900 text-sm' : 'text-neutral-1000 text-sm'}>
            {end ? formatDate(end) : 'No expiry'}
          </span>
        </HighlightedCell>
      )
    },
  },
  {
    id: 'locations',
    accessorFn: (row) =>
      row.targeting.locations.length > 0
        ? row.targeting.locations.join(', ')
        : 'All locations',
    header: sortableHeader('Visible to location(s)'),
    cell: ({ row, column }) => {
      const locations = row.original.targeting.locations
      const label = locations.length > 0 ? locations.join(', ') : 'All locations'
      return (
        <HighlightedCell value={label} columnId={column.id}>
          <LongText className='text-neutral-1900 text-sm'>{label}</LongText>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'creator',
    header: sortableHeader('Creator person'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.creator} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.creator}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'status',
    id: 'status',
    meta: { requiresWholeWordMatch: true },
    header: sortableHeader('Status'),
    cell: ({ row, column }) => (
      <div className='p-1.5'>
        <HighlightedCell value={row.original.status} columnId={column.id}>
          <StatusBadge status={row.original.status} />
        </HighlightedCell>
      </div>
    ),
  },
]
