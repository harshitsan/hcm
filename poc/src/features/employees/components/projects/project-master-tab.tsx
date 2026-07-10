import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowsClockwise, CaretLeft, CaretRight, X } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SimpleTable,
  sortableColumnHeader,
} from '@/components/common/data-table/simple-table'
import { cn } from '@/utils/helpers'
import {
  PROJECT_CLIENTS,
  type Project,
  type ProjectStatus,
} from '../../data/projects'
import { type ProjectsStore } from '../../hooks/use-projects'
import { FilterSelect } from '../shared'

const PAGE_SIZE = 10

const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: 'client',
    header: sortableColumnHeader<Project>('Client'),
    cell: ({ row }) => row.original.client,
  },
  {
    accessorKey: 'code',
    header: sortableColumnHeader<Project>('Project code'),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.code}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: sortableColumnHeader<Project>('Project name'),
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: 'billable',
    header: sortableColumnHeader<Project>('Billable'),
    cell: ({ row }) => (
      <Badge variant={row.original.billable ? 'qualified' : 'pending'}>
        {row.original.billable ? 'Billable' : 'Non-billable'}
      </Badge>
    ),
  },
  {
    accessorKey: 'primaryApprover',
    header: sortableColumnHeader<Project>('Primary approver'),
    cell: ({ row }) => row.original.primaryApprover,
  },
  {
    accessorKey: 'startDate',
    header: sortableColumnHeader<Project>('Start date'),
    cell: ({ row }) => row.original.startDate,
  },
  {
    accessorKey: 'endDate',
    header: sortableColumnHeader<Project>('End date'),
    cell: ({ row }) => row.original.endDate,
  },
  {
    accessorKey: 'resources',
    header: sortableColumnHeader<Project>('Resources'),
    cell: ({ row }) => row.original.resources,
  },
  {
    accessorKey: 'wrike',
    header: sortableColumnHeader<Project>('Wrike'),
    cell: ({ row }) => (
      <Badge variant={row.original.wrike ? 'open' : 'badge_inactive'}>
        {row.original.wrike ? 'Wrike' : '—'}
      </Badge>
    ),
  },
  {
    accessorKey: 'type',
    header: sortableColumnHeader<Project>('Type'),
    cell: ({ row }) => row.original.type,
  },
  {
    accessorKey: 'status',
    header: sortableColumnHeader<Project>('Current'),
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === 'Active' ? 'badge_active' : 'badge_inactive'
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
]

/**
 * PM-01..06 — Project Master: active/inactive toggle, period (From/To) and
 * client-name filters with reset, full project detail grid (client, code,
 * name, billable, primary approver, dates, resources, Wrike flag, type,
 * current status) plus pagination and refresh across all 145 projects.
 */
export function ProjectMasterTab({ store }: { store: ProjectsStore }) {
  const [status, setStatus] = useState<ProjectStatus>('Active')
  const [client, setClient] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(
    () =>
      store.projects.filter(
        (p) =>
          p.status === status &&
          (client === 'all' || p.client === client) &&
          // period filter: the project's run overlaps the chosen window
          (from === '' || p.endDate >= from) &&
          (to === '' || p.startDate <= to)
      ),
    [store.projects, status, client, from, to]
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  )

  const resetFilters = () => {
    setClient('all')
    setFrom('')
    setTo('')
    setPage(0)
    toast.info('Project filters reset — showing the full project list')
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='space-y-1'>
            <Label>Status</Label>
            <div className='flex rounded-md border border-gray-200 bg-white p-0.5'>
              {(['Active', 'Inactive'] as const).map((s) => (
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
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className='space-y-1'>
            <Label>Period from</Label>
            <Input
              type='date'
              className='w-[150px]'
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <div className='space-y-1'>
            <Label>Period to</Label>
            <Input
              type='date'
              className='w-[150px]'
              min={from || undefined}
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <FilterSelect
            label='Client'
            value={client}
            onChange={(v) => {
              setClient(v)
              setPage(0)
            }}
            options={PROJECT_CLIENTS}
          />
          <Button variant='outline' size='sm' onClick={resetFilters}>
            <X size={12} weight='bold' />
            Reset
          </Button>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            toast.success(
              `Project list refreshed — ${store.projects.length} projects current`
            )
          }
        >
          <ArrowsClockwise size={12} weight='bold' />
          Refresh
        </Button>
      </div>

      <SimpleTable
        columns={projectColumns}
        data={pageRows}
        emptyMessage='No projects match the current filters.'
        getRowId={(p) => p.id}
      />

      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          {filtered.length} {status.toLowerCase()} project
          {filtered.length === 1 ? '' : 's'} · {store.projects.length} total
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
    </div>
  )
}
