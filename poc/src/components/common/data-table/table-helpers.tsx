import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'

/**
 * Shared table helpers (promoted from workflows/components/table-helpers.tsx
 * — the scaffold-kit reference). Local module copies are re-export shims.
 */

/** Sortable + searchable column header matching the Users table idiom. */
export function SortableHeader<TData>({
  column,
  label,
}: {
  column: Column<TData>
  label: string
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

/** Leading checkbox column used by tables with a selection toolbar. */
export function selectColumn<TData>(): ColumnDef<TData> {
  return {
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
}

/** Section heading + right-aligned action toolbar above a table. */
export function SectionToolbar({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className='mb-3 flex items-center justify-between'>
      <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
        {title}
      </h2>
      <div className='flex items-center gap-3'>{children}</div>
    </div>
  )
}
