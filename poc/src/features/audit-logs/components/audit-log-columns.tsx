import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type AuditEntry } from '../data/audit-entries'
import { ActionBadge, TierBadge, auditDateTimeFmt } from './audit-badges'

export const auditLogColumns: ColumnDef<AuditEntry>[] = [
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
    accessorKey: 'timestamp',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Timestamp
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm whitespace-nowrap'>
        {auditDateTimeFmt.format(new Date(row.original.timestamp))}
      </span>
    ),
  },
  {
    accessorKey: 'recordName',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Record'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Record
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const entry = row.original
      return (
        <HighlightedCell value={entry.recordName} columnId={column.id}>
          <div className='flex min-w-0 flex-col'>
            <span className='flex items-center gap-1.5'>
              <LongText className='text-neutral-1600 text-sm font-medium'>
                {entry.recordName}
              </LongText>
              {entry.nonUserRecord && (
                <Badge variant='pending'>Non-user</Badge>
              )}
            </span>
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              {entry.entityType} · {entry.recordId}
            </span>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'actionType',
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Action
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='p-1.5'>
        <ActionBadge action={row.original.actionType} />
      </div>
    ),
  },
  {
    id: 'changes',
    header: () => <span className='text-sm font-medium'>Fields affected</span>,
    cell: ({ row }) => {
      const changes = row.original.changes
      const label =
        changes.length === 1
          ? changes[0].field
          : `${changes[0].field} +${changes.length - 1} more`
      return (
        <div className='flex flex-col'>
          <LongText className='text-neutral-1900 text-sm'>{label}</LongText>
          <span className='text-paragraph-sm text-neutral-1000'>
            {changes.length} {changes.length === 1 ? 'field' : 'fields'} · each
            with prev/new value
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'actor',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Actor'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Actor
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const entry = row.original
      return (
        <HighlightedCell value={entry.actor} columnId={column.id}>
          <span className='flex items-center gap-1.5'>
            {entry.actorType === 'system' && (
              <Bot className='text-blue-1400 size-3.5 shrink-0' />
            )}
            <LongText className='text-neutral-1900 text-sm'>
              {entry.actor}
            </LongText>
          </span>
        </HighlightedCell>
      )
    },
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
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1900 text-sm'>
            {row.original.companyName}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.tenant}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'storageTier',
    size: 60,
    header: ({ column }) => (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Storage
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    ),
    cell: ({ row }) => (
      <div className='p-1.5'>
        <TierBadge tier={row.original.storageTier} />
      </div>
    ),
  },
]
