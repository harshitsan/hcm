import { useMemo, useState } from 'react'
import {
  ArrowDownUp,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  UserRoundPen,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleGate } from '@/context/role-context'
import type { HrTask, TaskStatus } from '../data/tasks'
import { isOverdue, type TaskFormValues } from '../hooks/use-tasks'
import { TaskFormDialog, type TaskFormMode } from './task-form-dialog'

interface AssignedByMeTabProps {
  assignedByMe: HrTask[]
  pendingTasksOf: (employee: string) => HrTask[]
  addTask: (values: TaskFormValues) => void
  editTask: (id: string, values: TaskFormValues) => void
  deleteTask: (id: string) => void
  reassignTask: (id: string, values: TaskFormValues) => void
  reopenTask: (id: string) => void
}

type Filter = 'All' | TaskStatus

const statusVariant: Record<TaskStatus, 'pending' | 'completed' | 'overdue'> = {
  Pending: 'pending',
  Completed: 'completed',
  Reassigned: 'overdue',
}

/**
 * Task Assigned by Me (Kensium General Features — Manual tasks / Task
 * Reassignment): create manual tasks with the full field set, track them,
 * and Edit / Delete / Reassign / Reopen. Confidential tasks stay visible
 * here (assignor + reporting manager only) but never appear in the
 * assignee's pending list.
 */
export function AssignedByMeTab({
  assignedByMe,
  pendingTasksOf,
  addTask,
  editTask,
  deleteTask,
  reassignTask,
  reopenTask,
}: AssignedByMeTabProps) {
  const [filter, setFilter] = useState<Filter>('All')
  const [sortAsc, setSortAsc] = useState(true)
  const [dialog, setDialog] = useState<{
    mode: TaskFormMode
    task?: HrTask
  } | null>(null)

  const visible = useMemo(
    () =>
      assignedByMe
        .filter((t) => filter === 'All' || t.status === filter)
        .sort((a, b) =>
          sortAsc
            ? a.dueDate.localeCompare(b.dueDate)
            : b.dueDate.localeCompare(a.dueDate)
        ),
    [assignedByMe, filter, sortAsc]
  )

  const handleSave = (values: TaskFormValues) => {
    if (!dialog) return
    if (dialog.mode === 'add') addTask(values)
    else if (dialog.mode === 'edit' && dialog.task)
      editTask(dialog.task.id, values)
    else if (dialog.mode === 'reassign' && dialog.task)
      reassignTask(dialog.task.id, values)
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
          <CardContent className='text-neutral-1000 px-4 text-sm'>
            As an Employee (Non-User) you have no HRMS application access and
            cannot assign tasks. Please reach out to your reporting manager.
          </CardContent>
        </Card>
      }
    >
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          {(['All', 'Pending', 'Completed', 'Reassigned'] as Filter[]).map(
            (f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                className='h-7 rounded-[6px] px-2'
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            )
          )}
          <Button
            variant='outline'
            className='h-7 gap-1 rounded-[6px] px-2'
            onClick={() => setSortAsc((v) => !v)}
          >
            <ArrowDownUp className='size-3.5' />
            Due date {sortAsc ? '(earliest first)' : '(latest first)'}
          </Button>
        </div>
        <Button
          className='h-7 gap-1 rounded-[6px] px-2'
          onClick={() => setDialog({ mode: 'add' })}
        >
          <Plus className='size-3.5' />
          Add New Task
        </Button>
      </div>

      <div className='space-y-2'>
        {visible.length === 0 && (
          <Card className='rounded-[8px] border border-gray-200 bg-white py-6'>
            <CardContent className='text-neutral-1000 text-center text-sm'>
              No tasks match the current filter. Use “Add New Task” to assign
              one.
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
              <CardHeader className='px-4 py-0'>
                <CardTitle className='flex flex-wrap items-center gap-2 text-sm font-medium'>
                  <span className={overdue ? 'text-red-700' : 'text-neutral-1600'}>
                    {t.title}
                  </span>
                  <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                  {overdue && <Badge variant='dropped'>Overdue</Badge>}
                  {t.confidential && (
                    <Badge variant='badge_inactive'>
                      <EyeOff className='mr-1 size-3' />
                      Confidential
                    </Badge>
                  )}
                  {t.escalationRequired && (
                    <Badge variant='overdue'>
                      Escalates · {t.escalationLimit ?? 1} level
                      {(t.escalationLimit ?? 1) === 1 ? '' : 's'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className='flex items-start justify-between gap-3 px-4'>
                <div>
                  <p className='text-paragraph-sm text-neutral-1000'>
                    {t.comments}
                  </p>
                  <p
                    className={`text-paragraph-sm mt-0.5 ${overdue ? 'text-red-600' : 'text-neutral-1000'}`}
                  >
                    Assigned to {t.assignee}
                    {t.position ? ` (${t.position}, ${t.department} — ${t.location})` : ''}{' '}
                    · Due {t.dueDate}
                    {overdue ? ' — overdue' : ''}
                    {t.invokeOn ? ` · Invokes on ${t.invokeOn}` : ''}
                    {t.remindDaysBefore !== undefined
                      ? ` · Reminder ${t.remindDaysBefore} day(s) before`
                      : ''}
                  </p>
                  {t.confidential && (
                    <p className='text-paragraph-sm text-neutral-1000 mt-0.5 italic'>
                      Hidden from the assignee’s pending list — visible only to
                      you and the reporting manager.
                    </p>
                  )}
                  {t.status === 'Completed' && t.completionComment && (
                    <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                      Completed {t.completedAt} — “{t.completionComment}”
                    </p>
                  )}
                  {t.status === 'Reassigned' && t.reassignedTo && (
                    <p className='text-paragraph-sm text-neutral-1000 mt-0.5'>
                      Reassigned to {t.reassignedTo}. History:{' '}
                      {t.history.map((h) => `${h.at}: ${h.event}`).join(' → ')}
                    </p>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  {t.status === 'Pending' && (
                    <>
                      <Button
                        variant='outline'
                        className='h-7 gap-1 rounded-[6px] px-2'
                        onClick={() => setDialog({ mode: 'edit', task: t })}
                      >
                        <Pencil className='size-3.5' />
                        Edit
                      </Button>
                      <Button
                        variant='outline'
                        className='h-7 gap-1 rounded-[6px] px-2'
                        onClick={() => setDialog({ mode: 'reassign', task: t })}
                      >
                        <UserRoundPen className='size-3.5' />
                        Reassign
                      </Button>
                      <Button
                        variant='outline'
                        className='h-7 gap-1 rounded-[6px] px-2 text-red-600 hover:text-red-700'
                        onClick={() => deleteTask(t.id)}
                      >
                        <Trash2 className='size-3.5' />
                        Delete
                      </Button>
                    </>
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

      <TaskFormDialog
        open={dialog !== null}
        mode={dialog?.mode ?? 'add'}
        task={dialog?.task}
        pendingTasksOf={pendingTasksOf}
        onClose={() => setDialog(null)}
        onSave={handleSave}
      />
    </RoleGate>
  )
}
