import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAllocations,
  seedAssignments,
  seedProjects,
  seedTasks,
  type AssignmentDraft,
  type DayAllocation,
  type LibraryTask,
  type Project,
  type ResourceAssignment,
  type TaskStatus,
} from '../data/projects'

/**
 * In-memory store for the Resource Management surface: Project Master,
 * Task Library, bulk resource assignments and day-wise allocations
 * (BRA / DWRA / EPA / MPA / PM / TL story groups).
 */
export function useProjects() {
  const [projects] = useState<Project[]>(seedProjects)
  const [tasks, setTasks] = useState<LibraryTask[]>(seedTasks)
  const [assignments, setAssignments] =
    useState<ResourceAssignment[]>(seedAssignments)
  const [allocations] = useState<DayAllocation[]>(seedAllocations)

  /** BRA-05 — commit every grid row in a single bulk save. */
  const saveBulkAssignments = useCallback((rows: AssignmentDraft[]) => {
    const savedOn = new Date().toISOString().slice(0, 10)
    setAssignments((prev) => [
      ...rows.map((row) => ({
        ...row,
        id: `ra-${crypto.randomUUID().slice(0, 6)}`,
        savedOn,
      })),
      ...prev,
    ])
    toast.success(
      `${rows.length} resource assignment${rows.length === 1 ? '' : 's'} saved in one commit`
    )
  }, [])

  /** TL-01 — add a task to the library. */
  const addTask = useCallback((draft: Omit<LibraryTask, 'id' | 'status'>) => {
    setTasks((prev) => [
      {
        ...draft,
        id: `tsk-${crypto.randomUUID().slice(0, 6)}`,
        status: 'Active',
      },
      ...prev,
    ])
    toast.success(`Task "${draft.name}" added to the library`)
  }, [])

  /** TL-02 — move a task between Active and Closed lifecycle states. */
  const setTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    toast.success(
      status === 'Closed' ? 'Task closed' : 'Task reopened as active'
    )
  }, [])

  return {
    projects,
    tasks,
    assignments,
    allocations,
    saveBulkAssignments,
    addTask,
    setTaskStatus,
  }
}

export type ProjectsStore = ReturnType<typeof useProjects>
