import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { currentVersion, type NotificationTemplate } from '../data/templates'

/**
 * Kensium-style template list columns (NTF-26): Template Type ID, channel
 * type, description and task, plus version + level context (NTF-15, NTF-20).
 */
export const templatesTableColumns: ColumnDef<NotificationTemplate>[] = [
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
      <SearchableHeader column={column} columnName='Template Type ID'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Template Type ID
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.id} columnId={column.id}>
        <span className='text-neutral-1600 text-sm font-medium'>
          {row.original.id}
        </span>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'event',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Event'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Event
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.event} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 text-sm font-medium'>
            {row.original.event}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000'>
            {row.original.domain}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    id: 'type',
    accessorFn: (row) =>
      row.channel === 'email' ? 'Email' : 'In-app Notification',
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
    cell: ({ row, column }) => {
      const label =
        row.original.channel === 'email' ? 'Email' : 'In-app Notification'
      return (
        <HighlightedCell value={label} columnId={column.id}>
          <Badge variant={row.original.channel === 'email' ? 'open' : 'pending'}>
            {label}
          </Badge>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Description'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.description} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.description}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'task',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Task'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Task
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.task} columnId={column.id}>
        <span className='text-neutral-1900 text-sm'>{row.original.task}</span>
      </HighlightedCell>
    ),
  },
  {
    id: 'version',
    accessorFn: (row) => currentVersion(row).version,
    header: () => <span className='text-sm font-medium'>Version</span>,
    cell: ({ row }) => {
      const v = currentVersion(row.original)
      return (
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 text-sm'>v{v.version}</span>
          <span className='text-paragraph-sm text-neutral-1000'>
            eff. {v.effectiveFrom}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'level',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Level'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Level
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.level} columnId={column.id}>
        <Badge
          variant={row.original.level === 'Company' ? 'completed' : 'open'}
        >
          {row.original.level}
        </Badge>
      </HighlightedCell>
    ),
  },
  {
    id: 'state',
    accessorFn: (row) => (row.customized ? 'Customized' : 'Seeded'),
    header: () => <span className='text-sm font-medium'>State</span>,
    cell: ({ row }) => (
      <div className='p-1.5'>
        <Badge
          variant={row.original.customized ? 'badge_active' : 'badge_inactive'}
        >
          {row.original.customized ? 'Customized' : 'Seeded'}
        </Badge>
      </div>
    ),
    enableSorting: false,
  },
]
