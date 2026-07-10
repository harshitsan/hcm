import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import type { Requisition } from '../data/requisitions'
import {
  HiringAsBadge,
  NonBudgetedBadge,
  StatusBadge,
  UnassignedBadge,
} from './badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function sortableHeader(label: string) {
  return function Header({ column }: { column: Column<Requisition, unknown> }) {
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

/** Requisition dashboard columns (TA-01, TA-03, TA-04, TA-52). */
export const requisitionColumns: ColumnDef<Requisition>[] = [
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
    header: sortableHeader('RRF ID'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.id} columnId={column.id}>
        <span className='text-neutral-1600 text-sm font-medium'>
          {row.original.id}
        </span>
      </HighlightedCell>
    ),
    size: 110,
  },
  {
    accessorKey: 'title',
    header: sortableHeader('Position'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.title} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <div className='flex min-w-0 items-center gap-1'>
            <LongText className='text-neutral-1600 text-sm font-medium'>
              {row.original.title}
            </LongText>
            {/* Confidential hiring marker */}
            {row.original.confidential && (
              <span
                title='Confidential hiring'
                className='inline-flex shrink-0 items-center gap-0.5 rounded-full border border-gray-200 bg-gray-100 px-1.5 py-px text-[10px] font-medium text-gray-600'
              >
                <Lock className='size-2.5' />
                Confidential
              </span>
            )}
          </div>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.department} · {row.original.employeeClass}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'location',
    header: sortableHeader('Location'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.location} columnId={column.id}>
        <span className='text-neutral-1900 text-sm'>
          {row.original.location}
        </span>
      </HighlightedCell>
    ),
  },
  {
    // RL-04: reason for the vacancy — New Join vs Replacement (with backfill).
    accessorKey: 'hiringAs',
    header: sortableHeader('Hiring As'),
    meta: { requiresWholeWordMatch: true },
    cell: ({ row }) => {
      const r = row.original
      return (
        <div className='flex flex-col gap-0.5 p-1.5'>
          <div>
            <HiringAsBadge hiringAs={r.hiringAs} />
          </div>
          {r.hiringAs === 'Replacement' && r.replacementFor && (
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              Replacing {r.replacementFor}
            </span>
          )}
        </div>
      )
    },
    size: 150,
  },
  {
    // Hiring urgency from the RRF — High is flagged in red/amber.
    accessorKey: 'priority',
    header: sortableHeader('Priority'),
    meta: { requiresWholeWordMatch: true },
    cell: ({ row }) => (
      <span
        className={[
          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
          row.original.priority === 'High'
            ? 'border-red-200 bg-amber-50 text-red-600'
            : 'border-gray-200 bg-gray-100 text-gray-600',
        ].join(' ')}
      >
        {row.original.priority}
      </span>
    ),
    size: 90,
  },
  {
    accessorKey: 'headcount',
    header: sortableHeader('Headcount'),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.headcount}
      </span>
    ),
    size: 90,
  },
  {
    id: 'owners',
    accessorFn: (r) => `${r.recruiter ?? ''} ${r.hiringManager ?? ''}`,
    header: sortableHeader('Recruiter / HM'),
    cell: ({ row }) => {
      const r = row.original
      const unassigned =
        !r.recruiter &&
        (r.status === 'approved' || r.status === 'sourcing')
      return (
        <div className='flex flex-col gap-0.5'>
          {unassigned ? (
            <UnassignedBadge />
          ) : (
            <>
              <span className='text-neutral-1900 text-sm'>
                {r.recruiter ?? '—'}
              </span>
              <span className='text-paragraph-sm text-neutral-1000'>
                {r.hiringManager ?? '—'}
              </span>
            </>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: sortableHeader('Status'),
    meta: { requiresWholeWordMatch: true },
    cell: ({ row }) => (
      <div className='flex flex-wrap items-center gap-1 p-1.5'>
        <StatusBadge status={row.original.status} />
        {row.original.nonBudgeted && <NonBudgetedBadge />}
      </div>
    ),
  },
  {
    accessorKey: 'closingDate',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: sortableHeader('Closing date'),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {dateFmt.format(new Date(row.original.closingDate))}
      </span>
    ),
  },
]
