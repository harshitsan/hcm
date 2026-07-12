/**
 * Payroll-ready OT / comp-off ledger (D6). Derives one display-only row per
 * employee per day from the attendance register: regular hours, overtime
 * hours and comp-off accrued. NO pay math happens here — every row is only
 * marked computation-ready so the future payroll module (D6) can consume it.
 *
 * Night shifts crossing midnight split into two rows so the overtime portion
 * lands on the calendar day it was actually worked.
 */
import { type AttendanceRecord, type OvertimeCategory } from './attendance'

export interface LedgerRow {
  id: string
  employeeId: string
  date: string
  regularHours: number
  otHours: number
  otCategory: OvertimeCategory | null
  /** Comp-off accrued for holiday / weekly-off work (display only). */
  compOffDays: number
  /** Cross-midnight or other attribution explanation, if any. */
  note: string | null
  /** True when the payroll lock date freezes corrections for this row. */
  locked: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Comp-off accrual shown in the ledger: a full day for ≥8 effective hours on
 * a holiday / weekly-off, half a day for ≥4 — mirroring the comp-off policy
 * templates. Display only; the balance itself lives with leave.
 */
function compOffAccrued(record: AttendanceRecord): number {
  if (record.dayType === 'working') return 0
  if (record.effectiveHours >= 8) return 1
  if (record.effectiveHours >= 4) return 0.5
  return 0
}

export function buildPayrollLedger(
  records: AttendanceRecord[],
  payrollLockedThrough: string
): LedgerRow[] {
  const rows: LedgerRow[] = []

  for (const r of records) {
    // Only settled, non-duplicate, matched records are payroll-ready.
    if (!r.employeeId || r.duplicateOfId || r.punchOut === null) continue
    if (r.status === 'rejected' || r.status === 'unmatched') continue

    const regular = round2(Math.min(r.effectiveHours, r.plannedHours))
    const compOff = compOffAccrued(r)
    const crossesMidnight = r.otAttributedDate && r.otAttributedDate !== r.date

    if (crossesMidnight) {
      // Regular hours stay on the shift's start date…
      rows.push({
        id: `${r.id}-reg`,
        employeeId: r.employeeId,
        date: r.date,
        regularHours: regular,
        otHours: 0,
        otCategory: null,
        compOffDays: compOff,
        note: r.otAttributionNote ?? null,
        locked: r.date <= payrollLockedThrough,
      })
      // …while the OT that fell after 00:00 lands on the next calendar day.
      rows.push({
        id: `${r.id}-ot`,
        employeeId: r.employeeId,
        date: r.otAttributedDate!,
        regularHours: 0,
        otHours: round2(r.overtimeHours),
        otCategory: r.overtimeCategory,
        compOffDays: 0,
        note: r.otAttributionNote ?? null,
        locked: r.otAttributedDate! <= payrollLockedThrough,
      })
    } else {
      rows.push({
        id: r.id,
        employeeId: r.employeeId,
        date: r.date,
        regularHours: regular,
        otHours: round2(r.overtimeHours),
        otCategory: r.overtimeCategory,
        compOffDays: compOff,
        note: r.otAttributionNote ?? null,
        locked: r.date <= payrollLockedThrough,
      })
    }
  }

  // Newest day first; stable per-employee order within a day.
  return rows.sort((a, b) =>
    a.date === b.date ? a.employeeId.localeCompare(b.employeeId) : b.date.localeCompare(a.date)
  )
}
