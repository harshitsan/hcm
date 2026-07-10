import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowCounterClockwise, Plus, Trash } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SimpleTable,
  sortableColumnHeader,
} from '@/components/common/data-table/simple-table'
import { cn } from '@/utils/helpers'
import {
  ALLOCATED_PROJECT_NAMES,
  ASSIGNABLE_RESOURCES,
  DEFAULT_WEEKDAYS,
  WEEKDAYS,
  type ResourceAssignment,
  type Weekday,
} from '../../data/projects'
import { type ProjectsStore } from '../../hooks/use-projects'
import { SectionTitle } from '../shared'

/** Committed (saved) assignments — canonical read-only table pattern. */
const committedColumns: ColumnDef<ResourceAssignment>[] = [
  {
    accessorKey: 'project',
    header: sortableColumnHeader<ResourceAssignment>('Project'),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.project}</span>
    ),
  },
  {
    accessorKey: 'resource',
    header: sortableColumnHeader<ResourceAssignment>('Resource'),
    cell: ({ row }) => row.original.resource,
  },
  {
    id: 'period',
    accessorFn: (a) => a.startDate,
    header: sortableColumnHeader<ResourceAssignment>('Period'),
    cell: ({ row }) => (
      <>
        {row.original.startDate} → {row.original.endDate}
      </>
    ),
  },
  {
    accessorKey: 'hoursPerDay',
    header: sortableColumnHeader<ResourceAssignment>('Hrs/day'),
    cell: ({ row }) => row.original.hoursPerDay,
  },
  {
    accessorKey: 'percentPerDay',
    header: sortableColumnHeader<ResourceAssignment>('%/day'),
    cell: ({ row }) => <>{row.original.percentPerDay}%</>,
  },
  {
    id: 'days',
    accessorFn: (a) => a.weekdays.join(' '),
    header: sortableColumnHeader<ResourceAssignment>('Days'),
    cell: ({ row }) => row.original.weekdays.join(' '),
  },
  {
    accessorKey: 'savedOn',
    header: sortableColumnHeader<ResourceAssignment>('Saved on'),
    cell: ({ row }) => row.original.savedOn,
  },
]

interface GridRow {
  key: number
  project: string
  resource: string
  startDate: string
  endDate: string
  hoursPerDay: string
  percentPerDay: string
  weekdays: Weekday[]
}

let rowKey = 0
const blankRow = (): GridRow => ({
  key: ++rowKey,
  project: '',
  resource: '',
  startDate: '',
  endDate: '',
  hoursPerDay: '',
  percentPerDay: '',
  weekdays: [...DEFAULT_WEEKDAYS],
})

const initialGrid = () => [blankRow(), blankRow(), blankRow()]

const rowComplete = (r: GridRow) =>
  r.project !== '' &&
  r.resource !== '' &&
  r.startDate !== '' &&
  r.endDate !== '' &&
  r.startDate <= r.endDate &&
  Number(r.hoursPerDay) > 0 &&
  Number(r.percentPerDay) > 0 &&
  r.weekdays.length > 0

const rowTouched = (r: GridRow) =>
  r.project !== '' ||
  r.resource !== '' ||
  r.startDate !== '' ||
  r.endDate !== '' ||
  r.hoursPerDay !== '' ||
  r.percentPerDay !== ''

/**
 * BRA-01..06 — bulk resource assignment grid: project/resource rows with
 * per-row start/end calendar pickers, allocated hours & percentage per day,
 * Su–Sa weekday allocation, single bulk save and full grid reset.
 */
export function BulkAssignmentsTab({ store }: { store: ProjectsStore }) {
  const [grid, setGrid] = useState<GridRow[]>(initialGrid)

  const projectOptions = [
    ...new Set([
      ...ALLOCATED_PROJECT_NAMES,
      ...store.projects.slice(0, 12).map((p) => p.name),
    ]),
  ]

  const patchRow = (key: number, patch: Partial<GridRow>) =>
    setGrid((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    )

  const toggleWeekday = (row: GridRow, day: Weekday) =>
    patchRow(row.key, {
      weekdays: row.weekdays.includes(day)
        ? row.weekdays.filter((d) => d !== day)
        : [...row.weekdays, day],
    })

  const touched = grid.filter(rowTouched)
  const complete = touched.length > 0 && touched.every(rowComplete)

  /** Editable bulk-entry grid — data-entry cells, so headers stay static. */
  const gridColumns: ColumnDef<GridRow>[] = [
    {
      id: 'project',
      header: 'Project',
      meta: { headerClassName: 'min-w-[190px]' },
      cell: ({ row }) => (
        <Select
          value={row.original.project}
          onValueChange={(v) => patchRow(row.original.key, { project: v })}
        >
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue placeholder='Select project' />
          </SelectTrigger>
          <SelectContent>
            {projectOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: 'resource',
      header: 'Resource',
      meta: { headerClassName: 'min-w-[160px]' },
      cell: ({ row }) => (
        <Select
          value={row.original.resource}
          onValueChange={(v) => patchRow(row.original.key, { resource: v })}
        >
          <SelectTrigger variant='secondary' className='w-full'>
            <SelectValue placeholder='Select resource' />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_RESOURCES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: 'startDate',
      header: 'Start date',
      cell: ({ row }) => (
        <Input
          type='date'
          aria-label='Start date'
          value={row.original.startDate}
          onChange={(e) =>
            patchRow(row.original.key, { startDate: e.target.value })
          }
        />
      ),
    },
    {
      id: 'endDate',
      header: 'End date',
      cell: ({ row }) => (
        <Input
          type='date'
          aria-label='End date'
          value={row.original.endDate}
          min={row.original.startDate || undefined}
          onChange={(e) =>
            patchRow(row.original.key, { endDate: e.target.value })
          }
        />
      ),
    },
    {
      id: 'hoursPerDay',
      header: 'Hrs/day',
      cell: ({ row }) => (
        <Input
          type='number'
          min={1}
          max={12}
          className='w-[70px]'
          placeholder='8'
          value={row.original.hoursPerDay}
          onChange={(e) =>
            patchRow(row.original.key, { hoursPerDay: e.target.value })
          }
        />
      ),
    },
    {
      id: 'percentPerDay',
      header: '%/day',
      cell: ({ row }) => (
        <Input
          type='number'
          min={1}
          max={100}
          className='w-[70px]'
          placeholder='100'
          value={row.original.percentPerDay}
          onChange={(e) =>
            patchRow(row.original.key, { percentPerDay: e.target.value })
          }
        />
      ),
    },
    {
      id: 'weekdays',
      header: 'Allocation days (Su–Sa)',
      meta: { headerClassName: 'min-w-[230px]' },
      cell: ({ row }) => (
        <div className='flex gap-1'>
          {WEEKDAYS.map((day) => {
            const active = row.original.weekdays.includes(day)
            return (
              <button
                key={day}
                type='button'
                aria-pressed={active}
                onClick={() => toggleWeekday(row.original, day)}
                className={cn(
                  'rounded border px-1.5 py-0.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-blue-1400 bg-blue-150 text-blue-1400'
                    : 'text-neutral-1000 border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      ),
    },
    {
      id: 'remove',
      header: '',
      cell: ({ row }) => (
        <Button
          variant='ghost'
          size='sm'
          aria-label='Remove row'
          disabled={grid.length === 1}
          onClick={() =>
            setGrid((prev) => prev.filter((r) => r.key !== row.original.key))
          }
        >
          <Trash size={14} />
        </Button>
      ),
    },
  ]

  const saveAll = () => {
    if (!complete) return
    store.saveBulkAssignments(
      touched.map((r) => ({
        project: r.project,
        resource: r.resource,
        startDate: r.startDate,
        endDate: r.endDate,
        hoursPerDay: Number(r.hoursPerDay),
        percentPerDay: Number(r.percentPerDay),
        weekdays: r.weekdays,
      }))
    )
    setGrid(initialGrid())
  }

  const resetGrid = () => {
    setGrid(initialGrid())
    toast.info('Bulk assignment grid reset — all entered values cleared')
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Plan multiple resource-to-project allocations in one grid and commit
          them together. Rows left fully blank are ignored on save.
        </p>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setGrid((prev) => [...prev, blankRow()])}
          >
            <Plus size={12} weight='bold' />
            Add row
          </Button>
          <Button variant='outline' size='sm' onClick={resetGrid}>
            <ArrowCounterClockwise size={12} weight='bold' />
            Reset grid
          </Button>
          <Button size='sm' onClick={saveAll} disabled={!complete}>
            Save all ({touched.length})
          </Button>
        </div>
      </div>

      <SimpleTable
        columns={gridColumns}
        data={grid}
        getRowId={(r) => String(r.key)}
      />
      {touched.length > 0 && !complete && (
        <p className='text-paragraph-sm text-orange-1200'>
          Every started row needs a project, resource, valid start/end dates,
          hours &amp; percentage per day and at least one allocation day
          before the bulk save is enabled.
        </p>
      )}

      <SectionTitle>Committed assignments</SectionTitle>
      <SimpleTable
        columns={committedColumns}
        data={store.assignments}
        getRowId={(a) => a.id}
      />
    </div>
  )
}
