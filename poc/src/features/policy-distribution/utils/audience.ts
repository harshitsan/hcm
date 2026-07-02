import {
  seedEmployees,
  type Employee,
} from '../data/employees'
import {
  type Audience,
  type AudienceCriterion,
  type DueDateRule,
} from '../data/distributions'

/**
 * Rules-engine stand-in: evaluates AND/OR scope criteria against the
 * employee directory and returns a de-duplicated recipient set.
 */

function matchesCriterion(e: Employee, c: AudienceCriterion): boolean {
  if (c.values.length === 0) return false
  switch (c.field) {
    case 'company':
      return c.values.includes(e.company)
    case 'location':
      return c.values.includes(e.location)
    case 'department':
      return c.values.includes(e.department)
    case 'group':
      return c.values.includes(e.group)
    case 'employmentType':
      return c.values.includes(e.employmentType)
    case 'employee':
      return c.values.includes(e.id)
  }
}

export function resolveAudience(
  audience: Audience,
  employees: Employee[] = seedEmployees
): Employee[] {
  const active = audience.criteria.filter((c) => c.values.length > 0)
  if (active.length === 0) return []
  const matched = employees.filter((e) =>
    audience.logic === 'AND'
      ? active.every((c) => matchesCriterion(e, c))
      : active.some((c) => matchesCriterion(e, c))
  )
  // De-duplicate — an employee matching several criteria appears once.
  return [...new Map(matched.map((e) => [e.id, e])).values()]
}

const FIELD_LABELS: Record<AudienceCriterion['field'], string> = {
  company: 'Company',
  location: 'Location',
  department: 'Department',
  group: 'Group',
  employmentType: 'Employment type',
  employee: 'Individuals',
}

export function summarizeAudience(audience: Audience): string {
  const parts = audience.criteria
    .filter((c) => c.values.length > 0)
    .map((c) =>
      c.field === 'employee'
        ? `${c.values.length} individual(s)`
        : `${FIELD_LABELS[c.field]}: ${c.values.join(', ')}`
    )
  if (parts.length === 0) return 'No criteria'
  return parts.join(audience.logic === 'AND' ? ' AND ' : ' OR ')
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

/**
 * Computes the per-recipient due date for a rule. Fixed rules share one
 * deadline; relative rules count from the send date; hire-based rules count
 * from each employee's hire date; periodic rules set the next cycle end.
 */
export function computeDueDate(
  rule: DueDateRule,
  employee: Employee,
  sentAtIso: string
): string | null {
  switch (rule.type) {
    case 'Fixed':
      return rule.fixedDate ?? null
    case 'Relative':
      return addDays(sentAtIso, rule.relativeDays ?? 14)
    case 'Hire-based':
      return addDays(employee.hireDate, rule.hireOffsetDays ?? 30)
    case 'Periodic renewal':
      return addMonths(sentAtIso, rule.renewalMonths ?? 12)
  }
}

export function describeDueRule(rule: DueDateRule): string {
  switch (rule.type) {
    case 'Fixed':
      return `Fixed — ${rule.fixedDate ?? '?'}`
    case 'Relative':
      return `+${rule.relativeDays ?? 14} days from send`
    case 'Hire-based':
      return `Hire date + ${rule.hireOffsetDays ?? 30} days`
    case 'Periodic renewal':
      return `Renews every ${rule.renewalMonths ?? 12} months`
  }
}

/** Percentage of the assignment SLA that has elapsed (0–100+). */
export function slaElapsedPct(
  assignedAt: string,
  dueDate: string | null,
  now = new Date()
): number | null {
  if (!dueDate) return null
  const start = new Date(assignedAt).getTime()
  const end = new Date(`${dueDate}T23:59:59`).getTime()
  if (end <= start) return 100
  return Math.round(((now.getTime() - start) / (end - start)) * 100)
}
