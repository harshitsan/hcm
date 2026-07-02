import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type Tier } from '../data/catalog'
import { type DataJob } from '../data/jobs'
import { JobStatusBadge, TierBadge } from './badges'

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const jobsTableColumns: ColumnDef<DataJob>[] = [
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
    accessorKey: 'id',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Job'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Job
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const job = row.original
      return (
        <HighlightedCell value={job.id} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <span className='text-neutral-1600 font-medium'>{job.id}</span>
            <LongText className='text-paragraph-sm text-neutral-1000 max-w-[180px]'>
              {job.fileName}
            </LongText>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'kind',
    header: 'Type',
    size: 70,
    cell: ({ row }) => (
      <Badge
        variant={row.original.kind === 'import' ? 'open' : 'qualified'}
        className='capitalize'
      >
        {row.original.kind}
      </Badge>
    ),
  },
  {
    accessorKey: 'functionName',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Function'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Module / Function
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const job = row.original
      return (
        <HighlightedCell value={job.functionName} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <span className='text-neutral-1900 text-sm'>
              {job.functionName}
            </span>
            <span className='text-paragraph-sm text-neutral-1000'>
              {job.module}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'entity',
    header: 'Entity',
    cell: ({ row }) => (
      <div className='flex flex-col gap-1'>
        <span className='text-neutral-1900 text-sm'>{row.original.entity}</span>
        <TierBadge tier={row.original.tier as Tier} />
      </div>
    ),
  },
  {
    accessorKey: 'companyName',
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
      <HighlightedCell value={row.original.companyName} columnId={column.id}>
        <LongText className='text-neutral-1900 max-w-[160px] text-sm'>
          {row.original.companyName}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'format',
    header: 'Format',
    size: 70,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.format}</span>
    ),
  },
  {
    id: 'records',
    header: 'All / Success / Failed / Skipped',
    cell: ({ row }) => {
      const j = row.original
      return (
        <span className='text-sm whitespace-nowrap'>
          <span className='text-neutral-1900'>{j.totalRecords}</span>
          <span className='text-neutral-1000'> / </span>
          <span className='text-green-1300'>{j.successRecords}</span>
          <span className='text-neutral-1000'> / </span>
          <span className='text-red-1400'>{j.failedRecords}</span>
          <span className='text-neutral-1000'> / </span>
          <span className='text-neutral-1900'>{j.skippedRecords}</span>
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div className='p-1.5'>
        <JobStatusBadge
          status={row.original.status}
          rolledBack={row.original.rolledBack}
        />
        {row.original.staging && (
          <span className='text-paragraph-sm text-neutral-1000 mt-0.5 block'>
            Staging only
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'submittedAt',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Submitted
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='flex flex-col text-sm'>
        <span className='text-neutral-1900'>
          {dateTimeFmt.format(new Date(row.original.submittedAt))}
        </span>
        <span className='text-paragraph-sm text-neutral-1000'>
          by {row.original.submittedBy}
        </span>
      </div>
    ),
  },
]
