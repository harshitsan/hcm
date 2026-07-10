import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowsClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  SimpleTable,
  sortableColumnHeader,
} from '@/components/common/data-table/simple-table'
import { type DayAllocation } from '../../data/projects'
import { type ProjectsStore } from '../../hooks/use-projects'
import { SectionTitle } from '../shared'

/** Self-service persona (Employee (User) = Rohit Menon in the POC). */
const SELF_NAME = 'Rohit Menon'

const dayWiseColumns: ColumnDef<DayAllocation>[] = [
  {
    accessorKey: 'date',
    header: sortableColumnHeader<DayAllocation>('Date'),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.date}</span>
    ),
  },
  {
    accessorKey: 'project',
    header: sortableColumnHeader<DayAllocation>('Project'),
    cell: ({ row }) => row.original.project,
  },
  {
    accessorKey: 'hours',
    header: sortableColumnHeader<DayAllocation>('Allocated hours'),
    cell: ({ row }) => row.original.hours,
  },
  {
    accessorKey: 'task',
    header: sortableColumnHeader<DayAllocation>('Task'),
    cell: ({ row }) => row.original.task,
  },
]

type ProjectWiseRow = { sno: number; project: string; hours: number }

const projectWiseColumns: ColumnDef<ProjectWiseRow>[] = [
  {
    accessorKey: 'sno',
    header: sortableColumnHeader<ProjectWiseRow>('S.no'),
    cell: ({ row }) => row.original.sno,
  },
  {
    accessorKey: 'project',
    header: sortableColumnHeader<ProjectWiseRow>('Project'),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.project}</span>
    ),
  },
  {
    accessorKey: 'hours',
    header: sortableColumnHeader<ProjectWiseRow>('Allocated hours'),
    cell: ({ row }) => row.original.hours,
  },
]

/**
 * My Project Allocation — the employee's own day-wise and project-wise
 * allocation summaries. MPA-06: each summary section has its own Refresh
 * action that reloads the latest data without a page reload.
 */
export function MyAllocationTab({ store }: { store: ProjectsStore }) {
  // Bumping a section's key re-derives its rows from the store — the POC
  // equivalent of re-fetching that section from the server.
  const [dayWiseKey, setDayWiseKey] = useState(0)
  const [projectWiseKey, setProjectWiseKey] = useState(0)

  const mine = useMemo(
    () =>
      store.allocations
        .filter((a) => a.employee === SELF_NAME)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [store.allocations]
  )

  const dayWise = useMemo(
    () => mine.slice(0, 20),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine, dayWiseKey]
  )

  const projectWise = useMemo(
    () =>
      [
        ...mine
          .reduce<Map<string, number>>((map, r) => {
            map.set(r.project, (map.get(r.project) ?? 0) + r.hours)
            return map
          }, new Map())
          .entries(),
      ].map(([project, hours], i) => ({ sno: i + 1, project, hours })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mine, projectWiseKey]
  )

  return (
    <div className='space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        Your allocation across projects, {SELF_NAME}. Each section can be
        refreshed independently to load the latest data.
      </p>

      <div className='flex items-center justify-between'>
        <SectionTitle>Day-wise summary</SectionTitle>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setDayWiseKey((k) => k + 1)
            toast.success('Day-wise summary refreshed')
          }}
        >
          <ArrowsClockwise size={12} weight='bold' />
          Refresh
        </Button>
      </div>
      <SimpleTable
        columns={dayWiseColumns}
        data={dayWise}
        getRowId={(r) => r.id}
      />
      <p className='text-paragraph-sm text-neutral-1000'>
        Showing the next {dayWise.length} allocated days.
      </p>

      <div className='flex items-center justify-between'>
        <SectionTitle>Project-wise summary</SectionTitle>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setProjectWiseKey((k) => k + 1)
            toast.success('Project-wise summary refreshed')
          }}
        >
          <ArrowsClockwise size={12} weight='bold' />
          Refresh
        </Button>
      </div>
      <SimpleTable
        columns={projectWiseColumns}
        data={projectWise}
        getRowId={(r) => r.project}
      />
    </div>
  )
}
