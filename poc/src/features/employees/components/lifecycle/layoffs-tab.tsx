import { useMemo, useState } from 'react'
import { Plus } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate } from '@/context/role-context'
import { type LayoffStatus } from '../../data/lifecycle'
import { type LifecycleStore } from '../../hooks/use-lifecycle'
import { FilterSelect, StatusBadge } from '../shared'

const LAYOFF_STATUSES = [
  'Pending approval',
  'Approved',
  'Exited',
  'Rejected',
  'Withdrawn',
]

/** EMP-50 — group separations governed like individual exits. */
export function LayoffsTab({ store }: { store: LifecycleStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [count, setCount] = useState('')

  const filtered = useMemo(
    () =>
      store.layoffs.filter(
        (l) => statusFilter === 'all' || l.status === statusFilter
      ),
    [store.layoffs, statusFilter]
  )

  const submit = () => {
    const employeesCount = Number(count)
    if (!name || !employeesCount || employeesCount < 1) return
    store.initiateLayoff({ name, employeesCount })
    setName('')
    setCount('')
    setOpen(false)
  }

  const nextActions = (status: LayoffStatus): LayoffStatus[] => {
    if (status === 'Pending approval')
      return ['Approved', 'Rejected', 'Withdrawn']
    if (status === 'Approved') return ['Exited', 'Withdrawn']
    return []
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={LAYOFF_STATUSES}
        />
        <RoleGate roles={['Company Admin']}>
          <Button size='sm' onClick={() => setOpen(true)}>
            <Plus size={12} weight='bold' />
            Initiate layoff
          </Button>
        </RoleGate>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layoff name</TableHead>
              <TableHead>Initiated date</TableHead>
              <TableHead>Initiator</TableHead>
              <TableHead>No. of employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => {
              const actions = nextActions(l.status)
              return (
                <TableRow key={l.id}>
                  <TableCell className='font-medium'>{l.name}</TableCell>
                  <TableCell className='text-neutral-1000'>
                    {l.initiatedDate}
                  </TableCell>
                  <TableCell>{l.initiator}</TableCell>
                  <TableCell>{l.employeesCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell>
                    {actions.length > 0 && (
                      <RoleGate roles={['Company Admin']}>
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
                                onClick={() => store.setLayoffStatus(l.id, a)}
                              >
                                Mark {a}
                              </DropdownMenuItem>
                            ))}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Initiate layoff</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Layoff name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Depot consolidation — Phase 2'
              />
            </div>
            <div className='space-y-1'>
              <Label>Number of employees covered</Label>
              <Input
                type='number'
                min={1}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder='e.g. 6'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!name || !count}>
              Initiate — Pending approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
