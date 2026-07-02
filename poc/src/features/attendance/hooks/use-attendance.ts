import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAttendance,
  type AttendanceRecord,
  type CaptureSource,
  type WorkCategory,
} from '../data/attendance'
import { employeeName, hoursBetween } from '../data/shared'

export interface ManualEntryDraft {
  employeeId: string
  date: string
  punchIn: string
  punchOut: string
  workCategory: WorkCategory
  comment: string
}

/**
 * In-memory attendance register. Stands in for the consolidated store fed by
 * manual entry, biometric, API and file-import capture (TNA-01…04) plus the
 * Time engine recompute (TNA-25). Resets on reload.
 */
export function useAttendance(actor: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>(seedAttendance)

  /** Derive engine-computed hours from raw punches (TNA-25). */
  const compute = useCallback(
    (punchIn: string, punchOut: string, breakMinutes: number, dayType: AttendanceRecord['dayType'], nightShift: boolean) => {
      const worked = hoursBetween(punchIn, punchOut)
      const effective = Math.max(0, Math.round((worked - breakMinutes / 60) * 100) / 100)
      const standard = dayType === 'working' ? 8 : 0
      const overtime = Math.max(0, Math.round((effective - standard) * 100) / 100)
      const category =
        overtime === 0 ? null
        : dayType !== 'working' ? ('holiday' as const)
        : nightShift ? ('night-shift' as const)
        : ('normal' as const)
      return { worked, effective, overtime, category }
    },
    []
  )

  /** TNA-01/18/46 — manual entry, attributed to the entering user. */
  const addManual = useCallback(
    (draft: ManualEntryDraft, origin = 'Manual entry') => {
      const duplicate = records.find(
        (r) => r.employeeId === draft.employeeId && r.date === draft.date && !r.duplicateOfId
      )
      const { worked, effective, overtime, category } = compute(draft.punchIn, draft.punchOut, 45, 'working', false)
      const record: AttendanceRecord = {
        id: `att-${crypto.randomUUID().slice(0, 8)}`,
        employeeId: draft.employeeId,
        date: draft.date,
        punchIn: draft.punchIn,
        punchOut: draft.punchOut,
        source: 'manual',
        origin: draft.comment ? `${origin} — ${draft.comment}` : origin,
        enteredBy: actor,
        shiftName: 'General 9–6',
        nightShift: false,
        dayType: 'working',
        workCategory: draft.workCategory,
        breaksCount: 1,
        breakMinutes: 45,
        plannedHours: 8,
        workedHours: worked,
        effectiveHours: effective,
        overtimeHours: overtime,
        overtimeCategory: category,
        exception: null,
        complianceFlag: effective > 10.5 ? 'Exceeds max 10.5h daily limit' : null,
        duplicateOfId: duplicate ? duplicate.id : null,
        status: duplicate ? 'flagged' : 'pending-approval',
        overrides: [],
      }
      setRecords((prev) => [record, ...prev])
      if (duplicate) {
        toast.warning(
          `Duplicate flagged: ${employeeName(draft.employeeId)} already has a record for ${draft.date}`
        )
      } else {
        toast.success(`Manual attendance saved for ${employeeName(draft.employeeId)} (source: manual)`)
      }
      return record
    },
    [actor, compute, records]
  )

  /** TNA-13 — administrative override: mandatory reason + immutable audit. */
  const overrideRecord = useCallback(
    (id: string, punchIn: string, punchOut: string, reason: string) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const { worked, effective, overtime, category } = compute(punchIn, punchOut, r.breakMinutes, r.dayType, r.nightShift)
          return {
            ...r,
            punchIn,
            punchOut,
            workedHours: worked,
            effectiveHours: effective,
            overtimeHours: overtime,
            overtimeCategory: category,
            exception: null,
            complianceFlag: effective > 10.5 ? 'Exceeds max 10.5h daily limit' : null,
            overrides: [
              ...r.overrides,
              {
                at: new Date().toISOString().slice(0, 16).replace('T', ' '),
                by: actor,
                reason,
                beforeIn: r.punchIn,
                beforeOut: r.punchOut,
                afterIn: punchIn,
                afterOut: punchOut,
              },
            ],
          }
        })
      )
      toast.success('Override applied — audit trail updated and downstream hours recomputed')
    },
    [actor, compute]
  )

  /** TNA-02 — assign an unmatched device punch to a known employee. */
  const resolveUnmatched = useCallback((id: string, employeeId: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, employeeId, status: 'pending-approval', shiftName: 'General 9–6' } : r
      )
    )
    toast.success(`Punch matched to ${employeeName(employeeId)}`)
  }, [])

  /** TNA-23 — consolidate duplicates so hours are never double-counted. */
  const reconcileDuplicates = useCallback(() => {
    let count = 0
    setRecords((prev) =>
      prev.filter((r) => {
        if (r.duplicateOfId) {
          count += 1
          return false
        }
        return true
      })
    )
    setTimeout(() => {
      toast.success(
        count > 0
          ? `${count} duplicate record(s) reconciled into their canonical records`
          : 'No duplicates to reconcile'
      )
    }, 0)
  }, [])

  /** TNA-45 — bulk day approval, and TNA-15/44 correction application. */
  const approveRecords = useCallback((ids: string[]) => {
    setRecords((prev) =>
      prev.map((r) => (ids.includes(r.id) ? { ...r, status: 'approved' } : r))
    )
    toast.success(`${ids.length} attendance record(s) approved`)
  }, [])

  /** Applied when a correction request is approved (TNA-11/15). */
  const applyCorrection = useCallback(
    (employeeId: string, date: string, punchIn: string, punchOut: string) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.employeeId !== employeeId || r.date !== date) return r
          const { worked, effective, overtime, category } = compute(punchIn, punchOut, r.breakMinutes, r.dayType, r.nightShift)
          return {
            ...r,
            punchIn,
            punchOut,
            workedHours: worked,
            effectiveHours: effective,
            overtimeHours: overtime,
            overtimeCategory: category,
            exception: null,
            status: 'approved',
          }
        })
      )
    },
    [compute]
  )

  /** TNA-04 — simulated CSV/XLS import with a success/failure summary. */
  const importFile = useCallback(
    (fileName: string) => {
      const rows: ManualEntryDraft[] = [
        { employeeId: 'emp-11', date: '2026-07-02', punchIn: '09:05', punchOut: '18:00', workCategory: 'office', comment: '' },
        { employeeId: 'emp-12', date: '2026-07-02', punchIn: '08:50', punchOut: '17:45', workCategory: 'office', comment: '' },
      ]
      const imported: AttendanceRecord[] = rows.map((row, i) => ({
        id: `att-${crypto.randomUUID().slice(0, 6)}-${i}`,
        employeeId: row.employeeId,
        date: row.date,
        punchIn: row.punchIn,
        punchOut: row.punchOut,
        source: 'import' as CaptureSource,
        origin: fileName,
        enteredBy: actor,
        shiftName: 'General 9–6',
        nightShift: false,
        dayType: 'working' as const,
        workCategory: row.workCategory,
        breaksCount: 1,
        breakMinutes: 45,
        plannedHours: 8,
        ...(() => {
          const c = compute(row.punchIn, row.punchOut, 45, 'working', false)
          return {
            workedHours: c.worked,
            effectiveHours: c.effective,
            overtimeHours: c.overtime,
            overtimeCategory: c.category,
          }
        })(),
        exception: null,
        complianceFlag: null,
        duplicateOfId: null,
        status: 'pending-approval' as const,
        overrides: [],
      }))
      setRecords((prev) => [...imported, ...prev])
      toast.success(
        `${fileName}: ${imported.length} rows imported, 2 rows rejected (unknown employee ID "ST-9999", out-time before in-time on row 4)`
      )
    },
    [actor, compute]
  )

  /** TNA-02/03 — simulated biometric / third-party API ingestion. */
  const simulateIngestion = useCallback(
    (source: 'biometric' | 'api') => {
      const isBio = source === 'biometric'
      const record: AttendanceRecord = {
        id: `att-${crypto.randomUUID().slice(0, 8)}`,
        employeeId: isBio ? null : 'emp-03',
        date: '2026-07-02',
        punchIn: isBio ? '09:12' : '09:30',
        punchOut: isBio ? '18:03' : '17:45',
        source,
        origin: isBio ? 'HYD-Gate-2 (badge #7710)' : 'FieldForce API',
        enteredBy: null,
        shiftName: isBio ? '—' : 'General 9–6',
        nightShift: false,
        dayType: 'working',
        workCategory: isBio ? 'office' : 'client-location',
        breaksCount: isBio ? 0 : 1,
        breakMinutes: isBio ? 0 : 30,
        plannedHours: 8,
        ...(() => {
          const c = compute(isBio ? '09:12' : '09:30', isBio ? '18:03' : '17:45', isBio ? 0 : 30, 'working', false)
          return {
            workedHours: c.worked,
            effectiveHours: c.effective,
            overtimeHours: c.overtime,
            overtimeCategory: c.category,
          }
        })(),
        exception: null,
        complianceFlag: null,
        duplicateOfId: null,
        status: isBio ? 'unmatched' : 'pending-approval',
        overrides: [],
      }
      setRecords((prev) => [record, ...prev])
      toast.success(
        isBio
          ? 'Device punch ingested — badge #7710 is unmatched and queued for resolution'
          : 'API payload processed: 1 record ingested, 1 malformed row rejected (missing punch-out)'
      )
    },
    [compute]
  )

  const summary = useMemo(() => {
    const active = records.filter((r) => !r.duplicateOfId)
    return {
      total: active.length,
      pending: active.filter((r) => r.status === 'pending-approval').length,
      exceptions: active.filter((r) => r.exception !== null).length,
      unmatched: records.filter((r) => r.status === 'unmatched').length,
      duplicates: records.filter((r) => r.duplicateOfId !== null).length,
      violations: active.filter((r) => r.complianceFlag !== null).length,
      overtimeHours: Math.round(active.reduce((sum, r) => sum + r.overtimeHours, 0) * 100) / 100,
    }
  }, [records])

  return {
    records,
    summary,
    addManual,
    overrideRecord,
    resolveUnmatched,
    reconcileDuplicates,
    approveRecords,
    applyCorrection,
    importFile,
    simulateIngestion,
  }
}

export type AttendanceStore = ReturnType<typeof useAttendance>
