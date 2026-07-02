import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedClearances,
  seedExits,
  seedHrChecklist,
  seedJoinees,
  seedJoiningTasks,
  seedLayoffs,
  type ExitClearance,
  type ExitRecord,
  type ExitStatus,
  type ExitHrItem,
  type JoiningTask,
  type Layoff,
  type LayoffStatus,
  type NewJoinee,
} from '../data/lifecycle'

/**
 * In-memory store for onboarding & exit workflows: new joinees, joining
 * checklist config, exits + FFS, clearances, HR checklist and layoffs.
 */
export function useLifecycle() {
  const [joinees, setJoinees] = useState<NewJoinee[]>(seedJoinees)
  const [joiningTasks, setJoiningTasks] =
    useState<JoiningTask[]>(seedJoiningTasks)
  const [exits, setExits] = useState<ExitRecord[]>(seedExits)
  const [clearances, setClearances] =
    useState<ExitClearance[]>(seedClearances)
  const [hrChecklist, setHrChecklist] =
    useState<ExitHrItem[]>(seedHrChecklist)
  const [layoffs, setLayoffs] = useState<Layoff[]>(seedLayoffs)

  /** EMP-31 — completing a step advances the joinee towards Completed. */
  const completeJoineeTask = useCallback((id: string) => {
    setJoinees((prev) =>
      prev.map((j) => {
        if (j.id !== id || j.status === 'Completed') return j
        const tasksDone = Math.min(j.tasksDone + 1, j.tasksTotal)
        const status = tasksDone >= j.tasksTotal ? 'Completed' : 'In Progress'
        if (status === 'Completed') {
          toast.success(`${j.candidateName} — joining formalities Completed`)
        } else {
          toast.success(
            `Task done (${tasksDone}/${j.tasksTotal}) for ${j.candidateName}`
          )
        }
        return { ...j, tasksDone, status }
      })
    )
  }, [])

  const saveJoiningTask = useCallback(
    (draft: Omit<JoiningTask, 'id'>, id?: string) => {
      if (id) {
        setJoiningTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
        )
        toast.success(`Joining task "${draft.name}" updated`)
      } else {
        setJoiningTasks((prev) => [
          { ...draft, id: `jt-${crypto.randomUUID().slice(0, 6)}` },
          ...prev,
        ])
        toast.success(`Joining task "${draft.name}" added`)
      }
    },
    []
  )

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

  const initiateLayoff = useCallback(
    (draft: Pick<Layoff, 'name' | 'employeesCount'>) => {
      setLayoffs((prev) => [
        {
          ...draft,
          id: `lo-${crypto.randomUUID().slice(0, 6)}`,
          initiatedDate: new Date().toISOString().slice(0, 10),
          initiator: 'You',
          status: 'Pending approval',
        },
        ...prev,
      ])
      toast.success(`Layoff "${draft.name}" initiated — Pending approval`)
    },
    []
  )

  const setLayoffStatus = useCallback((id: string, status: LayoffStatus) => {
    setLayoffs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    )
    toast.success(`Layoff moved to "${status}"`)
  }, [])

  return {
    joinees,
    joiningTasks,
    exits,
    clearances,
    hrChecklist,
    layoffs,
    completeJoineeTask,
    saveJoiningTask,
    setExitStatus,
    submitClearance,
    approveClearance,
    advanceHrChecklist,
    initiateLayoff,
    setLayoffStatus,
  }
}

export type LifecycleStore = ReturnType<typeof useLifecycle>
