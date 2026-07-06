import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/common/data-table/table'
import { type OrientationTemplate } from '../data/orientation'
import { PagerBar, RefreshButton, usePager } from './orientation-widgets'
import { SortHeader } from './columns-shared'

interface TemplateListProps {
  title: string
  description: string
  items: OrientationTemplate[]
  refreshedAt?: string
  onRefresh: () => void
}

/**
 * Read-only template catalogue (email or notification): list with type,
 * description and task, per-row detail viewer, refresh and item counts.
 */
export function TemplateList({
  title,
  description,
  items,
  refreshedAt,
  onRefresh,
}: TemplateListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((t) => t.id === selectedId) ?? null
  const pager = usePager(items, 4)

  const columns: ColumnDef<OrientationTemplate>[] = [
    {
      accessorKey: 'type',
      header: ({ column }) => <SortHeader column={column} label='Type' />,
      cell: ({ row }) => (
        <span className='text-neutral-1600 font-medium'>
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <SortHeader column={column} label='Description' />,
      cell: ({ row }) => (
        <span className='text-sm'>{row.original.description}</span>
      ),
    },
    {
      accessorKey: 'task',
      header: ({ column }) => <SortHeader column={column} label='Task' />,
      cell: ({ row }) => <Badge variant='outline'>{row.original.task}</Badge>,
    },
    {
      id: 'view',
      header: () => <span className='text-paragraph-sm font-medium'>View</span>,
      cell: ({ row }) => (
        <Button
          variant='outline'
          size='sm'
          className='h-6 gap-1 px-1.5'
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(row.original.id)
          }}
        >
          <Eye size={12} />
          Details
        </Button>
      ),
    },
  ]

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            {title} ({items.length})
          </h3>
          <p className='text-neutral-1000 mt-0.5 text-xs'>{description}</p>
        </div>
        <RefreshButton onRefresh={onRefresh} refreshedAt={refreshedAt} />
      </div>

      <DataTable
        columns={columns}
        data={pager.slice}
        variant='no-status'
        onRowClick={(row: OrientationTemplate) => setSelectedId(row.id)}
      />
      <PagerBar pager={pager} label='templates' />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{selected?.type}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Badge variant='outline'>{selected.task}</Badge>
              </div>
              <p className='text-neutral-1000 text-sm'>{selected.description}</p>
              <div className='rounded-[6px] border border-gray-200 bg-neutral-100 p-3'>
                <p className='text-neutral-1600 text-sm font-semibold'>
                  Subject: {selected.subject}
                </p>
                <p className='text-neutral-1000 mt-2 text-sm whitespace-pre-line'>
                  {selected.body}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
