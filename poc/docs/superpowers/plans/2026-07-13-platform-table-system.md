# Platform Table System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 333 inconsistently-built tables with one declarative `TableSpec` where a column's `type` derives its sort comparator and filter control — then convert 7 flagship tables onto it.

**Architecture:** A pure, React-free `spec.ts` module defines `ColumnSpec`/`TableSpec` and compiles them into TanStack `ColumnDef[]`. The existing `DataTable` (which already has TanStack, sorting, selection, pinning, virtualization) is extended with real filtering, column visibility, and row expansion. A new `TableToolbar` renders search, quick filters, a More-filters drawer, a Columns menu, an opt-in view switcher, and an Add button.

**Tech Stack:** React 19.1, TypeScript 5.9 (strict), `@tanstack/react-table` 8.21, `@tanstack/react-virtual` 3.13, Tailwind v4, Vite 7. Test runner: Vitest 3 + happy-dom + @testing-library/react (added in Task 1 — **none exists today**).

## Global Constraints

- **Working directory is `poc/`.** All paths below are relative to `/Users/harshitsan/Documents/heliverse/hcm/poc`.
- **Code style:** single quotes, **no semicolons**, `type`-only imports where applicable (`import { type ColumnDef }`). Match the surrounding files.
- **No `any`.** `tsc -b` must stay clean; run it before every commit.
- **Use `cn` from `@/utils/helpers`** for class merging — it is `twMerge(clsx(...))`, so later classes override earlier ones.
- **Do not restyle buttons.** The `Button` `default` variant is the brand Signal orange (`bg-orange-1200`); `outline` is the secondary. Use existing variants.
- **`spec.ts` must have zero React and zero store imports** — it is pure data + predicates, so it can be unit-tested without a DOM.
- **Never break the existing `DataTable` callers.** 123 instances across 87 files pass `columns: ColumnDef[]` directly. Every new prop is optional and every new behaviour is opt-in; the legacy call signature must keep working untouched.

---

## Task 1: Test infrastructure

There is **no test runner, no test file, and no testing dependency** in this repo today (`package.json` `"test": "echo 'No tests configured yet' && exit 0"`). Every later task is TDD, so this must exist first.

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Test: `src/test/sanity.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test` (Vitest, happy-dom env, `@testing-library/react` available, globals enabled).

- [ ] **Step 1: Install test dependencies**

```bash
npm i -D vitest@^3.2.4 happy-dom@^15.11.7 @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 @testing-library/user-event@^14.5.2
```

- [ ] **Step 2: Create the setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 3: Add the Vitest config to `vite.config.ts`**

Add a `test` key to the exported config object (keep every existing key — plugins, resolve.alias — untouched):

```ts
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
```

If `vite.config.ts` uses `defineConfig` from `'vite'`, change the import to `import { defineConfig } from 'vitest/config'` so the `test` key typechecks.

- [ ] **Step 4: Replace the `test` script in `package.json`**

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 5: Write the sanity test**

Create `src/test/sanity.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run it**

Run: `npm test`
Expected: PASS — `1 passed`. (Before Step 4 it would have printed "No tests configured yet".)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/test/
git commit -m "test: add vitest + testing-library harness

No test runner existed. Every subsequent task is TDD and needs one."
```

---

## Task 2: `spec.ts` — types and type-derived sort comparators

The load-bearing idea: a column cannot exist without a `type`, and a `type` cannot exist without a comparator. This is what makes "every table sorts by default, strings A–Z, numbers asc/desc" structural rather than 333 hand-written sort buttons.

**Files:**
- Create: `src/components/common/data-table/spec.ts`
- Test: `src/components/common/data-table/spec.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ColumnType = 'string' | 'number' | 'date' | 'enum' | 'badge'`
  - `interface ColumnSpec<T>` / `interface TableSpec<T>` (full shapes below)
  - `comparatorFor(type: ColumnType): (a: CellValue, b: CellValue) => number`
  - `type CellValue = string | number | Date | null`

- [ ] **Step 1: Write the failing test**

Create `src/components/common/data-table/spec.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { comparatorFor } from './spec'

describe('comparatorFor', () => {
  it('sorts strings A to Z, case-insensitively', () => {
    const cmp = comparatorFor('string')
    expect(['banana', 'Apple', 'cherry'].sort(cmp)).toEqual([
      'Apple',
      'banana',
      'cherry',
    ])
  })

  it('sorts numbers ascending', () => {
    const cmp = comparatorFor('number')
    expect([100, 5, 20].sort(cmp)).toEqual([5, 20, 100])
  })

  it('does not sort numbers lexicographically', () => {
    const cmp = comparatorFor('number')
    expect([100, 5, 20].sort(cmp)).not.toEqual([100, 20, 5])
  })

  it('sorts dates oldest first', () => {
    const cmp = comparatorFor('date')
    const a = new Date('2026-01-01')
    const b = new Date('2025-01-01')
    expect([a, b].sort(cmp)).toEqual([b, a])
  })

  it('sorts nulls last regardless of type', () => {
    const cmp = comparatorFor('number')
    expect([null, 3, null, 1].sort(cmp)).toEqual([1, 3, null, null])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- spec.test.ts`
Expected: FAIL — `Failed to resolve import "./spec"`.

- [ ] **Step 3: Write `spec.ts`**

Create `src/components/common/data-table/spec.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- spec.test.ts`
Expected: PASS — 5 passed.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc -b && npm test -- spec.test.ts
git add src/components/common/data-table/spec.ts src/components/common/data-table/spec.test.ts
git commit -m "feat(table): TableSpec types + type-derived sort comparators"
```

---

## Task 3: Type-derived filter predicates

This also **fixes the bug** that `DataTable`'s filters never filter — `defaultColumn.filterFn` currently hardcodes `return true` (`table.tsx:150-156`), so a filter value only floats matches to the top.

**Files:**
- Create: `src/components/common/data-table/filters.ts`
- Test: `src/components/common/data-table/filters.test.ts`

**Interfaces:**
- Consumes: `ColumnType`, `CellValue` from Task 2's `./spec`.
- Produces:
  - `type FilterValue = TextFilter | RangeFilter | FacetFilter | DateRangeFilter`
  - `emptyFilterFor(type: ColumnType): FilterValue`
  - `isFilterActive(v: FilterValue): boolean`
  - `matchesFilter(cell: CellValue, v: FilterValue): boolean`
  - `countActiveFilters(values: Record<string, FilterValue>): number`

- [ ] **Step 1: Write the failing test**

Create `src/components/common/data-table/filters.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  countActiveFilters,
  emptyFilterFor,
  isFilterActive,
  matchesFilter,
} from './filters'

describe('emptyFilterFor', () => {
  it('gives a number column a range filter', () => {
    expect(emptyFilterFor('number')).toEqual({
      kind: 'range',
      min: null,
      max: null,
    })
  })

  it('gives an enum column a facet filter', () => {
    expect(emptyFilterFor('enum')).toEqual({ kind: 'facet', selected: [] })
  })

  it('gives a string column a text filter', () => {
    expect(emptyFilterFor('string')).toEqual({ kind: 'text', query: '' })
  })
})

describe('isFilterActive', () => {
  it('is false for an empty range', () => {
    expect(isFilterActive({ kind: 'range', min: null, max: null })).toBe(false)
  })

  it('is true when only a min is set', () => {
    expect(isFilterActive({ kind: 'range', min: 10, max: null })).toBe(true)
  })

  it('is false for a whitespace-only text query', () => {
    expect(isFilterActive({ kind: 'text', query: '   ' })).toBe(false)
  })
})

describe('matchesFilter', () => {
  it('range filter excludes rows outside the bounds', () => {
    const f = { kind: 'range', min: 100, max: 500 } as const
    expect(matchesFilter(250, f)).toBe(true)
    expect(matchesFilter(50, f)).toBe(false)
    expect(matchesFilter(900, f)).toBe(false)
  })

  it('range filter with only a min excludes rows below it', () => {
    const f = { kind: 'range', min: 100, max: null } as const
    expect(matchesFilter(900, f)).toBe(true)
    expect(matchesFilter(50, f)).toBe(false)
  })

  it('facet filter matches any selected value', () => {
    const f = { kind: 'facet', selected: ['India', 'US'] } as const
    expect(matchesFilter('India', f)).toBe(true)
    expect(matchesFilter('UK', f)).toBe(false)
  })

  it('text filter matches case-insensitive substrings', () => {
    const f = { kind: 'text', query: 'acme' } as const
    expect(matchesFilter('ACME Holdings', f)).toBe(true)
    expect(matchesFilter('Globex', f)).toBe(false)
  })

  it('an inactive filter matches everything', () => {
    expect(matchesFilter(null, { kind: 'text', query: '' })).toBe(true)
  })
})

describe('countActiveFilters', () => {
  it('counts only the active ones', () => {
    const n = countActiveFilters({
      a: { kind: 'text', query: 'x' },
      b: { kind: 'range', min: null, max: null },
      c: { kind: 'facet', selected: ['India'] },
    })
    expect(n).toBe(2)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- filters.test.ts`
Expected: FAIL — cannot resolve `./filters`.

- [ ] **Step 3: Write `filters.ts`**

Create `src/components/common/data-table/filters.ts`:

```ts
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
  selected: string[]
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- filters.test.ts`
Expected: PASS — 11 passed.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc -b && npm test
git add src/components/common/data-table/filters.ts src/components/common/data-table/filters.test.ts
git commit -m "feat(table): type-derived filter predicates (text/range/facet/dateRange)"
```

---

## Task 4: `buildColumns` — compile a TableSpec into TanStack ColumnDefs

**Files:**
- Create: `src/components/common/data-table/build-columns.tsx`
- Test: `src/components/common/data-table/build-columns.test.ts`

**Interfaces:**
- Consumes: `ColumnSpec`, `TableSpec`, `comparatorFor` (Task 2); `matchesFilter`, `FilterValue` (Task 3).
- Produces:
  - `buildColumns<T>(spec: TableSpec<T>): ColumnDef<T>[]` — grid columns only (excludes `detail: true`)
  - `detailColumns<T>(spec: TableSpec<T>): ColumnSpec<T>[]` — the expanded-row fields
  - `initialVisibility<T>(spec: TableSpec<T>): Record<string, boolean>`
  - `facetOptionsFor<T>(spec, rows, columnId): string[]`

- [ ] **Step 1: Write the failing test**

Create `src/components/common/data-table/build-columns.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildColumns,
  detailColumns,
  facetOptionsFor,
  initialVisibility,
} from './build-columns'
import type { TableSpec } from './spec'

interface Co {
  name: string
  employees: number
  region: string
  tier: string
}

const rows: Co[] = [
  { name: 'Acme', employees: 500, region: 'India', tier: 'Basic' },
  { name: 'Globex', employees: 20, region: 'US', tier: 'Enterprise' },
  { name: 'Initech', employees: 900, region: 'India', tier: 'Basic' },
]

const spec: TableSpec<Co> = {
  id: 'test-companies',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name, required: true },
    { id: 'employees', header: 'Employees', type: 'number', accessor: (r) => r.employees, filter: 'more' },
    { id: 'region', header: 'Region', type: 'enum', accessor: (r) => r.region, filter: 'quick' },
    { id: 'tier', header: 'Tier', type: 'enum', accessor: (r) => r.tier, default: 'hidden', detail: true },
  ],
}

describe('buildColumns', () => {
  it('excludes detail columns from the grid', () => {
    const ids = buildColumns(spec).map((c) => c.id)
    expect(ids).toEqual(['name', 'employees', 'region'])
    expect(ids).not.toContain('tier')
  })

  it('marks required columns as non-hideable', () => {
    const name = buildColumns(spec).find((c) => c.id === 'name')
    expect(name?.enableHiding).toBe(false)
  })

  it('attaches a filterFn that actually excludes rows', () => {
    const employees = buildColumns(spec).find((c) => c.id === 'employees')
    const fn = employees?.filterFn as unknown as (
      row: { getValue: (id: string) => unknown },
      id: string,
      value: unknown
    ) => boolean
    const row = { getValue: () => 20 }
    expect(fn(row, 'employees', { kind: 'range', min: 100, max: null })).toBe(false)
    expect(fn(row, 'employees', { kind: 'range', min: 10, max: null })).toBe(true)
  })
})

describe('detailColumns', () => {
  it('returns only the detail-flagged columns', () => {
    expect(detailColumns(spec).map((c) => c.id)).toEqual(['tier'])
  })
})

describe('initialVisibility', () => {
  it('hides columns marked default hidden and shows the rest', () => {
    expect(initialVisibility(spec)).toEqual({
      name: true,
      employees: true,
      region: true,
      tier: false,
    })
  })
})

describe('facetOptionsFor', () => {
  it('returns the sorted unique values present in the data', () => {
    expect(facetOptionsFor(spec, rows, 'region')).toEqual(['India', 'US'])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- build-columns.test.ts`
Expected: FAIL — cannot resolve `./build-columns`.

- [ ] **Step 3: Write `build-columns.tsx`**

Create `src/components/common/data-table/build-columns.tsx`:

```tsx
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- build-columns.test.ts`
Expected: PASS — 6 passed.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc -b && npm test
git add src/components/common/data-table/build-columns.tsx src/components/common/data-table/build-columns.test.ts
git commit -m "feat(table): compile TableSpec into TanStack ColumnDefs with real filterFn"
```

---

## Task 5: `primaryFirst` — the platform-wide "primary sorts to top" rule

**Files:**
- Modify: `src/components/common/data-table/build-columns.tsx`
- Test: `src/components/common/data-table/primary-first.test.ts`

**Interfaces:**
- Consumes: `TableSpec` (Task 2).
- Produces: `applyPrimaryFirst<T>(rows: T[], spec: TableSpec<T>): T[]` — a **stable** pre-sort that leaves the user's active sort intact within each group.

- [ ] **Step 1: Write the failing test**

Create `src/components/common/data-table/primary-first.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { applyPrimaryFirst } from './build-columns'
import type { TableSpec } from './spec'

interface J {
  name: string
  isPrimary: boolean
}

const spec: TableSpec<J> = {
  id: 'jurisdictions',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name },
  ],
  primaryFirst: (r) => r.isPrimary,
}

describe('applyPrimaryFirst', () => {
  it('lifts the primary row to the top', () => {
    const rows: J[] = [
      { name: 'Karnataka', isPrimary: false },
      { name: 'Maharashtra', isPrimary: true },
      { name: 'Delhi', isPrimary: false },
    ]
    expect(applyPrimaryFirst(rows, spec).map((r) => r.name)).toEqual([
      'Maharashtra',
      'Karnataka',
      'Delhi',
    ])
  })

  it('is stable — preserves the incoming sort within each group', () => {
    const rows: J[] = [
      { name: 'Alpha', isPrimary: false },
      { name: 'Beta', isPrimary: false },
      { name: 'Zulu', isPrimary: true },
    ]
    expect(applyPrimaryFirst(rows, spec).map((r) => r.name)).toEqual([
      'Zulu',
      'Alpha',
      'Beta',
    ])
  })

  it('is a no-op when the spec declares no primaryFirst', () => {
    const noPrimary: TableSpec<J> = { ...spec, primaryFirst: undefined }
    const rows: J[] = [
      { name: 'A', isPrimary: false },
      { name: 'B', isPrimary: true },
    ]
    expect(applyPrimaryFirst(rows, noPrimary).map((r) => r.name)).toEqual(['A', 'B'])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- primary-first.test.ts`
Expected: FAIL — `applyPrimaryFirst` is not exported.

- [ ] **Step 3: Append `applyPrimaryFirst` to `build-columns.tsx`**

```tsx
/**
 * Platform rule: anything marked primary always leads, whatever the active
 * column sort. Partitioning (rather than a comparator) keeps it stable, so the
 * user's sort survives inside each group.
 */
export function applyPrimaryFirst<T>(rows: T[], spec: TableSpec<T>): T[] {
  const isPrimary = spec.primaryFirst
  if (!isPrimary) return rows
  const primary: T[] = []
  const rest: T[] = []
  for (const r of rows) (isPrimary(r) ? primary : rest).push(r)
  return [...primary, ...rest]
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- primary-first.test.ts`
Expected: PASS — 3 passed.

- [ ] **Step 5: Commit**

```bash
npx tsc -b && npm test
git add src/components/common/data-table/
git commit -m "feat(table): primary-first stable pre-sort (platform-wide rule)"
```

---

## Task 6: Persisted column visibility

**Files:**
- Create: `src/components/common/data-table/use-table-state.ts`
- Test: `src/components/common/data-table/use-table-state.test.ts`

**Interfaces:**
- Consumes: `initialVisibility`, `TableSpec`.
- Produces: `useColumnVisibility<T>(spec)` → `{ visibility, setVisibility, resetVisibility }`, persisted at `localStorage['shr-cols-<spec.id>']`.

- [ ] **Step 1: Write the failing test**

Create `src/components/common/data-table/use-table-state.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { TableSpec } from './spec'
import { useColumnVisibility } from './use-table-state'

interface R { a: string; b: string }

const spec: TableSpec<R> = {
  id: 'demo',
  columns: [
    { id: 'a', header: 'A', type: 'string', accessor: (r) => r.a, required: true },
    { id: 'b', header: 'B', type: 'string', accessor: (r) => r.b, default: 'hidden' },
  ],
}

describe('useColumnVisibility', () => {
  beforeEach(() => localStorage.clear())

  it('seeds from the spec defaults', () => {
    const { result } = renderHook(() => useColumnVisibility(spec))
    expect(result.current.visibility).toEqual({ a: true, b: false })
  })

  it('persists a change to localStorage', () => {
    const { result } = renderHook(() => useColumnVisibility(spec))
    act(() => result.current.setVisibility({ a: true, b: true }))
    expect(JSON.parse(localStorage.getItem('shr-cols-demo')!)).toEqual({
      a: true,
      b: true,
    })
  })

  it('rehydrates a persisted value on mount', () => {
    localStorage.setItem('shr-cols-demo', JSON.stringify({ a: true, b: true }))
    const { result } = renderHook(() => useColumnVisibility(spec))
    expect(result.current.visibility.b).toBe(true)
  })

  it('resets back to the spec defaults', () => {
    localStorage.setItem('shr-cols-demo', JSON.stringify({ a: true, b: true }))
    const { result } = renderHook(() => useColumnVisibility(spec))
    act(() => result.current.resetVisibility())
    expect(result.current.visibility).toEqual({ a: true, b: false })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- use-table-state.test.ts`
Expected: FAIL — cannot resolve `./use-table-state`.

- [ ] **Step 3: Write `use-table-state.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import { initialVisibility } from './build-columns'
import type { TableSpec } from './spec'

const key = (id: string) => `shr-cols-${id}`

export function useColumnVisibility<T>(spec: TableSpec<T>) {
  const defaults = initialVisibility(spec)

  const [visibility, setVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem(key(spec.id))
    if (!saved) return defaults
    try {
      // Merge so that columns added to the spec since the value was saved
      // still appear, rather than silently vanishing.
      return { ...defaults, ...(JSON.parse(saved) as VisibilityState) }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    localStorage.setItem(key(spec.id), JSON.stringify(visibility))
  }, [spec.id, visibility])

  const resetVisibility = useCallback(() => {
    setVisibility(initialVisibility(spec))
  }, [spec])

  return { visibility, setVisibility, resetVisibility }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- use-table-state.test.ts`
Expected: PASS — 4 passed.

- [ ] **Step 5: Commit**

```bash
npx tsc -b && npm test
git add src/components/common/data-table/use-table-state.ts src/components/common/data-table/use-table-state.test.ts
git commit -m "feat(table): persisted column visibility keyed by spec id"
```

---

## Task 7: `SpecTable` — the spec-driven table component

Rather than rewriting `DataTable` (123 call sites depend on its exact signature), add a **sibling** that consumes a `TableSpec`, wires real filtering, column visibility and expansion, and drops the fixed-height virtualization assumption. `DataTable` keeps working untouched; converted features move to `SpecTable`.

**Files:**
- Create: `src/components/common/data-table/spec-table.tsx`
- Test: `src/components/common/data-table/spec-table.test.tsx`

**Interfaces:**
- Consumes: `buildColumns`, `detailColumns`, `applyPrimaryFirst`, `FilterValue`.
- Produces: `<SpecTable spec data filters visibility onVisibilityChange onRowClick />`.

**`SpecTable` is fully controlled for both `filters` and `visibility`.** It must **not** call `useColumnVisibility` itself: the page owns that state and passes it to *both* `TableToolbar` and `SpecTable`. If the table kept its own copy, toggling a column in the toolbar would update the page's copy while the table rendered from its own — the Columns menu would silently do nothing.

**Why not extend `DataTable`:** its virtualizer hardcodes `estimateSize: () => 40` and a fixed `h-[392px]` viewport (`table.tsx:490, 555`). Expanded rows have variable height, so the estimate must be replaced with `measureElement`. Changing that in place risks all 123 existing call sites.

- [ ] **Step 1: Write the failing test**

Create `src/components/common/data-table/spec-table.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { TableSpec } from './spec'
import { SpecTable } from './spec-table'

interface Co { name: string; employees: number; region: string; tier: string }

const rows: Co[] = [
  { name: 'Acme', employees: 500, region: 'India', tier: 'Basic' },
  { name: 'Globex', employees: 20, region: 'US', tier: 'Enterprise' },
]

const spec: TableSpec<Co> = {
  id: 'spec-table-test',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name, required: true },
    { id: 'employees', header: 'Employees', type: 'number', accessor: (r) => r.employees, filter: 'more' },
    { id: 'region', header: 'Region', type: 'enum', accessor: (r) => r.region, filter: 'quick' },
    { id: 'tier', header: 'Tier', type: 'enum', accessor: (r) => r.tier, detail: true },
  ],
}

// SpecTable is fully controlled — an empty visibility map means "all visible".
const shown = {}
const noop = () => {}

describe('SpecTable', () => {
  beforeEach(() => localStorage.clear())

  it('renders grid columns but not detail columns', () => {
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} />
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.queryByText('Tier')).not.toBeInTheDocument()
  })

  it('ACTUALLY filters rows out (the bug this fixes)', () => {
    render(
      <SpecTable
        spec={spec}
        data={rows}
        filters={{ employees: { kind: 'range', min: 100, max: null } }}
        visibility={shown}
        onVisibilityChange={noop}
      />
    )
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.queryByText('Globex')).not.toBeInTheDocument()
  })

  it('hides a column when visibility says so', () => {
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={{ region: false }} onVisibilityChange={noop} />
    )
    expect(screen.queryByText('Region')).not.toBeInTheDocument()
  })

  it('reveals detail fields when a row is expanded', async () => {
    const user = userEvent.setup()
    render(
      <SpecTable spec={spec} data={rows} filters={{}}
        visibility={shown} onVisibilityChange={noop} />
    )
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /expand row/i })[1])
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- spec-table.test.tsx`
Expected: FAIL — cannot resolve `./spec-table`.

- [ ] **Step 3: Write `spec-table.tsx`**

```tsx
import { useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { CaretDown, CaretUp, CaretUpDown } from 'phosphor-react'
import { cn } from '@/utils/helpers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { applyPrimaryFirst, buildColumns, detailColumns } from './build-columns'
import type { FilterValue } from './filters'
import type { TableSpec } from './spec'

interface SpecTableProps<T> {
  spec: TableSpec<T>
  data: T[]
  /** Column id -> active filter value. Owned by the page, shared with the toolbar. */
  filters: Record<string, FilterValue>
  /**
   * Owned by the page (via useColumnVisibility) and shared with the toolbar.
   * SpecTable must NOT keep its own copy, or the Columns menu would update the
   * page's state while the table rendered from a different one.
   */
  visibility: VisibilityState
  onVisibilityChange: (next: VisibilityState) => void
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function SpecTable<T>({
  spec,
  data,
  filters,
  visibility,
  onVisibilityChange,
  onRowClick,
  emptyMessage = 'No data available',
}: SpecTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(
    spec.defaultSort
      ? [{ id: spec.defaultSort.id, desc: spec.defaultSort.dir === 'desc' }]
      : []
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(() => buildColumns(spec), [spec])
  const details = useMemo(() => detailColumns(spec), [spec])
  const ordered = useMemo(() => applyPrimaryFirst(data, spec), [data, spec])

  const columnFilters = useMemo<ColumnFiltersState>(
    () => Object.entries(filters).map(([id, value]) => ({ id, value })),
    [filters]
  )

  const table = useReactTable({
    data: ordered,
    columns,
    state: { sorting, columnFilters, columnVisibility: visibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) =>
      onVisibilityChange(
        typeof updater === 'function' ? updater(visibility) : updater
      ),
    getRowCanExpand: () => details.length > 0,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div
      ref={containerRef}
      className='relative max-h-[600px] w-full overflow-y-auto rounded-md border'
    >
      <Table className='border-collapse'>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className='bg-neutral-100'>
              {details.length > 0 && <TableHead className='w-10' />}
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    <Button
                      variant='header'
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {sorted === 'asc' ? (
                        <CaretUp className='size-3.5' />
                      ) : sorted === 'desc' ? (
                        <CaretDown className='size-3.5' />
                      ) : (
                        <CaretUpDown className='text-neutral-2100 size-3.5' />
                      )}
                    </Button>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length + (details.length > 0 ? 1 : 0)}
                className='text-neutral-1000 h-24 text-center'
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <>
              <TableRow
                key={row.id}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(row.original)}
              >
                {details.length > 0 && (
                  <TableCell className='w-10'>
                    <Button
                      variant='icon2'
                      aria-label={`Expand row ${row.index + 1}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        row.toggleExpanded()
                      }}
                    >
                      {row.getIsExpanded() ? (
                        <CaretUp className='size-3.5' />
                      ) : (
                        <CaretDown className='size-3.5' />
                      )}
                    </Button>
                  </TableCell>
                )}
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              {row.getIsExpanded() && (
                <TableRow key={`${row.id}-detail`} className='bg-neutral-50'>
                  <TableCell
                    colSpan={row.getVisibleCells().length + 1}
                    className='px-6 py-3'
                  >
                    <dl className='grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4'>
                      {details.map((d) => (
                        <div key={d.id}>
                          <dt className='text-paragraph-sm text-neutral-1000'>
                            {d.header}
                          </dt>
                          <dd className='text-neutral-1900 text-sm font-medium'>
                            {d.cell
                              ? d.cell(row.original)
                              : String(d.accessor(row.original) ?? '—')}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- spec-table.test.tsx`
Expected: PASS — 3 passed. The second test is the one that matters: it proves filters now *remove* rows.

- [ ] **Step 5: Commit**

```bash
npx tsc -b && npm test
git add src/components/common/data-table/spec-table.tsx src/components/common/data-table/spec-table.test.tsx
git commit -m "feat(table): SpecTable — real filtering, column visibility, row expansion"
```

---

## Task 8: `TableToolbar`

**Files:**
- Create: `src/components/common/data-table/toolbar.tsx`
- Test: `src/components/common/data-table/toolbar.test.tsx`

**Interfaces:**
- Consumes: `TableSpec`, `FilterValue`, `emptyFilterFor`, `countActiveFilters`, `facetOptionsFor`.
- Produces: `<TableToolbar spec data filters onFiltersChange visibility onVisibilityChange view onViewChange />`

Layout, left → right:
`[ search ] [ quick facet chips ] [ More filters ▸(n) ] ······ [ ⚙ Columns ] [ ▦ views ] [ + Add ]`

- [ ] **Step 1: Write the failing test**

Create `src/components/common/data-table/toolbar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TableSpec } from './spec'
import { TableToolbar } from './toolbar'

interface Co { name: string; employees: number; region: string }

const rows: Co[] = [
  { name: 'Acme', employees: 500, region: 'India' },
  { name: 'Globex', employees: 20, region: 'US' },
]

const base: TableSpec<Co> = {
  id: 'toolbar-test',
  columns: [
    { id: 'name', header: 'Name', type: 'string', accessor: (r) => r.name, required: true },
    { id: 'employees', header: 'Employees', type: 'number', accessor: (r) => r.employees, filter: 'more' },
    { id: 'region', header: 'Region', type: 'enum', accessor: (r) => r.region, filter: 'quick' },
  ],
}

const noop = () => {}

describe('TableToolbar', () => {
  it('renders quick filters inline and keeps "more" filters out of the bar', () => {
    render(
      <TableToolbar spec={base} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop} />
    )
    expect(screen.getByRole('button', { name: /region/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^employees$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /more filters/i })).toBeInTheDocument()
  })

  it('shows the active filter count on the More filters trigger', () => {
    render(
      <TableToolbar spec={base} data={rows}
        filters={{ employees: { kind: 'range', min: 100, max: null } }}
        onFiltersChange={noop} visibility={{}} onVisibilityChange={noop} />
    )
    expect(screen.getByRole('button', { name: /more filters/i })).toHaveTextContent('1')
  })

  it('does not render a view switcher unless the spec opts in', () => {
    render(
      <TableToolbar spec={base} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop} />
    )
    expect(screen.queryByRole('button', { name: /card view/i })).not.toBeInTheDocument()
  })

  it('renders the view switcher when the spec declares views', () => {
    render(
      <TableToolbar spec={{ ...base, views: ['card'] }} data={rows} filters={{}}
        onFiltersChange={noop} visibility={{}} onVisibilityChange={noop}
        view='table' onViewChange={noop} />
    )
    expect(screen.getByRole('button', { name: /card view/i })).toBeInTheDocument()
  })

  it('fires the Add action instead of editing inline', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(
      <TableToolbar spec={{ ...base, add: { label: 'Add Company', onAdd } }}
        data={rows} filters={{}} onFiltersChange={noop}
        visibility={{}} onVisibilityChange={noop} />
    )
    await user.click(screen.getByRole('button', { name: /add company/i }))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('disables required columns in the Columns menu', async () => {
    const user = userEvent.setup()
    render(
      <TableToolbar spec={base} data={rows} filters={{}} onFiltersChange={noop}
        visibility={{ name: true, employees: true, region: true }}
        onVisibilityChange={noop} />
    )
    await user.click(screen.getByRole('button', { name: /columns/i }))
    expect(screen.getByRole('menuitemcheckbox', { name: /name/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- toolbar.test.tsx`
Expected: FAIL — cannot resolve `./toolbar`.

- [ ] **Step 3: Write `toolbar.tsx`**

Use the existing primitives: `Sheet` (`@/components/ui/sheet`) for the drawer, `DropdownMenu` + `DropdownMenuCheckboxItem` (`@/components/ui/dropdown-menu`) for Columns, `Input`, `Badge`, `Button`.

```tsx
import { useState } from 'react'
import { Funnel, Gear, Plus, SquaresFour, Table as TableIcon } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { facetOptionsFor } from './build-columns'
import {
  countActiveFilters,
  emptyFilterFor,
  isFilterActive,
  type FacetFilter,
  type FilterValue,
  type RangeFilter,
} from './filters'
import type { ColumnSpec, TableSpec } from './spec'

export type ViewMode = 'table' | 'card' | 'list'

interface TableToolbarProps<T> {
  spec: TableSpec<T>
  data: T[]
  filters: Record<string, FilterValue>
  onFiltersChange: (next: Record<string, FilterValue>) => void
  visibility: Record<string, boolean>
  onVisibilityChange: (next: Record<string, boolean>) => void
  view?: ViewMode
  onViewChange?: (v: ViewMode) => void
}

function FacetControl<T>({
  spec, data, col, value, onChange,
}: {
  spec: TableSpec<T>
  data: T[]
  col: ColumnSpec<T>
  value: FacetFilter
  onChange: (v: FilterValue) => void
}) {
  const options = facetOptionsFor(spec, data, col.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm'>
          {col.header}
          {value.selected.length > 0 && (
            <Badge variant='open'>{value.selected.length}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt}
            checked={value.selected.includes(opt)}
            onCheckedChange={(on) =>
              onChange({
                kind: 'facet',
                selected: on
                  ? [...value.selected, opt]
                  : value.selected.filter((s) => s !== opt),
              })
            }
          >
            {opt}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RangeControl({
  label, value, onChange,
}: {
  label: string
  value: RangeFilter
  onChange: (v: FilterValue) => void
}) {
  return (
    <div className='space-y-1'>
      <label className='text-paragraph-sm text-neutral-1000'>{label}</label>
      <div className='flex items-center gap-2'>
        <Input
          type='number'
          placeholder='Min'
          value={value.min ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              min: e.target.value === '' ? null : Number(e.target.value),
            })
          }
        />
        <span className='text-neutral-1000'>–</span>
        <Input
          type='number'
          placeholder='Max'
          value={value.max ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              max: e.target.value === '' ? null : Number(e.target.value),
            })
          }
        />
      </div>
    </div>
  )
}

export function TableToolbar<T>({
  spec, data, filters, onFiltersChange, visibility, onVisibilityChange,
  view = 'table', onViewChange,
}: TableToolbarProps<T>) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const quick = spec.columns.filter((c) => c.filter === 'quick')
  const more = spec.columns.filter((c) => c.filter === 'more')
  const searchCol = spec.columns.find(
    (c) => c.type === 'string' && c.required === true
  )
  const activeCount = countActiveFilters(filters)

  const valueFor = (c: ColumnSpec<T>): FilterValue =>
    filters[c.id] ?? emptyFilterFor(c.type)

  const set = (id: string, v: FilterValue) => {
    const next = { ...filters }
    if (isFilterActive(v)) next[id] = v
    else delete next[id]
    onFiltersChange(next)
  }

  return (
    <div className='flex flex-wrap items-center gap-2 pb-3'>
      {searchCol && (
        <Input
          className='max-w-64'
          placeholder={`Search ${searchCol.header.toLowerCase()}…`}
          value={
            (filters[searchCol.id] as { query?: string } | undefined)?.query ?? ''
          }
          onChange={(e) =>
            set(searchCol.id, { kind: 'text', query: e.target.value })
          }
        />
      )}

      {quick.map((c) => (
        <FacetControl
          key={c.id}
          spec={spec}
          data={data}
          col={c}
          value={valueFor(c) as FacetFilter}
          onChange={(v) => set(c.id, v)}
        />
      ))}

      {more.length > 0 && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant='outline' size='sm'>
              <Funnel className='size-3.5' />
              More filters
              {activeCount > 0 && <Badge variant='open'>{activeCount}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent className='space-y-4 p-6'>
            <SheetHeader>
              <SheetTitle>More filters</SheetTitle>
            </SheetHeader>
            {more.map((c) =>
              c.type === 'number' ? (
                <RangeControl
                  key={c.id}
                  label={c.header}
                  value={valueFor(c) as RangeFilter}
                  onChange={(v) => set(c.id, v)}
                />
              ) : (
                <FacetControl
                  key={c.id}
                  spec={spec}
                  data={data}
                  col={c}
                  value={valueFor(c) as FacetFilter}
                  onChange={(v) => set(c.id, v)}
                />
              )
            )}
            <Button variant='outline' onClick={() => onFiltersChange({})}>
              Clear filters {activeCount > 0 && `(${activeCount})`}
            </Button>
          </SheetContent>
        </Sheet>
      )}

      <div className='ms-auto flex items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Gear className='size-3.5' />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {spec.columns
              .filter((c) => c.detail !== true)
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={visibility[c.id] !== false}
                  disabled={c.required === true}
                  onCheckedChange={(on) =>
                    onVisibilityChange({ ...visibility, [c.id]: on })
                  }
                >
                  {c.header}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {spec.views && spec.views.length > 0 && onViewChange && (
          <div className='flex items-center rounded-md border'>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size='sm'
              aria-label='Table view'
              onClick={() => onViewChange('table')}
            >
              <TableIcon className='size-3.5' />
            </Button>
            {spec.views.includes('card') && (
              <Button
                variant={view === 'card' ? 'secondary' : 'ghost'}
                size='sm'
                aria-label='Card view'
                onClick={() => onViewChange('card')}
              >
                <SquaresFour className='size-3.5' />
              </Button>
            )}
          </div>
        )}

        {spec.add && (
          <Button onClick={spec.add.onAdd}>
            <Plus className='size-3.5' />
            {spec.add.label}
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- toolbar.test.tsx`
Expected: PASS — 6 passed.

If the Columns-menu assertion fails on `aria-disabled`, inspect what Radix's `DropdownMenuCheckboxItem` renders for `disabled` in this version and assert on that attribute instead — do not delete the assertion.

- [ ] **Step 5: Commit**

```bash
npx tsc -b && npm test
git add src/components/common/data-table/toolbar.tsx src/components/common/data-table/toolbar.test.tsx
git commit -m "feat(table): TableToolbar — search, quick filters, more-filters drawer, columns, views, add"
```

---

## Task 9: Barrel export + delete the dead `module-page` kit

`ModulePage`, `TableToolbar` and `CreateButton` in `src/components/module-page/` have **zero importers** — a shared table kit already existed and was never adopted. Deleting them now is safe and prevents a name collision with the new `TableToolbar`.

**Keep** `SummaryCards`, `DetailSheet`, `makeStatusBadge` — they have 21 real importers.

**Files:**
- Create: `src/components/common/data-table/index.ts`
- Modify: `src/components/module-page/index.ts`
- Delete: the `ModulePage` / `TableToolbar` / `CreateButton` source files in `src/components/module-page/`

- [ ] **Step 1: Verify the three are genuinely unimported**

Run:
```bash
grep -rn "ModulePage\|CreateButton" src/features/ | grep -v node_modules
grep -rn "from '@/components/module-page'" src/features/ | head
```
Expected: **no hits for `ModulePage` or `CreateButton`.** The second command shows only `SummaryCards` / `DetailSheet` / `makeStatusBadge` imports. If anything else appears, stop and convert that caller first.

- [ ] **Step 2: Create the barrel**

Create `src/components/common/data-table/index.ts`:

```ts
export { SpecTable } from './spec-table'
export { TableToolbar, type ViewMode } from './toolbar'
export {
  buildColumns,
  detailColumns,
  facetOptionsFor,
  applyPrimaryFirst,
  initialVisibility,
} from './build-columns'
export {
  countActiveFilters,
  emptyFilterFor,
  isFilterActive,
  matchesFilter,
  type FilterValue,
} from './filters'
export { comparatorFor, type CellValue, type ColumnSpec, type ColumnType, type TableSpec } from './spec'
export { useColumnVisibility } from './use-table-state'
```

- [ ] **Step 3: Remove the dead exports**

Delete the `ModulePage`, `TableToolbar` and `CreateButton` component files and drop their re-exports from `src/components/module-page/index.ts`, leaving `SummaryCards`, `DetailSheet`, `makeStatusBadge`, `FilterSelect`, `SearchInput`, `usePager`, `PagerControls` intact.

- [ ] **Step 4: Add a deprecation notice to `SimpleTable`**

`SimpleTable` has 16 instances across 11 files — do **not** delete it. Add at the top of `src/components/common/data-table/simple-table.tsx`:

```tsx
/**
 * @deprecated Use `SpecTable` with a `TableSpec` instead. This component shares
 * DataTable's never-filter quirk (filters only reorder, they do not exclude).
 * Delete once its 11 remaining callers are converted.
 */
```

- [ ] **Step 5: Verify nothing broke**

Run: `npx tsc -b && npm run lint && npm test`
Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/common/data-table/index.ts src/components/module-page/ src/components/common/data-table/simple-table.tsx
git commit -m "chore(table): barrel export; delete unadopted module-page kit; deprecate SimpleTable"
```

---

## Task 10: Flagship conversion #1 — Companies directory

The reference conversion. It exercises every feature: quick + more filters, a number range (employee count), expansion, custom columns, and Add-routes-out.

**Files:**
- Create: `src/features/companies/components/companies-table-spec.tsx`
- Modify: `src/features/companies/components/directory-tab.tsx`
- Test: `src/features/companies/components/companies-table-spec.test.ts`

**Interfaces:**
- Consumes: `TableSpec`, `SpecTable`, `TableToolbar`, `useColumnVisibility`, `FilterValue`.
- Produces: `companiesTableSpec(opts: { onAdd: () => void }): TableSpec<Company>`

- [ ] **Step 1: Write the failing test**

Create `src/features/companies/components/companies-table-spec.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { companiesTableSpec } from './companies-table-spec'

describe('companiesTableSpec', () => {
  const spec = companiesTableSpec({ onAdd: vi.fn() })

  it('exposes employee count as a number column filterable in the drawer', () => {
    const col = spec.columns.find((c) => c.id === 'employeeCount')
    expect(col?.type).toBe('number')
    expect(col?.filter).toBe('more')
  })

  it('puts jurisdiction on the surface as a quick filter', () => {
    expect(spec.columns.find((c) => c.id === 'jurisdiction')?.filter).toBe('quick')
  })

  it('keeps legal name always visible', () => {
    expect(spec.columns.find((c) => c.id === 'legalName')?.required).toBe(true)
  })

  it('puts subscription tier and usage in the expanded row, not the grid', () => {
    const detail = spec.columns.filter((c) => c.detail).map((c) => c.id)
    expect(detail).toContain('subscriptionTier')
    expect(detail).toContain('usage')
  })

  it('declares an Add action (routes out, never inline)', () => {
    expect(spec.add?.label).toBe('Add Company')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- companies-table-spec.test.ts`
Expected: FAIL — cannot resolve `./companies-table-spec`.

- [ ] **Step 3: Write the spec**

Create `src/features/companies/components/companies-table-spec.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'
import type { TableSpec } from '@/components/common/data-table'
import { primaryJurisdiction, type Company } from '../data/companies'

export function companiesTableSpec(opts: {
  onAdd: () => void
}): TableSpec<Company> {
  return {
    id: 'companies-directory',
    defaultSort: { id: 'legalName', dir: 'asc' },
    add: { label: 'Add Company', onAdd: opts.onAdd },
    columns: [
      {
        id: 'legalName',
        header: 'Company',
        type: 'string',
        required: true,
        accessor: (c) => c.legalName,
      },
      { id: 'code', header: 'Code', type: 'string', accessor: (c) => c.code },
      {
        id: 'jurisdiction',
        header: 'Jurisdiction',
        type: 'enum',
        filter: 'quick',
        accessor: (c) => primaryJurisdiction(c),
      },
      {
        id: 'status',
        header: 'Status',
        type: 'badge',
        filter: 'quick',
        accessor: (c) => c.status,
        cell: (c) => <Badge variant='open'>{c.status}</Badge>,
      },
      {
        id: 'employeeCount',
        header: 'Employees',
        type: 'number',
        filter: 'more',
        accessor: (c) => c.employeeCount,
      },
      {
        id: 'operatingModel',
        header: 'Operating model',
        type: 'enum',
        filter: 'more',
        default: 'hidden',
        accessor: (c) => c.operatingModel,
      },
      // Detail tier — "is this the row I want?", not "what is this thing?"
      {
        id: 'subscriptionTier',
        header: 'Subscription',
        type: 'enum',
        detail: true,
        accessor: (c) => c.subscriptionTier,
      },
      {
        id: 'usage',
        header: 'Employees used',
        type: 'string',
        detail: true,
        accessor: (c) => `${c.employeeCount} of ${c.employeeLimit}`,
      },
      {
        id: 'baseCurrency',
        header: 'Base currency',
        type: 'enum',
        detail: true,
        accessor: (c) => c.baseCurrency,
      },
    ],
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- companies-table-spec.test.ts`
Expected: PASS — 5 passed.

- [ ] **Step 5: Wire it into `directory-tab.tsx`**

Replace the existing `<DataTable columns={companiesTableColumns} …>` usage with:

```tsx
import {
  SpecTable,
  TableToolbar,
  useColumnVisibility,
  type FilterValue,
} from '@/components/common/data-table'
import { companiesTableSpec } from './companies-table-spec'

// …inside the component:
const [filters, setFilters] = useState<Record<string, FilterValue>>({})
const spec = useMemo(
  () => companiesTableSpec({ onAdd: () => setWizardOpen(true) }),
  []
)
// The PAGE owns visibility and hands the same state to both children.
const { visibility, setVisibility } = useColumnVisibility(spec)

// …in the JSX:
<TableToolbar
  spec={spec}
  data={companies}
  filters={filters}
  onFiltersChange={setFilters}
  visibility={visibility}
  onVisibilityChange={setVisibility}
/>
<SpecTable
  spec={spec}
  data={companies}
  filters={filters}
  visibility={visibility}
  onVisibilityChange={setVisibility}
  onRowClick={(c) => openDetail(c.id)}
/>
```

Both components receive the **same** `visibility` / `setVisibility` pair. Do not let `SpecTable` derive its own.

Keep the existing wizard/detail-sheet state and handlers exactly as they are — `onAdd` opens the same wizard the old Add button opened. **Do not** introduce an inline-editable row.

- [ ] **Step 6: Verify in the running app**

Run: `npx vite --port 5199`, open `http://localhost:5199/companies` as Platform Admin, then confirm each of:
1. Clicking **Company** sorts A→Z; clicking **Employees** sorts ascending, then descending.
2. **Columns** menu hides "Operating model"; it is hidden by default and "Company" is disabled.
3. Reload — the column choice persists.
4. **More filters** → set Employees min to 100 → **the row count drops** (this is the bug being fixed; today filters only reorder).
5. Expanding a row reveals Subscription, Employees-used, Base currency.
6. **Add Company** opens the wizard; no inline row appears.

- [ ] **Step 7: Commit**

```bash
npx tsc -b && npm run lint && npm test
git add src/features/companies/components/
git commit -m "feat(companies): convert directory table to TableSpec"
```

---

## Task 11: Flagship conversion #2 — Directory (proves the abstraction)

Directory is the feature this design generalizes: it is the only one with a view switcher, a card view, and advanced filters. Converting it proves the abstraction holds and removes a bespoke implementation.

**Note:** `features/directory/data/filters.ts` is **not** generic — every facet (`department`, `position`, `location`, `workGroup`, `employmentStatus`, `companyId`) is hard-coded to `Employee`. It is replaced by column-level `filter:` declarations, not lifted.

**Files:**
- Create: `src/features/directory/components/directory-table-spec.tsx`
- Modify: `src/features/directory/components/directory-tab.tsx`
- Delete: `src/features/directory/data/filters.ts`, `src/features/directory/components/advanced-search.tsx`
- Test: `src/features/directory/components/directory-table-spec.test.ts`

**Interfaces:**
- Produces: `directoryTableSpec(opts: { onAdd: () => void }): TableSpec<Employee>` with `views: ['card']`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'
import { directoryTableSpec } from './directory-table-spec'

describe('directoryTableSpec', () => {
  const spec = directoryTableSpec({ onAdd: vi.fn() })

  it('opts in to the card view (people data earns it)', () => {
    expect(spec.views).toEqual(['card'])
  })

  it('keeps name always visible', () => {
    expect(spec.columns.find((c) => c.id === 'name')?.required).toBe(true)
  })

  it('exposes department and location as quick filters', () => {
    const quick = spec.columns.filter((c) => c.filter === 'quick').map((c) => c.id)
    expect(quick).toContain('department')
    expect(quick).toContain('location')
  })

  it('demotes the rarely-used facets to the drawer', () => {
    const more = spec.columns.filter((c) => c.filter === 'more').map((c) => c.id)
    expect(more).toContain('workGroup')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- directory-table-spec.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `directory-table-spec.tsx`**

Create `src/features/directory/components/directory-table-spec.tsx`:

```tsx
import { Badge } from '@/components/ui/badge'
import type { TableSpec } from '@/components/common/data-table'
import type { Employee } from '../data/directory'

export function directoryTableSpec(opts: {
  onAdd: () => void
}): TableSpec<Employee> {
  return {
    id: 'directory',
    defaultSort: { id: 'name', dir: 'asc' },
    views: ['card'],
    add: { label: 'Add Employee', onAdd: opts.onAdd },
    columns: [
      {
        id: 'name',
        header: 'Name',
        type: 'string',
        required: true,
        accessor: (e) => e.name,
      },
      {
        id: 'employeeCode',
        header: 'Employee ID',
        type: 'string',
        accessor: (e) => e.employeeCode,
      },
      {
        id: 'department',
        header: 'Department',
        type: 'enum',
        filter: 'quick',
        accessor: (e) => e.department,
      },
      {
        id: 'position',
        header: 'Position',
        type: 'enum',
        filter: 'quick',
        accessor: (e) => e.position,
      },
      {
        id: 'location',
        header: 'Location',
        type: 'enum',
        filter: 'quick',
        accessor: (e) => e.location,
      },
      {
        id: 'employmentStatus',
        header: 'Status',
        type: 'badge',
        filter: 'quick',
        accessor: (e) => e.employmentStatus,
        cell: (e) => <Badge variant='open'>{e.employmentStatus}</Badge>,
      },
      // Rarely used — demoted to the drawer to keep the bar uncluttered.
      {
        id: 'workGroup',
        header: 'Work group',
        type: 'enum',
        filter: 'more',
        default: 'hidden',
        accessor: (e) => e.workGroup,
      },
      {
        id: 'companyId',
        header: 'Company',
        type: 'enum',
        filter: 'more',
        default: 'hidden',
        accessor: (e) => e.companyId,
      },
    ],
  }
}
```

- [ ] **Step 4: Rewire `directory-tab.tsx`**

Replace the `VIEW_MODES` segmented group, `<AdvancedSearch>` and the `applyFilters(...)` call with:

```tsx
import {
  SpecTable,
  TableToolbar,
  useColumnVisibility,
  type FilterValue,
  type ViewMode,
} from '@/components/common/data-table'
import { directoryTableSpec } from './directory-table-spec'

// …inside the component:
const [filters, setFilters] = useState<Record<string, FilterValue>>({})
const [view, setView] = useState<ViewMode>('table')
const spec = useMemo(
  () => directoryTableSpec({ onAdd: () => setAddOpen(true) }),
  []
)
const { visibility, setVisibility } = useColumnVisibility(spec)

// …in the JSX:
<TableToolbar
  spec={spec}
  data={employees}
  filters={filters}
  onFiltersChange={setFilters}
  visibility={visibility}
  onVisibilityChange={setVisibility}
  view={view}
  onViewChange={setView}
/>
{view === 'card' ? (
  <DirectoryCardView employees={employees} onSelect={openProfile} />
) : (
  <SpecTable
    spec={spec}
    data={employees}
    filters={filters}
    visibility={visibility}
    onVisibilityChange={setVisibility}
    onRowClick={openProfile}
  />
)}
```

Note the card branch still receives the **unfiltered** `employees`. If the card view must honour the active filters, hoist the filtering: derive `const visible = useMemo(() => employees.filter((e) => spec.columns.every((c) => matchesFilter(c.accessor(e), filters[c.id] ?? emptyFilterFor(c.type)))), [employees, filters, spec])` and pass `visible` to both branches. Do this — a filter that silently applies to one view but not the other is a bug.

- [ ] **Step 5: Delete the bespoke filter code**

```bash
git rm src/features/directory/data/filters.ts src/features/directory/components/advanced-search.tsx
grep -rn "applyFilters\|EMPTY_FILTERS\|AdvancedSearch\|countActiveFilters" src/features/directory/
```
Expected: no remaining references.

- [ ] **Step 6: Verify**

Run: `npx tsc -b && npm run lint && npm test`, then in the app confirm the card/table switcher still works and that filters now *exclude* rows.

- [ ] **Step 7: Commit**

```bash
git add -A src/features/directory/
git commit -m "feat(directory): convert to TableSpec; drop bespoke advanced-search + filters"
```

---

## Task 12: Flagship conversions #3–#7

Repeat the Task 10 recipe. Each is: write the `*-table-spec.tsx`, write its test, swap `<DataTable>`/hand-rolled `<Table>` for `<TableToolbar>` + `<SpecTable>`, delete the feature's forked toolbar, verify, commit. **One commit per feature** so each can be reviewed and reverted independently.

**Recruitment is the priority** — it has 40 hand-rolled tables and 1 shared, the worst ratio in the codebase.

| # | Feature | Files | Forked toolbar to delete |
|---|---|---|---|
| 12a | Recruitment | `src/features/recruitment/**` (40 hand-rolled tables) | — |
| 12b | Employees | `src/features/employees/**` (35 hand-rolled, 15 SimpleTable) | `src/features/employees/components/shared.tsx` |
| 12c | Leave requests | `src/features/leave/components/requests-tab.tsx` | `src/features/leave/components/list-controls.tsx` |
| 12d | Company subscriptions | `src/features/companies/components/subscriptions-tab.tsx` | — |
| 12e | Assets | `src/features/assets/**` (12 hand-rolled) | — |

For each, before starting:

- [ ] **Step 1: Inventory the feature's tables**

```bash
grep -rn "<DataTable\|<SimpleTable\|<Table\b" src/features/<feature>/ | wc -l
```

- [ ] **Step 2–7:** Follow Task 10, Steps 1–7 verbatim against that feature's row type.

- [ ] **Step 8: When a feature's last `SimpleTable` caller is gone, check whether it can be deleted**

```bash
grep -rn "SimpleTable" src/features/ | wc -l
```
If this reaches `0`, delete `src/components/common/data-table/simple-table.tsx` and commit separately.

---

## Task 13: Final verification

- [ ] **Step 1: Full check**

```bash
npx tsc -b && npm run lint && npm test
```
Expected: clean; all tests pass.

- [ ] **Step 2: Confirm the headline bug is dead**

```bash
grep -rn "Always return true so all rows remain visible" src/
```
Expected: only inside the legacy `table.tsx` (unconverted callers still rely on it). It must **not** appear in `spec-table.tsx` or `build-columns.tsx`.

- [ ] **Step 3: Drive the app**

Run `npx vite --port 5199` and walk the Task 10 Step 6 checklist on each converted feature. Confirm unconverted tables still render (the legacy `DataTable` path is untouched).

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore(table): platform table system complete — 7 flagships converted"
```

---

## Deferred (not this plan)

- Converting the remaining ~110 hand-rolled table files — done opportunistically when each is next touched.
- Virtualization inside `SpecTable`. It renders all filtered rows; the largest flagship dataset is small enough that this is fine. If a converted table exceeds ~500 rows, add `@tanstack/react-virtual` with `measureElement` (**not** the legacy fixed `estimateSize: () => 40` / `h-[392px]`, which cannot accommodate expanded rows).
- The other eight workstreams from 2026-07-13 (W1, W3–W9), including the company field guardrails spec.
