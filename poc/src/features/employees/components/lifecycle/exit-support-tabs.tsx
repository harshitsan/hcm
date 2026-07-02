import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { EXIT_TYPES } from '../../data/lifecycle'
import { type LifecycleStore } from '../../hooks/use-lifecycle'
import { FilterSelect, StatusBadge } from '../shared'

const CLEARANCE_STATUSES = [
  'Pending submission',
  'Pending approval',
  'Approved',
]

/** EMP-48 — per-department exit clearance sign-off (submit → approve). */
export function ExitClearanceTab({ store }: { store: LifecycleStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = useMemo(
    () =>
      store.clearances.filter(
        (c) =>
          (statusFilter === 'all' || c.status === statusFilter) &&
          (departmentFilter === 'all' || c.department === departmentFilter) &&
          (typeFilter === 'all' || c.exitType === typeFilter)
      ),
    [store.clearances, statusFilter, departmentFilter, typeFilter]
  )

  const outstanding = store.clearances.filter(
    (c) => c.status !== 'Approved'
  ).length

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={CLEARANCE_STATUSES}
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
        <span className='text-paragraph-sm text-neutral-1000 ml-auto'>
          {outstanding === 0
            ? 'All clearances approved — exit closure is unblocked'
            : `${outstanding} clearance(s) outstanding — exit closure blocked until approved`}
        </span>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Clearing department</TableHead>
              <TableHead>Exit type</TableHead>
              <TableHead>Initiated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.employee}</TableCell>
                <TableCell>{c.department}</TableCell>
                <TableCell>{c.exitType}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {c.initiationDate}
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin', 'Employee (User)']}>
                    {c.status === 'Pending submission' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => store.submitClearance(c.id)}
                      >
                        Complete & submit
                      </Button>
                    )}
                    {c.status === 'Pending approval' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => store.approveClearance(c.id)}
                      >
                        Approve clearance
                      </Button>
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

/** EMP-49 — HR offboarding checklist for departing employees. */
export function ExitHrChecklistTab({ store }: { store: LifecycleStore }) {
  return (
    <div className='rounded-md border border-gray-200 bg-white'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Position level</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact number</TableHead>
            <TableHead>Employee class</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {store.hrChecklist.map((h) => (
            <TableRow key={h.id}>
              <TableCell className='font-medium'>{h.employee}</TableCell>
              <TableCell>{h.positionLevel}</TableCell>
              <TableCell className='text-neutral-1000'>{h.email}</TableCell>
              <TableCell className='text-neutral-1000'>
                {h.contactNumber}
              </TableCell>
              <TableCell>{h.employeeClass}</TableCell>
              <TableCell>
                <StatusBadge status={h.status} />
              </TableCell>
              <TableCell>
                {h.status !== 'Completed' && (
                  <RoleGate roles={['Company Admin']}>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => store.advanceHrChecklist(h.id)}
                    >
                      {h.status === 'Pending for Submission'
                        ? 'Complete checklist & submit'
                        : 'Mark completed'}
                    </Button>
                  </RoleGate>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
