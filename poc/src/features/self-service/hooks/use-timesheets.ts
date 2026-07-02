import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedTimesheets,
  type Timesheet,
  type TimesheetEntry,
} from '../data/timesheets'

export type TimesheetEntryDraft = Omit<TimesheetEntry, 'id'>

/**
 * In-memory timesheet store (ESS-24/25): weekly entries against
 * client/project/task, submit-for-approval and copy-from-existing.
 */
export function useTimesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>(seedTimesheets)

  const addEntry = useCallback(
    (timesheetId: string, draft: TimesheetEntryDraft) => {
      setTimesheets((prev) =>
        prev.map((ts) =>
          ts.id === timesheetId
            ? {
                ...ts,
                entries: [
                  ...ts.entries,
                  { ...draft, id: `te-${crypto.randomUUID().slice(0, 8)}` },
                ],
              }
            : ts
        )
      )
      toast.success('Timesheet entry saved — total recorded hours updated')
    },
    []
  )

  const removeEntry = useCallback((timesheetId: string, entryId: string) => {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === timesheetId
          ? { ...ts, entries: ts.entries.filter((e) => e.id !== entryId) }
          : ts
      )
    )
    toast.success('Entry removed')
  }, [])

  const submitTimesheet = useCallback((timesheetId: string) => {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === timesheetId ? { ...ts, status: 'Submitted' } : ts
      )
    )
    toast.success('Timesheet submitted and routed to your manager for approval')
  }, [])

  /** Copy all entries from a source period into the target period (ESS-25). */
  const copyFromExisting = useCallback(
    (targetId: string, sourceId: string) => {
      setTimesheets((prev) => {
        const source = prev.find((ts) => ts.id === sourceId)
        if (!source) return prev
        return prev.map((ts) =>
          ts.id === targetId
            ? {
                ...ts,
                entries: [
                  ...ts.entries,
                  ...source.entries.map((e) => ({
                    ...e,
                    id: `te-${crypto.randomUUID().slice(0, 8)}`,
                  })),
                ],
              }
            : ts
        )
      })
      toast.success('Entries copied from the selected period')
    },
    []
  )

  return { timesheets, addEntry, removeEntry, submitTimesheet, copyFromExisting }
}

export type TimesheetStore = ReturnType<typeof useTimesheets>
