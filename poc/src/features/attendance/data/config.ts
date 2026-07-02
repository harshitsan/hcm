/**
 * Governed Time & Attendance configuration — versioned and effective-dated
 * (TNA-24): holiday calendars (TNA-07/08), statutory hours (TNA-12), overtime
 * decision tables (TNA-26/30), policy templates (TNA-29/32/34/35/37), approver
 * graphs & escalation rules (TNA-16/39/43), capture infrastructure
 * (TNA-40/41/47) and platform integrations (TNA-21/22).
 */
import { type EmployeeClass, type WorkerCategory } from './shared'

export type ConfigStatus = 'active' | 'draft' | 'superseded'

// ---------------------------------------------------------------- Holidays
export type HolidayKind = 'mandatory' | 'optional'

export interface Holiday {
  id: string
  name: string
  date: string
  /** 'Company-wide' or a specific location name (TNA-07). */
  scope: string
  kind: HolidayKind
}

export interface HolidayCalendar {
  id: string
  name: string
  year: number
  /** How many optional holidays each employee may opt into (TNA-08). */
  optionalAllowance: number
  version: number
  effectiveFrom: string
  status: ConfigStatus
  holidays: Holiday[]
}

export const seedCalendars: HolidayCalendar[] = [
  {
    id: 'cal-01', name: 'India 2026', year: 2026, optionalAllowance: 2,
    version: 2, effectiveFrom: '2026-01-01', status: 'active',
    holidays: [
      { id: 'hol-01', name: 'Republic Day', date: '2026-01-26', scope: 'Company-wide', kind: 'mandatory' },
      { id: 'hol-02', name: 'Holi', date: '2026-03-04', scope: 'Company-wide', kind: 'mandatory' },
      { id: 'hol-03', name: 'Independence Day', date: '2026-08-15', scope: 'Company-wide', kind: 'mandatory' },
      { id: 'hol-04', name: 'Ganesh Chaturthi', date: '2026-09-14', scope: 'Pune', kind: 'mandatory' },
      { id: 'hol-05', name: 'Bonalu', date: '2026-07-20', scope: 'Hyderabad', kind: 'mandatory' },
      { id: 'hol-06', name: 'Karva Chauth', date: '2026-10-29', scope: 'Company-wide', kind: 'optional' },
      { id: 'hol-07', name: 'Onam', date: '2026-08-26', scope: 'Company-wide', kind: 'optional' },
      { id: 'hol-08', name: 'Chhath Puja', date: '2026-11-15', scope: 'Company-wide', kind: 'optional' },
      { id: 'hol-09', name: 'Diwali', date: '2026-11-08', scope: 'Company-wide', kind: 'mandatory' },
    ],
  },
  {
    id: 'cal-01v1', name: 'India 2026', year: 2026, optionalAllowance: 1,
    version: 1, effectiveFrom: '2025-12-01', status: 'superseded', holidays: [],
  },
]

// ------------------------------------------------------- Statutory hours
export interface StatutoryConfig {
  id: string
  dailyHours: number
  maxDailyHours: number
  maxWeeklyHours: number
  weeklyOffDay: string
  version: number
  effectiveFrom: string
  status: ConfigStatus
}

export const seedStatutory: StatutoryConfig[] = [
  { id: 'stat-02', dailyHours: 8, maxDailyHours: 10.5, maxWeeklyHours: 48, weeklyOffDay: 'Sunday', version: 2, effectiveFrom: '2026-04-01', status: 'active' },
  { id: 'stat-01', dailyHours: 8, maxDailyHours: 9, maxWeeklyHours: 48, weeklyOffDay: 'Sunday', version: 1, effectiveFrom: '2025-01-01', status: 'superseded' },
]

// ---------------------------------------------------- Rules decision table
export interface OvertimeRule {
  id: string
  condition: string
  category: 'normal' | 'holiday' | 'night-shift'
  multiplier: number
}

export const seedOvertimeRules: OvertimeRule[] = [
  { id: 'rule-01', condition: 'Worked hours > standard on a working day', category: 'normal', multiplier: 1.5 },
  { id: 'rule-02', condition: 'Any work on a configured holiday or weekly-off', category: 'holiday', multiplier: 2 },
  { id: 'rule-03', condition: 'Worked hours > standard on a night shift', category: 'night-shift', multiplier: 1.75 },
]

export interface OvertimeEligibility {
  category: WorkerCategory
  eligible: boolean
}

export const seedOtEligibility: OvertimeEligibility[] = [
  { category: 'Workman', eligible: true },
  { category: 'Staff', eligible: true },
  { category: 'Management', eligible: false },
]

// ------------------------------------------------------- Policy templates
export interface BreakRule {
  id: string
  name: string
  allowableMinutes: number
  applicability: string
  paid: boolean
}

export const seedBreaks: BreakRule[] = [
  { id: 'brk-01', name: 'Lunch break', allowableMinutes: 45, applicability: 'Company-wide', paid: true },
  { id: 'brk-02', name: 'Tea break', allowableMinutes: 15, applicability: 'Company-wide', paid: true },
  { id: 'brk-03', name: 'Night shift meal', allowableMinutes: 60, applicability: 'Location: Chennai', paid: true },
]

export interface CompOffTemplate {
  id: string
  name: string
  classSpecific: boolean
  employeeClass: EmployeeClass | 'All'
  minHoursBeyond: number
}

export const seedCompOffTemplates: CompOffTemplate[] = [
  { id: 'cot-01', name: 'Standard comp off', classSpecific: false, employeeClass: 'All', minHoursBeyond: 4 },
  { id: 'cot-02', name: 'Contractor comp off', classSpecific: true, employeeClass: 'Contractor', minHoursBeyond: 6 },
]

export type FlexiBasis = 'location' | 'department' | 'position'

export interface FlexiSettings {
  enabled: boolean
  basis: FlexiBasis
  assigned: string[]
}

export const seedFlexi: FlexiSettings = {
  enabled: true,
  basis: 'department',
  assigned: ['Engineering', 'Sales'],
}

export interface OutTimeSettings {
  id: string
  name: string
  classSpecific: boolean
  employeeClass: EmployeeClass | 'All'
  maxRequestsPerMonth: number
  maxHoursPerRequest: number
  maxHoursPerMonth: number
}

export const seedOutTimeSettings: OutTimeSettings[] = [
  { id: 'ots-01', name: 'Standard out-time', classSpecific: false, employeeClass: 'All', maxRequestsPerMonth: 4, maxHoursPerRequest: 3, maxHoursPerMonth: 8 },
]

export interface WfhTemplate {
  id: string
  name: string
  classSpecific: boolean
  employeeClass: EmployeeClass | 'All'
  maxPerMonth: number
}

export const seedWfhTemplates: WfhTemplate[] = [
  { id: 'wft-01', name: 'Hybrid policy', classSpecific: false, employeeClass: 'All', maxPerMonth: 4 },
  { id: 'wft-02', name: 'Executive remote', classSpecific: true, employeeClass: 'Executive', maxPerMonth: 10 },
]

// -------------------------------------------- Approver graphs & escalation
export type WorkflowKind =
  | 'attendance-correction'
  | 'overtime'
  | 'work-from-home'
  | 'shift-swap'

export interface ApprovalWorkflow {
  id: string
  kind: WorkflowKind
  scope: string
  levels: string[]
  slaHours: number
  escalateTo: string
  /** Overtime only: max hours the immediate supervisor may approve (TNA-30). */
  supervisorCapHours: number | null
  /** Corrections only: raise-after-this-day-of-month needs L2 (TNA-43). */
  payrollCutoffDay: number | null
  version: number
  effectiveFrom: string
  status: ConfigStatus
}

export const seedWorkflows: ApprovalWorkflow[] = [
  { id: 'wf-01', kind: 'attendance-correction', scope: 'Company-wide', levels: ['Immediate Supervisor', 'HR Manager'], slaHours: 48, escalateTo: 'Arjun Mehta (Group HR)', supervisorCapHours: null, payrollCutoffDay: 25, version: 3, effectiveFrom: '2026-05-01', status: 'active' },
  { id: 'wf-02', kind: 'overtime', scope: 'Locations: Hyderabad, Bengaluru', levels: ['Immediate Supervisor', 'Department Head'], slaHours: 72, escalateTo: 'Arjun Mehta (Group HR)', supervisorCapHours: 4, payrollCutoffDay: null, version: 1, effectiveFrom: '2026-01-01', status: 'active' },
  { id: 'wf-03', kind: 'overtime', scope: 'Locations: Chennai, Pune', levels: ['Shift In-charge', 'Plant Head'], slaHours: 48, escalateTo: 'Vikram Rathore', supervisorCapHours: 6, payrollCutoffDay: null, version: 1, effectiveFrom: '2026-01-01', status: 'active' },
  { id: 'wf-04', kind: 'work-from-home', scope: 'Company-wide', levels: ['Immediate Supervisor'], slaHours: 24, escalateTo: 'HR Manager', supervisorCapHours: null, payrollCutoffDay: null, version: 2, effectiveFrom: '2026-03-01', status: 'active' },
  { id: 'wf-05', kind: 'shift-swap', scope: 'Company-wide', levels: ['Roster Owner'], slaHours: 24, escalateTo: 'HR Manager', supervisorCapHours: null, payrollCutoffDay: null, version: 1, effectiveFrom: '2026-01-01', status: 'active' },
]

// -------------------------------------------------- Capture infrastructure
export interface TrackingDevice {
  id: string
  name: string
  location: string
  workArea: string
  pointType: 'entry' | 'exit' | 'entry-exit'
  mode: string
  alertEmail: string
  status: 'online' | 'offline'
}

export const seedDevices: TrackingDevice[] = [
  { id: 'dev-01', name: 'HYD-Gate-1', location: 'Hyderabad', workArea: 'Main lobby', pointType: 'entry-exit', mode: 'Fingerprint', alertEmail: 'facilities.hyd@satellitehr.in', status: 'online' },
  { id: 'dev-02', name: 'HYD-Gate-2', location: 'Hyderabad', workArea: 'Lab wing', pointType: 'entry', mode: 'Face recognition', alertEmail: 'facilities.hyd@satellitehr.in', status: 'online' },
  { id: 'dev-03', name: 'BLR-Gate-1', location: 'Bengaluru', workArea: 'Tower A', pointType: 'entry-exit', mode: 'Badge reader', alertEmail: 'facilities.blr@satellitehr.in', status: 'offline' },
  { id: 'dev-04', name: 'CHN-Gate-1', location: 'Chennai', workArea: 'Plant floor', pointType: 'entry-exit', mode: 'Fingerprint', alertEmail: 'facilities.chn@satellitehr.in', status: 'online' },
]

export interface TrackingMode {
  id: string
  name: string
  description: string
  locations: string[]
  reconciliation: 'priority' | 'grace-period'
  graceMinutes: number
  minBreakMinutes: number
  remindEmail: boolean
  remindSms: boolean
}

export const seedTrackingModes: TrackingMode[] = [
  { id: 'tm-01', name: 'Access-control reader', description: 'Badge/biometric punches from gates', locations: ['Hyderabad', 'Bengaluru', 'Chennai'], reconciliation: 'priority', graceMinutes: 10, minBreakMinutes: 15, remindEmail: true, remindSms: false },
  { id: 'tm-02', name: 'Self-service portal', description: 'Web check-in for remote staff', locations: ['Pune'], reconciliation: 'grace-period', graceMinutes: 15, minBreakMinutes: 20, remindEmail: true, remindSms: true },
  { id: 'tm-03', name: 'Manual', description: 'HR-keyed entries and sheets', locations: ['Hyderabad', 'Bengaluru', 'Chennai', 'Pune'], reconciliation: 'priority', graceMinutes: 0, minBreakMinutes: 0, remindEmail: false, remindSms: false },
]

export interface AuditRecurrence {
  id: string
  name: string
  schedule: string
  location: string
  workArea: string
  lastRun: string | null
  nextRun: string
}

export const seedAuditPatterns: AuditRecurrence[] = [
  { id: 'aud-01', name: 'Plant floor weekly audit', schedule: 'Every Monday 06:00', location: 'Chennai', workArea: 'Plant floor', lastRun: '2026-06-29', nextRun: '2026-07-06' },
  { id: 'aud-02', name: 'Month-end lobby audit', schedule: 'Last day of month 20:00', location: 'Hyderabad', workArea: 'Main lobby', lastRun: '2026-06-30', nextRun: '2026-07-31' },
]

// ----------------------------------------------------- Platform (TNA-21/22)
export interface Integration {
  id: string
  name: string
  kind: 'biometric' | 'api' | 'file-import'
  endpoint: string
  credentialStatus: 'valid' | 'invalid' | 'untested'
  enabled: boolean
}

export const seedIntegrations: Integration[] = [
  { id: 'int-01', name: 'ZKTeco device fleet', kind: 'biometric', endpoint: 'wss://devices.satellitehr.in/ingest', credentialStatus: 'valid', enabled: true },
  { id: 'int-02', name: 'FieldForce API', kind: 'api', endpoint: 'https://api.fieldforce.example/v2/attendance', credentialStatus: 'valid', enabled: true },
  { id: 'int-03', name: 'Legacy HR export', kind: 'api', endpoint: 'https://legacy.hr.example/feed', credentialStatus: 'invalid', enabled: false },
  { id: 'int-04', name: 'CSV/XLS file import', kind: 'file-import', endpoint: 'Template: attendance-import-v3.xlsx', credentialStatus: 'valid', enabled: true },
]

export interface TenantModule {
  tenant: string
  enabled: boolean
  captureMethods: string[]
}

export const seedTenants: TenantModule[] = [
  { tenant: 'Satellite Tech India', enabled: true, captureMethods: ['Manual', 'Biometric', 'API', 'File import'] },
  { tenant: 'Orbital Services', enabled: true, captureMethods: ['Manual', 'File import'] },
  { tenant: 'Nimbus Logistics', enabled: false, captureMethods: [] },
]

/** Group-level compliance snapshot for cross-company oversight (TNA-20). */
export interface CompanyComplianceSnapshot {
  company: string
  shiftPatterns: number
  holidayCalendars: number
  otPolicy: string
  maxDailyHours: number
  violations30d: number
  otHours30d: number
  deviation: string | null
}

export const seedGroupCompliance: CompanyComplianceSnapshot[] = [
  { company: 'Satellite Tech India', shiftPatterns: 4, holidayCalendars: 1, otPolicy: '1.5x / 2x holiday', maxDailyHours: 10.5, violations30d: 3, otHours30d: 142, deviation: null },
  { company: 'Orbital Services', shiftPatterns: 2, holidayCalendars: 2, otPolicy: '1.5x flat', maxDailyHours: 9, violations30d: 11, otHours30d: 388, deviation: 'OT hours trending 2.4x group average' },
  { company: 'Nimbus Logistics', shiftPatterns: 6, holidayCalendars: 3, otPolicy: '2x flat', maxDailyHours: 12, violations30d: 0, otHours30d: 51, deviation: 'Max daily hours above statutory 10.5h guidance' },
]
