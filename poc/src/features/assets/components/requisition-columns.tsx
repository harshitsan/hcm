import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { type Requisition } from '../data/requisitions'
import { formatDate } from '../data/org'
import { RequisitionStatusBadge } from './badges'

function sortHeader(label: string) {
  return function Header({ column }: { column: Column<Requisition, unknown> }) {
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

/**
 * Requisition list columns (ASM-27/29/30/31): number, date, requester
 * (with on-behalf attribution), requested asset, issued-vs-requested
 * quantity, return-before date and status.
 */
export function requisitionColumns(showRequester: boolean): ColumnDef<Requisition>[] {
  const columns: ColumnDef<Requisition>[] = [
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
      accessorKey: 'number',
      header: sortHeader('Requisition #'),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='text-neutral-1600 font-medium'>{row.original.number}</span>
          <span className='text-paragraph-sm text-neutral-1000'>
            {formatDate(row.original.requestedOn)}
          </span>
        </div>
      ),
    },
  ]

  if (showRequester) {
    columns.push({
      accessorKey: 'requesterName',
      header: sortHeader('Requester'),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='text-neutral-1900 text-sm'>{row.original.requesterName}</span>
          <span className='text-paragraph-sm text-neutral-1000'>
            {row.original.department}
            {row.original.onBehalfBy ? ` · on behalf by ${row.original.onBehalfBy}` : ''}
          </span>
        </div>
      ),
    })
  }

  columns.push(
    {
      accessorKey: 'assetName',
      header: sortHeader('Requested asset'),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='text-neutral-1900 text-sm'>{row.original.assetName}</span>
          <span className='text-paragraph-sm text-neutral-1000'>{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: sortHeader('Qty (issued/req.)'),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.issuedQuantity} / {row.original.quantity}
        </span>
      ),
    },
    {
      accessorKey: 'returnBefore',
      header: sortHeader('Return before'),
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>{formatDate(row.original.returnBefore)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: sortHeader('Status'),
      cell: ({ row }) => (
        <div className='flex flex-col gap-0.5 p-1.5'>
          <RequisitionStatusBadge status={row.original.status} />
          {row.original.pendingWith && (
            <span className='text-paragraph-sm text-neutral-1000'>
              with {row.original.pendingWith}
            </span>
          )}
          {row.original.rejectionReason && (
            <span className='text-paragraph-sm text-red-1400'>
              {row.original.rejectionReason}
            </span>
          )}
        </div>
      ),
    }
  )

  return columns
}
