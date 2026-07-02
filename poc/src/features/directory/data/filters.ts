import { type Employee } from './directory'

/**
 * Advanced-search criteria (DIR-06). All facets combine with AND; 'all'
 * means the facet is not constraining. Custom-field filters are keyed by
 * custom-field definition id (DIR-20/22).
 */
export interface DirectoryFilters {
  /** Free-text match on name or employee ID. */
  query: string
  department: string
  position: string
  location: string
  workGroup: string
  employmentStatus: string
  /** 'all' or a specific company id (cross-company scopes only, DIR-09/12). */
  companyId: string
  custom: Record<string, string>
}

export const EMPTY_FILTERS: DirectoryFilters = {
  query: '',
  department: 'all',
  position: 'all',
  location: 'all',
  workGroup: 'all',
  employmentStatus: 'all',
  companyId: 'all',
  custom: {},
}

export function countActiveFilters(f: DirectoryFilters): number {
  let n = 0
  if (f.query.trim()) n += 1
  if (f.department !== 'all') n += 1
  if (f.position !== 'all') n += 1
  if (f.location !== 'all') n += 1
  if (f.workGroup !== 'all') n += 1
  if (f.employmentStatus !== 'all') n += 1
  if (f.companyId !== 'all') n += 1
  n += Object.values(f.custom).filter((v) => v && v !== 'all').length
  return n
}

/** Applies every active facet with AND semantics (DIR-06 AC 2). */
export function applyFilters(
  employees: Employee[],
  filters: DirectoryFilters
): Employee[] {
  const q = filters.query.trim().toLowerCase()
  return employees.filter((e) => {
    if (
      q &&
      !e.name.toLowerCase().includes(q) &&
      !e.employeeCode.toLowerCase().includes(q)
    )
      return false
    if (filters.department !== 'all' && e.department !== filters.department)
      return false
    if (filters.position !== 'all' && e.position !== filters.position)
      return false
    if (filters.location !== 'all' && e.location !== filters.location)
      return false
    if (filters.workGroup !== 'all' && e.workGroup !== filters.workGroup)
      return false
    if (
      filters.employmentStatus !== 'all' &&
      e.employmentStatus !== filters.employmentStatus
    )
      return false
    if (filters.companyId !== 'all' && e.companyId !== filters.companyId)
      return false
    for (const [fieldId, value] of Object.entries(filters.custom)) {
      if (value && value !== 'all') {
        const actual = (e.customFields[fieldId] ?? '').toLowerCase()
        if (!actual.includes(value.toLowerCase())) return false
      }
    }
    return true
  })
}
