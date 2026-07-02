import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Trash } from 'phosphor-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/common/data-table/table'
import { LongText } from '@/components/common/long-text'
import { type MappingTemplate } from '../data/mappings'

const mappingColumns: ColumnDef<MappingTemplate>[] = [
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
    header: 'Mapping name',
    cell: ({ row }) => (
      <LongText className='text-neutral-1600 max-w-[240px] font-medium'>
        {row.original.name}
      </LongText>
    ),
  },
  {
    accessorKey: 'module',
    header: 'Module / Function',
    cell: ({ row }) => (
      <div className='flex flex-col text-sm'>
        <span className='text-neutral-1900'>{row.original.functionName}</span>
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.module}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'entity',
    header: 'Entity',
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>{row.original.entity}</span>
    ),
  },
  {
    accessorKey: 'format',
    header: 'Format',
    size: 70,
    cell: ({ row }) => <Badge variant='open'>{row.original.format}</Badge>,
  },
  {
    id: 'fields',
    header: 'Mapped columns',
    cell: ({ row }) => (
      <span className='text-neutral-1900 text-sm'>
        {Object.keys(row.original.columnMap).length} columns
      </span>
    ),
  },
  {
    accessorKey: 'createdBy',
    header: 'Created by',
    cell: ({ row }) => (
      <div className='flex flex-col text-sm'>
        <span className='text-neutral-1900'>{row.original.createdBy}</span>
        <span className='text-paragraph-sm text-neutral-1000'>
          {row.original.createdAt}
        </span>
      </div>
    ),
  },
]

interface MappingsTabProps {
  mappings: MappingTemplate[]
  onDelete: (id: string) => void
  canManage: boolean
}

/** Reusable saved mapping templates, applied at the start of an import (DM-31). */
export function MappingsTab({
  mappings,
  onDelete,
  canManage,
}: MappingsTabProps) {
  const [selectedRows, setSelectedRows] = useState<MappingTemplate[]>([])
  const [resetSelectionKey, setResetSelectionKey] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const onConfirmDelete = () => {
    selectedRows.forEach((m) => onDelete(m.id))
    toast.success(
      selectedRows.length === 1
        ? 'Saved mapping removed'
        : `${selectedRows.length} saved mappings removed`
    )
    setConfirmDelete(false)
    setSelectedRows([])
    setResetSelectionKey((k) => k + 1)
  }

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Saved Mappings ({mappings.length})
        </h2>
        {canManage && (
          <Button
            variant='icon2'
            onClick={() => setConfirmDelete(true)}
            className='text-neutral-1900 h-7 w-7'
            disabled={selectedRows.length === 0}
            aria-label='Delete mapping'
          >
            <Trash size={16} weight='bold' />
          </Button>
        )}
      </div>
      <p className='text-paragraph-sm text-neutral-1000 mb-3'>
        Create new mappings from the import wizard (“Save mapping for further
        use”). Applying a saved mapping to a file whose columns differ reports
        the mismatches before commit.
      </p>

      <DataTable
        columns={mappingColumns}
        data={mappings}
        variant='no-status'
        resetSelectionKey={resetSelectionKey}
        onSelectionChange={(rows) => setSelectedRows(rows)}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedRows.length === 1 ? 'mapping' : 'mappings'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Future imports of the same function will need to re-map columns.
              This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
