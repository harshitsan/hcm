# Platform Operations Admin — User Stories

> The Platform Operations Admin is an HRMS-provider-side operational support persona who keeps tenant onboarding and day-to-day operations running smoothly across all companies, without holding full Platform Super Administrator authority. They create and configure tenant companies, troubleshoot configuration issues across tenants, context-switch into any company to assist, view logs and audit trails, and help customers with data imports under approval — but they cannot perform destructive company lifecycle actions, own security policy, or manage platform provisioning reserved to the Super Administrator. (BRD §5.2)

## Scope & access

- **Authority level:** Platform tier (HRMS provider), operational support scope — broad read/assist reach across all tenants but deliberately bounded away from destructive and governance-owning actions. (BRD §4.1, §5.2)
- **What they CAN do:**
  - Create and provision new tenant companies via the 6-step creation wizard. (FS §7.1 "Create Company" ✅; FS §3.1.1 UC-COMP-001)
  - View all companies on the platform and open any company's detail record. (FS §7.1 "View All Companies" ✅)
  - Edit any company's master data (basic info, contact, operational settings, jurisdictions, commercial attributes) to fix configuration. (FS §7.1 "Edit Any Company" ✅)
  - Switch company context into any company to assist, without re-login. (FS §7.1 "Switch to Any Company" ✅; BRD §6.12.6)
  - View logs and audit trails to troubleshoot tenant issues. (BRD §5.2; §6.29)
  - Assist with data imports under approval — sandbox validation, error reporting, rollback-safe execution. (BRD §5.2; §6.24)
- **Explicit BOUNDARIES (what they CANNOT do):**
  - Cannot Suspend, Activate, or Inactivate companies — lifecycle status transitions require Platform Super Administrator approval. (FS §7.1 "Suspend/Activate Company" ❌; FS COMP-FR-010)
  - Cannot Delete or archive companies. (FS §7.1 "Delete Company" ❌)
  - Cannot Create or Manage Portfolios, or add/remove portfolio companies — Portfolio creation is Super Admin only. (FS §7.1 Portfolio rows ❌)
  - Cannot Create or Manage Group Company structures or members. (FS §7.1 Group rows ❌)
  - Does NOT own security policy: cannot define password rules, MFA mandates, or platform security policies (that authority belongs to the Platform Security & Compliance Admin and Super Administrator). (BRD §5.2 vs §5.2 Security & Compliance Admin)
  - Does NOT own platform-wide provisioning configuration reserved to the Super Administrator: defining the jurisdictions catalog, configuring SSO providers, managing global groups. (BRD §5.2 Platform Super Administrator)
  - All access remains subject to tenant-isolation and cross-company audit rules — every context switch and cross-company access is logged. (FS §7.2; §8.1)

## User stories

### Company provisioning & onboarding support (BRD §6.2 / FS §3.1.1)

- **US-POPS-01** — As a Platform Operations Admin, I want to launch the 6-step company creation wizard for a new customer, so that I can provision their tenant during onboarding. (FS §3.1.1)
  - **Acceptance criteria:**
    - **Given** I am authenticated with the Platform Operations Admin role, **when** I open the Companies list, **then** the "Create Company" button is visible and enabled. (FS COMP-FR-001 UI)
    - **Given** I complete all six wizard steps with valid data, **when** I confirm, **then** a company record is created in Draft status with an auto-generated company code (COMP-YYYY-NNNN) and a COMPANY_CREATED audit event is logged. (FS COMP-FR-004, COMP-FR-007, §8.1)
- **US-POPS-02** — As a Platform Operations Admin, I want the wizard to validate mandatory fields (legal name, primary jurisdiction, base currency, time zone, primary contact email), so that I do not create an incomplete tenant. (FS COMP-FR-002)
- **US-POPS-03** — As a Platform Operations Admin, I want to be warned of potential duplicate companies by legal-name and registration-number checks, so that I avoid creating duplicate tenants. (FS COMP-FR-005)
  - **Acceptance criteria:**
    - **Given** I enter a legal name that exactly matches an existing company, **when** I attempt to proceed, **then** the system displays a duplicate-warning modal listing potential matches and blocks creation until I resolve it. (FS COMP-FR-005; error COMP_001)
- **US-POPS-04** — As a Platform Operations Admin, I want to capture jurisdiction-appropriate registration identifiers (GSTN, EIN, CRN, or custom), so that the tenant's legal details are correctly recorded for its region. (FS COMP-FR-003)
- **US-POPS-05** — As a Platform Operations Admin, I want to save an incomplete company creation as a draft, so that I can resume onboarding once the customer supplies missing details. (FS COMP-FR-001 "Save as Draft")
- **US-POPS-06** — As a Platform Operations Admin, I want to record the initial company administrator during setup so that a welcome email and default admin account are created for the customer. (FS COMP-FR-004)

### Cross-tenant configuration & troubleshooting (BRD §6.2 / FS §3.1.2, §3.1.4)

- **US-POPS-07** — As a Platform Operations Admin, I want to view all companies with status, jurisdiction, and search filters, so that I can locate any tenant that needs support. (FS §5.1, §6.1.5)
- **US-POPS-08** — As a Platform Operations Admin, I want to open any company's detail view, so that I can inspect its configuration while assisting the customer. (FS §5.2; §7.1 "View All Companies")
- **US-POPS-09** — As a Platform Operations Admin, I want to edit a company's master data (basic info, contact, operational settings) to correct misconfiguration during a support case. (FS COMP-FR-008; §7.1 "Edit Any Company")
  - **Acceptance criteria:**
    - **Given** I edit an editable field on any company, **when** I save, **then** the change is recorded in version history with field, previous value, new value, my user identity, and timestamp, and a COMPANY_UPDATED audit event is written. (FS COMP-FR-009; §8.1)
    - **Given** I attempt to edit the company code or change base currency after the first transaction, **when** I save, **then** the system blocks the change because those fields are non-editable. (FS COMP-FR-008)
- **US-POPS-10** — As a Platform Operations Admin, I want to add jurisdictions to a company's operational configuration, so that I can fix multi-region setup for a customer expanding operations. (FS COMP-FR-008; BRD §6.4)
- **US-POPS-11** — As a Platform Operations Admin, I want to adjust company-level configuration (authentication methods available, localization formats, notification sender/template defaults, workflow defaults) within a tenant, so that I can resolve configuration tickets — while respecting that platform security-policy ownership stays with the Super/Security admins. (FS COMP-FR-014; boundary per BRD §5.2)
- **US-POPS-12** — As a Platform Operations Admin, I want every configuration change I make to be logged in the audit trail and applied prospectively only, so that my troubleshooting actions remain traceable and non-retroactive. (FS COMP-FR-016; BRD §6.29)
- **US-POPS-13** — As a Platform Operations Admin, I want to view a company's master-data version history, so that I can see what changed and when while diagnosing an issue. (FS COMP-FR-009; BRD §6.29.4)

### Company context switching (BRD §6.12 / FS §3.2.2)

- **US-POPS-14** — As a Platform Operations Admin, I want to switch context into any company from a header selector without logging out, so that I can assist any tenant in their own operational context. (FS PORT-FR-004; §7.1 "Switch to Any Company")
  - **Acceptance criteria:**
    - **Given** I select a target company, **when** the system authorizes the switch, **then** it loads that company's configuration, security policies, and permissions, issues a new JWT carrying the company claim, and refreshes the UI to that context. (FS PORT-FR-005; §6.2.2 flow)
    - **Given** any context switch occurs, **when** it completes, **then** a CONTEXT_SWITCHED audit event records the from-company and to-company. (FS §8.1; BRD §6.12.6)
- **US-POPS-15** — As a Platform Operations Admin, I want the active company name (and logo) to be prominently displayed after switching, so that I never act in the wrong tenant while supporting a customer. (FS PORT-FR-007)
- **US-POPS-16** — As a Platform Operations Admin, I want bookmarkable company-context URLs to switch me into the right tenant automatically, so that I can jump straight to the company referenced in a support ticket. (FS PORT-FR-006)

### Logs & audit trail review (BRD §6.29 / FS §8)

- **US-POPS-17** — As a Platform Operations Admin, I want to view audit trails for company and configuration events across tenants, so that I can troubleshoot and explain what happened during an incident. (BRD §5.2; §6.29.1)
  - **Acceptance criteria:**
    - **Given** I open the audit view for a company, **when** I filter by event type and date range, **then** I see entity, record id, field, previous/new value, timestamp, and actor for each matching event. (BRD §6.29.2)
- **US-POPS-18** — As a Platform Operations Admin, I want to view record-level change history for a specific company or employee record, so that I can answer "who changed this and when" during support. (BRD §6.29.4)
- **US-POPS-19** — As a Platform Operations Admin, I want to review authentication and access logs, so that I can diagnose login and context-switch failures reported by customers. (BRD §6.1.6; FS §7.2 "all cross-company access logged")
- **US-POPS-20** — As a Platform Operations Admin, I want audit logs to be tamper-resistant and to record my own support actions, so that my assistance activity is fully accountable. (BRD §6.29.5; FS §8.1)

### Data import / migration assistance (BRD §6.24)

- **US-POPS-21** — As a Platform Operations Admin, I want to assist a customer's bulk data import only after the required approval, so that migrations stay governed and authorized. (BRD §5.2 "assist with data imports under approval"; §6.24)
  - **Acceptance criteria:**
    - **Given** an import has not received the required approval, **when** I attempt to run it against a tenant, **then** the system prevents execution until approval is recorded. (BRD §5.2)
- **US-POPS-22** — As a Platform Operations Admin, I want to run imports through the sandbox/staging validation mode first, so that errors are caught before data touches the live tenant. (BRD §6.24.4)
  - **Acceptance criteria:**
    - **Given** I submit an import file in sandbox mode, **when** validation completes, **then** I receive a record-level success/failure report identifying each failing row and reason. (BRD §6.24.4)
- **US-POPS-23** — As a Platform Operations Admin, I want imports to follow the correct dependency sequence (Foundation → Organizational → Workforce → Transactional masters), so that referential integrity is preserved during migration. (BRD §6.24.3)
- **US-POPS-24** — As a Platform Operations Admin, I want a failed import to roll back atomically, so that a partial migration does not corrupt the tenant's data. (BRD §6.24.5)
- **US-POPS-25** — As a Platform Operations Admin, I want real-time import status (Submitted, Validating, In-progress, Completed, Failed, Partially completed), so that I can keep the customer informed during a migration. (BRD §6.24.6)

### Operational visibility & support reporting (BRD §6.23)

- **US-POPS-26** — As a Platform Operations Admin, I want to view operational reports filtered to the company I am assisting, so that I can verify a tenant's data and configuration during a support case while respecting tenant boundaries. (BRD §6.23.6; FS §7.2)
- **US-POPS-27** — As a Platform Operations Admin, I want clear "permission denied" feedback when I attempt an action reserved to the Super Administrator (suspend, delete, portfolio/group management), so that I understand the action is out of my scope and can escalate. (FS §7.1; errors AUTH_001/AUTH_002)
  - **Acceptance criteria:**
    - **Given** I open a company in Active status, **when** I view the available actions, **then** Suspend/Activate and Delete controls are hidden or disabled for my role. (FS §7.1; COMP-FR-010)
    - **Given** I attempt a lifecycle status change via API, **when** the request is processed, **then** it is rejected with an authorization error and the attempt is audited. (FS §7.2; §8.1)

## Primary journeys

1. **Onboard a new tenant.** A new customer signs up → I open the Companies list and launch the 6-step creation wizard → I enter legal/contact/operational details, capture the right registration identifier, resolve any duplicate warning, and record the initial company admin → I confirm; the company is created in Draft with a generated code, a welcome email goes to the admin, and the creation is audited → the customer's Company HR Admin finishes the fit-out.

2. **Resolve a cross-tenant configuration ticket.** A customer reports a misconfiguration → I locate the company in the all-companies list and open its detail → I switch context into the tenant to reproduce the issue → I correct the master-data or company-configuration field → the change is version-logged and audited; I confirm the fix with the customer and exit the context.

3. **Diagnose an incident from the audit trail.** A dispute or anomaly is raised → I open the company's audit and record-level history → I filter by event type and date range to find who changed what and when → I review authentication/access logs for related login or context-switch failures → I summarize findings for the customer or escalate to the Platform Super Administrator if a lifecycle/security action is required.

4. **Assist an approved data migration.** A customer requests a bulk import → I confirm the required approval is in place → I run the file in sandbox mode and share the record-level error report → the customer fixes the source data → I re-run in the correct dependency sequence, monitor real-time status, and confirm completion (or trigger a clean rollback on failure).

## Notes & Phase 2

- **Cross-cutting dependencies:**
  - **Tenant isolation & RBAC** — all access is company-scoped; cross-company reach exists only through the role's platform-tier grants, and every cross-company access (successful or failed) is logged. (FS §7.2)
  - **Audit & logging** — context switches, company edits, configuration changes, and import actions all emit immutable audit events; this role is a heavy consumer of audit data and is itself fully audited. (FS §8.1; BRD §6.29)
  - **Workflow engine** — lifecycle status transitions (suspend/inactivate) run through approval workflows owned by the Platform Super Administrator; this role can prepare/escalate but not approve. (FS COMP-FR-010; BRD §6.25)
  - **Notifications** — onboarding welcome emails, import status, and escalation alerts depend on the notifications service. (BRD §6.27; FS COMP-FR-004)
  - **Import/export engine** — sandbox validation, sequencing, and rollback are provided by the Data Management module. (BRD §6.24)
- **Explicit non-scope (reserved to other platform roles, not deferrals):** company suspend/inactivate/delete and portfolio/group creation belong to the Platform Super Administrator; security-policy and password-rule ownership belongs to the Platform Security & Compliance Admin; defining the jurisdictions catalog, SSO providers, and global groups belongs to the Platform Super Administrator. (BRD §5.2; FS §7.1)
- **Phase 2 deferrals (clearly marked):**
  - Company replication/cloning, advanced commercial billing, and company merger workflows are out of scope for Phase 1 and may broaden onboarding-support capabilities later. (FS §2.2 — Phase II)
  - Contractor/vendor tenant onboarding support is deferred; Phase 1 onboarding covers employee-based companies only. (BRD §3.2; Phase II BRD §1)
  - India statutory-compliance enablement and payroll are Phase 2; any compliance-related import/troubleshooting support for those modules is out of scope until then. (BRD §3.2; Phase II BRD §2–§3)
  - Mobile-app-based operational support is Phase 2 (Phase 1 is responsive web only). (BRD §3.2; §6.16.1)
