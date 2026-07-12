/**
 * Survey audience targeting (P4 — "Targeting shall reuse applicability
 * dimensions, D1"). The shape deliberately mirrors the Policy Distribution
 * audience model (AND/OR criteria over company / location / department /
 * group / employment type / individuals) — the types are imported read-only
 * from that module — but resolves against the Feedback module's own org
 * directory so surveys and grievances share one employee universe.
 */
import type {
  Audience,
  AudienceCriterion,
  AudienceField,
} from '@/features/policy-distribution/data/distributions'
import {
  ORG_COMPANIES,
  ORG_DEPARTMENTS,
  ORG_EMPLOYEES,
  ORG_EMPLOYMENT_TYPES,
  ORG_LOCATIONS,
  ORG_ROLES,
  type OrgEmployee,
} from './org'

export type { Audience, AudienceCriterion, AudienceField }

/** Every distinct department across locations. */
export const ORG_ALL_DEPARTMENTS: string[] = [
  ...new Set(Object.values(ORG_DEPARTMENTS).flat()),
]

/** An audience with no criteria — the authoring starting point. */
export function emptyAudience(): Audience {
  return { logic: 'OR', criteria: [] }
}

/** Convenience seed helper: everyone in every company. */
export function allEmployeesAudience(): Audience {
  return {
    logic: 'OR',
    criteria: [{ field: 'company', values: [...ORG_COMPANIES] }],
  }
}

function matchesCriterion(e: OrgEmployee, c: AudienceCriterion): boolean {
  if (c.values.length === 0) return false
  switch (c.field) {
    case 'company':
      return c.values.includes(e.company)
    case 'location':
      return c.values.includes(e.location)
    case 'department':
      return c.values.includes(e.department)
    // The "group" dimension maps to org role groups in this module
    // (e.g. Department Head, HR Manager) — how "Managers only" is targeted.
    case 'group':
      return c.values.includes(e.role)
    case 'employmentType':
      return c.values.includes(e.employmentType)
    case 'employee':
      return c.values.includes(e.id)
  }
}

/**
 * Resolve the targeted audience to a de-duplicated employee list —
 * the same AND/OR evaluation the Policy Distribution rules engine uses.
 */
export function resolveSurveyAudience(audience: Audience): OrgEmployee[] {
  const active = audience.criteria.filter((c) => c.values.length > 0)
  if (active.length === 0) return []
  const matched = ORG_EMPLOYEES.filter((e) =>
    audience.logic === 'AND'
      ? active.every((c) => matchesCriterion(e, c))
      : active.some((c) => matchesCriterion(e, c))
  )
  return [...new Map(matched.map((e) => [e.id, e])).values()]
}

const FIELD_LABELS: Record<AudienceField, string> = {
  company: 'Company',
  location: 'Location',
  department: 'Department',
  group: 'Role group',
  employmentType: 'Employment type',
  employee: 'Individuals',
}

/** Human-readable applicability summary shown in the survey list. */
export function summarizeSurveyAudience(audience: Audience): string {
  const active = audience.criteria.filter((c) => c.values.length > 0)
  if (active.length === 0) return 'No audience yet'
  // Special-case the common "every company" target.
  if (
    active.length === 1 &&
    active[0].field === 'company' &&
    ORG_COMPANIES.every((c) => active[0].values.includes(c))
  ) {
    return 'All Employees'
  }
  const parts = active.map((c) =>
    c.field === 'employee'
      ? `${c.values.length} individual(s)`
      : `${FIELD_LABELS[c.field]}: ${c.values.join(', ')}`
  )
  return parts.join(audience.logic === 'AND' ? ' AND ' : ' OR ')
}

/** Dimension catalog for the audience builder UI. */
export const SURVEY_AUDIENCE_FIELDS: {
  field: AudienceField
  label: string
  items: { id: string; label: string }[]
}[] = [
  {
    field: 'company',
    label: 'Company',
    items: ORG_COMPANIES.map((v) => ({ id: v, label: v })),
  },
  {
    field: 'location',
    label: 'Location',
    items: ORG_LOCATIONS.map((v) => ({ id: v, label: v })),
  },
  {
    field: 'department',
    label: 'Department',
    items: ORG_ALL_DEPARTMENTS.map((v) => ({ id: v, label: v })),
  },
  {
    field: 'group',
    label: 'Role group',
    items: ORG_ROLES.map((v) => ({ id: v, label: v })),
  },
  {
    field: 'employmentType',
    label: 'Employment type',
    items: ORG_EMPLOYMENT_TYPES.map((v) => ({ id: v, label: v })),
  },
  {
    field: 'employee',
    label: 'Individual employees',
    items: ORG_EMPLOYEES.map((e) => ({
      id: e.id,
      label: `${e.name} (${e.company})`,
    })),
  },
]
