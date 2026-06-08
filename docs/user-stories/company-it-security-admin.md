# Company IT / Security Admin — User Stories

> The Company IT / Security Admin owns identity, access, and security for a single tenant company. Their authority is the human side of the login keycard and the locks behind it: who has a user account, which authentication methods are allowed, what role each user holds, how strong the password and MFA rules are, and who reviewed the access logs. They care about least-privilege access, clean SSO, and a defensible audit trail — not about HR operations or business data (BRD §5.5).

## Scope & access

- **Authority level:** Company (single tenant) only. The admin operates within one company at a time and may act in another company only if separately granted a role there and after an explicit, audited context switch (BRD §6.1.4, §6.12.6, FS §7.2).
- **What they CAN do:**
  - Provision, view, suspend, and disable **user** accounts (the login identity, distinct from Employee records) within the company (BRD §6.1.2, §5.10).
  - Assign and revoke **roles** to users within the company, mapping personas to composable permission sets (BRD §6.12.1–.2, §5.1).
  - Configure which **authentication methods** the company allows — SAML, Active Directory, Office 365, Google Apps, and local Email/Password (BRD §6.1.1, FS §3.1.4 COMP-FR-014 / Authentication).
  - Configure company-scoped **security settings**: MFA requirement, password policy, and session timeout (BRD §6.12.5, FS §3.1.4 COMP-FR-014 / Security).
  - Configure and govern **delegation** and **audited "login as" impersonation** for support users at the company (BRD §6.12.3–.4).
  - Perform **access audits**: review authentication logs, role-assignment history, and cross-company access/context-switch events for the company (BRD §6.29, §6.12.6, FS §8.1).
- **Explicit BOUNDARIES (what they CANNOT do):**
  - **No HR operations.** Cannot create/edit Employee master records, run lifecycle workflows, administer leave/attendance, or process onboarding/exits (that is the Company HR Administrator — BRD §5.5).
  - **No business-data edits.** Cannot edit policies, organizational structures (departments, positions, groups, locations), jurisdictions, or company master/commercial data (that is the Company Super Administrator — BRD §5.5; FS §7.1 shows company-level edit limited to the Super Admin's own company, not delegated to a security admin).
  - **No tenant lifecycle authority.** Cannot create, suspend, archive, or provision companies; cannot create portfolios or group-company structures (Platform / Group roles — FS §7.1).
  - **No cross-tenant reach.** Confined to the company they administer; cannot view other tenants' data or grant access spanning companies they are not authorized in (BRD §7.15, FS §7.2).
  - **User ≠ Employee.** Provisioning a user account never creates or modifies an Employee record, and vice versa; the two are linked only where system access is required (BRD §6.1.5, §6.9.2).
  - Cannot raise their own privileges or grant a role broader than those defined for the company; impersonation and delegation are bounded and fully logged (BRD §6.12.4).

## User stories

### Identity & User Account Management (BRD §6.1)

- **US-CIT-01** — As a Company IT / Security Admin, I want to provision a new user (login) account for the company, so that a person who needs system access can authenticate. (BRD §6.1.2)
  - **Acceptance criteria:**
    - **Given** I am authenticated with the IT / Security Admin role in a company, **when** I create a user account, **then** a `User` entity is created that is distinct from any Employee or Contractor record.
    - **Given** I create the user, **when** the account is saved, **then** the creation is written to the audit trail with actor, timestamp, and company context.
    - **Given** an account is needed for HR data, **when** I link the user to an existing employee record, **then** the link is recorded but no employee field is altered by me.
- **US-CIT-02** — As a Company IT / Security Admin, I want to view all user accounts in my company with their current status and linked employee (if any), so that I can manage the company's access surface. (BRD §6.1.3)
- **US-CIT-03** — As a Company IT / Security Admin, I want to suspend or disable a user account, so that I can immediately cut off access for departing or compromised users. (BRD §8.7.2)
  - **Acceptance criteria:**
    - **Given** an active user account, **when** I disable it, **then** the user can no longer authenticate to the company.
    - **Given** a disable action, **when** it completes, **then** an audit entry captures previous status, new status, actor, and timestamp.
    - **Given** disabling a user, **when** the account is linked to an employee record, **then** the employee record itself is left unchanged (access is removed, the workforce record is not).
- **US-CIT-04** — As a Company IT / Security Admin, I want to confirm a user can hold different roles in different companies without my action affecting other tenants, so that multi-company users remain correctly scoped. (BRD §5.1, §6.12.2)
- **US-CIT-05** — As a Company IT / Security Admin, I want to ensure a user account can exist without a linked employee and an employee can exist without a user, so that access and workforce records stay correctly decoupled. (BRD §6.1.5, §6.9.2)
- **US-CIT-06** — As a Company IT / Security Admin, I want authentication events (sign-in success/failure, lockout) recorded for company users, so that I have evidence for investigations. (BRD §6.1.6)

### Role & Permission Assignment (BRD §6.12)

- **US-CIT-07** — As a Company IT / Security Admin, I want to assign a role to a user within my company, so that the user receives exactly the permission set their persona needs. (BRD §6.12.1)
  - **Acceptance criteria:**
    - **Given** a user account in my company, **when** I assign a role, **then** the user gains the composable permissions mapped to that role for this company only.
    - **Given** a role assignment, **when** it is saved, **then** the change is recorded with previous and new role, actor, and timestamp.
    - **Given** the role catalog, **when** I attempt to assign a permission set broader than what the company defines, **then** the system prevents it.
- **US-CIT-08** — As a Company IT / Security Admin, I want to revoke or change a user's role, so that access reflects current responsibilities and least privilege. (BRD §6.12.1)
- **US-CIT-09** — As a Company IT / Security Admin, I want roles to remain distinct from permission sets so that the same permission set can back multiple roles, so that I assign personas, not raw capabilities. (BRD §5.1, §6.12.1)
- **US-CIT-10** — As a Company IT / Security Admin, I want access restrictions enforceable by company, group, department, and workforce type when I assign roles, so that visibility matches the security model. (BRD §6.12.2)
- **US-CIT-11** — As a Company IT / Security Admin, I want every role-assignment change kept in a viewable history, so that I can prove who granted whom what access and when. (BRD §6.12.1, §6.29.4)

### Authentication & SSO Configuration (BRD §6.1)

- **US-CIT-12** — As a Company IT / Security Admin, I want to select which authentication methods my company allows (SAML, Active Directory, Office 365, Google Apps, local), so that users sign in through approved channels only. (BRD §6.1.1, FS §3.1.4 COMP-FR-014)
  - **Acceptance criteria:**
    - **Given** the company authentication settings, **when** I enable or disable a method, **then** only enabled methods are offered at the company login.
    - **Given** I change allowed methods, **when** the change is saved, **then** it takes effect immediately for new sessions and is logged in the audit trail.
    - **Given** I disable local Email/Password, **when** an SSO method remains enabled, **then** existing local-only users are flagged rather than silently locked out.
- **US-CIT-13** — As a Company IT / Security Admin, I want to configure the company's SSO/identity-provider connection (e.g., SAML or AD/O365/Google), so that company users authenticate through corporate identity. (BRD §6.1.1)
- **US-CIT-14** — As a Company IT / Security Admin, I want to manage secure password handling for local-login users (resets, policy enforcement), so that local credentials stay protected. (BRD §6.1.6, §6.12.5)
- **US-CIT-15** — As a Company IT / Security Admin, I want company context switching for multi-company users to remain secure, explicit, and limited to authorized companies, so that no user reaches a company they are not granted. (BRD §6.1.4, §6.12.6)
  - **Acceptance criteria:**
    - **Given** a multi-company user, **when** they switch into my company, **then** my company's authentication and security policies apply to that session.
    - **Given** an unauthorized target, **when** a user attempts to switch into my company without a granted role, **then** the switch is denied (AUTH_002) and the attempt is logged.

### Company Security Policy (BRD §6.12, FS §3.1.4)

- **US-CIT-16** — As a Company IT / Security Admin, I want to require Multi-Factor Authentication at company level, so that all company logins meet a second-factor standard. (BRD §6.12.5, FS §3.1.4 COMP-FR-014)
  - **Acceptance criteria:**
    - **Given** company security settings, **when** I enable MFA requirement, **then** company users must complete MFA on subsequent authentications.
    - **Given** I change the MFA setting, **when** it is saved, **then** the change is audited and applies to new sessions only (no retroactive enforcement, per FS §3.1.4 COMP-FR-016).
- **US-CIT-17** — As a Company IT / Security Admin, I want to configure the company password policy (complexity, expiry, reuse), so that credentials meet the organization's security baseline. (BRD §6.12.5, FS §3.1.4 COMP-FR-014)
- **US-CIT-18** — As a Company IT / Security Admin, I want to set the company session timeout, so that idle sessions are terminated within an approved window. (FS §3.1.4 COMP-FR-014)
- **US-CIT-19** — As a Company IT / Security Admin, I want every security-configuration change logged and effective on new transactions only, so that changes are traceable and non-retroactive. (FS §3.1.4 COMP-FR-016)

### Delegation & Impersonation Governance (BRD §6.12)

- **US-CIT-20** — As a Company IT / Security Admin, I want to configure who may delegate activities to another user within the company, so that approvals can be reassigned safely within the hierarchy. (BRD §6.12.3)
- **US-CIT-21** — As a Company IT / Security Admin, I want to authorize and bound "login as user" (impersonation) for support, so that support access is controlled and never silent. (BRD §6.12.4)
  - **Acceptance criteria:**
    - **Given** impersonation is restricted to authorized support users, **when** an authorized user impersonates another, **then** the full session is captured in the audit log with both identities.
    - **Given** an unauthorized user, **when** they attempt impersonation, **then** the action is blocked and logged.
- **US-CIT-22** — As a Company IT / Security Admin, I want to review active and historical delegations and impersonation sessions, so that I can detect misuse. (BRD §6.12.3–.4, §6.29)

### Access Audits & Logging (BRD §6.29)

- **US-CIT-23** — As a Company IT / Security Admin, I want to view the chronological access and security change history for users and security settings, so that I can run access audits. (BRD §6.29.4, FS §8.1)
  - **Acceptance criteria:**
    - **Given** a user or security setting, **when** I open its history, **then** I see action type, previous value, new value, actor, and timestamp.
    - **Given** the audit logs, **when** I read them, **then** they are tamper-resistant and scoped to my company only.
- **US-CIT-24** — As a Company IT / Security Admin, I want to review cross-company access and context-switch events affecting my company, so that I can verify every cross-tenant access was authorized. (BRD §6.3.3, §6.12.6, FS §7.2, §8.1)
- **US-CIT-25** — As a Company IT / Security Admin, I want failed-authorization and failed-context-switch attempts surfaced, so that I can investigate potential access abuse. (FS §7.2, §9.1 AUTH_001/AUTH_002)
- **US-CIT-26** — As a Company IT / Security Admin, I want a periodic access-review report of users, their roles, and last sign-in, so that I can confirm least privilege and remove stale access. (BRD §6.23.6, §6.29)
- **US-CIT-27** — As a Company IT / Security Admin, I want audit logs retained per policy (active retention plus archival), so that access evidence is available for compliance and inspections. (BRD §6.29.3, §8.7.1)

## Primary journeys

1. **Onboard access for a new joiner.** HR creates the employee record; the IT / Security Admin provisions a `User` account, links it to the employee (only where system access is needed), assigns the appropriate company role, confirms MFA applies, and verifies the welcome/first-login path — every step landing in the audit trail. (US-CIT-01, US-CIT-07, US-CIT-16, US-CIT-05)

2. **Stand up company authentication.** The admin enables the company's approved sign-in methods, connects the corporate SSO identity provider (SAML/AD/O365/Google), sets the password policy and session timeout, turns on the MFA requirement, and confirms only enabled methods appear at login. (US-CIT-12, US-CIT-13, US-CIT-17, US-CIT-18, US-CIT-16)

3. **Quarterly access review.** The admin pulls the access-review report of users, roles, and last sign-in; revokes stale or over-broad roles; checks delegation and impersonation history; reviews cross-company switch events and failed-authorization attempts; and exports the audit evidence for the compliance record. (US-CIT-26, US-CIT-08, US-CIT-22, US-CIT-24, US-CIT-25, US-CIT-23)

4. **Offboard a departing user.** On notice of exit, the admin disables the user account to cut access immediately, leaving the employee record untouched for HR's exit processing, and confirms the disable and any session termination are recorded. (US-CIT-03, US-CIT-05)

## Notes & Phase 2

- **Phase 2 deferrals (not in this role's Phase 1 scope):**
  - Contractor and vendor login types (Contractor–Standard/Restricted, Vendor Administrator, Vendor User) and their access provisioning are **Phase 2** (Phase II BRD §6.2–6.3). In Phase 1 this role administers employee/admin users only.
  - Native **mobile** authentication and push-based MFA flows are **Phase 2** (BRD §3.2). Phase 1 is responsive web only.
  - Optional Microsoft Teams / WhatsApp notification connectors are out of Phase 1 mandatory scope; only email (mandatory) and optional in-app are guaranteed (BRD §6.27.1).
- **Cross-cutting dependencies:**
  - **RBAC engine** — role/permission assignment relies on the platform RBAC model (roles as personas, permissions as composable sets) defined per company (BRD §5.1, §6.12).
  - **Tenant isolation** — all actions are bound to the company context via the session/JWT company claim; cross-company access is permitted only through explicit authorization and is logged (FS §7.2). The platform's data-isolation model (schema-per-tenant vs. row-level security) is an open architecture decision (Explained doc Gap 1a / D2) that this role's access controls depend on.
  - **Audit & logging** — every identity, role, authentication-config, delegation, and impersonation action depends on tamper-resistant, company-scoped audit trails with retention (BRD §6.29, §8.7).
  - **Workflow engine & notifications** — security-relevant events (e.g., access changes, escalations) ride the shared workflow/notification backbone; this role configures security policy but does not own those engines (BRD §6.25, §6.27).
  - **User ≠ Employee ≠ Contractor invariant** — provisioning and de-provisioning users must never mutate workforce records; the link is optional and one-directional from access to record (BRD §7.1, §6.1.5).
