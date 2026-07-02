import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { HighlightedCell } from '@/components/common/data-table/highlighted-cell'
import { SearchableHeader } from '@/components/common/data-table/searchable-header'
import { LongText } from '@/components/common/long-text'
import { type FieldDefinition } from '../data/custom-fields'
import { PermissionPills, ScopeBadge, TypeBadge, YesNoBadge } from './field-badges'

interface ColumnDeps {
  /** Whether the active role may modify this definition (platform lock). */
  canManage: (field: FieldDefinition) => boolean
  onToggleDefault: (field: FieldDefinition) => void
}

export function getFieldsTableColumns({
  canManage,
  onToggleDefault,
}: ColumnDeps): ColumnDef<FieldDefinition>[] {
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
      accessorKey: 'name',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Field name'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Field name
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => {
        const field = row.original
        return (
          <HighlightedCell value={field.name} columnId={column.id}>
            <div className='flex min-w-0 items-center gap-2'>
              {!canManage(field) && (
                <Lock
                  className='text-neutral-1000 size-3.5 shrink-0'
                  aria-label='Governed by a higher scope'
                />
              )}
              <div className='flex min-w-0 flex-col'>
                <LongText className='text-neutral-1600 font-medium'>
                  {field.name}
                </LongText>
                <span className='text-paragraph-sm text-neutral-1000 truncate'>
                  {field.description}
                </span>
              </div>
            </div>
          </HighlightedCell>
        )
      },
    },
    {
      accessorKey: 'entity',
      header: ({ column }) => (
        <SearchableHeader column={column} columnName='Entity'>
          <Button
            variant='header'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Entity
            <ArrowUpDown className='text-neutral-2100 size-3.5' />
          </Button>
        </SearchableHeader>
      ),
      cell: ({ row, column }) => (
        <HighlightedCell value={row.original.entity} columnId={column.id}>
          <span className='text-neutral-1900 text-sm'>
            {row.original.entity}
          </span>
        </HighlightedCell>
      ),
    },
    {
      accessorKey: 'scope',
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
        <HighlightedCell value={row.original.scope} columnId={column.id}>
          <div className='flex flex-col gap-0.5'>
            <ScopeBadge scope={row.original.scope} />
            <span className='text-paragraph-sm text-neutral-1000'>
              {row.original.owner}
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
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'required',
      header: () => <span className='text-sm font-medium'>Mandatory</span>,
      cell: ({ row }) => <YesNoBadge value={row.original.required} />,
      size: 90,
    },
    {
      accessorKey: 'isDefault',
      header: () => <span className='text-sm font-medium'>Is Default</span>,
      cell: ({ row }) => {
        const field = row.original
        return (
          <div
            className='flex items-center gap-2'
            onClick={(e) => e.stopPropagation()}
          >
            <Switch
              checked={field.isDefault}
              disabled={!canManage(field)}
              onCheckedChange={() => onToggleDefault(field)}
              aria-label={`Toggle Is Default for ${field.name}`}
            />
            <span className='text-paragraph-sm text-neutral-1000'>
              {field.isDefault ? 'On form' : 'Hidden'}
            </span>
          </div>
        )
      },
      size: 120,
    },
    {
      id: 'permissions',
      header: () => (
        <span className='text-sm font-medium'>View / Edit permissions</span>
      ),
      cell: ({ row }) => <PermissionPills perms={row.original.permissions} />,
    },
    {
      accessorKey: 'version',
      header: () => <span className='text-sm font-medium'>Version</span>,
      cell: ({ row }) => (
        <div className='flex flex-col gap-0.5'>
          <Badge variant='outline'>v{row.original.version}</Badge>
          <span className='text-paragraph-sm text-neutral-1000'>
            eff. {row.original.effectiveDate}
          </span>
        </div>
      ),
      size: 110,
    },
  ]
}
