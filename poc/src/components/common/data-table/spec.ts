import type { ReactNode } from 'react'

/**
 * The load-bearing field. A column's type derives BOTH its sort comparator
 * and its filter control, so platform-wide rules ("strings sort A-Z, numbers
 * asc/desc") are a property of the type rather than 333 hand-written headers.
 */
export type ColumnType = 'string' | 'number' | 'date' | 'enum' | 'badge'

export type CellValue = string | number | Date | null

export interface ColumnSpec<T> {
  id: string
  header: string
  type: ColumnType
  accessor: (row: T) => CellValue
  /** Custom-columns menu. Defaults to 'visible'. */
  default?: 'visible' | 'hidden'
  /** Identity and action columns: can never be hidden. */
  required?: boolean
  /**
   * Filter layering. 'quick' = a chip in the toolbar; 'more' = the drawer;
   * false = sortable and hideable but not filterable; omitted = not filterable.
   */
  filter?: 'quick' | 'more' | false
  /** Renders in the expanded row rather than in the grid. */
  detail?: boolean
  cell?: (row: T) => ReactNode
}

export interface TableSpec<T> {
  /** Stable id — used as the localStorage key for column visibility. */
  id: string
  columns: ColumnSpec<T>[]
  defaultSort?: { id: string; dir: 'asc' | 'desc' }
  /** Platform rule: rows matching this always lead, whatever the active sort. */
  primaryFirst?: (row: T) => boolean
  /** Opt-in. 'table' is implicit and always present. */
  views?: ('card' | 'list')[]
  /** Add never edits inline — it routes to the real add experience. */
  add?: { label: string; onAdd: () => void }
  rowHref?: (row: T) => string
  /**
   * Concatenated searchable text for a row, used by the toolbar's search box
   * and SpecTable's `searchQuery` prop. When present, the toolbar switches
   * from the required-string-column search to this multi-field search.
   */
  search?: (row: T) => string
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base' })

/** Nulls always sort last, whichever direction the user picked. */
export function comparatorFor(
  type: ColumnType
): (a: CellValue, b: CellValue) => number {
  return (a, b) => {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1

    switch (type) {
      case 'number':
        return Number(a) - Number(b)
      case 'date':
        return new Date(a as Date).getTime() - new Date(b as Date).getTime()
      case 'string':
      case 'enum':
      case 'badge':
      default:
        return collator.compare(String(a), String(b))
    }
  }
}
