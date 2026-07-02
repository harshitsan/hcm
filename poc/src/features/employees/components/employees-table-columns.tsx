import type { ColumnDef, HeaderContext } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { companyName, type Employee } from '../data/employees'
import { StatusBadge } from './shared'

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function sortableHeader(label: string) {
  return function Header({ column }: HeaderContext<Employee, unknown>) {
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

export const employeesTableColumns: ColumnDef<Employee>[] = [
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
    header: sortableHeader('Employee'),
    cell: ({ row, column }) => {
      const emp = row.original
      return (
        <HighlightedCell value={emp.name} columnId={column.id}>
          <div className='flex items-center gap-2'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback className='bg-blue-1200 text-xs font-semibold text-white'>
                {initials(emp.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-col'>
              <LongText className='text-neutral-1600 font-medium'>
                {emp.name}
              </LongText>
              <span className='text-paragraph-sm text-neutral-1000 truncate'>
                {emp.code}
                {emp.hasUserAccount ? '' : ' · no user account'}
              </span>
            </div>
          </div>
        </HighlightedCell>
      )
    },
  },
  {
    id: 'company',
    accessorFn: (e) => companyName(e.companyId),
    header: sortableHeader('Company'),
    cell: ({ row, column }) => {
      const name = companyName(row.original.companyId)
      return (
        <HighlightedCell value={name} columnId={column.id}>
          <LongText className='text-neutral-1900 text-sm'>{name}</LongText>
        </HighlightedCell>
      )
    },
  },
  {
    accessorKey: 'jurisdiction',
    header: sortableHeader('Jurisdiction'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.jurisdiction} columnId={column.id}>
        <span className='text-neutral-1900 text-sm'>
          {row.original.jurisdiction}
        </span>
      </HighlightedCell>
    ),
  },
  {
    id: 'departments',
    accessorFn: (e) => e.departments.join(', '),
    header: sortableHeader('Departments'),
    cell: ({ row }) => (
      <div className='flex flex-wrap gap-1'>
        {row.original.departments.map((d) => (
          <Badge key={d} variant='open'>
            {d}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'position',
    header: sortableHeader('Position'),
    cell: ({ row, column }) => (
      <HighlightedCell value={row.original.position} columnId={column.id}>
        <LongText className='text-neutral-1900 text-sm'>
          {row.original.position}
        </LongText>
      </HighlightedCell>
    ),
  },
  {
    id: 'locations',
    accessorFn: (e) => e.locations.join(', '),
    header: sortableHeader('Locations'),
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {row.original.locations.length > 0
          ? row.original.locations.join(', ')
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'primaryManager',
    header: sortableHeader('Primary manager'),
    cell: ({ row, column }) => (
      <HighlightedCell
        value={row.original.primaryManager}
        columnId={column.id}
      >
        <div className='flex min-w-0 flex-col'>
          <span className='text-neutral-1900 truncate text-sm'>
            {row.original.primaryManager}
          </span>
          {row.original.dottedLineManagers.length > 0 && (
            <span className='text-paragraph-sm text-neutral-1000 truncate'>
              dotted: {row.original.dottedLineManagers.join(', ')}
            </span>
          )}
        </div>
      </HighlightedCell>
    ),
  },
  {
    accessorKey: 'lifecycleStage',
    header: sortableHeader('Stage'),
    meta: { requiresWholeWordMatch: true },
    cell: ({ row, column }) => (
      <HighlightedCell
        value={row.original.lifecycleStage}
        columnId={column.id}
      >
        <StatusBadge status={row.original.lifecycleStage} />
      </HighlightedCell>
    ),
  },
]
