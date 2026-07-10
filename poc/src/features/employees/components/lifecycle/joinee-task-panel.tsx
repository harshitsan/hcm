import { useState } from 'react'
import { ArrowBendUpRight, CalendarBlank } from 'phosphor-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useRole, type Role } from '@/context/role-context'
import {
  ASSIGNEE_DIRECTORY,
  LIFECYCLE_ACTORS,
  getEscalation,
  type JoineeChecklistTask,
  type NewJoinee,
} from '../../data/lifecycle'
import { type LifecycleStore } from '../../hooks/use-lifecycle'

/** Admin roles that act as onboarding coordinators (same gate as the tabs). */
const COORDINATOR_ROLES: Role[] = ['Company Admin']

interface JoineeTaskPanelProps {
  joinee: NewJoinee
  store: LifecycleStore
}

/**
 * EMP-31 — per-joinee joining-checklist task list with granular actions:
 * mark complete (assignee), complete on behalf / reassign / reschedule
 * (coordinator), plus overdue & escalation indicators vs the fixed "today".
 */
export function JoineeTaskPanel({ joinee, store }: JoineeTaskPanelProps) {
  const { role } = useRole()
  const isCoordinator = COORDINATOR_ROLES.includes(role)
  const actor = LIFECYCLE_ACTORS[role] ?? role

  const [completing, setCompleting] = useState<{
    task: JoineeChecklistTask
    onBehalf: boolean
  } | null>(null)
  const [reassigning, setReassigning] = useState<JoineeChecklistTask | null>(
    null
  )
  const [scheduling, setScheduling] = useState<JoineeChecklistTask | null>(
    null
  )

  const tasks = store.joineeTasks.filter(
    (t) =>
      t.joineeId === joinee.id &&
      // Coordinator sees everything; others only see tasks that are not
      // restricted, or restricted tasks assigned to them.
      (isCoordinator || !t.visibleOnlyToAssignee || t.assignee === actor)
  )

  if (tasks.length === 0) {
    return (
      <p className='text-paragraph-sm text-neutral-1000 px-3 py-2'>
        No checklist tasks are visible to you for this joinee.
      </p>
    )
  }

  return (
    <div className='space-y-1.5'>
      <p className='text-paragraph-sm text-neutral-1000'>
        Joining checklist for{' '}
        <span className='text-neutral-1600 font-medium'>
          {joinee.candidateName}
        </span>{' '}
        — dates auto-derived from DOJ {joinee.dateOfJoining}
      </p>
      <div className='divide-y divide-gray-100 rounded-md border border-gray-200 bg-white'>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            actor={actor}
            isCoordinator={isCoordinator}
            onComplete={(onBehalf) => setCompleting({ task, onBehalf })}
            onReassign={() => setReassigning(task)}
            onSchedule={() => setScheduling(task)}
          />
        ))}
      </div>

      {completing && (
        <CompleteTaskDialog
          task={completing.task}
          onBehalf={completing.onBehalf}
          onClose={() => setCompleting(null)}
          onSubmit={(comments) => {
            store.completeChecklistTask(completing.task.id, {
              comments,
              actor,
              onBehalf: completing.onBehalf,
            })
            setCompleting(null)
          }}
        />
      )}
      {reassigning && (
        <ReassignTaskDialog
          task={reassigning}
          onClose={() => setReassigning(null)}
          onSubmit={(to, comment) => {
            store.reassignChecklistTask(reassigning.id, {
              to,
              comment,
              by: actor,
            })
            setReassigning(null)
          }}
        />
      )}
      {scheduling && (
        <ScheduleTaskDialog
          task={scheduling}
          onClose={() => setScheduling(null)}
          onSubmit={(startDate, dueDate) => {
            store.updateChecklistSchedule(scheduling.id, {
              startDate,
              dueDate,
            })
            setScheduling(null)
          }}
        />
      )}
    </div>
  )
}

/* ── Task row ────────────────────────────────────────────────────────── */

function TaskRow({
  task,
  actor,
  isCoordinator,
  onComplete,
  onReassign,
  onSchedule,
}: {
  task: JoineeChecklistTask
  actor: string
  isCoordinator: boolean
  onComplete: (onBehalf: boolean) => void
  onReassign: () => void
  onSchedule: () => void
}) {
  const escalation = getEscalation(task)
  const isAssignee = task.assignee === actor
  const pending = task.status === 'pending'

  return (
    <div className='flex flex-wrap items-start justify-between gap-3 px-3 py-2.5'>
      <div className='min-w-[220px] flex-1 space-y-0.5'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-neutral-1600 text-sm font-medium'>
            {task.name}
          </span>
          {task.status === 'completed' ? (
            <Badge variant='completed'>Completed</Badge>
          ) : escalation.state === 'escalated' ? (
            <Badge variant='dropped'>Escalated</Badge>
          ) : escalation.state === 'overdue' ? (
            <Badge variant='overdue'>Overdue</Badge>
          ) : (
            <Badge variant='pending'>Pending</Badge>
          )}
          {task.visibleOnlyToAssignee && (
            <Badge variant='badge_inactive'>Assignee only</Badge>
          )}
        </div>
        <p className='text-neutral-1000 text-xs'>{task.description}</p>
        <p className='text-neutral-1000 text-xs'>
          Assignee:{' '}
          <span className='text-neutral-1600 font-medium'>
            {task.assignee}
          </span>{' '}
          ({task.performedByLabel})
          {isAssignee && pending && ' — assigned to you'}
        </p>
        {task.reassignments.map((r) => (
          <p key={r.id} className='text-neutral-1000 text-xs'>
            <ArrowBendUpRight size={11} className='mr-0.5 inline' />
            Reassigned {r.from} → {r.to} by {r.by} on {r.date}
            {r.comment ? ` — “${r.comment}”` : ''}
          </p>
        ))}
        {task.status === 'completed' ? (
          <p className='text-xs text-green-1300'>
            Completed on {task.completedOn} by {task.completedBy}
            {task.completionComments ? ` — “${task.completionComments}”` : ''}
          </p>
        ) : escalation.state === 'escalated' ? (
          <p className='text-red-1400 text-xs'>
            Escalated to coordinator after {task.escalationDays} day
            {task.escalationDays === 1 ? '' : 's'} past due (
            {escalation.daysOverdue} days overdue).
          </p>
        ) : escalation.state === 'overdue' ? (
          <p className='text-vanilla-500 text-xs'>
            Overdue by {escalation.daysOverdue} day
            {escalation.daysOverdue === 1 ? '' : 's'} — escalates to
            coordinator after {task.escalationDays}.
          </p>
        ) : null}
      </div>
      <div className='text-right'>
        <p className='text-neutral-1000 text-xs'>
          Start {task.startDate} · Due{' '}
          <span className='text-neutral-1600 font-medium'>{task.dueDate}</span>
        </p>
        {pending && (
          <div className='mt-1.5 flex flex-wrap justify-end gap-1.5'>
            {isAssignee && (
              <Button size='sm' onClick={() => onComplete(false)}>
                Mark complete
              </Button>
            )}
            {isCoordinator && !isAssignee && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onComplete(true)}
              >
                Complete on behalf
              </Button>
            )}
            {isCoordinator && (
              <>
                <Button variant='outline' size='sm' onClick={onReassign}>
                  Reassign
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onSchedule}
                  aria-label={`Edit schedule for ${task.name}`}
                >
                  <CalendarBlank size={12} weight='bold' />
                  Edit dates
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Dialogs ─────────────────────────────────────────────────────────── */

function CompleteTaskDialog({
  task,
  onBehalf,
  onClose,
  onSubmit,
}: {
  task: JoineeChecklistTask
  onBehalf: boolean
  onClose: () => void
  onSubmit: (comments: string) => void
}) {
  const [comments, setComments] = useState('')
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>
            {onBehalf ? 'Complete on behalf' : 'Mark task complete'}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <p className='text-paragraph-sm text-neutral-1000'>
            “{task.name}”
            {onBehalf && (
              <>
                {' '}
                — completing on behalf of{' '}
                <span className='text-neutral-1600 font-medium'>
                  {task.assignee}
                </span>
              </>
            )}
          </p>
          <div className='space-y-1'>
            <Label>Completion comments</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder='e.g. Badge handed over at the front desk'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(comments.trim())}>
            Mark complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReassignTaskDialog({
  task,
  onClose,
  onSubmit,
}: {
  task: JoineeChecklistTask
  onClose: () => void
  onSubmit: (to: string, comment: string) => void
}) {
  const [to, setTo] = useState('')
  const [comment, setComment] = useState('')
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Reassign task</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <p className='text-paragraph-sm text-neutral-1000'>
            “{task.name}” — currently assigned to{' '}
            <span className='text-neutral-1600 font-medium'>
              {task.assignee}
            </span>
          </p>
          <div className='space-y-1'>
            <Label>New assignee</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger variant='secondary' className='w-full'>
                <SelectValue placeholder='Select person' />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNEE_DIRECTORY.filter((p) => p !== task.assignee).map(
                  (p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='e.g. Original assignee on leave this week'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!to}
            onClick={() => onSubmit(to, comment.trim())}
          >
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScheduleTaskDialog({
  task,
  onClose,
  onSubmit,
}: {
  task: JoineeChecklistTask
  onClose: () => void
  onSubmit: (startDate: string, dueDate: string) => void
}) {
  const [startDate, setStartDate] = useState(task.startDate)
  const [dueDate, setDueDate] = useState(task.dueDate)
  const valid = startDate && dueDate && startDate <= dueDate
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle>Edit task schedule</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <p className='text-paragraph-sm text-neutral-1000'>
            “{task.name}” — dates were auto-derived from the date of joining.
          </p>
          <div className='space-y-1'>
            <Label>Start date</Label>
            <Input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Due date</Label>
            <Input
              type='date'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={() => onSubmit(startDate, dueDate)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
