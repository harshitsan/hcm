# Company Super Administrator — User Stories

> The Company Super Administrator is the ultimate authority within a single tenant company in SatelliteHR. They own end-to-end company setup and configuration, organizational structures, role and permission assignment, user provisioning, policy configuration, custom fields, reporting, and all bulk data operations for their company. They care about standing the company up correctly, keeping access tightly governed, and ensuring everything that happens inside the tenant is configurable, compliant, and auditable. (BRD §5.5)

## Scope & access

- **Authority level: company (single tenant).** Full administrative control of exactly one company; no powers above the company line. (BRD §5.5, §4.4)
- **Owns the whole tenant configuration surface.** They own company master data and settings, organizational structures, RBAC role/permission assignment, user provisioning, policy configuration, custom fields, reporting, and data import/export for their company. They typically *delegate* day-to-day HR operations to the Company HR Administrator and identity/security operations to the Company IT/Security Admin, but the Super Administrator retains ownership of all of them. (BRD §5.5, §6.12; FS §3.1.4)
- **CAN do (within own company):**
  - View and edit own company master data, legal details, contact, branding, and commercial view; manage company-level configuration — authentication methods, MFA/security/password policy, localization, notification defaults, and workflow defaults. (FS §7.1 "Edit Assigned Company (Own)"; FS §3.1.2, §3.1.4)
  - Define and maintain organizational structures: departments, positions, locations, groups, and the company's jurisdiction assignments. (BRD §6.5–§6.8, §6.4)
  - Create roles, compose permission sets, and assign roles/permissions to users contextually within the company. (BRD §6.12; §5.1)
  - Provision and deactivate user accounts and link/unlink them to employee records. (BRD §6.1, §4.4)
  - Configure policies, workflows, custom fields, notifications, and announcements for the company. (BRD §6.10, §6.25, §6.26, §6.27, §6.14)
  - Run all company reports and perform bulk import/export of company data. (BRD §6.23, §6.24)
  - View the company audit trail and record-level change history. (BRD §6.29)
- **CANNOT do (explicit boundaries):**
  - **No platform powers.** Cannot create, provision, suspend, activate, or delete companies — those belong to the Platform Super Administrator / Platform Operations Admin. (FS §7.1: Create/Suspend/Delete Company = ❌ for Company Admin)
  - **No portfolio powers.** Cannot create or manage portfolios or add/remove companies to a portfolio. (FS §7.1)
  - **No group-company powers.** Cannot create or manage group-company structures, add/remove member companies, or approve cross-company location sharing. (FS §7.1; BRD §6.3)
  - **No cross-tenant reach.** Cannot view, edit, report on, or switch context into any company other than their own; all access is bound to the active company and subject to tenant isolation and row-level security. (FS §7.1 "Switch to Any Company" = ❌; FS §7.2; BRD §7.15)
  - **Must respect the core invariant.** User, Employee, and Contractor are distinct; provisioning a user does not create an employee and vice versa. (BRD §6.1, §7.1)
  - Vendors/contractors, payroll, India statutory compliance enablement, and the mobile app are out of Phase 1 scope and therefore outside this role's reach for now. (BRD §3.2)

## User stories

### Company configuration (BRD §6.2; FS §3.1.2, §3.1.4)

- **US-CSA-01** — As a Company Super Administrator, I want to view and edit my company's master data (legal name, trade name, website, registration identifiers, contact, branding), so that company records stay accurate as the business changes. (FS §3.1.2)
  - **Acceptance criteria:**
    - **Given** I am authenticated with the Company Super Administrator role for my company, **when** I open my company's detail view, **then** I can edit company master data fields permitted for my role (e.g., legal name, trade name, website, contact) within their validation rules.
    - **Given** I edit the legal name or another tracked field, **when** I save, **then** the change is written to the audit trail with field, previous value, new value, actor, and timestamp.
    - **Given** I attempt to open or edit any company other than my own, **then** the system denies access (AUTH_001) and logs the attempt.
- **US-CSA-02** — As a Company Super Administrator, I want to configure allowed authentication methods (SAML, AD, Office 365, Google, local) for my company, so that sign-in aligns with our identity strategy. (FS §3.1.4)
- **US-CSA-03** — As a Company Super Administrator, I want to configure company security settings — MFA requirement, password policy, and session timeout, so that access meets our security posture. (FS §3.1.4; BRD §6.12)
  - **Acceptance criteria:**
    - **Given** I am on company security configuration, **when** I enable MFA at the company level and save, **then** the setting takes effect immediately for new sessions and is recorded in the audit trail.
    - **Given** I set a password policy, **when** I save, **then** the policy applies to local-login users in my company going forward (applied to new transactions only, not retroactively).
- **US-CSA-04** — As a Company Super Administrator, I want to configure localization (date, number, currency display formats) for my company, so that the system reflects how we operate. (FS §3.1.4; BRD §8.9)
- **US-CSA-05** — As a Company Super Administrator, I want to set default approval hierarchies and SLA settings for my company, so that workflows have sensible defaults across modules. (FS §3.1.4; BRD §6.25)
- **US-CSA-06** — As a Company Super Administrator, I want configuration inheritance from platform defaults that I can override at company level, so that I only change what matters to us and rely on safe defaults for the rest. (FS §3.1.4)
- **US-CSA-07** — As a Company Super Administrator, I want every configuration change logged in the audit trail and effective immediately on new transactions, so that I can trust what is live and trace what changed. (FS §3.1.4)

### Organizational structures (BRD §6.4–§6.8)

- **US-CSA-08** — As a Company Super Administrator, I want to define and maintain departments with n-level parent-child hierarchy and a designated department head, so that approvals, reporting, and policy applicability route correctly. (BRD §6.7)
  - **Acceptance criteria:**
    - **Given** I am defining departments, **when** I create a department and assign a department head, **then** the department becomes available for role assignment, approval routing, reporting, and policy applicability.
    - **Given** a department has child departments or assigned employees, **when** I attempt an action that would orphan them, **then** the system prevents it or requires reassignment.
- **US-CSA-09** — As a Company Super Administrator, I want to define positions each belonging to exactly one department, so that recruitment, onboarding, letters, and reporting reference consistent job definitions. (BRD §6.8)
- **US-CSA-10** — As a Company Super Administrator, I want to define company locations tied to a jurisdiction, so that staff placement, holiday calendars, and policy scope reflect where people work. (BRD §6.5)
- **US-CSA-11** — As a Company Super Administrator, I want to create company-specific groups with n-level nesting, so that I can target policy eligibility, access, and reporting without rebuilding the org chart. (BRD §6.6)
- **US-CSA-12** — As a Company Super Administrator, I want to assign the jurisdictions my company operates in from the supported catalog, so that policy applicability and statutory enablement reference the correct regions. (BRD §6.4)

### Roles, permissions & user provisioning (BRD §6.12, §6.1, §5.1)

- **US-CSA-13** — As a Company Super Administrator, I want to define roles and compose them from reusable permission sets, so that personas map to exactly the capabilities they need and no more. (BRD §5.1, §6.12)
  - **Acceptance criteria:**
    - **Given** roles are separate from permission sets, **when** I assign a permission set to a role, **then** the same permission set can be reused across multiple roles.
    - **Given** I save a role definition, **when** users hold that role, **then** their accessible screens and actions reflect exactly the composed permissions and the change is auditable.
- **US-CSA-14** — As a Company Super Administrator, I want to assign roles to users contextually within my company, so that each user gets the right authority for this company (recognizing a user may hold different roles in other companies). (BRD §5.1, §6.12)
  - **Acceptance criteria:**
    - **Given** a user already exists (possibly with roles in other companies), **when** I assign them a role in my company, **then** only their access within my company is affected; their roles elsewhere are unchanged.
    - **Given** I assign a role scoped to a department or group, **when** the user acts, **then** their access is restricted to that scope.
- **US-CSA-15** — As a Company Super Administrator, I want to delegate identity and security administration (user-role assignment, SSO/auth config, access audits) to a Company IT/Security Admin, so that specialized owners handle it while I retain overall accountability. (BRD §5.5; §5.5 IT/Security Admin)
- **US-CSA-16** — As a Company Super Administrator, I want to delegate HR ownership (employee management, policy administration, leave/attendance administration, HR reporting) to a Company HR Administrator, so that HR runs day-to-day operations under the access I grant. (BRD §5.5)
- **US-CSA-17** — As a Company Super Administrator, I want to provision user accounts for my company and link or unlink them to employee records, so that people who need system access get it while preserving User ≠ Employee separation. (BRD §6.1, §7.1)
  - **Acceptance criteria:**
    - **Given** an employee exists without a user account, **when** I provision a user and link it, **then** the user gains access while the employee record remains a distinct entity.
    - **Given** I provision a user, **when** I do not create or link an employee, **then** no employee record is implied or created.
- **US-CSA-18** — As a Company Super Administrator, I want to deactivate or revoke a user's access in my company, so that departures and role changes immediately remove inappropriate access. (BRD §6.12, §8.7.2)
- **US-CSA-19** — As a Company Super Administrator, I want to enable delegation so users can hand approval activities to a colleague within the company, so that work continues during absences with visibility to managers and hierarchy. (BRD §6.12)
- **US-CSA-31** — As a Company Super Administrator, I want to associate user accounts with groups where required, so that group-based access control and eligibility can apply to user identities who are not necessarily employees, while preserving the User ≠ Employee distinction. (BRD §6.6)
  - **Acceptance criteria:**
    - **Given** a user account exists in my company, **when** I add the user to one or more groups, **then** the user's group membership is recorded without creating or implying an employee record.
    - **Given** a user is associated with a group, **when** group-scoped access control or eligibility rules evaluate, **then** the user is included on the basis of that membership.
    - **Given** I add or remove a user's group association, **when** I save, **then** the change is written to the tenant-isolated audit trail with actor, group, action, and timestamp.

### Policy, workflow & extensibility configuration (BRD §6.10, §6.25, §6.26, §6.27, §6.14)

- **US-CSA-20** — As a Company Super Administrator, I want to configure HR and business policies with applicability by company, jurisdiction, location, department, group, and employment type, with versioning and effective dating, so that the right rules reach the right people. (BRD §6.10)
- **US-CSA-21** — As a Company Super Administrator, I want to configure approval workflows (sequential, parallel, conditional routing, escalation, SLAs) at the company level, so that requests route reliably and nothing falls through the cracks. (BRD §6.25)
  - **Acceptance criteria:**
    - **Given** I configure a workflow with conditional routing, **when** a matching transaction is raised, **then** it routes per the configured conditions (company, jurisdiction, location, department, group, transaction type).
    - **Given** an approval exceeds its SLA, **when** the deadline passes, **then** the system escalates per the configured strategy and records it in the workflow audit trail.
- **US-CSA-22** — As a Company Super Administrator, I want to define company-level custom fields (with data types, required/optional, masks, and regex validation) on supported entities, so that we can track company-specific data without code. (BRD §6.26)
  - **Acceptance criteria:**
    - **Given** I create a custom field on a supported entity, **when** I save it, **then** it becomes available in search, workflow conditions, reporting, import/export, and the API.
- **US-CSA-23** — As a Company Super Administrator, I want to configure notification templates with company branding, sender configuration, and event subscriptions, so that communications are on-brand and reach the right audiences. (BRD §6.27)
- **US-CSA-24** — As a Company Super Administrator, I want to authorize and configure announcements targeted by company, location, department, group, and worker type, so that organizational messaging is controlled and scoped. (BRD §6.14)
- **US-CSA-32** — As a Company Super Administrator, I want to configure a parallel approval step as either any-one-can-approve or all-must-approve, so that quorum and unanimous decisions (e.g., parallel-by-function exit clearance requiring all functions) are modeled correctly. (BRD §6.25.2)
  - **Acceptance criteria:**
    - **Given** I add a parallel approval stage to a workflow, **when** I set its sub-mode, **then** I can choose any-one-can-approve or all-must-approve.
    - **Given** an any-one-can-approve stage, **when** any single assigned approver approves, **then** the stage completes and remaining approvals are dismissed.
    - **Given** an all-must-approve stage, **when** approvers respond, **then** the stage completes only after every assigned approver has approved, and a single rejection halts the stage per policy.
- **US-CSA-33** — As a Company Super Administrator, I want to compose a workflow that mixes sequential and parallel stages, so that complex multi-stage approvals (e.g., parallel clearance followed by sequential sign-off) are supported in a single workflow definition. (BRD §6.25.2)
- **US-CSA-34** — As a Company Super Administrator, I want to set escalation to a named role rather than only the manager, so that overdue items route to the right responsible role regardless of reporting line. (BRD §6.25.3)
- **US-CSA-35** — As a Company Super Administrator, I want a pending approval automatically reassigned to an alternate approver after a configured time threshold, so that absent approvers do not block throughput (distinct from notify-only escalation). (BRD §6.25.3)
- **US-CSA-36** — As a Company Super Administrator, I want to configure multi-level escalation chains, so that an unactioned escalation escalates again further up the hierarchy when the escalation target also misses its SLA. (BRD §6.25.3)
  - **Acceptance criteria:**
    - **Given** I configure an escalation chain with multiple levels, **when** the first escalation target does not act within its SLA, **then** the item escalates to the next configured level.
    - **Given** the chain reaches its final level, **when** that level also misses SLA, **then** the system applies the configured terminal action and records every escalation hop in the workflow audit trail.
- **US-CSA-37** — As a Company Super Administrator, I want SLA timers to honor configured business hours and holiday calendars, so that approval deadlines are not counted against weekends, holidays, or other non-working time. (BRD §6.25.4)
- **US-CSA-38** — As a Company Super Administrator, I want the workflow audit trail to record each routing decision — which condition matched and which approver path was selected — so that I can prove why a given item routed the way it did. (BRD §6.25.5)
- **US-CSA-39** — As a Company Super Administrator, I want to define custom fields explicitly on each of Companies, Locations, Departments, Groups, and Positions (in addition to Employees), so that company-specific attributes on every org master-data entity are captured, validated, searchable, and reportable. (BRD §6.26.1)
  - **Acceptance criteria:**
    - **Given** I open custom-field configuration, **when** I choose the target entity, **then** Companies, Locations, Departments, Groups, Positions, and Employees are each individually selectable.
    - **Given** I create a custom field on any of those entities, **when** I save, **then** it becomes available in search, workflow conditions, reporting, import/export, and the API for that entity.
- **US-CSA-40** — As a Company Super Administrator, I want the custom-field data-type catalog to include the full set — single-line text, multi-line text, number, decimal, currency, percentage, boolean, date, date-time, single-select and multi-select lists, lookup/reference, email, phone, URL, and file/attachment — so that richer company-specific attributes (especially lookup/reference and file/attachment) can be modeled without code. (BRD §6.26.3)

### Reporting & data operations (BRD §6.23, §6.24)

- **US-CSA-25** — As a Company Super Administrator, I want to run standard, ad-hoc, and scheduled reports filtered to my company, so that leadership and HR get trustworthy insight without exposing other tenants' data. (BRD §6.23)
  - **Acceptance criteria:**
    - **Given** I run any report, **when** results are returned, **then** they include only my company's data (row-level security applied).
- **US-CSA-26** — As a Company Super Administrator, I want to bulk import master and transactional data (Company, Department, Location, Group, Employee, Leaves, Attendance) with sandbox validation and rollback, so that migrating into or maintaining the company is fast and safe. (BRD §6.24)
  - **Acceptance criteria:**
    - **Given** I submit an import file, **when** it is validated in sandbox/staging mode, **then** I receive record-level success/failure reporting before committing.
    - **Given** an import fails, **when** rollback applies, **then** the transaction is reverted atomically where feasible and no partial corruption remains.
    - **Given** I import dependent entities, **when** sequencing is enforced, **then** Foundation → Organizational → Workforce → Transactional order is respected.
- **US-CSA-27** — As a Company Super Administrator, I want to export my company's data (including for migration and operational exchange), so that we can move data out and meet portability needs. (BRD §6.24, §8.7.3)
- **US-CSA-41** — As a Company Super Administrator, I want imports and exports validated against the supported file formats (CSV, XLS, XLSX, JSON), the 50 MB maximum file size, and the 10,000-records-per-batch limit, so that oversized jobs are rejected with a clear message or chunked safely rather than failing mid-run. (BRD §6.24.2)
  - **Acceptance criteria:**
    - **Given** I submit an import file, **when** its format is not CSV, XLS, XLSX, or JSON, or it exceeds 50 MB, **then** the job is rejected before processing with a clear validation message.
    - **Given** an import or export exceeds 10,000 records, **when** the job runs, **then** the system enforces the per-batch limit by rejecting or chunking the job so no single batch exceeds it.

### Audit & governance (BRD §6.29; FS §8)

- **US-CSA-28** — As a Company Super Administrator, I want to view the company audit trail (entity, record, field, previous/new value, actor, timestamp, action), so that I can investigate changes and demonstrate compliance. (BRD §6.29)
- **US-CSA-29** — As a Company Super Administrator, I want to view chronological record-level change history for specific company records, so that I can resolve disputes about what changed and when. (BRD §6.29)
  - **Acceptance criteria:**
    - **Given** I open a company or employee record's history, **when** changes exist, **then** I see them in chronological order with actor and timestamp, scoped to my company only.
- **US-CSA-30** — As a Company Super Administrator, I want all my administrative actions captured in tamper-resistant, tenant-isolated logs, so that governance over the tenant is provable and trusted. (BRD §6.29; FS §7.2)

## Primary journeys

1. **Stand up a new company after provisioning.** The Platform team provisions the company and assigns the initial administrator; the Company Super Administrator then completes the fit-out — sets authentication, MFA, security, and localization (US-CSA-02–04), assigns jurisdictions (US-CSA-12), and builds the organizational skeleton: departments, positions, locations, and groups (US-CSA-08–11) — optionally seeding from templates and bulk import (US-CSA-26).
2. **Establish governance and delegate.** They define roles and permission sets (US-CSA-13), provision the first users (US-CSA-17), assign contextual roles (US-CSA-14), and delegate HR ownership to the Company HR Administrator (US-CSA-16) and identity/security to the Company IT/Security Admin (US-CSA-15) — retaining overall accountability.
3. **Configure the operating rulebook.** They configure policies with precise applicability (US-CSA-20), build approval workflows with escalation and SLAs (US-CSA-21), add company-specific custom fields (US-CSA-22), and set branded notifications and announcements (US-CSA-23–24) so the company is usable on day one and tunable later.
4. **Operate and assure.** On an ongoing basis they run company reports (US-CSA-25), manage bulk imports/exports for maintenance and migration (US-CSA-26–27), revoke access on departures (US-CSA-18), and review the audit trail and record history to govern the tenant (US-CSA-28–30).

## Notes & Phase 2

- **Phase-2 deferrals (out of scope for this role today):** vendor/contractor administration and contractor/vendor roles, India statutory compliance enablement (PF/ESI/PT/gratuity/bonus configuration and registers), payroll configuration, and the mobile app are Phase 2; the Company Super Administrator will own their company-level configuration when delivered. (BRD §3.2; Phase II BRD §1–§3, §6) Note the Phase 2 ESI statutory form list is known-corrupted placeholder data and must be re-sourced before any compliance build.
- **Company cloning / full replication is Phase 2.** In Phase 1 the shortcut for fast setup is templates plus bulk import (US-CSA-26), not wholesale cloning. (FS §2.2; Roadmap §5)
- **Cross-cutting dependencies:**
  - **RBAC & permission model** — every capability above is gated by the composable role/permission system the Super Administrator configures (BRD §6.12); separation of roles from permission sets is foundational (BRD §5.1).
  - **Tenant isolation** — all reads, writes, reports, and audit views are bound to the active company via row-level security; cross-company access is never available to this role (FS §7.2; BRD §7.15).
  - **Workflow engine** — policy, lifecycle, leave, and approval configurations depend on the configurable, run-time workflow engine and its SLA/escalation timers (BRD §6.25).
  - **Notifications** — approvals, escalations, reminders, and lifecycle events rely on the notification service; email is mandatory, other channels optional (BRD §6.27).
  - **Audit & logging** — administrative and configuration actions must be captured in tamper-resistant, tenant-isolated, retained logs (BRD §6.29; FS §8).
  - **Platform boundary** — company creation, suspension, activation, deletion, portfolio management, and group-company management remain with Platform/Portfolio/Group roles; this role consumes the provisioned tenant but cannot perform those acts (FS §7.1).
