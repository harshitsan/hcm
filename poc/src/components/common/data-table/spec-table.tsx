import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowsDownUp, CaretDown, CaretUp } from 'phosphor-react'
import { cn } from '@/utils/helpers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { applyPrimaryFirst, buildColumns, detailColumns } from './build-columns'
import type { FilterValue } from './filters'
import type { TableSpec } from './spec'

interface SpecTableProps<T> {
  spec: TableSpec<T>
  data: T[]
  /** Column id -> active filter value. Owned by the page, shared with the toolbar. */
  filters: Record<string, FilterValue>
  /**
   * Owned by the page (via useColumnVisibility) and shared with the toolbar.
   * SpecTable must NOT keep its own copy, or the Columns menu would update the
   * page's state while the table rendered from a different one.
   */
  visibility: VisibilityState
  onVisibilityChange: (next: VisibilityState) => void
  onRowClick?: (row: T) => void
  emptyMessage?: string
  onSelectionChange?: (selectedRows: T[]) => void
  resetSelectionKey?: number | string
}

export function SpecTable<T>({
  spec,
  data,
  filters,
  visibility,
  onVisibilityChange,
  onRowClick,
  emptyMessage = 'No data available',
  onSelectionChange,
  resetSelectionKey,
}: SpecTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(
    spec.defaultSort
      ? [{ id: spec.defaultSort.id, desc: spec.defaultSort.dir === 'desc' }]
      : []
  )
  const [rowSelection, setRowSelection] = useState({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset selection when resetSelectionKey changes
  useEffect(() => {
    if (resetSelectionKey !== undefined) {
      setRowSelection({})
    }
  }, [resetSelectionKey])

  const columns = useMemo(() => buildColumns(spec), [spec])
  const details = useMemo(() => detailColumns(spec), [spec])
  const ordered = useMemo(() => applyPrimaryFirst(data, spec), [data, spec])

  const columnFilters = useMemo<ColumnFiltersState>(
    () => Object.entries(filters).map(([id, value]) => ({ id, value })),
    [filters]
  )

  const table = useReactTable({
    data: ordered,
    columns,
    state: { sorting, columnFilters, columnVisibility: visibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) =>
      onVisibilityChange(
        typeof updater === 'function' ? updater(visibility) : updater
      ),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowCanExpand: () => details.length > 0,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    autoResetPageIndex: false,
    autoResetExpanded: false,
  })

  const onSelectionChangeRef = useRef(onSelectionChange)
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  useEffect(() => {
    if (!onSelectionChangeRef.current) return
    const selected = table.getSelectedRowModel().rows.map((r) => r.original)
    onSelectionChangeRef.current(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])

  const rows = table.getRowModel().rows
  const leadingCols = (details.length > 0 ? 1 : 0) + (onSelectionChange ? 1 : 0)

  return (
    <div
      ref={containerRef}
      className='relative max-h-[600px] w-full overflow-y-auto rounded-md border'
    >
      <Table className='border-collapse'>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className='bg-neutral-100'>
              {onSelectionChange && (
                <TableHead className='w-10'>
                  <Checkbox
                    checked={
                      table.getIsAllRowsSelected()
                        ? true
                        : table.getIsSomeRowsSelected()
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
                    aria-label='Select all rows'
                  />
                </TableHead>
              )}
              {details.length > 0 && <TableHead className='w-10' />}
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    <Button
                      variant='header'
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {sorted === 'asc' ? (
                        <CaretUp className='size-3.5' />
                      ) : sorted === 'desc' ? (
                        <CaretDown className='size-3.5' />
                      ) : (
                        <ArrowsDownUp className='text-neutral-2100 size-3.5' />
                      )}
                    </Button>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length + leadingCols}
                className='text-neutral-1000 h-24 text-center'
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow
                key={row.id}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(row.original)}
              >
                {onSelectionChange && (
                  <TableCell
                    className='w-10'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(v) => row.toggleSelected(!!v)}
                      aria-label={`Select row ${row.index + 1}`}
                    />
                  </TableCell>
                )}
                {details.length > 0 && (
                  <TableCell className='w-10'>
                    <Button
                      variant='icon2'
                      aria-label={`Expand row ${row.index + 1}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        row.toggleExpanded()
                      }}
                    >
                      {row.getIsExpanded() ? (
                        <CaretUp className='size-3.5 text-neutral-1000' />
                      ) : (
                        <CaretDown className='size-3.5 text-neutral-1000' />
                      )}
                    </Button>
                  </TableCell>
                )}
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              {row.getIsExpanded() && (
                <TableRow key={`${row.id}-detail`} className='bg-neutral-50'>
                  <TableCell
                    colSpan={row.getVisibleCells().length + leadingCols}
                    className='px-6 py-3'
                  >
                    <dl className='grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4'>
                      {details.map((d) => (
                        <div key={d.id}>
                          <dt className='text-paragraph-sm text-neutral-1000'>
                            {d.header}
                          </dt>
                          <dd className='text-neutral-1900 text-sm font-medium'>
                            {d.cell
                              ? d.cell(row.original)
                              : String(d.accessor(row.original) ?? '—')}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
