import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { CaretLeft, CaretRight, Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SimpleTable,
  sortableColumnHeader,
} from '@/components/common/data-table/simple-table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/helpers'
import { type LibraryTask, type TaskStatus } from '../../data/projects'
import { type ProjectsStore } from '../../hooks/use-projects'

const PAGE_SIZE = 10

/**
 * TL-01..04 — Task Library: add standard tasks (name + description) for
 * project allocation, toggle between active and closed tasks, and page
 * through the full 31-task library.
 */
export function TaskLibraryTab({ store }: { store: ProjectsStore }) {
  const [status, setStatus] = useState<TaskStatus>('Active')
  const [page, setPage] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const filtered = useMemo(
    () => store.tasks.filter((t) => t.status === status),
    [store.tasks, status]
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  )

  const taskColumns = useMemo<ColumnDef<LibraryTask>[]>(
    () => [
      {
        accessorKey: 'name',
        header: sortableColumnHeader<LibraryTask>('Task name'),
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: sortableColumnHeader<LibraryTask>('Description'),
        cell: ({ row }) => (
          <span className='text-neutral-1000'>{row.original.description}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { headerClassName: 'w-[120px]' },
        cell: ({ row }) => (
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              store.setTaskStatus(
                row.original.id,
                row.original.status === 'Active' ? 'Closed' : 'Active'
              )
            }
          >
            {row.original.status === 'Active' ? 'Close' : 'Reopen'}
          </Button>
        ),
      },
    ],
    [store]
  )

  const submit = () => {
    if (!name.trim() || !description.trim()) return
    store.addTask({ name: name.trim(), description: description.trim() })
    setName('')
    setDescription('')
    setAddOpen(false)
    setStatus('Active')
    setPage(0)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex rounded-md border border-gray-200 bg-white p-0.5'>
          {(['Active', 'Closed'] as const).map((s) => (
            <button
              key={s}
              type='button'
              aria-pressed={status === s}
              onClick={() => {
                setStatus(s)
                setPage(0)
              }}
              className={cn(
                'rounded px-3 py-1 text-xs font-medium transition-colors',
                status === s
                  ? 'bg-blue-150 text-blue-1400'
                  : 'text-neutral-1000 hover:bg-neutral-100'
              )}
            >
              {s} ({store.tasks.filter((t) => t.status === s).length})
            </button>
          ))}
        </div>
        <Button size='sm' onClick={() => setAddOpen(true)}>
          <Plus size={12} weight='bold' />
          New task
        </Button>
      </div>

      <SimpleTable
        columns={taskColumns}
        data={pageRows}
        emptyMessage={`No ${status.toLowerCase()} tasks.`}
        getRowId={(t) => t.id}
      />

      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          {filtered.length} {status.toLowerCase()} task
          {filtered.length === 1 ? '' : 's'} · {store.tasks.length} in the
          library
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <CaretLeft size={12} weight='bold' />
            Prev
          </Button>
          <span className='text-paragraph-sm text-neutral-1000'>
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
            <CaretRight size={12} weight='bold' />
          </Button>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Add task to library</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Task name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Accessibility Audit'
              />
            </div>
            <div className='space-y-1'>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='What this task covers when allocated on a project'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!name.trim() || !description.trim()}
            >
              Add task — available for allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
