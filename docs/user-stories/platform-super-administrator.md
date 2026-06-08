# Platform Super Administrator — User Stories

> The SatelliteHR provider — the "landlord" of the multi-tenant building. The Platform Super Administrator has platform-wide authority across all tenants but works at the level of **provisioning and governance** (creating companies, configuring identity/SSO, governing audit, residency, retention and DR), not a tenant's day-to-day HR data. They care most about keeping the platform healthy and secure, onboarding new customer companies quickly, and proving that tenant isolation and compliance controls hold.

## Scope & access

- **Authority level:** Platform-wide (cross-tenant), spanning the top of the hierarchy `Platform > Portfolio > Group Company > Company`. This file covers the three platform roles (BRD §5.2): **Platform Super Administrator**, **Platform Operations Admin**, and **Platform Security & Compliance Admin** — with capability differences called out per story.
- **Can do (Platform Super Admin):** create/provision/configure companies (FS UC-COMP-001/002/004); suspend, activate, inactivate and archive companies (FS UC-COMP-003); create portfolios and assign Portfolio Managers (FS UC-PORT-001); maintain the jurisdictions catalog (BRD §6.4); define global groups (BRD §6.6); configure platform-wide authentication / SSO providers (BRD §6.1); manage platform-level RBAC roles, MFA and password policy defaults (BRD §6.12); perform audited "login as user" impersonation (BRD §6.12); switch to any company context (FS §7.1); view all companies and platform health/logs (BRD §5.2).
- **Can do (Platform Operations Admin):** create and configure companies, view all companies, edit any company, switch to any company, assist with data imports under approval, view logs/audit and troubleshoot configuration (BRD §5.2; FS §7.1). **Cannot** suspend/activate/delete companies, create portfolios/groups (FS §7.1).
- **Can do (Platform Security & Compliance Admin):** view audit logs across tenants at **metadata level only**, manage security policies / password rules, support compliance inquiries (BRD §5.2). **No transactional data modification.**
- **Cannot (all platform roles):** edit a tenant's transactional HR records (employees, leave, attendance, lifecycle) directly — only via **audited impersonation**, never by silent backdoor; bypass tenant isolation — every cross-tenant view respects row/tenant boundaries and is logged (FS §7.2); act as a lower-tenant role with hidden admin powers — User ≠ Employee ≠ Contractor and platform admins do not "become" a company HR admin except through logged "login as"; the Security & Compliance Admin specifically cannot see or change transactional tenant data, only audit metadata.

## User stories

### Company provisioning & lifecycle (BRD §6.2, FS UC-COMP-001..004)

- **US-PA-01** — As a Platform Super Administrator, I want to create and provision a new tenant company through a guided 6-step wizard (basic info, legal details, contact, operational config, initial admin, review), so that I can onboard a customer quickly and consistently. (FS UC-COMP-001 / COMP-FR-001)
  - **Acceptance criteria:**
    - Given I am authenticated with a Platform Super Administrator or Platform Operations Admin role, when I open Company Management, then the "Create Company" button is visible to me (and hidden from all other roles).
    - Given I am on any wizard step, when I complete it, then the step indicator advances (1–6) and I can "Save as Draft" without losing entered data.
    - Given I submit valid data, when the company is created, then a unique CompanyCode `COMP-{YYYY}-{NNNN}` is generated, the company status is `Draft`, and a `COMPANY_CREATED` audit event is written.
- **US-PA-02** — As a Platform Admin, I want the system to validate mandatory fields (legal name unique across platform, primary jurisdiction, base currency, time zone, primary contact email) on company creation, so that no tenant is provisioned with incomplete or conflicting identity. (FS COMP-FR-002)
- **US-PA-03** — As a Platform Admin, I want the system to detect potential duplicate companies by legal-name exact match and registration-identifier uniqueness within jurisdiction, so that I do not create two tenants for the same legal entity. (FS COMP-FR-005)
  - **Acceptance criteria:**
    - Given a legal name that exactly matches an existing company, when I attempt to create it, then the system raises error `COMP_001` (409 Conflict) and blocks creation.
    - Given a duplicate registration number within the same jurisdiction, when I submit, then error `COMP_006` is raised.
    - Given a near-match, when I proceed, then a duplicate-warning modal lists potential matches before I confirm.
- **US-PA-04** — As a Platform Admin, I want company provisioning to automatically initialize the tenant (tenant data partition/schema, default security policies, default company administrator user if an email is supplied, welcome email, audit entry), so that the customer's Company HR Admin can start fit-out immediately. (FS COMP-FR-004)
  - **Acceptance criteria:**
    - Given a company is created with an initial admin email, when provisioning completes, then a default Company Administrator user account is created and a welcome email with a setup URL is sent.
    - Given provisioning runs, when it finishes, then default security policies are applied and the creation event is recorded in the audit trail.
- **US-PA-05** — As a Platform Admin, I want to manage company master data (basic, legal, contact, operational, branding, commercial) with field-level edit constraints (legal name editable with audit, company code non-editable, base currency locked after first transaction, jurisdiction addable but not removable when employees are assigned), so that core identity stays consistent and auditable. (FS UC-COMP-002 / COMP-FR-006, COMP-FR-008)
- **US-PA-06** — As a Platform Admin, I want company master-data changes to keep a version history (field, previous value, new value, changed by, timestamp, optional reason), so that I can answer "who changed what and when" for any tenant record. (FS COMP-FR-009)
- **US-PA-07** — As a Platform Super Administrator, I want to suspend an active company (for non-payment or violation) with mandatory reason and approval, so that I can enforce commercial and policy terms while preserving data. (FS UC-COMP-003 / COMP-FR-010, COMP-FR-011)
  - **Acceptance criteria:**
    - Given I suspend a company, when the transition is applied, then new logins are blocked except for Platform Administrators, existing sessions get a 30-minute read-only grace period, and background jobs are queued for completion.
    - Given suspension, when it completes, then company administrators are notified and a `COMPANY_STATUS_CHANGED` audit event records old status, new status and reason.
    - Given I hold only the Platform Operations Admin role, when I attempt to suspend, then the action is denied (suspend/activate is Super Admin only).
- **US-PA-08** — As a Platform Super Administrator, I want to reactivate a suspended company, so that a customer can resume operations once the issue (e.g., payment) is resolved. (FS COMP-FR-010)
- **US-PA-09** — As a Platform Super Administrator, I want to inactivate (close) a company with confirmation, so that on customer exit the tenant is cleanly shut down while retaining data per policy. (FS UC-COMP-003 / COMP-FR-012; BRD §6.2.6)
  - **Acceptance criteria:**
    - Given I inactivate a company, when it completes, then all user accounts are disabled, pending workflows are completed or cancelled with audit, and a 7-year retention timer starts.
    - Given inactivation, when it completes, then a company data export package is generated and confirmation is sent to company administrators and Platform Operations.
- **US-PA-10** — As a Platform Super Administrator, I want to archive an inactive company after the 7-year retention period (full data export in JSON/CSV, audit-log export, document export, integrity checksum, secure deletion after confirmation), so that we meet retention obligations and reclaim storage safely. (FS COMP-FR-013; BRD §8.7)
  - **Acceptance criteria:**
    - Given a company has reached the end of its retention period, when archival runs, then a complete export with a verification checksum is produced before any data is deleted.
    - Given archival is confirmed, when deletion runs, then the company status becomes `Archived` (terminal) and the action is logged.
- **US-PA-11** — As a customer leaving the platform, served by a Platform Admin, I want full company-data export on exit, so that the customer keeps their records and our retention/handover obligations are met. (BRD §6.2.6; FS COMP-FR-013)
- **US-PA-12** — As a Platform Admin, I want a Company list/detail view with filters (status, jurisdiction, search) and status color indicators, so that I can monitor the whole tenant estate at a glance. (FS §5.1, §5.2)
- **US-PA-13** — As a Platform Admin, I want all status transitions to follow the allowed state machine (`Draft→Active→Suspended/Inactive→Archived`) with approval where required, so that no tenant can reach an invalid lifecycle state. (FS COMP-FR-010)
- **US-PA-41** — As a Platform Super Administrator, I want to apply and track archival fees for a closed company's data retained for the 7-year window, so that ongoing archival storage is billed per the commercial policy and the customer is charged for the hold. (BRD §6.2.6)
  - **Acceptance criteria:**
    - Given a company is inactivated and its 7-year retention timer starts, when archival billing is configured, then an archival-fee schedule (rate and billing cadence) is attached to the retained tenant and recorded.
    - Given the retention period is active, when a billing cycle elapses, then an archival-fee charge is generated and tracked against the closed company with a billing audit entry.
    - Given the 7-year retention window ends (or fees lapse per policy), when the archival hold is released, then fee accrual stops and the event is logged.

### Commercial packaging & subscription (BRD §6.2.5)

- **US-PA-42** — As a Platform Super Administrator, I want to configure a company's commercial subscription — subscription tier, employee limit, company-count entitlement, and the set of subscribed modules — as a first-class commercial record (not buried in master-data edit), so that each tenant's commercial entitlements are explicitly recorded and enforceable. (BRD §6.2.5)
  - **Acceptance criteria:**
    - Given I open a company's commercial configuration, when I set its subscription tier, employee limit, and subscribed modules, then the values are saved against the company and a configuration-change audit event is written.
    - Given a subscription is changed, when it is applied, then the new entitlements take effect for subsequent operations only (no retroactive effect, consistent with US-PA-16) and the previous values are preserved in version history.
    - Given I hold only the Platform Security & Compliance Admin role, when I attempt to edit commercial subscription, then the action is denied (no transactional/commercial modification by the compliance role).
- **US-PA-43** — As a Platform Super Administrator, I want a company's accessible modules to be governed by its module subscription, so that a tenant can only use the modules it has purchased and unsubscribed modules are not available to that tenant. (BRD §6.2.5)
- **US-PA-44** — As a Platform Super Administrator, I want the system to enforce the subscribed employee limit (and company-count entitlement) when records are added, so that tenant usage stays within the commercial agreement. (BRD §6.2.5)
  - **Acceptance criteria:**
    - Given a company is at its subscribed employee limit, when an additional employee record is provisioned for that tenant, then creation is blocked (or flagged per policy) with a clear limit-exceeded message.
    - Given a portfolio/group is at its company-count entitlement, when an additional company is provisioned under it, then the limit is enforced and the attempt is recorded.
    - Given a limit is approached, when usage crosses a configured threshold, then the tenant's administrators (and Platform Operations) are notified.

### Company configuration & defaults (BRD §6.2, FS UC-COMP-004)

- **US-PA-14** — As a Platform Admin, I want to configure company-level settings (allowed auth methods, MFA requirement, password policy, session timeout, localization, notification sender, default approval hierarchies and SLAs), so that each tenant starts from secure, sensible defaults it can later override. (FS UC-COMP-004 / COMP-FR-014)
- **US-PA-15** — As a Platform Admin, I want configuration inheritance from platform defaults down to company settings (overridable), so that I set a baseline once and tenants only change what they care about. (FS COMP-FR-015)
- **US-PA-16** — As a Platform Admin, I want every configuration change logged and applied to new transactions only (no retroactive effect in Phase 1), so that changes are auditable and never silently rewrite past records. (FS COMP-FR-016)

### Portfolio creation (BRD §6.3, FS UC-PORT-001)

- **US-PA-17** — As a Platform Super Administrator, I want to create a portfolio (name, description, Portfolio Manager assignment, associated active companies), so that a shared-services team can administer multiple companies from one login. (FS UC-PORT-001 / PORT-FR-001)
  - **Acceptance criteria:**
    - Given I create a portfolio, when I assign a manager, then the system enforces that the user already holds the Portfolio Manager role.
    - Given I add companies, when a company already belongs to another portfolio, then error `PORT_002` is raised and it is not added (a company belongs to at most one portfolio).
    - Given creation succeeds, when it completes, then a `PORT-{YYYY}-{NNN}` code is generated and a `PORTFOLIO_CREATED` audit event is written.
- **US-PA-18** — As a Platform Super Administrator, I want to modify a portfolio (add/remove companies with confirmation, change manager, update description), so that I can keep portfolio composition correct as customer relationships change. (FS PORT-FR-003)
- **US-PA-19** — As a Platform Super Administrator, I want the system to reject a portfolio name that already exists, so that portfolio identity stays unique platform-wide. (FS PORT-FR-001; error `PORT_001`)

### Group-company structure (BRD §6.3)

- **US-PA-45** — As a Platform Super Administrator, I want to create a group-company structure (define the group, link the related/affiliated companies, and assign a Group Company Administrator), so that affiliated companies — subsidiaries, sister concerns, or affiliated entities — can be governed as a group while the GCA later administers it. (BRD §6.3.1)
  - **Acceptance criteria:**
    - Given I create a group-company structure, when I link related companies, then the group construct is established and each linked company's membership is recorded with an audit event (create-group is Platform Super Administrator only).
    - Given I assign a Group Company Administrator, when the assignment is saved, then that user is granted group-level governance authority over the linked companies and tenant isolation between non-linked companies remains enforced.
    - Given I hold only the Platform Operations Admin role, when I attempt to create a group, then the action is denied (group creation, like portfolio creation, is Super Admin only).

### Jurisdictions catalog (BRD §6.4)

- **US-PA-20** — As a Platform Super Administrator, I want to maintain the catalog of supported jurisdictions (countries, states, cities, operational regions) as catalog entries rather than a rigid geography tree, so that companies can select where they operate and policies can target jurisdictions. (BRD §6.4)
  - **Acceptance criteria:**
    - Given I add a jurisdiction to the catalog, when it is saved, then it becomes selectable during company creation and as a policy applicability criterion.
    - Given a jurisdiction is in use by a company, when I attempt a change that would invalidate that usage, then the system warns and preserves referential integrity.
- **US-PA-21** — As a Platform Super Administrator, I want jurisdictions to carry tax/fee applicability where configured, so that downstream policy and compliance enablement can reference them. (BRD §6.4)

### Global groups (BRD §6.6)

- **US-PA-22** — As a Platform Super Administrator, I want to define **global groups** (available across all companies) with hierarchical n-level parent-child nesting, so that platform-wide grouping is available for policy eligibility, access, and reporting. (BRD §6.6)
  - **Acceptance criteria:**
    - Given I create a global group, when it is saved, then it is available to all companies as a policy-applicability criterion (distinct from company-specific groups owned by tenants).
    - Given I nest groups, when I save, then the system supports n-level hierarchy without breaking parent-child integrity.

### Authentication & SSO provider configuration (BRD §6.1)

- **US-PA-23** — As a Platform Super Administrator, I want to enable and configure platform authentication methods and identity integrations (SAML, Active Directory, Office 365, Google Apps, Email/Password), so that customer companies can adopt the sign-in methods they need. (BRD §6.1; §4.1)
  - **Acceptance criteria:**
    - Given I enable an SSO provider at platform level, when a company is configured, then that company can select the enabled provider(s) for its users.
    - Given a user belongs to multiple companies, when they authenticate, then the User identity remains distinct from any Employee record (User ≠ Employee).
- **US-PA-24** — As a Platform Super Administrator, I want the platform to maintain authentication audit logs and secure password management for local-login users, so that sign-in activity is traceable and credentials are handled securely. (BRD §6.1)
- **US-PA-25** — As a Platform Admin, I want multi-company users to switch company context within one authenticated session (limited to authorized companies), so that the multi-tenant operating model works without repeated logins. (BRD §6.1; FS UC-PORT-002)

### Platform roles, security & impersonation (BRD §6.12)

- **US-PA-26** — As a Platform Super Administrator, I want to manage RBAC roles and permission sets at the platform level, so that platform staff get exactly the authority their role requires and no more (roles = personas, permissions = composable capabilities). (BRD §6.12; §5.1)
- **US-PA-27** — As a Platform Super Administrator, I want to set platform-default security controls — MFA configurability and password rules — that tenants inherit, so that a strong baseline applies everywhere before any tenant overrides. (BRD §6.12; FS COMP-FR-014)
- **US-PA-28** — As an authorized Platform support user, I want to "log in as" a tenant user (impersonation) with full audit logging, so that I can reproduce and resolve support issues without asking for the customer's password. (BRD §6.12)
  - **Acceptance criteria:**
    - Given I start an impersonation session, when I act, then every action is attributed to me as the impersonating actor and recorded in a tamper-resistant audit trail.
    - Given impersonation, when I edit tenant transactional data, then it is permitted only through this audited path — never via a silent backdoor — and tenant isolation for all other tenants remains enforced.
    - Given the session ends, when I exit, then the impersonation start/stop is logged with timestamps.
- **US-PA-29** — As a Platform Super Administrator, I want to switch into any company's context for provisioning and support, so that I can validate setup or assist a tenant, with each switch written to the audit trail. (FS §7.1; UC-PORT-002)
  - **Acceptance criteria:**
    - Given I switch company context, when the switch succeeds, then a new token with the target company claim is issued and a `CONTEXT_SWITCHED` audit event (from company → to company) is recorded.
    - Given an unauthorized target, when I attempt to switch, then error `AUTH_002` is returned.

### Audit & logging (cross-tenant, metadata-level) (BRD §6.29)

- **US-PA-30** — As a Platform Security & Compliance Admin, I want to view audit logs across tenants at **metadata level only** (entity type, record id, field, previous/new value visibility per policy, timestamp, actor, action type), so that I can support compliance and security inquiries without accessing tenant transactional content. (BRD §5.2, §6.29)
  - **Acceptance criteria:**
    - Given I hold the Security & Compliance Admin role, when I open cross-tenant audit, then I see audit metadata but cannot modify any transactional tenant data.
    - Given I query audit, when results return, then access is role-based, tenant boundaries are enforced in the record, and the logs themselves are tamper-resistant.
- **US-PA-31** — As a Platform Admin, I want audit trails on the mandatory entities (Company, Employee) for all create/update/delete/status-change actions, so that the platform meets compliance-grade auditability. (BRD §6.29)
- **US-PA-32** — As a Platform Admin, I want all cross-company access attempts (successful or failed) and all portfolio-level operations to be logged, so that any breach of isolation is detectable after the fact. (FS §7.2; FS PORT-FR-010)
- **US-PA-33** — As a Platform Admin, I want audit retention enforced (1 year active + 6 years archived = 7 years total), so that we satisfy regulatory retention without unbounded growth. (BRD §6.29.3; §8.7.1)

### Tenant isolation & data governance (FS §7.2; BRD §8.4–8.7)

- **US-PA-34** — As a Platform Admin, I want tenant isolation enforced on every query (company_id filter bound to the user's current context; JWT carries the company claim and API requests validate the match), so that no tenant ever sees another's data except through explicit, logged portfolio/group access. (FS §7.2)
  - **Acceptance criteria:**
    - Given any data request, when it executes, then it is scoped to the authorized company context and a mismatch returns `AUTH_001` (unauthorized company access).
    - Given cross-company access, when it is permitted, then it exists only via an explicit portfolio or group-company assignment and is logged.
- **US-PA-35** — As a Platform Super Administrator, I want data residency honored (customer data resides in India unless contractually agreed otherwise), so that we meet residency and DPDP/GDPR obligations for target customers. (BRD §8.5; §8.6.1)
- **US-PA-36** — As a Platform Admin, I want platform retention and deletion governance enforced (per-data-type retention, terminated-user account disabled immediately, anonymization after 30 days, automated monthly purge with legal-hold suspension), so that the platform stays compliant with the data-governance policy. (BRD §8.7)
- **US-PA-37** — As a Platform Super Administrator, I want disaster-recovery and backup targets governed at platform level (RTO 4h critical / 8h standard, RPO 15m critical / 1h standard, the backup schedule, and DR test cadence), so that availability commitments are demonstrably met. (BRD §8.3–8.4)
- **US-PA-38** — As a Platform Admin, I want to support Data Subject Rights requests (access export within 30 days, rectification, erasure/anonymization with statutory exceptions), so that the platform upholds DPDP/GDPR data-subject obligations across tenants. (BRD §8.7.3)

### Platform notifications & configuration (BRD §6.27)

- **US-PA-39** — As a Platform Admin, I want to configure platform-level notification defaults and templates (email mandatory; in-app optional), so that lifecycle and approval events (e.g., provisioning welcome, suspension notice) reach the right recipients with consistent branding. (BRD §6.27; FS COMP-FR-004, COMP-FR-011)
- **US-PA-40** — As a Platform Admin, I want platform-level custom fields available across all companies (alongside company-level fields) for supported entities, so that platform-wide attributes can be standardized without per-tenant rebuilds. (BRD §6.26)
- **US-PA-46** — As a Platform Super Administrator, I want to configure and enable the optional Microsoft Teams and WhatsApp third-party notification connectors (credentials, endpoint, and per-company opt-in), so that companies can opt into additional delivery channels beyond the mandatory email channel. (BRD §6.27.1)

## Primary journeys

1. **Provision a new customer company (end-to-end onboarding).**
   1. Receive a new-customer onboarding request.
   2. Open Company Management and launch the 6-step Create Company wizard (US-PA-01).
   3. Enter and validate mandatory identity; resolve any duplicate warnings (US-PA-02, US-PA-03).
   4. Set operational config — select jurisdictions from the catalog, base currency, time zone — and configure allowed auth methods / MFA defaults (US-PA-14, US-PA-20, US-PA-23).
   5. Assign the initial company administrator; review and confirm.
   6. System auto-initializes the tenant, applies default security policies, sends the welcome email, and logs creation (US-PA-04). Company is `Draft` → becomes `Active` on setup completion (US-PA-13).
   7. (Optional) Add the company to a portfolio if managed by a shared-services team (US-PA-17).

2. **Suspend then offboard a departing company.**
   1. Suspend the active company with a mandatory reason (e.g., non-payment), triggering login block, read-only grace period, and admin notification (US-PA-07).
   2. If resolved, reactivate (US-PA-08); otherwise proceed to closure.
   3. Inactivate the company with confirmation — disable users, finish/cancel pending workflows, start the retention timer, generate the export package (US-PA-09, US-PA-11).
   4. After the 7-year retention window, archive with full export + checksum and secure deletion (US-PA-10).

3. **Investigate a support or compliance issue without breaking isolation.**
   1. Security & Compliance Admin reviews cross-tenant audit metadata to locate the event (US-PA-30, US-PA-31).
   2. If hands-on reproduction is needed, an authorized support user starts an audited "login as user" session in the affected tenant (US-PA-28).
   3. Any necessary correction is made only through the impersonation path; the session start/stop and all actions are logged (US-PA-28).
   4. Confirm tenant isolation held for all other tenants and that cross-company access attempts are recorded (US-PA-32, US-PA-34).

4. **Stand up a shared-services portfolio.**
   1. Confirm the target user holds the Portfolio Manager role.
   2. Create the portfolio with name, description, manager, and member companies (US-PA-17).
   3. System enforces "one portfolio per company" and generates the portfolio code (US-PA-17, US-PA-19).
   4. Adjust membership over time as customer relationships change (US-PA-18).

## Notes & Phase 2

- **Phase 2 (out of scope for this role now, mark clearly):**
  - **Company replication / cloning** — provisioning a new company by wholesale-copying an existing one is Phase 2 (FS §2.2). In Phase 1 the provisioning shortcut is **templates + bulk import**, not full clone (Roadmap §5).
  - **Advanced commercial billing** and **company merger workflows** — Phase 2 (FS §2.2). Phase 1 captures commercial attributes (tier, employee limit, module subscription) as configuration only.
  - **India statutory compliance enablement, payroll, vendors/contractors, and the mobile app** — Phase 2 (BRD §3.2). Note: even Phase 1 reporting ships PF/ESIC eligibility and statutory register **templates**, but full compliance governance is Phase 2.
  - **White-label / branding customization** — future (FS §2.2).
- **Cross-cutting dependencies for this role:**
  - **Workflow engine** (BRD §6.25) — lifecycle status transitions (suspend/inactivate approvals) and provisioning steps rely on it; it must be a run-time-configurable, data-driven engine (Roadmap Gap 3a), not back-end plumbing.
  - **Notifications** (BRD §6.27) — welcome, suspension, inactivation, and escalation messages; email mandatory.
  - **Audit & logging** (BRD §6.29; FS §8) — every provisioning, lifecycle, context-switch, impersonation, and cross-tenant access action must be recorded; the Security & Compliance Admin sees metadata only.
  - **RBAC** (BRD §6.12; FS §7.1) — the three platform roles have distinct permission sets; never grant a lower role hidden admin powers, and keep User ≠ Employee ≠ Contractor.
  - **Tenant isolation** (FS §7.2; BRD §4.5) — the non-negotiable invariant; enforced on every query and JWT claim, with cross-company access only via explicit portfolio/group constructs.
  - **Open architecture decision (Roadmap Gap 1a / D2):** the FunctionalSpec gives two isolation models (per-tenant schema in COMP-FR-004 vs shared store with company_id filter in §7.2). This must be ratified before provisioning logic is built; it directly affects US-PA-04 and US-PA-34.
