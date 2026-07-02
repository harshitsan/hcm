import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedRoster,
  seedShiftPatterns,
  seedSwaps,
  type RosterAssignment,
  type ShiftPattern,
  type SwapRequest,
} from '../data/shifts'
import { employeeName } from '../data/shared'

export interface ShiftPatternDraft {
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  nightShift: boolean
  effectiveFrom: string
}

export interface RosterDraft {
  employeeId: string
  shiftId: string
  fromDate: string
  toDate: string
}

export interface SwapDraft {
  requesterId: string
  counterpartyId: string
  date: string
  requesterShiftId: string
  counterpartyShiftId: string
  reason: string
}

/**
 * Shift patterns, roster assignments (with conflict detection) and shift-swap
 * approvals (TNA-05/06/14). In-memory only — resets on reload.
 */
export function useShifts(actor: string) {
  const [patterns, setPatterns] = useState<ShiftPattern[]>(seedShiftPatterns)
  const [roster, setRoster] = useState<RosterAssignment[]>(seedRoster)
  const [swaps, setSwaps] = useState<SwapRequest[]>(seedSwaps)

  const shiftName = useCallback(
    (id: string) => patterns.find((p) => p.id === id)?.name ?? id,
    [patterns]
  )

  /** TNA-05/24 — new pattern versions supersede same-name active patterns. */
  const addPattern = useCallback((draft: ShiftPatternDraft) => {
    setPatterns((prev) => {
      const existing = prev.find((p) => p.name === draft.name && p.status === 'active')
      const next: ShiftPattern = {
        ...draft,
        id: `shift-${crypto.randomUUID().slice(0, 6)}`,
        version: existing ? existing.version + 1 : 1,
        status: 'active',
      }
      return [
        next,
        ...prev.map((p) =>
          p.id === existing?.id ? { ...p, status: 'superseded' as const } : p
        ),
      ]
    })
    toast.success(`Shift pattern "${draft.name}" saved (effective ${draft.effectiveFrom})`)
  }, [])

  /** TNA-05 — roster assignment with overlap conflict detection. */
  const assignRoster = useCallback(
    (draft: RosterDraft) => {
      const overlap = roster.find(
        (r) =>
          r.employeeId === draft.employeeId &&
          r.status !== 'cancelled' &&
          r.status !== 'rejected' &&
          draft.fromDate <= r.toDate &&
          draft.toDate >= r.fromDate
      )
      const assignment: RosterAssignment = {
        ...draft,
        id: `ros-${crypto.randomUUID().slice(0, 6)}`,
        assignedBy: actor,
        assignedOn: new Date().toISOString().slice(0, 10),
        status: overlap ? 'pending-approval' : 'approved',
        conflict: overlap
          ? `Overlaps ${shiftName(overlap.shiftId)} assignment (${overlap.fromDate} → ${overlap.toDate})`
          : null,
      }
      setRoster((prev) => [assignment, ...prev])
      if (overlap) {
        toast.warning(
          `Conflict flagged: ${employeeName(draft.employeeId)} already has an overlapping assignment`
        )
      } else {
        toast.success(`${employeeName(draft.employeeId)} scheduled to ${shiftName(draft.shiftId)}`)
      }
    },
    [actor, roster, shiftName]
  )

  const cancelAssignment = useCallback((id: string) => {
    setRoster((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    )
    toast.success('Roster assignment cancelled — updated schedule visible to the employee')
  }, [])

  /** TNA-06 — employee-side swap request, routed through the workflow. */
  const requestSwap = useCallback((draft: SwapDraft) => {
    const swap: SwapRequest = {
      ...draft,
      id: `swap-${crypto.randomUUID().slice(0, 6)}`,
      status: 'pending',
      warning: null,
      decidedBy: null,
      decisionNote: null,
      submittedOn: new Date().toISOString().slice(0, 10),
    }
    setSwaps((prev) => [swap, ...prev])
    toast.success(
      `Swap request sent to the Roster Owner — ${employeeName(draft.counterpartyId)} has been notified`
    )
  }, [])

  /** TNA-14 — approving a swap updates the roster for both employees. */
  const decideSwap = useCallback(
    (id: string, approve: boolean, note: string) => {
      const swap = swaps.find((s) => s.id === id)
      if (!swap) return
      setSwaps((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: approve ? 'approved' : 'rejected', decidedBy: actor, decisionNote: note }
            : s
        )
      )
      if (approve) {
        setRoster((prev) => [
          {
            id: `ros-${crypto.randomUUID().slice(0, 6)}`,
            employeeId: swap.requesterId,
            shiftId: swap.counterpartyShiftId,
            fromDate: swap.date,
            toDate: swap.date,
            assignedBy: `${actor} (swap)`,
            assignedOn: new Date().toISOString().slice(0, 10),
            status: 'approved',
            conflict: null,
          },
          {
            id: `ros-${crypto.randomUUID().slice(0, 6)}`,
            employeeId: swap.counterpartyId,
            shiftId: swap.requesterShiftId,
            fromDate: swap.date,
            toDate: swap.date,
            assignedBy: `${actor} (swap)`,
            assignedOn: new Date().toISOString().slice(0, 10),
            status: 'approved',
            conflict: null,
          },
          ...prev,
        ])
        toast.success('Swap approved — roster updated for both employees and both notified')
      } else {
        toast.success('Swap rejected — original roster unchanged, requester notified with the reason')
      }
    },
    [actor, swaps]
  )

  return {
    patterns,
    roster,
    swaps,
    shiftName,
    addPattern,
    assignRoster,
    cancelAssignment,
    requestSwap,
    decideSwap,
  }
}

export type ShiftsStore = ReturnType<typeof useShifts>
