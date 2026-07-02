import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAttendanceDays,
  seedAttendanceRequests,
  seedShiftAssignments,
  type AttendanceRequest,
} from '../data/attendance'

export type AttendanceRequestDraft = Omit<
  AttendanceRequest,
  'id' | 'status' | 'raisedOn' | 'task'
>

/**
 * In-memory attendance store: out-time / comp-off / overtime / WFH requests
 * (ESS-18..21), shift assignments (ESS-22) and daily detail (ESS-23).
 */
export function useAttendance() {
  const [requests, setRequests] = useState<AttendanceRequest[]>(
    seedAttendanceRequests
  )
  const [shifts] = useState(seedShiftAssignments)
  const [days] = useState(seedAttendanceDays)

  const addRequest = useCallback((draft: AttendanceRequestDraft) => {
    setRequests((prev) => [
      {
        ...draft,
        id: `ar-${crypto.randomUUID().slice(0, 8)}`,
        status: 'Pending approval',
        raisedOn: new Date().toISOString().slice(0, 10),
        task: null,
      },
      ...prev,
    ])
    toast.success(`${draft.kind} request raised and routed to your approver`)
  }, [])

  const cancelRequest = useCallback((id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Cancelled' } : r))
    )
    toast.success('Request cancelled — it will not be routed further')
  }, [])

  return { requests, shifts, days, addRequest, cancelRequest }
}

export type AttendanceStore = ReturnType<typeof useAttendance>
