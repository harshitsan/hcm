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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { RoleGate } from '@/context/role-context'
import {
  ASSIGNEE_DIRECTORY,
  type Layoff,
  type LayoffEmployee,
  type LayoffStatus,
} from '../../data/lifecycle'
import { type LifecycleStore } from '../../hooks/use-lifecycle'
import { FilterSelect, InfoField, StatusBadge } from '../shared'
import { InitiateLayoffDialog } from './initiate-layoff-dialog'

const LAYOFF_STATUSES = [
  'Pending approval',
  'Need clarification',
  'Approved',
  'Exited',
  'Rejected',
  'Withdrawn',
]

/** Approver actions available per layoff status (Withdraw handled apart). */
function nextActions(status: LayoffStatus): LayoffStatus[] {
  if (status === 'Pending approval')
    return ['Approved', 'Need clarification', 'Rejected']
  if (status === 'Need clarification') return ['Approved', 'Rejected']
  if (status === 'Approved') return ['Exited']
  return []
}

const canWithdraw = (status: LayoffStatus) =>
  status === 'Pending approval' ||
  status === 'Need clarification' ||
  status === 'Approved'

/** EMP-50 — group separations governed like individual exits. */
export function LayoffsTab({ store }: { store: LifecycleStore }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [initiateOpen, setInitiateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [withdrawId, setWithdrawId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      store.layoffs.filter(
        (l) => statusFilter === 'all' || l.status === statusFilter
      ),
    [store.layoffs, statusFilter]
  )

  const detail = store.layoffs.find((l) => l.id === detailId) ?? null

  return (
    <Tabs defaultValue='layoffs' className='space-y-1'>
      <TabsList className='h-8 bg-transparent p-0'>
        <TabsTrigger variant='ghost' value='layoffs'>
          Layoffs ({store.layoffs.length})
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='exit-list'>
          Exit List
        </TabsTrigger>
      </TabsList>

      <TabsContent value='layoffs' className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <FilterSelect
            label='Status'
            value={statusFilter}
            onChange={setStatusFilter}
            options={LAYOFF_STATUSES}
          />
          <RoleGate roles={['Company Admin']}>
            <Button size='sm' onClick={() => setInitiateOpen(true)}>
              <Plus size={12} weight='bold' />
              Initiate layoff
            </Button>
          </RoleGate>
        </div>

        <p className='text-neutral-1000 rounded-md bg-neutral-200 px-2 py-1.5 text-xs'>
          Affected employees are NOT notified about a layoff. Reporting
          managers are notified on initiation, but their approval is not
          required. Layoff records cannot be edited after initiation.
        </p>

        <div className='rounded-md border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layoff name</TableHead>
                <TableHead>Initiated date</TableHead>
                <TableHead>Initiator</TableHead>
                <TableHead>Layoff LWD</TableHead>
                <TableHead>Days of salary</TableHead>
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
                    <TableCell className='text-neutral-1000'>
                      {l.lwd ?? '—'}
                    </TableCell>
                    <TableCell>
                      {l.salaryDays != null ? `${l.salaryDays} days` : '—'}
                    </TableCell>
                    <TableCell>{l.employeesCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} />
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setDetailId(l.id)}
                        >
                          View
                        </Button>
                        {(actions.length > 0 || canWithdraw(l.status)) && (
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
                                    onClick={() =>
                                      store.setLayoffStatus(l.id, a)
                                    }
                                  >
                                    {a === 'Approved'
                                      ? 'Approve'
                                      : a === 'Rejected'
                                        ? 'Reject'
                                        : a === 'Need clarification'
                                          ? 'Need clarification'
                                          : `Mark ${a}`}
                                  </DropdownMenuItem>
                                ))}
                                {canWithdraw(l.status) && (
                                  <DropdownMenuItem
                                    onClick={() => setWithdrawId(l.id)}
                                  >
                                    Withdraw…
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </RoleGate>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value='exit-list'>
        <LayoffExitList store={store} />
      </TabsContent>

      <InitiateLayoffDialog
        open={initiateOpen}
        onOpenChange={setInitiateOpen}
        onSubmit={store.initiateLayoff}
      />
      <LayoffDetailDialog layoff={detail} onClose={() => setDetailId(null)} />
      <WithdrawLayoffDialog
        layoff={store.layoffs.find((l) => l.id === withdrawId) ?? null}
        onClose={() => setWithdrawId(null)}
        onWithdraw={(id, reason) => store.withdrawLayoff(id, reason)}
      />
    </Tabs>
  )
}

/* ── Layoff detail (read-only — no edit after initiation) ────────────── */

function LayoffDetailDialog({
  layoff,
  onClose,
}: {
  layoff: Layoff | null
  onClose: () => void
}) {
  return (
    <Dialog open={layoff !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[640px]'>
        {layoff && (
          <>
            <DialogHeader>
              <DialogTitle>{layoff.name}</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                <InfoField label='Initiated' value={layoff.initiatedDate} />
                <InfoField label='Initiator' value={layoff.initiator} />
                <InfoField
                  label='Status'
                  value={<StatusBadge status={layoff.status} />}
                />
                <InfoField label='Suggested LWD' value={layoff.lwd} />
                <InfoField
                  label='Days of salary'
                  value={
                    layoff.salaryDays != null
                      ? `${layoff.salaryDays} days`
                      : '—'
                  }
                />
                <InfoField
                  label='Employees'
                  value={String(layoff.employeesCount)}
                />
              </div>
              <InfoField label='Reasons for Layoff' value={layoff.reason} />
              {layoff.withdrawReason && (
                <InfoField
                  label='Reason for withdraw'
                  value={layoff.withdrawReason}
                />
              )}
              {layoff.employees && layoff.employees.length > 0 && (
                <div className='rounded-[8px] border border-gray-200 bg-white'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>LWD</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {layoff.employees.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className='font-medium'>
                            {e.name}
                          </TableCell>
                          <TableCell>{e.department}</TableCell>
                          <TableCell>{e.position}</TableCell>
                          <TableCell>{e.location}</TableCell>
                          <TableCell className='text-neutral-1000'>
                            {e.lwd}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={e.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {layoff.documents && layoff.documents.length > 0 && (
                <InfoField
                  label='Documents'
                  value={layoff.documents.join(', ')}
                />
              )}
              <InfoField label='Comments' value={layoff.comments} />
              <p className='text-neutral-1000 rounded-md bg-neutral-200 px-2 py-1.5 text-xs'>
                This record cannot be edited after initiation. Employees have
                not been notified; reporting managers were notified on
                initiation.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Withdraw (mandatory reason) ─────────────────────────────────────── */

function WithdrawLayoffDialog({
  layoff,
  onClose,
  onWithdraw,
}: {
  layoff: Layoff | null
  onClose: () => void
  onWithdraw: (id: string, reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const submit = () => {
    if (!layoff || !reason.trim()) return
    onWithdraw(layoff.id, reason.trim())
    setReason('')
    onClose()
  }
  return (
    <Dialog
      open={layoff !== null}
      onOpenChange={(o) => {
        if (!o) {
          setReason('')
          onClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Withdraw layoff</DialogTitle>
        </DialogHeader>
        <div className='space-y-1'>
          <Label>Reason for withdraw (mandatory)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Why is "${layoff?.name ?? ''}" being withdrawn?`}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!reason.trim()}>
            Withdraw layoff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Exit List sub-view — one row per affected employee ──────────────── */

interface ExitListRow {
  layoff: Layoff
  employee: LayoffEmployee
}

function LayoffExitList({ store }: { store: LifecycleStore }) {
  const [lwdRow, setLwdRow] = useState<ExitListRow | null>(null)
  const [taskRow, setTaskRow] = useState<ExitListRow | null>(null)
  const [revokeRow, setRevokeRow] = useState<ExitListRow | null>(null)

  const rows: ExitListRow[] = useMemo(
    () =>
      store.layoffs
        .filter((l) => l.status === 'Approved' || l.status === 'Exited')
        .flatMap(
          (layoff) =>
            layoff.employees?.map((employee) => ({ layoff, employee })) ?? []
        ),
    [store.layoffs]
  )

  return (
    <div className='space-y-3'>
      <p className='text-neutral-1000 text-xs'>
        Each employee in an approved layoff appears here as an individual
        exit. Use the row actions to change the last working day, add exit
        tasks or revoke the layoff for one employee.
      </p>
      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Layoff</TableHead>
              <TableHead>LWD</TableHead>
              <TableHead>Exit tasks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className='text-neutral-1000 text-center text-sm'
                >
                  No approved layoffs yet — approve a layoff to populate the
                  exit list.
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ layoff, employee }) => (
              <TableRow key={`${layoff.id}-${employee.id}`}>
                <TableCell className='font-medium'>{employee.name}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell className='text-neutral-1000'>
                  {layoff.name}
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {employee.lwd}
                </TableCell>
                <TableCell>
                  {employee.exitTasks.length === 0 ? (
                    <span className='text-neutral-1000'>—</span>
                  ) : (
                    <ul className='space-y-0.5'>
                      {employee.exitTasks.map((t) => (
                        <li key={t.id} className='text-xs'>
                          {t.name}{' '}
                          <span className='text-neutral-1000'>
                            → {t.assignee}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={employee.status} />
                  {employee.status === 'Revoked' && employee.revokeComment && (
                    <p className='text-neutral-1000 mt-0.5 text-xs'>
                      {employee.revokeComment}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {employee.status === 'Approved' && (
                    <RoleGate roles={['Company Admin']}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' size='sm'>
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => setLwdRow({ layoff, employee })}
                          >
                            Change LWD…
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTaskRow({ layoff, employee })}
                          >
                            Exit task…
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setRevokeRow({ layoff, employee })}
                          >
                            Revoke layoff…
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

      <ChangeLwdDialog
        row={lwdRow}
        onClose={() => setLwdRow(null)}
        onSave={(row, lwd) =>
          store.changeLayoffEmployeeLwd(row.layoff.id, row.employee.id, lwd)
        }
      />
      <ExitTaskDialog
        row={taskRow}
        onClose={() => setTaskRow(null)}
        onSave={(row, task) =>
          store.addLayoffExitTask(row.layoff.id, row.employee.id, task)
        }
      />
      <RevokeLayoffDialog
        row={revokeRow}
        onClose={() => setRevokeRow(null)}
        onSave={(row, comment) =>
          store.revokeLayoffEmployee(row.layoff.id, row.employee.id, comment)
        }
      />
    </div>
  )
}

function ChangeLwdDialog({
  row,
  onClose,
  onSave,
}: {
  row: ExitListRow | null
  onClose: () => void
  onSave: (row: ExitListRow, lwd: string) => void
}) {
  const [lwd, setLwd] = useState('')
  const submit = () => {
    if (!row || !lwd) return
    onSave(row, lwd)
    setLwd('')
    onClose()
  }
  return (
    <Dialog
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) {
          setLwd('')
          onClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-[380px]'>
        <DialogHeader>
          <DialogTitle>Change last working day</DialogTitle>
        </DialogHeader>
        <div className='space-y-1'>
          <Label>
            New LWD for {row?.employee.name} (current: {row?.employee.lwd})
          </Label>
          <Input
            type='date'
            value={lwd}
            onChange={(e) => setLwd(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!lwd}>
            Save LWD
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExitTaskDialog({
  row,
  onClose,
  onSave,
}: {
  row: ExitListRow | null
  onClose: () => void
  onSave: (row: ExitListRow, task: { name: string; assignee: string }) => void
}) {
  const [name, setName] = useState('')
  const [assignee, setAssignee] = useState('')
  const reset = () => {
    setName('')
    setAssignee('')
  }
  const submit = () => {
    if (!row || !name.trim() || !assignee) return
    onSave(row, { name: name.trim(), assignee })
    reset()
    onClose()
  }
  return (
    <Dialog
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Add exit task — {row?.employee.name}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1'>
            <Label>Task name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Hand over depot access keys'
            />
          </div>
          <div className='space-y-1'>
            <Label>Assignee</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select assignee' />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNEE_DIRECTORY.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || !assignee}>
            Add task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RevokeLayoffDialog({
  row,
  onClose,
  onSave,
}: {
  row: ExitListRow | null
  onClose: () => void
  onSave: (row: ExitListRow, comment: string) => void
}) {
  const [comment, setComment] = useState('')
  const submit = () => {
    if (!row || !comment.trim()) return
    onSave(row, comment.trim())
    setComment('')
    onClose()
  }
  return (
    <Dialog
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) {
          setComment('')
          onClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Revoke layoff — {row?.employee.name}</DialogTitle>
        </DialogHeader>
        <div className='space-y-1'>
          <Label>Comment (mandatory)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder='Why is this employee being removed from the layoff?'
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!comment.trim()}>
            Revoke for this employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
