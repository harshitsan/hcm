import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  ITEM_TYPE_LABELS,
  REASSIGNMENT_TODAY,
  seedReassignmentRecords,
  seedReassignmentSubjects,
  type ReassignItemType,
  type ReassignmentRecord,
  type ReassignmentSubject,
} from '../data/reassignment'

export interface ReassignTarget {
  effectiveFrom: string
  department: string
  position: string
  employee: string
}

/**
 * In-memory store for exit reassignment — an exiting employee's roles,
 * direct reports and tasks are handed over one by one by the assigned
 * manager. Each hand-over appends a record and "emails" the receiving
 * employee (simulated with a toast).
 */
export function useReassignment() {
  const [subjects] = useState<ReassignmentSubject[]>(seedReassignmentSubjects)
  const [records, setRecords] = useState<ReassignmentRecord[]>(
    seedReassignmentRecords
  )

  /** The completed reassignment for one item, if any (marks it reassigned). */
  const recordFor = useCallback(
    (subjectId: string, itemType: ReassignItemType, itemId: string) =>
      records.find(
        (r) =>
          r.subjectId === subjectId &&
          r.itemType === itemType &&
          r.itemId === itemId
      ) ?? null,
    [records]
  )

  const reassign = useCallback(
    (
      subjectId: string,
      itemType: ReassignItemType,
      itemId: string,
      target: ReassignTarget
    ) => {
      const subject = subjects.find((s) => s.id === subjectId)
      if (!subject) return
      const itemLabel =
        itemType === 'role'
          ? (subject.currentRoles.find((r) => r.id === itemId)?.role ?? '')
          : itemType === 'report'
            ? (subject.directReports.find((r) => r.id === itemId)?.name ?? '')
            : (subject.tasks.find((t) => t.id === itemId)?.task ?? '')
      if (!itemLabel) return

      setRecords((prev) => {
        if (
          prev.some(
            (r) =>
              r.subjectId === subjectId &&
              r.itemType === itemType &&
              r.itemId === itemId
          )
        )
          return prev
        return [
          ...prev,
          {
            id: `rr-${crypto.randomUUID().slice(0, 6)}`,
            subjectId,
            itemType,
            itemId,
            itemLabel,
            effectiveFrom: target.effectiveFrom,
            toDepartment: target.department,
            toPosition: target.position,
            toEmployee: target.employee,
            reassignedOn: REASSIGNMENT_TODAY,
          },
        ]
      })
      toast.success(
        `${ITEM_TYPE_LABELS[itemType]} "${itemLabel}" reassigned to ${target.employee} (w.e.f. ${target.effectiveFrom})`
      )
      toast.info(
        `Email notification sent to ${target.employee} about the new assignment (simulated)`
      )
    },
    [subjects]
  )

  return { subjects, records, recordFor, reassign }
}

export type ReassignmentStore = ReturnType<typeof useReassignment>
