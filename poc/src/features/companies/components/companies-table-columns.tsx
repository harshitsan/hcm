import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import {
  primaryJurisdiction,
  statusLabel,
  type Company,
} from '../data/companies'
import { CompanyStatusBadge, OperatingModelBadge } from './company-badges'

/**
 * §5.1 platform company list — Code (clickable to detail), Legal Name,
 * primary Jurisdiction, Operating model, Employees vs limit, Status colors.
 */
export function buildCompaniesColumns(
  onOpen: (company: Company) => void
): ColumnDef<Company>[] {
  return [
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
        <SearchableHeader column={column} columnName='Code'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Code
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.code} columnId={column.id}>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              onOpen(row.original)
            }}
            className='text-blue-1400 cursor-pointer text-sm font-medium underline-offset-2 hover:underline'
          >
            {row.original.code}
          </button>
        </HighlightedCell>
      ),
    },
    {
      accessorKey: 'legalName',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Legal name'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Legal name
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.legalName} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1600 font-medium'>
              {row.original.legalName}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {row.original.tradeName || '—'}
            </span>
          </div>
        </HighlightedCell>
      ),
    },
    {
      id: 'jurisdiction',
      accessorFn: (row) => primaryJurisdiction(row),
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Jurisdiction'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Jurisdiction
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => {
        const primary = primaryJurisdiction(row.original)
        const extra = row.original.jurisdictions.length - 1
        return (
          <HighlightedCell value={primary} columnId={column.id}>
            <span className='text-neutral-1900 text-sm'>
              {primary}
              {extra > 0 && (
                <span className='text-neutral-1000'> +{extra} more</span>
              )}
            </span>
          </HighlightedCell>
        )
      },
    },
    {
      accessorKey: 'operatingModel',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Operating model'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Operating model
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell
          value={row.original.operatingModel}
          columnId={column.id}
        >
          <OperatingModelBadge model={row.original.operatingModel} />
        </HighlightedCell>
      ),
    },
    {
      id: 'employees',
      accessorFn: (row) => row.employeeCount,
      header: () => <span className='text-sm font-medium'>Employees</span>,
      cell: ({ row }) => {
        const { employeeCount, employeeLimit } = row.original
        const nearLimit = employeeCount >= employeeLimit * 0.9
        return (
          <span
            className={`text-sm ${nearLimit ? 'text-red-1400 font-medium' : 'text-neutral-1900'}`}
          >
            {employeeCount.toLocaleString('en-US')} /{' '}
            {employeeLimit.toLocaleString('en-US')}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      id: 'status',
      size: 60,
      meta: { requiresWholeWordMatch: true },
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Status'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Status
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <div className='p-1.5'>
          <HighlightedCell
            value={statusLabel(row.original.status)}
            columnId={column.id}
          >
            <CompanyStatusBadge status={row.original.status} />
          </HighlightedCell>
        </div>
      ),
    },
  ]
}
