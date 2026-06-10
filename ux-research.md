# SatelliteHR — UX Research & Simplification Strategy

**Sources:** `SatelliteHR Phase I-BRD (1).md` · `SatelliteHR-FunctionalSpec-CompanyManagement (2).md`
**Date:** 2026-06-10
**Goal:** Translate a dense, enterprise-grade multi-tenant HRMS spec into a product that feels as simple as a consumer app — no jargon, no dead ends, every screen answering "what do I do next?"

---

## 1. The Core UX Problem

The BRD describes a system with **4 administration tiers** (Platform → Portfolio → Group Company → Company), **18+ roles**, **29 modules**, and concepts like "tenant isolation," "portfolio constructs," "applicability dimensions," and "effective-dated manager assignments."

The people who will actually use it are:

- an HR executive who wants to approve a leave request before lunch,
- an employee who wants to know how many sick days they have left,
- a shared-services manager juggling 5 companies who is terrified of doing something in the *wrong* company,
- a platform operator onboarding a new client who must not miss a setup step.

**The spec is organized by *system capability*. The product must be organized by *user intent*.** That single inversion drives everything below.

---

## 2. Who We're Designing For (Personas, collapsed from 18 roles)

The BRD lists 18 roles across 6 tables (§5.2–5.7). For UX purposes these collapse into **5 experience archetypes** — roles within an archetype share the same mental model and differ only in permissions:

| Archetype | BRD roles it absorbs | Primary intent | Anxiety to design away |
|---|---|---|---|
| **Operator** (platform) | Platform Super Admin, Ops Admin, Security Admin | Provision companies, keep tenants healthy | "Did setup complete fully? Did I miss a step?" |
| **Multi-company Manager** | Portfolio Manager, Portfolio HR Ops, Group Admin, Group/Portfolio Viewers | Run HR across N companies efficiently | "Which company am I acting in right now?" |
| **Company Admin** | Company Super Admin, HR Admin, IT/Security Admin, Finance Viewer | Configure once, then run day-to-day HR | "Will this policy/workflow actually fire the way I think?" |
| **Manager** | Department Head, Functional/Project Manager | Approve things, see my team | "What's waiting on me, and is it urgent?" |
| **Employee** | Employee Standard/Limited, Candidate, Panel Member | Self-service: leave, attendance, documents, acknowledgments | "Where do I do X? Did my request go through?" |

**Design rule:** every screen is designed for exactly one archetype. If a screen tries to serve two, split it.

---

## 3. Jargon Translation Layer

Spec language must never reach the UI. A canonical glossary, enforced in design review:

| Spec / BRD term | What users see | Why |
|---|---|---|
| Tenant / Tenant provisioning | **Company** / "Add a company" | Nobody outside SaaS engineering says "tenant" |
| Company context switching | **"You're working in: Acme Corp"** + switcher | Name the state, not the mechanism |
| Portfolio construct | **"Your companies"** | The grouping matters less than the list |
| Group-company structure | **"Related companies"** | Plain relationship language |
| Policy applicability criteria | **"Who this applies to"** | Question form beats noun-stack |
| Effective dating | **"Starts on …"** / "Takes effect from …" | Dates are concrete |
| RBAC / permission sets | **"What this person can do"** | Capability language |
| Acknowledgment SLA escalation | **"Reminder schedule"** | Describes the outcome |
| Workflow engine / conditional routing | **"Approval steps"** / "If X, then route to Y" | Show the chain, hide the engine |
| Impersonation | **"View as [name]"** (with visible banner) | Familiar from Google/Stripe |
| Sandbox import validation | **"Test run (nothing is saved)"** | States the safety guarantee |
| Statutory compliance enablement | **"Required by law in [state]"** badge | Localize the obligation |
| Master data | **"Company setup"** | "Master data" means nothing to HR |
| Requisition | **"Job opening"** | Industry-neutral |
| Regularization | **"Fix my attendance"** | Action phrasing |

**Rule:** if a label needs a tooltip to be understood, the label is wrong. Tooltips are for *extra* detail, never for *basic* meaning.

---

## 4. The Five Journeys That Must Be Flawless

Rather than polishing 29 modules equally, invest in the journeys that carry 90% of usage and 100% of first impressions.

### Journey 1 — Operator: "Bring a new company online" (UC-COMP-001)

The spec defines a 6-step creation wizard (COMP-FR-001) plus ~10 follow-on configuration areas scattered across modules (org structure, calendars, policies, workflows, templates, people import, access provisioning). Today's spec leaves the operator to discover those follow-ons themselves.

**UX approach: one continuous guided journey, not "create then configure."**

- **Start from a template or an existing company.** BRD objective #4 explicitly calls for replication of setup to accelerate onboarding. Lead with it: "Indian IT Services," "Manufacturing," "Start from Acme Corp," "Start blank." A pre-filled wizard converts 2 days of form-filling into 2 hours of review-and-adjust. *(Validated in the prototype: the 14-step "Add a Company" wizard with template gallery — see `app/src/pages/CompanySetup.tsx`.)*
- **Group steps into 3 phases with a visible rail:** ① Foundation (profile, locations, org, calendars) → ② Configuration (access, policies, workflows, templates) → ③ Rollout (people, provisioning, acknowledgment, go-live). The rail shows done / current / upcoming at a glance — progress is the motivator.
- **Save-as-draft everywhere** (the spec requires it; the UX should make it invisible — autosave with a "Draft saved" whisper, never a Save button to remember).
- **Pre-flight checklist at Go-Live**, not error messages after. "✅ 3 locations · ✅ 5 leave policies · ⚠️ No approval chain on Expense claims — fix or skip?" Green-light energy, not red-flag energy.
- **The success screen teaches the next action:** "Acme Corp is live. 24 invitations sent. Next: watch acknowledgments come in →"

### Journey 2 — Multi-company Manager: "Act in the right company, every time"

The #1 risk in this product is **cross-company mistakes**. PORT-FR-004/007 specify a header dropdown + indicator; that's necessary but not sufficient.

- **Make the active company impossible to miss:** company name + logo in the header *and* a subtle per-company accent color on the workspace chrome (the spec already suggests optional color coding — make it default).
- **Switching is instant and reversible** — no logout, no full reload, recent companies on top, ⌘K searchable.
- **Confirm-on-consequence, not on-switch:** switching context is free; *destructive or bulk actions* state the company in the confirmation: "Terminate 3 employees **in Beta Inc**?"
- **A true cross-company home:** "Across your 5 companies: 12 approvals waiting · 3 policies pending rollout · 1 import failed." Each item deep-links and auto-switches context (PORT-FR-006 bookmarkable URLs make this cheap).
- **Push-to-many flows show the blast radius:** when deploying a standardized policy (PORT-FR-009), the review step lists every affected company with per-company employee counts before "Deploy."

### Journey 3 — Company Admin: "Set a rule and trust it runs itself"

Policies, workflows, notifications, and applicability (BRD §6.10, §6.25, §6.27) are the most abstract part of the system. The fix is a **single repeated composition pattern** so admins learn it once:

> **Define the rule → choose who it applies to → attach the approval flow → set the notifications → see it run.**

- **One canonical "rule editor" layout** reused for leave policies, attendance rules, letter triggers, and acknowledgment campaigns. Same panel order every time. Familiarity is the simplification.
- **"Who this applies to" as a sentence builder, not a filter grid:** "Applies to **all employees** in **Bengaluru** in **Engineering**" — each bold chunk is a click-to-edit chip. Show the *live headcount* it resolves to ("→ 142 people"). Numbers make abstraction concrete.
- **Approval chains as a visual pipeline:** boxes and arrows (Manager → Dept Head → HR), drag to reorder, click to add SLA/escalation. Never a table of "Level 1 / Level 2 / approver_type."
- **Preview before publish:** "Simulate: Priya (Engineer, Bengaluru) requests 3 days sick leave → auto-approved, manager notified." A worked example beats any documentation.
- **Lifecycle states in plain words with one primary action each:** Draft → *Submit for approval* → Pending → *Review* → Approved → *Turn on* → Active → *Pause*. (Mirrors the approval-gated policy lifecycle already built in `app/src/app/policies.tsx`.)
- **When rules collide across levels** (Platform vs Group vs Company policy), show the outcome, not the mechanism: a "Shadowed by Global Data Protection (Platform)" chip with a one-line explainer — never make the user compute precedence in their head.

### Journey 4 — Manager: "Clear my queue in 5 minutes"

Sequential/parallel approvals, SLA tracking, delegation (BRD §6.25) collapse into one surface:

- **A single unified inbox** — leave, attendance fixes, onboarding tasks, offer approvals, probation decisions — one list, newest-deadline-first, with SLA shown as a human countdown ("due in 4h"), not a percentage.
- **Decide from the card:** approve/reject inline with the 3 facts needed (who, what, conflict/coverage info like "2 others on leave that day"). Expanding for detail is optional, never required.
- **Bulk approve the safe ones:** select-all for items the system flags as low-risk (within balance, no conflicts).
- **Delegation is one toggle:** "Out of office → route my approvals to [person] until [date]." The spec's delegation machinery hides behind that sentence.

### Journey 5 — Employee: "Do my thing in under a minute"

Phase 1 self-service (BRD §6.16) plus policy acknowledgment (§6.11):

- **Home = my numbers + my pending stuff.** Leave balance as a visual (donut: used/remaining), next holiday, "2 documents to acknowledge," last punch time. No navigation needed for the 80% case.
- **Requesting leave is 3 taps:** type → dates (calendar pre-shaded with holidays/weekends/team conflicts) → submit. Balance math shown live ("This uses 2 of your 8 casual days"). Policy enforcement happens via what the calendar *allows*, not via error messages after submission.
- **Acknowledgments feel like a checklist, not compliance:** a "For you" inbox with read-and-confirm flow, progress ("2 of 3 done"), and a receipt. Required vs optional is a badge, not a separate system.
- **Status is always trackable:** every submission gets a timeline ("Sent → With Anil (manager) → …"), same pattern everywhere — order-tracking familiarity.

---

## 5. Cross-Cutting Design Principles

### 5.1 Progressive disclosure as default

The spec's entities have 20–30 fields each (Company entity alone has 30+, FSD §4.2.1). Never show them all:

- **Forms ask only what's required to proceed** (the 5 mandatory fields of COMP-FR-002); everything else lives behind "Add more details" or gets defaults from the template.
- **Detail views lead with a summary card** (the 6 facts people check), with tabs for Legal / Contact / Commercial / History.
- **Tables show 4–5 columns max**; everything else is in the row's detail panel.

### 5.2 Status is a color + a word + an action — everywhere

The system is full of lifecycles (company: Draft→Active→Suspended→Inactive→Archived; policies; workflows; imports). One consistent grammar:

- A **badge** (color + plain word) states where it is.
- **One primary action** states what moves it forward ("Activate," "Submit for approval," "Retry import").
- A **timeline** states how it got here (re-using the audit data the spec already mandates — audit trails are a UX asset, not just compliance).

### 5.3 Empty states are onboarding

Every list the spec defines (companies, policies, departments, assets…) starts empty. Each empty state must say: what this is (one sentence) → why it matters → one button to create the first one → "or import" alternative. No "No records found."

### 5.4 Destructive and high-blast-radius actions get friction proportional to impact

- Suspend company → typed confirmation + plain-language consequence list (the spec's COMP-FR-011 effects, rewritten: "People can't log in · Running tasks will finish · Admins get an email").
- Cross-company bulk ops → affected-companies review screen.
- Everything else → instant with **Undo** (toast), because undo beats confirm for low-stakes actions.

### 5.5 Search is the escape hatch

Global search (BRD §8.8) should be a ⌘K command palette: people, companies, policies, *and actions* ("request leave," "add department"). For multi-company users it doubles as the company switcher. This single feature compensates for any navigation depth.

### 5.6 Imports must feel safe (BRD §6.24)

Migration is the scariest moment of onboarding. The flow: upload → **"Test run" with zero side effects** → per-row results ("142 ready · 3 need fixes — fix inline, don't re-upload") → commit → undo window. The spec's sandbox/rollback requirements, surfaced as visible safety.

### 5.7 Visual > textual, always

- Org structure: an editable **tree/chart**, not a parent-ID dropdown (BRD requires n-level nesting — only a tree makes that legible).
- Approval flows: **pipeline diagrams**.
- Leave/attendance: **calendars**, pre-shaded.
- Applicability: **live headcount counters**.
- Dashboards: 3–5 KPI cards + one chart, role-defaulted (§6.23), drill-down on click.

### 5.8 Notifications are calm

Event-driven email + in-app (§6.27) can easily become spam. Defaults: digest non-urgent items; real-time only for "waiting on you" and security events. Every notification has exactly one deep-linked action. Preferences are per-event-type toggles with plain names ("When someone requests my approval"), not channel matrices.

---

## 6. Information Architecture (proposed)

One product, one nav, filtered by archetype — never separate "admin portals":

```
Home            — role-aware: queue (managers), numbers (employees),
                  health (operators), cross-company digest (portfolio)
People          — directory, org chart, lifecycle (onboarding/exits)
Time Off        — calendar, balances, requests
Attendance      — punches, shifts, fix-requests
Hiring          — openings, candidates, interviews, offers
Documents       — letters, acknowledgments, files
Company Setup   — org structure, locations, calendars, custom fields   [admin]
Rules & Flows   — policies, approval flows, notification templates     [admin]
Companies       — provisioning, portfolios, groups                     [operator]
Reports         — dashboards, builder, scheduled
```

- Max **2 levels** of navigation; the third level is tabs within a page.
- Items the current role can't use are *absent*, not disabled (disabled nav teaches helplessness).
- The header always carries: active company (with switcher for multi-company users), ⌘K search, notification bell, profile.

---

## 7. Anti-Patterns to Ban (review checklist)

1. ❌ A form that mirrors the database entity (30 fields, two columns, Save at the bottom).
2. ❌ Any UI string containing: tenant, RBAC, applicability, effective-dated, master data, regularization, construct, provisioning (for non-operators).
3. ❌ Error-first validation. Prevent via constrained inputs (date pickers that exclude invalid dates, selects over free text) before validating.
4. ❌ Settings pages with no preview of effect.
5. ❌ "Are you sure?" with no statement of consequences.
6. ❌ Tables as the only view for hierarchical data.
7. ❌ Separate screens for create vs edit when one composable panel works.
8. ❌ Modal-inside-modal. Depth ≥2 → use a full page or drawer.
9. ❌ Counting on users to read documentation to operate a screen.

---

## 8. Validation Plan

| Method | Target | Success signal |
|---|---|---|
| **Task-based usability tests** (5 users per archetype) | The 5 journeys in §4 | Task completion without help; time-to-first-success: company go-live < 1 day with template; leave request < 60s; approval decision < 30s |
| **Jargon comprehension test** | Show labels to non-HRMS users | ≥90% correctly state what each label does |
| **Wrong-company error probe** | Multi-company users do 10 mixed tasks | Zero actions executed in unintended company |
| **First-run "empty product" walkthrough** | New company admin with blank tenant | Reaches a configured policy + first imported employees unaided |
| **Acknowledgment funnel analytics** (post-launch) | Distribution → open → confirm | >80% acknowledgment within SLA without escalation |
| **Instrumented friction signals** | All flows | Rage-clicks, abandoned wizards, validation-error rates per field |

---

## 9. Priorities (impact × spec-coverage)

**P0 — make-or-break first impressions**
1. Template-driven company onboarding journey (Journey 1)
2. Company context clarity + switcher (Journey 2)
3. Employee leave request + balances (Journey 5)
4. Manager unified inbox (Journey 4)

**P1 — the trust builders**
5. Rule composition pattern + simulate-before-publish (Journey 3)
6. Safe import flow (§5.6)
7. Acknowledgment inbox + funnel
8. Org chart as editable tree

**P2 — depth**
9. Cross-company digest home for portfolio users
10. Report builder + scheduled reports
11. Asset, grievance, letters surfaces (reuse the §4/§5 patterns — by this point they're free)

---

## 10. Summary

SatelliteHR's spec is enterprise-complete; the UX job is to **hide the machine and show the intent**. Five moves do most of the work:

1. **Organize by what users are trying to do**, not by module (§2, §6).
2. **Speak human** — a hard glossary with zero spec-language leakage (§3).
3. **Make the five critical journeys guided, visual, and previewable** — templates for onboarding, sentence-builders for rules, pipelines for approvals, calendars for time (§4).
4. **One status grammar + one composition pattern**, repeated until the product feels learned after one use (§5).
5. **Safety as a visible feature** — context indicators, test runs, undo, consequence-stating confirmations — because confidence, not feature count, is what makes enterprise software feel simple (§5.4–5.6).
