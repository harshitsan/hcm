import { type Announcement } from '../data/announcements'
import { DIMENSIONS, type Employee, type Targeting } from '../data/org'

/**
 * Shared rules & matching engine (ANN-19): an employee is included only when
 * they match every constrained dimension — AND across dimensions, OR within a
 * dimension. Unconstrained dimensions (empty selections) match everyone.
 */
export function matchesTargeting(targeting: Targeting, employee: Employee): boolean {
  const attribute: Record<(typeof DIMENSIONS)[number], string[]> = {
    companies: [employee.company],
    jurisdictions: [employee.jurisdiction],
    locations: [employee.location],
    departments: [employee.department],
    groups: employee.groups,
    workforceTypes: [employee.workforceType],
  }
  return DIMENSIONS.every((dim) => {
    const selected = targeting[dim]
    if (selected.length === 0) return true
    return attribute[dim].some((value) => selected.includes(value))
  })
}

export interface AudienceResolution {
  /** Employees who match targeting AND have system access (ANN-08). */
  reachable: Employee[]
  /** Matching employees excluded because they lack system access (ANN-13). */
  excludedNonUsers: Employee[]
}

export function resolveAudience(
  targeting: Targeting,
  employees: Employee[]
): AudienceResolution {
  const matching = employees.filter((e) => matchesTargeting(targeting, e))
  return {
    reachable: matching.filter((e) => e.hasSystemAccess),
    excludedNonUsers: matching.filter((e) => !e.hasSystemAccess),
  }
}

/** Today as an ISO date (yyyy-mm-dd) for effective-window checks. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Feed visibility (ANN-07): published, not hidden, inside its effective
 * publish/expiry window, targeted at the employee, and the employee has
 * system access.
 */
export function isVisibleToEmployee(a: Announcement, employee: Employee): boolean {
  if (!employee.hasSystemAccess) return false
  if (a.status !== 'Published' || a.hidden) return false
  const today = todayIso()
  if (a.startDate > today) return false
  if (a.endDate && a.endDate < today) return false
  return matchesTargeting(a.targeting, employee)
}

/** Human summary of the six selectors, e.g. for the audience column/preview. */
export function targetingSummary(targeting: Targeting): string {
  const parts = DIMENSIONS.filter((dim) => targeting[dim].length > 0).map(
    (dim) => targeting[dim].join(', ')
  )
  return parts.length > 0 ? parts.join(' · ') : 'Entire authorized scope'
}
