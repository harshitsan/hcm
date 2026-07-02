import type { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, Pencil, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type OrgGroup } from '../data/groups'
import {
  CategoryBadge,
  ScopeBadge,
  StatusBadge,
  TypeBadge,
} from './group-badges'

interface BuildColumnsOptions {
  parentName: (group: OrgGroup) => string
  memberCount: (groupId: string) => number
  canManage: (group: OrgGroup) => boolean
  onView: (group: OrgGroup) => void
  onEdit: (group: OrgGroup) => void
  onMembers: (group: OrgGroup) => void
}

function sortableHeader(label: string) {
  return function Header({ column }: { column: Column<OrgGroup, unknown> }) {
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

export function buildGroupsColumns({
  parentName,
  memberCount,
  canManage,
  onView,
  onEdit,
  onMembers,
}: BuildColumnsOptions): ColumnDef<OrgGroup>[] {
  return [
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
      size: 40,
    },
    {
      accessorKey: 'name',
      header: sortableHeader('Group'),
      cell: ({ row, column }) => {
        const group = row.original
        return (
          <HighlightedCell value={group.name} columnId={column.id}>
            <div className='flex min-w-0 flex-col'>
              <LongText className='text-neutral-1600 font-medium'>
                {group.name}
              </LongText>
              <span className='text-paragraph-sm text-neutral-1000 truncate'>
                {group.acronym} · {group.description}
              </span>
            </div>
          </HighlightedCell>
        )
      },
    },
    {
      accessorKey: 'scope',
      header: sortableHeader('Scope'),
      meta: { requiresWholeWordMatch: true },
      cell: ({ row }) => <ScopeBadge scope={row.original.scope} />,
      size: 90,
    },
    {
      accessorKey: 'category',
      header: sortableHeader('Category'),
      cell: ({ row }) => <CategoryBadge category={row.original.category} />,
      size: 110,
    },
    {
      accessorKey: 'type',
      header: sortableHeader('Type'),
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
      size: 100,
    },
    {
      accessorKey: 'applicability',
      header: sortableHeader('Applicability'),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.applicability} columnId={column.id}>
          <span className='text-neutral-1900 text-sm'>
            {row.original.applicability}
          </span>
        </HighlightedCell>
      ),
      size: 120,
    },
    {
      id: 'parent',
      accessorFn: (g) => g.parentId ?? '',
      header: () => <span className='text-sm font-medium'>Parent</span>,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {parentName(row.original) || '—'}
        </span>
      ),
      enableSorting: false,
      size: 120,
    },
    {
      id: 'members',
      header: () => <span className='text-sm font-medium'>Members</span>,
      cell: ({ row }) => (
        <span className='text-neutral-1600 text-sm font-medium'>
          {memberCount(row.original.id)}
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: 'owner',
      header: sortableHeader('Owner'),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.owner ?? ''} columnId={column.id}>
          <span className='text-neutral-1900 text-sm'>
            {row.original.owner ?? 'Unassigned'}
          </span>
        </HighlightedCell>
      ),
      size: 110,
    },
    {
      accessorKey: 'status',
      header: sortableHeader('Status'),
      meta: { requiresWholeWordMatch: true },
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 80,
    },
    {
      id: 'version',
      header: () => <span className='text-sm font-medium'>Version</span>,
      cell: ({ row }) => (
        <span className='text-neutral-1000 text-xs'>
          v{row.original.version} · eff {row.original.effectiveFrom}
        </span>
      ),
      size: 110,
    },
    {
      id: 'actions',
      header: () => <span className='text-sm font-medium'>Actions</span>,
      cell: ({ row }) => {
        const group = row.original
        const manageable = canManage(group)
        return (
          <div className='flex items-center gap-1'>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label={`View ${group.name}`}
              onClick={(e) => {
                e.stopPropagation()
                onView(group)
              }}
            >
              <Eye className='size-4' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label={`Edit ${group.name}`}
              disabled={!manageable}
              title={manageable ? 'Edit group' : 'Outside your authorized scope'}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(group)
              }}
            >
              <Pencil className='size-4' />
            </Button>
            <Button
              variant='icon2'
              className='text-neutral-1900 h-7 w-7'
              aria-label={`Manage members of ${group.name}`}
              title='Membership grid'
              onClick={(e) => {
                e.stopPropagation()
                onMembers(group)
              }}
            >
              <Users className='size-4' />
            </Button>
          </div>
        )
      },
      enableSorting: false,
      size: 110,
    },
  ]
}
