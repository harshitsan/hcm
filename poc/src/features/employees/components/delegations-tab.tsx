import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
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
import { RoleGate } from '@/context/role-context'
import { type Delegation, type ManagerChange } from '../data/employees'
import { type EmployeesStore } from '../hooks/use-employees'
import { SectionTitle, StatusBadge } from './shared'

/** Manager-change audit trail columns (EMP-09) — canonical table pattern. */
const managerChangeColumns: ColumnDef<ManagerChange>[] = [
  {
    accessorKey: 'employeeName',
    header: sortableColumnHeader<ManagerChange>('Employee / team'),
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.employeeName}</span>
    ),
  },
  {
    accessorKey: 'changeType',
    header: sortableColumnHeader<ManagerChange>('Type'),
    cell: ({ row }) => <Badge variant='open'>{row.original.changeType}</Badge>,
  },
  {
    id: 'fromTo',
    accessorFn: (c) => `${c.from} → ${c.to}`,
    header: sortableColumnHeader<ManagerChange>('From → To'),
    cell: ({ row }) => (
      <>
        {row.original.from} → {row.original.to}
      </>
    ),
  },
  {
    accessorKey: 'effectiveDate',
    header: sortableColumnHeader<ManagerChange>('Effective'),
    cell: ({ row }) => (
      <span className='text-neutral-1000'>
        {row.original.effectiveDate}
        {row.original.endDate ? ` → ${row.original.endDate}` : ''}
      </span>
    ),
  },
  {
    accessorKey: 'changedBy',
    header: sortableColumnHeader<ManagerChange>('Changed by'),
    cell: ({ row }) => row.original.changedBy,
  },
  {
    accessorKey: 'changedOn',
    header: sortableColumnHeader<ManagerChange>('Changed on'),
    cell: ({ row }) => (
      <span className='text-neutral-1000'>{row.original.changedOn}</span>
    ),
  },
]

/**
 * Acting-manager delegations (EMP-08/18/24) + the effective-dated manager
 * change audit trail (EMP-09). The Workflow engine reroutes pending approvals
 * to the acting manager while a delegation is active and reverts on lapse.
 */
export function DelegationsTab({ store }: { store: EmployeesStore }) {
  const { delegations, managerChanges, addDelegation, endDelegation } = store
  const [open, setOpen] = useState(false)
  const [manager, setManager] = useState('')
  const [acting, setActing] = useState('')
  const [team, setTeam] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const managerNames = store.employees
    .filter((e) => e.lifecycleStage !== 'Exited')
    .map((e) => e.name)

  const valid =
    manager && acting && manager !== acting && team && startDate && endDate

  /** Delegation columns (EMP-08/18/24) — canonical table pattern. */
  const delegationColumns = useMemo<ColumnDef<Delegation>[]>(
    () => [
      {
        accessorKey: 'manager',
        header: sortableColumnHeader<Delegation>('Primary manager'),
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.manager}</span>
        ),
      },
      {
        accessorKey: 'actingManager',
        header: sortableColumnHeader<Delegation>('Acting manager'),
        cell: ({ row }) => row.original.actingManager,
      },
      {
        accessorKey: 'team',
        header: sortableColumnHeader<Delegation>('Team'),
        cell: ({ row }) => row.original.team,
      },
      {
        id: 'period',
        accessorFn: (d) => d.startDate,
        header: sortableColumnHeader<Delegation>('Period'),
        cell: ({ row }) => (
          <span className='text-neutral-1000'>
            {row.original.startDate} → {row.original.endDate}
          </span>
        ),
      },
      {
        accessorKey: 'reroutedApprovals',
        header: sortableColumnHeader<Delegation>('Rerouted approvals'),
        cell: ({ row }) => (
          <Badge variant='pending'>{row.original.reroutedApprovals} items</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: sortableColumnHeader<Delegation>('Status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status !== 'Ended' && (
            <RoleGate roles={['Company Admin', 'Employee (User)']}>
              <Button
                variant='outline'
                size='sm'
                onClick={() => endDelegation(row.original.id)}
              >
                End & revert
              </Button>
            </RoleGate>
          ),
      },
    ],
    [endDelegation]
  )

  const submit = () => {
    if (!valid) return
    addDelegation({ manager, actingManager: acting, team, startDate, endDate })
    setOpen(false)
    setManager('')
    setActing('')
    setTeam('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
          Acting-manager delegations ({delegations.length})
        </h2>
        <RoleGate roles={['Company Admin', 'Employee (User)']}>
          <Button size='sm' onClick={() => setOpen(true)}>
            <Plus size={12} weight='bold' />
            New delegation
          </Button>
        </RoleGate>
      </div>

      <SimpleTable
        columns={delegationColumns}
        data={delegations}
        getRowId={(d) => d.id}
      />
      <p className='text-paragraph-sm text-neutral-1000'>
        Delegation never overwrites the recorded primary-manager relationship.
        When the period lapses, routing reverts to the primary manager
        automatically.
      </p>

      <SectionTitle>
        Manager assignment audit trail (all changes, effective-dated)
      </SectionTitle>
      <SimpleTable
        columns={managerChangeColumns}
        data={managerChanges}
        getRowId={(c) => c.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Assign acting manager</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Primary manager (unavailable)</Label>
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select manager' />
                </SelectTrigger>
                <SelectContent>
                  {managerNames.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Acting manager</Label>
              <Select value={acting} onValueChange={setActing}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select acting manager' />
                </SelectTrigger>
                <SelectContent>
                  {managerNames
                    .filter((m) => m !== manager)
                    .map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Team</Label>
              <Input
                placeholder='e.g. Engineering — Bengaluru'
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <Label>Start (effective date)</Label>
                <Input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label>End</Label>
                <Input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <p className='text-paragraph-sm text-neutral-1000'>
              While active, the Workflow engine automatically reroutes the
              manager&rsquo;s pending and incoming approvals to the acting
              manager, with delegation context in the audit trail.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!valid}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
