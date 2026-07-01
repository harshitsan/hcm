# Roles and Security — User Stories

_Derived from SatelliteHR Phase I BRD — module "Roles and Security". 10 user stories._

---

## RSEC-01: Role-based access control across hierarchy levels

**User story:** As a Platform Admin, I want to define and assign roles at platform, portfolio, group-company, and company levels, so that access to data and system functions is controlled through a consistent RBAC model.

**Acceptance criteria:**
- Given the RBAC model, when I create a role, then I can scope it to the platform, portfolio, group-company, or company level.
- Given a defined role, when I assign it to a user, then the user gains only the permissions granted by that role at that level.
- Given a user without a role granting a function, when they attempt to access that function or data, then access is denied.

**Priority:** High
**Source:** FR 6.12.1 (RBAC with roles at platform, portfolio, group-company, and company levels)

---

## RSEC-02: Different roles per company for a single user

**User story:** As a Company/HR Admin, I want a user to hold different roles in different companies, so that a person working across multiple companies has the correct permissions in each.

**Acceptance criteria:**
- Given a multi-company user, when roles are assigned, then a distinct role can be set for each company the user belongs to.
- Given a user acting in a specific company, when they access functions, then the permissions applied are those of their role in that company only.

**Priority:** High
**Source:** FR 6.12.2 (users may have different roles in different companies)

---

## RSEC-03: Access restrictions by company, group, department, and workforce type

**User story:** As a Company/HR Admin, I want security rules that restrict access based on company, group, department, and workforce type, so that users only see data relevant to their scope.

**Acceptance criteria:**
- Given a security rule scoped by company, group, department, or workforce type, when a user queries data, then only records matching their permitted scope are returned.
- Given a user outside a record's company, group, department, or workforce type scope, when they attempt access, then the record is not visible.

**Priority:** High
**Source:** FR 6.12.2 (security rules supporting restrictions by company, group, department, and workforce type)

---

## RSEC-04: Delegation of activities to another user

**User story:** As an Employee, I want to delegate my activities to another user within the same company, so that work continues when I am unavailable.

**Acceptance criteria:**
- Given I am a user, when I delegate activities, then I can only select a delegate who belongs to the same company.
- Given an active delegation, when the delegate acts, then they can perform the delegated activities on my behalf.

**Priority:** Medium
**Source:** FR 6.12.3 (delegation of activities within the same company)

---

## RSEC-05: Delegated approvals visible to managers and hierarchy

**User story:** As a Manager, I want delegated approvals to be visible to me and appropriate hierarchy members, so that oversight is maintained during delegation.

**Acceptance criteria:**
- Given an activity is delegated, when an approval is performed by the delegate, then the approval is visible to managers and appropriate hierarchy members.
- Given a delegation is in effect, when I review the approval trail, then the delegate relationship is evident.

**Priority:** Medium
**Source:** FR 6.12.3 (approvals visible to managers and appropriate hierarchy members)

---

## RSEC-06: Impersonation / login-as-user for authorized support

**User story:** As a Platform Admin (support user), I want a "login as user" capability, so that I can troubleshoot and assist users by acting in their context.

**Acceptance criteria:**
- Given I am an authorized support user, when I invoke "login as user", then I can operate within the target user's context.
- Given I am not authorized for impersonation, when I attempt to log in as a user, then the action is denied.

**Priority:** Medium
**Source:** FR 6.12.4 (impersonation / "login as user" for authorized support users)

---

## RSEC-07: Full audit logging of impersonation

**User story:** As a Platform Admin, I want every impersonation session fully audit-logged, so that support actions taken on behalf of users are traceable.

**Acceptance criteria:**
- Given a support user impersonates another user, when the session begins and actions are taken, then the impersonation and its actions are recorded in the audit log.
- Given an audit review, when I inspect impersonation records, then I can identify who impersonated whom and what was done.

**Priority:** High
**Source:** FR 6.12.4 (full audit logging of impersonation)

---

## RSEC-08: Configurable multi-factor authentication at company level

**User story:** As a Company/HR Admin, I want to configure multi-factor authentication (MFA) at the company level, so that my company's sign-in security meets its own requirements.

**Acceptance criteria:**
- Given company security settings, when I enable or disable MFA, then the setting applies to that company.
- Given MFA is enabled for a company, when a user of that company signs in, then they are required to complete the additional authentication factor.

**Priority:** High
**Source:** FR 6.12.5 (MFA configurable at company level)

---

## RSEC-09: Secure and explicit company context switching

**User story:** As a multi-company user, I want company context switching to be secure and explicit, so that I always act within a clearly chosen company and cannot cross boundaries accidentally.

**Acceptance criteria:**
- Given I belong to multiple companies, when I switch company context, then the switch requires an explicit action confirming the target company.
- Given I switch context, when I act after the switch, then all data and functions reflect the selected company only.

**Priority:** High
**Source:** FR 6.12.6 (company context switching is secure and explicit)

---

## RSEC-10: Company context switching limited to authorized companies and auditable

**User story:** As a Platform Admin, I want company context switching to be limited to authorized companies and fully auditable, so that access is contained and every switch is traceable.

**Acceptance criteria:**
- Given a multi-company user, when they attempt to switch context, then only companies they are authorized for are selectable.
- Given a company context switch occurs, when I review audit records, then the switch is logged with the user and the companies involved.

**Priority:** High
**Source:** FR 6.12.6 (context switching limited to authorized companies and auditable)
