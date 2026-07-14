# SatelliteHR Design System v2 — first increment

**Date:** 2026-07-14
**Status:** Approved (design); building
**Scope:** First increment only. Later phases (migrating the other 811 files, global shell swap, dark mode, full component parity) are explicitly out of scope.

---

## 1. Context

The POC's UI is 38 shadcn "new-york" primitives in `poc/src/components/ui/`, imported by **812 files via 3,232 import statements**, themed by `poc/src/styles/theme.css` (the "mission control" brand: Space indigo grounds, Orbit blue, Signal orange). The user wants a **fresh design system** — a genuine component rebuild with new APIs — living in a new `design-system/` workspace package that the POC will eventually consume, replacing the existing components over time.

The user supplied a concrete visual reference (a Taskori/Linear-style productivity UI) and said "use this for the app shell, tabs, tables." The new language is **light, airy, quiet**: white grounds, near-black primary, soft pastel status pills, hairline borders + soft shadows, medium radius, comfortable density — a clear departure from the current dark-indigo brand.

Because a full rebuild + 812-file migration is multi-phase, this spec covers **only the first increment**, scoped to stand alone and prove the system end-to-end on real app data.

## 2. Decisions (settled with the user)

| Decision | Choice |
|---|---|
| Goal | New component **library (rebuild)** with new APIs — not a re-theme of the existing components |
| Delivery | **Monorepo workspace package** `@satellitehr/ui`; `poc/` imports from it |
| Visual direction | **Fresh aesthetic** from the supplied reference (light/airy/quiet) |
| First increment | Foundation + core components + showcase + **re-skin the Companies screen** on real data |
| Proof surface | An **isolated preview route in poc** (`/design/companies`), leaving the live `/companies` untouched for side-by-side comparison |

## 3. Workspace architecture

The repo is currently `poc/` standalone (no root `package.json`). Convert to a **bun workspace**:

- New root `package.json` with `"workspaces": ["poc", "design-system"]` and `"packageManager": "bun@..."`.
- New `design-system/` package:
  - `package.json` — name `@satellitehr/ui`, `react`/`react-dom`/`tailwindcss` as **peerDependencies** (matching poc: React 19.1, Tailwind 4.1, Vite 7.1), Lucide for icons.
  - Vite **library build** (`build.lib`) emitting ESM + types, plus a small **showcase** Vite app (`showcase/`) to develop and preview components in isolation with fixtures.
  - `src/components/*`, a barrel `src/index.ts`, and `src/styles/tokens.css`.
  - Exports: `@satellitehr/ui` (components) and `@satellitehr/ui/styles.css` (tokens).
- `poc/package.json` adds `"@satellitehr/ui": "workspace:*"`.
- **Tailwind v4 content wiring (the key integration risk):** the POC's Tailwind must scan the design-system package's source so its utility classes are generated. In v4 this is done via `@source` in the POC's CSS (e.g. `@source "../../../design-system/src";`) or by importing the package's precompiled styles. The package ships `tokens.css` (CSS custom properties + `@theme`), which the POC imports once.
- The existing `poc/src/components/ui/*` and `theme.css` are **untouched**; the current app keeps building and running throughout.

## 4. Design tokens (`design-system/src/styles/tokens.css`)

Derived from the reference. Exposed as CSS custom properties + Tailwind v4 `@theme`.

- **Grounds:** `--ds-bg #FFFFFF`, `--ds-bg-subtle #FAFAFA`, `--ds-bg-muted #F5F5F5`; hairline `--ds-border #EAEAEA`.
- **Text:** `--ds-text #1A1A1A`, `--ds-text-muted #6B7280`, `--ds-text-subtle #9CA3AF`.
- **Primary:** `--ds-primary #1A1A1A` (near-black) / `--ds-primary-fg #FFFFFF`; secondary = transparent + `--ds-border`.
- **Status pastels** (bg / fg pairs): high `#FDECEE`/`#C0334A`, medium `#FEF4E6`/`#B4791E`, low `#F1EEFC`/`#7A67B8`, success `#E7F6EE`/`#1F8A50`, neutral `#F3F4F6`/`#4B5563`.
- **Radius:** `--ds-radius 8px` (cards/inputs), pills fully rounded. **Shadow:** `--ds-shadow 0 1px 2px rgba(16,24,40,.05)`, `--ds-shadow-md 0 4px 12px rgba(16,24,40,.08)`.
- **Type:** a neutral grotesk (system stack / Inter-like); page titles large + bold; body 14px; muted secondary. Spacing scale comfortable (row height ~48–56px).
- **Light-first.** Dark tokens deferred.

## 5. Core components (`design-system/src/components/`)

Only what the reference exercises. Each is a focused file with a clear prop interface.

**Primitives**
- `Button` — variants `primary` (near-black filled) / `secondary` (white+border+icon) / `ghost`; sizes sm/md.
- `Badge` / `StatusPill` — soft pastel pill; `tone: high|medium|low|success|neutral`.
- `TypePill` — white outline pill + leading icon (Feature/Bug/Review/Testing-style).
- `Avatar` + `AvatarStack` — overlapping avatars with `+N` overflow.
- `ProgressCell` — percentage + short colored bar (tone-driven).
- `DateRange` — formatted `start – end`.
- `SearchInput` — leading magnifier, optional `⌘F` kbd hint.
- `Tabs` — icon+label triggers, underline active indicator.

**Shell**
- `Sidebar` — workspace-switcher card, `SearchInput`, collapsible grouped nav (`NavGroup` + `NavItem` with optional colored icon; active item = white rounded pill w/ border+shadow).
- `TopBar` — breadcrumb, large title, right-aligned actions slot.
- `AppShell` — composes `Sidebar` + `TopBar` + content region.

**Data**
- `DataTable` (v2) — **wraps the existing SpecTable engine's model.** It does NOT reimplement sorting/filter/columns/expansion; it re-presents them in the new aesthetic: grouped sections (group header with count badge + Filter control), soft-card container, airy rows, hairline separators, and the cell kit above. The `TableSpec`/`ColumnSpec` shape is reused conceptually; the increment may either (a) depend on the poc's SpecTable via the workspace, or (b) port the small pure `spec.ts`/`filters.ts`/`build-columns` core into the package. **Chosen: port the pure core into the package** (it has zero React/store deps), so `@satellitehr/ui` is self-contained and the poc's copy is untouched.

**Showcase**
- A Vite app under `design-system/showcase/` rendering every component with fixtures — the visual dev surface.

## 6. The proven screen: Companies re-skinned

- New poc route `poc/src/routes/.../design/companies` (isolated; the live `/companies` is untouched).
- Renders the new `AppShell` (sidebar nav mirroring the app's Organization section + the SatelliteHR workspace card) + `Tabs` (Directory / Groups & Portfolios / Subscriptions / Admin).
- The **Directory tab** renders `DataTable` v2 fed by the **real** `useCompanies` + `useSubscriptions` hooks, with company rows showing name, jurisdiction, a `StatusPill` for status, employee count, and a `ProgressCell` for employees-used-of-limit.
- Purpose: prove the package works **in the real app, on real data**, in the new aesthetic — reviewable beside the old screen.

## 7. Verification

- `@satellitehr/ui` gets its own Vitest + testing-library harness (mirror poc's). Unit tests for the pure logic (ported spec/filters) and render/interaction tests for StatusPill, Tabs, DataTable, Sidebar active state.
- Showcase renders all components (manual visual dev).
- Browser-verify the poc `/design/companies` route: sidebar + tabs + table render in the new aesthetic on real company data; status pills color-coded; sorting/columns work; zero console errors.
- `poc` still builds (`tsc -b` + `vite build`); the workspace change does not break the existing app.

## 8. Risks

- **Tailwind v4 cross-package content scanning** is the main integration risk — the POC must generate utilities used inside `@satellitehr/ui`. Validate the `@source`/import wiring early, before building many components.
- **Workspace introduction** changes install/build for `poc`. Keep `poc` green at each step.
- React/Tailwind **version drift** between package peers and poc — pin to poc's versions.

## 9. Out of scope (later phases)

Migrating the other 811 files and 24 screens; swapping the global app shell; dark mode; full 38-component parity; publishing the package outside the workspace.
