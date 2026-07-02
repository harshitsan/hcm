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
import { DEPARTMENTS, POSITIONS } from '../../data/employees'
import { type JoiningTask } from '../../data/lifecycle'
import { type LifecycleStore } from '../../hooks/use-lifecycle'
import { FilterSelect, StatusBadge } from '../shared'

const JOINEE_STATUSES = ['Pending initiation', 'In Progress', 'Completed']

/** EMP-31 — new-joinee joining-formalities tracking with status filters. */
export function NewJoineesTab({ store }: { store: LifecycleStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const filtered = useMemo(
    () =>
      store.joinees.filter(
        (j) =>
          (statusFilter === 'all' || j.status === statusFilter) &&
          (departmentFilter === 'all' || j.department === departmentFilter)
      ),
    [store.joinees, statusFilter, departmentFilter]
  )

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={JOINEE_STATUSES}
        />
        <FilterSelect
          label='Department'
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={DEPARTMENTS}
        />
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate name</TableHead>
              <TableHead>Employee code</TableHead>
              <TableHead>Date of joining</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position level</TableHead>
              <TableHead>Formalities</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((j) => (
              <TableRow key={j.id}>
                <TableCell className='font-medium'>{j.candidateName}</TableCell>
                <TableCell>{j.employeeCode}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {j.dateOfJoining}
                </TableCell>
                <TableCell>{j.department}</TableCell>
                <TableCell>{j.positionLevel}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {j.tasksDone}/{j.tasksTotal} tasks
                </TableCell>
                <TableCell>
                  <StatusBadge status={j.status} />
                </TableCell>
                <TableCell>
                  {j.status !== 'Completed' && (
                    <RoleGate roles={['Company Admin']}>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => store.completeJoineeTask(j.id)}
                      >
                        Complete next step
                      </Button>
                    </RoleGate>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/** EMP-30 — configurable onboarding/joining checklist tasks. */
export function JoiningChecklistTab({ store }: { store: LifecycleStore }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<JoiningTask | null>(null)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [positionLevel, setPositionLevel] = useState('')
  const [applicability, setApplicability] = useState('')

  const openFor = (task: JoiningTask | null) => {
    setEditing(task)
    setName(task?.name ?? '')
    setDepartment(task?.responsibleDepartment ?? '')
    setPositionLevel(task?.responsiblePositionLevel ?? '')
    setApplicability(task?.applicability ?? '')
    setOpen(true)
  }

  const valid = name && department && positionLevel && applicability

  const submit = () => {
    if (!valid) return
    store.saveJoiningTask(
      {
        name,
        responsibleDepartment: department,
        responsiblePositionLevel: positionLevel,
        applicability,
      },
      editing?.id
    )
    setOpen(false)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Configured tasks are instantiated against the responsible owners when
          a new hire is onboarded.
        </p>
        <RoleGate roles={['Company Admin']}>
          <Button size='sm' onClick={() => openFor(null)}>
            <Plus size={12} weight='bold' />
            Add joining task
          </Button>
        </RoleGate>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task name</TableHead>
              <TableHead>Responsible department</TableHead>
              <TableHead>Responsible position level</TableHead>
              <TableHead>Applicability</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.joiningTasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className='font-medium'>{t.name}</TableCell>
                <TableCell>{t.responsibleDepartment}</TableCell>
                <TableCell>{t.responsiblePositionLevel}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {t.applicability}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin']}>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openFor(t)}
                    >
                      Edit
                    </Button>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit joining task' : 'New joining task'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Task name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Issue ID card'
              />
            </div>
            <div className='space-y-1'>
              <Label>Responsible department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select department' />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Responsible position level</Label>
              <Select value={positionLevel} onValueChange={setPositionLevel}>
                <SelectTrigger variant='secondary' className='w-full'>
                  <SelectValue placeholder='Select position' />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Applicability</Label>
              <Input
                value={applicability}
                onChange={(e) => setApplicability(e.target.value)}
                placeholder='e.g. All employees / Plant staff'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!valid}>
              {editing ? 'Save' : 'Add task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
