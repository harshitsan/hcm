# SatelliteHR — UI Prototype

A frontend-only, clickable prototype of **SatelliteHR** (a multi-tenant HR SaaS), built to bring the product-design roadmap in [`../SatelliteHR-Explained-and-Product-Roadmap.md`](../SatelliteHR-Explained-and-Product-Roadmap.md) to life. **No backend** — all data is mock data and all actions are simulated in the browser.

## Run it

```bash
cd app
npm install      # first time only
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (type-check + production build), `npm run preview` (serve the build), `npm run lint`.

## What to try

1. **Pick a persona** on the login screen — the whole UI re-scopes to that role:
   - **Platform / Provider Admin** → Companies, Company Setup, platform admin.
   - **Portfolio Manager** → multiple companies; use the **context switcher** (top-left) to jump between them with no re-login.
   - **Company HR Admin** → the full company toolset.
   - **People Manager** → team + approvals.
   - **Employee** → the calm self-service view (notice how much is hidden).
2. **Home** is the **unified inbox** — every approval/to-do in one list.
3. **Admin → Company Setup** — the 6-step guided wizard (progressive disclosure + sensible defaults).
4. **Admin → Workflow Builder** — the visual, run-time approval-rule builder with a live "Run preview".
5. **Reports** — the data-dense analytics dashboard (charts via Recharts).
6. Toggle **light/dark** (top bar) and resize to mobile — the layout adapts.

## Stack & structure

React + Vite + TypeScript + Tailwind (matches the roadmap's React stack). Calm enterprise design system: Plus Jakarta Sans, slate neutrals, indigo/emerald accents, full light + dark via CSS tokens.

```
src/
  components/ui.tsx     # hand-built UI primitives (Button, Card, Modal, Table, Stepper, …)
  components/shell.tsx  # app shell: role-scoped sidebar, topbar, company switcher
  app/store.tsx         # persona/role + company context + theme (localStorage, no backend)
  app/nav.tsx           # role-scoped navigation (the calm IA from the roadmap)
  data/mock.ts          # single source of mock data for every screen
  pages/                # one file per screen (Home, Directory, Leave, CompanySetup, …)
```

> This is a design prototype: data resets on reload, "save"/"approve" actions show a toast rather than persisting.
