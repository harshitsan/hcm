# Policy Studio — Design

**Date:** 2026-06-10 · **Status:** Approved (4 scoping decisions answered)
**Touches:** `prototype/` (data, store, Rules.tsx, new Policies.tsx, People.tsx, CommandK.tsx, Inbox.tsx, Flows.tsx)
**Context:** BRD §E (Policy Management + Distribution & Acknowledgment) through the OpsMaven lens —
a portfolio operator selling governed HR operations across 13 service areas, multi-country.

## Decisions (from clarifying questions)

1. **Structure — policy composes rules.** Policy is the top-level artifact: a document of
   CLAUSES; each clause may bind one piece of the existing rule machinery. "Rules & flows"
   becomes a three-view page: **Policies · Rules · Approval flows** (Policies first).
   Standalone rules remain valid; policies are the composed form.
2. **Publishing — all channels, e-sign stubbed.** Platform sign-off (default; the Phase-1
   acknowledgment), email notice, Day-1 onboarding pack, self-service handbook — plus
   "DocuSign e-sign · via connector" visible but marked Phase II (BRD §3.3 excludes e-sign).
3. **Versioning — the diff decides.** Clause edits are marked material/cosmetic. Material →
   everyone covered by those clauses re-signs (what-changed panel shows only the diff);
   cosmetic → notice only. HR override available. Effective dating: v(n+1) takes effect on a
   chosen date; v(n) stays in force until then. Full version history retained.
4. **Observations — anyone, one form, two polarities.** "Report something": pick person →
   clause (only Report-bound clauses applying to them) → polarity (a concern / something
   good) → note → optional anonymity (forced for POSH). The clause's flow routes it.

## The model

```
PolicyTemplate (catalog) → instantiate → Policy
Policy { name, area, level (Platform|Portfolio|Company) + owner, applicability sentence
         (reuses who/where/team + "and…" clauses), childControl, status
         (Draft → Waiting for approval → Published), version, effectiveFrom,
         channels[], clauses[], versions[] (v, date, changes, material), history[] }
Clause { title, body, binding? }
```

Everything existing keeps working underneath: levels & live inheritance, child-controls,
role hats, approval flows, the audit log, signature analytics.

## The clause engine — three sensors, seven bindings

Every binding answers, in order: **how do we know → who acts (flow) → who hears (notify).**

**The sensor question comes first** ("how do we know?") and has exactly three honest answers:
- **The platform saw it** — events the HRMS owns (check-ins, signatures, tasks). Fully automatic.
- **A connected system told us** — Zoom camera-time, ITSM, payroll engines. Real but Phase II;
  shown stubbed ("via connector").
- **A person reported it** — conduct/etiquette. The platform never surveils; it structures what
  humans observe: capture, routing, response deadlines, repeat-pattern memory, evidence trail.

| Binding | Plain name | Example | Behavior |
|---|---|---|---|
| sign | People sign this | Code of conduct | Read-&-sign tracking (existing) |
| watch | The system watches | Check-in by 9:05 | Auto-fires → ticket via flow (existing triggers) |
| report | People can report | Cameras on in client calls | Observation form, concern/kudos, anonymity, repeat threshold ("3rd in a quarter → escalates") |
| number | It sets a number | WFH allowance ₹2,000/mo | Feeds payroll/letters; region variants (existing) |
| deadline | It has a deadline | Offer letter in 1 business day | SLA metric: % met, breach → escalation (OpsMaven's heart) |
| checklist | It spawns tasks | Day-1: device, access, seating | Task list fired at the right lifecycle moment, with owners |
| training | It requires training | POSH training in 30 days | Completion tracked; overdue → reminder → escalation |

## The template catalog

Seeded templates across OpsMaven's areas, each card showing "what this covers" + "how
performance is measured" (its deadline clauses). Fully-built seeds (3–5 wired clauses each):
Remote & Hybrid Work · Respect at Work (POSH) · Code of Conduct · Onboarding & Day-1
Readiness · Exit & Final Settlement · Payroll & Statutory Calendar (**country variants**:
India PF/ESI/POSH · US W-4/I-9 · ANZ Super/KiwiSaver · Mexico IMSS/CFDI) · Hiring SLAs ·
Leave & Attendance. Gallery also lists lighter entries (Benefits & Claims, Performance
Cycle, Expense & Travel, Data Protection, Grievance & ER, Probation) to show breadth.

## The journeys

**Generator** (from the Policies view, "New policy"): template gallery (+ country variant
pick) → scope (level + company + applicability sentence) → auto-populated **clause-by-clause
review**: each clause card = editable text + binding picker (sensor → kind → light config +
flow + notify) with a live "how it will work" line → publish step: channels + effective date
+ re-acknowledgment preview ("312 re-sign · 41 get a notice") → Draft / Send for approval /
Publish. Publishing with a sign clause drops the policy into employees' Documents inbox
(adds an AckDoc) and writes audit events.

**New version**: open a published policy → "New version" → edit clauses (each edit marked
material/cosmetic) → publish shows the diff + who re-signs + effective date. Version
timeline lives in the policy detail drawer.

**Report something**: from a person's profile drawer or ⌘K. Creates an Observation, routes
via the clause's flow → ticket appears in the approver's Inbox marked with its source
policy/clause; kudos route to recognition (manager notified). Repeat counts surface on the
ticket ("3rd camera concern this quarter"). Everything in Activity.

**Compliance, in the detail drawer**: per-policy analytics — sign % (existing per-company /
per-team scoping), deadline clauses' % met, open observations by polarity, version history —
plus an "Audit evidence pack" button (stub toast: exports in the real thing).

## Workflow-engine coverage (BRD §6.25)

Sequential ✓ + parallel ✓ (flows, built) · SLA + escalation ✓ (built) · delegation ✓ (built)
· audit ✓ (built) · **conditional routing — added now**: FlowStep gains `onlyWhen?` rendered
as "only when {condition}" (e.g., offers > ₹20L add the CEO step).

## Build scope (prototype = mock/session state, as throughout)

- data.ts: Policy/PolicyTemplate/Clause/Binding/Observation types + seeds (2 published
  policies incl. Remote & Hybrid Work v2 with the camera clause + 1 draft; 8 full templates;
  3 observations incl. a repeat). store.tsx: policies/observations slices, publish/version/
  report actions, AckDoc injection, audit events.
- New `pages/Policies.tsx` (view component mounted by Rules.tsx): list, detail drawer
  (clauses + bindings + analytics + versions), generator, new-version flow.
- Rules.tsx: three-way view switch. Flows.tsx: `onlyWhen` on steps. People.tsx: "Report
  something" in the person drawer. CommandK: report action. Inbox: observation tickets
  (new kind 'Report') with source pill.
- Out of scope: real email/e-sign/connectors, OR-logic in applicability, per-clause
  child-control overrides (policy-level only).

## Testing

Playwright suites: generator end-to-end (template → scope → clause binding → publish →
appears in Documents), camera-on observation round trip (report → inbox ticket → repeat
note → activity), kudos path, new-version diff → re-ack preview, conditional flow step
rendering, persona scoping (Sara company-only; David portfolio).
