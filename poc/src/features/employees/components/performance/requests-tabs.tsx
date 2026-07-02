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
  CLASS_CHANGE_STATUSES,
  SALARY_REVISION_STATUSES,
} from '../../data/performance'
import { type PerformanceStore } from '../../hooks/use-performance'
import { FilterSelect, SectionTitle, StatusBadge } from '../shared'

/** EMP-40 — salary revision request & approval workflow. */
export function SalaryRevisionsTab({ store }: { store: PerformanceStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = useMemo(
    () =>
      store.salaryRevisions.filter(
        (r) =>
          (statusFilter === 'all' || r.status === statusFilter) &&
          (departmentFilter === 'all' || r.department === departmentFilter) &&
          (activeFilter === 'all' ||
            (activeFilter === 'Active' ? r.activeEmployee : !r.activeEmployee))
      ),
    [store.salaryRevisions, statusFilter, departmentFilter, activeFilter]
  )

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={SALARY_REVISION_STATUSES}
        />
        <FilterSelect
          label='Department'
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={DEPARTMENTS}
        />
        <FilterSelect
          label='Employees'
          value={activeFilter}
          onChange={setActiveFilter}
          options={['Active', 'Inactive']}
        />
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Revision period</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='font-medium'>{r.employee}</TableCell>
                <TableCell>{r.department}</TableCell>
                <TableCell>{r.position}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {r.revisionPeriod}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {r.revisionDueDate}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Employee (User)', 'Company Admin']}>
                    {r.status === 'Pending submission' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          store.setSalaryRevisionStatus(r.id, 'Pending approval')
                        }
                      >
                        Complete & submit
                      </Button>
                    )}
                    {(r.status === 'Pending approval' ||
                      r.status === 'Need clarification') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' size='sm'>
                            Open task
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setSalaryRevisionStatus(r.id, 'Approved')
                            }
                          >
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setSalaryRevisionStatus(
                                r.id,
                                'Need clarification'
                              )
                            }
                          >
                            Need clarification
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/** EMP-41/42 — class change requests + approver routing configuration. */
export function ClassChangesTab({ store }: { store: PerformanceStore }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(
    () =>
      store.classChanges.filter(
        (c) => statusFilter === 'all' || c.status === statusFilter
      ),
    [store.classChanges, statusFilter]
  )

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={CLASS_CHANGE_STATUSES}
        />
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Class (original → destination)</TableHead>
              <TableHead>Department (old → new)</TableHead>
              <TableHead>Position (old → new)</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.employee}</TableCell>
                <TableCell>
                  {c.originalClass} →{' '}
                  <span className='font-medium'>{c.destinationClass}</span>
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {c.oldDepartment} → {c.newDepartment}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {c.oldPosition} → {c.newPosition}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {c.requestedOn}
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  {c.status === 'Pending approval' && (
                    <RoleGate roles={['Employee (User)', 'Company Admin']}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' size='sm'>
                            Open task
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setClassChangeStatus(c.id, 'Approved')
                            }
                          >
                            Approve — class/dept/position update
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setClassChangeStatus(c.id, 'Rejected')
                            }
                          >
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setClassChangeStatus(c.id, 'Cancelled')
                            }
                          >
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </RoleGate>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RoleGate roles={['Company Admin']}>
        <SectionTitle>
          Class change approver routing (per location)
        </SectionTitle>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Approvers</TableHead>
                <TableHead>Offer approver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.approverRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-medium'>{r.location}</TableCell>
                  <TableCell>{r.approvers}</TableCell>
                  <TableCell>{r.offerApprover}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000'>
          Requests raised for a location are routed to its configured
          approvers; offer approvals go to the offer approver.
        </p>
      </RoleGate>
    </div>
  )
}
