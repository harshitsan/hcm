import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/common/long-text'
import { type Department, type DepartmentStatus } from '../data/departments'
import { DepartmentStatusBadge } from './department-badges'

/**
 * Flattened row for the tabular department list (DEPT-24): every key
 * attribute — ID, name, acronym, parent, head, members, sites, status,
 * description — is a distinct, sortable column.
 */
export interface DepartmentRow {
  id: string
  name: string
  acronym: string
  parentName: string
  headName: string
  memberCount: number
  locationNames: string
  status: DepartmentStatus
  description: string
  original: Department
}

const sortableHeader = (label: string) =>
  function SortableHeader({
    column,
  }: {
    column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }
  }) {
    return (
      <Button
        variant='header'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        {label}
        <ArrowUpDown className='text-neutral-2100 size-3.5' />
      </Button>
    )
  }

export const departmentsTableColumns: ColumnDef<DepartmentRow>[] = [
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
    header: sortableHeader('Department ID'),
    size: 130,
    cell: ({ row }) => (
      <span className='text-neutral-1900 font-mono text-xs'>{row.original.id}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: sortableHeader('Name'),
    cell: ({ row }) => (
      <LongText className='text-neutral-1600 text-sm font-medium'>
        {row.original.name}
      </LongText>
    ),
  },
  {
    accessorKey: 'acronym',
    header: sortableHeader('Acronym'),
    size: 100,
    cell: ({ row }) =>
      row.original.acronym ? (
        <Badge variant='secondary'>{row.original.acronym}</Badge>
      ) : (
        <span className='text-neutral-1000 text-sm'>—</span>
      ),
  },
  {
    accessorKey: 'parentName',
    header: sortableHeader('Parent department'),
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.parentName || 'Top-level'}
      </LongText>
    ),
  },
  {
    accessorKey: 'headName',
    header: sortableHeader('Department head'),
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.headName || 'Unassigned'}
      </LongText>
    ),
  },
  {
    accessorKey: 'memberCount',
    header: sortableHeader('Members'),
    size: 90,
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.memberCount}</span>
    ),
  },
  {
    accessorKey: 'locationNames',
    header: sortableHeader('Locations'),
    cell: ({ row }) => (
      <LongText className='text-neutral-1900 text-sm'>
        {row.original.locationNames || '—'}
      </LongText>
    ),
  },
  {
    accessorKey: 'status',
    header: sortableHeader('Status'),
    size: 90,
    cell: ({ row }) => (
      <div className='p-1.5'>
        <DepartmentStatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <LongText className='text-neutral-1000 max-w-[260px] text-sm'>
        {row.original.description || '—'}
      </LongText>
    ),
  },
]
