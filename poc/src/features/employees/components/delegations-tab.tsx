import { useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoleGate } from '@/context/role-context'
import { type EmployeesStore } from '../hooks/use-employees'
import { SectionTitle, StatusBadge } from './shared'

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

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Primary manager</TableHead>
              <TableHead>Acting manager</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Rerouted approvals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {delegations.map((d) => (
              <TableRow key={d.id}>
                <TableCell className='font-medium'>{d.manager}</TableCell>
                <TableCell>{d.actingManager}</TableCell>
                <TableCell>{d.team}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {d.startDate} → {d.endDate}
                </TableCell>
                <TableCell>
                  <Badge variant='pending'>{d.reroutedApprovals} items</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell>
                  {d.status !== 'Ended' && (
                    <RoleGate roles={['Company Admin', 'Employee (User)']}>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => endDelegation(d.id)}
                      >
                        End & revert
                      </Button>
                    </RoleGate>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-paragraph-sm text-neutral-1000'>
        Delegation never overwrites the recorded primary-manager relationship.
        When the period lapses, routing reverts to the primary manager
        automatically.
      </p>

      <SectionTitle>
        Manager assignment audit trail (all changes, effective-dated)
      </SectionTitle>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee / team</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From → To</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Changed by</TableHead>
              <TableHead>Changed on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managerChanges.map((c) => (
              <TableRow key={c.id}>
                <TableCell className='font-medium'>{c.employeeName}</TableCell>
                <TableCell>
                  <Badge variant='open'>{c.changeType}</Badge>
                </TableCell>
                <TableCell>
                  {c.from} → {c.to}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {c.effectiveDate}
                  {c.endDate ? ` → ${c.endDate}` : ''}
                </TableCell>
                <TableCell>{c.changedBy}</TableCell>
                <TableCell className='text-neutral-1000'>{c.changedOn}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
