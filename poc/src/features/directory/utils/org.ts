import { type Role } from '@/context/role-context'
import {
  COMPANIES,
  CURRENT_GROUP,
  CURRENT_COMPANY_ID,
  CURRENT_PORTFOLIO,
  REPORTING_HISTORY,
  type Company,
  type Employee,
} from '../data/directory'

/**
 * Org hierarchy helpers: effective-dated manager resolution (DIR-17),
 * tenant scoping (DIR-16) and structural-integrity checks (DIR-18).
 */

/** Companies whose rows the persistence layer returns for a role (DIR-16). */
export function scopedCompanies(role: Role): Company[] {
  if (role === 'Platform Admin') return COMPANIES
  if (role === 'Portfolio Admin')
    return COMPANIES.filter((c) => c.portfolio === CURRENT_PORTFOLIO)
  if (role === 'Group Company Admin')
    return COMPANIES.filter((c) => c.group === CURRENT_GROUP)
  return COMPANIES.filter((c) => c.id === CURRENT_COMPANY_ID)
}

/**
 * Manager effective on a given date (DIR-17). Employees without history rows
 * fall back to their current manager; dates before the earliest record use
 * the earliest known relationship.
 */
export function managerAsOf(
  employee: Employee,
  asOfIso: string
): string | null {
  const records = REPORTING_HISTORY.filter(
    (r) => r.employeeId === employee.id
  ).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
  if (records.length === 0) return employee.managerId
  const effective = records.filter((r) => r.effectiveFrom <= asOfIso)
  if (effective.length === 0) return records[0].managerId
  return effective[effective.length - 1].managerId
}

/**
 * Manager used for rendering: reports of a deactivated manager are lifted to
 * the deactivated manager's own manager so no branch dangles (DIR-18).
 */
export function renderManagerId(
  employee: Employee,
  asOfIso: string,
  byId: Map<string, Employee>
): string | null {
  const managerId = managerAsOf(employee, asOfIso)
  if (!managerId) return null
  const manager = byId.get(managerId)
  if (!manager) return null
  if (manager.employmentStatus === 'inactive') {
    return managerAsOf(manager, asOfIso)
  }
  return managerId
}

/** True if setting `newManagerId` on `employeeId` would create a cycle. */
export function wouldCreateCycle(
  employees: Employee[],
  employeeId: string,
  newManagerId: string
): boolean {
  if (employeeId === newManagerId) return true
  const byId = new Map(employees.map((e) => [e.id, e]))
  let cursor: string | null = newManagerId
  const visited = new Set<string>()
  while (cursor) {
    if (cursor === employeeId) return true
    if (visited.has(cursor)) return true
    visited.add(cursor)
    cursor = byId.get(cursor)?.managerId ?? null
  }
  return false
}

export interface IntegrityCheck {
  id: string
  label: string
  status: 'pass' | 'warning'
  detail: string
}

/** Structural checks over the reporting graph (DIR-18). */
export function runIntegrityChecks(employees: Employee[]): IntegrityCheck[] {
  const byId = new Map(employees.map((e) => [e.id, e]))

  const dangling = employees.filter(
    (e) => e.managerId !== null && !byId.has(e.managerId)
  )

  const cyclic = employees.filter(
    (e) =>
      e.managerId !== null && wouldCreateCycle(employees, e.id, e.managerId)
  )

  const roots = employees.filter((e) => e.managerId === null)

  const underInactive = employees.filter((e) => {
    const mgr = e.managerId ? byId.get(e.managerId) : undefined
    return mgr?.employmentStatus === 'inactive'
  })

  return [
    {
      id: 'refs',
      label: 'Referential integrity',
      status: dangling.length === 0 ? 'pass' : 'warning',
      detail:
        dangling.length === 0
          ? `All ${employees.filter((e) => e.managerId).length} reporting links resolve to valid employee records.`
          : `${dangling.length} link(s) reference a missing manager: ${dangling.map((e) => e.name).join(', ')}.`,
    },
    {
      id: 'cycles',
      label: 'Cycle detection',
      status: cyclic.length === 0 ? 'pass' : 'warning',
      detail:
        cyclic.length === 0
          ? 'No reporting cycles — every chain terminates at a root node.'
          : `Cycle detected involving: ${cyclic.map((e) => e.name).join(', ')}.`,
    },
    {
      id: 'roots',
      label: 'Root nodes',
      status: 'pass',
      detail: `${roots.length} employee(s) without a manager render as valid roots: ${roots.map((e) => e.name).join(', ')}.`,
    },
    {
      id: 'inactive-managers',
      label: 'Deactivated managers',
      status: underInactive.length === 0 ? 'pass' : 'warning',
      detail:
        underInactive.length === 0
          ? 'No reports are attached to deactivated managers.'
          : `${underInactive.length} report(s) sit under a deactivated manager (${underInactive.map((e) => e.name).join(', ')}) — the chart lifts them to the next active manager per integrity rules.`,
    },
  ]
}
