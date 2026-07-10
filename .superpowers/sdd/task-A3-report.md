# Task A3 Report — Engines Hub (`/engines`)

## Status: DONE

**Commit:** `c455b68`
**Branch:** `main`

---

## What was built

### New files
- `poc/src/routes/_authenticated/engines/index.tsx` — TanStack route `/_authenticated/engines/`, mounts `EnginesHub`
- `poc/src/features/engines/index.tsx` — `EnginesHub` component: `CommonHeader title='Engines Hub'` + `Main` + `HubCatalog`
- `poc/src/features/engines/components/hub-catalog.tsx` — full catalog with by-module/by-type toggle, search, artifact rows (name, type badge, version badge, scope switch, attachment pills with × detach, Attach… button, Export disabled placeholder)
- `poc/src/features/engines/components/attach-dialog.tsx` — two-Select dialog: module (registry modules with `targetModule`) + optional submodule (`submodulesFor`), "Whole module" default

### Modified files
- `poc/src/config/module-registry.ts` — added `SlidersHorizontal` import; inserted Engines Hub entry (`id: '/engines'`, `group: 'Platform'`, `targetModule: undefined`, `submodules/entities/events/forms: []`) before `/workflows`
- `poc/src/config/module-access.ts` — added `'/engines': [P, C]` (`Platform Admin`, `Company Admin`)

---

## Architecture decisions

- **Left rail counts (by-module):** counts artifacts where `a.attachments.some(x => x.module === target)`, matching the panel filter semantics from the brief.
- **Attach dialog reset:** state resets on close so re-opening is always fresh.
- **Detach guard:** calls `store.detach()` unconditionally; the store itself protects the last-attachment invariant with a toast.error + no-op (as built in A2).
- **Export button:** rendered disabled with `title='Available soon'` — no wiring, per brief.
- **Cross-feature imports:** `useBusinessLogic`, `ARTIFACT_TYPE_LABELS`, `ARTIFACT_TYPES`, `ROLE_SCOPE`, `SCOPE_TOGGLE_ROLE`, `isEffectivelyActive`, `blockingLevel`, types from `@/features/workflows/...`; `ACTORS` from `@/features/workflows/data/shared` — consistent with codebase norm.
- **Sidebar:** sidebar-data derives from `MODULE_REGISTRY` automatically; no sidebar-data.ts change needed.
- **Route guard:** `MODULE_ACCESS['/engines']` gates the route; the existing route-guard infrastructure picks it up automatically.

---

## Verification output

```
npx tsc --noEmit  →  0 errors (no output)
npx vite build    →  ✓ built in 15.20s (chunk warnings are pre-existing)
```

---

## Deviations from brief

None. All requirements implemented as specified.

---

## Fix round 1 — reviewer findings (commit c455b68)

### Finding 1 (CRITICAL) — runtime crash in attach dialog
**File:** `poc/src/features/engines/components/attach-dialog.tsx`
**Issue:** `<SelectItem value=''>Whole module</SelectItem>` — Radix Select throws on empty-string `value`.
**Fix:** Introduced `WHOLE_MODULE_SENTINEL = '__whole__'` constant. Replaced the empty-string `value` with the sentinel on the `SelectItem`. Default and reset state for `selectedSubmodule` now uses the sentinel. In `handleAttach`, the sentinel is mapped back to `undefined` (no submodule) when constructing `ArtifactAttachment`. The `SelectValue` placeholder was removed (sentinel item shows the label directly).

### Finding 2 (IMPORTANT) — actor format mismatch
**File:** `poc/src/features/engines/index.tsx`
**Issue:** `useBusinessLogic({ actor: ACTORS[role] })` produced a human-readable display name (e.g. `"Alice (Company Admin)"`) instead of the role string used everywhere else.
**Fix:** Changed to `useBusinessLogic({ actor: role })`, matching `engine-artifacts-panel.tsx` and all other call sites. Removed the now-dead `ACTORS` import.

### Finding 3 (IMPORTANT) — browse-mode toggle must be Tabs
**File:** `poc/src/features/engines/components/hub-catalog.tsx`
**Issue:** Browse-mode toggle used hand-rolled `<button>` elements with hard-coded `bg-blue-600` instead of the codebase's shared Tabs component.
**Fix:** Added `Tabs, TabsList, TabsTrigger` import from `@/components/ui/tabs`. Replaced the custom toggle `<div>` with a `<Tabs value={browseMode} onValueChange={...}>` block containing `<TabsList>` + two `<TabsTrigger>` items. The `browseMode` state variable and behavior are unchanged.

### Verification
```
npx tsc --noEmit  →  0 errors (no output)
npx vite build    →  ✓ built in 15.23s (chunk size warnings are pre-existing, unrelated)
```
