# HRMS — Design Documents

Derived from the reverse-engineered feature inventory in [`../kensiumhr-features.md`](../kensiumhr-features.md)
(305 screens crawled from the live Kensium HR v6). Authored by a multi-agent design pass and
consistency-reviewed. A modern, multi-tenant, **config-driven** rebuild targeting feature parity.

## Documents

| # | Document | Contents |
|---|---|---|
| **00** | **[Canonical Conventions](00-CONVENTIONS.md)** | **Controlling reference — read first.** Pins tenant key, bitemporal encoding, FK rules, config storage, workflow SoT, the 6th (Scheduler) engine, and coverage decisions. Supersedes any conflicting fragment elsewhere. |
| 01 | [Delivery Roadmap](01-ROADMAP.md) | Phased plan (Foundation → Hire-to-retire spine → Operate & Pay → Satellites), MVP, dependency graph, gantt |
| 02 | [System Design](02-SYSTEM-DESIGN.md) | Architecture style, 4-layer config-driven model, multi-tenancy, tech stack, NFRs, security posture |
| 03 | [Database Design](03-DB-DESIGN.md) | Part I: bitemporal core domain, config engine, audit, tenancy/RLS. Part II: per-module schemas |
| 04 | [High-Level Design](04-HLD.md) | Bounded contexts, the 5 engines, component & deployment diagrams, eventing, integration |
| 05 | [Low-Level Design](05-LLD.md) | Part I: engine internals. Part II: key end-to-end flows (sequence diagrams) + API contracts |

## Locked architecture decisions (shared across all docs)

- **4-layer, config-driven:** Domain+Data (L1) · Config/Metadata per-tenant (L2) · Shared Engines (L3) · Presentation (L4). Logic lives in engines, never config.
- **Multi-tenancy:** POOL (shared schema + `tenant_id`) + Postgres RLS default; bridge/silo for residency/whales via a control-plane catalog.
- **Bitemporal domain:** Person / Work-relationship / Position / Assignment; valid-time + transaction-time; effective-dated org edges (matrix-capable).
- **Six shared engines:** Workflow/Approval (durable, versioned graph) · Rules (decision tables + CEL) · Forms/UDF (typed JSONB) · Notification (outbox) · Accrual/Balance/Time (immutable ledger) · Scheduler/Alert (time-driven triggers — see `00-CONVENTIONS.md §7`).
- **Payroll:** integrate (own comp data, emit pay inputs); gross-to-net stays vendor-owned. Pay-period lifecycle + retro.
- **Security:** OIDC/SAML + SCIM; RBAC + Cedar ABAC; crypto-shred + hash-chained audit; FORCE RLS.
- **Integration:** transactional outbox → CDC → Kafka; jurisdiction rule packs as data. Separate analytical/reporting plane.

---

# Design Review — Consistency, Gaps & Risks

> ✅ **Reconciled.** Every finding below has been resolved — see the status table in
> [`00-CONVENTIONS.md §9`](00-CONVENTIONS.md). The original review is retained here for traceability.

# Consistency & Gap Review — Config-Driven Multi-Tenant HRMS (Kensium v6 Parity)

*Principal-architect review across seven deliverables: Delivery Roadmap, System Design, DB-Core (`Database Design — Core Domain, Config & Cross-cutting`), DB-Modules (`Database Design — Functional Modules`), HLD, LLD-Engines, LLD-Flows. The architecture is sound and the layering discipline is real; the problems below are integration seams between independently-authored docs that will not compile or run together as written.*

---

## 1. Cross-document inconsistencies

Ordered by blast radius. The first three are showstoppers — the schemas as written will not interoperate.

### 1.1 Tenant key is `tenant_id` in five docs but `company_id` in DB-Modules — engines cannot read module tables
DB-Core, System Design, HLD, LLD-Engines, and LLD-Flows all standardize on `tenant_id` + the GUC `app.tenant_id` (e.g. DB-Core `install_tenant_rls`: `current_setting('app.tenant_id')::uuid`; LLD-Engines `ExecutionContext.tenantId → app.tenant_id`). **DB-Modules §0.1 instead uses `company_id` + `current_setting('app.company_id')`** on every table (`requisition`, `vacancy`, `candidate`, `application`, …).

This is not cosmetic. The five shared engines set `app.tenant_id` (LLD-Engines §0, LLD-Flows §1.2). When any engine touches a DB-Modules table, the RLS policy evaluates `current_setting('app.company_id')`, which is **unset → the `::uuid` cast raises → every recruitment/leave/attendance query fails closed**. The whole point of the design (engines operate generically over module tables) is broken at the GUC boundary. **Fix: `tenant_id`/`app.tenant_id` everywhere; delete `company_id`.**

### 1.2 The canonical `assignment` table is defined three different, mutually incompatible ways
The most load-bearing table in the system has three encodings:

| Doc | Valid time | Transaction time | "Current belief" sentinel | Stable key |
|---|---|---|---|---|
| Roadmap §4 (the "reference DDL the whole platform stands on") | `valid_from date`, `valid_to date` | `tx_from`, `tx_to timestamptz` | `WHERE tx_to = 'infinity'` | PK `(tenant_id, assignment_id, tx_from)` |
| DB-Core §0/§2.2 (conventions, "applied everywhere below") | `effective daterange` | `sys_period tstzrange` | `WHERE upper(sys_period) IS NULL` | n/a (truncated before table) |
| DB-Modules §0 / preamble | references `assignment` with `slice_id` + `assignment_id` | — | helper uses `upper_inf(sys_period)` | `slice_id`/`assignment_id` |

These cannot all be right. The shared "as-of" repository (DB-Modules §0 emits `WHERE valid @> :as_of AND upper_inf(sys_period)`) is written against the *range-type* encoding, so the Roadmap's four-scalar-column + `tx_to='infinity'` encoding will not be readable by it. Two different "current belief" predicates (`tx_to = 'infinity'` vs `upper(sys_period) IS NULL`) guarantee divergent SQL in the one place the design says must be shared. **Fix: one encoding — `effective daterange` + `sys_period tstzrange` (DB-Core's convention) — and delete the Roadmap's scalar-column variant.**

### 1.3 DB-Modules FKs reference single-column keys that don't exist in DB-Core (invalid DDL)
DB-Core declares `position` with `PRIMARY KEY (tenant_id, position_id)` (composite) and `person` with `PRIMARY KEY (tenant_id, person_id)`. DB-Modules then writes `position_id uuid REFERENCES position(position_id)` (requisition), `candidate_id … REFERENCES candidate`, and `person_id uuid REFERENCES person(person_id)` (candidate). **A FK to `position(position_id)` is rejected by Postgres** because `position_id` alone is neither a PK nor a UNIQUE in DB-Core. Either the DB-Core PKs must expose single-column uniqueness (they shouldn't — that defeats the composite-FK tenant defense in decision #7) or every DB-Modules FK must be composite `(tenant_id, x_id)`. DB-Modules §0.3 even *claims* "FKs to immutable person/position surrogates may be simple where the parent is tenant-unique on its PK" — but the parent is **not** tenant-unique on a single column. **Fix: make every cross-aggregate FK composite `(tenant_id, …)`; drop the §0.3 carve-out.**

### 1.4 Config storage: content-addressed hash-PK conflicts with bitemporal versioning, and the "typed spine" is asserted but never modeled
LLD-Engines §0.1 defines a single `config_version` table with `hash bytea PRIMARY KEY` **and** an `EXCLUDE USING gist` over `(tenant_id, domain, name, scope, valid range, txn range)`. These two constraints contradict: content-addressing means identical payloads share one hash, but bitemporal versioning means the *same payload* can legitimately exist in two different effective windows (e.g. re-publish last year's policy for a new period) → two rows, same `hash` → **primary-key violation**. Content (immutable blob, keyed by hash) and *placement* (effective-dated, tenant-scoped binding of a blob) are two tables conflated into one.

Separately, decision #5, System Design §2, and DB-Modules preamble all promise a **typed spine + `config_type`/`config_object`/`config_snapshot`** — but the only config DDL anywhere (LLD-Engines `config_version`) has no spine table and no `config_snapshot` table, even though `pin()`/`configSnapshotId` (LLD-Engines §0.1) and `config_snapshot` (DB-Modules preamble; Roadmap `assignment.config_snapshot`) are referenced as if they exist. **Fix: model three things explicitly — (a) `config_blob(hash PK, payload, schema_version)` immutable content; (b) `config_binding(tenant, domain, name, scope, layer, valid range, txn range, hash)` effective-dated with the EXCLUDE constraint; (c) `config_snapshot(snapshot_id, manifest of hashes)` for pinning.**

### 1.5 Workflow source-of-truth is split: Temporal (LLD) vs Postgres `wf_instance`/`wf_task` tables (HLD/DB-Modules)
LLD-Engines §1 builds the workflow engine entirely on Temporal durable execution; human decisions are Temporal **signals**, state lives in Temporal. But HLD §4 says the engine "defines `wf_definition`/`wf_instance`/`wf_task`/`wf_history`" Postgres tables, and DB-Modules §0.5 puts a Postgres FK `wf_instance_id uuid REFERENCES wf_instance` on every approvable row and queries `wf_instance.subject_ref` to render "Pending …" / "Mass Approval" grids (LLD-Flows §2 step 6 confirms the *Pending Time Off Adjustments* grid is "a query over open instances").

If Temporal is the system of record, then `wf_instance`/`wf_task` are *projections* synced from Temporal — and **no doc specifies that sync** (Temporal Visibility? a consumer off the event stream?). Worse, a Postgres FK pointing at an eventually-consistent projection will dangle at write time (the aggregate row is written before the projection materializes). **Fix: declare Temporal the SoT; `wf_instance`/`wf_task` are read-models populated from Temporal; store the Temporal `workflowId` as an opaque string column (no FK); define the projection pipeline.**

### 1.6 Accrual ledger schema (Roadmap) doesn't support the operations the flows require
Roadmap §4 `balance_ledger` has no concept of a **hold/reservation**, but LLD-Flows §2 steps 4–5 depend on `reserve(hold …)` to prevent double-spend, with holds that "expire if the workflow is abandoned." The schema also: keys balances by `person_id` (should be `work_rel_id` — a rehire is a new relationship and must not inherit the prior spell's balances, per DB-Core §2.3 rehire model); carries no `tenant_id` in PK and shows no `install_tenant_rls` call (only `PARTITION BY HASH (tenant_id)`); has no `unit`/`currency`; and offers `recompute_gen int` ("bump to recompute") which sits awkwardly against the LLD claim that balances are "recomputable by replaying the ledger" (replay vs generation-stamp are two different recompute strategies). **Fix: add a `state ∈ {hold, posted, reversed}` + `expires_at`, key on `work_rel_id`, add RLS, pick one recompute model.**

### 1.7 Lower-severity but real
- **Reference data naming**: DB-Core defines `ref_code(code_set, code)`; DB-Modules preamble and body reference `ref_set`/`ref_value`/`ref_value_label` and call `ref_value('POSITION_LEVEL')`; HLD §4 also says `ref_set/ref_value/ref_value_label`. Two different lookup APIs. Unify on one.
- **RLS strength differs**: DB-Core `install_tenant_rls` has `USING` **and** `WITH CHECK`; DB-Modules §0.1 policy has only `USING` — so a bug could *write* another tenant's id into a module table. Add `WITH CHECK`.
- **`SET` vs `SET LOCAL`**: DB-Core §1.1 correctly uses `SET LOCAL app.tenant_id` (tx-scoped, pool-safe); LLD-Flows §1.2 says "`SET app.tenant_id`" (session-scoped → leaks across pooled checkouts). Standardize on `SET LOCAL`, and specify how **Temporal activities** (which run outside the request transaction, in worker processes) re-establish the tenant GUC from the pinned context — currently unaddressed.
- **Snapshot over-pinning**: Roadmap §4 puts `config_snapshot text NOT NULL` on every `assignment` row. Pinning belongs on workflow instances and accrual computations (LLD model), not on every effective-dated domain slice. Drop it from `assignment`.
- **Approver config references positions by display string**: LLD-Engines §1.3 resolvers match `{department:"Human Resources", position:"HR Manager", rank:1}` by name, but the domain is UUID-keyed and effective-dated (names change). The name→id resolution "as-of date" is unspecified.

---

## 2. Coverage gaps vs the crawled feature set

The HLD claims "19 bounded contexts cover all 306 crawled screens." Several crawled capabilities have no real design home:

1. **Scheduler / temporal-alert engine (missing 6th engine).** `CONFIG · Alerts` (Setup, Configure Alerts), `CONFIG · Orientation · Notification Rule`, `CONFIG · Organization · Schedule Job`, `CONFIG · Attendance · Audit Recurrence Pattern`, plus time-condition alerts the modules assume — certification expiry (`My Certifications · Valid till`), candidate document/visa expiry (DB-Modules §1.2 `candidate_document.expires_on` "→ alerting (see §17.3)"), probation/confirmation windows, contract end. The Notification engine is **outbox/event-driven** (decision #4d); none of these are events — they are *"it is now T, condition C holds"* triggers. Workflow SLAs cover reminders *inside* a running instance, not standalone temporal alerts. **Nothing owns scheduled/temporal triggers.** This is a genuine missing capability, not just a screen.

2. **Bulk / data-import framework.** `CONFIG · Data Import` (Import Data, Import Data Log), `Mass update of Employee Data`, `Bulk Resume Upload`, `Manual Attendance Sheet`, `Bulk Resource Assignments`. No doc designs a staging/validate/commit import pipeline or the import-log audit surface. For an enterprise HRMS this is a first-class operational subsystem.

3. **Reporting / analytical plane has no deliverable or phase.** Decision #9 calls reporting "~50% of an HRMS"; System Design and HLD draw a warehouse/lakehouse box; the crawl has `Organization · Reports`. But no document specifies the report catalog, the field-level-security projection mechanics, or as-of bitemporal query patterns, and the Roadmap (truncated at Phase 1) shows no reporting phase. The single largest functional area is an unowned box.

4. **Benefits is drastically underdesigned.** The crawl shows real statutory/elective benefits: **Gratuity** ("Payment of Gratuity Act 1972"), **Group Health Insurance**, **Health Medical Insurance** with effective windows, and per-field/per-position access (`Medical Insurance → Human Resources → HR Associate 3 → View/Edit`). HLD context 15 is just "Setup + enrollment surfaces"; there is no schema for benefit plans, eligibility groups, elections, nominees/dependants. Critically, **gratuity is an accrual** and should map to the Accrual engine — it currently maps nowhere.

5. **Attendance-audit sub-process.** `CONFIG · Attendance · Audit Configuration Settings`, `Attendance Auditors Group`, `Audit Recurrence Pattern` describe a recurring *business* audit of attendance (easily conflated with the security audit log, which is unrelated). No context owns it.

6. **Shared Vendor / Party model.** `Vendor` (Org config), `CONFIG · Vendor Management`, `Travel Vendors`, `Manage External Trainers`, asset procurement vendors. Vendors are referenced by Asset, Travel, and Learning but there is no shared party entity.

7. **Acumatica/GL integration.** The crawl has an explicit "Acumatica Integration Module" toggle and `CONFIG · Integrations`. The payroll ACL (decision #6) covers pay-input → payroll, but GL/ERP posting back to Acumatica is not modeled as an ACL.

8. **Anonymous feedback/grievance vs always-attributed audit.** The crawl asks "Do you support Anonymous Feedback / Grievance?" This directly conflicts with the hash-chained audit (`actor_id` on every row, DB-Core) and the per-request `app.actor_id` GUC. No doc reconciles anonymity with mandatory attribution.

9. **Ownership ambiguity**: `Quadrant Rating` is assigned to both Core HR (HLD context 5) and Performance (context 10); `Confirmation` similarly spans `More` screens and Performance. Pick one owner each.

Minor/acknowledged: `CONFIG · Calendar`, `CONFIG · Time Management` (Type Of Work, Short Time Settings) are referenced in Roadmap config bundles but have no distinct engine/context; `Thought of the day`, `Support Team`, `Login Page Images`, `Configure Series` (number-series generator) are small but unhomed.

---

## 3. Top 8 risks / hardest problems and how the design mitigates them

1. **Bitemporal correctness across the whole core (highest bug density).** Mitigated well in principle — `EXCLUDE USING gist` non-overlap constraints, property-based "as-of any (valid,tx)" tests (Roadmap §4 risks), a shared as-of repository (DB-Modules §0). **Undermined today by §1.2's three encodings + two "current belief" sentinels.** Until one encoding is enforced, the mitigation (one shared repo) cannot exist.

2. **Tenant isolation under connection pooling.** Strong defense-in-depth design: `FORCE RLS` + composite-FK tenant carry + fail-closed cast (DB-Core §1.2). Hard parts not yet covered: PgBouncer transaction-pooling interaction with `SET LOCAL`; **Temporal activities and Kafka consumers run outside the request transaction and must re-assert `app.tenant_id`** from the pinned context — no doc shows this. Plus the §1.1 GUC-name mismatch defeats it entirely on module tables.

3. **Config engine: immutability × bitemporality × pinning × cache coherence × schema evolution.** The pin-snapshot-per-instance idea (LLD-Engines §1.2) is the right answer to "an in-flight approval must survive a config edit," and Redis `cfg:{tenant}:{hash}` keyed by content hash is correct. Hard, partly-unaddressed parts: the hash-PK bug (§1.4); **config-schema evolution** — when an engine ships a new capability, old pinned snapshots (months-long exits/offers) must still validate and interpret against their *original* JSON-Schema, requiring schema-version pinning and an interpreter that honors `schemaVersion` (asserted in LLD-Engines but not designed). The publish-time validation gate (JSON-Schema + CEL compile + referential check) is effectively a compiler and a real build.

4. **Approver resolution over a bitemporal, matrix org graph.** LLD-Engines §1.3 is the strongest part of the design: `org_chain(from,to)` with cycle guard, dotted-line traversal, delegation post-pass with its own cycle break, as-of-effective-date resolution. Remaining hard problems: **vacant manager seats** (single-incumbent position currently empty → resolver returns nobody → who approves?); name→id resolution as-of date (§1.7); the tension between resolving approvers "as-of request date so a reorg doesn't reroute" vs escalation wanting the *current* manager.

5. **Stateful accrual engine: holds, retro recompute, LOP→pay.** Immutable ledger + recompute is the right backbone, and the hold-before-approve pattern (LLD-Flows §2) correctly prevents double-spend. Gaps: the schema doesn't model holds (§1.6); hold expiry/crash-safety on abandoned workflows; retro recompute that must emit `correctionOf` pay-input (LLD-Flows §5) interacting with already-posted balances. Mitigation exists conceptually (compensating credits, never deletes) but needs the schema and a recompute orchestration spec.

6. **Payroll confluence + retro across a locked pay period (no 2PC).** Compensation sits at Attendance ∩ Leave ∩ Comp ∩ Tax (Roadmap §3, HLD §4). The deliberate no-2PC choice (LLD-Flows §0: only outbox + inbox share the aggregate tx; ledger/workflow/events reconciled by `correlationId`) is correct but means **partial failure is normal** (leave debited, pay-input never emitted) and requires reconciliation jobs that are referenced but not specified. The genuinely hard case — retro correction arriving after a pay period is `locked`/`paid`/`posted` (decision #6 lifecycle) — needs an explicit "retro into closed period → next-period adjustment" rule that no doc states.

7. **Field-level security: config-driven grid vs static code classes, at grid scale.** LLD-Flows §1.7 (ABAC masking at the serialization boundary, masked-not-errored, audited) is excellent design. But it hardcodes field-classes (`comp`, `nationalId`, `health`, …) into DTOs, while the crawl shows tenants **configure** field access per field per role *and per position* (`Medical Insurance → HR Associate 3 → View/Edit`; UDF `View/Edit` columns for HR/Reporting Manager/Employee). So Cedar policies must be **generated from config**, not authored in code — unaddressed. Performance: "one batched Cedar decision per field-class per row" on a 147-row Talent Pool or `Notice Period` grid is an authz storm; needs principal-level caching/precompute. Field-classes must also align 1:1 with crypto-shred field-classes (decision #7) — currently two independent lists.

8. **Missing operational engines (scheduler + import) + reporting plane.** Per §2.1–2.3, three large capabilities have no owner. The risk is that they get retrofitted into the Notification engine (wrong substrate — it's event-driven) or sprinkled into modules (violating "logic only in engines/domain"). Mitigation: treat the temporal-alert scheduler as a **6th platform engine** in Phase 0, design a bulk-import subsystem, and make Reporting an explicit phase + deliverable.

---

## 4. Ordered list of the most important fixes

1. **Unify the tenant key to `tenant_id` / `app.tenant_id` across DB-Modules** (delete `company_id`). Without this, no engine can touch any functional-module table. *(§1.1 — showstopper)*
2. **Pick one bitemporal encoding** (`effective daterange` + `sys_period tstzrange`, one current-belief predicate `upper_inf(sys_period)`); delete the Roadmap §4 scalar-column variant; align DB-Modules `slice_id`. *(§1.2)*
3. **Make every cross-aggregate FK composite `(tenant_id, …)`** and remove the DB-Modules §0.3 "simple FK to surrogate" carve-out; this is required both for valid DDL against DB-Core's composite PKs and for the decision-#7 leak defense. *(§1.3)*
4. **Split the config model into `config_blob` (content-addressed) + `config_binding` (effective-dated) + `config_snapshot` (pin manifest)**; add the typed spine promised by decision #5; pin `schemaVersion` so old snapshots stay interpretable. *(§1.4, risk 3)*
5. **Declare Temporal the workflow SoT; define `wf_instance`/`wf_task` as projections**; store `workflowId` as an opaque string (no FK to a projection); specify the Temporal→Postgres sync that powers the "Pending"/"Mass Approval" grids. *(§1.5)*
6. **Complete the accrual ledger**: hold/reservation state + expiry, key on `work_rel_id`, add `tenant_id` PK + `install_tenant_rls`, add unit/currency, choose replay-vs-generation recompute, and specify retro-into-locked-period handling. *(§1.6, risks 5–6)*
7. **Reconcile field-level security**: generate Cedar policies from the crawled per-(field × role × position) access config and the UDF `View/Edit` grid; make ABAC field-classes == crypto-shred field-classes; specify grid-scale batched/cached authz. *(risk 7)*
8. **Add the missing platform capabilities**: a **temporal-alert/scheduler engine** (Alerts, Configure Alerts, Notification Rule, Schedule Job, Audit Recurrence, cert/doc/visa/probation/contract expiry) as a Phase-0 engine; a **bulk data-import** subsystem (Import Data + Log, Mass update, Bulk Resume/Attendance); and **Reporting** as an explicit deliverable and roadmap phase. *(§2.1–2.3, risk 8)*
9. **Design Benefits properly** (plans, eligibility groups, elections, nominees/dependants), routing **gratuity through the Accrual engine**; add a **shared Vendor/Party** entity; and resolve **anonymous feedback vs always-attributed audit/RLS** (e.g. a system-actor with a sealed, separately-keyed identity vault). *(§2.4, §2.6, §2.8)*
10. **Housekeeping**: `SET LOCAL` everywhere + Temporal/consumer GUC re-assertion; add `WITH CHECK` to DB-Modules RLS; unify `ref_code` vs `ref_value` lookup API; remove `config_snapshot` from `assignment`; assign single owners for Quadrant Rating and Confirmation. *(§1.7, §2.9)*

**Net:** the architecture is internally coherent at the *concept* level (layering, engines, bitemporality, isolation, pinning are consistent across docs). The breakages are at the *schema-contract* level between DB-Core, DB-Modules, and LLD — naming, keys, and the config/workflow storage models diverged because the docs were authored against slightly different drafts of the core. Fixes 1–6 are mechanical contract alignment and should be done before any module build starts; fixes 7–9 are missing-design that should be scheduled into Phase 0/Phase 2 respectively.

---
_Generated 2026-06-27 from workflow `hrms-design-docs`._
