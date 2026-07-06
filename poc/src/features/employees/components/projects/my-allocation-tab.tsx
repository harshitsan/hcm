import { useMemo, useState } from 'react'
import { ArrowsClockwise } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type ProjectsStore } from '../../hooks/use-projects'
import { SectionTitle } from '../shared'

/** Self-service persona (Employee (User) = Rohit Menon in the POC). */
const SELF_NAME = 'Rohit Menon'

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
      ],
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
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Allocated hours</TableHead>
              <TableHead>Task</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dayWise.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='font-medium'>{r.date}</TableCell>
                <TableCell>{r.project}</TableCell>
                <TableCell>{r.hours}</TableCell>
                <TableCell>{r.task}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.no</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Allocated hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectWise.map(([project, hours], i) => (
              <TableRow key={project}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className='font-medium'>{project}</TableCell>
                <TableCell>{hours}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
