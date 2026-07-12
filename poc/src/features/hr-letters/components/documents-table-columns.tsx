import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { CHANNEL_LABELS, type HrDocument } from '../data/hr-letters'
import { DeliveryBadge, DocStatusBadge } from './status-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/**
 * Metadata-driven documents grid columns (HLC-22): searchable employee/type
 * columns, status, generation date, per-channel delivery outcome, current
 * version, and the 7-year retention date (HLC-11).
 */
export const documentsTableColumns: ColumnDef<HrDocument>[] = [
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
    accessorKey: 'employeeName',
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
      const doc = row.original
      return (
        <HighlightedCell value={doc.employeeName} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1600 font-medium'>
              {doc.employeeName}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {doc.employeeHasAppAccess ? doc.employeeId : `${doc.employeeId} · no app access`}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'docType',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Document type'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Document type
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.docType} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.docType}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'status',
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
        <DocStatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: 'generatedOn',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Generated' isDateColumn>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Generated
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row }) => {
      const doc = row.original
      return (
        <div className='flex flex-col gap-1 py-1 text-sm'>
          <span>{dateFmt.format(new Date(doc.generatedOn))}</span>
          {doc.trigger === 'auto' ? (
            <Badge variant='pending' className='w-fit'>
              Generated automatically — {doc.event}
            </Badge>
          ) : (
            <span className='text-neutral-1000 text-xs'>
              {doc.trigger === 'batch' ? 'Batch' : 'Manual'} · {doc.event}
            </span>
          )}
          {doc.reissueOf && (
            <Badge variant='overdue' className='w-fit'>
              Reissue of {doc.reissueOf}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: 'delivery',
    header: () => <span className='text-sm font-medium'>Delivery</span>,
    cell: ({ row }) => {
      const dists = row.original.distributions
      if (dists.length === 0)
        return <span className='text-neutral-1000 text-sm'>Not dispatched</span>
      return (
        <div className='flex flex-wrap gap-1 p-1.5'>
          {dists.map((d) => (
            <span key={d.id} className='flex items-center gap-1'>
              <span className='text-neutral-1000 text-xs'>
                {CHANNEL_LABELS[d.channel]}
              </span>
              <DeliveryBadge outcome={d.outcome} />
            </span>
          ))}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'version',
    header: () => <span className='text-sm font-medium'>Version</span>,
    cell: ({ row }) => {
      const doc = row.original
      return (
        <Badge variant='pending'>
          Version {doc.versions.length} · template v{doc.templateVersion}
        </Badge>
      )
    },
    enableSorting: false,
    size: 90,
  },
  {
    accessorKey: 'retentionUntil',
    header: () => <span className='text-sm font-medium'>Retained until</span>,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {dateFmt.format(new Date(row.original.retentionUntil))}
      </span>
    ),
    enableSorting: false,
  },
]
