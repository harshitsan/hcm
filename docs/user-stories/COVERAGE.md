# Phase I BRD — Feature Coverage Audit

A requirement-by-requirement audit of the **SatelliteHR Phase I BRD** against the per-role user
stories in this folder, run to ensure *no feature is left uncovered*. Produced by an 8-way parallel
audit (one auditor per BRD domain); every gap was then closed by adding stories to the owning role,
and an adversarial pass re-verified closure.

## Result

- **314 functional requirements** audited across BRD §6 modules + §7 cross-module rules.
- **As first audited:** 231 covered · 62 partial · 21 missing → **83 gaps**.
- **After closure:** all 83 gaps addressed with new user stories → **100% of audited requirements covered**.
- Catalog grew **570 → 651 stories** across 19 role files.

## Gaps closed (by owning role)

| Role file | Gaps closed | New stories |
|-----------|-------------|-------------|
| `company-hr-administrator.md` | 56 | US-HR-45 … US-HR-99 (+55) |
| `company-super-administrator.md` | 12 | US-CSA-31 … US-CSA-41 (+11) |
| `platform-super-administrator.md` | 6 | US-PA-41 … US-PA-46 (+6) |
| `company-it-security-admin.md` | 5 | US-CIT-28 … US-CIT-32 (+5) |
| `department-head-people-manager.md` | 2 | US-MGR-33 … US-MGR-34 (+2) |
| `employee-standard.md` | 2 | US-EMP-34 … US-EMP-35 (+2) |

## Coverage by BRD section (as first audited)

`Partial`/`Missing` are what the closure pass filled — all are now covered.

| BRD § | Module | Reqs | Covered | Partial→fixed | Missing→fixed |
|-------|--------|------|---------|---------------|---------------|
| §3.1 | Employee Lifecycle | 2 | 1 | 0 | 1 |
| §4.2 | Portfolio Management | 3 | 3 | 0 | 0 |
| §4.5 | Context Switching | 6 | 5 | 1 | 0 |
| §5.3 | Portfolio Management | 7 | 7 | 0 | 0 |
| §6.1 | User Authentication | 8 | 7 | 1 | 0 |
| §6.2 | Companies | 16 | 12 | 2 | 2 |
| §6.3 | Group Companies | 12 | 11 | 0 | 1 |
| §6.4 | Jurisdictions | 6 | 6 | 0 | 0 |
| §6.5 | Locations | 7 | 6 | 1 | 0 |
| §6.6 | Groups | 7 | 5 | 1 | 1 |
| §6.7 | Departments | 8 | 7 | 1 | 0 |
| §6.8 | Positions | 6 | 6 | 0 | 0 |
| §6.9 | Employees | 11 | 9 | 2 | 0 |
| §6.10 | Policy Management | 5 | 2 | 2 | 1 |
| §6.11 | Policy Distribution | 18 | 10 | 5 | 3 |
| §6.12 | Roles and Security RBAC | 11 | 10 | 1 | 0 |
| §6.13 | Talent Acquisition | 18 | 9 | 9 | 0 |
| §6.14 | Announcements | 4 | 2 | 2 | 0 |
| §6.15 | Employee Lifecycle | 15 | 13 | 2 | 0 |
| §6.16 | Employee Self-Service | 4 | 4 | 0 | 0 |
| §6.17 | Leave Management | 12 | 11 | 1 | 0 |
| §6.18 | Time & Attendance | 13 | 7 | 4 | 2 |
| §6.19 | Feedback & Grievance | 4 | 3 | 1 | 0 |
| §6.20 | Employee Asset Management | 6 | 2 | 3 | 1 |
| §6.21 | Employee Directory & Org Chart | 10 | 5 | 2 | 3 |
| §6.22 | Documents & Attachments | 10 | 6 | 3 | 1 |
| §6.23 | Reporting & Analytics | 8 | 5 | 3 | 0 |
| §6.24 | Org & Master Data | 8 | 7 | 1 | 0 |
| §6.25 | Workflow Engine | 14 | 7 | 5 | 2 |
| §6.26 | Org & Master Data | 10 | 7 | 3 | 0 |
| §6.27 | Notifications & Communications | 7 | 4 | 2 | 1 |
| §6.28 | HR Letters & Certificates | 8 | 4 | 2 | 2 |
| §6.29 | Audit and Logging | 11 | 11 | 0 | 0 |
| §7.1 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.2 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.3 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.4 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.5 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.6 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.7 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.8 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.9 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.10 | Cross-Module Rules | 1 | 0 | 1 | 0 |
| §7.11 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.12 | Cross-Module Rules | 2 | 2 | 0 | 0 |
| §7.13 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.14 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| §7.15 | Cross-Module Rules | 1 | 1 | 0 | 0 |
| Context Switching (FS PORT-FR-005) | Context Switching | 1 | 1 | 0 | 0 |
| Context Switching (FS PORT-FR-007) | Context Switching | 1 | 1 | 0 | 0 |
| Task/Checklist Management (detailed spec) | Task/Checklist Management | 1 | 0 | 1 | 0 |

## Closed-gap detail

Every previously partial/missing requirement and the role that now owns a story for it.

### company-hr-administrator (56)

- **[partial]** Locations (§6.5) — Employees may operate across one or more locations (assign an employee to multiple locations / location placement on employee record)
- **[partial]** Groups (§6.6) — Employees may belong to multiple groups (zero-or-more group membership maintained on the employee record)
- **[partial]** Departments (§6.7) — Employees shall belong to at least one department and may belong to multiple departments
- **[partial]** Employees (§6.9.3) — Belongs-to relationships: exactly one company, one jurisdiction, at least one department (may belong to multiple), one position, zero or more groups, may operate across one or more locations
- **[partial]** Employees (§6.9.7) — Statutory data capture — Professional Tax registration, LWF applicability, maternity benefit eligibility, gratuity eligibility tracking, leave balances with statutory entitlements
- **[partial]** Policy Management (§6.10.2) — Different policy applicability for employees vs contractors
- **[MISSING]** Policy Management (§6.10.3) — Policies integrate with modules: leave, attendance, onboarding, probation, performance, exit, asset management
- **[MISSING]** Policy Distribution (§6.11.1) — Distribution scope using AND/OR logic across combinations of dimensions
- **[MISSING]** Policy Distribution (§6.11.2) — Distribution methods — manual, scheduled, automatic (event-triggered), and bulk
- **[partial]** Policy Distribution (§6.11.4) — Due-date configuration — fixed dates, relative dates (days from distribution), hire-based dates, periodic renewal
- **[partial]** Policy Distribution (§6.11.5) — Escalation workflows for overdue acknowledgments based on policy criticality
- **[partial]** Policy Distribution (§6.11.6) — Re-acknowledgment triggered by regulatory updates
- **[partial]** Policy Distribution (§6.11.8) — 7-year audit-trail retention for policy acknowledgments
- **[partial]** Policy Distribution (§6.11.9) — Integration with employee lifecycle (onboarding, transfers)
- **[MISSING]** Policy Distribution (§6.11.9) — Integration with task/checklist module
- **[partial]** Talent Acquisition (§6.13.1) — Job Requisitions — creation of requisitions
- **[partial]** Talent Acquisition (§6.13.1) — Job Requisitions — approval workflow for requisitions
- **[partial]** Talent Acquisition (§6.13.1) — Job Requisitions — status tracking and assignment to recruiters/hiring managers
- **[partial]** Talent Acquisition (§6.13.3) — Interview Management — interview panel definition / assigning panel members
- **[partial]** Talent Acquisition (§6.13.3) — Interview Management — configuring scorecard criteria (defining the rubric)
- **[partial]** Talent Acquisition (§6.13.4) — Reference Checks — HR/recruiter tracking and documentation of reference status across candidate
- **[partial]** Talent Acquisition (§6.13.5) — Offer Management — configurable offer letter templates
- **[partial]** Talent Acquisition (§6.13.5) — Offer Management — offer approval workflow
- **[partial]** Talent Acquisition (§6.13.6) — Hiring Workflows — end-to-end workflow (requisition→sourcing→screening→interviews→reference→offer→conversion)
- **[partial]** Announcements (§6.14.1) — Announcement targeting by jurisdiction specifically (full dimension set at company HR level)
- **[partial]** Announcements (§6.14.2) — Scheduling and expiry of announcements
- **[partial]** Employee Lifecycle (§6.15.3) — Transfers — inter-company transfers
- **[partial]** Employee Lifecycle (§6.15) — Performance workflows (lifecycle event)
- **[partial]** Task/Checklist Management (detailed spec) — Task template detail (per-task assignees, dependencies/prerequisites, due-date rules, reminders/escalation, task status reporting)
- **[partial]** HR Letters & Certificates (§6.28.1) — Configurable templates for all listed letter types (Appointment, Confirmation, Transfer, Promotion, Relieving, Experience Certificate, Address Proof, Employment Verification)
- **[MISSING]** HR Letters & Certificates (§6.28.3) — Generation — automated (triggered by workflow events)
- **[MISSING]** HR Letters & Certificates (§6.28.3) — Generation — batch generation with PDF output
- **[partial]** HR Letters & Certificates (§6.28.5) — Distribution — email delivery, in-app access, print, with delivery tracking
- **[partial]** Leave Management (§6.17.2) — Leave types: Privileged/Annual, Casual, Sick/Medical, Maternity, Paternity, Bereavement, Compensatory-off (comp-off)
- **[partial]** Time & Attendance (§6.18.1) — Attendance capture — CSV/XLS file import
- **[partial]** Time & Attendance (§6.18.3) — Optional holidays configuration
- **[partial]** Time & Attendance (§6.18.4) — Overtime calculation, categorization (normal/holiday/night shift), eligibility by worker category, approval workflows
- **[partial]** Time & Attendance (§6.18.6) — Statutory working hours config (daily hours, weekly off, max working-hour limits) aligned to Indian labor law
- **[partial]** Feedback & Grievance (§6.19.1) — Reviewer handling — assign/route, categorize, respond, and resolve/close a grievance
- **[MISSING]** Employee Asset Management (§6.20.1) — Asset categories (IT Equipment, Mobile Devices, Network Equipment, Peripherals, Furniture, Security & Access, Software Licenses, Other) and asset master/registration
- **[partial]** Employee Asset Management (§6.20.2) — Asset lifecycle states (Available, Allocated, Issued, In Repair, Returned, Retired, Disposed)
- **[partial]** Employee Asset Management (§6.20.3) — Asset transactions: Issue, Return, Transfer, Recovery
- **[partial]** Employee Asset Management (§6.20.6) — Reporting: asset assignment, inventory, pending acknowledgements, overdue returns
- **[partial]** Employee Directory & Org Chart (§6.21.2) — Org chart — department-based view
- **[MISSING]** Employee Directory & Org Chart (§6.21.2) — Org chart — export options (PNG/PDF)
- **[MISSING]** Employee Directory & Org Chart (§6.21.3) — Saved searches (in the directory)
- **[MISSING]** Employee Directory & Org Chart (§6.21.5) — Configuration of directory privacy policy (which fields are visible to which roles)
- **[partial]** Documents & Attachments (§6.22.1) — Supported entities: Company
- **[partial]** Documents & Attachments (§6.22.2) — File support: allowed formats (PDF, JPG/JPEG, DOC/DOCX, XLS/XLSX, PNG, TXT) and 2 MB max size enforcement
- **[partial]** Documents & Attachments (§6.22.3) — Expiration tracking with proactive notification/alert before lapse
- **[MISSING]** Documents & Attachments (§6.22.3) — Document categorization
- **[partial]** Reporting & Analytics (§6.23.2) — Interactive dashboards with charts, KPIs, drill-down, and role-based default dashboards
- **[partial]** Reporting & Analytics (§6.23.3) — Ad-hoc reporting / report builder with field selection, filtering, grouping, and saved views
- **[partial]** Reporting & Analytics (§6.23.4) — Scheduled reports: configurable email delivery with multiple frequency options
- **[partial]** Notifications & Communications (§6.27.3) — Delivery models: event-driven AND scheduler-driven (digests, summaries)
- **[partial]** Cross-Module Rules (§7.10) — An employee belongs to one jurisdiction and may operate across one or more locations

### company-super-administrator (12)

- **[MISSING]** Groups (§6.6) — Users may be associated with groups where required (group membership for User identities, not just employees)
- **[partial]** Org & Master Data (cross-cut, §6.26 ties to §6.5–6.8) — Custom fields available on Locations, Departments, Groups, and Positions entities (per §6.26.1 these are extensible entities; the org-data modules should surface this)
- **[partial]** Workflow Engine (§6.25.2) — Approval pattern: Parallel approvals with the two distinct sub-modes — any-one-can-approve vs all-must-approve
- **[MISSING]** Workflow Engine (§6.25.2) — Mixed (sequential + parallel) approval patterns in one workflow
- **[partial]** Workflow Engine (§6.25.3) — Escalation strategy: Role-based escalation
- **[MISSING]** Workflow Engine (§6.25.3) — Escalation strategy: Time-based reassignment
- **[partial]** Workflow Engine (§6.25.3) — Escalation strategy: Multi-level escalation
- **[partial]** Workflow Engine (§6.25.4) — Configurable SLAs with business-hours awareness
- **[partial]** Workflow Engine (§6.25.5) — Complete audit trail of actions, approvals, escalations, AND routing decisions
- **[partial]** Data Management Import/Export (§6.24.2) — File formats (CSV, XLS, XLSX, JSON) and limits (50 MB max, 10,000 records/batch)
- **[partial]** Data Model Extensibility / Custom Fields (§6.26.1) — Supported entities: Companies, Locations, Departments, Groups, Positions, AND Employees
- **[partial]** Data Model Extensibility / Custom Fields (§6.26.3) — Full data-type catalog incl. lookup/reference and file/attachment types (and currency/percentage/date-time/multi-select etc.)

### platform-super-administrator (6)

- **[partial]** Companies (§6.2.5) — Commercial packaging / subscription models based on number of companies, number of employees, and subscribed modules
- **[MISSING]** Companies (§6.2.5) — Enforcement of subscribed-module entitlements (only subscribed modules are usable by a tenant)
- **[MISSING]** Companies (§6.2.5) — Employee-count / company-count limit enforcement against subscription
- **[partial]** Companies (§6.2.6) — 7-year retention subject to archival fees (commercial billing for ongoing archival storage)
- **[MISSING]** Group Companies (§6.3.1) — Platform Super Administrator creates the group-company structure itself (the construct GCA later governs)
- **[MISSING]** Notifications & Communications (§6.27.1) — Microsoft Teams and WhatsApp via third-party connectors (optional) — configuration/enablement of the connector

### company-it-security-admin (5)

- **[partial]** User Authentication (§6.1.6) — Account lockout after repeated failed authentication attempts (secure password management detail)
- **[partial]** Tenant Isolation (§4.5 / §6.22.4) — Document/attachment storage enforces tenant isolation and encryption at rest within company boundary
- **[partial]** Policy Management (§6.10.4) — Policy visibility and maintenance shall be role controlled
- **[MISSING]** Time & Attendance (§6.18.1) — Attendance capture — biometric device integration
- **[MISSING]** Time & Attendance (§6.18.1) — Attendance capture — API integration with third-party systems

### department-head-people-manager (2)

- **[partial]** Roles and Security RBAC (§6.12.3) — Early revocation/cancellation of an active delegation by the delegator before its end date
- **[MISSING]** Employee Lifecycle (§3.1.G / §6.15) — Knowledge transfer (listed under Employee Lifecycle Management capabilities)

### employee-standard (2)

- **[partial]** Employee Directory & Org Chart (§6.21.1) — Directory views — list, card, and compact view with employee info (name, photo, position, dept, location, contact)
- **[partial]** Notifications & Communications (§6.27 - in-app view) — Viewing/consuming in-app notifications (a notification center/inbox to read delivered in-app notifications)

---

*Method: graphify-out audit workflows (audit → fill → verify). Re-run the audit whenever the BRD changes to keep coverage at 100%.*
