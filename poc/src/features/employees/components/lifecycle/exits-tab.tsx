import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate } from '@/context/role-context'
import { DEPARTMENTS } from '../../data/employees'
import {
  EXIT_STATUSES,
  EXIT_TYPES,
  type ExitRecord,
} from '../../data/lifecycle'
import { type LifecycleStore } from '../../hooks/use-lifecycle'
import { FilterSelect, StatusBadge } from '../shared'

/**
 * EMP-47 — exits move through resignation initiation → approval → exited →
 * FFS. Approvers can approve / reject / withdraw / revoke pending items and
 * advance settlement to Closed FFS.
 */
export function ExitsTab({ store }: { store: LifecycleStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = useMemo(
    () =>
      store.exits.filter(
        (e) =>
          (statusFilter === 'all' || e.status === statusFilter) &&
          (departmentFilter === 'all' || e.department === departmentFilter) &&
          (typeFilter === 'all' || e.exitType === typeFilter)
      ),
    [store.exits, statusFilter, departmentFilter, typeFilter]
  )

  const actionsFor = (exit: ExitRecord) => {
    switch (exit.status) {
      case 'Resignation initiated':
        return ['Approved', 'Rejected', 'Withdrawn'] as const
      case 'Approved':
        return ['Exited', 'Withdrawn'] as const
      case 'Exited':
        return ['Pending FFS'] as const
      case 'Pending FFS':
        return ['Closed FFS'] as const
      default:
        return [] as const
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={EXIT_STATUSES}
        />
        <FilterSelect
          label='Department'
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={DEPARTMENTS}
        />
        <FilterSelect
          label='Exit type'
          value={typeFilter}
          onChange={setTypeFilter}
          options={EXIT_TYPES}
        />
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Reporting manager</TableHead>
              <TableHead>Exit type</TableHead>
              <TableHead>Initiated</TableHead>
              <TableHead>Tentative last day</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => {
              const actions = actionsFor(e)
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <span className='font-medium'>{e.employee}</span>{' '}
                    <span className='text-neutral-1000'>({e.employeeCode})</span>
                  </TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell>{e.reportingManager}</TableCell>
                  <TableCell>{e.exitType}</TableCell>
                  <TableCell className='text-neutral-1000'>
                    {e.initiationDate}
                  </TableCell>
                  <TableCell className='text-neutral-1000'>
                    {e.tentativeLastDay}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    {actions.length > 0 && (
                      <RoleGate roles={['Company Admin', 'Employee (User)']}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='outline' size='sm'>
                              Open task
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {actions.map((a) => (
                              <DropdownMenuItem
                                key={a}
                                onClick={() => store.setExitStatus(e.id, a)}
                              >
                                {a === 'Pending FFS'
                                  ? 'Start settlement (Pending FFS)'
                                  : a === 'Closed FFS'
                                    ? 'Close settlement (Closed FFS)'
                                    : `Mark ${a}`}
                              </DropdownMenuItem>
                            ))}
                            {e.status === 'Resignation initiated' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  store.setExitStatus(e.id, 'Withdrawn')
                                }
                              >
                                Revoke
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </RoleGate>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
