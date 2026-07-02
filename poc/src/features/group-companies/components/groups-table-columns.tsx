import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import {
  activeMemberships,
  type GroupCompany,
  type MemberCompany,
} from '../data/group-companies'
import { GroupStatusBadge, GroupTypeBadge, ScenarioBadges } from './group-badges'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Column factory — needs the company list to resolve names and health. */
export function buildGroupColumns(
  companies: MemberCompany[]
): ColumnDef<GroupCompany>[] {
  const companyName = (id: string | null) =>
    companies.find((c) => c.id === id)?.name ?? '—'

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
      size: 50,
    },
    {
      accessorKey: 'code',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Group code'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Group code
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.code} columnId={column.id}>
          <span className='text-neutral-1600 font-mono text-xs font-medium'>
            {row.original.code}
          </span>
        </HighlightedCell>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Group'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Group
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
              Admin: {row.original.administratorName}
            </span>
          </div>
        </HighlightedCell>
      ),
    },
    {
      accessorKey: 'type',
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
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.type} columnId={column.id}>
          <GroupTypeBadge type={row.original.type} />
        </HighlightedCell>
      ),
    },
    {
      id: 'members',
      header: () => <span className='text-sm font-medium'>Members</span>,
      cell: ({ row }) => {
        const active = activeMemberships(row.original)
        const history = row.original.memberships.length - active.length
        return (
          <span className='text-neutral-1900 text-sm'>
            {active.length} active
            {history > 0 ? (
              <span className='text-neutral-1000'> · {history} ended</span>
            ) : null}
          </span>
        )
      },
    },
    {
      id: 'parent',
      header: () => <span className='text-sm font-medium'>Parent company</span>,
      cell: ({ row }) => (
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.type === 'Holding'
            ? companyName(row.original.parentCompanyId)
            : 'N/A'}
        </LongText>
      ),
    },
    {
      id: 'scenarios',
      header: () => <span className='text-sm font-medium'>Shared scenarios</span>,
      cell: ({ row }) => <ScenarioBadges group={row.original} />,
    },
    {
      id: 'health',
      header: () => <span className='text-sm font-medium'>Status</span>,
      cell: ({ row }) => (
        <GroupStatusBadge group={row.original} companies={companies} />
      ),
    },
    {
      accessorKey: 'createdOn',
      meta: { isDateColumn: true, dateFormat: 'dd MMM yyyy' },
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Created' isDateColumn>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Created
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row }) => (
        <span className='text-sm'>
          {dateFmt.format(new Date(row.original.createdOn))}
        </span>
      ),
    },
  ]
}
