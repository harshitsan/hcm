# Task A5 Report — category-list & calendar artifact kinds with visual editors

## Status: DONE

## Changes Made

### 1. `src/features/workflows/data/business-logic.ts`

**Type system additions:**
- Added `'category-list'` and `'calendar'` to `FORM_ARTIFACT_TYPES` (they appear at the end of the array).
- `ARTIFACT_TYPES` auto-derives from `FORM_ARTIFACT_TYPES` + `'flow'` — no separate change needed.
- Extended `ARTIFACT_TYPE_LABELS` with `'Category list'` and `'Calendar'`.
- Added new interfaces: `CategoryItem`, `CalendarEntry`, `CalendarType`, `CALENDAR_TYPES`, `CALENDAR_TYPE_LABELS`, `CALENDAR_DAYS` constants.
- Extended `ArtifactDefinition` union with the two new variants and template optional fields (`channel`, `event`, `templateKind`).

**Seed artifacts (bl-21 through bl-29 — 9 new seeds):**
- `bl-21` — Leave Types (category-list, Leave Management)
- `bl-22` — Asset Categories (category-list, Asset Management)
- `bl-23` — Exit Reasons (category-list, Employee Lifecycle)
- `bl-24` — Document Categories (category-list, Documents)
- `bl-25` — National Holiday Calendar 2026 (calendar/holiday, Leave Management)
- `bl-26` — Standard Shift Pattern (calendar/shift, Time & Attendance)
- `bl-27` — Support SLA Business Hours (calendar/business-hours, Feedback & Grievance)
- `bl-28` — Probation Confirmation Notification (template with channel/event/templateKind, Notifications)
- `bl-29` — Relieving Letter Template (template with channel/event/templateKind, HR Letters & Certificates)

Seeds span 7 different targetModules so the Hub "By module" rail lights up across the catalog.

### 2. `src/features/workflows/components/artifact-builder-sheet.tsx`

- Imported `CALENDAR_DAYS`, `CALENDAR_TYPE_LABELS`, `CALENDAR_TYPES` from business-logic.
- Extended Zod schema with `categoryItems`, `calendarType`, `calendarEntries` fields.
- Extended `superRefine` validation for both new kinds (required labels, date for holidays, times+days for shift/business-hours).
- Extended `emptyValues` with new defaults.
- Extended `toValues` to populate form from existing category-list and calendar definitions.
- Extended `toDefinition` to map form values → `ArtifactDefinition` for both new kinds.
- Added `useFieldArray` hooks for `categoryItems` and `calendarEntries`.
- **Category-list editor:** chip-style row per item — label Input + active Switch + remove button. "Add item" button appends rows.
- **Calendar editor:** calendar-type Select (locked on edit), then entry rows. Holiday mode: label + date picker. Shift/business-hours mode: label + start/end time pickers + weekday toggle pills (Mon–Sun).

### 3. `src/features/workflows/components/artifact-detail-sheet.tsx`

- Imported `CALENDAR_TYPE_LABELS`.
- Extended `DefinitionView` switch with `'category-list'` case: renders each item with label + active/inactive Badge.
- Extended `DefinitionView` switch with `'calendar'` case: shows calendarType badge + entry rows with date or time+days.
- Extended template `case` to show optional `channel`, `event`, `templateKind` metadata badges above the template body pre-block.

## Verification

- `artifact-io.ts` `parseBundle` validates `type ∈ ARTIFACT_TYPES` (reads the const at import time) and `def.kind === type` — new types flow through automatically without any changes.
- `hub-catalog.tsx` "By type" rail iterates `ARTIFACT_TYPES` and reads from `ARTIFACT_TYPE_LABELS` — new types appear automatically.
- `npx tsc --noEmit`: 0 errors.
- `npx vite build`: build passed (size warnings are pre-existing, not introduced by this task).

## Commit

`feat(reorg): category-list & calendar artifact kinds with visual editors`

---

## Fix round 1

### Finding 1 — template metadata fields silently dropped

**File:** `poc/src/features/workflows/components/artifact-builder-sheet.tsx`

**Changes:**
- Added three optional Zod schema fields: `templateChannel` (`z.enum(['', 'Email', 'In-app', 'SMS']).optional().default('')`), `templateEvent` (`z.string().optional().default('')`), `templateKindMeta` (`z.enum(['', 'letter', 'notification']).optional().default('')`).
- Added matching defaults to `emptyValues`.
- In `toValues`, the `'template'` case now also sets `templateChannel`, `templateEvent`, `templateKindMeta` (coalescing to `''` if undefined).
- In `toDefinition` case `'template'`, spread the three fields only when non-empty, casting to the correct union types from `business-logic.ts`.
- In the template JSX block, wrapped the existing body `FormField` in a `<div className='space-y-3'>` and appended a 3-column grid row with: a `<Select variant='secondary'>` for Channel (None/Email/In-app/SMS), an `<Input>` for Trigger event, and a `<Select variant='secondary'>` for Template kind (None/Letter/Notification) — all using the standard `FormField + FormItem + FormLabel + FormControl + FormMessage` pattern.

### Finding 2 — `calendarType` validates on all artifact kinds (latent footgun)

**Change:** `calendarType: z.enum(CALENDAR_TYPES)` changed to `z.enum(CALENDAR_TYPES).optional().default('holiday')` — Zod's `.default()` means the field is always present in parsed output, so existing calendar-kind logic in `toDefinition` and `toValues` is unchanged.

### Verification

- `npx tsc --noEmit`: 0 errors
- `npx vite build`: passed (chunk size warnings are pre-existing)
