# System User — User Stories

> The System User is the generic authenticated **identity** that underpins every persona in SatelliteHR — a login keycard, not a workforce record. A User is pure *access*: it may belong to one or more companies, may be linked to an Employee in one company, several, or none, and may hold entirely different roles in each company. By itself the User grants no capabilities; every permission flows from roles assigned per company, and the user only ever sees companies they are explicitly authorized for (BRD §5.1, §5.10, §6.1, §7).

## Scope & access

- **Authority level: self / identity only.** The System User layer is about *being authenticated and routed to the right context*, not about acting. All operational authority (view/create/edit/approve/configure) comes from roles assigned to this user within a specific company — never from the User entity itself (BRD §5.1.1, §6.12.2).
- **Can:** authenticate via SAML, Active Directory, Office 365, Google Apps, or local email+password; manage own credentials (local users) and MFA; belong to one or more companies; switch company context within one session without re-logging-in; carry whichever roles each company has granted; be linked to an Employee record in zero, one, or many companies; delegate own pending activities to another user in the same company; receive notifications per own preferences.
- **Boundaries — the User itself confers NO capabilities.** Holding a User account does not grant the ability to view, create, edit, approve, or configure anything. Until a role is assigned in a company, an authenticated user can see no tenant business data.
- **Tenant isolation is absolute.** A user can only see and switch into companies they are explicitly authorized for; the company switcher lists only authorized companies, and any attempt to reach an unauthorized company is denied (AUTH_001 / AUTH_002) and audited (FS §3.2.2, §7.2).
- **User ≠ Employee ≠ Contractor.** A user account is distinct from any employee record. A user may exist with no employee link at all; an employee may exist with no user. Linking a user to an employee does not merge the records (BRD §6.1.2, §6.1.5, §7.1, §7.7).
- **Role assignment is contextual, not global.** The same user may be a Company Admin in one company and an ordinary Employee in another. Permissions are evaluated against the *current* company context only (BRD §5.1.2, §6.12.2).
- **Cannot:** assign roles or permissions to itself; grant itself access to additional companies; bypass company-level MFA or password policy; perform any transactional or configuration action without a role that permits it in the active company; impersonate other users (impersonation is a privilege of authorized support roles, with this user as the *target*).

## User stories

### Authentication & sign-in (BRD §6.1)

- **US-SYS-01** — As a system user, I want to sign in with my organization's SAML identity provider, so that I can access SatelliteHR using my existing corporate credentials. (BRD §6.1.1)
  - **Acceptance criteria:**
    - **Given** my company has SAML enabled as an allowed authentication method, **When** I initiate sign-in, **Then** I am redirected to my identity provider and returned authenticated on success.
    - **Given** SAML is not enabled for any company I belong to, **When** I attempt SAML sign-in, **Then** access is denied and the attempt is recorded in the authentication audit log.
- **US-SYS-02** — As a system user, I want to sign in via Active Directory, so that my on-premises corporate account works for SatelliteHR. (BRD §6.1.1)
- **US-SYS-03** — As a system user, I want to sign in with Office 365, so that I can use my Microsoft work account as my login. (BRD §6.1.1)
- **US-SYS-04** — As a system user, I want to sign in with my Google Apps account, so that I can use single sign-on with Google. (BRD §6.1.1)
- **US-SYS-05** — As a system user, I want to sign in with a local email and password, so that I can access the platform when no single sign-on provider is configured for me. (BRD §6.1.1)
  - **Acceptance criteria:**
    - **Given** I have a local account, **When** I submit a valid email and password, **Then** I am authenticated and a sign-in event is written to the authentication audit log.
    - **Given** I submit invalid credentials, **When** I attempt to sign in, **Then** access is denied and the failed attempt is logged.
- **US-SYS-06** — As a system user, I want my available authentication methods to be governed by my company's configuration, so that I can only use the sign-in methods my company permits. (FS §3.1.4 COMP-FR-014)
- **US-SYS-07** — As a system user, I want every authentication event (success and failure) to be recorded, so that my sign-in activity is traceable for security and compliance. (BRD §6.1.6, §6.29)

### Credentials, MFA & account security (BRD §6.1.6, §6.12.5)

- **US-SYS-08** — As a local-login system user, I want to manage my own password securely, so that I can keep my account credentials current and protected. (BRD §6.1.6)
  - **Acceptance criteria:**
    - **Given** I am a local-login user, **When** I change my password, **Then** the new password is validated against the active company's password policy before it is accepted.
    - **Given** my new password violates the policy, **When** I submit it, **Then** it is rejected with a clear reason and no change is stored.
- **US-SYS-09** — As a local-login system user, I want to reset a forgotten password through a secure self-service flow, so that I can regain access without contacting an administrator. (BRD §6.1.6)
- **US-SYS-10** — As a system user, I want to complete multi-factor authentication when my company requires it, so that my account has a second layer of protection. (BRD §6.12.5)
  - **Acceptance criteria:**
    - **Given** the company I am signing into has MFA enabled, **When** I authenticate, **Then** I must satisfy the second factor before the session is established.
    - **Given** MFA is enabled, **When** I fail the second factor, **Then** sign-in is denied and the event is audited.
- **US-SYS-11** — As a system user, I want my session to be subject to my company's session-timeout policy, so that an idle session cannot be misused. (FS §3.1.4 COMP-FR-014)
- **US-SYS-12** — As a system user, I want my password and credential changes to be recorded in the authentication audit log, so that any change to my account security is traceable. (BRD §6.1.6, §6.29)

### Identity model: user vs. employee, multi-company membership (BRD §6.1.2–§6.1.5, §7)

- **US-SYS-13** — As a system user, I want my login identity to be kept separate from any employee record, so that I can have system access independent of whether I am part of any company's workforce. (BRD §6.1.2, §7.1)
  - **Acceptance criteria:**
    - **Given** I am an authenticated user with no linked employee record, **When** I sign in, **Then** I am admitted as a valid user even though I am not anyone's employee.
    - **Given** I am linked to an employee in one company, **When** that link is created or removed, **Then** my user account continues to exist independently of the employee record.
- **US-SYS-14** — As a system user, I want to belong to one or more companies under a single account, so that I do not need separate logins for each company I work with. (BRD §6.1.3, §7.2)
- **US-SYS-15** — As a system user, I want to be linked to an employee record in one company, in several companies, or in none, so that the platform reflects my real relationship to each company. (BRD §6.1.5, §7.7)
- **US-SYS-16** — As a system user, I want to remain a valid login even when an employee record exists for me without a user link in some company, so that the user and employee lifecycles stay independent. (BRD §6.1.5, §7.7)
- **US-SYS-17** — As a system user, I want my account to confer no capabilities on its own, so that I can only do what my assigned roles in the active company allow. (BRD §5.1.1, §6.12.2)
  - **Acceptance criteria:**
    - **Given** I am authenticated but hold no role in the current company, **When** I navigate the application, **Then** I see no tenant business data and can perform no transactional or configuration action.
    - **Given** a role is assigned to me in a company, **When** I act within that company, **Then** my permitted actions are exactly those granted by that role.

### Contextual roles & company-context switching (BRD §5.1.2, §6.1.4, §6.12; FS §3.2.2)

- **US-SYS-18** — As a multi-company system user, I want to hold different roles in different companies, so that my access matches my responsibilities in each company. (BRD §5.1.2, §6.12.2)
  - **Acceptance criteria:**
    - **Given** I am assigned an admin role in Company A and an employee role in Company B, **When** my permissions are evaluated, **Then** they are scoped to whichever company is my current context.
- **US-SYS-19** — As a multi-company system user, I want to switch my active company context without logging out, so that I can move between authorized companies in one continuous session. (BRD §6.1.4, FS §3.2.2 PORT-FR-004)
  - **Acceptance criteria:**
    - **Given** I am authorized for more than one company, **When** I open the company switcher, **Then** it lists only the companies I am authorized for, with my current company highlighted.
    - **Given** I select an authorized target company, **When** the switch completes, **Then** the platform loads that company's configuration and security policies and issues a session token carrying the new company context.
- **US-SYS-20** — As a system user, I want a context switch to fail safely when I select an unauthorized company, so that tenant isolation is never breached. (FS §3.2.2, §9.1 AUTH_002)
  - **Acceptance criteria:**
    - **Given** I attempt to switch into a company I am not authorized for, **When** the system validates authorization, **Then** the switch is rejected (AUTH_002) and I remain in my current context.
- **US-SYS-21** — As a system user, I want the company I am currently working in to be clearly and persistently visible, so that I never perform an action in the wrong company. (FS §3.2.2 PORT-FR-007)
- **US-SYS-22** — As a system user, I want to open a bookmarkable company-specific URL and land in the correct context automatically, so that I can return directly to where I work. (FS §3.2.2 PORT-FR-006)
  - **Acceptance criteria:**
    - **Given** I open a company-specific URL for a company I am authorized for, **When** the page loads, **Then** my context is switched to that company automatically.
    - **Given** I open a company-specific URL for a company I am not authorized for, **When** the page loads, **Then** I am redirected to the company selector instead of the protected content.
- **US-SYS-23** — As a system user, I want every company-context switch to be recorded with the from-company and to-company, so that my cross-company movements are fully auditable. (BRD §6.12.6, FS §3.2.2, §8.1 CONTEXT_SWITCHED)

### Tenant isolation & authorized access (BRD §4.5, §7.15; FS §7.2)

- **US-SYS-24** — As a system user, I want to see only the companies I am explicitly authorized for, so that I can never view or reach another tenant's data. (BRD §4.5, §7.15)
  - **Acceptance criteria:**
    - **Given** I belong to a subset of platform companies, **When** I view my company list, **Then** only my authorized companies appear and no others are discoverable.
- **US-SYS-25** — As a system user, I want every request I make to be evaluated against my current company context, so that data from one company is never returned while I am working in another. (FS §7.2)
- **US-SYS-26** — As a system user, I want any unauthorized company-access attempt to be denied and logged, so that isolation violations are detected and recorded. (FS §7.2, §9.1 AUTH_001)

### Delegation (BRD §6.12.3)

- **US-SYS-27** — As a system user, I want to delegate my pending activities to another user within the same company, so that my approvals and tasks continue when I am unavailable. (BRD §6.12.3)
  - **Acceptance criteria:**
    - **Given** I have pending activities in a company, **When** I delegate them to another user in that same company, **Then** those activities become actionable by the delegate and remain visible to my manager and appropriate hierarchy members.
    - **Given** I attempt to delegate to a user outside the company, **When** I submit the delegation, **Then** it is rejected to preserve tenant boundaries.

### Impersonation as a target (BRD §6.12.4)

- **US-SYS-28** — As a system user, I want to be a target of authorized "login as" impersonation only by permitted support users, so that support can reproduce my issues without compromising security. (BRD §6.12.4)
  - **Acceptance criteria:**
    - **Given** an authorized support user impersonates my account, **When** the session begins and ends, **Then** the full impersonation is recorded in the audit trail identifying the support actor and my account.
    - **Given** a user without impersonation privilege attempts "login as" against my account, **When** they initiate it, **Then** the action is denied and logged.

### Notifications & preferences (BRD §6.27)

- **US-SYS-29** — As a system user, I want to receive account- and workflow-related notifications by email, so that I am informed of approvals, reminders, and security-relevant events. (BRD §6.27.2)
- **US-SYS-30** — As a system user, I want to set my own notification channel and frequency preferences, so that I receive the right messages through the channels I prefer. (BRD §6.27.5)

## Primary journeys

1. **Single sign-on and land in the right context.** The user signs in through their company's configured method (SAML / AD / O365 / Google / local), satisfies MFA if the company requires it, and is admitted. The authentication event is logged, and the user lands in their default authorized company with that company's roles, configuration, and permitted screens in effect.

2. **Work across multiple companies in one session.** A multi-company user opens the header switcher, which lists only their authorized companies. They select another company; the platform validates authorization, loads that company's configuration and security policies, issues a fresh context-bound token, and records the from→to switch in the audit trail. The user now acts under whatever role that company has granted them — no re-login required.

3. **Cover work while away via delegation.** Before going on leave, the user delegates their pending activities to a colleague in the same company. The colleague can now act on those items; the delegation respects tenant boundaries and stays visible to the user's manager and hierarchy.

4. **Secure support via audited impersonation.** When the user reports an issue, an authorized support user performs a "login as" against the user's account. The user is the *target* of the session; the entire impersonation — start, actions, and end — is recorded against both the support actor and the user's account for accountability.

## Notes & Phase 2

- **Phase 2 deferrals (clearly marked):**
  - **Contractor- and vendor-linked identities.** A user may be linked to a *contractor* record (and contractor/vendor login roles such as Contractor–Standard, Vendor User) only when Vendors & Contractors ships in Phase 2; Phase 1 covers user↔employee linkage only (Phase II BRD §1, §6.2–§6.3).
  - **Native mobile sign-in and push notifications.** Mobile authentication and push channels are Phase 2; Phase 1 self-service is responsive web only (BRD §3.2; Phase II BRD §6 area).
  - **Additional optional notification channels** (Microsoft Teams, WhatsApp) are optional third-party connectors; email is the mandatory Phase 1 channel (BRD §6.27.1).
- **Cross-cutting dependencies:**
  - **RBAC:** the User layer is meaningless without role/permission assignment per company; all capability is delegated from roles, evaluated against the active company context (BRD §6.12.1–§6.12.2).
  - **Tenant isolation:** the company switcher, request scoping, and all access checks depend on enforced row-level / context-bound isolation; the data-isolation model itself is a Week-0 architecture decision (Roadmap Gap D2; FS §7.2).
  - **Workflow engine:** delegation routing, approvals, and escalations that the user participates in ride on the configurable workflow engine (BRD §6.25).
  - **Notifications:** email delivery of account, security, and workflow events; user-level channel/frequency preferences (BRD §6.27).
  - **Audit & logging:** authentication events, credential/MFA changes, context switches, delegation, and impersonation must all produce tamper-resistant, role-access-controlled audit records within tenant boundaries (BRD §6.29; FS §8).
