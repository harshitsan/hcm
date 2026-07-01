# Roles and Security — User Stories

## RSEC-01: Role-based access control across hierarchy levels
- Role: Platform Admin
- Story: As a Platform Admin, I want to define and assign roles scoped at the platform, portfolio, group-company, and company levels, so that access to data and system functions is controlled through a single consistent RBAC model.
- Priority: High
- Source: FR 6.12.1 (RBAC with roles at platform, portfolio, group-company, and company levels)

## RSEC-02: Different roles per company for a single user
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want a single user to hold different roles in different companies, so that a person working across multiple companies has exactly the correct permissions in each company.
- Priority: High
- Source: FR 6.12.2 (users may have different roles in different companies)

## RSEC-03: Access restrictions by company, group, department, and workforce type
- Role: Company Admin
- Story: As a Company Admin, I want security rules that restrict access based on company, group, department, and workforce type, so that users only see and act on data relevant to their authorized scope.
- Priority: High
- Source: FR 6.12.2 (security rules supporting restrictions by company, group, department, and workforce type)

## RSEC-04: Delegation of activities to another user
- Role: Employee (User)
- Story: As an Employee (User), I want to delegate my activities to another user within the same company, so that my work continues when I am unavailable.
- Priority: Medium
- Source: FR 6.12.3 (delegation of activities within the same company)

## RSEC-05: Delegated approvals visible to managers and hierarchy
- Role: Company Admin
- Story: As a Company Admin, I want delegated approvals to be visible to me and to appropriate hierarchy members, so that oversight and accountability are maintained during delegation.
- Priority: Medium
- Source: FR 6.12.3 (approvals visible to managers and appropriate hierarchy members)

## RSEC-06: Impersonation / login-as-user for authorized support
- Role: Platform Admin
- Story: As a Platform Admin operating as an authorized support user, I want a "login as user" capability, so that I can troubleshoot and assist users by acting within their context.
- Priority: Medium
- Source: FR 6.12.4 (impersonation / "login as user" for authorized support users)

## RSEC-07: Full audit logging of impersonation
- Role: Platform Admin
- Story: As a Platform Admin, I want every impersonation session to be fully audit-logged, so that all support actions taken on behalf of users are traceable and accountable.
- Priority: High
- Source: FR 6.12.4 (full audit logging of impersonation)

## RSEC-08: Configurable multi-factor authentication at company level
- Role: Company Admin
- Story: As a Company Admin, I want to configure multi-factor authentication (MFA) at the company level, so that my company's sign-in security meets its own requirements.
- Priority: High
- Source: FR 6.12.5 (MFA configurable at company level)

## RSEC-09: Secure and explicit company context switching
- Role: Portfolio Admin
- Story: As a Portfolio Admin managing multiple companies, I want company context switching to be secure and explicit, so that I always act within a clearly chosen company and cannot cross company boundaries accidentally.
- Priority: High
- Source: FR 6.12.6 (company context switching is secure and explicit)

## RSEC-10: Company context switching limited to authorized companies and auditable
- Role: Platform Admin
- Story: As a Platform Admin, I want company context switching to be limited to authorized companies and fully auditable, so that access is contained and every switch is traceable.
- Priority: High
- Source: FR 6.12.6 (context switching limited to authorized companies and auditable)

## RSEC-11: Role administration scoped to the group-company level
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to define and assign roles scoped to my group-company and its member companies, so that access within the group is governed consistently without exceeding my group boundary.
- Priority: High
- Source: FR 6.12.1 (RBAC with roles at platform, portfolio, group-company, and company levels)

## RSEC-12: Completing multi-factor authentication at sign-in
- Role: Employee (User)
- Story: As an Employee (User), I want to enroll in and complete multi-factor authentication when my company requires it, so that my account and my company's data stay secure.
- Priority: Medium
- Source: FR 6.12.5 (MFA configurable at company level)

## RSEC-13: Non-user records governed by RBAC scope without system access
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want my records to be governed by the same RBAC scope rules while I have no system login, so that my data is only visible to authorized users and I am not exposed to functions I should not have.
- Priority: Medium
- Source: FR 6.12.1, FR 6.12.2 (RBAC and scope restrictions by company, group, department, and workforce type applied to non-user employees)

## RSEC-14: Authorizing which support users may impersonate
- Role: Company Admin
- Story: As a Company Admin, I want to control which support users are authorized to impersonate users in my company, so that login-as-user is limited to trusted personnel and remains fully accountable.
- Priority: Medium
- Source: FR 6.12.4 (impersonation for authorized support users, with full audit logging)

## RSEC-15: Effective-dated role assignments with full history
- Role: Platform Admin
- Story: As a Platform Admin, I want role assignments stored as effective-dated, bitemporal records with full history, so that I can see who held which role at any point in time and reconstruct past access decisions.
- Priority: High
- Source: FR 6.12.1, FR 6.12.2 (L1 domain/data: effective-dated, bitemporal role-assignment records with history)

## RSEC-16: Tenant-scoped row-level security enforced at the persistence layer
- Role: Platform Admin
- Story: As a Platform Admin, I want company, group, department, and workforce-type scope enforced by row-level security at the data layer, so that no query or API path can return records outside a user's authorized scope even if a screen or service is bypassed.
- Priority: High
- Source: FR 6.12.2 (L1 domain/data: tenant-scoped storage / row-level security enforcing scope at persistence)

## RSEC-17: Immutable append-only audit store for security events
- Role: Platform Admin
- Story: As a Platform Admin, I want impersonation, context switches, delegations, and role changes written to an immutable append-only audit store, so that the security trail is tamper-evident and reliable for compliance.
- Priority: High
- Source: FR 6.12.4, FR 6.12.6 (L1 domain/data: immutable audit persistence for impersonation and context switching)

## RSEC-18: Roles and permissions maintained as versioned governed config
- Role: Platform Admin
- Story: As a Platform Admin, I want roles and their permission sets defined as versioned, effective-dated governed configuration, so that access policy can be changed without code and prior policy versions remain auditable.
- Priority: High
- Source: FR 6.12.1 (L2 config/metadata: role and permission definitions as versioned governed config)

## RSEC-19: Security scope rules maintained as governed configuration
- Role: Group Company Admin
- Story: As a Group Company Admin, I want the security scope rules (by company, group, department, and workforce type) maintained as governed, versioned configuration, so that access boundaries can be tuned per tenant without engineering changes.
- Priority: High
- Source: FR 6.12.2 (L2 config/metadata: scope rules by company, group, department, workforce type as governed config)

## RSEC-20: Access-control engine evaluates RBAC and scope on every request
- Role: Employee (User)
- Story: As an Employee (User), I want the shared rules engine to evaluate my role permissions and scope on every function and data request, so that access decisions are consistent, immediate, and enforced everywhere.
- Priority: High
- Source: FR 6.12.1, FR 6.12.2 (L3 engine: rules/decision engine evaluating RBAC + scope per request)

## RSEC-21: Approval workflow engine routes work to an active delegate
- Role: Employee (User)
- Story: As an Employee (User), I want the workflow/approval engine to route my pending approvals to my delegate while a delegation is active, so that approvals continue and stay attributable during my absence.
- Priority: Medium
- Source: FR 6.12.3 (L3 engine: workflow/approval engine routing delegated approvals)

## RSEC-22: Notification engine alerts on sensitive security events
- Role: Company Admin
- Story: As a Company Admin, I want the notification engine to alert appropriate parties when sensitive security events occur, so that impersonation and context switches receive timely oversight.
- Priority: Medium
- Source: FR 6.12.4, FR 6.12.6 (L3 engine: notification/template engine for impersonation and context-switch alerts)

## RSEC-23: Metadata-driven role administration and permission-aware UI
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven screen to administer roles and scope and a UI that reflects each user's permissions, so that I can manage access easily and users never see functions they cannot use.
- Priority: Medium
- Source: FR 6.12.1, FR 6.12.6 (L4 presentation: metadata-driven role admin screen and permission-aware SPA)
