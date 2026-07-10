import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CURRENT_USER, TODAY } from '../data/org'
import { seedTasks, type HrTask, type TaskStatus } from '../data/tasks'

export interface TaskFormValues {
  title: string
  comments: string
  taskType: HrTask['taskType']
  escalationRequired: boolean
  escalationLimit?: number
  confidential: boolean
  invokeOn?: string
  dueDate: string
  remindDaysBefore?: number
  location?: string
  department?: string
  position?: string
  assignee: string
}

/** True when a pending task is past its due date vs the fixed POC "today". */
export function isOverdue(task: HrTask): boolean {
  return task.status === 'Pending' && task.dueDate < TODAY
}

/**
 * In-memory task store (Kensium General Features — Tasks): system tasks
 * routed by workflows plus manual tasks with assign / edit / delete /
 * reassign / complete / reopen. `notify` simulates the dashboard + email
 * notification the engine sends to stakeholders on each action.
 */
export function useTasks(
  notify: (title: string, body: string) => void = () => {}
) {
  const [tasks, setTasks] = useState<HrTask[]>(seedTasks)

  /** Tasks assigned TO the signed-in persona (assignee view). */
  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignee === CURRENT_USER),
    [tasks]
  )

  /** Manual tasks the signed-in persona assigned to others. */
  const assignedByMe = useMemo(
    () =>
      tasks.filter(
        (t) => t.assignor === CURRENT_USER && t.assignee !== CURRENT_USER
      ),
    [tasks]
  )

  const pendingCount = useMemo(
    () => myTasks.filter((t) => t.status === 'Pending').length,
    [myTasks]
  )

  /** Pending tasks of a prospective assignee (context panel in the form). */
  const pendingTasksOf = useCallback(
    (employee: string) =>
      tasks.filter(
        (t) =>
          t.assignee === employee && t.status === 'Pending' && !t.confidential
      ),
    [tasks]
  )

  const addTask = useCallback(
    (values: TaskFormValues) => {
      const id = `TSK-${Math.floor(3000 + Math.random() * 900)}`
      const task: HrTask = {
        id,
        ...values,
        source: 'Manual',
        status: 'Pending',
        assignor: CURRENT_USER,
        createdAt: TODAY,
        history: [
          {
            at: TODAY,
            event: `Assigned by ${CURRENT_USER}${values.invokeOn ? ` (invokes on ${values.invokeOn})` : ''}`,
          },
        ],
      }
      setTasks((prev) => [task, ...prev])
      notify(
        `New task assigned: ${values.title}`,
        `${CURRENT_USER} assigned "${values.title}" to ${values.assignee}, due ${values.dueDate}. Delivered on the dashboard and by email.`
      )
      toast.success(
        `Task assigned to ${values.assignee} — dashboard notification and email sent (simulated).`
      )
      return id
    },
    [notify]
  )

  const editTask = useCallback((id: string, values: TaskFormValues) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...values,
              history: [...t.history, { at: TODAY, event: `Edited by ${CURRENT_USER}` }],
            }
          : t
      )
    )
    toast.success('Task updated.')
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    toast.success('Task deleted.')
  }, [])

  /**
   * Reassignment (PDF: Task Reassignment): the original record is frozen with
   * status "Reassigned" and a new pending task is created for the new
   * assignee, linked via reassignedFromId.
   */
  const reassignTask = useCallback(
    (originalId: string, values: TaskFormValues) => {
      const newId = `TSK-${Math.floor(4000 + Math.random() * 900)}`
      setTasks((prev) => {
        const original = prev.find((t) => t.id === originalId)
        if (!original) return prev
        const frozen: HrTask = {
          ...original,
          status: 'Reassigned',
          reassignedTo: values.assignee,
          history: [
            ...original.history,
            { at: TODAY, event: `Reassigned to ${values.assignee} by ${CURRENT_USER}` },
          ],
        }
        const successor: HrTask = {
          id: newId,
          ...values,
          source: original.source,
          status: 'Pending',
          assignor: CURRENT_USER,
          createdAt: TODAY,
          linkedModule: original.linkedModule,
          linkedRecord: original.linkedRecord,
          reassignedFromId: originalId,
          history: [
            { at: TODAY, event: `Created by reassignment from ${original.assignee}` },
          ],
        }
        return [successor, ...prev.map((t) => (t.id === originalId ? frozen : t))]
      })
      notify(
        `Task reassigned: ${values.title}`,
        `${CURRENT_USER} reassigned "${values.title}" to ${values.assignee}, due ${values.dueDate}. Both parties notified on the dashboard and by email.`
      )
      toast.success(
        `Task reassigned to ${values.assignee} — the previous assignee and the new assignee were notified (simulated).`
      )
    },
    [notify]
  )

  /** Mark complete with a comment; stakeholders are notified (PDF: Task Completion). */
  const completeTask = useCallback(
    (id: string, comment: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'Completed' as TaskStatus,
                completedAt: TODAY,
                completionComment: comment,
                history: [
                  ...t.history,
                  { at: TODAY, event: `Marked complete by ${CURRENT_USER} — stakeholders notified` },
                ],
              }
            : t
        )
      )
      const task = tasks.find((t) => t.id === id)
      notify(
        `Task completed: ${task?.title ?? id}`,
        `${CURRENT_USER} marked "${task?.title ?? id}" as complete. Comment: "${comment}". The assignor and stakeholders were notified on the dashboard and by email.`
      )
      toast.success(
        'Task marked complete — the assignor and stakeholders were notified (simulated email + dashboard).'
      )
    },
    [notify, tasks]
  )

  /** Reopen a completed task (PDF: option to reopen the task). */
  const reopenTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'Pending' as TaskStatus,
                completedAt: undefined,
                completionComment: undefined,
                history: [
                  ...t.history,
                  { at: TODAY, event: `Reopened by ${CURRENT_USER}` },
                ],
              }
            : t
        )
      )
      const task = tasks.find((t) => t.id === id)
      notify(
        `Task reopened: ${task?.title ?? id}`,
        `${CURRENT_USER} reopened "${task?.title ?? id}". The assignee was notified on the dashboard and by email.`
      )
      toast.success('Task reopened — the assignee was notified (simulated).')
    },
    [notify, tasks]
  )

  return {
    tasks,
    myTasks,
    assignedByMe,
    pendingCount,
    pendingTasksOf,
    addTask,
    editTask,
    deleteTask,
    reassignTask,
    completeTask,
    reopenTask,
  }
}
