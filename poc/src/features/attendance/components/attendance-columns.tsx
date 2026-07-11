import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type AttendanceRecord } from '../data/attendance'
import { employeeById, employeeName, fmtBreaks, fmtDate, fmtHours } from '../data/shared'
import { DuplicateBadge, OtBadge, SourceBadge, StatusBadge } from './badges'

const EXCEPTION_LABEL: Record<string, string> = {
  'missed-punch': 'Missed punch',
  'late-arrival': 'Late arrival',
  'early-exit': 'Early exit',
  'over-break': 'Over break',
}

/**
 * Consolidated attendance register columns (TNA-19/23/25): punches, capture
 * source, engine-computed hours, overtime category and exception/compliance
 * markers.
 */
export const attendanceColumns: ColumnDef<AttendanceRecord>[] = [
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
    id: 'employee',
    accessorFn: (row) => employeeName(row.employeeId),
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Employee'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Employee
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const record = row.original
      const emp = employeeById(record.employeeId)
      const name = employeeName(record.employeeId)
      return (
        <HighlightedCell value={name} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1600 font-medium'>
              {name}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {emp
                ? `${emp.code} · ${emp.location}${emp.selfService ? '' : ' · non-user'}`
                : record.origin}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Date
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='text-sm'>
        {fmtDate(row.original.date)}
        {row.original.dayType !== 'working' && (
          <span className='text-neutral-1000 block text-xs capitalize'>
            {row.original.dayType}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'punches',
    header: () => <span className='text-xs font-medium'>In / Out</span>,
    cell: ({ row }) => (
      <span className='text-sm'>
        {row.original.punchIn} → {row.original.punchOut ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'source',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Source
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5'>
        <SourceBadge source={row.original.source} />
        {row.original.duplicateOfId && <DuplicateBadge />}
      </div>
    ),
  },
  {
    id: 'breaks',
    header: () => <span className='text-xs font-medium'>Breaks</span>,
    cell: ({ row }) => (
      <span className='text-sm'>
        {fmtBreaks(row.original.breaksCount, row.original.breakMinutes)}
      </span>
    ),
  },
  {
    accessorKey: 'effectiveHours',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Effective
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <span className='text-sm font-medium'>
        {fmtHours(row.original.effectiveHours)}
      </span>
    ),
  },
  {
    id: 'overtime',
    header: () => <span className='text-xs font-medium'>Overtime</span>,
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5 text-sm'>
        {row.original.overtimeHours > 0 && (
          <span>{fmtHours(row.original.overtimeHours)}</span>
        )}
        <OtBadge category={row.original.overtimeCategory} />
      </div>
    ),
  },
  {
    id: 'issues',
    header: () => <span className='text-xs font-medium'>Exception / Compliance</span>,
    cell: ({ row }) => {
      const { exception, complianceFlag, overrides } = row.original
      if (!exception && !complianceFlag && overrides.length === 0)
        return <span className='text-neutral-1000'>—</span>
      return (
        <div className='flex flex-col gap-0.5 text-xs'>
          {exception && (
            <span className='text-orange-1200 font-medium'>
              {EXCEPTION_LABEL[exception]}
            </span>
          )}
          {complianceFlag && (
            <span className='text-destructive font-medium'>{complianceFlag}</span>
          )}
          {overrides.length > 0 && (
            <span className='text-neutral-1000'>
              {overrides.length} override(s)
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Status
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='p-1.5'>
        <StatusBadge status={row.original.status} />
      </div>
    ),
  },
]
