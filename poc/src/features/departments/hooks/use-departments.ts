import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CURRENT_COMPANY_ID,
  seedDepartments,
  type Department,
} from '../data/departments'
import { seedEmployees, type Employee } from '../data/employees'
import { seedHistory, type HistoryEvent } from '../data/governance'
import { seedShifts, type Shift } from '../data/org-config'

export type DepartmentDraft = Omit<Department, 'id' | 'companyId'>
export type ShiftDraft = Omit<Shift, 'id'>

let deptSeq = 15
let shiftSeq = 31

/**
 * In-memory departments store. Stands in for the real API while the backend
 * is disabled — all mutations touch local React state only and every change
 * is appended to a bitemporal history log (transaction + effective time).
 */
export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>(seedDepartments)
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees)
  const [history, setHistory] = useState<HistoryEvent[]>(seedHistory)
  const [shifts, setShifts] = useState<Shift[]>(seedShifts)

  const logEvent = useCallback(
    (entity: string, action: string, detail: string, effectiveFrom?: string) => {
      const event: HistoryEvent = {
        id: `h-${crypto.randomUUID().slice(0, 8)}`,
        recordedAt: new Date().toISOString(),
        effectiveFrom: effectiveFrom ?? new Date().toISOString().slice(0, 10),
        companyId: CURRENT_COMPANY_ID,
        entity,
        action,
        detail,
      }
      setHistory((prev) => [event, ...prev])
    },
    []
  )

  /* ---------------- lookups ---------------- */

  const deptById = useMemo(() => {
    const map = new Map<string, Department>()
    departments.forEach((d) => map.set(d.id, d))
    return map
  }, [departments])

  const employeeById = useMemo(() => {
    const map = new Map<string, Employee>()
    employees.forEach((e) => map.set(e.id, e))
    return map
  }, [employees])

  const childrenOf = useCallback(
    (id: string) => departments.filter((d) => d.parentId === id),
    [departments]
  )

  const ancestorsOf = useCallback(
    (id: string): Department[] => {
      const chain: Department[] = []
      let current = deptById.get(id)
      while (current?.parentId) {
        const parent = deptById.get(current.parentId)
        if (!parent || chain.some((c) => c.id === parent.id)) break
        chain.push(parent)
        current = parent
      }
      return chain
    },
    [deptById]
  )

  const descendantsOf = useCallback(
    (id: string): Department[] => {
      const out: Department[] = []
      const walk = (parentId: string) => {
        departments
          .filter((d) => d.parentId === parentId)
          .forEach((child) => {
            out.push(child)
            walk(child.id)
          })
      }
      walk(id)
      return out
    },
    [departments]
  )

  const directMembersOf = useCallback(
    (deptId: string) => employees.filter((e) => e.departmentIds.includes(deptId)),
    [employees]
  )

  /** Direct members + members of all descendant departments (roll-up, DEPT-08). */
  const rolledUpMembersOf = useCallback(
    (deptId: string) => {
      const ids = new Set([deptId, ...descendantsOf(deptId).map((d) => d.id)])
      return employees.filter((e) => e.departmentIds.some((id) => ids.has(id)))
    },
    [employees, descendantsOf]
  )

  /* ---------------- department CRUD ---------------- */

  const addDepartment = useCallback(
    (draft: DepartmentDraft) => {
      deptSeq += 1
      const department: Department = {
        ...draft,
        id: `DEP-${String(deptSeq).padStart(4, '0')}`,
        companyId: CURRENT_COMPANY_ID,
      }
      setDepartments((prev) => [department, ...prev])
      logEvent(`${department.id} ${department.name}`, 'created', `Created under ${draft.parentId ?? 'top level'}.`)
      toast.success(`${draft.name} created (${department.id})`)
      if (draft.headId) {
        const head = employeeById.get(draft.headId)
        toast.info(`Notification sent to ${head?.name ?? 'head'} — "Department head assigned" template`)
      }
      return department
    },
    [logEvent, employeeById]
  )

  const updateDepartment = useCallback(
    (id: string, draft: DepartmentDraft): boolean => {
      const existing = deptById.get(id)
      if (!existing) return false
      // Cycle guard: the new parent may not be the department itself or a descendant.
      if (draft.parentId) {
        const invalid = new Set([id, ...descendantsOf(id).map((d) => d.id)])
        if (invalid.has(draft.parentId)) {
          toast.error('Invalid parent — a department cannot be its own ancestor or descendant')
          return false
        }
      }
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...draft } : d)))
      logEvent(`${id} ${draft.name}`, 'updated', 'Prior state retained as history (valid-to closed).')
      if (draft.headId && draft.headId !== existing.headId) {
        const head = employeeById.get(draft.headId)
        logEvent(`${id} ${draft.name}`, 'head changed', `${head?.name ?? draft.headId} designated department head.`)
        toast.info(`Notification sent to ${head?.name ?? 'new head'} — "Department head assigned" template`)
      }
      toast.success(`${draft.name} updated`)
      return true
    },
    [deptById, descendantsOf, logEvent, employeeById]
  )

  /** Reasons a department cannot be deleted yet (DEPT-09). */
  const deleteBlockersFor = useCallback(
    (id: string): string[] => {
      const blockers: string[] = []
      const kids = childrenOf(id)
      if (kids.length > 0) {
        blockers.push(`Has ${kids.length} child department${kids.length > 1 ? 's' : ''} — reassign or delete them first.`)
      }
      const orphaned = directMembersOf(id).filter((e) => e.departmentIds.length === 1)
      if (orphaned.length > 0) {
        blockers.push(`${orphaned.length} employee${orphaned.length > 1 ? 's' : ''} would be left with no department — reassign them first.`)
      }
      return blockers
    },
    [childrenOf, directMembersOf]
  )

  const deleteDepartment = useCallback(
    (id: string) => {
      const dep = deptById.get(id)
      if (!dep) return
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      // Multi-department members simply lose this membership.
      setEmployees((prev) =>
        prev.map((e) =>
          e.departmentIds.includes(id)
            ? { ...e, departmentIds: e.departmentIds.filter((d) => d !== id) }
            : e
        )
      )
      logEvent(`${id} ${dep.name}`, 'deleted', 'Department removed; history retained for audit.')
    },
    [deptById, logEvent]
  )

  const setDepartmentStatus = useCallback(
    (id: string, status: Department['status']): boolean => {
      const dep = deptById.get(id)
      if (!dep) return false
      if (status === 'inactive') {
        const members = directMembersOf(id)
        if (members.length > 0) {
          toast.warning(
            `${dep.name} has ${members.length} active member${members.length > 1 ? 's' : ''} — reassign them before deactivating (at-least-one-department rule)`
          )
          return false
        }
      }
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
      logEvent(`${id} ${dep.name}`, status === 'active' ? 'reactivated' : 'deactivated', `Status set to ${status}.`)
      toast.success(`${dep.name} ${status === 'active' ? 'reactivated' : 'deactivated'}`)
      return true
    },
    [deptById, directMembersOf, logEvent]
  )

  const patchDepartment = useCallback(
    (id: string, patch: Partial<Department>, action: string, detail: string) => {
      const dep = deptById.get(id)
      if (!dep) return
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
      logEvent(`${id} ${dep.name}`, action, detail)
    },
    [deptById, logEvent]
  )

  /* ---------------- membership ---------------- */

  const addMembership = useCallback(
    (employeeId: string, deptId: string) => {
      const emp = employeeById.get(employeeId)
      const dep = deptById.get(deptId)
      if (!emp || !dep || emp.departmentIds.includes(deptId)) return
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId ? { ...e, departmentIds: [...e.departmentIds, deptId] } : e
        )
      )
      logEvent(`${deptId} ${dep.name}`, 'member added', `${emp.name} added to department.`)
      toast.success(`${emp.name} added to ${dep.name}`)
      toast.info('Notification dispatched — "Department membership changed" template')
    },
    [employeeById, deptById, logEvent]
  )

  const removeMembership = useCallback(
    (employeeId: string, deptId: string): boolean => {
      const emp = employeeById.get(employeeId)
      const dep = deptById.get(deptId)
      if (!emp || !dep) return false
      if (emp.departmentIds.length <= 1) {
        toast.error(`${emp.name} must belong to at least one department — add another before removing this one`)
        return false
      }
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId
            ? { ...e, departmentIds: e.departmentIds.filter((d) => d !== deptId) }
            : e
        )
      )
      logEvent(`${deptId} ${dep.name}`, 'member removed', `${emp.name} removed; remaining memberships preserved.`)
      toast.success(`${emp.name} removed from ${dep.name}`)
      return true
    },
    [employeeById, deptById, logEvent]
  )

  const addEmployee = useCallback(
    (name: string, title: string, deptId: string, isPortalUser: boolean) => {
      const dep = deptById.get(deptId)
      if (!dep) return
      const employee: Employee = {
        id: `emp-${crypto.randomUUID().slice(0, 6)}`,
        name,
        title,
        companyId: CURRENT_COMPANY_ID,
        departmentIds: [deptId],
        isPortalUser,
        shiftId: null,
      }
      setEmployees((prev) => [...prev, employee])
      logEvent(`${deptId} ${dep.name}`, 'member added', `${name} onboarded into department.`)
      toast.success(`${name} added with required department ${dep.name}`)
    },
    [deptById, logEvent]
  )

  const refresh = useCallback(() => {
    toast.success('Department list refreshed — showing latest data')
  }, [])

  /* ---------------- shift catalog (SHFT-06/07) ---------------- */

  const addShift = useCallback(
    (draft: ShiftDraft) => {
      shiftSeq += 1
      const shift: Shift = { ...draft, id: `sh-${shiftSeq}` }
      setShifts((prev) => [...prev, shift])
      logEvent(
        `${shift.id} ${shift.name}`,
        'shift created',
        `${draft.startTime}–${draft.endTime} (${draft.durationHours}h), weekly offs: ${draft.weeklyOffs.join(', ') || 'none'}.`
      )
      toast.success(`Shift "${draft.name}" created (${shift.id})`)
    },
    [logEvent]
  )

  const updateShift = useCallback(
    (id: string, draft: ShiftDraft) => {
      setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, ...draft } : s)))
      logEvent(
        `${id} ${draft.name}`,
        'shift updated',
        `Definition saved: ${draft.startTime}–${draft.endTime} (${draft.durationHours}h), weekly offs: ${draft.weeklyOffs.join(', ') || 'none'}.`
      )
      toast.success(
        `Shift "${draft.name}" saved — departments using it see the new times immediately`
      )
    },
    [logEvent]
  )

  /** Reasons a shift cannot be deleted yet (still referenced). */
  const shiftDeleteBlockersFor = useCallback(
    (id: string): string[] => {
      const blockers: string[] = []
      const usedBy = departments.filter(
        (d) => d.shiftIds.includes(id) || d.defaultShiftId === id
      )
      if (usedBy.length > 0) {
        blockers.push(
          `Assigned to ${usedBy.length} department${usedBy.length > 1 ? 's' : ''} (${usedBy.map((d) => d.name).join(', ')}) — unassign it first.`
        )
      }
      const holders = employees.filter((e) => e.shiftId === id)
      if (holders.length > 0) {
        blockers.push(
          `${holders.length} employee${holders.length > 1 ? 's are' : ' is'} specifically assigned to this shift — move them to another shift first.`
        )
      }
      return blockers
    },
    [departments, employees]
  )

  const deleteShift = useCallback(
    (id: string) => {
      const shift = shifts.find((s) => s.id === id)
      if (!shift) return
      setShifts((prev) => prev.filter((s) => s.id !== id))
      logEvent(`${id} ${shift.name}`, 'shift deleted', 'Removed from the shift catalog.')
      toast.success(`Shift "${shift.name}" deleted`)
    },
    [shifts, logEvent]
  )

  const refreshShifts = useCallback(() => {
    toast.success(`Shift list refreshed — ${shifts.length} shifts showing current data`)
  }, [shifts.length])

  return {
    departments,
    employees,
    history,
    shifts,
    deptById,
    employeeById,
    childrenOf,
    ancestorsOf,
    descendantsOf,
    directMembersOf,
    rolledUpMembersOf,
    addDepartment,
    updateDepartment,
    deleteBlockersFor,
    deleteDepartment,
    setDepartmentStatus,
    patchDepartment,
    addMembership,
    removeMembership,
    addEmployee,
    refresh,
    addShift,
    updateShift,
    shiftDeleteBlockersFor,
    deleteShift,
    refreshShifts,
    logEvent,
  }
}

export type DepartmentsStore = ReturnType<typeof useDepartments>
