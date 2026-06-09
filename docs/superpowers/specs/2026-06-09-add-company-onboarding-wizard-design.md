# Add-a-Company Onboarding Wizard — Design

**Date:** 2026-06-09
**Status:** Approved (scoping questions answered)
**Touches:** `app/src/pages/CompanySetup.tsx` (rewrite) + new `app/src/pages/company-setup/` module

## Goal

Replace the existing 6-step `CompanySetup.tsx` wizard with a comprehensive **14-step guided
onboarding** that starts from a **template or clone**, so a platform admin can stand up a fully
configured company (profile → org → policies → workflows → people → go-live) in one flow.

This realizes the product's composition pattern: **define a policy → set applicability → attach a
workflow → set notifications → it runs itself.** The wizard walks the operator through authoring
each of those layers with sensible, template-seeded defaults.

## Decisions (from clarifying questions)

1. **Approach:** Expand the existing wizard into the canonical 14-step "Add a company" module.
   Reuse the existing route (`/admin/company-setup`), RBAC gate, and success screen.
2. **Access:** Platform admins only (`provider_admin` + `portfolio_manager`). Company creation
   stays a landlord function; the existing role gate is preserved.
3. **Depth:** Rich but mock. Every step is an interactive UI (forms, tables, toggles, mini
   builders) backed by local React state, pre-filled from the chosen template. No backend.

## Entry: Template / Clone gallery (step 0)

Before the numbered steps, the operator picks a starting point. Selecting one **seeds the entire
wizard state**; they then just adjust.

- **Prebuilt templates:** Indian IT Services (default), Manufacturing & Plants, Retail /
  Multi-store, Lean Startup. Each carries pre-filled locations, org, calendars, leave/attendance
  policies, workflows, letter templates, and asset categories tuned to that shape.
- **Clone existing company:** pick from the `companies` list (e.g. Kensium Pvt Ltd) — copies its
  structure/policies as a starting point (mock: maps to a representative template payload + name).
- **Start blank:** empty state, guided wizard fills it in.

## The 14 steps (grouped into 3 phases on a vertical rail)

**Phase A — Foundation**
1. **Company profile** — legal/trade name, website, registration type + number, incorporation
   date, operating jurisdictions, currency, time zone, language, initial admin invite.
2. **Locations** — offices/sites table (HQ/Branch/Plant/Store/Remote), city/state, capacity.
3. **Org structure** — Departments (with heads) → Positions → Groups (people groupings).
4. **Calendars** — holiday calendar entries + work shifts.
5. **Custom fields** — extra data fields (entity, type, required) defined before importing people.

**Phase B — Configuration**
6. **Access model** — confirm the 5 roles and who gets what scope (the access that gates the
   next steps).
7. **Policies** — leave types & rules + attendance rules, each with an applicability scope
   (company/location/department/group/employment-type). Versioned + effective-dated (shown as
   metadata).
8. **Workflows** — approval chains per trigger (leave, onboarding, exit, regularization):
   sequential/parallel steps, SLA, escalation, conditional routing note (e.g. ">5 days → HR").
9. **Templates** — letter templates (offer/appointment/confirmation/relieving) + notification
   templates that events fire.
10. **Asset categories** — optional asset tracking categories (tracked, depreciation).

**Phase C — Rollout**
11. **Bring in people** — bulk-import affordance + an editable people table; set manager hierarchy
    (now that structure + rules exist).
12. **Provision access & onboarding** — assign roles to people, toggle onboarding-checklist
    kickoff.
13. **Distribute policies** — select policies to push for acknowledgment, set ack deadline +
    reminder cadence.
14. **Go live** — final review summary; "Bring the company online" → success screen with the new
    company code, counts (locations, depts, people, policies, workflows), and links to dashboard /
    set up another.

## Architecture (isolation & clarity)

The orchestrator stays thin; each step is a small, independently-readable pure component fed
`{ state, update }`.

```
app/src/pages/CompanySetup.tsx          orchestrator: RBAC gate, template gallery, vertical
                                         step rail, footer nav, review/success screens
app/src/pages/company-setup/
  model.ts                               SetupState type, blankState, catalogs (states,
                                         currencies, role catalog…), nextCompanyCode()
  templates.ts                           SetupTemplate type + the 4 prebuilt templates +
                                         clone-source mapping; each returns a SetupState
  steps/
    index.tsx                            StepProps, the STEPS array [{key,label,short,icon,
                                         hint,phase,Component}], shared mini-widgets (RowList)
    foundation.tsx                       steps 1–5
    configuration.tsx                    steps 6–10
    rollout.tsx                          steps 11–14
```

- **Orchestrator → step contract:** every step component receives the same
  `{ state: SetupState; update: (patch: Partial<SetupState>) => void }`. Steps never reach outside
  this contract, so they're testable/readable in isolation and the orchestrator owns all state.
- **STEPS array** is the single source of truth for ordering, labels, icons, and phase grouping —
  the rail, progress, and body all derive from it. Adding/reordering a step is one array edit.
- Reuse existing `ui.tsx` primitives (Card, Field, Input, Select, Switch, Table, Badge, Button,
  ProgressBar, EmptyState, useToast). No new dependencies.
- `mock.ts` `setupSteps` (the old 6 labels) is no longer imported by CompanySetup; left in place
  (harmless) or removed if unused elsewhere — it's only referenced by the old wizard.

## Data flow

Template pick → `setState(template.build())` seeds everything → each step reads/writes its slice
via `update()` → step 14 derives a summary from state → "create" flips to a success screen
(client-only; nothing persisted, matching the rest of this prototype).

## Layout

Two-column on desktop: left = sticky vertical rail with the 3 phase headers and 14 clickable steps
(done/active/todo states, only ≤ furthest-reached are clickable), right = the active step card +
footer nav (Back / Save draft / Next, or Create on the last step). Collapses to a top progress bar
+ single column on mobile. Matches the calm aesthetic in `DESIGN-SYSTEM.md`.

## Error handling / validation

Light, prototype-appropriate: step 1 requires a legal name to advance (mirrors current behavior);
other steps are always advanceable. Row editors guard against empty rows. No async/network failure
modes exist.

## Out of scope

Real persistence, payroll, actual file import parsing, SSO config, multi-currency math. These are
acknowledged via "configure later" affordances where relevant.
