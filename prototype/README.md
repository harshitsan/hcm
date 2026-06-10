# SatelliteHR — UX Prototype

A visual prototype of [`ux-research.md`](../ux-research.md): the BRD/functional-spec HRMS
re-imagined as a warm, jargon-free, role-aware product. Cream canvas, charcoal ink,
amber accent — built to demo the five critical journeys, not to be the real app.

## Run it

```bash
npm install
npm run dev     # → http://localhost:5174
```

## How to demo

- **Persona switcher** — the dark card at the bottom of the sidebar. Five archetypes
  (ux-research §2): Priya (Employee), Arjun (Manager), Sara (HR Admin),
  David (Portfolio Manager), Maya (Platform Operator). Nav, home screen, and quick
  links change per persona.
- **Company switcher** — the pill in the top bar (multi-company personas only).
  Portfolio/operator personas land in the **All companies** global view (dark pill,
  stacked dots); picking one company recolors the whole workspace with that
  company's accent — Journey 2's "impossible to miss" context cue.
- **⌘K** — people, companies, and actions in one palette.

## The five journeys to walk through

| # | Journey | Where |
|---|---------|-------|
| 1 | Template-driven "Add a company" with phase rail + pre-flight go-live checklist | Maya → Companies → Add a company |
| 2 | Global view ↔ per-company accent switching | David → top-bar switcher |
| 3 | Rule composer: sentence-builder + live headcount + simulate-before-publish | Sara → Rules & flows → New rule |
| 4 | Manager inbox: 3-facts-per-card, bulk-approve the safe ones, one-toggle delegation | Arjun → Inbox |
| 5 | 3-tap leave request on a pre-shaded calendar with live balance math | Priya → Time off |

Everything is mock/session state — refresh resets the world.
