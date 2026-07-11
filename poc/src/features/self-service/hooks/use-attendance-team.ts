import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAttendanceChangeRequests,
  seedTeamAttendanceRequests,
  type AttendanceChangeRequest,
  type TeamAttendanceRequest,
} from '../data/attendance-team'

/**
 * In-memory store for the manager side of Attendance Tracking (Team
 * Functions): mass approval of team requests, OT/WFH/comp-off review and
 * pending attendance change requests.
 */
export function useAttendanceTeam() {
  const [requests, setRequests] = useState<TeamAttendanceRequest[]>(
    seedTeamAttendanceRequests
  )
  const [changeRequests, setChangeRequests] = useState<
    AttendanceChangeRequest[]
  >(seedAttendanceChangeRequests)

  /** Bulk manager decision used by the Mass Approval grid. */
  const decideRequests = useCallback(
    (ids: string[], decision: 'Approved' | 'Rejected') => {
      if (ids.length === 0) return
      setRequests((prev) =>
        prev.map((r) =>
          ids.includes(r.id) && r.status === 'Pending approval'
            ? { ...r, status: decision }
            : r
        )
      )
      toast.success(
        `${ids.length} request${ids.length === 1 ? '' : 's'} ${decision.toLowerCase()}`
      )
    },
    []
  )

  /** Per-row decision on an employee's attendance change request. */
  const decideChangeRequest = useCallback(
    (id: string, decision: 'Approved' | 'Rejected') => {
      setChangeRequests((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: decision } : c))
      )
      toast.success(
        decision === 'Approved'
          ? 'Change request approved — attendance record updated'
          : 'Change request rejected'
      )
    },
    []
  )

  return { requests, changeRequests, decideRequests, decideChangeRequest }
}

export type AttendanceTeamStore = ReturnType<typeof useAttendanceTeam>
