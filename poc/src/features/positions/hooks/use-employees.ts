import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAssignmentHistory,
  seedEmployees,
  type AssignmentHistoryEntry,
  type Employee,
} from '../data/employees'

export type EmployeesStore = ReturnType<typeof useEmployees>

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function now(): string {
  return `${today()} ${new Date().toTimeString().slice(0, 5)}`
}

/**
 * In-memory employee assignment store. Position assignments are
 * effective-dated: re-assigning closes the open history entry and opens a
 * new one, so the past org state stays reconstructible (POS-03/12/15).
 */
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees)
  const [assignmentHistory, setAssignmentHistory] = useState<
    AssignmentHistoryEntry[]
  >(seedAssignmentHistory)

  /** Replaces any prior position — exactly one at a time (POS-03/11/17). */
  const assignPosition = useCallback(
    (employeeId: string, positionId: string, positionLabel: string) => {
      setEmployees((prev) => {
        const emp = prev.find((e) => e.id === employeeId)
        if (!emp) return prev
        setAssignmentHistory((h) => [
          {
            id: `ah-${crypto.randomUUID().slice(0, 8)}`,
            companyId: emp.companyId,
            employeeId,
            positionId,
            positionLabel,
            effectiveFrom: today(),
            effectiveTo: null,
            recordedAt: now(),
          },
          // Close the previously open entry rather than overwrite it.
          ...h.map((entry) =>
            entry.employeeId === employeeId && entry.effectiveTo === null
              ? { ...entry, effectiveTo: today() }
              : entry
          ),
        ])
        return prev.map((e) =>
          e.id === employeeId ? { ...e, positionId } : e
        )
      })
      toast.success('Position assigned — previous assignment replaced and historized')
    },
    []
  )

  const assignClass = useCallback((employeeId: string, classId: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, classId } : e))
    )
    toast.success('Employee classification assigned')
  }, [])

  const assignProjectRole = useCallback(
    (employeeId: string, projectId: string, roleId: string) => {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId
            ? { ...e, projectAssignment: { projectId, roleId } }
            : e
        )
      )
      toast.success('Project role assignment updated')
    },
    []
  )

  /** Non-user → user upgrade keeps the single position intact (POS-17). */
  const provisionLogin = useCallback((employeeId: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId ? { ...e, type: 'user' as const } : e
      )
    )
    toast.success('Login provisioned — existing position assignment preserved')
  }, [])

  /** Onboarding completion creates the hire holding the target position (POS-04/18). */
  const addEmployeeFromHire = useCallback(
    (args: {
      companyId: string
      code: string
      name: string
      positionId: string
      positionLabel: string
    }) => {
      const employee: Employee = {
        id: `emp-${crypto.randomUUID().slice(0, 8)}`,
        companyId: args.companyId,
        code: args.code,
        name: args.name,
        type: 'user',
        positionId: args.positionId,
        classId: null,
        projectAssignment: null,
        lastRating: null,
      }
      setEmployees((prev) => [employee, ...prev])
      setAssignmentHistory((h) => [
        {
          id: `ah-${crypto.randomUUID().slice(0, 8)}`,
          companyId: args.companyId,
          employeeId: employee.id,
          positionId: args.positionId,
          positionLabel: args.positionLabel,
          effectiveFrom: today(),
          effectiveTo: null,
          recordedAt: now(),
        },
        ...h,
      ])
      toast.success(`${args.name} onboarded into ${args.positionLabel}`)
      return employee
    },
    []
  )

  /** Records the aggregate appraisal rating for a project role (POS-41). */
  const recordAppraisal = useCallback((employeeId: string, rating: number) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId ? { ...e, lastRating: rating } : e
      )
    )
    toast.success(`Appraisal submitted — aggregate rating ${rating.toFixed(1)}/5`)
  }, [])

  return {
    employees,
    assignmentHistory,
    assignPosition,
    assignClass,
    assignProjectRole,
    provisionLogin,
    addEmployeeFromHire,
    recordAppraisal,
  }
}
