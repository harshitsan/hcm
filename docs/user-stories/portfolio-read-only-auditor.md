# Portfolio Read-Only / Auditor — User Stories

> The Portfolio Read-Only / Auditor is an oversight, audit, and leadership-visibility persona for a portfolio of companies managed by a shared services team. They consume consolidated and cross-company reports across the authorized portfolio, observe policy alignment and compliance status, and export evidence for audit — but they hold no transactional or configuration authority (BRD §5.3).

## Scope & access

- **Authority level:** Portfolio (read-only across explicitly authorized portfolio companies only). Their visibility derives from portfolio assignment, not from company-level operational roles.
- **This role is strictly READ-ONLY.** It performs NO transactional actions and NO configuration actions: no approvals, no edits, no provisioning, no status changes, no policy authoring, no role/user assignment, no imports, no overrides, no company context-driven write operations.
- **What they CAN do:**
  - View consolidated and cross-company reports spanning the companies in their authorized portfolio (BRD §6.23, FS §3.2.3 PORT-FR-008).
  - View policy alignment and compliance status across portfolio companies (BRD §5.3, §6.10, §6.11).
  - Drill into individual portfolio companies in read-only mode, subject to row-level security (FS PORT-FR-008).
  - Export reports (Excel/PDF) for audit and leadership review (FS PORT-FR-008, BRD §6.23).
  - View record-level change history and audit metadata for entities they are authorized to see (BRD §6.29).
  - Switch read-only context across authorized portfolio companies without re-login (BRD §6.12, FS PORT-FR-004/005), where switching is permitted for their role.
- **Explicit BOUNDARIES — what they CANNOT do:**
  - Cannot create, edit, suspend, archive, or provision companies; cannot create or manage portfolios or add/remove companies from a portfolio (FS §7.1 RBAC matrix — these are Platform Super Admin / Portfolio Manager rights).
  - Cannot approve, reject, override, or initiate any workflow (leave, attendance, onboarding, probation, transfer, exit, letters, policy acknowledgment).
  - Cannot create, edit, version, distribute, or acknowledge policies; they only observe compliance status.
  - Cannot manage employees, master data (departments, positions, groups, locations, jurisdictions), users, roles, or security settings.
  - Cannot perform imports/exports of data for migration purposes — export is limited to read-only report output for audit.
  - Cannot see any company outside their authorized portfolio; all access respects tenant isolation, row-level security, and is audit-logged (BRD §6.3, §7 rule 15; FS §7.2).

## User stories

### Consolidated & cross-company reporting (BRD §6.23)

- **US-PAUD-01** — As a Portfolio Read-Only / Auditor, I want to view a consolidated dashboard spanning all companies in my authorized portfolio, so that I can assess overall workforce and operational health at a glance. (BRD §6.23, FS PORT-FR-008)
  - **Acceptance criteria:**
    - **Given** I am assigned the Portfolio Read-Only / Auditor role over a portfolio of companies, **when** I open the consolidated dashboard, **then** the system aggregates metrics only across companies I am authorized to see and excludes all others.
    - **Given** the dashboard renders, **when** I attempt any action other than viewing or filtering, **then** no edit, approve, or configuration control is presented for me.
- **US-PAUD-02** — As a Portfolio Read-Only / Auditor, I want to filter consolidated reports by a multi-select set of companies within my portfolio, so that I can compare entities side by side. (FS PORT-FR-008)
  - **Acceptance criteria:**
    - **Given** I open a consolidated report, **when** I open the company filter, **then** only companies in my authorized portfolio appear as selectable options.
    - **Given** I select a subset of companies, **when** the report runs, **then** metrics reflect only the selected, authorized companies.
- **US-PAUD-03** — As a Portfolio Read-Only / Auditor, I want to view standard workforce and organization-structure reports across portfolio companies, so that I can review headcount, departments, and positions consistently. (BRD §6.23, §6.21)
- **US-PAUD-04** — As a Portfolio Read-Only / Auditor, I want to view consolidated leave and attendance reports across portfolio companies, so that I can spot coverage and absence patterns at the portfolio level. (BRD §6.23, §6.17, §6.18)
- **US-PAUD-05** — As a Portfolio Read-Only / Auditor, I want to view lifecycle, talent-acquisition, and asset-management reports in read-only mode, so that I can assess hiring, onboarding/exit progress, and asset accountability across companies. (BRD §6.23, §6.15, §6.13, §6.20)
- **US-PAUD-06** — As a Portfolio Read-Only / Auditor, I want to open saved report views and apply pre-built report templates, so that I can repeatedly review the same audit metrics without rebuilding filters. (BRD §6.23 — ad hoc reporting / saved views)
  - **Acceptance criteria:**
    - **Given** a saved view exists for my role, **when** I open it, **then** the report runs with its stored filters, scoped to my authorized companies.
    - **Given** I view a report builder, **when** I configure filters, **then** I may run and view results but cannot save changes that alter any company's data.
- **US-PAUD-07** — As a Portfolio Read-Only / Auditor, I want consolidated reports to display the source company identifier on every row, so that I can attribute every figure to the correct entity during an audit. (BRD §6.3, §6.21)

### Policy alignment & compliance visibility (BRD §5.3, §6.10, §6.11)

- **US-PAUD-08** — As a Portfolio Read-Only / Auditor, I want to view policy alignment across portfolio companies, so that I can see which companies apply which policies and where they diverge. (BRD §5.3, §6.10)
  - **Acceptance criteria:**
    - **Given** policies exist in multiple portfolio companies, **when** I open the policy alignment view, **then** I see policy applicability and versions per company in read-only form.
    - **Given** I am viewing policy alignment, **when** I look for authoring controls, **then** no create, edit, version, or distribute action is available to me.
- **US-PAUD-09** — As a Portfolio Read-Only / Auditor, I want to view policy acknowledgment and compliance status (pending, overdue, completed) across portfolio companies, so that I can identify compliance gaps for leadership. (BRD §6.11)
  - **Acceptance criteria:**
    - **Given** policies have been distributed across portfolio companies, **when** I open the compliance dashboard, **then** acknowledgment status is shown per company and per policy within my authorized scope.
    - **Given** an acknowledgment is overdue, **when** I view it, **then** I can see the status but cannot send reminders, escalate, or acknowledge on anyone's behalf.
- **US-PAUD-10** — As a Portfolio Read-Only / Auditor, I want to view policy compliance reports with 7-year audit-trail context, so that I can confirm sign-off evidence during reviews. (BRD §6.11 — reporting / retention)
- **US-PAUD-11** — As a Portfolio Read-Only / Auditor, I want to view statutory-readiness report templates (e.g., PF/ESIC eligibility, statutory data completeness) where available in Phase 1, so that I can gauge compliance posture across companies. (BRD §6.23 — compliance reports)

### Read-only company drill-down (BRD §6.3, FS §3.2)

- **US-PAUD-12** — As a Portfolio Read-Only / Auditor, I want to drill from a consolidated report into a single portfolio company's detail in read-only mode, so that I can investigate an anomaly without changing anything. (FS PORT-FR-008)
  - **Acceptance criteria:**
    - **Given** I drill into a company, **when** the detail view loads, **then** all fields are read-only and no save/edit/approve controls are rendered.
    - **Given** I drill into a company, **when** row-level security applies, **then** I see only records I am authorized to view within that company.
- **US-PAUD-13** — As a Portfolio Read-Only / Auditor, I want to view the employee directory and org chart for authorized portfolio companies in read-only mode, so that I can validate reporting structures during audit. (BRD §6.21)
- **US-PAUD-14** — As a Portfolio Read-Only / Auditor, I want to use advanced search and filters within read-only views, so that I can locate specific records or cohorts for review. (BRD §6.21, §8.8)
- **US-PAUD-15** — As a Portfolio Read-Only / Auditor, I want to switch read-only context between authorized portfolio companies within one session, so that I can review multiple entities without repeated login. (BRD §6.12, FS PORT-FR-004/005)
  - **Acceptance criteria:**
    - **Given** I am authorized for several portfolio companies, **when** I open the context switcher, **then** only my authorized companies are listed.
    - **Given** I switch context, **when** the new company loads, **then** the active company is clearly indicated and the switch is recorded in the audit trail.
- **US-PAUD-16** — As a Portfolio Read-Only / Auditor, I want the active company context always visibly indicated while I browse, so that I never misattribute what I am reviewing across companies. (FS PORT-FR-007)

### Audit, export & evidence (BRD §6.29, §6.23)

- **US-PAUD-17** — As a Portfolio Read-Only / Auditor, I want to export consolidated and per-company reports to Excel/PDF, so that I can package evidence for auditors and leadership. (FS PORT-FR-008, BRD §6.23)
  - **Acceptance criteria:**
    - **Given** I view an authorized report, **when** I export it, **then** the export contains only data within my authorized portfolio scope.
    - **Given** I export a report, **when** the export completes, **then** the export action is recorded in the audit trail with my identity, the companies covered, and a timestamp.
- **US-PAUD-18** — As a Portfolio Read-Only / Auditor, I want to view record-level change history for entities I am authorized to see, so that I can trace what changed, when, and by whom during an investigation. (BRD §6.29)
  - **Acceptance criteria:**
    - **Given** I open a record's history, **when** the history loads, **then** I see field, previous value, new value, actor, timestamp, and action type in read-only form.
    - **Given** I am viewing change history, **when** I attempt to alter or delete a history entry, **then** the system denies it (logs are tamper-resistant).
- **US-PAUD-19** — As a Portfolio Read-Only / Auditor, I want to view audit metadata for cross-company access events within my portfolio, so that I can confirm access controls are functioning. (BRD §6.29, FS §7.2)
- **US-PAUD-20** — As a Portfolio Read-Only / Auditor, I want every report I open and export I run to be logged, so that my own oversight activity is itself auditable. (FS PORT-FR-010, §7.2)

### Notifications & scheduled delivery (BRD §6.27)

- **US-PAUD-21** — As a Portfolio Read-Only / Auditor, I want to subscribe to scheduled delivery of authorized consolidated reports by email, so that I receive recurring oversight summaries without logging in. (BRD §6.23 — scheduled reports, §6.27)
  - **Acceptance criteria:**
    - **Given** I subscribe to a scheduled report, **when** it is delivered, **then** its contents are scoped to my authorized portfolio companies at the time of generation.
    - **Given** my authorization changes, **when** the next scheduled report runs, **then** delivery reflects my current authorized scope only.
- **US-PAUD-22** — As a Portfolio Read-Only / Auditor, I want to set my own notification channel and frequency preferences for the reports I receive, so that I am informed at a cadence that suits oversight without being a transactional participant. (BRD §6.27)

### Access boundary enforcement (BRD §6.12, §7; FS §7)

- **US-PAUD-23** — As a Portfolio Read-Only / Auditor, I want the system to deny me any company outside my authorized portfolio, so that tenant isolation is preserved during my reviews. (BRD §7 rule 15, FS §7.2, error AUTH_001)
  - **Acceptance criteria:**
    - **Given** I request a company not in my authorized portfolio, **when** the request is evaluated, **then** access is denied (AUTH_001) and the attempt is logged.
    - **Given** I attempt to switch context to an unauthorized company, **when** the switch is evaluated, **then** it is rejected (AUTH_002) and recorded.
- **US-PAUD-24** — As a Portfolio Read-Only / Auditor, I want all write, approval, and configuration controls hidden or disabled in my interface, so that I cannot accidentally attempt an action outside my read-only mandate. (BRD §5.3, FS §7.1)
  - **Acceptance criteria:**
    - **Given** I am signed in with this role, **when** any module loads, **then** create/edit/delete/approve/suspend/provision controls are not rendered for me.
    - **Given** a write operation is somehow attempted under my identity, **when** the backend evaluates permissions, **then** it is rejected and audit-logged.

## Primary journeys

1. **Quarterly portfolio compliance review.** The auditor signs in, opens the consolidated compliance dashboard, reviews policy alignment and acknowledgment status across all authorized portfolio companies, drills read-only into the two companies with the most overdue acknowledgments to confirm details, exports the findings to PDF for the audit committee, and confirms the export was audit-logged.

2. **Leadership cross-company snapshot.** The auditor opens the consolidated dashboard, filters to a subset of portfolio companies, reviews headcount, leave/attendance, and lifecycle metrics side by side with source-company identifiers on each row, saves the view, and schedules it for monthly email delivery to leadership.

3. **Targeted investigation with audit trail.** Following a query about a specific record, the auditor switches read-only context into the relevant authorized company, locates the record via advanced search, opens its record-level change history to see what changed and by whom, and exports the supporting report — every step (context switch, view, export) captured in the audit trail.

4. **Access-boundary verification.** During a controls review, the auditor attempts to reach a company outside the portfolio and confirms the system denies access (AUTH_001) and logs the attempt, validating that row-level security and tenant isolation are enforced.

## Notes & Phase 2

- **Phase 2 deferrals (out of scope for this role in Phase 1):**
  - Vendor/contractor records and contractor-specific reports are Phase 2 (BRD §3.2); this auditor sees only employee-related data in Phase 1.
  - Full India statutory compliance enablement (PF/ESI/PT/gratuity registers, returns, compliance health scores) is Phase 2 (Phase II BRD §2, §5, §9); Phase 1 exposes only statutory-readiness report templates (BRD §6.23). The corrupted ESI form list (Phase II §5.3.1) must be re-sourced before any compliance reporting is built on it.
  - Payroll reports/payslips are Phase 2 (BRD §3.2); no payroll visibility in Phase 1.
  - Native mobile access and push notifications are Phase 2; Phase 1 oversight is via responsive web only (BRD §6.16).
  - Company replication/cloning and advanced consolidated analytics (predictive) are out of Phase 1 scope (FS §2.2, BRD §3.3).
- **Cross-cutting dependencies:**
  - **RBAC & tenant isolation:** all visibility is gated by portfolio authorization, row-level security, and the User != Employee != Contractor model; this role carries zero write permissions in the RBAC matrix (FS §7.1).
  - **Audit:** every cross-company view, context switch, and export must be immutably logged with actor, scope, and timestamp (BRD §6.29, FS §7.2, PORT-FR-010).
  - **Reporting tier:** consolidated/cross-company reports should run against a read-only/analytics store to meet performance targets without straining transactional data (BRD §8.1; roadmap Gap 3b).
  - **Notifications:** scheduled report delivery and preferences depend on the notifications engine (BRD §6.27).
  - **Workflow engine:** this role only observes workflow outcomes/compliance status — it never participates as an approver or initiator (BRD §6.25).
