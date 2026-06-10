# Policy Enforcement Model — Parent → Child, Fully Dynamic, Fully Audited

**The platform's core promise:** a rule set once at a parent level is *law* for every
descendant — current and future — without copying, re-sending, or manual syncing.
This document defines that model. The UX prototype (`prototype/`) demonstrates it;
the governance engine in `app/` (`policies.tsx`, see
`docs/superpowers/specs/2026-06-10-policy-governance-precedence-approval-design.md`)
implements the lifecycle mechanics.

---

## 1. The enforcement chain

```
Platform  ─▶  Portfolio  ─▶  Group Company  ─▶  Company  ─▶  (people, via applicability)
```

Every rule **lives at exactly one level** (its *owner level*) and **lands on every
company in its scope below**. Owner level answers "who controls it"; scope answers
"where it runs."

| Level | Who authors here | Default scope |
|---|---|---|
| Platform | Platform operator | Every company on the platform |
| Portfolio | Portfolio manager | Every company in that portfolio |
| Group company | Group admin | Every member of the group |
| Company | Company HR admin | That company only |

## 2. Enforcement is a relationship, not a copy

This is the load-bearing decision. A parent rule is **never duplicated into** child
companies. Scope is **evaluated live** at read time:

- **A company joins** a portfolio/group/platform → it is *instantly* inside the scope
  of every running parent rule. Nothing is provisioned, pushed, or re-sent.
  (Demo moment: the Add-a-company pre-flight shows "N platform rules apply
  automatically" — before the company even goes live.)
- **A company leaves** → those rules release it, same instant, by the same evaluation.
- **A parent edits a rule** → one change, every child sees it the moment it's
  (re-)approved. There is no "out-of-date copy" failure mode, because there are no copies.

## 3. What children may do — the three child-controls

Every parent-level rule declares its posture toward descendants, in plain words:

| Control | Meaning | Child experience |
|---|---|---|
| **Use as-is** (locked) | Compliance-grade; children cannot touch it | Shown with a lock: "Set above you — runs here automatically" |
| **Can adjust** | Children may tighten or localize, never weaken below the parent baseline | "Adjust for your company" affordance; the parent baseline stays visible |
| **Optional** | A template/starting point; children opt in | "Adopt this" affordance; nothing runs until adopted |

## 3b. Who approves — role hats and how they're filled

Approval steps name **roles, never people** ("Finance", "HR" are *hats*). A parent rule
declares how the hats get filled, and this is what makes one chain work across N children:

| Mode | Meaning | Example |
|---|---|---|
| **Their own people** (local, default) | The hat is filled *in the company where the request starts* | Festive bonus letters: Acme asks → Acme's Finance (Isha) decides; Beta asks → Beta's Finance (Joseph) decides |
| **Your central team** | The owner level's own team decides for everyone (shared-services / compliance) | Rule changes: the platform's Legal council reviews every company's changes |

Consequences the system must surface:
- **People churn never breaks chains** — hats attach to roles; a new Finance lead inherits
  the hat the moment the role is assigned.
- **An empty hat is an enforcement gap**: if a company in scope has nobody wearing a
  required hat, the rule *cannot route there*. This must be visible to the parent
  ("Can't run in Gamma Retail yet — nobody wears the Finance hat there"), not discovered
  when a request silently stalls.

## 4. When levels collide — precedence and shadowing

Same topic, multiple levels → the **precedence order** decides (default: higher
governance wins, `Platform > Portfolio > Group > Company`; platform admin can reorder).
The loser isn't deleted — it's **shadowed**, and the UI states the *outcome*, never the
mechanism: *"Quiet — covered by Global data protection, set at platform level."*
Nobody computes precedence in their head.

## 5. Nothing enforces without approval

A rule's lifecycle is gated: **Draft → Waiting for approval → Approved → Running**
(→ Paused). This applies to *changes* too — editing a running platform rule produces
a new pending version; children keep running the approved version until the change
clears its approval chain. Approvers are roles (Legal, HR council, Finance…) attached
per-rule as an ordered chain.

## 6. The change audit — every event, on the record

Enforcement you can't reconstruct is enforcement you can't trust. Every rule carries
an append-only history; these are the events:

| Event | Recorded when | Captured |
|---|---|---|
| `Created` | Rule authored (any level) | who, level, full definition |
| `Submitted` / `Approved` / `Rejected` | Each approval step | who, role, note, timestamp |
| `Enforced` | Goes Running | scope snapshot: N companies, M people |
| `Inherited` | **A new child enters scope** | which company, why (joined portfolio / platform / group) |
| `Adjusted by child` | A child localizes a "can adjust" rule | which company, the delta |
| `Shadowed` / `Unshadowed` | Precedence outcome changes | by which rule |
| `Changed` | Parent edits (post-approval) | field-level diff, old → new |
| `Paused` / `Resumed` | Lifecycle action | who, reason |

Every entry: **who · what · when · where (scope)** — immutable, 7-year retention
(BRD §8.7), readable as a plain-language timeline in the rule's *History* panel.
The `Inherited` event is the proof of §2: when Gamma Retail joined in May, the audit
shows it inheriting every platform rule automatically, with no human action.

## 7. How the UI says all this (one glance, no jargon)

- **Set-at pill** on every rule: `Platform-wide` / `Your portfolio` / `This company`.
- **Reach line**, always live: "Runs in **5 companies** → **508 people**" — recomputed
  as companies join/leave, so the blast radius is never stale.
- **Lock language** for children: locked rules render read-only with "Set above you —
  runs here automatically"; adjustable ones offer "Adjust for your company."
- **History** on every rule: the audit trail as a friendly timeline.
- **Born-compliant moment**: Add-a-company pre-flight and success screens state the
  inherited-rule count, making the dynamic model visible at the exact moment it matters.

## 8. Spec traceability

| Requirement | Where |
|---|---|
| BRD §6.10 policies by company/jurisdiction/location/dept/group | Applicability sentence (who/where/team) × owner level |
| BRD obj. 4–5: replicate setup, share policies across group | Levels + child-controls (no copying needed) |
| BRD §6.29 / FSD §8 audit events | §6 event taxonomy |
| FSD §3.2.3 standardized policy deployment (PORT-FR-009) | Portfolio-level rules + blast-radius review |
| Governance design (app): precedence, approval gate, shadowing | §§4–5 (same model, same vocabulary) |
