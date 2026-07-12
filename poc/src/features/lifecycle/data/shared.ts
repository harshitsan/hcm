/**
 * Shared vocabulary for the Employee Lifecycle module — approval chains,
 * org reference lists and the mock personas that stand in for the signed-in
 * user of each role.
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalStep {
  /** Approver role in the configured graph, e.g. Manager / HR / Group Admin. */
  role: string
  approver: string
  status: ApprovalStatus
  actedOn: string | null
  note: string | null
}

export const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'Human Resources',
  'Sales',
  'Operations',
  'IT Support',
] as const

export const LOCATIONS = ['Hyderabad', 'Bengaluru', 'Pune', 'Austin'] as const

export const COMPANIES = [
  'Aurora Software India',
  'Aurora Software US',
  'Helix Manufacturing',
] as const

export const POSITION_LEVELS = [
  'L1 - Associate',
  'L2 - Senior',
  'L3 - Lead',
  'L4 - Manager',
] as const

export const EMPLOYEE_CLASSES = ['Full-time', 'Contract', 'Intern'] as const

/** Persona shown as the acting user for each switchable role. */
export const PERSONAS: Record<string, string> = {
  'Platform Admin': 'Meera Krishnan',
  'Portfolio Admin': 'Daniel Osei',
  'Group Company Admin': 'Farah Qureshi',
  'Company Admin': 'Anita Desai',
  'Employee (User)': 'Rohan Verma',
  'Employee (Non-User)': 'Sunil Patil',
}

/** Employee persona used by the self-service “My Lifecycle” tab. */
export const SELF_EMPLOYEE = 'Rohan Verma'

export function shortId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 6)}`
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function addMonths(iso: string, months: number) {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

/** Whole days elapsed from `fromISO` to `toISO` (negative if in the future). */
export function daysBetween(fromISO: string, toISO: string) {
  const MS_PER_DAY = 86_400_000
  return Math.floor(
    (new Date(toISO).getTime() - new Date(fromISO).getTime()) / MS_PER_DAY
  )
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return dateFmt.format(new Date(iso))
}

export function pendingStep(steps: ApprovalStep[]) {
  return steps.find((s) => s.status === 'pending') ?? null
}

export function makeSteps(
  defs: { role: string; approver: string }[]
): ApprovalStep[] {
  return defs.map((d) => ({
    role: d.role,
    approver: d.approver,
    status: 'pending' as const,
    actedOn: null,
    note: null,
  }))
}
