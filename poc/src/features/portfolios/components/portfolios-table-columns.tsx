import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type Portfolio } from '../data/portfolios'
import { PortfolioStatusBadge } from './portfolio-badges'

/** Flattened row for the portfolios list (PORT-10). */
export interface PortfolioRow {
  portfolio: Portfolio
  code: string
  name: string
  description: string
  managerName: string
  managerEmail: string
  companyNames: string[]
  status: Portfolio['status']
  createdDate: string
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const portfoliosTableColumns: ColumnDef<PortfolioRow>[] = [
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
    accessorKey: 'code',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Code
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs font-medium'>{row.original.code}</span>
    ),
    size: 130,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Portfolio'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Portfolio
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.name} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 max-w-[320px] truncate'>
            {row.original.description || '—'}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'managerName',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Manager'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Manager
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.managerName} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 text-sm'>
            {row.original.managerName}
          </span>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.managerEmail}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    id: 'companies',
    header: () => <span className='text-sm font-medium'>Companies</span>,
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <span className='text-neutral-1900 text-sm font-medium'>
          {row.original.companyNames.length}{' '}
          {row.original.companyNames.length === 1 ? 'company' : 'companies'}
        </span>
        <span className='text-paragraph-sm text-neutral-1000 max-w-[280px] truncate'>
          {row.original.companyNames.join(', ')}
        </span>
      </div>
    ),
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
        <PortfolioStatusBadge status={row.original.status} />
      </div>
    ),
    size: 90,
  },
  {
    accessorKey: 'createdDate',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Created
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <span className='text-sm'>
        {dateFmt.format(new Date(row.original.createdDate))}
      </span>
    ),
    size: 120,
  },
]
