import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type ColumnFiltersState,
  type ColumnPinningState,
  type Column,
  type Table as TanstackTable,
} from '@tanstack/react-table'
import { API_ERROR_MESSAGE, NO_DATA_AVAILABLE } from '@/config/ui-messages'
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import { Warning } from 'phosphor-react'
import { formatDateWithTimezone } from '@/utils/date'
import { formatTotalDuration } from '@/utils/duration'
import { cn } from '@/utils/helpers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'

const DataTableContext = createContext<{
  table: TanstackTable<unknown>
  data: unknown[]
  onFilterChange: (columnId: string, value: string) => void
  enableColumnSearch: boolean
} | null>(null)

export const useDataTableContext = () => {
  const context = useContext(DataTableContext)
  if (!context) {
    throw new Error('useDataTableContext must be used within DataTable')
  }
  return context
}

// Utility function to create pinned cell styles
const createPinnedCellStyle = (
  column: Column<unknown, unknown>,
  _index: number,
  _totalColumns: number,
  isFirstRightPinned?: boolean
) => {
  const pinPosition = column.getIsPinned()
  if (!pinPosition) return null

  if (pinPosition === 'left') {
    return {
      left: `${column.getStart('left')}px`,
      position: 'sticky' as const,
      zIndex: 20,
    }
  }

  if (pinPosition === 'right') {
    const style: React.CSSProperties = {
      position: 'sticky' as const,
      zIndex: 20,
      right: isFirstRightPinned ? '41px' : `${column.getAfter('right')}px`,
    }

    return style
  }

  return null
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  variant?: 'default' | 'no-status'
  rowClassName?: string
  headerClassName?: string
  isLoading?: boolean
  /** When true and data is empty, show API error message instead of "No data available" */
  isError?: boolean
  onRowClick?: (row: TData) => void
  enableColumnSearch?: boolean
  onRowsChange?: (rows: TData[]) => void
  onSelectionChange?: (selectedRows: TData[]) => void
  resetSelectionKey?: number | string
}

export function DataTable<TData>({
  columns,
  data,
  variant = 'default',
  rowClassName,
  headerClassName,
  isLoading = false,
  isError = false,
  onRowClick,
  enableColumnSearch = true,
  onRowsChange,
  onSelectionChange,
  resetSelectionKey,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})

  // Reset selection when resetSelectionKey changes
  useEffect(() => {
    if (resetSelectionKey !== undefined) {
      setRowSelection({})
    }
  }, [resetSelectionKey])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: variant === 'no-status' ? [] : ['status', 'actions'],
  })
  const onSelectionChangeRef = useRef(onSelectionChange)

  // Keep ref in sync with latest callback
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    enableColumnPinning: true,
    filterFromLeafRows: true,
    globalFilterFn: 'includesString',
    // Custom filter function for column filtering - always return true to show all rows
    // Filter values are stored but only used for highlighting, not for hiding rows
    defaultColumn: {
      filterFn: () => {
        // Always return true so all rows remain visible
        // The filter value is still stored and used for highlighting in HighlightedCell
        return true
      },
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnPinning,
    },
  })

  // Handle column filter changes
  // Support multiple column searches simultaneously
  const handleColumnFilterChange = (columnId: string, value: string) => {
    if (value) {
      // Add or update the filter for this column, keeping other filters
      setColumnFilters((prev) => {
        const existing = prev.find((f) => f.id === columnId)
        if (existing) {
          // Update existing filter
          return prev.map((f) => (f.id === columnId ? { ...f, value } : f))
        }
        // Add new filter
        return [...prev, { id: columnId, value }]
      })
    } else {
      // Remove only the filter for this column, keep others
      setColumnFilters((prev) => prev.filter((f) => f.id !== columnId))
    }
  }

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChangeRef.current) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original)
      onSelectionChangeRef.current(selectedRows)
    }
    // Only depend on rowSelection to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])

  // Get all filtered and sorted rows (no pagination)
  const baseRows = table.getRowModel().rows
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Sort rows so matched rows appear first
  const rows = useMemo(() => {
    if (!enableColumnSearch || columnFilters.length === 0) {
      return baseRows
    }

    // Helper function to normalize strings for comparison (remove extra spaces, normalize commas)
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/,\s*/g, ', ')
        .trim()
    }

    // Helper to extract string value from unknown type (handles objects, arrays, etc.)
    const extractStringValue = (value: unknown): string => {
      if (value === null || value === undefined) return ''

      // If it's already a string or number, convert to string
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
      }

      // If it's an object, try to extract meaningful value
      if (typeof value === 'object') {
        // Check for common properties that might contain the display value
        if ('value' in value && typeof value.value === 'string') {
          return value.value
        }
        if ('name' in value && typeof value.name === 'string') {
          return value.name
        }
        if ('label' in value && typeof value.label === 'string') {
          return value.label
        }
        if ('text' in value && typeof value.text === 'string') {
          return value.text
        }
        // If it's an array, join it
        if (Array.isArray(value)) {
          return value.map(String).join(', ')
        }
      }

      // Fallback to String conversion
      const stringValue = String(value)
      // Don't use [object Object]
      if (stringValue === '[object Object]') {
        return ''
      }

      return stringValue
    }

    // Helper function to check if a row matches a filter
    const rowMatchesFilter = (
      row: (typeof baseRows)[0],
      filter: { id: string; value: unknown }
    ) => {
      const column = table.getColumn(filter.id)
      if (!column) return false
      const value = row.getValue(filter.id)
      const filterValue = normalizeString(String(filter.value || ''))
      if (!filterValue) return false

      // Extract the actual string value from the cell value (handles objects)
      const cellValueRaw = extractStringValue(value)

      // Check if it's a date or duration column and get the format from column meta
      const columnDef = column.columnDef
      const meta = (
        columnDef as {
          meta?: {
            isDateColumn?: boolean
            dateFormat?: string
            isDurationColumn?: boolean
          }
        }
      ).meta
      const hasDateMeta = meta?.isDateColumn === true
      const hasDurationMeta = meta?.isDurationColumn === true
      // const dateFormat = meta?.dateFormat

      // Try to detect if the value looks like a date
      let looksLikeDate = false
      if (cellValueRaw) {
        // Check if it matches common date patterns
        const datePatterns = [
          /^\d{4}-\d{2}-\d{2}/, // ISO date (YYYY-MM-DD)
          /^\d{4}-\d{2}-\d{2}T/, // ISO datetime
          /^\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY
          /^\d{1,2}-\d{1,2}-\d{4}/, // MM-DD-YYYY
        ]
        looksLikeDate = datePatterns.some((pattern) =>
          pattern.test(cellValueRaw)
        )

        // Also try to parse it as a date
        if (!looksLikeDate) {
          try {
            const date = new Date(cellValueRaw)
            // Check if it's a valid date and not NaN
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
              looksLikeDate = true
            }
          } catch {
            // Not a date
          }
        }
      }

      const isDateColumn = hasDateMeta || looksLikeDate
      const isDurationColumn = hasDurationMeta

      let cellValue: string
      if (isDateColumn) {
        // Handle null/empty dates - they display as "-" in cells
        if (!cellValueRaw || cellValueRaw === '') {
          cellValue = normalizeString('-')
        } else {
          try {
            const dateStr = cellValueRaw
            // Check if it's already a formatted date string (contains month abbreviations)
            const monthAbbrevs = [
              'jan',
              'feb',
              'mar',
              'apr',
              'may',
              'jun',
              'jul',
              'aug',
              'sep',
              'oct',
              'nov',
              'dec',
            ]
            const hasMonthAbbrev = monthAbbrevs.some((month) =>
              dateStr.toLowerCase().includes(month)
            )

            if (hasMonthAbbrev) {
              // Already formatted - just normalize
              cellValue = normalizeString(dateStr)
            } else {
              cellValue = normalizeString(
                formatDateWithTimezone(new Date(cellValueRaw))
              )
            }
          } catch {
            // If date parsing fails, treat as regular string
            cellValue = normalizeString(cellValueRaw)
          }
        }
      } else if (isDurationColumn) {
        // Handle duration columns
        try {
          // Check if it's already formatted (contains 'm', 's', or 'h')
          const isFormatted = /[hms]/.test(cellValueRaw.toLowerCase())

          if (isFormatted) {
            // Already formatted - just normalize
            cellValue = normalizeString(cellValueRaw)
          } else {
            // Raw number (seconds) - format it
            const seconds = Number(cellValueRaw)
            if (!isNaN(seconds)) {
              cellValue = normalizeString(formatTotalDuration(seconds))
            } else {
              cellValue = normalizeString(cellValueRaw)
            }
          }
        } catch {
          // If formatting fails, treat as regular string
          cellValue = normalizeString(cellValueRaw)
        }
      } else {
        cellValue = normalizeString(cellValueRaw)
      }

      const filterMeta = (
        columnDef as {
          meta?: { requiresWholeWordMatch?: boolean; exactMatch?: boolean }
        }
      ).meta
      if (filterMeta?.exactMatch) {
        return cellValue === normalizeString(filterValue)
      }
      if (filterMeta?.requiresWholeWordMatch) {
        const regex = new RegExp(
          `\\b${filterValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i'
        )
        return regex.test(cellValue)
      }

      return cellValue.includes(filterValue)
    }

    // Sort rows: rows matching more filters come first
    return [...baseRows].sort((a, b) => {
      // Count how many filters each row matches
      let aMatchCount = 0
      let bMatchCount = 0

      for (const filter of columnFilters) {
        if (rowMatchesFilter(a, filter)) {
          aMatchCount++
        }
        if (rowMatchesFilter(b, filter)) {
          bMatchCount++
        }
      }

      // Rows with more matches come first
      if (aMatchCount > bMatchCount) return -1
      if (aMatchCount < bMatchCount) return 1

      // If match count is the same, maintain original order
      return 0
    })
  }, [baseRows, columnFilters, enableColumnSearch, table])

  // Notify parent of current rows (filtered and sorted)
  // Extract row data
  const currentRowsData = useMemo(() => {
    return rows.map((row) => row.original)
  }, [rows])

  // Track previous rows key to prevent unnecessary updates
  const prevRowsKeyRef = useRef<string>('')
  const onRowsChangeRef = useRef(onRowsChange)

  // Update ref when callback changes
  useEffect(() => {
    onRowsChangeRef.current = onRowsChange
    onSelectionChangeRef.current = onSelectionChange
  }, [onRowsChange, onSelectionChange])

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  // Notify parent only when rows actually change
  useEffect(() => {
    if (!onRowsChangeRef.current) return

    // Create a key based on row count and first/last row IDs to detect changes
    const rowIds = currentRowsData
      .slice(0, 10) // Check first 10 rows to better detect order changes
      .map((row, idx) => {
        const rowAny = row as {
          id?: string
          leadId?: string
          recordingId?: string
          callLogId?: string
        }
        const id =
          rowAny.id ||
          rowAny.leadId ||
          rowAny.recordingId ||
          rowAny.callLogId ||
          String(idx)
        return id
      })
      .join(',')
    const rowsKey = `${currentRowsData.length}:${rowIds}`

    // Only call callback if rows actually changed
    if (prevRowsKeyRef.current !== rowsKey) {
      prevRowsKeyRef.current = rowsKey
      onRowsChangeRef.current(currentRowsData)
    }
  }, [currentRowsData])

  // Notify parent of selection changes
  useEffect(() => {
    if (!onSelectionChangeRef.current) return
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original as TData)
    onSelectionChangeRef.current(selectedRows)
  }, [rowSelection, table])

  // Virtualizer for row virtualization - virtualizes ALL rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40, // Row height estimate (h-10 = 40px)
    overscan: 5, // Render 5 extra rows outside visible area
    scrollPaddingStart: 0,
    scrollPaddingEnd: 0,
  })

  // Update virtualizer when rows change
  useEffect(() => {
    if (rows.length > 0) {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        rowVirtualizer.measure()
      })
    }
  }, [rows.length, rowVirtualizer])

  // Notify parent when selection changes
  useEffect(() => {
    if (!onSelectionChangeRef.current) return
    const selected = table.getSelectedRowModel().rows.map((r) => r.original)
    onSelectionChangeRef.current(selected as TData[])
  }, [rowSelection, table])

  // Scroll to top when column filters are applied or changed
  const prevFiltersRef = useRef<string>('')
  useEffect(() => {
    // Create a key from filter IDs and values to detect actual changes
    const filtersKey = JSON.stringify(
      columnFilters.map((f) => `${f.id}:${f.value}`).sort()
    )

    // Only scroll if filters actually changed (not just on mount)
    if (prevFiltersRef.current && prevFiltersRef.current !== filtersKey) {
      // Scroll to top when filters are applied or changed
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(0, {
          align: 'start',
        })
      })
    }

    prevFiltersRef.current = filtersKey
  }, [columnFilters, rowVirtualizer])

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0
  const paddingBottom =
    virtualRows.length > 0
      ? Math.max(0, totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0))
      : 0

  return (
    <DataTableContext.Provider
      value={{
        table: table as TanstackTable<unknown>,
        data: data as unknown[],
        onFilterChange: handleColumnFilterChange,
        enableColumnSearch,
      }}
    >
      <div className='w-full'>
        <div
          ref={tableContainerRef}
          className={cn(
            'relative h-[392px] overflow-y-auto rounded-md border',
            headerClassName
          )}
          style={{
            scrollBehavior: 'auto',
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Table className='border-collapse'>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='bg-gray-50'>
                  {headerGroup.headers.map((header, index) => {
                    const pinPosition = header.column.getIsPinned()
                    // Check if this is the boundary pinned column that needs shadow
                    const columnPinning = table.getState().columnPinning
                    const isLastLeftPinned =
                      pinPosition === 'left' &&
                      columnPinning.left &&
                      columnPinning.left.length > 0 &&
                      header.column.id ===
                        columnPinning.left[columnPinning.left.length - 1]
                    const isFirstRightPinned =
                      pinPosition === 'right' &&
                      columnPinning.right &&
                      columnPinning.right.length > 0 &&
                      header.column.id === columnPinning.right[0]

                    const pinnedStyle = createPinnedCellStyle(
                      header.column as Column<unknown, unknown>,
                      index,
                      headerGroup.headers.length,
                      isFirstRightPinned
                    )

                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          'sticky top-0 z-20 h-6 bg-gray-50 text-left text-sm font-medium whitespace-nowrap text-gray-900',
                          'border-t border-b border-solid border-t-gray-200 border-b-gray-200',
                          pinPosition &&
                            `z-20 border-gray-200 border-r-gray-200 first:border-l first:border-l-gray-200 ${variant === 'default' ? '!bg-neutral-2000' : ''}`,
                          isFirstRightPinned &&
                            variant === 'default' &&
                            'bg-neutral-2000 z-20 border-l shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.12)]',
                          isFirstRightPinned &&
                            variant === 'no-status' &&
                            'z-20 border-l shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.12)]',
                          isLastLeftPinned &&
                            'bg-neutral-2000 z-20 border-l shadow-[4px_0_8px_-2px_rgba(0,0,0,0.15)]',
                          !pinPosition && 'top-0 z-10',
                          pinPosition && 'top-0 z-20'
                        )}
                        style={
                          virtualRows.length > 0 && pinnedStyle
                            ? { ...pinnedStyle, top: 0 }
                            : { top: 0 }
                        }
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
            {isLoading ? (
              <TableSkeleton<TData> columns={columns} />
            ) : (
              <TableBody>
                <>
                  {paddingTop > 0 && (
                    <tr>
                      <td
                        style={{ height: `${paddingTop}px` }}
                        colSpan={columns.length}
                      />
                    </tr>
                  )}
                  {virtualRows.length > 0 ? (
                    virtualRows.map((virtualRow: VirtualItem) => {
                      const row = rows[virtualRow.index]
                      if (!row) return null

                      return (
                        <TableRow
                          key={row.id}
                          data-index={virtualRow.index}
                          data-state={row.getIsSelected() && 'selected'}
                          className={cn(
                            'group h-10 bg-white hover:bg-gray-50',
                            onRowClick && 'cursor-pointer'
                          )}
                          onClick={() => {
                            if (onRowClick) {
                              onRowClick(row.original)
                            }
                          }}
                          ref={(node) => {
                            if (node) {
                              rowVirtualizer.measureElement(node)
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell, index) => {
                            const pinPosition = cell.column.getIsPinned()

                            // Check if this is the boundary pinned column that needs shadow
                            const columnPinning = table.getState().columnPinning
                            const isLastLeftPinned =
                              pinPosition === 'left' &&
                              columnPinning.left &&
                              columnPinning.left.length > 0 &&
                              cell.column.id ===
                                columnPinning.left[
                                  columnPinning.left.length - 1
                                ]

                            const isFirstRightPinned =
                              pinPosition === 'right' &&
                              columnPinning.right &&
                              columnPinning.right.length > 0 &&
                              cell.column.id === columnPinning.right[0]

                            const pinnedStyle = createPinnedCellStyle(
                              cell.column as Column<unknown, unknown>,
                              index,
                              row.getVisibleCells().length,
                              isFirstRightPinned
                            )

                            return (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  '!h-10 border-b !py-0.5',
                                  rowClassName,
                                  pinPosition &&
                                    'sticky z-20 border-l border-gray-200 border-r-gray-200 border-l-gray-200 bg-white group-hover:bg-gray-50',
                                  isFirstRightPinned &&
                                    'border-r shadow-lg drop-shadow-lg',
                                  isLastLeftPinned &&
                                    'border-l shadow-[4px_0_8px_-2px_rgba(0,0,0,0.15)]'
                                )}
                                style={pinnedStyle ? pinnedStyle : undefined}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      {(() => {
                        // Calculate colspan excluding select column
                        const headerGroups = table.getHeaderGroups()
                        let selectColspan = 0
                        let dataColspan = 0

                        if (headerGroups.length > 0) {
                          const firstHeaderGroup = headerGroups[0]
                          for (const header of firstHeaderGroup.headers) {
                            // Check if this is select column
                            if (
                              header.column.id === 'select' ||
                              header.column.id === 'select-checkbox' ||
                              header.column.id.startsWith('select')
                            ) {
                              selectColspan += header.colSpan
                            } else {
                              dataColspan += header.colSpan
                            }
                          }
                        }

                        return (
                          <>
                            {selectColspan > 0 && (
                              <TableCell
                                colSpan={selectColspan}
                                className='h-24'
                              />
                            )}
                            <TableCell
                              colSpan={dataColspan || columns.length}
                              className='relative h-24 text-center text-red-500'
                            >
                              {isError ? (
                                <div className='absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center gap-1'>
                                  <Warning className='size-4 text-red-500' />
                                  <p className='text-bold text-center text-sm text-red-500'>
                                    {API_ERROR_MESSAGE}
                                  </p>
                                </div>
                              ) : (
                                NO_DATA_AVAILABLE
                              )}
                            </TableCell>
                          </>
                        )
                      })()}
                    </TableRow>
                  )}
                  {paddingBottom > 0 && (
                    <tr>
                      <td
                        style={{ height: `${paddingBottom}px` }}
                        colSpan={columns.length}
                        className='border-0 p-0'
                      />
                    </tr>
                  )}
                </>
              </TableBody>
            )}
          </Table>
        </div>
      </div>
    </DataTableContext.Provider>
  )
}
