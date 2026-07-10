import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  ITEM_TYPE_LABELS,
  REASSIGN_DEPARTMENTS,
  REASSIGN_EMPLOYEES,
  REASSIGN_POSITIONS,
  REASSIGNMENT_TODAY,
  type ReassignItemType,
  type ReassignmentRecord,
} from '../data/reassignment'
import { fmtDate } from '../data/shared'
import {
  useReassignment,
  type ReassignTarget,
} from '../hooks/use-reassignment'

/** Items queued into the reassign dialog (1 item, or n direct reports). */
interface PendingReassign {
  itemType: ReassignItemType
  items: { id: string; label: string }[]
}

/**
 * Exit Management — Reassignment (PDF Screen #7). The assigned manager hands
 * over an exiting employee's Roles, Direct Reports and Tasks to receiving
 * employees via a Department → Position → Employee cascade; the receiving
 * employees are notified by (simulated) email.
 */
export function ReassignmentTab() {
  const store = useReassignment()
  const [subjectId, setSubjectId] = useState(store.subjects[0]?.id ?? '')
  const [pending, setPending] = useState<PendingReassign | null>(null)
  const [checkedReports, setCheckedReports] = useState<string[]>([])

  const subject = store.subjects.find((s) => s.id === subjectId) ?? null

  const completed = useMemo(
    () => store.records.filter((r) => r.subjectId === subjectId),
    [store.records, subjectId]
  )

  if (!subject) return null

  const openSingle = (
    itemType: ReassignItemType,
    item: { id: string; label: string }
  ) => setPending({ itemType, items: [item] })

  const openBulkReports = () => {
    const items = subject.directReports
      .filter((r) => checkedReports.includes(r.id))
      .map((r) => ({ id: r.id, label: r.name }))
    if (items.length > 0) setPending({ itemType: 'report', items })
  }

  const confirmReassign = (target: ReassignTarget) => {
    if (!pending) return
    for (const item of pending.items) {
      store.reassign(subject.id, pending.itemType, item.id, target)
    }
    if (pending.itemType === 'report') setCheckedReports([])
    setPending(null)
  }

  const toggleReport = (id: string) => {
    setCheckedReports((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const pendingReports = subject.directReports.filter(
    (r) => !store.recordFor(subject.id, 'report', r.id)
  )

  return (
    <div className='space-y-3'>
      {/* Subject selector */}
      <div className='flex flex-wrap items-center gap-2'>
        <Label className='text-neutral-1000'>Exiting employee:</Label>
        <Select
          value={subjectId}
          onValueChange={(v) => {
            setSubjectId(v)
            setCheckedReports([])
          }}
        >
          <SelectTrigger variant='secondary' className='h-8 w-[240px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {store.subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.employeeCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee details header card */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
          <HeaderField label='Employee' value={subject.name} />
          <HeaderField label='Code' value={subject.employeeCode} />
          <HeaderField label='Department' value={subject.department} />
          <HeaderField label='Position' value={subject.position} />
          <HeaderField label='Location' value={subject.location} />
          <HeaderField
            label='Last working day'
            value={fmtDate(subject.lastWorkingDay)}
          />
        </div>
        <p className='text-neutral-1000 mt-3 rounded-md bg-neutral-200 px-2 py-1.5 text-xs'>
          Only the assigned manager ({subject.reportingManager}) can reassign
          this employee's roles, direct reports and tasks — you are acting as{' '}
          {subject.reportingManager}. Newly assigned employees receive an
          email notification.
        </p>
      </div>

      {/* Current Roles */}
      <ReassignGrid
        title={`Current Roles (${subject.currentRoles.length})`}
        head={<TableHead>Role</TableHead>}
        rows={subject.currentRoles.map((r) => ({
          id: r.id,
          cells: <TableCell className='font-medium'>{r.role}</TableCell>,
          record: store.recordFor(subject.id, 'role', r.id),
          onReassign: () => openSingle('role', { id: r.id, label: r.role }),
        }))}
      />

      {/* Direct Reports — with multi-select + receiving "Assignee" */}
      <div className='rounded-[8px] border border-gray-200 bg-white'>
        <div className='flex items-center justify-between border-b border-gray-100 px-3 py-2'>
          <h3 className='text-neutral-1600 text-sm font-semibold'>
            Direct Reports ({subject.directReports.length})
          </h3>
          <Button
            variant='outline'
            size='sm'
            onClick={openBulkReports}
            disabled={checkedReports.length === 0}
          >
            Reassign selected ({checkedReports.length}) to an assignee
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-8'>
                <Checkbox
                  variant='blue'
                  checked={
                    pendingReports.length > 0 &&
                    checkedReports.length === pendingReports.length
                  }
                  onCheckedChange={(c) =>
                    setCheckedReports(
                      c ? pendingReports.map((r) => r.id) : []
                    )
                  }
                  aria-label='Select all pending direct reports'
                />
              </TableHead>
              <TableHead>Direct report</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Assignee (receiving manager)</TableHead>
              <TableHead className='w-28' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subject.directReports.map((r) => {
              const record = store.recordFor(subject.id, 'report', r.id)
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Checkbox
                      variant='blue'
                      checked={checkedReports.includes(r.id)}
                      onCheckedChange={() => toggleReport(r.id)}
                      disabled={record !== null}
                      aria-label={`Select ${r.name}`}
                    />
                  </TableCell>
                  <TableCell className='font-medium'>{r.name}</TableCell>
                  <TableCell>{r.position}</TableCell>
                  <TableCell>
                    <TargetCell record={record} />
                  </TableCell>
                  <TableCell className='text-right'>
                    {record === null && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          openSingle('report', { id: r.id, label: r.name })
                        }
                      >
                        Reassign
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Tasks */}
      <ReassignGrid
        title={`Tasks (${subject.tasks.length})`}
        head={<TableHead>Task</TableHead>}
        rows={subject.tasks.map((t) => ({
          id: t.id,
          cells: <TableCell className='font-medium'>{t.task}</TableCell>,
          record: store.recordFor(subject.id, 'task', t.id),
          onReassign: () => openSingle('task', { id: t.id, label: t.task }),
        }))}
      />

      {/* Confirmation summary (PDF Screen #7) */}
      <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>
          Completed reassignments ({completed.length})
        </h3>
        {completed.length === 0 ? (
          <p className='text-neutral-1000 mt-2 text-xs'>
            Nothing reassigned yet — use the Reassign actions above.
          </p>
        ) : (
          <ul className='mt-2 space-y-1.5'>
            {completed.map((r) => (
              <li
                key={r.id}
                className='flex flex-wrap items-baseline gap-x-2 border-b border-gray-100 pb-1.5 text-sm last:border-0 last:pb-0'
              >
                <span className='text-neutral-1000 text-xs'>
                  {ITEM_TYPE_LABELS[r.itemType]}
                </span>
                <span className='font-medium'>{r.itemLabel}</span>
                <span className='text-neutral-1000'>→</span>
                <span className='font-medium'>{r.toEmployee}</span>
                <span className='text-neutral-1000 text-xs'>
                  {r.toPosition}, {r.toDepartment} · effective{' '}
                  {fmtDate(r.effectiveFrom)} · reassigned{' '}
                  {fmtDate(r.reassignedOn)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ReassignDialog
        pending={pending}
        onClose={() => setPending(null)}
        onConfirm={confirmReassign}
      />
    </div>
  )
}

function HeaderField({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-neutral-1000 text-xs'>{label}</span>
      <span className='text-neutral-1600 text-sm font-medium'>{value}</span>
    </div>
  )
}

/** Shows the reassignment target for a completed row. */
function TargetCell({ record }: { record: ReassignmentRecord | null }) {
  if (!record) return <span className='text-neutral-1000'>—</span>
  return (
    <span className='text-sm'>
      <span className='font-medium'>{record.toEmployee}</span>{' '}
      <span className='text-neutral-1000 text-xs'>
        ({record.toPosition}, {record.toDepartment}) · w.e.f.{' '}
        {fmtDate(record.effectiveFrom)}
      </span>
    </span>
  )
}

interface GridRow {
  id: string
  cells: React.ReactNode
  record: ReassignmentRecord | null
  onReassign: () => void
}

/** Simple grid used for the Roles and Tasks sections. */
function ReassignGrid({
  title,
  head,
  rows,
}: {
  title: string
  head: React.ReactNode
  rows: GridRow[]
}) {
  return (
    <div className='rounded-[8px] border border-gray-200 bg-white'>
      <div className='border-b border-gray-100 px-3 py-2'>
        <h3 className='text-neutral-1600 text-sm font-semibold'>{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {head}
            <TableHead>Reassigned to</TableHead>
            <TableHead className='w-28' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.cells}
              <TableCell>
                <TargetCell record={row.record} />
              </TableCell>
              <TableCell className='text-right'>
                {row.record === null && (
                  <Button variant='outline' size='sm' onClick={row.onReassign}>
                    Reassign
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ── Reassign dialog — Effective From + Dept → Position → Employee ───── */

function ReassignDialog({
  pending,
  onClose,
  onConfirm,
}: {
  pending: PendingReassign | null
  onClose: () => void
  onConfirm: (target: ReassignTarget) => void
}) {
  const [effectiveFrom, setEffectiveFrom] = useState(REASSIGNMENT_TODAY)
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [employee, setEmployee] = useState('')

  const positions = department ? (REASSIGN_POSITIONS[department] ?? []) : []
  const employees = position ? (REASSIGN_EMPLOYEES[position] ?? []) : []

  const reset = () => {
    setEffectiveFrom(REASSIGNMENT_TODAY)
    setDepartment('')
    setPosition('')
    setEmployee('')
  }

  const submit = () => {
    if (!effectiveFrom || !department || !position || !employee) return
    onConfirm({ effectiveFrom, department, position, employee })
    reset()
  }

  const typeLabel = pending ? ITEM_TYPE_LABELS[pending.itemType] : ''

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(o) => {
        if (!o) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            Reassign {typeLabel.toLowerCase()}
            {pending && pending.items.length > 1
              ? `s (${pending.items.length})`
              : ''}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          {pending && (
            <ul className='rounded-md bg-neutral-200 px-2 py-1.5 text-sm'>
              {pending.items.map((i) => (
                <li key={i.id} className='font-medium'>
                  {i.label}
                </li>
              ))}
            </ul>
          )}
          <div className='space-y-1'>
            <Label>Effective from</Label>
            <Input
              type='date'
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Department</Label>
            <Select
              value={department}
              onValueChange={(v) => {
                setDepartment(v)
                setPosition('')
                setEmployee('')
              }}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select department' />
              </SelectTrigger>
              <SelectContent>
                {REASSIGN_DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Position</Label>
            <Select
              value={position}
              onValueChange={(v) => {
                setPosition(v)
                setEmployee('')
              }}
              disabled={!department}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select position' />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Employee</Label>
            <Select
              value={employee}
              onValueChange={setEmployee}
              disabled={!position}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select employee' />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className='text-neutral-1000 text-xs'>
            The selected employee will be notified by email about the new
            assignment.
          </p>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!effectiveFrom || !department || !position || !employee}
          >
            Confirm reassignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
