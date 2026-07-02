import { useMemo, useState } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import { RoleGate } from '@/context/role-context'
import { DEPARTMENTS } from '../../data/employees'
import {
  ACK_STATUSES,
  ACK_TEMPLATE_TYPES,
  DISCIPLINARY_STATUSES,
} from '../../data/performance'
import { type PerformanceStore } from '../../hooks/use-performance'
import { FilterSelect, SectionTitle, StatusBadge } from '../shared'

/** EMP-44 — disciplinary actions: record, approve/reject/withdraw, letter. */
export function DisciplinaryTab({ store }: { store: PerformanceStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [employee, setEmployee] = useState('')
  const [department, setDepartment] = useState('')
  const [actionType, setActionType] = useState('')
  const [details, setDetails] = useState('')

  const filtered = useMemo(
    () =>
      store.disciplinaryActions.filter(
        (a) =>
          (statusFilter === 'all' || a.status === statusFilter) &&
          (departmentFilter === 'all' || a.department === departmentFilter)
      ),
    [store.disciplinaryActions, statusFilter, departmentFilter]
  )

  const submit = () => {
    if (!employee || !department || !actionType || !details) return
    store.addDisciplinaryAction({
      employee,
      department,
      actionType,
      details,
      activeEmployee: true,
    })
    setEmployee('')
    setDepartment('')
    setActionType('')
    setDetails('')
    setOpen(false)
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          <FilterSelect
            label='Status'
            value={statusFilter}
            onChange={setStatusFilter}
            options={DISCIPLINARY_STATUSES}
          />
          <FilterSelect
            label='Department'
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={DEPARTMENTS}
          />
        </div>
        <RoleGate roles={['Company Admin']}>
          <Button size='sm' onClick={() => setOpen(true)}>
            <Plus size={12} weight='bold' />
            Add disciplinary action
          </Button>
        </RoleGate>
      </div>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Action type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Raised on</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className='font-medium'>{a.employee}</TableCell>
                <TableCell>{a.department}</TableCell>
                <TableCell>{a.actionType}</TableCell>
                <TableCell className='text-neutral-1000 max-w-[260px] truncate'>
                  {a.details}
                </TableCell>
                <TableCell className='text-neutral-1000'>{a.raisedOn}</TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Company Admin']}>
                    {a.status === 'Pending approval' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' size='sm'>
                            Open task
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setDisciplinaryStatus(a.id, 'Approved')
                            }
                          >
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setDisciplinaryStatus(a.id, 'Rejected')
                            }
                          >
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              store.setDisciplinaryStatus(a.id, 'Withdrawn')
                            }
                          >
                            Withdraw
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {a.status === 'Approved' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          store.setDisciplinaryStatus(a.id, 'Letter generated')
                        }
                      >
                        Generate letter
                      </Button>
                    )}
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>New disciplinary action</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Employee</Label>
              <Input
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                placeholder='Employee name'
              />
            </div>
            <div className='space-y-1'>
              <Label>Department</Label>
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
              <Label>Action type</Label>
              <Input
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                placeholder='e.g. Written warning'
              />
            </div>
            <div className='space-y-1'>
              <Label>Details</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder='Describe the policy deviation'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!employee || !department || !actionType || !details}
            >
              Record — Pending approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** EMP-45/46 — document acknowledgements + template configuration. */
export function AcknowledgementsTab({ store }: { store: PerformanceStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const filtered = useMemo(
    () =>
      store.acknowledgements.filter(
        (a) =>
          (statusFilter === 'all' || a.status === statusFilter) &&
          (typeFilter === 'all' || a.templateType === typeFilter) &&
          (departmentFilter === 'all' || a.department === departmentFilter)
      ),
    [store.acknowledgements, statusFilter, typeFilter, departmentFilter]
  )

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <FilterSelect
          label='Status'
          value={statusFilter}
          onChange={setStatusFilter}
          options={ACK_STATUSES}
        />
        <FilterSelect
          label='Type'
          value={typeFilter}
          onChange={setTypeFilter}
          options={ACK_TEMPLATE_TYPES}
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
              <TableHead>Document</TableHead>
              <TableHead>Template type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Acknowledged</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className='font-medium'>{a.document}</TableCell>
                <TableCell>
                  <Badge variant='open'>{a.templateType}</Badge>
                </TableCell>
                <TableCell>{a.department}</TableCell>
                <TableCell className='text-neutral-1000'>{a.issuedOn}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {a.expiresOn}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {a.acknowledgedOn ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell>
                  {a.status === 'Pending' && (
                    <RoleGate roles={['Employee (User)']}>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => store.acknowledgeDocument(a.id)}
                      >
                        Acknowledge
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
        Items past their expiry without action show as Expired; every
        acknowledgement is auditable against your record.
      </p>

      <RoleGate roles={['Company Admin']}>
        <SectionTitle>
          Acknowledgement configuration (template type per location)
        </SectionTitle>
        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Locations</TableHead>
                <TableHead>Template type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.ackConfigs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.locations}</TableCell>
                  <TableCell>
                    <Badge variant='open'>{c.templateType}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000'>
          When a document of a mapped type is issued in a location, the
          corresponding acknowledgement is required automatically.
        </p>
      </RoleGate>
    </div>
  )
}
