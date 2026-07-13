import type { ColumnDef, Row } from '@tanstack/react-table'
import { matchesFilter, type FilterValue } from './filters'
import { comparatorFor, type CellValue, type ColumnSpec, type TableSpec } from './spec'

/** Columns that render in the expanded row rather than the grid. */
export function detailColumns<T>(spec: TableSpec<T>): ColumnSpec<T>[] {
  return spec.columns.filter((c) => c.detail === true)
}

export function initialVisibility<T>(
  spec: TableSpec<T>
): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const c of spec.columns) out[c.id] = c.default !== 'hidden'
  return out
}

/** Unique, sorted values actually present in the data — powers facet controls. */
export function facetOptionsFor<T>(
  spec: TableSpec<T>,
  rows: T[],
  columnId: string
): string[] {
  const col = spec.columns.find((c) => c.id === columnId)
  if (!col) return []
  const set = new Set<string>()
  for (const r of rows) {
    const v = col.accessor(r)
    if (v !== null && v !== '') set.add(String(v))
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function buildColumns<T>(spec: TableSpec<T>): ColumnDef<T>[] {
  return spec.columns
    .filter((c) => c.detail !== true)
    .map((c): ColumnDef<T> => {
      const cmp = comparatorFor(c.type)
      return {
        id: c.id,
        header: c.header,
        accessorFn: (row) => c.accessor(row),
        enableHiding: c.required !== true,
        enableSorting: true,
        // Real filtering. Replaces the `return true` stub that made every
        // filter a no-op (table.tsx:150-156).
        filterFn: (row: Row<T>, columnId: string, value: unknown) =>
          matchesFilter(
            row.getValue(columnId) as CellValue,
            value as FilterValue
          ),
        sortingFn: (a: Row<T>, b: Row<T>, columnId: string) =>
          cmp(a.getValue(columnId) as CellValue, b.getValue(columnId) as CellValue),
        cell: c.cell
          ? ({ row }) => c.cell!(row.original)
          : ({ getValue }) => {
              const v = getValue() as CellValue
              if (v === null) return '—'
              if (v instanceof Date) return v.toLocaleDateString()
              return String(v)
            },
      }
    })
}
