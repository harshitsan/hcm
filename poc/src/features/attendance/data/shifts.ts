/**
 * Shift patterns, roster assignments and swap requests (TNA-05/06/14/42).
 * Patterns are versioned + effective-dated so policy changes apply from the
 * right date (TNA-24).
 */

export type ShiftStatus = 'active' | 'draft' | 'superseded'

export interface ShiftPattern {
  id: string
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  nightShift: boolean
  version: number
  effectiveFrom: string
  status: ShiftStatus
}

export type AssignmentStatus =
  | 'pending-approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export interface RosterAssignment {
  id: string
  employeeId: string
  shiftId: string
  fromDate: string
  toDate: string
  assignedBy: string
  assignedOn: string
  status: AssignmentStatus
  /** Set when saving detected an overlapping assignment (TNA-05). */
  conflict: string | null
}

export type SwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface SwapRequest {
  id: string
  requesterId: string
  counterpartyId: string
  date: string
  requesterShiftId: string
  counterpartyShiftId: string
  reason: string
  status: SwapStatus
  /** Statutory / conflict warning surfaced to the approver (TNA-14). */
  warning: string | null
  decidedBy: string | null
  decisionNote: string | null
  submittedOn: string
}

/** "22:00 – 07:00 (ends next day)" for night shifts, "09:00 – 18:00" otherwise. */
export function patternTimeLabel(p: Pick<ShiftPattern, 'startTime' | 'endTime' | 'nightShift'>) {
  return p.nightShift
    ? `${p.startTime} – ${p.endTime} (ends next day)`
    : `${p.startTime} – ${p.endTime}`
}

/**
 * Which approved assignment applies to an employee on a given day. The
 * narrowest date range wins so a single-day change (e.g. an approved swap)
 * overrides the month-long roster; newer assignments win ties because the
 * roster array is newest-first.
 */
export function resolveAssignmentForDay(
  roster: RosterAssignment[],
  employeeId: string,
  date: string
): RosterAssignment | null {
  const rangeDays = (r: RosterAssignment) =>
    (new Date(r.toDate).getTime() - new Date(r.fromDate).getTime()) / 86400000

  let best: RosterAssignment | null = null
  for (const r of roster) {
    if (r.employeeId !== employeeId) continue
    if (r.status !== 'approved') continue
    if (date < r.fromDate || date > r.toDate) continue
    if (best === null || rangeDays(r) < rangeDays(best)) best = r
  }
  return best
}

export const seedShiftPatterns: ShiftPattern[] = [
  { id: 'shift-01', name: 'General 9–6', startTime: '09:00', endTime: '18:00', breakMinutes: 60, nightShift: false, version: 2, effectiveFrom: '2026-04-01', status: 'active' },
  { id: 'shift-01v1', name: 'General 9–6', startTime: '09:30', endTime: '18:30', breakMinutes: 60, nightShift: false, version: 1, effectiveFrom: '2025-01-01', status: 'superseded' },
  { id: 'shift-02', name: 'Early 7–4', startTime: '07:00', endTime: '16:00', breakMinutes: 45, nightShift: false, version: 1, effectiveFrom: '2025-06-01', status: 'active' },
  { id: 'shift-03', name: 'Night 10–7', startTime: '22:00', endTime: '07:00', breakMinutes: 60, nightShift: true, version: 1, effectiveFrom: '2025-06-01', status: 'active' },
  { id: 'shift-04', name: 'Weekend Support 10–7', startTime: '10:00', endTime: '19:00', breakMinutes: 60, nightShift: false, version: 1, effectiveFrom: '2026-07-15', status: 'draft' },
]

export const seedRoster: RosterAssignment[] = [
  { id: 'ros-01', employeeId: 'emp-01', shiftId: 'shift-01', fromDate: '2026-07-01', toDate: '2026-07-31', assignedBy: 'Sunita Patil', assignedOn: '2026-06-24', status: 'approved', conflict: null },
  { id: 'ros-02', employeeId: 'emp-02', shiftId: 'shift-01', fromDate: '2026-07-01', toDate: '2026-07-31', assignedBy: 'Sunita Patil', assignedOn: '2026-06-24', status: 'approved', conflict: null },
  { id: 'ros-03', employeeId: 'emp-04', shiftId: 'shift-03', fromDate: '2026-07-01', toDate: '2026-07-15', assignedBy: 'Vikram Rathore', assignedOn: '2026-06-25', status: 'approved', conflict: null },
  { id: 'ros-04', employeeId: 'emp-04', shiftId: 'shift-02', fromDate: '2026-07-10', toDate: '2026-07-20', assignedBy: 'Vikram Rathore', assignedOn: '2026-06-26', status: 'pending-approval', conflict: 'Overlaps Night 10–7 assignment (10–15 Jul)' },
  { id: 'ros-05', employeeId: 'emp-05', shiftId: 'shift-01', fromDate: '2026-07-01', toDate: '2026-07-31', assignedBy: 'Sunita Patil', assignedOn: '2026-06-24', status: 'approved', conflict: null },
  { id: 'ros-06', employeeId: 'emp-09', shiftId: 'shift-02', fromDate: '2026-07-01', toDate: '2026-07-31', assignedBy: 'Vikram Rathore', assignedOn: '2026-06-25', status: 'approved', conflict: null },
  { id: 'ros-07', employeeId: 'emp-01', shiftId: 'shift-02', fromDate: '2026-08-01', toDate: '2026-08-14', assignedBy: 'Sunita Patil', assignedOn: '2026-06-28', status: 'pending-approval', conflict: null },
  { id: 'ros-08', employeeId: 'emp-06', shiftId: 'shift-01', fromDate: '2026-07-01', toDate: '2026-07-31', assignedBy: 'Sunita Patil', assignedOn: '2026-06-24', status: 'cancelled', conflict: null },
]

export const seedSwaps: SwapRequest[] = [
  {
    id: 'swap-01', requesterId: 'emp-01', counterpartyId: 'emp-02', date: '2026-07-10',
    requesterShiftId: 'shift-01', counterpartyShiftId: 'shift-02',
    reason: 'Medical appointment in the morning', status: 'pending', warning: null,
    decidedBy: null, decisionNote: null, submittedOn: '2026-07-01',
  },
  {
    id: 'swap-02', requesterId: 'emp-04', counterpartyId: 'emp-09', date: '2026-07-08',
    requesterShiftId: 'shift-03', counterpartyShiftId: 'shift-02',
    reason: 'Family function', status: 'pending',
    warning: 'Counterparty would exceed 6 consecutive night shifts (statutory limit)',
    decidedBy: null, decisionNote: null, submittedOn: '2026-06-30',
  },
  {
    id: 'swap-03', requesterId: 'emp-05', counterpartyId: 'emp-11', date: '2026-06-20',
    requesterShiftId: 'shift-01', counterpartyShiftId: 'shift-01',
    reason: 'Travel', status: 'approved', warning: null,
    decidedBy: 'Sunita Patil', decisionNote: 'Roster updated for both employees',
    submittedOn: '2026-06-15',
  },
  {
    id: 'swap-04', requesterId: 'emp-02', counterpartyId: 'emp-06', date: '2026-06-18',
    requesterShiftId: 'shift-01', counterpartyShiftId: 'shift-01',
    reason: 'Personal', status: 'rejected', warning: null,
    decidedBy: 'Sunita Patil', decisionNote: 'Counterparty on planned leave that day',
    submittedOn: '2026-06-12',
  },
]
