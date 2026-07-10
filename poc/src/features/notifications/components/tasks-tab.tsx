import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowDownUp,
  CheckCircle2,
  ExternalLink,
  Mail,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RoleGate } from '@/context/role-context'
import type { HrTask, TaskModule, TaskStatus } from '../data/tasks'
import { isOverdue } from '../hooks/use-tasks'

interface TasksTabProps {
  myTasks: HrTask[]
  completeTask: (id: string, comment: string) => void
  reopenTask: (id: string) => void
}

const STATUS_FILTERS: TaskStatus[] = ['Pending', 'Completed', 'Reassigned']

const statusVariant: Record<TaskStatus, 'pending' | 'completed' | 'overdue'> = {
  Pending: 'pending',
  Completed: 'completed',
  Reassigned: 'overdue',
}

/** Transaction screens the Initiate action redirects to per module. */
const MODULE_ROUTES: Record<Exclude<TaskModule, 'other'>, string> = {
  leave: '/leave',
  attendance: '/attendance',
  recruitment: '/recruitment',
}

/**
 * Tasks — assignee view (Kensium General Features: Tasks / System Tasks /
 * Task Completion): Pending / Completed / Reassigned filters, sort by date,
 * overdue tasks in red, Initiate redirecting to the transaction screen, and
 * Mark Complete with a comment that notifies stakeholders.
 */
export function TasksTab({ myTasks, completeTask, reopenTask }: TasksTabProps) {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<TaskStatus>('Pending')
  const [sortAsc, setSortAsc] = useState(true)
  const [completing, setCompleting] = useState<HrTask | null>(null)
  const [comment, setComment] = useState('')

  // Confidential tasks are never shown to the employee as pending tasks —
  // they surface only to the assignor and the reporting manager.
  const visible = useMemo(
    () =>
      myTasks
        .filter((t) => !t.confidential && t.status === statusFilter)
        .sort((a, b) =>
          sortAsc
            ? a.dueDate.localeCompare(b.dueDate)
            : b.dueDate.localeCompare(a.dueDate)
        ),
    [myTasks, statusFilter, sortAsc]
  )

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = {
      Pending: 0,
      Completed: 0,
      Reassigned: 0,
    }
    for (const t of myTasks) if (!t.confidential) c[t.status] += 1
    return c
  }, [myTasks])

  const initiate = (task: HrTask) => {
    if (task.linkedModule && task.linkedModule !== 'other') {
      toast.info(
        `Redirecting to the ${task.linkedModule} transaction screen for ${task.linkedRecord ?? task.title}…`
      )
      navigate({ to: MODULE_ROUTES[task.linkedModule] })
    } else {
      toast.info(
        `Redirecting to the transaction screen for ${task.linkedRecord ?? task.title} (demo navigation).`
      )
    }
  }

  const submitCompletion = () => {
    if (!completing) return
    if (!comment.trim()) {
      toast.error('Enter a comment before marking the task complete.')
      return
    }
    completeTask(completing.id, comment.trim())
    setCompleting(null)
    setComment('')
  }

  return (
    <RoleGate
      roles={[
        'Platform Admin',
        'Portfolio Admin',
        'Group Company Admin',
        'Company Admin',
        'Employee (User)',
      ]}
      fallback={
        <Card className='rounded-[8px] border border-gray-200 bg-white py-4'>
          <CardHeader className='px-4'>
            <CardTitle className='text-paragraph-md text-neutral-1600 flex items-center gap-2 font-medium'>
              <Mail className='text-blue-1400 size-4' />
              Tasks are communicated to you by email
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4'>
            <p className='text-paragraph-sm text-neutral-1000'>
              As an Employee (Non-User) you have no HRMS application access.
              Any task assigned to you is communicated by your reporting
              manager and by email — the mandatory, always-on channel.
            </p>
          </CardContent>
        </Card>
      }
    >
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              className='h-7 rounded-[6px] px-2'
              onClick={() => setStatusFilter(s)}
            >
              {s} ({counts[s]})
            </Button>
          ))}
        </div>
        <Button
          variant='outline'
          className='h-7 gap-1 rounded-[6px] px-2'
          onClick={() => setSortAsc((v) => !v)}
        >
          <ArrowDownUp className='size-3.5' />
          Due date {sortAsc ? '(earliest first)' : '(latest first)'}
        </Button>
      </div>

      <div className='space-y-2'>
        {visible.length === 0 && (
          <Card className='rounded-[8px] border border-gray-200 bg-white py-6'>
            <CardContent className='text-neutral-1000 text-center text-sm'>
              No {statusFilter.toLowerCase()} tasks.
            </CardContent>
          </Card>
        )}
        {visible.map((t) => {
          const overdue = isOverdue(t)
          return (
            <Card
              key={t.id}
              className={`gap-1 rounded-[8px] border bg-white py-3 ${overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            >
              <CardContent className='flex items-start justify-between gap-3 px-4'>
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p
                      className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-neutral-1600'}`}
                    >
                      {t.title}
                    </p>
                    <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                    <Badge variant={t.source === 'System' ? 'open' : 'badge_active'}>
                      {t.source === 'System' ? 'System task' : 'Manual task'}
                    </Badge>
                    {overdue && <Badge variant='dropped'>Overdue</Badge>}
                    {t.escalationRequired && (
                      <Badge variant='overdue'>
                        Escalates · {t.escalationLimit ?? 1} level
                        {(t.escalationLimit ?? 1) === 1 ? '' : 's'}
                      </Badge>
                    )}
                  </div>
                  <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                    {t.comments}
                  </p>
                  <p
                    className={`text-paragraph-sm mt-0.5 ${overdue ? 'text-red-600' : 'text-neutral-1000'}`}
                  >
                    Due {t.dueDate}
                    {overdue ? ' — overdue' : ''} · Assigned by {t.assignor} on{' '}
                    {t.createdAt}
                    {t.invokeOn ? ` · Invokes on ${t.invokeOn}` : ''}
                    {t.remindDaysBefore !== undefined
                      ? ` · Reminder ${t.remindDaysBefore} day(s) before`
                      : ''}
                  </p>
                  {t.status === 'Completed' && t.completionComment && (
                    <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                      Completed {t.completedAt} — “{t.completionComment}”
                    </p>
                  )}
                  {t.status === 'Reassigned' && t.reassignedTo && (
                    <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                      Reassigned to {t.reassignedTo} — see history:{' '}
                      {t.history[t.history.length - 1]?.event}
                    </p>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  {t.status === 'Pending' && t.source === 'System' && (
                    <Button
                      variant='outline'
                      className='h-7 gap-1 rounded-[6px] px-2'
                      onClick={() => initiate(t)}
                    >
                      <ExternalLink className='size-3.5' />
                      Initiate
                    </Button>
                  )}
                  {t.status === 'Pending' && (
                    <Button
                      className='h-7 gap-1 rounded-[6px] px-2'
                      onClick={() => {
                        setCompleting(t)
                        setComment('')
                      }}
                    >
                      <CheckCircle2 className='size-3.5' />
                      Mark Complete
                    </Button>
                  )}
                  {t.status === 'Completed' && (
                    <Button
                      variant='outline'
                      className='h-7 gap-1 rounded-[6px] px-2'
                      onClick={() => reopenTask(t.id)}
                    >
                      <RotateCcw className='size-3.5' />
                      Reopen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={completing !== null}
        onOpenChange={(o) => !o && setCompleting(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Mark Complete</DialogTitle>
            <DialogDescription>
              Enter a comment and click Mark Complete. The assignor and
              stakeholders will be notified of the completion.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-1.5'>
            <Label htmlFor='completion-comment'>Comment *</Label>
            <Textarea
              id='completion-comment'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`e.g. Completed "${completing?.title ?? ''}" — details verified.`}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              className='rounded-[6px]'
              onClick={() => setCompleting(null)}
            >
              Cancel
            </Button>
            <Button className='rounded-[6px]' onClick={submitCompletion}>
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGate>
  )
}
