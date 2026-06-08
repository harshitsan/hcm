# Group Reporting Viewer — User Stories

> The Group Reporting Viewer is a read-only oversight persona for group leadership — typically a holding-company executive, board member, or shared-services analyst who needs consolidated visibility across the affiliated companies in a group-company structure (subsidiaries, sister concerns, or joint-venture members). They care about a single, trustworthy view of aggregated headcount, leave, attendance, and the cross-company employee directory — and nothing more. They hold no transactional or configuration rights of any kind (BRD §5.4; FS GROUP-FR-006).

## Scope & access

- **Authority level: Group (read-only).** Visibility spans only the member companies of the specific group-company structure(s) the user has been explicitly granted the Group Reporting Viewer role on (BRD §5.4; FS §3.3, GROUP-FR-006). A company belongs to at most one group at a time (FS GROUP-FR-002).
- **Consolidated reporting, view only.** Can open consolidated group reports — aggregated headcount across the group, cross-company organization chart view, and consolidated leave/attendance summaries (FS GROUP-FR-006; BRD §6.3, §6.23).
- **Cross-company directory search, view only.** Can run cross-company employee directory search across the group's companies, with a company identifier shown against each result (BRD §6.21.4; FS §3.3.2).
- **Access is conditional and gated.** Consolidated reporting and cross-company directory search are available only when (a) the companies are explicitly linked via the Group-Company construct, (b) cross-company access has been explicitly enabled, and (c) the user holds an explicit group-level role (BRD §6.3.3; FS GROUP-FR-006).
- **Row-level security on every query.** All data is filtered so the viewer sees only the companies and records they are authorized for; sensitive/excluded fields and privacy-controlled contact details are honored (BRD §6.3.3, §6.21.5; FS §7.2).
- **Everything is audited.** Every cross-company access and report view is logged — successful or failed — with actor, companies touched, and timestamp (BRD §6.3.3; FS §7.2.3, §8.1 `COMPANY_ACCESSED`).

**Explicit boundaries — a Group Reporting Viewer performs NO transactional or configuration actions. They CANNOT:**

- Create, edit, suspend, activate, or delete any company, portfolio, or group structure (FS §7.1 — the Group Reporting Viewer holds no Create/Edit/Manage rights anywhere).
- Define or modify the group-company structure, add/remove member companies, or configure shared locations or shared policy templates — those are Group Company Administrator powers (BRD §5.4; FS GROUP-FR-001, GROUP-FR-004, GROUP-FR-005).
- Perform any HR operation: no employee create/edit, no leave/attendance approval, no onboarding/exit, no policy or workflow changes (BRD §5.4 "no transactional or configuration rights").
- Switch into a company to operate inside it as an admin; their access is reporting/directory visibility, not company context administration (BRD §5.4; FS §7.1).
- See any company outside their authorized group(s), or reach across groups they have not been granted — cross-company access is permitted only through explicit group-company assignment (FS §7.2.2; AUTH_001).
- Export or view data where cross-company sharing is not explicitly enabled, or see fields excluded by privacy controls (BRD §6.3.3, §6.21.5).
- Cross the User != Employee != Contractor boundary — seeing an employee in a directory result never implies that person has a login, and employee records remain strictly company-specific (BRD §7.1, §7.4, §7.5).
- Exercise portfolio reporting, platform administration (jurisdictions, SSO, platform config), or cross-tenant audit access (BRD §5.2, §5.3).

## User stories

### Consolidated group reporting (FS GROUP-FR-006; BRD §6.23)

- **US-GRV-01** — As a Group Reporting Viewer, I want to see a list of only the group-company structures I have been granted access to, so that I know exactly which groups I can report on. (BRD §5.4; FS GROUP-FR-006)
  - **Acceptance criteria:**
    - **Given** I hold the Group Reporting Viewer role on Group G1 only, **When** I open the reporting area, **Then** only G1 and its member companies are listed and no other group or company is shown.
    - **Given** a group exists that I have not been granted, **When** I browse available reports, **Then** that group never appears.
- **US-GRV-02** — As a Group Reporting Viewer, I want to view aggregated headcount across all member companies of a group, so that group leadership has a single consolidated workforce number. (FS GROUP-FR-006)
  - **Acceptance criteria:**
    - **Given** Group G1 has member companies A, B, and C, **When** I open the consolidated headcount report, **Then** I see the total headcount and a per-company breakdown for A, B, and C only.
    - **Given** company B has cross-company sharing disabled, **When** I open the report, **Then** B's figures are excluded and the report indicates the company is not included.
- **US-GRV-03** — As a Group Reporting Viewer, I want to view consolidated leave and attendance summaries across the group, so that leadership can compare workforce utilization between affiliated companies. (FS GROUP-FR-006)
  - **Acceptance criteria:**
    - **Given** member companies report leave and attendance, **When** I open the consolidated leave/attendance summary, **Then** figures are aggregated across the authorized member companies with a per-company breakdown.
    - **Given** I have no transactional rights, **When** I view any summary line, **Then** I see no approve/reject/edit controls anywhere on the report.
- **US-GRV-04** — As a Group Reporting Viewer, I want to view the cross-company organization chart spanning the group's member companies, so that I can understand the combined leadership and reporting structure of the affiliated entities. (FS GROUP-FR-006; BRD §6.21.2)
  - **Acceptance criteria:**
    - **Given** Group G1 has members A and B with shared sharing enabled, **When** I open the cross-company org chart, **Then** nodes display a company identifier so I can tell which entity each person belongs to.
- **US-GRV-05** — As a Group Reporting Viewer, I want to filter a consolidated report by member company (multi-select within the group), so that I can focus on a subset of affiliated entities. (FS GROUP-FR-006; analogous to PORT-FR-008)
- **US-GRV-06** — As a Group Reporting Viewer, I want the system to apply row-level security to every consolidated report, so that I only ever see companies and records I am authorized for. (BRD §6.3.3; FS §7.2.1)
  - **Acceptance criteria:**
    - **Given** I am authorized for members A and B but not D, **When** any consolidated query runs, **Then** the result set is filtered to A and B and contains no rows from D.
    - **Given** a member company's records carry privacy-restricted fields, **When** I view the report, **Then** those fields are excluded per privacy controls.
- **US-GRV-07** — As a Group Reporting Viewer, I want to export a consolidated report to Excel/PDF, so that I can share group figures with leadership offline. (BRD §6.23.3; FS GROUP-FR-006)
  - **Acceptance criteria:**
    - **Given** a consolidated report I am authorized to view, **When** I export it, **Then** the export contains only the row-level-security-filtered data I can see and the export action is recorded in the audit trail.
- **US-GRV-08** — As a Group Reporting Viewer, I want consolidated reports to clearly label each figure with its source company, so that aggregated numbers are traceable and not misread as a single company's data. (BRD §6.3; FS GROUP-FR-006)
- **US-GRV-09** — As a Group Reporting Viewer, I want a read-only group dashboard with consolidated KPIs and drill-down into per-company figures, so that I get an at-a-glance view of the group's workforce. (BRD §6.23.2)
- **US-GRV-10** — As a Group Reporting Viewer, I want consolidated reports to generate within the platform's report SLA, so that group figures are available quickly even across multiple companies. (BRD §8.1.3)
- **US-GRV-11** — As a Group Reporting Viewer, I want any report whose underlying companies have cross-company sharing turned off to plainly indicate the exclusion, so that I do not mistake a partial view for the full group. (BRD §6.3.3; FS GROUP-FR-006)

### Cross-company employee directory (BRD §6.21; FS §3.3.2)

- **US-GRV-12** — As a Group Reporting Viewer, I want to search the employee directory across all member companies of my authorized group in one query, so that I can locate people anywhere in the affiliated entities. (BRD §6.21.4)
  - **Acceptance criteria:**
    - **Given** I am authorized for Group G1 with members A and B, **When** I run a cross-company directory search, **Then** matching results from both A and B are returned in a single list.
    - **Given** company C is not part of my authorized group, **When** I search, **Then** no employees from C appear.
- **US-GRV-13** — As a Group Reporting Viewer, I want each cross-company directory result to display a company identifier, so that I can tell which affiliated entity each person belongs to. (BRD §6.21.4; FS §3.3.2)
  - **Acceptance criteria:**
    - **Given** results span members A and B, **When** the list renders, **Then** every row shows the company identifier alongside name, position, department, and location.
- **US-GRV-14** — As a Group Reporting Viewer, I want to filter directory results by department, position, location, employment status, and group, so that I can narrow cross-company searches. (BRD §6.21.3)
- **US-GRV-15** — As a Group Reporting Viewer, I want the directory to honor privacy controls and hide sensitive or excluded contact fields, so that I only see information appropriate to my role. (BRD §6.21.5)
  - **Acceptance criteria:**
    - **Given** a person's contact details are restricted by privacy policy, **When** I view their directory entry, **Then** the restricted fields are not displayed.
- **US-GRV-16** — As a Group Reporting Viewer, I want to open a read-only directory profile (name, photo, position, department, location), so that I can confirm who someone is without any edit capability. (BRD §6.21.1)
  - **Acceptance criteria:**
    - **Given** I open any directory profile, **When** the page renders, **Then** no edit, message, or action controls are available — the view is strictly read-only.
- **US-GRV-17** — As a Group Reporting Viewer, I want cross-company directory search to be available only when group linkage and cross-company sharing are explicitly enabled, so that visibility never extends beyond what governance has authorized. (BRD §6.3.3; FS §3.3.2)
  - **Acceptance criteria:**
    - **Given** cross-company access has not been explicitly enabled for the group, **When** I attempt a cross-company search, **Then** the search is blocked and only company-scoped results (if any) are shown.
- **US-GRV-18** — As a Group Reporting Viewer, I want to export directory search results to Excel/CSV, so that leadership can review a roster of the group's people offline. (BRD §6.21.3)
- **US-GRV-19** — As a Group Reporting Viewer, I want a directory result that understands the User != Employee boundary, so that an employee appearing in a result is never assumed to have a platform login. (BRD §7.1, §7.7)

### Access governance, security & audit (BRD §6.3.3; FS §7)

- **US-GRV-20** — As a Group Reporting Viewer, I want every report view and cross-company access I perform to be written to the audit trail, so that group-level oversight remains fully accountable. (BRD §6.3.3; FS §7.2.3, §8.1)
  - **Acceptance criteria:**
    - **Given** I open a consolidated report or run a cross-company search, **When** the access completes, **Then** an audit entry records the actor, the companies accessed, the action, and the timestamp.
    - **Given** an access attempt is denied, **When** it is processed, **Then** the failed attempt is also recorded in the audit trail.
- **US-GRV-21** — As a Group Reporting Viewer, I want any attempt to reach a company outside my authorized group to be rejected, so that tenant isolation and cross-tenant boundaries are never breached. (FS §7.2.2; AUTH_001)
  - **Acceptance criteria:**
    - **Given** I request data for a company not in my authorized group, **When** the request is evaluated, **Then** it is denied with an unauthorized-access response and the attempt is logged.
- **US-GRV-22** — As a Group Reporting Viewer, I want my role to grant me zero write, transactional, or configuration capability anywhere in the platform, so that I cannot accidentally or intentionally change any company, group, or HR data. (BRD §5.4; FS §7.1)
  - **Acceptance criteria:**
    - **Given** I am authenticated as a Group Reporting Viewer, **When** I navigate any module I can see, **Then** I am presented with view/search/export controls only and no create/edit/approve/configure controls.
    - **Given** any direct write request is somehow submitted under my role, **When** the server evaluates it, **Then** it is rejected on authorization grounds.
- **US-GRV-23** — As a Group Reporting Viewer, I want the system to recognize that I may hold this role only on specific groups (and possibly other roles elsewhere), so that my permissions stay correctly scoped per group. (BRD §5.1; FS §7.1)
- **US-GRV-24** — As a Group Reporting Viewer, I want my access to automatically narrow when a company leaves the group or has its sharing revoked, so that consolidated views never expose data the group no longer governs. (BRD §6.3.3; FS GROUP-FR-002)
  - **Acceptance criteria:**
    - **Given** company B is removed from Group G1, **When** I next run a consolidated report or directory search, **Then** B's data no longer appears in any result.

## Primary journeys

1. **Consolidated headcount review.** The viewer signs in, opens the reporting area, selects an authorized group, opens the consolidated headcount report, sees the group total with a per-company breakdown (companies without sharing clearly excluded), exports to PDF for a board pack — and the access is audited.
2. **Cross-company people lookup.** Leadership asks "who is our Head of Finance across the group?" The viewer runs a cross-company directory search scoped to the authorized group, filters by position, reads the results each tagged with their company identifier, and opens a read-only profile to confirm — with privacy-restricted fields hidden.
3. **Leave/attendance comparison.** The viewer opens the consolidated leave/attendance summary, filters to a subset of member companies, drills into per-company figures on the dashboard to compare utilization, and exports the result — strictly viewing, never approving.
4. **Governed access boundary.** The viewer attempts to open data for a company outside their group; the system denies the request, shows only authorized scope, and logs the failed cross-company access attempt.

## Notes & Phase 2

- **Cross-cutting dependency — RBAC & role scoping.** The Group Reporting Viewer is a composable, group-scoped role; it must be enforceable per group and coexist with other roles the same user may hold elsewhere (BRD §5.1; FS §7.1).
- **Cross-cutting dependency — tenant isolation & RLS.** All visibility relies on row-level security plus the explicit group-linkage + cross-company-sharing gate; without that gate the role grants no cross-company visibility (BRD §6.3.3; FS §7.2).
- **Cross-cutting dependency — audit.** Every report view and cross-company access (success or failure) must hit the audit trail with 7-year retention (BRD §6.3.3; FS §7.2.3, §8.1, §8.2).
- **Cross-cutting dependency — notifications.** Scheduled delivery of consolidated reports via email (BRD §6.23.4) depends on the notifications/scheduler service; deliveries remain read-only artifacts.
- **No workflow-engine involvement.** This role neither initiates nor participates in approval workflows; it is purely observational (BRD §5.4).
- **Phase 2 — richer analytics.** Advanced/diversity analytics such as gender-wise workforce analytics and jurisdiction-specific reporting templates are Phase 2 (Phase II BRD §6, §9); the Phase 1 Group Reporting Viewer is limited to consolidated headcount, org chart, and leave/attendance summaries plus directory search (FS GROUP-FR-006).
- **Phase 2 — compliance reporting.** Statutory/compliance dashboards and labor-law reporting are part of the Phase 2 compliance module; Phase 1 ships only statutory register templates, not full compliance analytics (Phase II BRD §9; Roadmap reporting note).
