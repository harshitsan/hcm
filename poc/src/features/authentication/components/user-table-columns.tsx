import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { companyName } from '../data/companies'
import {
  activeMemberships,
  AUTH_METHOD_LABELS,
  type AuthUser,
} from '../data/auth-users'
import { LinkageBadge, MethodBadge, UserStatusBadge } from './auth-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function sortableHeader(label: string) {
  return function Header({ column }: { column: Column<AuthUser, unknown> }) {
    return (
      <SearchableHeader column={column} columnName={label}>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {label}
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    )
  }
}

export const userTableColumns: ColumnDef<AuthUser>[] = [
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
    header: sortableHeader('User'),
    cell: ({ row, column }) => {
      const user = row.original
      return (
        <HighlightedCell value={user.name} columnId={column.id}>
          <div className='flex items-center gap-2'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback className='bg-blue-1200 text-xs font-semibold text-white'>
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-col'>
              <LongText className='text-neutral-1600 font-medium'>
                {user.name}
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
    id: 'authMethod',
    accessorFn: (user) => AUTH_METHOD_LABELS[user.authMethod],
    header: sortableHeader('Auth method'),
    cell: ({ row, column }) => (
      <HighlightedCell
        value={AUTH_METHOD_LABELS[row.original.authMethod]}
        columnId={column.id}
      >
        <MethodBadge method={row.original.authMethod} />
      </HighlightedCell>
    ),
  },
  {
    id: 'companies',
    accessorFn: (user) =>
      activeMemberships(user)
        .map((m) => companyName(m.companyId))
        .join(', '),
    header: sortableHeader('Companies'),
    cell: ({ row, column }) => {
      const memberships = activeMemberships(row.original)
      const names = memberships.map((m) => companyName(m.companyId)).join(', ')
      return (
        <HighlightedCell value={names} columnId={column.id}>
          <div className='flex items-center gap-1.5'>
            <Badge variant='pending'>{memberships.length}</Badge>
            <LongText className='text-neutral-1900 max-w-[220px] text-sm'>
              {names || '—'}
            </LongText>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    id: 'workforce',
    accessorFn: (user) =>
      user.memberships.some((m) => m.status === 'active' && m.employeeId)
        ? 'Employee linked'
        : 'No workforce record',
    header: sortableHeader('Workforce link'),
    cell: ({ row, column }) => {
      const linked = row.original.memberships.some(
        (m) => m.status === 'active' && m.employeeId !== null
      )
      return (
        <HighlightedCell
          value={linked ? 'Employee linked' : 'No workforce record'}
          columnId={column.id}
        >
          <LinkageBadge linked={linked} />
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'status',
    id: 'status',
    size: 50,
    meta: { requiresWholeWordMatch: true },
    header: sortableHeader('Status'),
    cell: ({ row, column }) => (
      <div className='p-1.5'>
        <HighlightedCell value={row.original.status} columnId={column.id}>
          <UserStatusBadge status={row.original.status} />
        </HighlightedCell>
      </div>
    ),
  },
  {
    accessorKey: 'lastLogin',
    header: sortableHeader('Last login'),
    cell: ({ row, column }) => {
      const lastLogin = row.original.lastLogin
      const formatted = lastLogin
        ? dateFmt.format(new Date(lastLogin))
        : 'Never signed in'
      return (
        <HighlightedCell value={formatted} columnId={column.id}>
          <span
            className={lastLogin ? 'text-sm' : 'text-neutral-1000 text-sm'}
          >
            {formatted}
          </span>
        </HighlightedCell>
      )
    },
  },
]
