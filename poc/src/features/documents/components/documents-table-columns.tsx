import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type DocumentRecord, type ExpiryStatus } from '../data/documents'
import { ExpiryBadge } from './status-badges'

/** Grid row: a document plus its computed expiry flag (DOC-07/22). */
export type DocumentRow = DocumentRecord & { expiryStatus: ExpiryStatus }

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmtDate = (iso: string | null) =>
  iso ? dateFmt.format(new Date(iso)) : '-'

export const documentsTableColumns: ColumnDef<DocumentRow>[] = [
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
      <SearchableHeader column={column} columnName='Document'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Document
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const doc = row.original
      return (
        <HighlightedCell value={doc.name} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1600 font-medium'>
              {doc.name}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {doc.fileName} · {doc.format} · {doc.sizeKb} KB
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Category'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Category
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.category} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.category}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    id: 'entity',
    accessorFn: (row) => `${row.entityType}: ${row.entityName}`,
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Entity'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Entity
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const doc = row.original
      return (
        <HighlightedCell
          value={`${doc.entityType}: ${doc.entityName}`}
          columnId={column.id}
        >
          <div className='flex min-w-0 flex-col'>
            <LongText className='text-neutral-1900 text-sm'>
              {doc.entityName}
            </LongText>
            <span className='text-paragraph-sm text-neutral-1000'>
              {doc.entityType}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'company',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Company'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Company
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.company} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.company}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'uploadDate',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Uploaded' isDateColumn>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Uploaded
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const doc = row.original
      return (
        <HighlightedCell value={fmtDate(doc.uploadDate)} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <span className='text-sm'>{fmtDate(doc.uploadDate)}</span>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              by {doc.uploadedBy}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'expiryDate',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Expiry' isDateColumn>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Expiry
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const doc = row.original
      return (
        <HighlightedCell value={fmtDate(doc.expiryDate)} columnId={column.id}>
          <div className='flex items-center gap-2'>
            <span className='text-sm'>{fmtDate(doc.expiryDate)}</span>
            <ExpiryBadge status={doc.expiryStatus} />
          </div>
        </HighlightedCell>
      )
    },
  },
]
