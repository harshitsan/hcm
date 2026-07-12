import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { publishAuditEvent } from '@/features/audit-logs/data/live-trail'
import {
  resolveAssignmentForDay,
  seedRoster,
  seedShiftPatterns,
  seedSwaps,
  type RosterAssignment,
  type ShiftPattern,
  type SwapRequest,
} from '../data/shifts'
import { employeeName, fmtDate, todayIso } from '../data/shared'

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
 * approvals (TNA-05/06/14). Swaps are NEVER applied directly — they wait
 * Pending until an approver decides, and approving flips both employees'
 * roster for that day. In-memory only — resets on reload.
 */
export function useShifts(actor: string) {
  const [patterns, setPatterns] = useState<ShiftPattern[]>(seedShiftPatterns)
  const [roster, setRoster] = useState<RosterAssignment[]>(seedRoster)
  const [swaps, setSwaps] = useState<SwapRequest[]>(seedSwaps)

  const shiftName = useCallback(
    (id: string) => patterns.find((p) => p.id === id)?.name ?? id,
    [patterns]
  )

  const patternById = useCallback(
    (id: string) => patterns.find((p) => p.id === id) ?? null,
    [patterns]
  )

  /** Which shift pattern an employee works on a given day (roster grid). */
  const shiftForDay = useCallback(
    (employeeId: string, date: string): ShiftPattern | null => {
      const assignment = resolveAssignmentForDay(roster, employeeId, date)
      return assignment ? patternById(assignment.shiftId) : null
    },
    [roster, patternById]
  )

  /** TNA-05/24 — new pattern versions supersede same-name active patterns. */
  const addPattern = useCallback(
    (draft: ShiftPatternDraft) => {
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
      publishAuditEvent({
        module: 'Time & Attendance',
        action: 'Shift pattern saved',
        actor,
        actionType: 'create',
        recordName: `Shift pattern — ${draft.name}`,
        changes: [
          {
            field: 'Timing',
            previousValue: null,
            newValue: `${draft.startTime}–${draft.endTime}${draft.nightShift ? ' (night, ends next day)' : ''}`,
          },
          { field: 'Effective from', previousValue: null, newValue: fmtDate(draft.effectiveFrom) },
        ],
      })
      toast.success(`Shift pattern "${draft.name}" saved (effective ${draft.effectiveFrom})`)
    },
    [actor]
  )

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
        assignedOn: todayIso(),
        status: overlap ? 'pending-approval' : 'approved',
        conflict: overlap
          ? `Overlaps ${shiftName(overlap.shiftId)} assignment (${overlap.fromDate} → ${overlap.toDate})`
          : null,
      }
      setRoster((prev) => [assignment, ...prev])
      publishAuditEvent({
        module: 'Time & Attendance',
        action: 'Roster assignment created',
        actor,
        actionType: 'create',
        recordName: `Roster — ${employeeName(draft.employeeId)}`,
        changes: [
          {
            field: 'Assignment',
            previousValue: null,
            newValue: `${shiftName(draft.shiftId)} · ${fmtDate(draft.fromDate)} → ${fmtDate(draft.toDate)}`,
          },
        ],
      })
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

  /**
   * Roster grid — set (or change) the shift for one employee on one day.
   * Saved as a single-day assignment which takes precedence over any wider
   * range covering the same day.
   */
  const assignDay = useCallback(
    (employeeId: string, date: string, shiftId: string) => {
      const before = resolveAssignmentForDay(roster, employeeId, date)
      const assignment: RosterAssignment = {
        id: `ros-${crypto.randomUUID().slice(0, 6)}`,
        employeeId,
        shiftId,
        fromDate: date,
        toDate: date,
        assignedBy: actor,
        assignedOn: todayIso(),
        status: 'approved',
        conflict: null,
      }
      setRoster((prev) => [assignment, ...prev])
      publishAuditEvent({
        module: 'Time & Attendance',
        action: 'Roster day changed',
        actor,
        recordName: `Roster — ${employeeName(employeeId)}`,
        changes: [
          {
            field: `Shift on ${fmtDate(date)}`,
            previousValue: before ? shiftName(before.shiftId) : 'Unassigned',
            newValue: shiftName(shiftId),
          },
        ],
      })
      toast.success(
        `${employeeName(employeeId)} — ${fmtDate(date)} set to ${shiftName(shiftId)}; the employee sees the updated schedule`
      )
    },
    [actor, roster, shiftName]
  )

  const cancelAssignment = useCallback(
    (id: string) => {
      const target = roster.find((r) => r.id === id)
      setRoster((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
      )
      if (target) {
        publishAuditEvent({
          module: 'Time & Attendance',
          action: 'Roster assignment cancelled',
          actor,
          recordName: `Roster — ${employeeName(target.employeeId)}`,
          changes: [
            {
              field: 'Assignment',
              previousValue: `${shiftName(target.shiftId)} · ${fmtDate(target.fromDate)} → ${fmtDate(target.toDate)}`,
              newValue: 'Cancelled',
            },
          ],
        })
      }
      toast.success('Roster assignment cancelled — updated schedule visible to the employee')
    },
    [actor, roster, shiftName]
  )

  /**
   * TNA-06 — swap request. The roster is NOT touched here: the request sits
   * Pending until an approver decides in Approvals → Swaps & Overtime.
   */
  const requestSwap = useCallback(
    (draft: SwapDraft) => {
      const swap: SwapRequest = {
        ...draft,
        id: `swap-${crypto.randomUUID().slice(0, 6)}`,
        status: 'pending',
        warning: null,
        decidedBy: null,
        decisionNote: null,
        submittedOn: todayIso(),
      }
      setSwaps((prev) => [swap, ...prev])
      publishAuditEvent({
        module: 'Time & Attendance',
        action: 'Shift swap requested',
        actor,
        actionType: 'create',
        recordName: `Shift swap — ${employeeName(draft.requesterId)} ⇄ ${employeeName(draft.counterpartyId)}`,
        changes: [
          {
            field: `Swap on ${fmtDate(draft.date)}`,
            previousValue: null,
            newValue: 'Pending approval — roster unchanged until approved',
          },
        ],
      })
      toast.success(
        `Swap request sent for approval — ${employeeName(draft.counterpartyId)} has been notified; the roster stays unchanged until it is approved`
      )
    },
    [actor]
  )

  /**
   * TNA-14 — approving a swap actually flips the two assignments: each
   * employee gets a single-day assignment with the other's shift for that
   * date, which overrides their standing roster in the grid.
   */
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
            assignedOn: todayIso(),
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
            assignedOn: todayIso(),
            status: 'approved',
            conflict: null,
          },
          ...prev,
        ])
      }
      publishAuditEvent({
        module: 'Time & Attendance',
        action: approve ? 'Shift swap approved' : 'Shift swap rejected',
        actor,
        recordName: `Shift swap — ${employeeName(swap.requesterId)} ⇄ ${employeeName(swap.counterpartyId)}`,
        changes: [
          {
            field: `Swap on ${fmtDate(swap.date)}`,
            previousValue: 'Pending',
            newValue: approve
              ? `Approved — ${employeeName(swap.requesterId)} now works ${shiftName(swap.counterpartyShiftId)}, ${employeeName(swap.counterpartyId)} now works ${shiftName(swap.requesterShiftId)}`
              : `Rejected — ${note || 'no reason given'}`,
          },
        ],
      })
      if (approve) {
        toast.success(
          'Swap approved — the two roster assignments were flipped for that day and both employees notified'
        )
      } else {
        toast.success('Swap rejected — original roster unchanged, requester notified with the reason')
      }
    },
    [actor, swaps, shiftName]
  )

  return {
    patterns,
    roster,
    swaps,
    shiftName,
    patternById,
    shiftForDay,
    addPattern,
    assignRoster,
    assignDay,
    cancelAssignment,
    requestSwap,
    decideSwap,
  }
}

export type ShiftsStore = ReturnType<typeof useShifts>
