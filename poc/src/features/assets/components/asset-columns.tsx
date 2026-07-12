import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/common/long-text'
import { type Asset } from '../data/assets'
import { employeeName, formatDate, formatInr } from '../data/org'
import { AssetStateBadge, OriginBadge, OverdueBadge } from './badges'

function sortHeader<T>(label: string) {
  return function Header({ column }: { column: Column<T, unknown> }) {
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
}

export function daysOverdue(asset: Asset, today: string): number {
  if (!asset.expectedReturnDate) return 0
  if (asset.state !== 'Issued' && asset.state !== 'Loan') return 0
  const diff = Math.floor(
    (new Date(today).getTime() - new Date(asset.expectedReturnDate).getTime()) / 86400000
  )
  return diff > 0 ? diff : 0
}

/**
 * Inventory columns: identity + procurement/warranty provenance (ASM-36),
 * category (ASM-01), lifecycle state (ASM-02) and current holder.
 */
export function assetTableColumns(today: string, showCompany: boolean): ColumnDef<Asset>[] {
  const columns: ColumnDef<Asset>[] = [
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
      accessorKey: 'assetTag',
      header: sortHeader<Asset>('Asset ID'),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1600 font-medium'>{row.original.assetTag}</span>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.serial}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: sortHeader<Asset>('Asset'),
      cell: ({ row }) => (
        <LongText className='text-neutral-1900 text-sm'>{row.original.name}</LongText>
      ),
    },
    {
      accessorKey: 'category',
      header: sortHeader<Asset>('Category'),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{row.original.category}</span>
      ),
    },
    {
      accessorKey: 'vendor',
      header: sortHeader<Asset>('Vendor'),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 text-sm'>{row.original.vendor}</span>
          <span className='text-paragraph-sm text-neutral-1000'>
            PO {formatDate(row.original.poDate)} · Wty {row.original.warrantyMonths}m
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'value',
      header: sortHeader<Asset>('Value'),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{formatInr(row.original.value)}</span>
      ),
    },
    {
      accessorKey: 'state',
      header: sortHeader<Asset>('State'),
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5 p-1.5'>
          <AssetStateBadge state={row.original.state} />
          <OverdueBadge daysOverdue={daysOverdue(row.original, today)} />
        </div>
      ),
    },
    {
      id: 'holder',
      accessorFn: (a) => employeeName(a.holderId),
      header: sortHeader<Asset>('Held by'),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 text-sm'>
            {employeeName(row.original.holderId)}
          </span>
          {row.original.issueDate && (
            <span className='text-paragraph-sm text-neutral-1000'>
              since {formatDate(row.original.issueDate)}
            </span>
          )}
          {row.original.assignmentOrigin && (
            <span className='mt-0.5'>
              <OriginBadge origin={row.original.assignmentOrigin} />
            </span>
          )}
        </div>
      ),
    },
  ]

  if (showCompany) {
    columns.push({
      accessorKey: 'company',
      header: sortHeader<Asset>('Company'),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{row.original.company}</span>
      ),
    })
  }

  return columns
}
