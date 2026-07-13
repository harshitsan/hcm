# Platform table system — declarative columns, layered filters, expansion, views

**Date:** 2026-07-13
**Status:** Approved (design)
**Scope:** W2 of nine workstreams (see §10). Build the system; convert ~7 flagship tables. Others keep working untouched.

---

## 1. Context

The platform has **333 table instances across 32 features**, and they behave inconsistently:

| Category | Instances | Files |
|---|---|---|
| Shared `DataTable` | 123 | 87 |
| Shared `SimpleTable` | 16 | 11 |
| **Hand-rolled `<Table>` markup** | **194** | **112** |

**58% of tables are hand-rolled** and have *no user-facing sorting at all* — `grep` for `TableHead … onClick` across those 112 files returns **zero**. Twenty-two of them apply a static `.sort()` before render, so the order is fixed and not user-controllable.

What the shared `DataTable` (`src/components/common/data-table/table.tsx`, 788 lines) has today: sorting (`getSortedRowModel`, `:142`), row selection (`:116, 144`), column pinning (`:124-127`), virtualization (`:487-494`), loading/error states.

What it does **not** have: column visibility, expandable rows, pagination, a toolbar, an Add button, quick filters, a "more filters" drawer, or view switching. All greenfield.

**And its filters do not filter.** `defaultColumn.filterFn` hardcodes `return true` (`table.tsx:150-156`); a filter value merely floats matching rows to the top (`:402-422`) and highlights cells. Real filtering, where it happens at all, happens in the caller.

### Two things that already exist

**Directory is the reference implementation.** It is the only feature with a view switcher (`directory-tab.tsx:48-60`, `VIEW_MODES` = list/card/compact), a card view (`directory-views.tsx:47`), and advanced filters (`advanced-search.tsx` + `data/filters.ts` — `applyFilters`, `countActiveFilters`, `EMPTY_FILTERS`, and a reusable `FacetSelect`). This design generalizes Directory rather than inventing.

**Someone already tried this and it was never adopted.** `src/components/module-page/` (610 lines) exports `ModulePage`, `TableToolbar`, `FilterSelect`, `SearchInput`, `CreateButton`, `usePager`. **`ModulePage`, `TableToolbar` and `CreateButton` have zero importers.** Five features forked local copies instead (`leave/list-controls.tsx`, `employees/shared.tsx`, `self-service/shared.tsx`, `lifecycle/orientation-widgets.tsx`, `workflows/table-helpers.tsx`). Any new shared layer must be adopted by real callers in the same change, or it will meet the same fate.

### Intended outcome

One declarative `TableSpec` per table. Sorting, column visibility, layered filters, row expansion, and view switching are **derived from column metadata** rather than hand-wired 333 times.

---

## 2. Decisions

| Decision | Choice |
|---|---|
| Migration scope | **Build the system + convert ~7 flagship tables.** Remaining tables keep working; converted opportunistically when next touched |
| Views (card/list) | **Opt-in per table.** Table is always default and always present |
| Base component | **Extend the existing `DataTable`.** Do not rewrite — it already has TanStack, sorting, selection, pinning, virtualization |
| Filtering | **Fix it to actually filter.** Required for the spec to work |
| `SimpleTable` | **Deprecate, don't delete yet.** It has 16 instances in 11 files that are outside the flagship scope; deleting it now would break them. Mark deprecated, convert its callers opportunistically, delete when the last one goes |
| `module-page` kit | **Delete** `ModulePage` / `TableToolbar` / `CreateButton` now — they have **zero importers**, so this is safe immediately. Keep `SummaryCards`, `DetailSheet`, `makeStatusBadge` (21 importers) |
| Directory's filter code | **Absorb** into the shared layer; Directory becomes a consumer |

---

## 3. Architecture

### 3.1 The `TableSpec` contract

New: `src/components/common/data-table/spec.ts`.

```ts
export type ColumnType = 'string' | 'number' | 'date' | 'enum' | 'badge'

export interface ColumnSpec<T> {
  id: string
  header: string
  /** The load-bearing field — derives sort behaviour AND filter control. */
  type: ColumnType
  accessor: (row: T) => string | number | Date | null
  /** Custom-columns menu. Defaults to 'visible'. */
  default?: 'visible' | 'hidden'
  /** Can never be hidden (identity columns, actions). */
  required?: boolean
  /** Filter layering: on the surface, in the drawer, or filterable-but-not-exposed. */
  filter?: 'quick' | 'more' | false
  /** Renders in the expanded row rather than the grid. */
  detail?: boolean
  /** Optional custom cell renderer; falls back to a type-appropriate default. */
  cell?: (row: T) => React.ReactNode
}

export interface TableSpec<T> {
  columns: ColumnSpec<T>[]
  defaultSort?: { id: string; dir: 'asc' | 'desc' }
  /** Platform rule — rows matching this always sort to the top. */
  primaryFirst?: (row: T) => boolean
  /** Opt-in. 'table' is implicit and always present. */
  views?: ('card' | 'list')[]
  /** Add never edits inline — it routes to the real add experience. */
  add?: { label: string; onAdd: () => void }
  /** Click-through to the full record. */
  rowHref?: (row: T) => string
}
```

### 3.2 `type` derives the behaviour

This is what makes the change affordable — the platform-wide rules become properties of a column type rather than 333 hand-written implementations.

| `type` | Default sort | Filter control (when `filter` is set) |
|---|---|---|
| `string` | A → Z | text search |
| `number` | ascending / descending | **range** (min–max) — e.g. employee count |
| `date` | newest / oldest | date range |
| `enum` | declaration order | multi-select facet |
| `badge` | declaration order | multi-select facet |

Requirement *"every table sorts by default; strings A–Z, numbers asc/desc"* is satisfied structurally: a column cannot exist without a `type`, and a `type` cannot exist without a comparator.

### 3.3 Layered filters

`filter: 'quick' | 'more' | false` implements *"everything should ideally be a filter, but not everything on the frontend, to remove clutter."*

- **`'quick'`** — rendered inline in the toolbar as a facet chip. Reserve for 2–4 per table (e.g. jurisdiction, status).
- **`'more'`** — lives in a **More filters** drawer (`Sheet`), with an active-count badge on the trigger.
- **`false`** — the column is sortable and hideable but not filterable.
- **omitted** — not filterable.

Filtering is implemented with real TanStack `columnFilters` and a per-`type` `filterFn`, replacing the `return true` stub. `directory/data/filters.ts` (`applyFilters`, `countActiveFilters`, `EMPTY_FILTERS`) and `FacetSelect` (`advanced-search.tsx:42`) move into the shared layer as the basis.

### 3.4 Expansion vs click-through

`detail: true` marks columns that appear in the **expanded row** rather than the grid — the "a bit more information" tier (subscription tier, employees used of total, primary jurisdiction). Everything else lives on the full record page, reached via `rowHref`.

Implemented with TanStack `getExpandedRowModel` (not currently used anywhere). The single existing example — `employees/lifecycle/onboarding-tabs.tsx:67`, a hand-rolled `expandedId` + `<Fragment>` + second `<TableRow>` — is replaced by it.

Rule of thumb for a spec author: **expanded row answers "is this the row I want?"; the record page answers "what is this thing?"** If a field is only needed to make that first decision, it belongs in `detail`.

### 3.5 Toolbar

One `TableToolbar` (new, replacing the dead one), left → right:

`[ search ] [ quick filter chips ] [ More filters ▸(n) ] ······ [ ⚙ Columns ] [ ▦ view switch ] [ + Add … ]`

- **Columns** — checkbox menu over `ColumnSpec`s, `required` ones disabled. Greenfield; nothing like it exists.
- **View switch** — only rendered when `views` is non-empty.
- **Add** — always routes out (page or modal). **Never** an inline/editable row.

### 3.6 Platform-wide rules encoded once

- **Primary sorts to top.** `primaryFirst` is applied as a pre-sort comparator ahead of the user's sort, so a primary jurisdiction / primary contact / primary anything always leads regardless of the active column sort.
- **Add never edits inline.**
- **Every column is sortable** unless explicitly opted out.

---

## 4. Data flow

```
TableSpec<T> ──┬─→ ColumnDef[]        (TanStack)        → grid
               ├─→ sort comparators   (from `type`)     → getSortedRowModel
               ├─→ filterFn per type  (fixes the stub)  → getFilteredRowModel
               ├─→ visibility state   (from `default`)  → columnVisibility  [new]
               ├─→ quick + drawer filter controls       → TableToolbar
               ├─→ detail fields                        → getExpandedRowModel [new]
               └─→ views / add / rowHref                → TableToolbar, row click
```

Rows are the caller's; the spec is pure data with no store dependency, so it is unit-testable in isolation.

---

## 5. Error / edge handling

| Case | Behaviour |
|---|---|
| User hides every optional column | `required` columns cannot be hidden, so the table can never become empty |
| A filter matches nothing | Existing `EmptyState` (`directory-views.tsx:26`), with a "Clear filters (n)" action |
| Column visibility across sessions | Persisted per table id in `localStorage`, mirroring `store.viewMode` in Directory |
| Virtualized table + expanded rows | Row height becomes dynamic; use TanStack Virtual's `measureElement` rather than the fixed 392px assumption (`table.tsx:555`) |
| Spec omits `defaultSort` | Fall back to `primaryFirst`, then declaration order |

---

## 6. Files

| File | Change |
|---|---|
| `src/components/common/data-table/spec.ts` | **new** — `TableSpec` / `ColumnSpec`, type→comparator and type→filterFn maps |
| `src/components/common/data-table/table.tsx` | column visibility, expansion, real `filterFn` (replacing `:150-156`), dynamic row measurement |
| `src/components/common/data-table/toolbar.tsx` | **new** — search, quick filters, More-filters drawer, Columns menu, view switch, Add |
| `src/components/common/data-table/filters.ts` | **new** — absorbed from `features/directory/data/filters.ts` + `FacetSelect` |
| `src/components/common/data-table/simple-table.tsx` | **deprecate** (`@deprecated` + lint rule). 11 caller files convert opportunistically; delete when the last one goes |
| `src/components/module-page/` | **delete** `ModulePage` / `TableToolbar` / `CreateButton` (zero importers — safe now); keep `SummaryCards`, `DetailSheet`, `makeStatusBadge` |

### Flagship conversions (~7)

Chosen for traffic and for being the worst offenders:

1. `features/companies/components/directory-tab.tsx` — the screen that prompted this
2. `features/directory/*` — the reference implementation becomes a consumer (proves the abstraction holds)
3. `features/employees/*` — 35 hand-rolled tables
4. `features/recruitment/*` — **40 hand-rolled, 1 shared**; the worst in the codebase
5. `features/leave/components/requests-tab.tsx`
6. `features/companies/components/subscriptions-tab.tsx`
7. `features/assets/*` or `features/documents/*`

---

## 7. Testing

Unit (the spec is pure):
- `type: 'number'` sorts ascending/descending; `type: 'string'` sorts A→Z.
- `primaryFirst` rows lead regardless of the active sort column.
- A `number` column with `filter: 'more'` produces a range control and excludes out-of-range rows.
- `required` columns cannot be hidden.
- Filtering actually removes rows (the regression that motivated this).

E2E: see §8.

---

## 8. Verification

1. `npx vite`; open Companies → Directory.
2. **Sorting** — click a string header (A→Z) and a number header (asc/desc). Confirm the 194 previously hand-rolled tables now sort once converted.
3. **Custom columns** — hide two optional columns; confirm they vanish and persist across reload; confirm `required` columns are disabled in the menu.
4. **Layered filters** — a quick facet narrows the list; **More filters** opens a drawer with an employee-count *range*; the trigger shows an active count; "Clear filters" resets.
5. **Filtering genuinely filters** — row count drops. (Today it does not; matches only float to the top.)
6. **Expansion** — expand a company row; see subscription tier and employees-used-of-limit; click through to the full record for everything else.
7. **Views** — Directory offers table/card; Companies offers table only (no switcher rendered).
8. **Add** — "Add Company" routes to the add experience; no inline row is created.
9. **Regression** — `npx tsc -b` clean; row selection, pinning and virtualization still work on a large table.

---

## 9. Risks

- **The adoption risk is the real one.** A shared kit already exists and was never adopted. Mitigation: the flagship conversions ship *in the same change* as the system, and the five forked local copies (`leave/list-controls.tsx`, `employees/shared.tsx`, `self-service/shared.tsx`, `lifecycle/orientation-widgets.tsx`, `workflows/table-helpers.tsx`) are deleted as their features convert.
- **Virtualization + dynamic row height** is the one genuinely tricky piece; the current 392px fixed viewport assumption must go.
- A two-tier codebase exists during migration (converted vs not). Accepted deliberately — the alternative is a 333-table big bang.

---

## 10. Where this sits

Workstream **W2** of nine identified on 2026-07-13:

| # | Workstream | Size | Status |
|---|---|---|---|
| W1 | Rename + re-IA the "Companies" screen | S | queued |
| **W2** | **Platform table system** | **XL** | **this spec** |
| W3 | Company add/edit multi-step form | M | queued |
| W4 | Company type + document compliance | M | blocked — research + partner sign-off |
| W5 | Jurisdiction allowlist (India + US only) | S–M | blocked — needs jurisdiction lists |
| W6 | Company field guardrails | M | spec'd (`2026-07-13-company-field-guardrails-design.md`) |
| W7 | Sub-module entitlement + widget gating | XL | queued — enforcement path does not exist today |
| W8 | Operating model semantics | XS | queued |
| W9 | Point-in-time snapshot export | S–M | queued |
