# SatelliteHR — Proof of Concept

Frontend-only implementation of **all 1,174 SatelliteHR user stories**
(`kensiumhr-satellite-overlap/` — BRD + Company Management functional spec,
enriched with Kensium HRMS operational depth) as **31 feature modules** with
mock in-memory data. Based on the `mls-apartment-frontend-v2` template
(React 19 · Vite · TanStack Router/Query · shadcn/ui · Tailwind 4 · RHF + zod).

## Quick start

```bash
npm install
cp .env.example .env   # placeholder env — no backend needed
npm run dev            # http://localhost:5173
```

Sign-in is bypassed (mock tokens are seeded automatically).

## How it works

- **Roles** — the sidebar header has a role switcher for the 6 canonical
  actors (Platform Admin, Portfolio Admin, Group Company Admin, Company Admin,
  Employee (User), Employee (Non-User)). Every module gates its role-specific
  actions through `useRole()`/`RoleGate` (`src/context/role-context.tsx`),
  matching each user story's role.
- **Modules** — one feature folder per module under `src/features/<slug>/`
  (data + in-memory store hooks + components + page), one route folder under
  `src/routes/_authenticated/<slug>/`. The dashboard (`/`) links to all of
  them, grouped: Organization · Workforce · Policies & Comms · Platform.
- **Data** — hand-written seed data mutated by in-memory hooks (resets on
  reload). No API calls are made.

## Story traceability

Module stories live in `../kensiumhr-satellite-overlap/<module>_stories.csv`
(columns include role, Gherkin acceptance criteria, and BRD/FunSpec/Kensium
source references). Each module page implements its CSV's stories as visible
UI capabilities.
