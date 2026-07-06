import { useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/utils/helpers'
import {
  ALLOCATED_PROJECT_NAMES,
  ASSIGNABLE_RESOURCES,
  DEFAULT_WEEKDAYS,
  WEEKDAYS,
  type Weekday,
} from '../../data/projects'
import { type ProjectsStore } from '../../hooks/use-projects'
import { SectionTitle } from '../shared'

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

      <div className='overflow-x-auto rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-[190px]'>Project</TableHead>
              <TableHead className='min-w-[160px]'>Resource</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>End date</TableHead>
              <TableHead>Hrs/day</TableHead>
              <TableHead>%/day</TableHead>
              <TableHead className='min-w-[230px]'>
                Allocation days (Su–Sa)
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {grid.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  <Select
                    value={row.project}
                    onValueChange={(v) => patchRow(row.key, { project: v })}
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
                </TableCell>
                <TableCell>
                  <Select
                    value={row.resource}
                    onValueChange={(v) => patchRow(row.key, { resource: v })}
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
                </TableCell>
                <TableCell>
                  <Input
                    type='date'
                    aria-label='Start date'
                    value={row.startDate}
                    onChange={(e) =>
                      patchRow(row.key, { startDate: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type='date'
                    aria-label='End date'
                    value={row.endDate}
                    min={row.startDate || undefined}
                    onChange={(e) =>
                      patchRow(row.key, { endDate: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type='number'
                    min={1}
                    max={12}
                    className='w-[70px]'
                    placeholder='8'
                    value={row.hoursPerDay}
                    onChange={(e) =>
                      patchRow(row.key, { hoursPerDay: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type='number'
                    min={1}
                    max={100}
                    className='w-[70px]'
                    placeholder='100'
                    value={row.percentPerDay}
                    onChange={(e) =>
                      patchRow(row.key, { percentPerDay: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className='flex gap-1'>
                    {WEEKDAYS.map((day) => {
                      const active = row.weekdays.includes(day)
                      return (
                        <button
                          key={day}
                          type='button'
                          aria-pressed={active}
                          onClick={() => toggleWeekday(row, day)}
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
                </TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='sm'
                    aria-label='Remove row'
                    disabled={grid.length === 1}
                    onClick={() =>
                      setGrid((prev) => prev.filter((r) => r.key !== row.key))
                    }
                  >
                    <Trash size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {touched.length > 0 && !complete && (
        <p className='text-paragraph-sm text-orange-1200'>
          Every started row needs a project, resource, valid start/end dates,
          hours &amp; percentage per day and at least one allocation day
          before the bulk save is enabled.
        </p>
      )}

      <SectionTitle>Committed assignments</SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Hrs/day</TableHead>
              <TableHead>%/day</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Saved on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.assignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className='font-medium'>{a.project}</TableCell>
                <TableCell>{a.resource}</TableCell>
                <TableCell>
                  {a.startDate} → {a.endDate}
                </TableCell>
                <TableCell>{a.hoursPerDay}</TableCell>
                <TableCell>{a.percentPerDay}%</TableCell>
                <TableCell>{a.weekdays.join(' ')}</TableCell>
                <TableCell>{a.savedOn}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
