# Platform Reorganization Implementation Plan — Engines Hub, Visual Settings Workspace, Extensible Forms

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize SatelliteHR's overwhelming per-module admin settings into a visual, laymen-friendly Settings Workspace; add a central Engines Hub where any configuration artifact can be attached to any module/submodule; wire custom fields and workflows into module forms end-to-end; and add JSON export/import for the whole artifact catalog.

**Architecture:** Two composable workstreams over the existing "Layer 3 — Consume" pattern (`EngineArtifactsPanel`, already in 21 modules). **A (Engine/extensibility):** a new `module-registry.ts` single source of truth; artifacts gain `attachments: {module, submodule?}[]` (targetModule kept as home; all 174+ Kensium seeds migrate via a `normalizeArtifact` derivation, zero data edits); a new `/engines` route browses the whole catalog and attaches artifacts anywhere; JSON bundle export/import; 2 new artifact kinds (`category-list`, `calendar`); a generic `CustomFieldsSection` adopted by 3 forms; flow↔form linking = attachment + trigger-event match. **B (Settings UX):** a shared `SettingsWorkspace` launcher-and-drill component (5–8 visual group cards per module, one group visible at a time, search) plus 4 visual primitives (`ToggleTile`, `ApproverChainEditor`, `RulePillBuilder`, `CalendarPreview`); existing `config-*.tsx` components are wrapped, not rewritten; migrated on the 4 worst modules (Leave 10→7 groups, Lifecycle 16→7, Recruitment 16→7, Attendance 7→6).

**Tech Stack:** React 19 + Vite + TypeScript (strict) + TanStack Router; in-memory stores (`useSyncExternalStore` module-level pattern from `use-business-logic.ts`); shadcn-style ui primitives; sonner toasts; phosphor-react + lucide icons; Playwright (from `../app/node_modules`) for visual verification; wrangler deploy.

## Global Constraints

- Frontend-only mock POC — no backend; state lives in module-level stores + localStorage.
- **Do NOT implement payroll.**
- Keep ALL existing features reachable and working — reorganize, never remove.
- `npx tsc --noEmit` must stay at 0 errors after every task; `npx vite build` must pass.
- No test runner exists in poc/ — each task's verify cycle is: tsc → build → (for UI tasks) `npx vite preview --port 4310` + throwaway Playwright script written into `/Users/harshitsan/Documents/heliverse/hcm/app/`, run from there, screenshots reviewed, script deleted after.
- Role switch in Playwright: `page.getByText('Viewing role — tap to switch').click()` then `page.getByRole('menuitem', { name: role, exact: true })`. Viewport 1512×900. Default role is Platform Admin.
- Reuse codebase idiom: card style `rounded-[8px] border border-gray-200 bg-white`, `<SelectTrigger variant='secondary'>`, section headers `text-paragraph-md text-neutral-1400 mb-3 font-semibold`, `useRole()/hasRole()` from `@/context/role-context`, `MODULE_ACCESS` in `src/config/module-access.ts`.
- All paths below are relative to `/Users/harshitsan/Documents/heliverse/hcm/poc/`.
- Commit after each task (`git add` the task's files; message prefix `feat(reorg):`).
- Final deploy (after all tasks): `npx wrangler deploy --env production` from poc/.

---

## Context

The user's brief (verbatim intent): review each module and submodule and organize it better — simplified UX keeping all features intact. Every submodule has admin configuration settings; the decentralization is good but "it gets too overwhelming to see so many settings in one page". Define what must be **fixed forms** vs what can be **custom fields** (org-dependent); extend base features/forms by adding custom fields and by **linking workflows to existing forms and custom fields**. "More visual and less words" — laymen-usable configuration. Redefine workflow artifacts based on new platform features. **Export and import workflows as JSON.** Create an **Engines tab** with all configurations for all pages, where any sub-configuration can be connected to any module/submodule so it shows there.

Exploration findings that shape the plan:
- Settings inventory (29 modules): Lifecycle admin = 16 config sections, Recruitment = 16, Leave = 10+, Attendance = 7 — the demonstrative migration set. Cross-module repeats: notification/email templates (8 modules), approver rules (9), type/category CRUDs (10+), enable/disable flags (5), platform-vs-company bifurcation (5).
- Engine (`src/features/workflows/data/business-logic.ts`): `Artifact {id, name, type, targetModule, description, version, scopes, definition, updatedBy, updatedAt, history}`; 8 artifact types; 22 TARGET_MODULES; ~18 seeds + 174+ Kensium seeds (`kensium-artifacts.ts`); scope helpers `isEffectivelyActive`/`blockingLevel`/`ROLE_SCOPE`.
- Designer (`src/features/workflows/designer/`): `WorkflowDoc` fully JSON-serializable; `store.ts` already has `exportJson()/importJson()`; node registry at `designer/core/registry.ts` with `MODULE_EVENT_MAP`.
- Custom fields (`src/features/custom-fields/`): 18 field types, 6 entities, permission matrix, `field-engine.ts` (resolveFieldAccess/validateFieldValue/applyMask), `DynamicFieldControl` renders any field from metadata. **Only Recruitment's requisition form consumes custom fields today** — all other forms are fixed.
- Prior assessment `poc/workflowdefine.md` (hybrid recommendation) is honored: engine owns capability toggles; policy-like settings become artifacts; structural settings stay hand-built reading/writing artifacts.

Recommended execution order (dependencies): A1 → A2 → A3 → A4; A5 after A2; A6 after A1; A7 after A1+A2. B1 → B2 → B3 → B4 → B5; B can start any time after A2 (the Engine-features group uses the panel's new optional prop). Suggested interleave for demo value: A1, A2, A3 (Engines Hub headline) → B1, B2, B3 (Leave visual showcase) → A4, A5 → B4, B5 → A6, A7.

---

# Workstream A — Module Registry, Engines Hub, Extensibility

### Task A1: Module Registry — single source of truth

**Files:**
- Create: `src/config/module-registry.ts`
- Modify: `src/components/layout/data/sidebar-data.ts` (derive nav groups from registry; keep exported `SidebarData` shape identical)
- Modify: `src/features/workflows/designer/core/registry.ts` (delete local `MODULE_EVENT_MAP`; `eventsForModule` delegates to module registry; `EVENT_SAMPLES` stays)

**Interfaces:**
- Consumes: `TargetModule` (type-only import from `@/features/workflows/data/business-logic` — no runtime cycle), `Role` from role-context, existing icons from sidebar-data.
- Produces (later tasks rely on these exact names): `MODULE_REGISTRY: readonly ModuleDef[]`, `moduleByRoute(route)`, `moduleByTarget(target)`, `submodulesFor(target)`, `eventsForModule(target)`, types `ModuleDef`, `SubmoduleDef`, `ModuleFormDef`, `SidebarGroup`.

```ts
// src/config/module-registry.ts
import type { LucideIcon } from 'lucide-react'
import type { TargetModule } from '@/features/workflows/data/business-logic'

export type SidebarGroup =
  | 'Home' | 'Organization' | 'Workforce' | 'Policies & Comms' | 'Platform' | 'Administration'

export interface SubmoduleDef {
  id: string          // Tabs `value` inside the module page, e.g. 'config', 'requests'
  label: string
}

export interface ModuleFormDef {
  id: string          // '<moduleKey>.<form>', e.g. 'leave.apply'
  label: string
  extensible: boolean // FIXED = hand-built schema only; EXTENSIBLE = renders CustomFieldsSection
  fieldTarget?: string    // custom-field target (only when extensible) — typed FieldTarget after A6
  submitEvent?: string    // designer trigger event fired on submit (must exist in `events`)
}

export interface ModuleDef {
  id: string              // route key, matches MODULE_ACCESS keys, e.g. '/leave'
  name: string            // sidebar title, e.g. 'Leave Management'
  route: string
  icon: LucideIcon
  group: SidebarGroup
  targetModule?: TargetModule   // engine catalog name; undefined = no engine surface
  submodules: SubmoduleDef[]
  entities: string[]      // names from data-management/data/catalog.ts
  events: string[]        // absorbs designer MODULE_EVENT_MAP
  forms: ModuleFormDef[]
}

export const MODULE_REGISTRY: readonly ModuleDef[] = [ /* 29 entries — every sidebar module */ ]

export function moduleByRoute(route: string): ModuleDef | undefined
export function moduleByTarget(target: TargetModule): ModuleDef | undefined
export function submodulesFor(target: TargetModule): SubmoduleDef[]
export function eventsForModule(target: string): string[]
```

Registry content sources: routes/names/icons/groups from current `sidebar-data.ts`; submodules = each module page's `TabsTrigger` values (read each `src/features/*/index.tsx`); events = designer `MODULE_EVENT_MAP` (~10 source modules) plus one NEW event `'Asset requisition submitted'` under Asset Management (needed by A7); forms = at minimum `leave.apply` (submitEvent `'Leave request submitted'`, extensible after A6), `assets.requisition` (submitEvent `'Asset requisition submitted'`), `recruitment.requisition` (extensible already, its own mechanism), `employees.profile`.

- [ ] **Step 1:** Write `module-registry.ts` with all 29 entries and the 4 helper functions (simple `.find`/`.filter` lookups).
- [ ] **Step 2:** Rewrite `sidebar-data.ts` to build `navGroups`/`bottomGroup` by mapping `MODULE_REGISTRY` grouped by `group`, keeping the exported object shape byte-compatible for `app-sidebar.tsx`.
- [ ] **Step 3:** In `designer/core/registry.ts`, replace `MODULE_EVENT_MAP` usage with `eventsForModule` from the module registry.
- [ ] **Step 4:** Verify: `npx tsc --noEmit` (0 errors), `npx vite build`, quick Playwright pass loading `/` — sidebar renders identically (screenshot compare against pre-change).
- [ ] **Step 5:** Commit: `feat(reorg): add module registry as single source of truth`

### Task A2: Artifact attachments (connect any artifact to any module/submodule)

**Files:**
- Modify: `src/features/workflows/data/business-logic.ts`
- Modify: `src/features/workflows/data/kensium-artifacts.ts` (type annotation only)
- Modify: `src/features/workflows/hooks/use-business-logic.ts`
- Modify: `src/features/workflows/components/engine-artifacts-panel.tsx`

**Interfaces:**
- Produces: `ArtifactAttachment {module: TargetModule; submodule?: string}`, `Artifact.attachments: ArtifactAttachment[]`, `SeedArtifact` (attachments optional), `normalizeArtifact(a: SeedArtifact): Artifact`, store ops `attach(id, attachment)` / `detach(id, attachment)`, `EngineArtifactsPanel` optional `submodule?: string` prop.

```ts
// business-logic.ts additions
export interface ArtifactAttachment {
  module: TargetModule
  submodule?: string   // submodule tab id from module registry; omitted = whole module
}
export interface Artifact { /* existing fields */; targetModule: TargetModule /* kept = home module */; attachments: ArtifactAttachment[] }
export type SeedArtifact = Omit<Artifact, 'attachments'> & { attachments?: ArtifactAttachment[] }
export function normalizeArtifact(a: SeedArtifact): Artifact {
  return { ...a, attachments: a.attachments ?? [{ module: a.targetModule }] }
}
```

Migration for 174+ Kensium seeds is **zero data edits**: retype `seedArtifacts: SeedArtifact[]` and `KENSIUM_ARTIFACTS: SeedArtifact[]` (one-line annotation each), then in `use-business-logic.ts` init: `let artifactState: Artifact[] = [...seedArtifacts, ...KENSIUM_ARTIFACTS].map(normalizeArtifact)`. `ArtifactDraft` gains `attachments`; `createArtifact` defaults it to `[{ module: draft.targetModule }]`. `attach`/`detach` follow the exact mutate/history/toast pattern of the existing `toggleScope` (history lines: `'Attached to <module> / <submodule>'` / `'Detached from …'`; attach dedupes).

Panel filter change (replaces `a.targetModule === module`):
```ts
a.attachments.some(x => x.module === module && (!submodule || !x.submodule || x.submodule === submodule))
```
Semantics: attachment without submodule surfaces everywhere in the module; with submodule only on that tab. All 21 existing call sites compile unchanged (new prop optional).

- [ ] **Step 1:** Add types + `normalizeArtifact` to business-logic.ts; retype both seed arrays.
- [ ] **Step 2:** Update `use-business-logic.ts`: normalized init, `attach`/`detach` ops, `ArtifactDraft.attachments`.
- [ ] **Step 3:** Update `engine-artifacts-panel.tsx` filter + optional `submodule` prop.
- [ ] **Step 4:** Verify: tsc 0 errors; build; Playwright — open Leave Admin, Engine panel shows the same artifacts as before the change.
- [ ] **Step 5:** Commit: `feat(reorg): artifact attachments — surface any artifact on any module/submodule`

### Task A3: Engines Hub page (`/engines`)

**Files:**
- Create: `src/routes/_authenticated/engines/index.tsx` (`createFileRoute('/_authenticated/engines/')`, copy the workflows route file pattern)
- Create: `src/features/engines/index.tsx`
- Create: `src/features/engines/components/hub-catalog.tsx`
- Create: `src/features/engines/components/attach-dialog.tsx`
- Modify: `src/config/module-registry.ts` (add Engines Hub entry, icon `SlidersHorizontal`, group Platform — sidebar derives automatically)
- Modify: `src/config/module-access.ts` (add `'/engines': ['Platform Admin', 'Company Admin']`, mirroring `/workflows`)

**Interfaces:**
- Consumes: `MODULE_REGISTRY`/`submodulesFor` (A1), `useBusinessLogic` store incl. `attach`/`detach` (A2), `ARTIFACT_TYPE_LABELS`, scope helpers, existing `artifact-builder-sheet.tsx` / `artifact-detail-sheet.tsx` (cross-feature import from workflows — already the norm).
- Produces: `AttachDialogProps {artifact, open, onOpenChange, onAttach(attachment)}`.

Page shell: `CommonHeader title='Engines Hub'`; `Tabs` with two browse modes — **By module** (left rail = modules from `MODULE_REGISTRY` that have `targetModule`, with per-module artifact counts) and **By type** (left rail = 8 artifact types); search `Input` filtering by name/description; main list rows reuse the visual row pattern from `engine-artifacts-panel.tsx` (name, type badge, version badge, scope switch) **plus**: attachment pills (`module / submodule`, each with an × calling `detach`), an "Attach…" button opening `attach-dialog`, and a row-level "Export" action (single-artifact bundle — wire in A4, render disabled placeholder until then). Card style `rounded-[8px] border border-gray-200 bg-white`.

`attach-dialog.tsx`: two `<Select variant='secondary'>`s driven by the registry — module (only those with `targetModule`), then optional submodule (`submodulesFor(target)`, "Whole module" default). Two clicks max — this is the headline demo moment.

- [ ] **Step 1:** Build route + feature shell + hub-catalog + attach-dialog; registry + MODULE_ACCESS entries.
- [ ] **Step 2:** Verify: tsc; build; Playwright — (a) `/engines` renders with sidebar entry under Platform; (b) attach a Leave artifact to `Time & Attendance / config` via dialog, navigate to Attendance Admin and screenshot the artifact now listed in its engine panel; (c) detach via pill ×, confirm it disappears; (d) switch role to Employee (User) — `/engines` blocked by route guard.
- [ ] **Step 3:** Commit: `feat(reorg): Engines Hub — central catalog with attach/detach to any module`

### Task A4: JSON export/import for the artifact catalog

**Files:**
- Create: `src/features/workflows/data/artifact-io.ts`
- Modify: `src/features/workflows/hooks/use-business-logic.ts` (add `importArtifacts`)
- Modify: `src/features/workflows/designer/state/store.ts` (export existing `isValidDocShape`)
- Modify: `src/features/engines/components/hub-catalog.tsx` (toolbar Export/Import + row export)
- Modify: designer TopBar component under `src/features/workflows/designer/components/` (add "Export as artifact bundle" menu item)

**Interfaces:**
- Produces:
```ts
export interface ArtifactBundle {
  format: 'satellitehr.artifacts'   // magic string guards wrong-file imports
  version: 1
  exportedAt: string                // ISO
  artifacts: Artifact[]
}
export function serializeBundle(artifacts: Artifact[]): string
export type ParseResult = { ok: true; artifacts: Artifact[] } | { ok: false; error: string }
export function parseBundle(text: string): ParseResult
// store op:
importArtifacts(artifacts: Artifact[]) => { imported: number; renamed: number }
```

`parseBundle` validation (mirrors designer's `isValidDocShape`): try/catch JSON.parse; check `format`/`version`; per artifact require string `id`/`name`, `type ∈ ARTIFACT_TYPES`, `definition.kind === type`, `scopes` has all 4 `SCOPE_LEVELS` booleans; run every artifact through `normalizeArtifact` (so pre-attachments bundles import cleanly); for `kind:'flow'` reuse `isValidDocShape` on `definition.doc`.

**Collision handling — duplicate-as-new, never overwrite:** incoming `id` already exists → import with fresh id (`bl-<random6>`), name suffixed `" (imported)"`, `version: 1`, history entry `'Imported — copy of <original id>'`. (Overwrite would silently destroy local scope toggles/history.)

UI: Hub toolbar "Export" downloads the current filtered view as a bundle (`Blob` + `URL.createObjectURL` + anchor click — same mechanics as `downloadSampleXml` in `data-management/components/wizard/step-file.tsx`); "Import" = hidden `<input type='file' accept='.json'>` + FileReader → `parseBundle` → `importArtifacts` → one summary toast (`'Imported 3 artifacts (1 renamed)'`) or error toast. Row export = single-artifact bundle. Designer TopBar "Export as artifact bundle" wraps the current doc as a `flow` artifact in the same envelope, so designer exports import at the Hub and vice versa.

- [ ] **Step 1:** Write `artifact-io.ts` + `importArtifacts` store op + `isValidDocShape` export.
- [ ] **Step 2:** Wire Hub toolbar + row export + designer TopBar item.
- [ ] **Step 3:** Verify: tsc; build; Playwright — export a bundle from the Hub, re-import the same file, confirm duplicate-as-new rows appear with "(imported)" suffix + toast; import a garbage .json, confirm error toast, no state change.
- [ ] **Step 4:** Commit: `feat(reorg): JSON export/import for artifact catalog + designer bundles`

### Task A5: New artifact kinds — `category-list` & `calendar` (+ template channel/event)

**Files:**
- Modify: `src/features/workflows/data/business-logic.ts` (union additions + ~10 representative new seeds)
- Modify: `src/features/workflows/components/artifact-builder-sheet.tsx` and `artifact-detail-sheet.tsx` (visual editors)

**Interfaces:**
```ts
export interface CategoryItem { id: string; label: string; active: boolean }
export interface CalendarEntry {
  label: string
  date?: string                          // holiday entries
  startTime?: string; endTime?: string   // shift / business-hours
  days?: string[]                        // e.g. ['Mon','Tue']
}
export type ArtifactDefinition =
  | /* 8 existing members unchanged, except template gains OPTIONAL fields: */
  | { kind: 'template'; body: string; channel?: 'Email' | 'In-app' | 'SMS'; event?: string; templateKind?: 'letter' | 'notification' }
  | { kind: 'category-list'; items: CategoryItem[] }
  | { kind: 'calendar'; calendarType: 'holiday' | 'shift' | 'business-hours'; entries: CalendarEntry[] }
```
`ARTIFACT_TYPES` gains `'category-list' | 'calendar'`; `ARTIFACT_TYPE_LABELS` gains `'Category list'` / `'Calendar'`; `FORM_ARTIFACT_TYPES` extended likewise. Optional template fields are non-breaking for all Kensium seeds.

Mapping (the "redefine artifacts based on platform features" answer — seed ~10 representative artifacts, do NOT port every screen): type/category CRUDs (leave types, asset categories, document categories, exit reasons…) → `category-list`; holiday calendars/shift patterns/SLA business hours → `calendar`; notification + letter templates → `template` with `channel`/`event`/`templateKind`; approver rules → existing `approver-chain`; eligibility/policy rules + SLA rules → existing `decision-rule`; module enable/disable flags → existing `setting`.

Visual editors (the "more visual, less words" surface, no free-text JSON): `category-list` = chip/tag rows with an active `Switch` + add-row input; `calendar` = small entry grid with type-dependent columns (reuse Input/Switch/SimpleTable).

- [ ] **Step 1:** Union + labels + seeds. **Step 2:** Builder/detail sheet editors. 
- [ ] **Step 3:** Verify: tsc; build; Playwright — create a Category list artifact in the builder, toggle an item, see it in the Hub under "By type"; open a seeded Calendar artifact detail.
- [ ] **Step 4:** Commit: `feat(reorg): category-list & calendar artifact kinds with visual editors`

### Task A6: CustomFieldsSection — custom fields on real forms

**Files:**
- Modify: `src/features/custom-fields/data/custom-fields.ts` (FieldTarget widening + 4–5 demo seeds)
- Modify: `src/features/custom-fields/hooks/use-custom-fields.ts` (**prerequisite**: promote `useFieldDefinitions` from per-component `useState` to the module-level external-store pattern — exactly `use-business-logic.ts` lines 32–53 — keeping the returned API identical; without this a field created in Custom Fields never appears on another route's form)
- Create: `src/features/custom-fields/components/custom-fields-section.tsx`
- Modify: `src/features/leave/components/apply-leave-overlay.tsx`, `src/features/assets/components/requisition-form-overlay.tsx`, the employees profile edit surface, `src/config/module-registry.ts` (mark the 3 forms `extensible: true` + `fieldTarget`)

**Interfaces:**
```ts
// custom-fields.ts — form-level targets ALONGSIDE the 6 entities (entities stay pure for lookups/Records)
export const FORM_TARGETS = ['Leave Request', 'Asset Requisition'] as const
export type FormTarget = (typeof FORM_TARGETS)[number]
export const FIELD_TARGETS = [...SUPPORTED_ENTITIES, ...FORM_TARGETS] as const
export type FieldTarget = (typeof FIELD_TARGETS)[number]
export interface FieldDefinition { entity: FieldTarget /* WIDENED */; lookupEntity: SupportedEntity | null /* unchanged */; /* rest unchanged */ }

// custom-fields-section.tsx
interface CustomFieldsSectionProps {
  entity: FieldTarget
  values: Record<string, FieldValue>            // keyed by FieldDefinition.id
  onChange: (fieldId: string, value: FieldValue) => void
  errors?: Record<string, string>
  audience?: 'hr' | 'manager' | 'employee'      // default 'hr'
  title?: string                                // default 'Additional fields'
}
export function CustomFieldsSection(props): JSX.Element | null   // null when no fields match
export function validateCustomFields(entity, values, audience?): Record<string, string>  // empty = valid
```
Implementation: read definitions from the (now shared) store filtered by entity, sort by `order`, resolve visibility/read-only via `resolveFieldAccess`, render with `DynamicFieldControl`, validate via `validateFieldValue` + `applyMask`. Records tab keeps operating on `SUPPORTED_ENTITIES` only (form targets have no record grid). Field wizard's entity dropdown lists `FIELD_TARGETS`. Demo seeds: e.g. "Client billing code" on Leave Request, "Cost center approval ref" on Asset Requisition.

Adoption (this encodes the **fixed-vs-custom classification** in the registry, inspectable): Leave apply (`entity='Leave Request'`, `audience='employee'`, add `custom: Record<string, FieldValue>` to draft state, render section above footer, gate submit on `validateCustomFields`); Asset requisition (same recipe); Employee profile (`entity='Employees'` — shows entity-level + form-level side by side). Recruitment keeps its own working mechanism (unification = noted follow-up, not scope). Everything else stays `extensible: false` — that IS the answer.

- [ ] **Step 1:** Shared store + FieldTarget widening + seeds. **Step 2:** `CustomFieldsSection` + `validateCustomFields`. **Step 3:** Adopt in the 3 forms + registry flags.
- [ ] **Step 4:** Verify: tsc; build; Playwright — create a new field targeting Leave Request in Custom Fields module, open Leave → Apply, the field renders; submit with required field empty → inline error; fill → submits.
- [ ] **Step 5:** Commit: `feat(reorg): CustomFieldsSection — extensible Leave/Asset/Employee forms`

### Task A7: Flow ↔ form linking (attach a flow, submit a form, see the run)

**Files:**
- Create: `src/features/workflows/data/flow-links.ts`
- Create: `src/features/workflows/hooks/use-flow-runs.ts`
- Modify: `src/features/workflows/hooks/use-business-logic.ts` (export `getArtifacts()` snapshot accessor)
- Modify: `src/features/workflows/components/instances-tab.tsx` (add "Engine-linked flow runs" section)
- Modify: `apply-leave-overlay.tsx` + `requisition-form-overlay.tsx` (call `triggerFormFlows` after submit; optional `LinkedFlowsHint` badge)

**Interfaces:**
- Binding model (no new binding table): a `flow` artifact is linked to a form when (1) attached to the form's module (A2 attachments), (2) `artifact.definition.doc.trigger.label === form.submitEvent` from the module registry, (3) `isEffectivelyActive(a.scopes, 'company')`.
```ts
// flow-links.ts
export function linkedFlows(artifacts: Artifact[], module: TargetModule, submitEvent: string): Artifact[]

// use-flow-runs.ts — NEW shared external store (useInstances is per-component useState on the
// Workflows page, so a Leave-route submit cannot reach it; do not surgery the instances engine)
export interface FlowRun {
  id: string; artifactId: string; artifactName: string
  module: TargetModule; event: string
  summary: string          // 'Casual leave · 3 days'
  requester: string; startedAt: string
  status: 'completed'      // POC: runs complete instantly
  steps: Array<{ label: string; kind: string }>   // flattened doc.body incl. container branches
}
export function useFlowRuns(): { runs: FlowRun[] }
export function triggerFormFlows(input: { module: TargetModule; event: string; summary: string; requester: string }): number
```
`triggerFormFlows` (plain function, callable in any submit handler): `getArtifacts()` → `linkedFlows` → one `FlowRun` per match → toast `'Flow "<name>" started — see Workflow Engine → Requests'`; zero matches → silent. Instances tab gains a SimpleTable card of runs (name, event, summary, requester, started, step count). Events: `'Leave request submitted'` (exists) / `'Asset requisition submitted'` (added in A1).

- [ ] **Step 1:** `flow-links.ts` + `use-flow-runs.ts` + `getArtifacts()`. **Step 2:** Wire the 2 overlays + instances-tab section + `LinkedFlowsHint` ("2 flows will run on submit").
- [ ] **Step 3:** Verify end-to-end: Playwright — in Engines Hub attach the seeded 'Leave approval standard' flow to Leave; open Leave → Apply (hint badge visible), submit; toast appears; navigate Workflows → Requests, flow run row present with step trail.
- [ ] **Step 4:** Commit: `feat(reorg): flow↔form linking — attached flows run on form submit`

---

# Workstream B — Visual Settings Workspace

### Task B1: SettingsWorkspace shell + support primitives

**Files:**
- Create: `src/components/common/settings/types.ts`, `settings-workspace.tsx`, `settings-group-card.tsx`, `scope-chip.tsx`, `advanced-section.tsx`

**Interfaces (produced — later tasks depend on these exact names):**
```ts
// types.ts
export type SettingScope = 'platform' | 'group' | 'company'
export interface SettingStatusChip { label: string; tone?: 'neutral' | 'positive' | 'warning' | 'danger' }
export interface SettingGroup {
  id: string; title: string
  description: string              // ONE line, plain language
  icon: ReactNode                  // phosphor icon, size 24
  status?: SettingStatusChip[]     // max 3
  scope?: SettingScope             // default 'company'
  roles?: Role[]                   // omit = all admins; filtered via useRole().hasRole
  keywords?: string[]              // extra search terms
  advancedCount?: number
  render: () => ReactNode          // group body — initially wraps existing config-*
}
export interface SettingsWorkspaceProps {
  groups: SettingGroup[]; title?: string
  defaultGroupId?: string; onGroupChange?: (id: string | null) => void
}
// scope-chip.tsx: { scope: SettingScope } → [🌐 PLATFORM]/[🏬 GROUP]/[🏢 COMPANY] Badge
// advanced-section.tsx: { count?: number; defaultOpen?: boolean; children } — Collapsible, '▸ Advanced (N settings)', closed by default
// settings-group-card.tsx also exports StatusDonut({ value, total }) — 20px SVG ring for '5 of 8 active'
```

Behavior (decided): uncontrolled drill state `useState<string | null>`; launcher = `grid gap-3 sm:grid-cols-2 xl:grid-cols-3`, each card one whole-clickable `<button>` (min-h 88px, `focus-visible:ring-2`, `rounded-[8px] border border-gray-200 bg-white hover:border-blue-700/40 hover:shadow-sm text-left p-4`; icon in 40px tinted square, `line-clamp-1` description, chips row, `CaretRight`); persistent search `Input` (MagnifyingGlass icon) live-filters against title+description+keywords, Enter opens top match, typing while drilled-in pops back to filtered launcher (plain Input + rank fn, NOT CommandDialog); drill-in header = existing `src/components/common/back-button.tsx` + breadcrumb `Settings / {title}` + ScopeChip + role badges; platform-scoped groups sort last.

Launcher wireframe (target):
```
│  Leave settings                          [🔍 Search settings…        ]  │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │ [🌴] Leave types       │ │ [✓] Approvals &        │ │ [📅] Calendars │ │
│  │      & policies        │ │     delegation         │ │  & holidays   │ │
│  │ What people can take   │ │ Who signs off, in      │ │ Working days  │ │
│  │ (4 types)(2 policies) ›│ │ what order (3 chains) ›│ │ (12 holidays)›│ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
```

Progressive-disclosure rules (system-wide, enforce in reviews): launcher ≤8 groups (overflow → one "Advanced & global" group, never a 9th peer card); inside a group defaults first, one `AdvancedSection` last; roles/scope are badges never prose; card description = one line, labels ≤5 words.

- [ ] **Step 1:** Build the 5 files. **Step 2:** tsc + build (components unused yet — no visual check possible).
- [ ] **Step 3:** Commit: `feat(reorg): SettingsWorkspace launcher/drill system + support primitives`

### Task B2: Leave migration (wrap-only) — 10 config tabs → 7 visual groups

**Files:**
- Create: `src/features/leave/components/settings-groups.tsx` (exports `useLeaveSettingGroups(stores): SettingGroup[]`)
- Modify: `src/features/leave/components/config-tab.tsx` (delete the 10-trigger TabsList; render `<SettingsWorkspace title='Leave settings' groups={...} />`)

Mapping (each group's `render` wraps existing components unchanged; no config-* file rewritten):

| Existing file(s) | Group | Status chips |
|---|---|---|
| `config-types.tsx` + `config-policies.tsx` | Leave types & policies | "4 types · 2 policies active" |
| `config-approvers.tsx` + `config-workflows.tsx` + `config-timeoff-admins.tsx` | Approvals & delegation | "3 chains · FMLA on" |
| `config-calendar.tsx` + `config-holidays.tsx` | Calendars & holidays | "12 holidays · Mon–Fri" |
| `config-shifts.tsx` | Shifts | "2 shifts" |
| `config-general.tsx` | General rules | "Defaults" |
| `config-global.tsx` | Global & platform (`scope:'platform'`, `roles:['Platform Admin']`) | — |
| `EngineArtifactsPanel module='Leave Management'` | Engine features (`Plug` icon, StatusDonut "N of M active") | — |

Status chips derive from stores the config tab already receives (`config.types.length` etc.). Export a small `useEngineArtifactCounts(module)` helper from the workflows feature for the donut (same filter the panel uses). Known risk: `ConfigGeneral`/`ConfigCalendar` take `onNextStep` (wizard flow dies with the launcher) — make the prop optional or pass a noop at these two call sites. Verified: `config`, `settings`, `globalSettings` stores are all available in `config-tab.tsx` for the render closures.

- [ ] **Step 1:** `settings-groups.tsx` + config-tab rewrite + `useEngineArtifactCounts`.
- [ ] **Step 2:** Verify: tsc; build; Playwright — Leave Admin shows 7 cards (screenshot); search "holiday" + Enter drills into Calendars & holidays; Back returns; drill into each of the 7 groups and screenshot — every pre-existing setting is still reachable; as Company Admin the platform-scoped group is hidden.
- [ ] **Step 3:** Commit: `feat(reorg): Leave admin → SettingsWorkspace (10 tabs → 7 visual groups)`

### Task B3: Visual primitives + Leave showcase

**Files:**
- Create: `src/components/common/settings/toggle-tile.tsx`, `approver-chain-editor.tsx`, `rule-pill-builder.tsx`, `calendar-preview.tsx`
- Modify: `src/features/leave/components/config-approvers.tsx` (chains → `ApproverChainEditor`, existing `MappingTable`s move into `AdvancedSection`), `config-holidays.tsx` (`CalendarPreview` on top, CRUD table below/Advanced), `config-general.tsx` (booleans → `ToggleTile` grid, rest → Advanced)

**Interfaces:**
```ts
// toggle-tile.tsx — big icon + label + Switch; whole tile toggles (Label htmlFor Switch), min-h-[72px]
export interface ToggleTileProps { icon: ReactNode; label: string; description?: string; checked: boolean; onCheckedChange: (c: boolean) => void; disabled?: boolean; scope?: SettingScope }
export function ToggleTileGrid({ children }: { children: ReactNode })  // grid gap-2 sm:grid-cols-2 lg:grid-cols-3

// approver-chain-editor.tsx — avatar/role chips connected by arrows
export interface ApproverStep { id: string; label: string; kind: 'role' | 'person' | 'group'; avatarUrl?: string; meta?: string }
export interface ApproverChainEditorProps { title: string; steps: ApproverStep[]; onChange: (s: ApproverStep[]) => void; stepOptions: ApproverStep[]; maxSteps?: number /* 5 */; readOnly?: boolean }
// reorder: HTML5 drag PLUS keyboard-accessible ‹ › buttons on hover/focus; remove via × on chip; '+ Add step' = Popover+Command picker; empty = dashed '+ Add first approver'

// rule-pill-builder.tsx — When (attr)(op)(value) → [outcome] as clickable pills (Badge-styled buttons, Popover+Command per pill; free values = Input); leading ●/○ mini enable Switch; ⋯ = DropdownMenu duplicate/delete
export interface RuleClause { attributeId: string; operator: string; value: string }
export interface Rule { id: string; when: RuleClause[]; outcomeId: string; enabled: boolean }
export interface RuleAttribute { id: string; label: string; operators: string[]; values?: { id: string; label: string }[]; valueType?: 'text' | 'number' | 'duration' }
export interface RulePillBuilderProps { rules: Rule[]; onChange: (r: Rule[]) => void; attributes: RuleAttribute[]; outcomes: { id: string; label: string; tone?: SettingStatusChip['tone'] }[]; maxRules?: number }

// calendar-preview.tsx — read-mostly month strip on ui/calendar.tsx modifiers; markers as colored dots + legend
export interface CalendarMarker { date: string; label: string; kind: 'holiday' | 'optional' | 'closure' }
export interface CalendarPreviewProps { markers: CalendarMarker[]; workingDays: number[]; months?: number /* 3 */; onSelectDate?: (iso: string) => void /* opens existing add/edit dialog */ }
```

Chain editor wireframe (target):
```
 Time-off approval chain
 ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
 │ (RM)  Reporting  │ ─▶ │ (HR)  HR Partner │ ─▶ │ (🛡)  Time Off   │  [+ Add step]
 │ ⠿    Manager  ‹›×│    │ ⠿   Level 2   ‹›×│    │ ⠿   Admin     ‹›×│
 └──────────────────┘    └──────────────────┘    └──────────────────┘
```
Rule pill wireframe (target):
```
 ● When (Hours worked) (is more than) (10 /day)  →  [⚠ Flag for review]   [⋯]
 ○ When (Location)     (is)           (Remote)   →  [Skip shift check]    [⋯]
 [+ Add rule]
```

- [ ] **Step 1:** Build the 4 primitives. **Step 2:** Swap into the 3 Leave config components (leftovers → AdvancedSection).
- [ ] **Step 3:** Verify: tsc; build; Playwright — approver chain renders as chips+arrows, add a step via picker, reorder via ‹ ›; holiday calendar shows dot markers; General rules shows toggle tiles; state changes persist within the session (toggle → navigate away → back).
- [ ] **Step 4:** Commit: `feat(reorg): visual settings primitives + Leave showcase`

### Task B4: Lifecycle + Recruitment migration (wrap-only + chain editor reuse)

**Files:**
- Create: `src/features/lifecycle/components/settings-groups.tsx`, `src/features/recruitment/components/settings-groups.tsx`
- Modify: each module's config/admin tab component to render `SettingsWorkspace`; swap `ApproverChainEditor` into both approvals groups (cheap Phase-B3 reuse)

Groupings (16 → 7 each):
- **Lifecycle:** Onboarding (`config-onboarding`) · Probation (`config-probation`) · Exit (`config-exit` + `config-exit-flow` + dialogs) · Knowledge transfer (`config-kt`) · Approvals (`config-approvals` → ApproverChainEditor) · Templates & widgets (`config-templates` + `config-widgets`) · Engine features.
- **Recruitment:** General setup (`config-setup`) · Sourcing channels (`config-sourcing`, toggles → ToggleTile) · Assessments (`config-assessment`) · Hiring & approvals (`config-hiring` + `config-approvals` → ApproverChainEditor) · Compensation (`config-compensation`) · Onboarding handoff (`config-onboarding`) · Engine features.

- [ ] **Step 1:** Both settings-groups files + tab rewrites. **Step 2:** Verify: tsc; build; Playwright launcher + all-groups-reachable screenshots for both modules.
- [ ] **Step 3:** Commit: `feat(reorg): Lifecycle & Recruitment admin → SettingsWorkspace (16 → 7 groups each)`

### Task B5: Attendance migration + RulePillBuilder flagship

**Files:**
- Create: `src/features/attendance/components/settings-groups.tsx`
- Modify: attendance config tab; `config-limits.tsx` internals → `RulePillBuilder` (attributes: Hours worked/Leave type/Location etc. from existing limit config data; outcomes: Flag for review/Auto-approve/Skip check); `config-holidays.tsx` → `CalendarPreview`

Groups (7 → 6): Policies & limits (flagship RulePillBuilder) · Holidays (CalendarPreview) · Workflows & approvals · Notifications & templates · Audit · Engine features.

- [ ] **Step 1:** settings-groups + tab rewrite + the two primitive swaps.
- [ ] **Step 2:** Verify: tsc; build; Playwright — edit a rule via pills (change operator through the Popover), toggle a rule off via ●, add a rule; holiday preview renders.
- [ ] **Step 3:** Commit: `feat(reorg): Attendance admin → SettingsWorkspace with rule-pill flagship`

---

## Final verification & deploy (after all tasks)

- [ ] `npx tsc --noEmit` → 0 errors; `npx vite build` → success.
- [ ] Full Playwright demo pass (preview on :4310, screenshots to scratchpad shots/): (1) Engines Hub browse by module & type; (2) attach artifact → appears in target module admin; (3) export + reimport bundle; (4) create custom field → appears on Leave apply; (5) attach flow → submit leave → run in Requests; (6) Leave/Lifecycle/Recruitment/Attendance launchers + drill-ins; (7) role checks (Company Admin vs Platform Admin vs Employee).
- [ ] Delete throwaway scripts, kill preview.
- [ ] `npx wrangler deploy --env production` from poc/.

## Explicitly out of scope

- Payroll (standing exclusion). Migrating the other 25 modules onto SettingsWorkspace (each is ~1 file later — the wrap pattern makes it cheap). Unifying Recruitment's home-grown `CustomFieldDef` onto the shared custom-fields engine (noted follow-up). Porting every scattered config screen into artifacts (only ~10 representative seeds in A5). Surgery on the existing 500-line instances engine (A7 adds a parallel FlowRun store instead).
