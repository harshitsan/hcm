/**
 * Attendance records — the consolidated register fed by all capture sources
 * (TNA-01…04, 23). Hours/overtime fields are what the shared Time engine
 * derives from raw punches (TNA-25); overrides carry a full audit trail
 * (TNA-13).
 */

export const CAPTURE_SOURCES = ['manual', 'biometric', 'api', 'import'] as const
export type CaptureSource = (typeof CAPTURE_SOURCES)[number]

export const DAY_TYPES = ['working', 'holiday', 'weekly-off'] as const
export type DayType = (typeof DAY_TYPES)[number]

export const WORK_CATEGORIES = [
  'office',
  'work-from-home',
  'client-location',
  'official-visit',
] as const
export type WorkCategory = (typeof WORK_CATEGORIES)[number]

export type AttendanceException =
  | 'missed-punch'
  | 'late-arrival'
  | 'early-exit'
  | 'over-break'

export type AttendanceStatus =
  | 'pending-approval'
  | 'approved'
  | 'flagged'
  | 'unmatched'
  | 'rejected'

export type OvertimeCategory = 'normal' | 'holiday' | 'night-shift'

/** One immutable override entry (TNA-13): before/after, reason, actor, time. */
export interface OverrideEntry {
  at: string
  by: string
  reason: string
  beforeIn: string
  beforeOut: string | null
  afterIn: string
  afterOut: string
}

export interface AttendanceRecord {
  id: string
  /** Null while a biometric/API punch is unmatched to a known employee. */
  employeeId: string | null
  date: string
  punchIn: string
  /** Null = missed punch-out exception. */
  punchOut: string | null
  source: CaptureSource
  /** Device / integration / file the record arrived from, for traceability. */
  origin: string
  /** Who keyed the record in (manual/import), for attribution (TNA-01). */
  enteredBy: string | null
  shiftName: string
  nightShift: boolean
  dayType: DayType
  workCategory: WorkCategory
  breaksCount: number
  breakMinutes: number
  plannedHours: number
  workedHours: number
  effectiveHours: number
  overtimeHours: number
  overtimeCategory: OvertimeCategory | null
  exception: AttendanceException | null
  /** Statutory breach detected by the Rules engine (TNA-12/26). */
  complianceFlag: string | null
  /** Set when consolidation detected this record duplicates another (TNA-23). */
  duplicateOfId: string | null
  status: AttendanceStatus
  overrides: OverrideEntry[]
  /**
   * Night shifts crossing midnight: the calendar date the overtime portion
   * belongs to when it lands after 00:00 (differs from `date`). Keeps the
   * OT/comp-off ledger computation-ready for payroll (D6).
   */
  otAttributedDate?: string
  /** Plain-language explanation of the cross-midnight attribution. */
  otAttributionNote?: string
}

export const seedAttendance: AttendanceRecord[] = [
  {
    id: 'att-01', employeeId: 'emp-01', date: '2026-06-29', punchIn: '09:04', punchOut: '18:12',
    source: 'biometric', origin: 'HYD-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 45,
    plannedHours: 8, workedHours: 9.13, effectiveHours: 8.38, overtimeHours: 0.38, overtimeCategory: 'normal',
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'approved', overrides: [],
  },
  {
    id: 'att-02', employeeId: 'emp-01', date: '2026-06-30', punchIn: '09:41', punchOut: '18:05',
    source: 'biometric', origin: 'HYD-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 3, breakMinutes: 70,
    plannedHours: 8, workedHours: 8.4, effectiveHours: 7.23, overtimeHours: 0, overtimeCategory: null,
    exception: 'late-arrival', complianceFlag: null, duplicateOfId: null, status: 'flagged', overrides: [],
  },
  {
    id: 'att-03', employeeId: 'emp-01', date: '2026-07-01', punchIn: '09:00', punchOut: null,
    source: 'biometric', origin: 'HYD-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 1, breakMinutes: 30,
    plannedHours: 8, workedHours: 0, effectiveHours: 0, overtimeHours: 0, overtimeCategory: null,
    exception: 'missed-punch', complianceFlag: null, duplicateOfId: null, status: 'flagged', overrides: [],
  },
  {
    id: 'att-04', employeeId: 'emp-02', date: '2026-06-30', punchIn: '09:02', punchOut: '20:45',
    source: 'biometric', origin: 'HYD-Gate-2', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 50,
    plannedHours: 8, workedHours: 11.72, effectiveHours: 10.88, overtimeHours: 2.88, overtimeCategory: 'normal',
    exception: null, complianceFlag: 'Exceeds max 10.5h daily limit', duplicateOfId: null, status: 'flagged', overrides: [],
  },
  {
    id: 'att-05', employeeId: 'emp-03', date: '2026-06-28', punchIn: '10:00', punchOut: '17:30',
    source: 'api', origin: 'FieldForce API', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'holiday', workCategory: 'client-location', breaksCount: 1, breakMinutes: 30,
    plannedHours: 0, workedHours: 7.5, effectiveHours: 7, overtimeHours: 7, overtimeCategory: 'holiday',
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'pending-approval', overrides: [],
  },
  {
    id: 'att-06', employeeId: 'emp-04', date: '2026-06-30', punchIn: '22:00', punchOut: '07:10',
    source: 'biometric', origin: 'CHN-Gate-1', enteredBy: null, shiftName: 'Night 10–7', nightShift: true,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 60,
    plannedHours: 8, workedHours: 9.17, effectiveHours: 8.17, overtimeHours: 1.17, overtimeCategory: 'night-shift',
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'approved', overrides: [],
  },
  {
    id: 'att-07', employeeId: 'emp-05', date: '2026-06-30', punchIn: '09:30', punchOut: '18:30',
    source: 'manual', origin: 'Manual entry', enteredBy: 'Sunita Patil', shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'work-from-home', breaksCount: 1, breakMinutes: 40,
    plannedHours: 8, workedHours: 9, effectiveHours: 8.33, overtimeHours: 0.33, overtimeCategory: 'normal',
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'approved', overrides: [],
  },
  {
    id: 'att-08', employeeId: 'emp-06', date: '2026-06-30', punchIn: '09:00', punchOut: '18:00',
    source: 'import', origin: 'june-attendance.xlsx', enteredBy: 'Sunita Patil', shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 45,
    plannedHours: 8, workedHours: 9, effectiveHours: 8.25, overtimeHours: 0, overtimeCategory: null,
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'pending-approval', overrides: [],
  },
  {
    id: 'att-09', employeeId: 'emp-06', date: '2026-06-30', punchIn: '09:01', punchOut: '18:02',
    source: 'biometric', origin: 'HYD-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 45,
    plannedHours: 8, workedHours: 9.02, effectiveHours: 8.27, overtimeHours: 0, overtimeCategory: null,
    exception: null, complianceFlag: null, duplicateOfId: 'att-08', status: 'flagged', overrides: [],
  },
  {
    id: 'att-10', employeeId: null, date: '2026-06-30', punchIn: '08:57', punchOut: '17:44',
    source: 'biometric', origin: 'BLR-Gate-1 (badge #4471)', enteredBy: null, shiftName: '—', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 0, breakMinutes: 0,
    plannedHours: 8, workedHours: 8.78, effectiveHours: 8.78, overtimeHours: 0, overtimeCategory: null,
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'unmatched', overrides: [],
  },
  {
    id: 'att-11', employeeId: 'emp-09', date: '2026-06-30', punchIn: '08:45', punchOut: '17:50',
    source: 'manual', origin: 'Manual entry (non-user)', enteredBy: 'Sunita Patil', shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 55,
    plannedHours: 8, workedHours: 9.08, effectiveHours: 8.17, overtimeHours: 0, overtimeCategory: null,
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'approved', overrides: [],
  },
  {
    id: 'att-12', employeeId: 'emp-10', date: '2026-06-30', punchIn: '09:10', punchOut: '19:40',
    source: 'import', origin: 'ops-shift-log.csv', enteredBy: 'Sunita Patil', shiftName: 'General 9–6', nightShift: false,
    dayType: 'weekly-off', workCategory: 'office', breaksCount: 1, breakMinutes: 35,
    plannedHours: 0, workedHours: 10.5, effectiveHours: 9.92, overtimeHours: 9.92, overtimeCategory: 'holiday',
    exception: null, complianceFlag: 'Worked on weekly-off day', duplicateOfId: null, status: 'pending-approval', overrides: [],
  },
  {
    id: 'att-13', employeeId: 'emp-07', date: '2026-06-30', punchIn: '09:15', punchOut: '16:20',
    source: 'biometric', origin: 'BLR-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 40,
    plannedHours: 8, workedHours: 7.08, effectiveHours: 6.42, overtimeHours: 0, overtimeCategory: null,
    exception: 'early-exit', complianceFlag: null, duplicateOfId: null, status: 'flagged', overrides: [],
  },
  {
    id: 'att-14', employeeId: 'emp-08', date: '2026-06-30', punchIn: '09:00', punchOut: '18:35',
    source: 'biometric', origin: 'CHN-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'official-visit', breaksCount: 3, breakMinutes: 95,
    plannedHours: 8, workedHours: 9.58, effectiveHours: 8, overtimeHours: 0, overtimeCategory: null,
    exception: 'over-break', complianceFlag: null, duplicateOfId: null, status: 'flagged', overrides: [],
  },
  {
    id: 'att-15', employeeId: 'emp-11', date: '2026-07-01', punchIn: '09:05', punchOut: '18:10',
    source: 'api', origin: 'FieldForce API', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'client-location', breaksCount: 1, breakMinutes: 30,
    plannedHours: 8, workedHours: 9.08, effectiveHours: 8.58, overtimeHours: 0.58, overtimeCategory: 'normal',
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'pending-approval', overrides: [],
  },
  {
    id: 'att-16', employeeId: 'emp-12', date: '2026-07-01', punchIn: '08:55', punchOut: '18:00',
    source: 'biometric', origin: 'BLR-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'office', breaksCount: 2, breakMinutes: 50,
    plannedHours: 8, workedHours: 9.08, effectiveHours: 8.25, overtimeHours: 0, overtimeCategory: null,
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'pending-approval',
    overrides: [
      {
        at: '2026-07-01 19:20', by: 'Sunita Patil', reason: 'Badge reader clock drift corrected per facilities ticket #882',
        beforeIn: '09:25', beforeOut: '18:00', afterIn: '08:55', afterOut: '18:00',
      },
    ],
  },
  {
    id: 'att-17', employeeId: 'emp-01', date: '2026-06-26', punchIn: '09:00', punchOut: '18:20',
    source: 'biometric', origin: 'HYD-Gate-1', enteredBy: null, shiftName: 'General 9–6', nightShift: false,
    dayType: 'working', workCategory: 'work-from-home', breaksCount: 1, breakMinutes: 30,
    plannedHours: 8, workedHours: 9.33, effectiveHours: 8.83, overtimeHours: 0.83, overtimeCategory: 'normal',
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'approved', overrides: [],
  },
  // Edge case: night-shift OT spans the date boundary. The shift ran
  // 22:00 (3 Jul) → 06:30 (4 Jul); the 30 minutes worked beyond the planned
  // 8 hours fall after midnight, so the OT is attributed to 4 Jul in the
  // payroll-ready ledger (D6).
  {
    id: 'att-18', employeeId: 'emp-04', date: '2026-07-03', punchIn: '22:00', punchOut: '06:30',
    source: 'biometric', origin: 'CHN-Gate-1', enteredBy: null, shiftName: 'Night 10–7', nightShift: true,
    dayType: 'working', workCategory: 'office', breaksCount: 0, breakMinutes: 0,
    plannedHours: 8, workedHours: 8.5, effectiveHours: 8.5, overtimeHours: 0.5, overtimeCategory: 'night-shift',
    exception: null, complianceFlag: null, duplicateOfId: null, status: 'approved', overrides: [],
    otAttributedDate: '2026-07-04',
    otAttributionNote:
      'Night shift ran 22:00 on 3 Jul to 06:30 on 4 Jul. The 30m of overtime fell after midnight, so it is attributed to 4 Jul.',
  },
]
