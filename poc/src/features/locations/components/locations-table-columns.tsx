import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import type { CompanyLocation } from '../data/locations'
import {
  LocationStatusBadge,
  OwnershipBadge,
  type Ownership,
} from './location-badges'

/** Grid row: a location enriched with lookups + the viewer's ownership. */
export interface LocationRow extends CompanyLocation {
  jurisdictionName: string
  jurisdictionCountry: string
  ownerName: string
  ownership: Ownership
  /** Names of group companies this owned location is shared with. */
  sharedWith: string
}

export const locationsTableColumns: ColumnDef<LocationRow>[] = [
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
      <SearchableHeader column={column} columnName='Location'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Location
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const location = row.original
      return (
        <HighlightedCell value={location.name} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1600 font-medium'>
              {location.name}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {location.acronym} · {location.timezone}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'jurisdictionName',
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
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.jurisdictionName} columnId={column.id}>
        <div className='flex min-w-0 flex-col text-sm'>
          <span className='text-neutral-1900'>{row.original.jurisdictionName}</span>
          <span className='text-paragraph-sm text-neutral-1000'>
            {row.original.jurisdictionCountry}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'city',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='City'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          City
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.city} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {`${row.original.city}, ${row.original.state}`}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'ipAddress',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='IP Address'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          IP Address
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.ipAddress} columnId={column.id}>
        <span className='text-neutral-1900 font-mono text-xs'>
          {row.original.ipAddress || '—'}
        </span>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'ownership',
    id: 'ownership',
    meta: { requiresWholeWordMatch: true },
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Ownership'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Ownership
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row }) => {
      const r = row.original
      return (
        <div className='flex min-w-0 flex-col gap-0.5 p-1.5'>
          <div>
            <OwnershipBadge ownership={r.ownership} />
          </div>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {r.ownership === 'referenced'
              ? `Owner: ${r.ownerName}`
              : r.sharedWith
                ? `Shared with ${r.sharedWith}`
                : ''}
          </span>
        </div>
      )
    },
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
    cell: ({ row }) => (
      <div className='p-1.5'>
        <LocationStatusBadge status={row.original.status} />
      </div>
    ),
  },
]
