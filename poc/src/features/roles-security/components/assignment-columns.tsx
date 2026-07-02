import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import {
  assignmentStatusOn,
  type RoleAssignment,
} from '../data/assignments'
import { companyName, personName } from '../data/directory'
import { type RoleDef } from '../data/roles'
import { SecurityBadge } from './badges'

/**
 * Assignment columns — status is computed against the caller's as-of date
 * so past and scheduled assignments can be reconstructed (RSEC-15).
 */
export function assignmentColumns(
  roles: RoleDef[],
  asOf: string
): ColumnDef<RoleAssignment>[] {
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id

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
      id: 'person',
      accessorFn: (row) => personName(row.personId),
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='User'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            User
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell
          value={personName(row.original.personId)}
          columnId={column.id}
        >
          <LongText className='text-neutral-1600 font-medium'>
            {personName(row.original.personId)}
          </LongText>
        </HighlightedCell>
      ),
    },
    {
      id: 'role',
      accessorFn: (row) => roleName(row.roleId),
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
        <HighlightedCell
          value={roleName(row.original.roleId)}
          columnId={column.id}
        >
          <LongText className='text-neutral-1900 text-sm'>
            {roleName(row.original.roleId)}
          </LongText>
        </HighlightedCell>
      ),
    },
    {
      id: 'company',
      accessorFn: (row) => companyName(row.companyId),
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
        <HighlightedCell
          value={companyName(row.original.companyId)}
          columnId={column.id}
        >
          <LongText className='text-neutral-1900 text-sm'>
            {companyName(row.original.companyId)}
          </LongText>
        </HighlightedCell>
      ),
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
      accessorKey: 'effectiveTo',
      header: () => <span className='text-sm font-medium'>Effective to</span>,
      cell: ({ row }) => (
        <span
          className={
            row.original.effectiveTo
              ? 'text-neutral-1900 text-sm'
              : 'text-neutral-1000 text-sm'
          }
        >
          {row.original.effectiveTo ?? 'Open-ended'}
        </span>
      ),
    },
    {
      id: 'asOfStatus',
      header: () => (
        <span className='text-sm font-medium'>Status as of {asOf}</span>
      ),
      cell: ({ row }) => (
        <SecurityBadge value={assignmentStatusOn(row.original, asOf)} />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'assignedBy',
      header: () => <span className='text-sm font-medium'>Assigned by</span>,
      cell: ({ row }) => (
        <span className='text-neutral-1900 text-sm'>
          {row.original.assignedBy}
        </span>
      ),
    },
  ]
}
