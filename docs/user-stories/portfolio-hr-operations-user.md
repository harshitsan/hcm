# Portfolio HR Operations User — User Stories

> A centralized HR execution role for shared-services teams. The Portfolio HR Operations User runs day-to-day HR operations — employee lifecycle, leave, attendance, and operational reporting — across the companies they are explicitly assigned within a portfolio, switching company context from a single login. They care about getting transactional HR work done consistently and accurately across multiple companies, not about owning portfolio structure or company master data. (BRD §5.3)

## Scope & access

- **Authority level:** Portfolio scope, but *execution-only* and limited to the specific companies they are assigned within the portfolio. They act inside each authorized company's tenant boundary, one company context at a time. (BRD §4.2, §5.3)
- **What they CAN do:**
  - Switch company context between authorized companies within one authenticated session, without re-login. (BRD §6.1.4, FS §3.2.2 / UC-PORT-002)
  - Execute employee lifecycle: onboarding, probation steps, transfers (where permitted), and exits across assigned companies. (BRD §6.15)
  - Process leave: review/approve/override leave requests (override with mandatory reason and audit), manage balances, and use leave calendars. (BRD §6.17)
  - Process attendance: review attendance, handle correction/exception requests, and apply administrative overrides with mandatory reason and audit. (BRD §6.18)
  - Maintain employee records within assigned companies (create, update, lifecycle data) as a workforce executor. (BRD §6.9)
  - Run operational and compliance reports for the assigned companies, including cross-company portfolio reports filtered to authorized companies. (BRD §6.23, FS §3.2.3 / UC-PORT-003)
  - Use directory and org-chart search, distribute policies and announcements to employees in assigned companies, and execute bulk employee import per company. (BRD §6.21, §6.11, §6.14, FS §3.2.3)
- **Explicit BOUNDARIES (what they CANNOT do):**
  - **Cannot manage the portfolio itself** — cannot create/edit portfolios, add or remove companies from a portfolio, or change the portfolio manager. That is the Portfolio Manager / Platform Super Administrator. (FS §7.1, §3.2.1 / UC-PORT-001)
  - **Cannot provision, suspend, activate, archive, or delete companies**, and cannot edit company master data (legal details, subscription, jurisdictions). That is platform-level. (FS §7.1)
  - **No structural master-data ownership by default** — cannot define or restructure departments, positions, groups, locations, or author/version company policies unless those capabilities are explicitly granted in a given company. (BRD §5.3, §6.7, §6.8, §6.10)
  - **Cannot assign roles/permissions, configure SSO/MFA, or run access audits** — that is Company IT/Security Admin and Company Super Administrator. (BRD §5.5, §6.12)
  - **Cannot act in companies they are not assigned to**; context switching and every data query are bound to authorized companies only, and cross-company access is row-level filtered and audited. (BRD §6.12, FS §7.2)
  - Every cross-company action is recorded in the audit trail. (FS §3.2.3 / PORT-FR-010)

## User stories

### Multi-company access & context switching

- **US-PHRO-01** — As a Portfolio HR Operations User, I want to see only the companies I am assigned within my portfolio in a context switcher, so that I never accidentally work in an unauthorized tenant. (FS §3.2.2)
  - **Acceptance criteria:**
    - **Given** I am authenticated with the Portfolio HR Operations User role, **When** I open the company context selector, **Then** the list shows only the companies I am explicitly authorized for and highlights my current company.
    - **Given** I attempt to access a company outside my assignment via a direct URL, **When** the system validates authorization, **Then** access is denied (AUTH_002) and I am redirected to the company selector.
- **US-PHRO-02** — As a Portfolio HR Operations User, I want to switch company context without logging out, so that I can process HR work across multiple companies efficiently. (BRD §6.1.4, FS §3.2.2)
  - **Acceptance criteria:**
    - **Given** I select an authorized target company, **When** the switch completes, **Then** the system loads that company's configuration, applies its security policies, refreshes my menu to the permissions I hold there, and issues a new token carrying the company claim.
    - **Given** a context switch occurs, **When** the action is processed, **Then** an audit entry recording user, from-company, to-company, and timestamp is written.
- **US-PHRO-03** — As a Portfolio HR Operations User, I want the active company name (and logo) to remain clearly visible while I work, so that I always know which company's data I am editing. (FS §3.2.2 / PORT-FR-007)
- **US-PHRO-04** — As a Portfolio HR Operations User, I want bookmarkable per-company URLs that switch context on open, so that I can return directly to a company's workspace. (FS §3.2.2 / PORT-FR-006)

### Employee records & onboarding

- **US-PHRO-05** — As a Portfolio HR Operations User, I want to create and maintain employee records within an assigned company, so that each company's workforce data stays current. (BRD §6.9)
  - **Acceptance criteria:**
    - **Given** I am in an authorized company context, **When** I create an employee record, **Then** the record is scoped to that company only and linked to one jurisdiction, at least one department, and one position.
    - **Given** I enter a government ID (Aadhar, Passport, PAN) that already exists in that company, **When** I save, **Then** the system raises a duplicate-detection prompt before proceeding.
- **US-PHRO-06** — As a Portfolio HR Operations User, I want to understand that an employee record is distinct from a user login, so that I create work records correctly without forcing a system account where none is needed. (BRD §6.9, Cross-Module Rule 1 & 7)
- **US-PHRO-07** — As a Portfolio HR Operations User, I want to run the onboarding checklist (offer acceptance, document submission, document verification, asset assignment, induction) for new hires, so that every new employee is onboarded consistently. (BRD §6.15)
  - **Acceptance criteria:**
    - **Given** a candidate has been converted to an employee, **When** I open onboarding, **Then** the mandatory stages are presented as a tracked checklist.
    - **Given** I complete the document-verification stage, **When** I advance, **Then** the workflow routes the next stage per the company's configured onboarding workflow and records each step in the audit trail.
- **US-PHRO-08** — As a Portfolio HR Operations User, I want to execute bulk employee import per assigned company through the safe sandbox/validation flow, so that I can onboard workforce data quickly without corrupting records. (FS §3.2.3 / PORT-FR-009, BRD §6.24)
  - **Acceptance criteria:**
    - **Given** I upload an employee import file for a company, **When** validation runs, **Then** I see record-level success/failure and can review errors before committing.
    - **Given** an import fails mid-batch, **When** the system processes the result, **Then** the failed import rolls back and the company's existing records are unchanged.

### Employee lifecycle (probation, transfers, exits)

- **US-PHRO-09** — As a Portfolio HR Operations User, I want to process probation confirmation decisions (confirm, extend, or initiate separation) following the company's approval hierarchy, so that probation outcomes are recorded properly. (BRD §6.15)
- **US-PHRO-10** — As a Portfolio HR Operations User, I want to execute transfers (inter-department, inter-location) with effective dating and downstream impact review, so that moves are applied accurately. (BRD §6.15)
  - **Acceptance criteria:**
    - **Given** I initiate a transfer for an employee, **When** I set an effective date, **Then** the change is effective-dated with a complete audit trail and surfaces downstream impacts on assets, leave balances, and policies.
- **US-PHRO-11** — As a Portfolio HR Operations User, I want to run exit management (request, notice period, parallel clearance, completion tracking) for departing employees, so that offboarding is complete and auditable. (BRD §6.15)
  - **Acceptance criteria:**
    - **Given** an exit is initiated for an employee, **When** clearance runs, **Then** the system tracks parallel function-based clearances (including asset recovery) and records exit completion.
- **US-PHRO-12** — As a Portfolio HR Operations User, I want lifecycle actions tied to asset issuance and recovery, so that company equipment is assigned on onboarding and recovered on exit. (BRD §6.20)

### Leave processing

- **US-PHRO-13** — As a Portfolio HR Operations User, I want to review and act on leave requests for employees in assigned companies, so that time-off decisions are processed promptly. (BRD §6.17)
- **US-PHRO-14** — As a Portfolio HR Operations User, I want to override a leave rule or balance with a mandatory reason, so that I can handle exceptions while preserving accountability. (BRD §6.17)
  - **Acceptance criteria:**
    - **Given** I override a leave balance or rule, **When** I submit, **Then** the system requires a reason and writes a full audit-trail entry of the override.
- **US-PHRO-15** — As a Portfolio HR Operations User, I want to view personal, team, and company-wide leave calendars with coverage metrics, so that I can manage leave across the workforce. (BRD §6.17)
- **US-PHRO-16** — As a Portfolio HR Operations User, I want leave balances and entitlements to be reportable, so that I can verify entitlements when processing requests. (BRD §6.17)

### Attendance processing

- **US-PHRO-17** — As a Portfolio HR Operations User, I want to review captured attendance and process exception/correction requests (missed punch, late arrival, early exit), so that attendance records are accurate. (BRD §6.18)
- **US-PHRO-18** — As a Portfolio HR Operations User, I want to override an attendance record with a mandatory reason, so that genuine errors can be corrected with an audit trail. (BRD §6.18)
  - **Acceptance criteria:**
    - **Given** I override an attendance record, **When** I save, **Then** a reason is required and the override is recorded in the audit trail.
- **US-PHRO-19** — As a Portfolio HR Operations User, I want to process overtime entries and approvals per the company's eligibility rules, so that overtime is captured correctly for downstream reporting. (BRD §6.18)
- **US-PHRO-20** — As a Portfolio HR Operations User, I want to view shift and roster assignments for employees in an assigned company, so that I can interpret attendance against the correct schedule. (BRD §6.18)

### Policy distribution & communications

- **US-PHRO-21** — As a Portfolio HR Operations User, I want to distribute existing policies to the right audience within an assigned company and track acknowledgment, so that compliance sign-offs are captured. (BRD §6.11)
  - **Acceptance criteria:**
    - **Given** a policy is available in the company, **When** I distribute it by audience (location, department, group, employment type, or individuals), **Then** the system tracks pending, completed, and overdue acknowledgments with automated reminders and escalations.
- **US-PHRO-22** — As a Portfolio HR Operations User, I want to publish targeted announcements to employees in an assigned company, so that operational messages reach the right people. (BRD §6.14)
- **US-PHRO-23** — As a Portfolio HR Operations User, I want event-driven and reminder notifications for the approvals and lifecycle actions I own, so that nothing stalls. (BRD §6.27)

### Directory, documents & search

- **US-PHRO-24** — As a Portfolio HR Operations User, I want to search the employee directory and org chart within an assigned company, so that I can locate people while processing HR work. (BRD §6.21)
- **US-PHRO-25** — As a Portfolio HR Operations User, I want to attach and view documents on employee records (with expiry tracking), so that onboarding and lifecycle paperwork is organized and access-controlled. (BRD §6.22)

### Operational & cross-company reporting

- **US-PHRO-26** — As a Portfolio HR Operations User, I want to run standard operational HR reports (workforce, leave, attendance, lifecycle, asset) for each assigned company, so that I can monitor HR operations. (BRD §6.23)
- **US-PHRO-27** — As a Portfolio HR Operations User, I want consolidated portfolio reports across the companies I am authorized for, with row-level security and export, so that I can review operations spanning multiple companies at once. (FS §3.2.3 / PORT-FR-008, BRD §6.23)
  - **Acceptance criteria:**
    - **Given** I generate a cross-company report, **When** results are returned, **Then** only companies I am authorized for are included (row-level security), and I can export to Excel/PDF.
    - **Given** I run any cross-company operation, **When** it executes, **Then** an audit record captures the user, companies affected, action type, timestamp, and outcome.
- **US-PHRO-28** — As a Portfolio HR Operations User, I want to use statutory-enablement report templates (e.g., PF/ESIC eligibility, leave/attendance registers) where shipped in Phase 1, so that I can support compliance administration for assigned companies. (BRD §6.23)
- **US-PHRO-29** — As a Portfolio HR Operations User, I want to export operational data (employees, leave, attendance) for an assigned company within validated limits, so that I can support migration and downstream reporting. (BRD §6.24)

## Primary journeys

1. **Onboard a new hire in a managed company.** Switch context to the assigned company → open the converted candidate's employee record → run the onboarding checklist (documents → verification → asset assignment → induction) → manager-approved steps route through the workflow engine → employee ready for day one. Every step is audited.
2. **Process the day's leave and attendance across companies.** From the unified inbox, review pending leave requests in Company A, approve/override (with reason where needed) → switch context to Company B → clear attendance exceptions and approve overtime → balances and calendars update; all overrides carry mandatory reasons and audit entries.
3. **Run an exit and a cross-company status check.** Initiate an exit in an assigned company → notice period and parallel clearances (including asset recovery) tracked to completion → then run a consolidated portfolio report across authorized companies (row-level filtered) to review headcount and pending lifecycle actions, exporting for leadership.
4. **Distribute a policy and confirm acknowledgment.** Switch into the target company → distribute the existing policy to the relevant audience → monitor the acknowledgment dashboard → reminders/escalations fire automatically for overdue sign-offs.

## Notes & Phase 2

- **Phase 2 deferrals (out of scope for this role now):**
  - Contractor lifecycle, leave, and attendance — Vendors & Contractors is Phase 2; this role operates only on **employees** in Phase 1. (BRD §3.2, Phase II §1, §6)
  - Payroll processing, statutory deductions, final settlement disbursement — Phase 2; this role tracks lifecycle/attendance/leave data only, not pay. (Phase II §3, §7)
  - India statutory compliance enablement beyond the Phase 1 report templates (registers, returns, eligibility automation) — Phase 2. (Phase II §2, §5, §9)
  - Mobile app and native push notifications — Phase 2; this role uses the responsive web interface. (BRD §3.2)
  - The corrupted ESI form list (Phase II §5.3.1) must be re-sourced before any compliance feature is built; not a Phase 1 dependency for this role.
- **Cross-cutting dependencies:**
  - **Workflow engine** — onboarding, probation, transfers, exits, leave, and attendance approvals route through the configurable workflow engine (sequential/parallel approvals, SLA reminders, escalation). (BRD §6.25)
  - **Notifications** — email-driven approvals, reminders, and escalations underpin lifecycle and policy actions. (BRD §6.27)
  - **Audit & logging** — all employee/company changes and every cross-company action are recorded; overrides require mandatory reasons. (BRD §6.29, FS §3.2.3, §8)
  - **RBAC & tenant isolation** — capabilities are evaluated per company; context switching and all queries are bound to authorized companies with row-level security. Structural master-data and policy-authoring rights apply only where explicitly granted. (BRD §6.12, FS §7.1, §7.2)
  - **Effective dating** is inconsistent across the source docs (manager/transfer changes are effective-dated; company config is not) — transfer journeys should confirm the ratified effective-dating policy before build. (Roadmap Gap 1d / D4)
