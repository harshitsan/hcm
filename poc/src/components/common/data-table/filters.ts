import type { CellValue, ColumnType } from './spec'

export interface TextFilter {
  kind: 'text'
  query: string
}
export interface RangeFilter {
  kind: 'range'
  min: number | null
  max: number | null
}
export interface FacetFilter {
  kind: 'facet'
  selected: readonly string[]
}
export interface DateRangeFilter {
  kind: 'dateRange'
  from: string | null
  to: string | null
}

export type FilterValue =
  | TextFilter
  | RangeFilter
  | FacetFilter
  | DateRangeFilter

/** The control a column gets is derived from its type. */
export function emptyFilterFor(type: ColumnType): FilterValue {
  switch (type) {
    case 'number':
      return { kind: 'range', min: null, max: null }
    case 'date':
      return { kind: 'dateRange', from: null, to: null }
    case 'enum':
    case 'badge':
      return { kind: 'facet', selected: [] }
    case 'string':
    default:
      return { kind: 'text', query: '' }
  }
}

export function isFilterActive(v: FilterValue): boolean {
  switch (v.kind) {
    case 'text':
      return v.query.trim().length > 0
    case 'range':
      return v.min !== null || v.max !== null
    case 'facet':
      return v.selected.length > 0
    case 'dateRange':
      return v.from !== null || v.to !== null
  }
}

export function matchesFilter(cell: CellValue, v: FilterValue): boolean {
  if (!isFilterActive(v)) return true
  if (cell === null) return false

  switch (v.kind) {
    case 'text':
      return String(cell).toLowerCase().includes(v.query.trim().toLowerCase())
    case 'range': {
      const n = Number(cell)
      if (Number.isNaN(n)) return false
      if (v.min !== null && n < v.min) return false
      if (v.max !== null && n > v.max) return false
      return true
    }
    case 'facet':
      return v.selected.includes(String(cell))
    case 'dateRange': {
      const t = new Date(cell as Date).getTime()
      if (Number.isNaN(t)) return false
      if (v.from !== null && t < new Date(v.from).getTime()) return false
      if (v.to !== null && t > new Date(v.to).getTime()) return false
      return true
    }
  }
}

export function countActiveFilters(
  values: Record<string, FilterValue>
): number {
  return Object.values(values).filter(isFilterActive).length
}
