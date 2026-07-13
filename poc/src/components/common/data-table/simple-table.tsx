import { createContext, useContext, useMemo, useState } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type HeaderContext,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { NO_DATA_AVAILABLE } from '@/config/ui-messages'
import { formatDateWithTimezone } from '@/utils/date'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ColumnSearch } from './column-search'

/**
 * Per-column styling/behaviour hooks readable via `columnDef.meta` — width
 * constraints, truncation, plus the same search-related flags the canonical
 * `DataTable` honours (`isDateColumn`/`dateFormat`/`exactMatch`).
 */
export interface SimpleTableColumnMeta {
  headerClassName?: string
  cellClassName?: string
  isDateColumn?: boolean
  dateFormat?: string
  exactMatch?: boolean
}

/** Shares the row data + filter setter with headers rendered by
 * `sortableColumnHeader`, mirroring `useDataTableContext` in `table.tsx`. */
const SimpleTableContext = createContext<{
  data: unknown[]
  onFilterChange: (columnId: string, value: string) => void
} | null>(null)

const normalize = (s: string): string =>
  s.toLowerCase().replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim()

/** Same display-value extraction rules as the canonical DataTable filter. */
const extractString = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number')
    return String(value)
  if (Array.isArray(value)) return value.map(String).join(', ')
  if (typeof value === 'object') {
    for (const key of ['value', 'name', 'label', 'text'] as const) {
      const v = (value as Record<string, unknown>)[key]
      if (typeof v === 'string') return v
    }
  }
  const s = String(value)
  return s === '[object Object]' ? '' : s
}

/** Raw ISO dates are compared through the same format ColumnSearch shows. */
const toDisplayValue = (raw: string, meta?: SimpleTableColumnMeta): string => {
  if (meta?.isDateColumn && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    try {
      return formatDateWithTimezone(new Date(raw), meta.dateFormat ?? 'dd MMM yyyy')
    } catch {
      return raw
    }
  }
  return raw
}

function cellMatchesFilter<TData>(
  row: Row<TData>,
  columnId: string,
  filterRaw: unknown,
  meta?: SimpleTableColumnMeta
): boolean {
  const filterValue = normalize(String(filterRaw ?? ''))
  if (!filterValue) return false
  let raw: unknown
  try {
    raw = row.getValue(columnId)
  } catch {
    return false
  }
  const cellValue = normalize(toDisplayValue(extractString(raw), meta))
  if (meta?.exactMatch) return cellValue === filterValue
  return cellValue.includes(filterValue)
}

/**
 * Column header with the exact affordances of the canonical `DataTable`
 * headers (Directory tab): clicking the label opens the ColumnSearch
 * autocomplete popover (unique column values, pick to filter), and the
 * ArrowUpDown affordance next to it toggles sorting. Outside a SimpleTable
 * (no context) it degrades to a plain sort button.
 */
export function sortableColumnHeader<TData>(label: string) {
  return function SortableColumnHeader({
    column,
  }: HeaderContext<TData, unknown>) {
    const ctx = useContext(SimpleTableContext)

    if (!ctx) {
      return (
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {label}
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      )
    }

    const meta = column.columnDef.meta as SimpleTableColumnMeta | undefined
    return (
      <div className='flex h-7 w-full items-center'>
        <ColumnSearch
          columnId={column.id}
          columnName={label}
          data={ctx.data}
          accessorKey={
            (column.columnDef as { accessorKey?: string }).accessorKey
          }
          onFilterChange={ctx.onFilterChange}
          filterValue={column.getFilterValue() as string | undefined}
          isDateColumn={meta?.isDateColumn}
          dateFormat={meta?.dateFormat}
        >
          <Button variant='header' className='flex-1'>
            {label}
          </Button>
        </ColumnSearch>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            column.toggleSorting(column.getIsSorted() === 'asc')
          }}
          className='text-neutral-2100 ml-1 flex h-8 shrink-0 items-center justify-center px-1 hover:bg-gray-100'
          aria-label={`Sort ${label}`}
        >
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </button>
      </div>
    )
  }
}

interface SimpleTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  /** Shown centered in the body when there are no rows. */
  emptyMessage?: string
  onRowClick?: (row: TData) => void
  /** Extra classes for the bordered container (e.g. a max height). */
  className?: string
  /** Stable row identity; falls back to the row index. */
  getRowId?: (row: TData, index: number) => string
}

/**
 * SimpleTable — the shared, non-virtualized sibling of
 * `@/components/common/data-table/table` (`DataTable`). It renders the exact
 * same visual and interaction pattern as the canonical Directory grid:
 * gray-50 bordered header, h-10 hover rows, tight cell padding, "No data
 * available" empty state, click-to-search column headers (autocomplete
 * popover via ColumnSearch) and a separate sort toggle. Like DataTable,
 * an active column filter never hides rows — matching rows float to the top
 * and their matching cells are highlighted.
 *
 * @deprecated Use `SpecTable` with a `TableSpec` instead. This component shares
 * DataTable's never-filter quirk (filters only reorder, they do not exclude).
 * Delete once its remaining callers are converted.
 */
export function SimpleTable<TData>({
  columns,
  data,
  emptyMessage = NO_DATA_AVAILABLE,
  onRowClick,
  className,
  getRowId,
}: SimpleTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Rows are never hidden by a column search (Directory behaviour) — the
    // stored filter value drives ordering + highlighting instead.
    defaultColumn: { filterFn: () => true },
    getRowId,
  })

  const onFilterChange = (columnId: string, value: string) => {
    setColumnFilters((prev) =>
      value
        ? prev.some((f) => f.id === columnId)
          ? prev.map((f) => (f.id === columnId ? { ...f, value } : f))
          : [...prev, { id: columnId, value }]
        : prev.filter((f) => f.id !== columnId)
    )
  }

  const metaFor = (columnId: string) =>
    table.getColumn(columnId)?.columnDef.meta as
      | SimpleTableColumnMeta
      | undefined

  const baseRows = table.getRowModel().rows

  // Matching rows first (stable), exactly like the canonical DataTable.
  const rows = useMemo(() => {
    if (columnFilters.length === 0) return baseRows
    const matchCount = (row: Row<TData>) =>
      columnFilters.filter((f) =>
        cellMatchesFilter(row, f.id, f.value, metaFor(f.id))
      ).length
    return [...baseRows].sort((a, b) => matchCount(b) - matchCount(a))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseRows, columnFilters])

  return (
    <SimpleTableContext.Provider
      value={{ data: data as unknown[], onFilterChange }}
    >
      <div
        className={cn(
          'relative w-full overflow-x-auto rounded-md border border-gray-200 bg-white',
          className
        )}
      >
        <Table className='border-collapse'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='bg-gray-50'>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | SimpleTableColumnMeta
                    | undefined
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'sticky top-0 z-10 h-6 bg-gray-50 text-left text-sm font-medium whitespace-nowrap text-gray-900',
                        'border-t border-b border-solid border-t-gray-200 border-b-gray-200',
                        meta?.headerClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    'group h-10 bg-white hover:bg-gray-50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | SimpleTableColumnMeta
                      | undefined
                    const filter = columnFilters.find(
                      (f) => f.id === cell.column.id
                    )
                    const matched = filter
                      ? cellMatchesFilter(row, cell.column.id, filter.value, meta)
                      : false
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          '!h-10 border-b !py-0.5',
                          matched && 'bg-yellow-50',
                          meta?.cellClassName
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow className='bg-white'>
                <TableCell
                  colSpan={columns.length}
                  className='!text-neutral-1000 h-24 text-center'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </SimpleTableContext.Provider>
  )
}
