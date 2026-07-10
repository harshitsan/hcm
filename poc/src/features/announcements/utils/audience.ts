import { type Announcement } from '../data/announcements'
import { DIMENSIONS, type Employee, type Targeting } from '../data/org'

/** Fixed reference "today" for the POC — all effective-window checks compare against this. */
export const TODAY = '2026-07-09'

/** Today as an ISO date (yyyy-mm-dd) for effective-window checks. */
export function todayIso(): string {
  return TODAY
}

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
    positions: [employee.position],
    groups: employee.groups,
    workforceTypes: [employee.workforceType],
  }
  return DIMENSIONS.every((dim) => {
    const selected = targeting[dim]
    if (selected.length === 0) return true
    return attribute[dim].some((value) => selected.includes(value))
  })
}

/**
 * Announcement-level audience check: "Visible to all employees" bypasses the
 * location/department/position selectors — only the Applicable groups (if
 * any) still narrow the audience, per the Kensium visibility rules.
 */
export function matchesAnnouncementAudience(a: Announcement, employee: Employee): boolean {
  if (a.visibleToAll) {
    if (a.targeting.groups.length === 0) return true
    return employee.groups.some((g) => a.targeting.groups.includes(g))
  }
  return matchesTargeting(a.targeting, employee)
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

/**
 * Feed visibility (ANN-07): published, not hidden, inside its effective
 * publish/expiry window (expired announcements leave the portal, per the
 * Adhoc "Announcement end date" rule), targeted at the employee, and the
 * employee has system access.
 */
export function isVisibleToEmployee(a: Announcement, employee: Employee): boolean {
  if (!employee.hasSystemAccess) return false
  if (a.status !== 'Published' || a.hidden) return false
  const today = todayIso()
  if (a.startDate > today) return false
  if (a.endDate && a.endDate < today) return false
  return matchesAnnouncementAudience(a, employee)
}

/** Human summary of the structured selectors, e.g. for the audience column/preview. */
export function targetingSummary(targeting: Targeting): string {
  const parts = DIMENSIONS.filter((dim) => targeting[dim].length > 0).map(
    (dim) => targeting[dim].join(', ')
  )
  return parts.length > 0 ? parts.join(' · ') : 'Entire authorized scope'
}

/** Sample values used to render template previews. */
export interface TemplateContext {
  employee: string
  event: string
  date: string
  company: string
}

export const SAMPLE_TEMPLATE_CONTEXT: TemplateContext = {
  employee: 'Anita Rao',
  event: 'Birthday',
  date: '09 Jul 2026',
  company: 'Aster Digital',
}

/**
 * Renders an announcement template (PDF pointer #15/16): supports the
 * {{employee}}, {{event}}, {{date}} and {{company}} tokens.
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return template
    .replaceAll('{{employee}}', ctx.employee)
    .replaceAll('{{event}}', ctx.event)
    .replaceAll('{{date}}', ctx.date)
    .replaceAll('{{company}}', ctx.company)
}
