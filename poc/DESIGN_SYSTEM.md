# SatelliteHR Design System — "Mission Control"

> Every HR module, one orbit.

SatelliteHR's brand takes its name literally: a **core** (the organisation)
with **satellites** (modules, tenants, artifacts) in governed orbit around it.
The interface is a mission-control room: calm deep-space grounds, luminous
telemetry accents, and one warm signal color reserved for action.

---

## 1. Brand identity

### Logo
- **Mark** (`src/components/brand/logo.tsx` → `SatelliteMark`): a core sphere
  with a tilted dashed orbit ring and an orbiting satellite. The satellite
  animates (16s linear orbit, `.shr-orbit`); it is static under
  `prefers-reduced-motion`.
- **Wordmark** (`SatelliteWordmark`): `Satellite` in starlight/ink +
  `HR` in Signal (`text-signal-400`). Always set in the display face.
- **Lockup** (`SatelliteLogo`): mark + wordmark, 8px gap.
- **Favicon**: `public/brand/mark.svg` (static mark on space-900 tile).
- Minimum mark size 16px; never recolor the satellite dot — it is always
  Signal.

### Voice
Technical but human. Short verbs for surfaces: **Requests · Configure ·
Build · Classic admin**. Taglines lean on orbit metaphors:
*"authored once · governed per scope · consumed everywhere."*

---

## 2. Color

All tokens live in `src/styles/theme.css` under `@theme inline` and are used
as Tailwind classes (`bg-space-900`, `text-signal-400`, `border-orbit-500`).

### Brand scales

| Scale | Tokens | Role |
|---|---|---|
| **Space** (deep indigo) | `space-950 #05081C` · `space-900 #0A102E` · `space-800 #121A44` · `space-700 #1B2659` · `space-600 #273473` | Grounds: sidebar rail, hero cards, dark surfaces |
| **Orbit** (telemetry blue) | `orbit-500 #2E6FF2` · `orbit-400 #5B8DF6` · `orbit-300 #93B4FA` · `orbit-200 #C7D9FD` · `orbit-100 #EDF3FF` | Active states, information, links, chart primaries |
| **Signal** (flare orange) | `signal-600 #D9431F` · `signal-500 #F1552F` · `signal-400 #FF7A52` · `signal-300 #FFB49C` · `signal-100 #FFF0EA` | Primary actions ONLY — one warm accent, used sparingly |
| **Starlight** | `starlight #F2F6FF` | Light tinted bands over white (page headers, summary strips) |

### Legacy token bridge
The app's existing semantic tokens are re-pointed at the brand, so every
module inherits it without per-screen edits:

| Legacy token | Now resolves to |
|---|---|
| `blue-1200` (sidebar/dark) | `space-900` |
| `blue-1300` (active on dark) | `orbit-500` |
| `blue-150` / `blue-100` (light bands) | `starlight` |
| `orange-1200` (action buttons) | `signal-500` |

Status colors (green = success, red = destructive, yellow = warning) are
unchanged and must keep their semantics.

### Rules
- Signal appears **once per view region** (the primary action). Never use it
  for decoration at scale.
- Deep space surfaces get the `space-bg` utility (gradient + star grain),
  not flat `bg-space-900`.
- Text on space: white at 100/70/50% opacity steps only.

---

## 3. Typography

Loaded in `index.html` (Google Fonts). Tokens in `theme.css`.

| Face | Token / class | Use |
|---|---|---|
| **Bricolage Grotesque** | `--font-display` / `font-display`, and `text-h1…h4` | Headings, hero statements, stat values, wordmark |
| **Schibsted Grotesk** | `--font-sans` (default body via `--font-geist` alias) | All UI text, tables, forms |
| **Spline Sans Mono** | `--font-mono` / `font-mono` | Telemetry: IDs, keys, cron/rules, eyebrow labels, JSON |

Scale: keep the existing `text-h1…h4`, `text-paragraph-lg/md/sm`,
`text-caption` utilities — they now carry the display face on headings.
Eyebrow pattern: `font-mono text-[10px] uppercase tracking-[0.3em]` in
Signal or white/50.

---

## 4. Space, radius, elevation

- **Radius**: `--radius: 0.625rem`; cards `rounded-xl` for hero surfaces,
  `rounded-md`/`rounded-sm` for controls (existing shadcn scale).
- **Shadows**: use the `shadow-100…600` utilities; deep-space cards need no
  shadow — the gradient is the depth.
- **Density**: tables and toolbars stay compact (h-7 controls); hero and
  empty states get generous padding (p-6/p-8).

## 5. Motion

- One orchestrated moment per screen (the orbiting satellite, a staggered
  reveal) — not scattered micro-animations.
- Durations: 150ms interactions, 300ms panels (`CollapsibleContent`),
  16s ambient orbit.
- Always honor `prefers-reduced-motion` (see `.shr-orbit`).

## 6. Component conventions

- **Buttons**: primary = `bg-orange-1200` (Signal) compact pill; secondary =
  `variant='outline'`; destructive = red. Icons 10–14px, phosphor.
- **Badges**: use the semantic variants (`badge_active`, `pending`, `open`,
  `overdue`, `live`, `dropped`) — green means effectively active, grey-pending
  means blocked upstream (scope hierarchy).
- **Summary cards**: `border-t-2 border-t-orbit-500`, uppercase caption
  label, display-face value.
- **Deep-space hero**: `space-bg` + concentric `border-white/10` orbit rings
  + `SatelliteMark` — see `src/features/dashboard/index.tsx`.
- **Tables/sheets/forms**: existing shadcn idioms (DataTable, FloatingSheet,
  RHF+zod) are part of the system; follow `features/workflows/*` as the
  reference implementation.

## 7. Files

| Concern | File |
|---|---|
| Tokens (color, type, shadows) | `src/styles/theme.css` |
| Brand utilities (`space-bg`, `.shr-orbit`) | `src/styles/index.css` |
| Logo components | `src/components/brand/logo.tsx` |
| Favicon / static mark | `public/brand/mark.svg` |
| Fonts + meta | `index.html` |
