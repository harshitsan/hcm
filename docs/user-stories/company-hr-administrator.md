# Company HR Administrator — User Stories

> The Company HR Administrator is the HR owner inside a single SatelliteHR tenant company. They hold full HR operational authority for that one company — its master data, org structure, employees, policies, leave, attendance, lifecycle events, letters, and HR reporting — but no platform-, portfolio-, or group-level technical control. They care most about keeping their company's people records accurate, their workflows running, and their compliance/acknowledgment status clean.

## Scope & access

- **Authority level:** Company-scoped. Operates within exactly one company at a time; all create/read/update/delete actions are filtered by the active company context (FS §7.2 tenant isolation; BRD §4.4).
- **What they CAN do (within their own company):**
  - Maintain company master data and company-level configuration — auth methods, security/MFA, localization, notification defaults, workflow defaults (FS §3.1.4 COMP-FR-014; "Edit Assigned Company → ✅ Own", FS §7.1).
  - Define and maintain org structure: departments, positions, locations, groups, and jurisdiction associations (BRD §6.4–6.8).
  - Own employee records end-to-end: create, edit, manager hierarchy, dedupe, statutory fields, lifecycle (BRD §6.9, §6.15).
  - Administer policies, distribute them, and track acknowledgment (BRD §6.10–6.11).
  - Administer leave and time & attendance, including HR overrides with mandatory reason (BRD §6.17.4, §6.18.7).
  - Provision users and assign company-level roles within the company (BRD §6.12); generate HR letters (BRD §6.28); oversee talent acquisition (BRD §6.13); run reports (BRD §6.23); manage documents, custom fields, assets, directory, feedback/grievance, and view audit for the company (BRD §6.19–6.22, §6.26, §6.29).
- **What they CANNOT do (explicit boundaries):**
  - Create, provision, suspend, activate, or delete companies (FS §7.1 — all ❌ for Company Admin; reserved to Platform roles).
  - Create or manage portfolios or group-company structures, or add/remove member companies (FS §7.1 — all ❌).
  - Switch into or view any company other than their own; no cross-company directory, search, or consolidated reporting (FS §7.1 "Switch to Authorized Companies → ❌"; BRD §6.21.4 group search requires Group roles).
  - Grant platform/portfolio/group powers to any user, or escalate a lower role above its scope (BRD §5.1 role/permission separation; least-privilege).
  - Treat a `User` as an `Employee` — login identity, employee record, and (Phase 2) contractor record stay distinct (BRD §7.1).
  - Run payroll, India statutory compliance enablement, or contractor/vendor management — all Phase 2 (BRD §3.2).

## User stories

### Company configuration & master data (BRD §6.2 / FS §3.1.4)

- **US-HR-01** — As an HR Administrator, I want to maintain my company's business and contact details (trade name, website, addresses, primary contact), so that records and letters carry correct company information. (FS §3.1.2 COMP-FR-006)
- **US-HR-02** — As an HR Administrator, I want to configure company-level settings for localization, notification defaults, and workflow defaults, so that the company runs on conventions that fit my organization. (FS §3.1.4 COMP-FR-014)
- **US-HR-03** — As an HR Administrator, I want to add operating jurisdictions to my company, so that policies and statutory fields can be targeted to the right region. (BRD §6.4; FS §3.1.2 COMP-FR-008)
  - **Acceptance criteria:**
    - Given an existing employee assigned to jurisdiction J, when I attempt to remove J from the company, then the system blocks the removal and tells me employees are still assigned. (FS COMP-FR-008)
    - Given I add a new jurisdiction, when I save, then the change is written to the company audit trail with my user id and timestamp. (BRD §6.29)
- **US-HR-04** — As an HR Administrator, I want every change I make to company master data captured with old/new value, actor, and timestamp, so that changes are provable in an audit or dispute. (FS §3.1.2 COMP-FR-009; BRD §6.29)

### Organizational structure (BRD §6.4–6.8)

- **US-HR-05** — As an HR Administrator, I want to create departments in a multi-level hierarchy and assign a department head to each, so that approvals and reporting route to the right manager. (BRD §6.7)
- **US-HR-06** — As an HR Administrator, I want to define positions, each belonging to exactly one department, so that every employee can be assigned a consistent job slot. (BRD §6.8)
  - **Acceptance criteria:**
    - Given a new position, when I create it, then I must select exactly one parent department or the save is rejected. (BRD §6.8.1)
    - Given a position assigned to employees, when I attempt to reassign it to another department, then the system warns of downstream impact before applying. (BRD §6.8; §6.15.3)
- **US-HR-07** — As an HR Administrator, I want to create company-specific groups with n-level nesting, so that I can target policy eligibility, access, and reporting without rebuilding the org chart. (BRD §6.6)
- **US-HR-08** — As an HR Administrator, I want to maintain locations tied to a jurisdiction, so that holiday calendars and policy scope reflect where staff actually sit. (BRD §6.5)
- **US-HR-09** — As an HR Administrator, I want to define company- and location-specific holiday calendars, so that leave and attendance calculations use the correct working days. (BRD §6.18.3)

### Employee records & manager hierarchy (BRD §6.9)

- **US-HR-10** — As an HR Administrator, I want to create and maintain employee master records scoped to my company, so that I have a single source of truth for who works here. (BRD §6.9.1)
  - **Acceptance criteria:**
    - Given a new employee, when I save, then the record requires one company, one jurisdiction, at least one department, and one position. (BRD §6.9.3; §7.8)
    - Given an employee that has no system login, when I save, then the record persists without a linked User account. (BRD §6.9.2; §7.7)
- **US-HR-11** — As an HR Administrator, I want the system to enforce uniqueness on government IDs (Aadhaar, Passport, PAN) and prompt me on potential duplicates, so that I avoid creating duplicate people. (BRD §6.9.6)
  - **Acceptance criteria:**
    - Given an existing employee with PAN X, when I enter PAN X on a new record, then the system blocks the duplicate and shows the matching record before I proceed. (BRD §6.9.6)
- **US-HR-12** — As an HR Administrator, I want to assign each employee a single primary manager plus optional dotted-line and temporary/acting managers, so that the reporting structure reflects matrix and coverage realities. (BRD §6.9.5)
  - **Acceptance criteria:**
    - Given a manager change, when I save it, then the change is effective-dated and recorded in the audit trail with previous and new manager. (BRD §6.9.5)
    - Given a temporary/acting manager assignment, when it is active, then their approvals are delegated automatically for the assignment period. (BRD §6.9.5)
- **US-HR-13** — As an HR Administrator, I want to capture statutory workforce fields (UAN, ESIC number, PF/ESI eligibility, etc.) on employee records, so that the data is ready for compliance reporting. (BRD §6.9.7) — *capture only in Phase 1; full India compliance enablement is Phase 2.*
- **US-HR-45** — As an HR Administrator, I want to assign an employee to one or more operating locations within their jurisdiction, so that location-based holiday calendars, policies, and reporting apply to multi-site staff correctly. (BRD §6.5)
- **US-HR-46** — As an HR Administrator, I want to add an employee to zero or more groups (including assigning several groups at once), so that group-based policy eligibility, access, and reporting apply. (BRD §6.6)
- **US-HR-47** — As an HR Administrator, I want to assign an employee to more than one department while still requiring at least one, so that cross-departmental staff are represented and routed correctly for approvals and reporting. (BRD §6.7)
- **US-HR-48** — As an HR Administrator, I want the employee record's belongs-to relationships to support the optional multiplicities — multiple departments, zero-or-more groups, and one-or-more operating locations — alongside the single company, single jurisdiction, and single position, so that matrix and multi-site staffing is reflected accurately. (BRD §6.9.3)
  - **Acceptance criteria:**
    - Given an employee record, when I save it, then exactly one company, one jurisdiction, and one position are required, and at least one department is required. (BRD §6.9.3; §7.8)
    - Given a matrix employee, when I add a second department, additional groups, or additional operating locations, then the record persists all of them without losing the primary assignments. (BRD §6.9.3)
    - Given an operating location I try to assign, when it sits outside the employee's jurisdiction, then the system blocks it and explains the jurisdiction constraint. (BRD §7.10)
- **US-HR-49** — As an HR Administrator, I want to capture Professional Tax registration, LWF applicability, maternity and gratuity eligibility, and leave balances with statutory entitlements on the employee record, so that all §6.9.7 statutory fields are recorded for compliance reporting. (BRD §6.9.7) — *capture only in Phase 1; full India compliance enablement is Phase 2.*
- **US-HR-14** — As an HR Administrator, I want to add custom fields to employee and other supported records, so that I can track data unique to my company without code changes. (BRD §6.26)
- **US-HR-15** — As an HR Administrator, I want to bulk import and export master and transactional data through a validated, rollback-safe sandbox, so that I can migrate or correct data in volume safely. (BRD §6.24)
  - **Acceptance criteria:**
    - Given an import file with some invalid rows, when I run it in sandbox mode, then I get a record-level error report and no data is committed until I confirm. (BRD §6.24.4–6.24.5)

### User provisioning & roles (BRD §6.12)

- **US-HR-16** — As an HR Administrator, I want to provision user accounts and assign company-level roles within my company, so that the right people get exactly the access their job needs. (BRD §6.12.1–6.12.2)
  - **Acceptance criteria:**
    - Given I assign a role, when I save, then I can only assign roles scoped to my own company — platform, portfolio, and group roles are not offered. (BRD §5.1; FS §7.1)
    - Given a role assignment, when saved, then it is recorded in the audit trail. (BRD §6.29)
- **US-HR-17** — As an HR Administrator, I want to link a user account to an employee record (or leave them unlinked), so that the User-vs-Employee separation is honored while still enabling self-service when needed. (BRD §6.1.5; §7.1)
- **US-HR-18** — As an HR Administrator, I want to enable delegation so a user can hand their approvals to a colleague within the company, so that approvals don't stall during absences. (BRD §6.12.3)

### Policy management, distribution & acknowledgment (BRD §6.10–6.11)

- **US-HR-19** — As an HR Administrator, I want to create versioned, effective-dated policies and target them by company, jurisdiction, location, department, group, or employment type, so that the right rulebook reaches the right people. (BRD §6.10.1–6.10.2)
- **US-HR-20** — As an HR Administrator, I want to distribute a policy to a targeted audience and set acknowledgment type (required/optional/read-only) with a due date, so that I can enforce mandatory sign-offs. (BRD §6.11.1, 6.11.3–6.11.4)
  - **Acceptance criteria:**
    - Given a required policy distribution, when an acknowledgment passes 50%, 75%, and 100% of its SLA, then automated reminders and escalations fire. (BRD §6.11.5)
    - Given a policy whose content changes, when I publish the new version, then affected employees are prompted to re-acknowledge. (BRD §6.11.6)
- **US-HR-21** — As an HR Administrator, I want acknowledgment status, pending, and overdue reports with a compliance dashboard, so that I can prove who accepted each policy. (BRD §6.11.8)
- **US-HR-50** — As an HR Administrator, I want a policy to carry distinct applicability for employees versus contractors, so that each workforce type sees only the rules that apply to it. (BRD §6.10.2) — *contractor records are Phase 2, but the policy applicability dimension is captured in Phase 1.*
- **US-HR-51** — As an HR Administrator, I want policies to be referenced by the leave, attendance, onboarding, probation, performance, exit, and asset modules, so that a single policy definition drives behavior consistently across modules. (BRD §6.10.3)
- **US-HR-52** — As an HR Administrator, I want to define a distribution audience by combining location, department, group, employment-type, and individual criteria with AND/OR boolean logic, so that I can target precise employee segments. (BRD §6.11.1)
  - **Acceptance criteria:**
    - Given a distribution scope builder, when I combine two criteria with AND, then only employees matching both are targeted; when I combine them with OR, then employees matching either are targeted. (BRD §6.11.1)
    - Given a saved audience definition, when the matching population changes later, then the targeted set is re-evaluated against the criteria at distribution time. (BRD §6.11.1)
- **US-HR-53** — As an HR Administrator, I want to distribute policies manually, on a schedule, automatically on lifecycle events, or in bulk, so that the right policies reach people without manual effort each time. (BRD §6.11.2)
- **US-HR-54** — As an HR Administrator, I want to set a policy due date as fixed, relative to distribution (days-from-distribution), or based on hire date, with periodic renewal, so that deadlines fit different rollout scenarios. (BRD §6.11.4)
- **US-HR-55** — As an HR Administrator, I want overdue-acknowledgment escalation paths driven by each policy's criticality level, so that critical policies escalate faster and higher. (BRD §6.11.5)
- **US-HR-56** — As an HR Administrator, I want to force re-acknowledgment on a regulatory update even without editing the policy text, so that compliance re-affirmation is captured when the law changes. (BRD §6.11.6)
- **US-HR-57** — As an HR Administrator, I want policy acknowledgment records retained for 7 years in the audit trail, so that sign-off evidence is available for the full compliance retention window. (BRD §6.11.8)
- **US-HR-58** — As an HR Administrator, I want onboarding and transfer events to automatically distribute the applicable required policies, so that lifecycle changes trigger the correct acknowledgments without manual re-distribution. (BRD §6.11.9)
- **US-HR-59** — As an HR Administrator, I want required policy acknowledgments to surface as checklist tasks within lifecycle templates, so that policy sign-off is tracked alongside other onboarding and exit tasks. (BRD §6.11.9)

### Leave administration (BRD §6.17)

- **US-HR-22** — As an HR Administrator, I want to configure leave policies and types differentiated by group, jurisdiction, department, or location, so that entitlements match each population. (BRD §6.17.1–6.17.2)
- **US-HR-23** — As an HR Administrator, I want to configure sequential and parallel leave approval workflows with delegation and SLA-based escalation, so that requests get decided reliably. (BRD §6.17.3)
- **US-HR-24** — As an HR Administrator, I want to override any leave rule or balance with a mandatory reason, so that I can handle exceptions while keeping full traceability. (BRD §6.17.4)
  - **Acceptance criteria:**
    - Given a leave override, when I submit without a reason, then the system rejects it and requires a reason. (BRD §6.17.4)
    - Given a completed override, when I view the audit trail, then the previous value, new value, my user id, and timestamp are recorded. (BRD §6.17.4; §6.29)
- **US-HR-25** — As an HR Administrator, I want a company-wide leave calendar with coverage metrics, so that I can spot understaffed periods. (BRD §6.17.5)
- **US-HR-60** — As an HR Administrator, I want to configure each statutory and special leave type — Privileged/Annual, Casual, Sick/Medical, Maternity, Paternity, Bereavement, and Compensatory-off — with the correct entitlement and balance behavior, including comp-off accrual/credit from overtime or holiday-work and a comp-off expiry rule, so that every BRD-mandated leave type behaves correctly. (BRD §6.17.2)
  - **Acceptance criteria:**
    - Given the leave-type catalog, when I configure leave policies, then Privileged/Annual, Casual, Sick/Medical, Maternity, Paternity, Bereavement, and Comp-off are all available as distinct configurable types. (BRD §6.17.2)
    - Given a comp-off type, when an eligible employee works overtime or on a holiday, then comp-off is credited per the configured rule and expires after the configured window. (BRD §6.17.2)

### Time & attendance administration (BRD §6.18)

- **US-HR-26** — As an HR Administrator, I want to define shifts, rosters, and statutory working-hour limits, so that attendance is captured against the correct schedule. (BRD §6.18.2, 6.18.6)
- **US-HR-27** — As an HR Administrator, I want to configure attendance exception workflows (missed punch, late arrival, early exit) with approvals and escalation, so that corrections are controlled. (BRD §6.18.5)
- **US-HR-28** — As an HR Administrator, I want to override attendance records with a mandatory reason and full audit trail, so that I can fix errors without losing accountability. (BRD §6.18.7)
  - **Acceptance criteria:**
    - Given an attendance override, when I save it, then a reason is mandatory and the change is written to the audit trail with old/new values. (BRD §6.18.7; §6.29)
- **US-HR-61** — As an HR Administrator, I want to bulk-import attendance via CSV/XLS with attendance-specific validation and reconciliation against shifts, so that periodic device or vendor exports load cleanly. (BRD §6.18.1)
  - **Acceptance criteria:**
    - Given an attendance import file, when rows fail format, duplicate-punch, or shift-mismatch checks, then I receive a record-level error report and nothing is committed until I confirm. (BRD §6.18.1; §6.24.4)
    - Given valid punches, when committed, then they are reconciled against each employee's assigned shift/roster for the period. (BRD §6.18.1–6.18.2)
- **US-HR-62** — As an HR Administrator, I want to mark holidays as optional/floating with a per-employee selection allowance, so that staff can choose from optional holidays within policy limits. (BRD §6.18.3)
- **US-HR-63** — As an HR Administrator, I want to configure overtime rules, categories (normal/holiday/night shift), and eligibility by worker category, so that OT is calculated and approved consistently. (BRD §6.18.4)
- **US-HR-64** — As an HR Administrator, I want to configure daily working hours, weekly off, and maximum working-hour limits and have the system flag attendance that breaches them, so that statutory working-hour compliance is enforceable. (BRD §6.18.6)
  - **Acceptance criteria:**
    - Given configured daily, weekly-off, and maximum working-hour limits aligned to Indian labor law, when an employee's attendance breaches a limit, then the system flags the record for review. (BRD §6.18.6)

### Employee lifecycle (BRD §6.15)

- **US-HR-29** — As an HR Administrator, I want to run task-driven onboarding through its mandatory stages (offer acceptance, document submission, verification, asset assignment, induction), so that every new hire is onboarded consistently. (BRD §6.15.1)
- **US-HR-30** — As an HR Administrator, I want to run probation confirmation through the Manager → Department Head → HR hierarchy with outcomes Confirm/Extend/Separate, so that confirmation decisions are structured and auditable. (BRD §6.15.2)
- **US-HR-31** — As an HR Administrator, I want to process inter-department, inter-location, and inter-company transfers with effective dating and downstream impact assessment on assets, leave balances, and policies, so that moves are clean and complete. (BRD §6.15.3)
  - **Acceptance criteria:**
    - Given a transfer, when I set its effective date and confirm, then the system surfaces impacts on the employee's assets, leave balances, and applicable policies before applying. (BRD §6.15.3)
- **US-HR-32** — As an HR Administrator, I want to run exit management with notice-period handling, parallel clearance workflows, and completion tracking, so that offboarding is orderly and nothing is left open. (BRD §6.15.4)
- **US-HR-33** — As an HR Administrator, I want reusable task/checklist templates for lifecycle events, so that each new hire or leaver gets the same complete set of steps. (BRD §6.15; §3.1 Task/Checklist)
- **US-HR-65** — As an HR Administrator, I want to **initiate an outbound inter-company transfer** for one of my employees — releasing them from **my** company with effective dating and a clearance/handover package (assets, leave balance, policy acknowledgments) — so that the destination company can complete the inbound hire as a separate record. (BRD §6.15.3) — *I act only within my own company; I never create or edit a record in the destination company — that, and the cross-company authorization, belong to the destination company's HR Admin or a Portfolio/Group role.*
  - **Acceptance criteria:**
    - **Given** I initiate an outbound inter-company transfer, **when** I confirm the effective date, **then** my company's record is marked transferred-out/closed and a handover package is generated — and **no record is created or edited in the destination company by me**. (BRD §6.15.3; §7.2)
    - **Given** the transfer is initiated, **when** it is routed, **then** a cross-company-authorized Portfolio/Group role (or the destination company's HR Admin) creates the new destination record, with each side independently audited within its own tenant. (BRD §6.15.3; §6.29; §7.2)
- **US-HR-66** — As an HR Administrator, I want to configure and run performance review cycles as a lifecycle event, so that performance milestones feed confirmation, transfer, and exit decisions. (BRD §6.15) — *detailed performance management beyond lifecycle integration may be deferred; verify against final scope.*
- **US-HR-67** — As an HR Administrator, I want to author task templates with per-task assignees (by role), dependencies/prerequisites, due-date rules, and reminders/escalation, and report on task completion status, so that lifecycle checklists run automatically. (BRD §6.15; §3.1 Task/Checklist)
  - **Acceptance criteria:**
    - Given a task template, when I author it, then I can set each task's assignee role, its prerequisite tasks, its due-date rule, and its reminder/escalation schedule. (BRD §6.15.1; §3.1 Task/Checklist)
    - Given a running checklist instance, when I open the status report, then I see per-task completion, who is responsible, and which tasks are overdue. (BRD §6.15.5)

### HR letters & certificates (BRD §6.28)

- **US-HR-34** — As an HR Administrator, I want to generate HR letters (appointment, confirmation, transfer, promotion, relieving, experience certificate) by merging employee data into templates, so that correspondence is consistent and fast. (BRD §6.28.1–6.28.3)
- **US-HR-35** — As an HR Administrator, I want letters to run through an approval and signing-authority workflow with version history and reissue, so that issued documents are controlled and traceable for 7 years. (BRD §6.28.4, 6.28.6)
- **US-HR-68** — As an HR Administrator, I want to configure letter templates for all listed types — including Address Proof and Employment Verification alongside Appointment, Confirmation, Transfer, Promotion, Relieving, and Experience Certificate — with merge fields, so that every required HR document can be issued from a maintained template. (BRD §6.28.1)
- **US-HR-69** — As an HR Administrator, I want letters to auto-generate on workflow events (e.g., a confirmation letter on probation Confirm), so that documents issue without manual steps. (BRD §6.28.3)
- **US-HR-70** — As an HR Administrator, I want to batch-generate a letter type for a selected set of employees with PDF output, so that I can issue many letters at once. (BRD §6.28.3)
- **US-HR-71** — As an HR Administrator, I want to distribute a generated letter by email, in-app access, and print options with delivery tracking, so that issuance is recorded across every channel. (BRD §6.28.5)

### Talent acquisition oversight (BRD §6.13)

- **US-HR-36** — As an HR Administrator, I want to oversee job requisitions, the candidate pipeline, and offer workflows, so that hiring stays on track and aligned with org structure. (BRD §6.13.1–6.13.5)
- **US-HR-37** — As an HR Administrator, I want an accepted candidate to convert seamlessly into an employee record that flows into onboarding, so that there is one clean handoff with no re-keying. (BRD §6.13.7)
  - **Acceptance criteria:**
    - Given a candidate who accepts an offer, when conversion runs, then a new employee record is created in my company and an onboarding workflow is initiated. (BRD §6.13.7; §6.15.1)
- **US-HR-72** — As an HR Administrator, I want to create a job requisition tied to a position and department with headcount and job description, so that an open role is formally tracked. (BRD §6.13.1)
- **US-HR-73** — As an HR Administrator, I want a new requisition to route through an approval workflow before it opens for sourcing, so that hiring is authorized before recruiting begins. (BRD §6.13.1)
- **US-HR-74** — As an HR Administrator, I want to assign a requisition to a recruiter and hiring manager and track its status, so that ownership and pipeline progress are clear. (BRD §6.13.1)
- **US-HR-75** — As an HR Administrator/Recruiter, I want to define an interview panel and assign members per requisition and stage, so that the right evaluators are scheduled. (BRD §6.13.3)
- **US-HR-76** — As an HR Administrator/Recruiter, I want to configure scorecard evaluation criteria and rating scales per requisition and stage, so that interviews use a consistent rubric. (BRD §6.13.3)
- **US-HR-77** — As an HR Administrator/Recruiter, I want to assign reference-check tasks and track their completion per candidate, so that no candidate advances without completed references. (BRD §6.13.4)
- **US-HR-78** — As an HR Administrator, I want to configure offer-letter templates with merge fields, so that offers are generated consistently. (BRD §6.13.5)
- **US-HR-79** — As an HR Administrator, I want to generate an offer for a candidate and route it through an approval workflow before release, so that offers are authorized before they reach the candidate. (BRD §6.13.5)
- **US-HR-80** — As an HR Administrator, I want a configurable end-to-end hiring workflow spanning requisition, sourcing, screening, interviews, reference checks, offer, and conversion, so that each candidate moves through a controlled, auditable pipeline. (BRD §6.13.6)
  - **Acceptance criteria:**
    - Given a configured hiring workflow, when a candidate progresses, then each stage transition follows the configured routing and SLA rules and is recorded in the audit trail. (BRD §6.13.6; §6.25)

### Announcements (BRD §6.14)

- **US-HR-81** — As an HR/Company Administrator, I want to target announcements by jurisdiction in addition to company, location, department, group, and workforce type, so that region-specific messaging reaches the right staff. (BRD §6.14.1)
- **US-HR-82** — As an HR/Company Administrator, I want to schedule an announcement's publish and expiry dates, so that messages appear and retire automatically. (BRD §6.14.2)

### Assets, directory, feedback & documents (BRD §6.19–6.22)

- **US-HR-38** — As an HR Administrator, I want to assign, track, and recover company assets across their lifecycle with digital acknowledgments tied to onboarding and exit, so that company gear is never lost. (BRD §6.20)
- **US-HR-39** — As an HR Administrator, I want a searchable employee directory and org chart with privacy controls, so that people can find each other while sensitive data stays protected. (BRD §6.21)
- **US-HR-40** — As an HR Administrator, I want to review feedback and grievance submissions with restricted access and status tracking, so that sensitive cases are handled confidentially and traceably. (BRD §6.19)
- **US-HR-41** — As an HR Administrator, I want to store documents against companies, employees, and candidates with metadata, expiry tracking, and role-based access, so that paperwork is organized and flagged before it lapses. (BRD §6.22)
- **US-HR-83** — As an HR Administrator, I want to triage a grievance — categorize it, assign/route it, record a response, and move it through acknowledged, in-progress, resolved, and closed states — so that submitters get a tracked outcome. (BRD §6.19.1)
  - **Acceptance criteria:**
    - Given a submitted grievance, when I work it, then I can change its status only along the allowed lifecycle (acknowledged → in-progress → resolved → closed) and each change is recorded with restricted access. (BRD §6.19.1–6.19.3)
- **US-HR-84** — As an HR Administrator, I want to register assets under defined categories (IT Equipment, Mobile Devices, Network Equipment, Peripherals, Furniture, Security & Access, Software Licenses, Other) with identifying details, so that there is an asset inventory to assign from. (BRD §6.20.1)
- **US-HR-85** — As an HR Administrator, I want to move an asset through its full lifecycle states (Available → Allocated → Issued → In Repair → Returned → Retired → Disposed) along allowed transitions, so that asset status is always accurate. (BRD §6.20.2)
- **US-HR-86** — As an HR Administrator, I want to transfer an issued asset directly from one employee to another with acknowledgements on both sides, so that reassignment is recorded without a return-then-reissue. (BRD §6.20.3)
- **US-HR-87** — As an HR Administrator, I want asset reports for assignments, inventory, pending acknowledgements, and overdue returns, so that I can chase outstanding gear and reconcile inventory. (BRD §6.20.6)
- **US-HR-88** — As an HR Administrator, I want a department-based org-chart view in addition to the reporting-line tree, so that I can visualize structure by department. (BRD §6.21.2)
- **US-HR-89** — As an HR Administrator, I want to export the org chart as PNG/PDF, so that I can include it in presentations and offline documents. (BRD §6.21.2)
- **US-HR-90** — As an HR Administrator, I want to save and re-run directory advanced-search filters, so that I can repeat common people lookups without rebuilding the filters. (BRD §6.21.3)
- **US-HR-91** — As an HR Administrator, I want to configure which directory and contact fields are visible to which roles, so that privacy controls reflect company policy. (BRD §6.21.5)
- **US-HR-92** — As an HR Administrator, I want to attach and manage company-level documents (registration, certificates) with metadata and expiry, so that legal company paperwork is centralized. (BRD §6.22.1)
- **US-HR-93** — As an HR Administrator, I want employee and company document uploads validated against the allowed formats (PDF, JPG/JPEG, DOC/DOCX, XLS/XLSX, PNG, TXT) and the 2 MB size limit, so that unsupported or oversized files are rejected with a clear message. (BRD §6.22.2)
  - **Acceptance criteria:**
    - Given an upload to an employee or company record, when the file exceeds 2 MB or is an unsupported format, then the upload is rejected with a clear message naming the limit or allowed formats. (BRD §6.22.2)
- **US-HR-94** — As an HR Administrator, I want automated alerts before a tracked document expires, so that I can renew it before it lapses. (BRD §6.22.3)
- **US-HR-95** — As an HR Administrator, I want to categorize documents (e.g., ID proof, contract, certificate), so that paperwork is organized and filterable. (BRD §6.22.3)

### Reporting & audit (BRD §6.23, §6.29)

- **US-HR-42** — As an HR Administrator, I want standard and ad-hoc reports and dashboards across workforce, leave, attendance, hiring, assets, and policy compliance, scoped to my company, so that I can answer questions on demand. (BRD §6.23.1–6.23.3)
  - **Acceptance criteria:**
    - Given any report I run, when results return, then they are filtered to my company only, with no rows from other tenants. (BRD §6.23.6; FS §7.2)
- **US-HR-43** — As an HR Administrator, I want to schedule reports for recurring email delivery, so that stakeholders get updates without asking. (BRD §6.23.4)
- **US-HR-44** — As an HR Administrator, I want to view the chronological change history for any company or employee record, so that I can investigate discrepancies for my company. (BRD §6.29.4)
- **US-HR-96** — As an HR Administrator, I want a role-based default dashboard with workforce, leave, and attendance KPIs, charts, and drill-down on first login, so that I see the metrics that matter to my role without building them. (BRD §6.23.2)
- **US-HR-97** — As an HR Administrator, I want a report builder where I select fields, apply filters, and group/aggregate results, then save the view, so that I can compose reports the standard set does not cover. (BRD §6.23.3)
  - **Acceptance criteria:**
    - Given the report builder, when I build a report, then I can choose which fields appear, apply filter conditions, group/aggregate rows, and save the configuration as a reusable view scoped to my company. (BRD §6.23.3; §6.23.6)
- **US-HR-98** — As an HR Administrator, I want to set the delivery frequency (daily/weekly/monthly/quarterly) and recipients when scheduling a report, so that each stakeholder gets it at the right cadence. (BRD §6.23.4)
- **US-HR-99** — As an HR Administrator, I want to receive a periodic digest/summary notification that rolls up multiple events (pending approvals, reminders) instead of one email per event, so that I can manage notification volume. (BRD §6.27.3)

## Primary journeys

1. **Finish company setup after provisioning.** Receive the newly provisioned company from the Platform/Provider Admin → seed structure from templates or bulk import → create departments and assign heads → define positions, locations, groups, and holiday calendars → configure leave/attendance/workflow defaults → provision the first user accounts and roles → company is ready for people. (BRD §4.4; §6.4–6.8; §6.12)
2. **Onboard a new hire end-to-end.** Candidate accepts offer → convert to employee record (with dedupe + statutory fields) → onboarding checklist runs (documents submitted, HR verifies, assets assigned, manager approves steps, induction completed) → assign manager hierarchy → distribute required onboarding policies and track acknowledgment → employee ready for day one. (BRD §6.13.7; §6.15.1; §6.9; §6.11)
3. **Administer a leave exception with override.** Employee's request stalls or hits an edge case → HR Administrator reviews balance and policy → applies an override with a mandatory reason → balance/record adjusted → audit trail captures old/new values, actor, and time → result reflected on the team and company calendars. (BRD §6.17.3–6.17.5)
4. **Distribute and enforce a revised policy.** Edit policy and publish a new effective-dated version → target the right audience by department/group/jurisdiction → set acknowledgment to Required with a due date → reminders fire at 50/75/100% of SLA, laggards escalate → affected employees re-acknowledge → pull the compliance dashboard to confirm completion. (BRD §6.10; §6.11)

## Notes & Phase 2

- **Deferred to Phase 2 for this role (must not be built into the HR Admin's Phase 1 scope):**
  - **Payroll** — computation, deductions, payslips, disbursement (BRD §3.2; Phase II BRD §3).
  - **India statutory compliance enablement** — beyond Phase 1 statutory *field capture* and the PF/ESIC eligibility & register *report templates* that already ship in Phase 1 reporting, full registers/returns/dashboards/alerts are Phase 2 (BRD §3.2; Phase II BRD §2, §5, §9). *(Note: the Phase II ESI form list — Form 5 through Form 200 — is corrupted placeholder data and must be re-sourced before any compliance build.)*
  - **Contractors & vendors** — vendor master, contractor records, engagement models, vendor assignment history, and contractor/vendor roles are all Phase 2; the HR Admin manages employees only in Phase 1 (BRD §3.2; Phase II BRD §1, §6).
  - **Mobile app** — self-service is responsive web only in Phase 1 (BRD §6.16.1; §3.2).
- **Cross-cutting dependencies this role relies on:**
  - **Workflow engine** — run-time-configurable approval routing, SLA timers, and escalation underpins leave, attendance exceptions, onboarding, probation, transfers, exits, policy ack, and letters (BRD §6.25).
  - **Notifications** — email-mandatory event/scheduler-driven alerts drive reminders, approvals, and escalations (BRD §6.27).
  - **Audit & logging** — every HR override, role assignment, and master-data change must be captured (BRD §6.29).
  - **RBAC & tenant isolation** — the HR Admin's authority is strictly company-scoped; all reads/writes carry the company filter and they cannot grant cross-company or platform/portfolio/group powers (FS §7.1–7.2; BRD §5.1, §7.15).
  - **User ≠ Employee ≠ Contractor** — provisioning, employee creation, and (future) contractor handling must keep these records distinct (BRD §7.1; §6.1.5).
