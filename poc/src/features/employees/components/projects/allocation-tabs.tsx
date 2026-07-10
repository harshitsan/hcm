import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowsClockwise, MagnifyingGlass, X } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  ALLOCATED_EMPLOYEE_NAMES,
  ALLOCATED_PROJECT_NAMES,
  type DayAllocation,
} from '../../data/projects'
import { type ProjectsStore } from '../../hooks/use-projects'
import { SectionTitle } from '../shared'

const EMPTY_PERIOD_MESSAGE = 'No allocations in the selected period.'

const dateColumn: ColumnDef<DayAllocation> = {
  accessorKey: 'date',
  header: sortableColumnHeader<DayAllocation>('Date'),
  cell: ({ row }) => <span className='font-medium'>{row.original.date}</span>,
}

const hoursColumn: ColumnDef<DayAllocation> = {
  accessorKey: 'hours',
  header: sortableColumnHeader<DayAllocation>('Allocated hours'),
  cell: ({ row }) => row.original.hours,
}

/** Day-wise summary for a single project (date / hours / task). */
const dayWiseColumns: ColumnDef<DayAllocation>[] = [
  dateColumn,
  hoursColumn,
  {
    accessorKey: 'task',
    header: sortableColumnHeader<DayAllocation>('Task'),
    cell: ({ row }) => row.original.task,
  },
]

/** Day-wise summary across projects (date / project / hours). */
const dayWiseProjectColumns: ColumnDef<DayAllocation>[] = [
  dateColumn,
  {
    accessorKey: 'project',
    header: sortableColumnHeader<DayAllocation>('Project'),
    cell: ({ row }) => row.original.project,
  },
  hoursColumn,
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

interface Filters {
  employee: string
  project: string
  from: string
  to: string
}

const EMPTY_FILTERS: Filters = { employee: '', project: '', from: '', to: '' }

function filterAllocations(rows: DayAllocation[], f: Filters) {
  return rows
    .filter(
      (a) =>
        (f.employee === '' || a.employee === f.employee) &&
        (f.project === '' || a.project === f.project) &&
        (f.from === '' || a.date >= f.from) &&
        (f.to === '' || a.date <= f.to)
    )
    .sort((a, b) => a.date.localeCompare(b.date))
}

function AllocationFilters({
  filters,
  onChange,
  requireProject,
  projectOptional,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  requireProject: boolean
  projectOptional?: boolean
}) {
  return (
    <div className='flex flex-wrap items-end gap-3'>
      <div className='space-y-1'>
        <Label>Employee</Label>
        <Select
          value={filters.employee}
          onValueChange={(v) => onChange({ ...filters, employee: v })}
        >
          <SelectTrigger variant='secondary' className='w-[180px]'>
            <SelectValue placeholder='Select employee' />
          </SelectTrigger>
          <SelectContent>
            {ALLOCATED_EMPLOYEE_NAMES.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-1'>
        <Label>
          Project{' '}
          {projectOptional && (
            <span className='text-neutral-1000 font-normal'>(optional)</span>
          )}
        </Label>
        <Select
          value={filters.project}
          onValueChange={(v) => onChange({ ...filters, project: v })}
        >
          <SelectTrigger variant='secondary' className='w-[240px]'>
            <SelectValue
              placeholder={
                requireProject ? 'Select project' : 'All projects'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {ALLOCATED_PROJECT_NAMES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-1'>
        <Label>Period from</Label>
        <Input
          type='date'
          className='w-[150px]'
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
        />
      </div>
      <div className='space-y-1'>
        <Label>Period to</Label>
        <Input
          type='date'
          className='w-[150px]'
          min={filters.from || undefined}
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
        />
      </div>
    </div>
  )
}

/**
 * DWRA-01..06 — manager query of a resource's day-wise allocation on a
 * specific project: employee + project selection, From/To period pickers,
 * search, reset and a refreshable date/hours/task summary.
 */
export function DayWiseAllocationTab({ store }: { store: ProjectsStore }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [results, setResults] = useState<DayAllocation[] | null>(null)
  const [lastRun, setLastRun] = useState<Filters | null>(null)

  const canSearch = filters.employee !== '' && filters.project !== ''

  const runSearch = (f: Filters, viaRefresh = false) => {
    const rows = filterAllocations(store.allocations, f)
    setResults(rows)
    setLastRun(f)
    if (viaRefresh) {
      toast.success('Day-wise summary refreshed — latest allocation data loaded')
    } else if (rows.length === 0) {
      toast.info('No allocations found for the selected criteria')
    }
  }

  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setResults(null)
    setLastRun(null)
    toast.info('Filters reset — run a new allocation query')
  }

  const total = (results ?? []).reduce((sum, r) => sum + r.hours, 0)

  return (
    <div className='space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        View a resource&apos;s day-wise allocated hours and tasks on a project
        for a chosen period.
      </p>
      <div className='flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3'>
        <AllocationFilters
          filters={filters}
          onChange={setFilters}
          requireProject
        />
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            disabled={!canSearch}
            onClick={() => runSearch(filters)}
          >
            <MagnifyingGlass size={12} weight='bold' />
            Search
          </Button>
          <Button variant='outline' size='sm' onClick={reset}>
            <X size={12} weight='bold' />
            Reset
          </Button>
        </div>
      </div>

      {results !== null && lastRun !== null && (
        <>
          <div className='flex items-center justify-between'>
            <SectionTitle>
              Day-wise summary — {lastRun.employee} · {lastRun.project}
            </SectionTitle>
            <Button
              variant='outline'
              size='sm'
              onClick={() => runSearch(lastRun, true)}
            >
              <ArrowsClockwise size={12} weight='bold' />
              Refresh
            </Button>
          </div>
          <SimpleTable
            columns={dayWiseColumns}
            data={results}
            emptyMessage={EMPTY_PERIOD_MESSAGE}
            getRowId={(r) => r.id}
          />
          <p className='text-paragraph-sm text-neutral-1000'>
            {results.length} day entr{results.length === 1 ? 'y' : 'ies'} ·{' '}
            {total} allocated hours in total
          </p>
        </>
      )}
    </div>
  )
}

/**
 * EPA-01..06 — manager view of how an employee is allocated across projects:
 * employee (+ optional project) and From/To pickers, search populating both
 * a day-wise (date/project/hours) and a project-wise (S.no/project/hours)
 * summary, with reset and refresh.
 */
export function EmployeeAllocationTab({ store }: { store: ProjectsStore }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [results, setResults] = useState<DayAllocation[] | null>(null)
  const [lastRun, setLastRun] = useState<Filters | null>(null)

  const runSearch = (f: Filters, viaRefresh = false) => {
    const rows = filterAllocations(store.allocations, f)
    setResults(rows)
    setLastRun(f)
    if (viaRefresh) {
      toast.success('Summaries refreshed — latest allocation data loaded')
    } else if (rows.length === 0) {
      toast.info('No allocations found for the selected criteria')
    }
  }

  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setResults(null)
    setLastRun(null)
    toast.info('Filters reset — run a new allocation query')
  }

  const byProject = [
    ...(results ?? [])
      .reduce<Map<string, number>>((map, r) => {
        map.set(r.project, (map.get(r.project) ?? 0) + r.hours)
        return map
      }, new Map())
      .entries(),
  ].map(([project, hours], i) => ({ sno: i + 1, project, hours }))

  return (
    <div className='space-y-4'>
      <p className='text-paragraph-sm text-neutral-1000'>
        Review an employee&apos;s allocation across projects — leave the
        project blank to include every project.
      </p>
      <div className='flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3'>
        <AllocationFilters
          filters={filters}
          onChange={setFilters}
          requireProject={false}
          projectOptional
        />
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            disabled={filters.employee === ''}
            onClick={() => runSearch(filters)}
          >
            <MagnifyingGlass size={12} weight='bold' />
            Search
          </Button>
          <Button variant='outline' size='sm' onClick={reset}>
            <X size={12} weight='bold' />
            Reset
          </Button>
        </div>
      </div>

      {results !== null && lastRun !== null && (
        <>
          <div className='flex items-center justify-between'>
            <SectionTitle>
              Allocation summaries — {lastRun.employee}
            </SectionTitle>
            <Button
              variant='outline'
              size='sm'
              onClick={() => runSearch(lastRun, true)}
            >
              <ArrowsClockwise size={12} weight='bold' />
              Refresh
            </Button>
          </div>

          <div className='grid gap-4 lg:grid-cols-2'>
            <div className='space-y-2'>
              <h4 className='text-neutral-1600 text-sm font-semibold'>
                Day-wise summary
              </h4>
              <SimpleTable
                columns={dayWiseProjectColumns}
                data={results}
                emptyMessage={EMPTY_PERIOD_MESSAGE}
                getRowId={(r) => r.id}
              />
            </div>

            <div className='space-y-2'>
              <h4 className='text-neutral-1600 text-sm font-semibold'>
                Project-wise summary
              </h4>
              <SimpleTable
                columns={projectWiseColumns}
                data={byProject}
                emptyMessage={EMPTY_PERIOD_MESSAGE}
                getRowId={(r) => r.project}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
