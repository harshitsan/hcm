import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { companyName, groupName, PORTFOLIO } from '../data/directory'
import { type RoleDef } from '../data/roles'
import { SecurityBadge } from './badges'

/** Human-readable scope for a role (level + entity, RSEC-01). */
export function roleScopeLabel(role: RoleDef): string {
  switch (role.scopeLevel) {
    case 'Platform':
      return 'Platform-wide'
    case 'Portfolio':
      return `Portfolio · ${PORTFOLIO.name}`
    case 'Group Company':
      return `Group · ${groupName(role.scopeEntityId)}`
    default:
      return `Company · ${companyName(role.scopeEntityId)}`
  }
}

export const roleColumns: ColumnDef<RoleDef>[] = [
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
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.name} columnId={column.id}>
        <div className='flex min-w-0 flex-col'>
          <LongText className='text-neutral-1600 font-medium'>
            {row.original.name}
          </LongText>
          <span className='text-paragraph-sm text-neutral-1000 truncate'>
            {row.original.description}
          </span>
        </div>
      </HighlightedCell>
    ),
  },
  {
    id: 'scope',
    accessorFn: (row) => roleScopeLabel(row),
    header: ({ column }) => (
      <SearchableHeader column={column} columnName='Scope'>
        <Button
          variant='header'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Scope
          <ArrowUpDown className='text-neutral-2100 size-3.5' />
        </Button>
      </SearchableHeader>
    ),
    cell: ({ row, column }) => (
      <HighlightedCell value={roleScopeLabel(row.original)} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {roleScopeLabel(row.original)}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'isAdmin',
    header: () => <span className='text-sm font-medium'>Admin role</span>,
    cell: ({ row }) =>
      row.original.isAdmin ? (
        <SecurityBadge value='Admin' />
      ) : (
        <span className='text-neutral-1000 text-sm'>—</span>
      ),
    enableSorting: false,
  },
  {
    id: 'permissions',
    header: () => <span className='text-sm font-medium'>Permissions</span>,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.permissions.length} function
        {row.original.permissions.length === 1 ? '' : 's'} ·{' '}
        {row.original.screenIds.length} screen
        {row.original.screenIds.length === 1 ? '' : 's'}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: 'version',
    header: () => <span className='text-sm font-medium'>Version</span>,
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Badge variant='outline'>v{row.original.version}</Badge>
        {row.original.history.length > 0 && (
          <span className='text-neutral-1000 text-xs'>
            {row.original.history.length} prior
          </span>
        )}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'effectiveFrom',
    header: () => <span className='text-sm font-medium'>Effective from</span>,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.effectiveFrom}
      </span>
    ),
  },
  {
    id: 'roleStatus',
    header: () => <span className='text-sm font-medium'>Status</span>,
    cell: ({ row }) => <SecurityBadge value={row.original.status} />,
    enableSorting: false,
  },
]
