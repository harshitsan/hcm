import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { typeAbbrev, type Jurisdiction } from '../data/jurisdictions'
import {
  NewEntryBadge,
  StatusBadge,
  TaxConfigBadge,
  TypeBadge,
} from './jurisdiction-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export interface ReferenceCounts {
  companies: number
  policies: number
  employees: number
  total: number
}

/**
 * Metadata-driven catalog grid columns (JUR-15): searchable name/type
 * headers, identifiable type badges, tax/fee configuration state and the
 * reference count that guards deletion (JUR-01).
 */
export function buildJurisdictionColumns(
  refCounts: Map<string, ReferenceCounts>
): ColumnDef<Jurisdiction>[] {
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
      accessorKey: 'name',
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
        const j = row.original
        return (
          <HighlightedCell value={j.name} columnId={column.id}>
            <div className='flex min-w-0 flex-col'>
              <span className='flex items-center gap-1.5'>
                <LongText className='text-neutral-1600 font-medium'>
                  {j.name}
                </LongText>
                {j.recentlyAdded && <NewEntryBadge />}
              </span>
              <span className='text-paragraph-sm text-neutral-1000 truncate'>
                {j.code}
                {j.region ? ` · ${j.region}` : ''}
              </span>
            </div>
          </HighlightedCell>
        )
      },
    },
    {
      accessorFn: (j) => typeAbbrev[j.type],
      id: 'type',
      meta: { requiresWholeWordMatch: true },
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Type'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Type
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell
          value={typeAbbrev[row.original.type]}
          columnId={column.id}
        >
          <TypeBadge type={row.original.type} />
        </HighlightedCell>
      ),
    },
    {
      id: 'taxFees',
      accessorFn: (j) =>
        j.taxFees.length > 0 ? `Configured (${j.taxFees.length})` : 'Not configured',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Tax & fee applicability'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tax & fees
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row }) => <TaxConfigBadge jurisdiction={row.original} />,
    },
    {
      id: 'references',
      accessorFn: (j) => refCounts.get(j.id)?.total ?? 0,
      header: () => (
        <span className='text-neutral-2100 px-2 text-xs font-medium'>
          Referenced by
        </span>
      ),
      cell: ({ row }) => {
        const refs = refCounts.get(row.original.id)
        if (!refs || refs.total === 0)
          return <span className='text-neutral-1000 text-sm'>—</span>
        return (
          <span className='text-neutral-1900 text-sm'>
            {refs.companies} companies · {refs.policies} policies
            {refs.employees > 0 ? ` · ${refs.employees} employees` : ''}
          </span>
        )
      },
    },
    {
      accessorKey: 'effectiveFrom',
      meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Effective from' isDateColumn>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Effective from
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => {
        const formatted = dateFmt.format(new Date(row.original.effectiveFrom))
        return (
          <HighlightedCell value={formatted} columnId={column.id}>
            <span className='text-sm'>{formatted}</span>
          </HighlightedCell>
        )
      },
    },
    {
      accessorKey: 'status',
      id: 'status',
      size: 50,
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
            value={row.original.status === 'active' ? 'Active' : 'Inactive'}
            columnId={column.id}
          >
            <StatusBadge status={row.original.status} />
          </HighlightedCell>
        </div>
      ),
    },
  ]
}
