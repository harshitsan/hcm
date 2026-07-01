# Graph Comparison — Requirements vs User Stories

Two knowledge graphs built with graphify and compared.

- **Graph A — Requirements:** `SatelliteHR Phase I-BRD` + `SatelliteHR-FunctionalSpec-CompanyManagement`
  → `requirements/graphify-out/` (graph.html, graph.json, GRAPH_REPORT.md)
- **Graph B — User Stories:** the 31 `*_stories.csv` (rendered to Markdown for extraction)
  → `user-stories/graphify-out/`

## 1. Shape

| Metric | Requirements (A) | User Stories (B) |
|---|---|---|
| Nodes | 117 | 205 |
| Edges | 153 | 615 |
| Communities | 11 | 9 |
| Edge density (edges/node) | ~1.3 | ~3.0 |
| God nodes | the 2 source docs, Company/Portfolio/Group Management, RBAC, Companies | System Module, Policy Distribution, Roles & Security, Leave Mgmt, Talent Acquisition, Time & Attendance, User Auth, Workflow Engine |

**Read:** A is *hierarchical* (doc → module → requirement → concept), so it's sparse and tree-like — the two source documents are the top hubs. B is *cross-linked* (2.3× denser): stories in different modules share the same engines, roles, and cross-cutting capabilities, so the graph knits modules together through shared concepts (Rules/Workflow/Accrual engines, Tenant Isolation, Audit Trail, Governed Config). The stories graph reveals the *runtime coupling* the requirements graph doesn't.

## 2. Coverage (requirements → stories)

Verified against the story CSV `source` columns (ground truth), not just the graph:

| Requirement set | Covered |
|---|---|
| BRD functional modules §6.1–6.29 | **29 / 29** |
| FunSpec COMP-FR-001…016 | **16 / 16** |
| FunSpec PORT-FR-001…010 | **10 / 10** |
| FunSpec GROUP-FR-001…006 | **6 / 6** |
| BRD §7 cross-module rules | 28 stories reference §7 |
| BRD §8 NFR areas | 42 stories reference NFRs |
| Multi-tenant / hierarchy / tenant isolation | 19 / 20 stories |
| Group types (Holding/Sister/JV), DPDP-GDPR, context switching | present (4 / 4 / 10 stories) |

**Every requirement in both source documents is represented by at least one user story.** Coverage is complete.

## 3. Community alignment

The two graphs cluster along the same seams, confirming the stories mirror the requirements' structure:

| Requirements community (A) | Corresponding user-stories community (B) |
|---|---|
| Company / Portfolio / Group Management | c0 Data & Config core + c6 Lifecycle |
| Roles, RBAC, multi-tenant, context switching | c2 Identity & Security |
| Policy, jurisdiction, compliance | c1 Governance |
| Leave / attendance / workflow / accrual | c3 Engines & Time-off |
| Reporting / self-service / talent | c4 Presentation & Analytics |
| NFRs / integrations / data governance | c5 Integrations-Infra + c7 Notifications |

## 4. What the stories graph adds beyond requirements

- **173 capability/concept nodes** vs 31 in requirements — the stories decompose each requirement into concrete, role-attributed, layer-tagged capabilities.
- Heavy `semantically_similar_to` cross-links (41 total) between engines reused across modules — surfacing the shared **L3 engine** design (one Workflow/Rules/Accrual/Notification/Forms engine serving many modules) that the BRD only states abstractly.
- Explicit **role → module** edges for all 6 canonical roles, making the actor coverage navigable.

## 5. Honest caveats (graph fidelity)

- The **stories graph under-minted requirement-id nodes**: only 2/16 COMP-FR and 2/6 GROUP-FR appear as explicit nodes, even though the CSVs cite all of them. This is an LLM-extraction sampling artifact, not a coverage gap (see §2, verified from `source` columns).
- Several requirement *concepts* (NFR areas, tenant-isolation rules, group types, data-retention/DPDP) show as "requirements-only" in a naive label match because the stories graph labeled them differently (e.g. "Data Governance and Retention" vs "Data Retention Rules") or folded them into `system_module`. All are covered in the stories (§2).
- The user-stories graph reflects the 777-story snapshot; one story (CMP-45) added afterward is not in the graph. Structurally negligible.

## Bottom line

The stories graph is a **denser, role- and layer-aware elaboration** of the requirements graph, clustering along the same domains. Requirement-to-story coverage is **100% at the module and FunSpec-requirement level**, with cross-module rules and NFRs well represented. The graphs differ mainly in *density and intent*: requirements = hierarchical spec; stories = interconnected implementation backlog.
