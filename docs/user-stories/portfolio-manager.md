# Portfolio Manager — User Stories

> The Portfolio Manager is the primary role for a shared-services or HR-outsourcing team that runs HR for many client companies from a single login. Their authority is scoped strictly to the companies inside their assigned portfolio; they care most about switching company context instantly without re-login, standardizing setup and policies across companies, and producing consolidated cross-company reports — all while every cross-company action stays audited.

## Scope & access

- **Authority level: Portfolio.** Operates across the multiple companies explicitly authorized within one assigned portfolio (BRD §5.3, FS §3.2). A company belongs to at most one portfolio at a time (BRD §4.5, FS PORT-FR-002).
- **Multi-company access from one login.** Holds one user identity and one authenticated session that reaches all authorized companies; switches company context without logging out (BRD §6.1.4, FS UC-PORT-002).
- **Company-level admin where permitted.** Performs company-level administrative tasks across portfolio companies "as permitted" — employee lifecycle execution, leave/onboarding/exits, edit of assigned company details (FS §7 "Edit Assigned Company — ✅ Limited"; BRD §5.3).
- **Standardization & cross-company operations.** Pushes standardized policies to multiple companies, runs bulk per-company employee import, performs cross-company employee search, and posts portfolio-wide announcements (FS PORT-FR-009).
- **Consolidated reporting with row-level security.** Runs portfolio-level reports filtered to only the user's authorized companies, with export to Excel/PDF (FS PORT-FR-008, BRD §6.23.6).
- **Manages own portfolio.** Adds/removes companies within their own portfolio and updates its description (FS §7 "Manage Portfolio — ✅ Own", FS PORT-FR-003) — but a company added must not already belong to another portfolio (FS PORT-FR-002).

**Explicit boundaries — a Portfolio Manager CANNOT:**

- Create, suspend/activate, or delete companies; that is platform-level only (FS §7; BRD §5.2).
- View or switch to companies outside their authorized portfolio — context switch to an unauthorized company is rejected with `AUTH_002` (FS §7 "Switch to Authorized Companies"; FS §9.1).
- Create portfolios or manage portfolios other than their own; only Platform Super Administrator creates portfolios (FS §7 PORT-FR-001).
- Create or manage group-company structures (FS §7 — Group rows all ❌ for Portfolio Manager).
- Hold platform-admin powers (jurisdiction catalog, SSO providers, platform configuration, cross-tenant audit) (BRD §5.2).
- Own structural master data unless explicitly granted that permission per company (BRD §5.3 "no structural master data ownership unless granted").
- See across the User / Employee / Contractor boundary — acting on an employee record never implies a login exists, and employee records remain strictly company-specific (BRD §7.1, §7.4).

## User stories

### Authentication & company-context switching (BRD §6.1, FS §3.2.2)

- **US-PORT-01** — As a Portfolio Manager, I want to sign in once with a single user identity and reach every company I'm authorized for, so that I don't maintain separate logins per client. (BRD §6.1.3, §6.1.4)
- **US-PORT-02** — As a Portfolio Manager, I want a company-context switcher in the header showing only my authorized companies with the current one highlighted, so that I can move between clients in one click without logging out. (FS PORT-FR-004, UC-PORT-002)
  - **Acceptance criteria:**
    - Given I am authorized for Companies A, B, and C, when I open the context switcher, then only A, B, and C appear and the current company is visually marked.
    - Given I select Company B, when the switch completes, then a new session token is issued carrying Company B's context and B's name/logo is shown in the header.
    - Given a company exists in the platform but is not in my portfolio, when I open the switcher, then that company does not appear in the list.
- **US-PORT-03** — As a Portfolio Manager, I want the system to reject any attempt to switch into a company I'm not authorized for, so that tenant isolation is never breached. (FS PORT-FR-005, §9.1 AUTH_002)
  - **Acceptance criteria:**
    - Given a target companyId outside my authorized set, when I request a context switch, then the system returns `AUTH_002 — context switch not permitted` and my context is unchanged.
    - Given any switch attempt (success or failure), when it is processed, then an audit entry records the actor, source company, target company, and outcome.
- **US-PORT-04** — As a Portfolio Manager, I want each context switch to load that company's own configuration, security policies, currency, time zone, and permissions, so that I act under the correct company's rules. (FS PORT-FR-005)
  - **Acceptance criteria:**
    - Given I switch from a company using INR to one using USD, when the switch completes, then currency, time zone, and date format reflect the target company.
    - Given the target company applies a different permission set, when the switch completes, then my navigation menu refreshes to that company's permitted actions.
- **US-PORT-05** — As a Portfolio Manager, I want bookmarkable per-company URLs that auto-switch context when I open them, so that I can jump straight to a client's screen. (FS PORT-FR-006)
- **US-PORT-06** — As a Portfolio Manager, I want the active company name and logo always visible in the header, so that I never accidentally act in the wrong company. (FS PORT-FR-007)
- **US-PORT-07** — As a Portfolio Manager, I want session state preserved across a context switch where applicable, so that an in-progress HR action isn't lost when I change companies. (FS PORT-FR-005)

### Portfolio management (FS §3.2.1)

- **US-PORT-08** — As a Portfolio Manager, I want to view the companies that make up my portfolio with their key details, so that I know the full scope of what I administer. (FS §7 "View Assigned Companies — ✅ Portfolio")
- **US-PORT-09** — As a Portfolio Manager, I want to add a company to my own portfolio, so that I can take on a new client without platform intervention. (FS PORT-FR-003, §7 "Add/Remove Companies — ✅ Own")
  - **Acceptance criteria:**
    - Given a company that already belongs to another portfolio, when I try to add it, then the system rejects it with `PORT_002 — Company already in another portfolio`.
    - Given an eligible active company not in any portfolio, when I add it, then it is linked to my portfolio with an audit entry recording who added it and when.
- **US-PORT-10** — As a Portfolio Manager, I want to remove a company from my portfolio with a confirmation step, so that I can stop managing a client cleanly. (FS PORT-FR-003)
- **US-PORT-11** — As a Portfolio Manager, I want to update my portfolio's description, so that its purpose stays accurate as the client mix changes. (FS PORT-FR-003)

### Standardized policy deployment & policy operations (BRD §6.10, §6.11, FS §3.2.3)

- **US-PORT-12** — As a Portfolio Manager, I want to push a standardized policy to multiple companies in my portfolio at once, so that I enforce consistent rules across clients without rebuilding each one. (FS PORT-FR-009)
  - **Acceptance criteria:**
    - Given a standardized policy and a selection of my authorized companies, when I deploy it, then each selected company receives its own policy instance and a per-company success/failure status is reported.
    - Given the deployment runs, when it completes, then the audit trail records the actor, every company affected, and the outcome per company (FS PORT-FR-010).
- **US-PORT-13** — As a Portfolio Manager, I want to apply consistent policy applicability (by company, jurisdiction, location, department, group, employment type) when deploying, so that the same policy targets the right population in each company. (BRD §6.10.1)
- **US-PORT-14** — As a Portfolio Manager, I want to distribute a policy for acknowledgment and track who has accepted it across my companies, so that I can prove compliance per client. (BRD §6.11.1, §6.11.8)
- **US-PORT-15** — As a Portfolio Manager, I want policies I deploy to remain company-scoped instances rather than auto-propagating future edits, so that each client retains control over its own rulebook. (BRD §6.10.2; cf. FS GROUP-FR-005 template model)

### Cross-company employee lifecycle execution (BRD §6.9, §6.15)

- **US-PORT-16** — As a Portfolio Manager, I want to search and view employees across all my authorized companies from one screen, so that I can administer people without switching context repeatedly. (FS PORT-FR-009 "Cross-company employee search and view")
  - **Acceptance criteria:**
    - Given I search across my portfolio, when results return, then each result shows its company identifier and only employees from my authorized companies appear.
    - Given an employee belongs to a company outside my portfolio, when I search, then that employee is never returned (row-level security).
- **US-PORT-17** — As a Portfolio Manager, I want to execute employee onboarding workflows in any of my companies (within that company's context), so that new hires are set up consistently across clients. (BRD §6.15.1, §5.3 "onboarding")
- **US-PORT-18** — As a Portfolio Manager, I want to process leave administration and approvals across my companies, so that time-off runs smoothly without each client needing its own HR ops staff. (BRD §6.17.3, §5.3 "leave")
- **US-PORT-19** — As a Portfolio Manager, I want to run exit and clearance workflows for leavers in my companies, so that offboarding is handled centrally and auditably. (BRD §6.15.4, §5.3 "exits")
- **US-PORT-20** — As a Portfolio Manager, I want each employee record I act on to stay strictly within its own company, so that the same physical person in two of my companies remains two separate records. (BRD §7.4, §7.5)
- **US-PORT-21** — As a Portfolio Manager, I want effective-dated manager and assignment changes with a full audit trail, so that lifecycle history per company is accurate. (BRD §6.9.5)

### Bulk data import & migration (BRD §6.24, FS §3.2.3)

- **US-PORT-22** — As a Portfolio Manager, I want to bulk-import employee and master data per company, so that I can onboard a new client's workforce quickly. (FS PORT-FR-009 "Bulk employee import (per company)"; BRD §6.24.1)
  - **Acceptance criteria:**
    - Given an import file, when I submit it for a specific company, then it is validated in sandbox/staging mode before any records are committed (BRD §6.24.4).
    - Given validation finds errors, when the report returns, then it shows record-level success/failure and no partial unsafe commit occurs (rollback per BRD §6.24.5).
    - Given a successful import, when it completes, then the records are scoped only to the targeted company and the action is audited.
- **US-PORT-23** — As a Portfolio Manager, I want imports sequenced by dependency (foundation → organizational → workforce → transactional), so that a client's data loads in valid order. (BRD §6.24.3)
- **US-PORT-24** — As a Portfolio Manager, I want real-time status visibility on import jobs (Submitted, Validating, In-progress, Completed, Failed, Partially completed), so that I can track migration progress for each client. (BRD §6.24.6)
- **US-PORT-25** — As a Portfolio Manager, I want to export a company's data when I hand a client back or need a snapshot, so that data portability is preserved. (BRD §6.24.1, §6.2.6)

### Portfolio-wide & targeted announcements (BRD §6.14, FS §3.2.3)

- **US-PORT-26** — As a Portfolio Manager, I want to publish portfolio-wide announcements across my companies, so that I can communicate shared messages once. (FS PORT-FR-009 "Portfolio-wide announcements")
- **US-PORT-27** — As a Portfolio Manager, I want to target announcements by company, jurisdiction, location, department, group, or workforce type, with scheduling and expiry, so that the right audience sees the right message at the right time. (BRD §6.14.1, §6.14.2)

### Consolidated cross-company reporting (BRD §6.23, FS §3.2.3)

- **US-PORT-28** — As a Portfolio Manager, I want consolidated reports across selected companies in my portfolio, so that I can give clients and leadership a cross-company view. (FS PORT-FR-008, BRD §6.23.6)
  - **Acceptance criteria:**
    - Given I build a consolidated report, when I choose companies, then I can only multi-select from companies I am authorized for.
    - Given the report runs, when results render, then row-level security ensures no data from unauthorized companies appears (FS PORT-FR-008).
    - Given a finished report, when I export it, then I can output to Excel or PDF.
- **US-PORT-29** — As a Portfolio Manager, I want a company filter (multi-select within my portfolio) on portfolio reports, so that I can slice metrics by client. (FS PORT-FR-008)
- **US-PORT-30** — As a Portfolio Manager, I want to schedule recurring report delivery by email, so that stakeholders receive updates without me re-running reports. (BRD §6.23.4)
- **US-PORT-31** — As a Portfolio Manager, I want standard operational reports (workforce, leave, attendance, lifecycle) per company, so that I can run day-to-day client HR operations. (BRD §6.23.1)

### Company configuration (limited) & master data where granted (FS §3.1, BRD §5.3)

- **US-PORT-32** — As a Portfolio Manager, I want to edit limited details of companies assigned to me, so that I can keep client information current without platform involvement. (FS §7 "Edit Assigned Company — ✅ Limited")
  - **Acceptance criteria:**
    - Given a company in my portfolio, when I edit a permitted field, then the change is saved and a version-history/audit entry is created (FS COMP-FR-009).
    - Given I attempt a platform-only action (suspend, activate, delete), when I try, then the action is not available to me (FS §7).
- **US-PORT-33** — As a Portfolio Manager, I want to maintain structural master data (departments, positions, locations, groups) only where I've been explicitly granted that permission, so that ownership boundaries are respected. (BRD §5.3 "no structural master data ownership unless granted")
- **US-PORT-34** — As a Portfolio Manager, I want to reuse common setup patterns across new companies via templates and import, so that I can stand up clients faster. (Roadmap §5; BRD §2 obj. 4–5; full company cloning is Phase 2)

### Audit & oversight (BRD §6.29, FS §3.2.3)

- **US-PORT-35** — As a Portfolio Manager, I want every cross-company action I take logged with actor, companies affected, action type, parameters, timestamp, and success/failure, so that my activity is fully traceable. (FS PORT-FR-010, BRD §6.29.2)
  - **Acceptance criteria:**
    - Given any portfolio-level operation (policy push, bulk import, announcement, context switch), when it executes, then a complete audit record is written per FS PORT-FR-010.
    - Given an authorized reviewer, when they inspect a record's history, then they can see the chronological change history for that record (BRD §6.29.4).
- **US-PORT-36** — As a Portfolio Manager, I want to view the record-level change history for companies and employees in my portfolio, so that I can answer client questions and disputes. (BRD §6.29.4)

## Primary journeys

1. **Switch company context to act on the right client**
   1. Open the company-context switcher in the header.
   2. See only authorized companies; select the target client.
   3. System validates authorization, issues a new token, loads that company's config/policies/permissions, and refreshes the UI.
   4. Active company name/logo shown; the switch is written to the audit trail.

2. **Onboard a new client company's workforce (bulk import)**
   1. Add the eligible (unassigned) company to your portfolio.
   2. Prepare import files sequenced foundation → organizational → workforce → transactional.
   3. Submit each file in sandbox/staging mode for the target company; review record-level validation results.
   4. Commit on success (rollback on failure); monitor real-time job status to completion; action is audited per company.

3. **Standardize a policy across multiple clients**
   1. Select a standardized policy and the applicable companies in your portfolio.
   2. Set applicability (jurisdiction/location/department/group/employment type).
   3. Deploy — each company gets its own policy instance; per-company success/failure is reported.
   4. Distribute for acknowledgment and track sign-off; the deployment is fully audited.

4. **Produce a consolidated cross-company report**
   1. Open portfolio reporting and multi-select companies (only authorized ones available).
   2. Apply filters; run the report with row-level security enforced.
   3. Export to Excel/PDF, or schedule recurring email delivery to stakeholders.

## Notes & Phase 2

- **Phase 2 (deferred for this role):**
  - **Full company cloning/replication** — Phase 1 shortcut is templates + bulk import; wholesale "clone company #11 into #12" is Phase 2 (FS §2.2; Roadmap §5).
  - **Vendors & Contractors across portfolio companies** — contractor lifecycle, vendor management, and contractor/vendor roles are Phase 2 (BRD §3.2; Phase II BRD §1, §6). The User ≠ Employee ≠ Contractor split still holds today.
  - **India statutory compliance enablement & payroll** across clients (PF/ESI/PT/gratuity registers, returns, payroll runs) is Phase 2 — though Phase 1 reporting ships some statutory eligibility/register **templates** (BRD §6.23.5; Phase II BRD §2, §3, §5).
  - **Mobile app** for portfolio operations is Phase 2 (Phase II BRD; BRD §6.16.1 — Phase 1 self-service is responsive web only).
  - **Advanced commercial billing** for portfolios (FS §2.2).
- **Cross-cutting dependencies:**
  - **RBAC & tenant isolation** — every action is bounded by the user's authorized companies; cross-company access only via the portfolio construct, enforced by row-level security (BRD §4.5, §6.12; FS §7.2).
  - **Workflow engine** — onboarding, leave, exits, and policy escalations route through the configurable engine (BRD §6.25).
  - **Notifications** — approvals, escalations, reminders, and announcements depend on the email-first notification service (BRD §6.27).
  - **Audit & logging** — context switches and all portfolio-level operations must be immutably recorded (FS PORT-FR-010; BRD §6.29).
  - **Reporting infrastructure** — consolidated/cross-company reports should run against a read-optimized path with strict company-access filtering (BRD §6.23.6, §8.1).
  - **Open item:** a company belongs to at most one portfolio at a time — adding an already-assigned company is rejected (`PORT_002`) (FS PORT-FR-002, §9.1).
