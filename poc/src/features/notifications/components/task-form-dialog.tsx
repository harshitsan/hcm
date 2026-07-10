import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, ClipboardList, Plane } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import {
  CURRENT_USER,
  DEPARTMENTS_BY_LOCATION,
  EMPLOYEES,
  LEAVE_DETAILS_BY_EMPLOYEE,
  LOCATIONS,
  OUT_TIME_OFF_BY_EMPLOYEE,
  type LocationId,
} from '../data/org'
import type { HrTask, TaskType } from '../data/tasks'
import { isOverdue, type TaskFormValues } from '../hooks/use-tasks'

export type TaskFormMode = 'add' | 'edit' | 'reassign'

interface TaskFormDialogProps {
  open: boolean
  mode: TaskFormMode
  /** Task being edited / reassigned; undefined in add mode. */
  task?: HrTask
  pendingTasksOf: (employee: string) => HrTask[]
  onClose: () => void
  onSave: (values: TaskFormValues) => void
}

const TASK_TYPES: TaskType[] = ['Task', 'Approval', 'Review']

const MODE_COPY: Record<TaskFormMode, { title: string; cta: string }> = {
  add: { title: 'Add New Task', cta: 'Save' },
  edit: { title: 'Edit Task', cta: 'Save' },
  reassign: { title: 'Reassign Task', cta: 'Save' },
}

/**
 * Add / Edit / Reassign task form (Kensium General Features — Task Assigned
 * by Me, pointers 1–16): task details, escalation + confidentiality flags,
 * invoke-on / due / remind dates, the location → department → position
 * cascade, and — once an assignee is picked — their leave details,
 * out-time-off requests and pending tasks as context panels.
 */
export function TaskFormDialog({
  open,
  mode,
  task,
  pendingTasksOf,
  onClose,
  onSave,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState('')
  const [comments, setComments] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('Task')
  const [escalationRequired, setEscalationRequired] = useState(false)
  const [escalationLimit, setEscalationLimit] = useState('1')
  const [confidential, setConfidential] = useState(false)
  const [invokeChecked, setInvokeChecked] = useState(false)
  const [invokeOn, setInvokeOn] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [remindDaysBefore, setRemindDaysBefore] = useState('')
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [assignee, setAssignee] = useState('')

  // Re-seed the form each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setComments(task?.comments ?? '')
    setTaskType(task?.taskType ?? 'Task')
    setEscalationRequired(task?.escalationRequired ?? false)
    setEscalationLimit(String(task?.escalationLimit ?? 1))
    setConfidential(task?.confidential ?? false)
    setInvokeChecked(Boolean(task?.invokeOn))
    setInvokeOn(task?.invokeOn ?? '')
    setDueDate(task?.dueDate ?? '')
    setRemindDaysBefore(
      task?.remindDaysBefore !== undefined ? String(task.remindDaysBefore) : ''
    )
    setLocation(task?.location ?? '')
    setDepartment(task?.department ?? '')
    setPosition(task?.position ?? '')
    // Reassignment must target a new assignee.
    setAssignee(mode === 'reassign' ? '' : (task?.assignee ?? ''))
  }, [open, task, mode])

  const departments = location
    ? (DEPARTMENTS_BY_LOCATION[location as LocationId] ?? [])
    : []
  const positions = department
    ? EMPLOYEES.filter(
        (e) =>
          e.department === department && (!location || e.location === location)
      )
        .map((e) => e.position)
        .filter((p, i, arr) => arr.indexOf(p) === i)
    : []

  const eligibleEmployees = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) =>
          e.name !== CURRENT_USER &&
          (!location || e.location === location) &&
          (!department || e.department === department) &&
          (!position || e.position === position) &&
          (mode !== 'reassign' || e.name !== task?.assignee)
      ),
    [location, department, position, mode, task]
  )

  const assigneePending = assignee ? pendingTasksOf(assignee) : []
  const assigneeLeaves = assignee
    ? (LEAVE_DETAILS_BY_EMPLOYEE[assignee] ?? [])
    : []
  const assigneeOutTime = assignee
    ? (OUT_TIME_OFF_BY_EMPLOYEE[assignee] ?? [])
    : []

  const handleSave = () => {
    if (!title.trim()) return void toast.error('Enter the task name.')
    if (!dueDate) return void toast.error('Specify the due date for the task.')
    if (invokeChecked && !invokeOn)
      return void toast.error('Specify the date to invoke the task on.')
    if (!assignee)
      return void toast.error(
        mode === 'reassign'
          ? 'Select the new employee to reassign the task to.'
          : 'Select the employee to assign the task to.'
      )
    onSave({
      title: title.trim(),
      comments: comments.trim(),
      taskType,
      escalationRequired,
      escalationLimit: escalationRequired ? Number(escalationLimit) : undefined,
      confidential,
      invokeOn: invokeChecked ? invokeOn : undefined,
      dueDate,
      remindDaysBefore: remindDaysBefore
        ? Number(remindDaysBefore)
        : undefined,
      location: location || undefined,
      department: department || undefined,
      position: position || undefined,
      assignee,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{MODE_COPY[mode].title}</DialogTitle>
          <DialogDescription>
            {mode === 'reassign'
              ? `Reassigning "${task?.title}" from ${task?.assignee}. Fill in the details and save to reassign the task.`
              : 'Fill in the details and click Save to assign the task. The assignee is notified on the dashboard and by email.'}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4'>
          <div className='grid gap-1.5'>
            <Label htmlFor='task-name'>Task *</Label>
            <Input
              id='task-name'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Enter the task name'
            />
          </div>

          <div className='grid gap-1.5'>
            <Label htmlFor='task-comments'>Comments</Label>
            <Textarea
              id='task-comments'
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder='Enter a brief description of the task with comments'
              rows={3}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-1.5'>
              <Label>Task type</Label>
              <Select
                value={taskType}
                onValueChange={(v) => setTaskType(v as TaskType)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='task-due'>Due date *</Label>
              <Input
                id='task-due'
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className='grid gap-3 rounded-[8px] border border-gray-200 bg-white p-3'>
            <div className='flex items-start gap-2'>
              <Checkbox
                id='task-escalation'
                variant='blue'
                checked={escalationRequired}
                onCheckedChange={(c) => setEscalationRequired(c === true)}
              />
              <div className='grid gap-0.5'>
                <Label htmlFor='task-escalation'>Is escalation required</Label>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Escalates the task up the hierarchy if it is not completed
                  before the due date.
                </p>
              </div>
            </div>
            {escalationRequired && (
              <div className='grid gap-1.5 pl-6'>
                <Label>Escalation limit (levels)</Label>
                <Select value={escalationLimit} onValueChange={setEscalationLimit}>
                  <SelectTrigger className='w-full sm:w-56'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3'].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l} level{l === '1' ? '' : 's'} up the hierarchy
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className='flex items-start gap-2'>
              <Checkbox
                id='task-confidential'
                variant='blue'
                checked={confidential}
                onCheckedChange={(c) => setConfidential(c === true)}
              />
              <div className='grid gap-0.5'>
                <Label htmlFor='task-confidential'>Is confidential</Label>
                <p className='text-paragraph-sm text-neutral-1000'>
                  A confidential task is not shown to others as a pending task —
                  only you and the respective reporting manager can view it.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-2'>
              <Checkbox
                id='task-invoke'
                variant='blue'
                checked={invokeChecked}
                onCheckedChange={(c) => setInvokeChecked(c === true)}
              />
              <div className='grid gap-0.5'>
                <Label htmlFor='task-invoke'>Invoke task on</Label>
                <p className='text-paragraph-sm text-neutral-1000'>
                  Check to invoke the task on a specified date instead of
                  immediately.
                </p>
              </div>
            </div>
            {invokeChecked && (
              <div className='grid gap-1.5 pl-6'>
                <Label htmlFor='task-invoke-date'>Invoke on date</Label>
                <Input
                  id='task-invoke-date'
                  type='date'
                  className='sm:w-56'
                  value={invokeOn}
                  onChange={(e) => setInvokeOn(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className='grid gap-1.5 sm:w-56'>
            <Label htmlFor='task-remind'>Remind days before</Label>
            <Input
              id='task-remind'
              type='number'
              min={0}
              value={remindDaysBefore}
              onChange={(e) => setRemindDaysBefore(e.target.value)}
              placeholder='e.g. 2'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='grid gap-1.5'>
              <Label>Applicable locations</Label>
              <Select
                value={location}
                onValueChange={(v) => {
                  setLocation(v)
                  setDepartment('')
                  setPosition('')
                  setAssignee('')
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select location' />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label>Applicable departments</Label>
              <Select
                value={department}
                onValueChange={(v) => {
                  setDepartment(v)
                  setPosition('')
                  setAssignee('')
                }}
                disabled={!location}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select department' />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label>Applicable positions</Label>
              <Select
                value={position}
                onValueChange={(v) => {
                  setPosition(v)
                  setAssignee('')
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
          </div>

          <div className='grid gap-1.5'>
            <Label>Assign to *</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select the name of the employee' />
              </SelectTrigger>
              <SelectContent>
                {eligibleEmployees.length === 0 && (
                  <div className='text-paragraph-sm text-neutral-1000 px-2 py-1.5'>
                    No employees match the selected cascade.
                  </div>
                )}
                {eligibleEmployees.map((e) => (
                  <SelectItem key={e.id} value={e.name}>
                    {e.name} — {e.position}, {e.department} ({e.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {assignee && (
            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
                <p className='text-neutral-1600 mb-1 flex items-center gap-1.5 text-sm font-medium'>
                  <Plane className='text-blue-1400 size-3.5' />
                  Leave details
                </p>
                {assigneeLeaves.length === 0 ? (
                  <p className='text-paragraph-sm text-neutral-1000'>
                    No leaves during the task duration.
                  </p>
                ) : (
                  assigneeLeaves.map((l) => (
                    <p key={l} className='text-paragraph-sm text-neutral-1000'>
                      {l}
                    </p>
                  ))
                )}
              </div>
              <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
                <p className='text-neutral-1600 mb-1 flex items-center gap-1.5 text-sm font-medium'>
                  <CalendarClock className='text-blue-1400 size-3.5' />
                  Out time request details
                </p>
                {assigneeOutTime.length === 0 ? (
                  <p className='text-paragraph-sm text-neutral-1000'>
                    No out-time-off requests during the task duration.
                  </p>
                ) : (
                  assigneeOutTime.map((o) => (
                    <p key={o} className='text-paragraph-sm text-neutral-1000'>
                      {o}
                    </p>
                  ))
                )}
              </div>
              <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
                <p className='text-neutral-1600 mb-1 flex items-center gap-1.5 text-sm font-medium'>
                  <ClipboardList className='text-blue-1400 size-3.5' />
                  Pending tasks
                </p>
                {assigneePending.length === 0 ? (
                  <p className='text-paragraph-sm text-neutral-1000'>
                    No pending tasks for {assignee}.
                  </p>
                ) : (
                  assigneePending.map((t) => (
                    <p
                      key={t.id}
                      className={`text-paragraph-sm ${isOverdue(t) ? 'text-red-600' : 'text-neutral-1000'}`}
                    >
                      {t.title} · due {t.dueDate}
                      {isOverdue(t) ? ' (overdue)' : ''}
                    </p>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' className='rounded-[6px]' onClick={onClose}>
            Cancel
          </Button>
          <Button className='rounded-[6px]' onClick={handleSave}>
            {MODE_COPY[mode].cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
