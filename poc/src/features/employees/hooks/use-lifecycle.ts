import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  LIFECYCLE_TODAY,
  buildTaskInstance,
  seedClearances,
  seedExits,
  seedHrChecklist,
  seedJoineeTasks,
  seedJoinees,
  seedJoiningTasks,
  seedLayoffs,
  type ExitClearance,
  type ExitRecord,
  type ExitStatus,
  type ExitHrItem,
  type JoineeChecklistTask,
  type JoineeStatus,
  type JoiningTask,
  type Layoff,
  type LayoffEmployee,
  type LayoffStatus,
  type NewJoinee,
} from '../data/lifecycle'

/**
 * Initiation payload for a layoff. The original two-field shape is still
 * accepted; the richer fields come from the Initiate Layoff dialog.
 */
export type LayoffDraft = Pick<Layoff, 'name' | 'employeesCount'> &
  Partial<
    Pick<
      Layoff,
      'reason' | 'lwd' | 'salaryDays' | 'employees' | 'documents' | 'comments'
    >
  >

/**
 * In-memory store for onboarding & exit workflows: new joinees, joining
 * checklist config + per-joinee task instances, exits + FFS, clearances,
 * HR checklist and layoffs.
 */
export function useLifecycle() {
  const [joinees, setJoinees] = useState<NewJoinee[]>(seedJoinees)
  const [joiningTasks, setJoiningTasks] =
    useState<JoiningTask[]>(seedJoiningTasks)
  const [joineeTasks, setJoineeTasks] =
    useState<JoineeChecklistTask[]>(seedJoineeTasks)
  const [exits, setExits] = useState<ExitRecord[]>(seedExits)
  const [clearances, setClearances] =
    useState<ExitClearance[]>(seedClearances)
  const [hrChecklist, setHrChecklist] =
    useState<ExitHrItem[]>(seedHrChecklist)
  const [layoffs, setLayoffs] = useState<Layoff[]>(seedLayoffs)

  /** Recompute each joinee's progress + status from its task instances. */
  const syncJoineeProgress = (tasks: JoineeChecklistTask[]) => {
    setJoinees((prev) =>
      prev.map((j) => {
        const mine = tasks.filter((t) => t.joineeId === j.id)
        if (mine.length === 0) return j
        const done = mine.filter((t) => t.status === 'completed').length
        const status: JoineeStatus =
          done >= mine.length
            ? 'Completed'
            : done > 0
              ? 'In Progress'
              : 'Pending initiation'
        return { ...j, tasksDone: done, tasksTotal: mine.length, status }
      })
    )
  }

  /** EMP-31 — mark a checklist task complete (optionally on behalf). */
  const completeChecklistTask = (
    taskId: string,
    opts: { comments: string; actor: string; onBehalf?: boolean }
  ) => {
    const task = joineeTasks.find((t) => t.id === taskId)
    if (!task || task.status === 'completed') return
    const next = joineeTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: 'completed' as const,
            completedOn: LIFECYCLE_TODAY,
            completedBy: opts.actor,
            completionComments: opts.comments,
          }
        : t
    )
    setJoineeTasks(next)
    syncJoineeProgress(next)
    toast.success(
      opts.onBehalf
        ? `"${task.name}" completed on behalf of ${task.assignee}`
        : `"${task.name}" marked complete`
    )
  }

  /** Coordinator action — reassign a task instance, keeping history. */
  const reassignChecklistTask = (
    taskId: string,
    opts: { to: string; comment: string; by: string }
  ) => {
    setJoineeTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assignee: opts.to,
              reassignments: [
                ...t.reassignments,
                {
                  id: `ra-${crypto.randomUUID().slice(0, 6)}`,
                  date: LIFECYCLE_TODAY,
                  from: t.assignee,
                  to: opts.to,
                  by: opts.by,
                  comment: opts.comment,
                },
              ],
            }
          : t
      )
    )
    toast.success(`Task reassigned to ${opts.to}`)
  }

  /** Adjust the auto-derived start/due dates of a task instance. */
  const updateChecklistSchedule = (
    taskId: string,
    dates: { startDate: string; dueDate: string }
  ) => {
    setJoineeTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...dates } : t))
    )
    toast.success('Task schedule updated')
  }

  /**
   * EMP-30 — save a checklist definition. New definitions are also
   * instantiated against every joinee still onboarding at an applicable
   * location.
   */
  const saveJoiningTask = (draft: Omit<JoiningTask, 'id'>, id?: string) => {
    if (id) {
      setJoiningTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
      )
      toast.success(`Joining task "${draft.name}" updated`)
      return
    }
    const task: JoiningTask = {
      ...draft,
      id: `jt-${crypto.randomUUID().slice(0, 6)}`,
    }
    setJoiningTasks((prev) => [task, ...prev])
    const instances = joinees
      .filter(
        (j) =>
          j.status !== 'Completed' &&
          task.applicableLocations.includes(j.location)
      )
      .map((j) => buildTaskInstance(j, task))
    if (instances.length > 0) {
      const next = [...joineeTasks, ...instances]
      setJoineeTasks(next)
      syncJoineeProgress(next)
    }
    toast.success(
      `Joining task "${draft.name}" added — instantiated for ${instances.length} joinee(s)`
    )
  }

  const setExitStatus = useCallback((id: string, status: ExitStatus) => {
    setExits((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    )
    toast.success(`Exit moved to "${status}"`)
  }, [])

  const submitClearance = useCallback((id: string) => {
    setClearances((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'Pending approval' } : c
      )
    )
    toast.success('Clearance submitted — now Pending approval')
  }, [])

  const approveClearance = useCallback((id: string) => {
    setClearances((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Approved' } : c))
    )
    toast.success('Department clearance approved')
  }, [])

  const advanceHrChecklist = useCallback((id: string) => {
    setHrChecklist((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h
        const status =
          h.status === 'Pending for Submission' ? 'Submitted' : 'Completed'
        toast.success(`Exit HR checklist — ${h.employee}: ${status}`)
        return { ...h, status }
      })
    )
  }, [])

  const initiateLayoff = useCallback((draft: LayoffDraft) => {
    setLayoffs((prev) => [
      {
        ...draft,
        id: `lo-${crypto.randomUUID().slice(0, 6)}`,
        initiatedDate: LIFECYCLE_TODAY,
        initiator: 'You',
        status: 'Pending approval',
      },
      ...prev,
    ])
    toast.success(`Layoff "${draft.name}" initiated — Pending approval`)
    toast.info(
      'Reporting managers of affected employees have been notified (approval not required). Employees are NOT notified.'
    )
  }, [])

  /**
   * Approver action. Approving or exiting a layoff cascades the status to
   * every affected (non-revoked) employee so the Exit List stays in sync.
   */
  const setLayoffStatus = useCallback((id: string, status: LayoffStatus) => {
    setLayoffs((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        if (status === 'Approved' || status === 'Exited') {
          return {
            ...l,
            status,
            employees: l.employees?.map((e) =>
              e.status === 'Revoked' ? e : { ...e, status }
            ),
          }
        }
        return { ...l, status }
      })
    )
    toast.success(`Layoff moved to "${status}"`)
  }, [])

  /** Withdraw a layoff — the reason is mandatory and kept on the record. */
  const withdrawLayoff = useCallback((id: string, reason: string) => {
    setLayoffs((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: 'Withdrawn', withdrawReason: reason }
          : l
      )
    )
    toast.success('Layoff withdrawn')
  }, [])

  /** Apply `patch` to one affected employee inside one layoff. */
  const patchLayoffEmployee = useCallback(
    (
      layoffId: string,
      employeeId: string,
      patch: (e: LayoffEmployee) => LayoffEmployee
    ) => {
      setLayoffs((prev) =>
        prev.map((l) =>
          l.id === layoffId
            ? {
                ...l,
                employees: l.employees?.map((e) =>
                  e.id === employeeId ? patch(e) : e
                ),
              }
            : l
        )
      )
    },
    []
  )

  /** Exit-list action — change a laid-off employee's last working day. */
  const changeLayoffEmployeeLwd = useCallback(
    (layoffId: string, employeeId: string, lwd: string) => {
      patchLayoffEmployee(layoffId, employeeId, (e) => ({ ...e, lwd }))
      toast.success(`Last working day changed to ${lwd}`)
    },
    [patchLayoffEmployee]
  )

  /** Exit-list action — append an exit task for a laid-off employee. */
  const addLayoffExitTask = useCallback(
    (
      layoffId: string,
      employeeId: string,
      task: { name: string; assignee: string }
    ) => {
      patchLayoffEmployee(layoffId, employeeId, (e) => ({
        ...e,
        exitTasks: [
          ...e.exitTasks,
          {
            id: `lot-${crypto.randomUUID().slice(0, 6)}`,
            name: task.name,
            assignee: task.assignee,
            addedOn: LIFECYCLE_TODAY,
          },
        ],
      }))
      toast.success(`Exit task "${task.name}" assigned to ${task.assignee}`)
    },
    [patchLayoffEmployee]
  )

  /** Exit-list action — revoke the layoff for one employee, with comment. */
  const revokeLayoffEmployee = useCallback(
    (layoffId: string, employeeId: string, comment: string) => {
      patchLayoffEmployee(layoffId, employeeId, (e) => ({
        ...e,
        status: 'Revoked',
        revokeComment: comment,
      }))
      toast.success('Layoff revoked for the employee')
    },
    [patchLayoffEmployee]
  )

  return {
    joinees,
    joiningTasks,
    joineeTasks,
    exits,
    clearances,
    hrChecklist,
    layoffs,
    completeChecklistTask,
    reassignChecklistTask,
    updateChecklistSchedule,
    saveJoiningTask,
    setExitStatus,
    submitClearance,
    approveClearance,
    advanceHrChecklist,
    initiateLayoff,
    setLayoffStatus,
    withdrawLayoff,
    changeLayoffEmployeeLwd,
    addLayoffExitTask,
    revokeLayoffEmployee,
  }
}

export type LifecycleStore = ReturnType<typeof useLifecycle>
