import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { toTitleCase } from '@/utils/ui-helpers'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type User, type UserStatus } from '../data/users'

const statusBadge: Record<
  UserStatus,
  { label: string; variant: 'badge_active' | 'open' | 'badge_inactive' }
> = {
  active: { label: 'Active', variant: 'badge_active' },
  invited: { label: 'Invited', variant: 'open' },
  suspended: { label: 'Suspended', variant: 'badge_inactive' },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function initials(name: string) {
  return name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '--'
}

export const usersTableColumns: ColumnDef<User>[] = [
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
      <SearchableHeader column={column} columnName='Name'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const user = row.original
      const name = toTitleCase(user.name) || '-'
      return (
        <HighlightedCell value={name} columnId={column.id}>
          <div className='flex items-center gap-2'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback className='bg-blue-1200 text-xs font-semibold text-white'>
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-col'>
              <LongText className='text-neutral-1600 font-medium'>
                {name}
              </LongText>
              <span className='text-paragraph-sm text-neutral-1000 truncate'>
                {user.email}
              </span>
            </div>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Role'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Role
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const role = row.getValue('role') as string
      return (
        <div className='text-sm'>
          <HighlightedCell value={role} columnId={column.id}>
            <LongText className='text-neutral-1900 text-sm'>{role}</LongText>
          </HighlightedCell>
        </div>
      )
    },
  },
  {
    accessorKey: 'community',
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Community'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Community
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const community = row.getValue('community') as string
      return (
        <div className='text-sm'>
          <HighlightedCell value={community} columnId={column.id}>
            <LongText className='text-neutral-1900 text-sm'>
              {community}
            </LongText>
          </HighlightedCell>
        </div>
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
    cell: ({ row, column }) => {
      const badge = statusBadge[row.original.status]
      return (
        <div className='p-1.5'>
          <HighlightedCell value={badge.label} columnId={column.id}>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </HighlightedCell>
        </div>
      )
    },
  },
  {
    accessorKey: 'lastActive',
    meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Last active' isDateColumn>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Last active
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => {
      const lastActive = row.getValue('lastActive') as string | null
      const formatted = lastActive
        ? dateFmt.format(new Date(lastActive))
        : 'Pending invite'
      return (
        <div className='text-sm'>
          <HighlightedCell value={formatted} columnId={column.id}>
            <span className={lastActive ? '' : 'text-neutral-1000'}>
              {formatted}
            </span>
          </HighlightedCell>
        </div>
      )
    },
  },
]
