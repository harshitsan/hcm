# Policy Management — User Stories

_Derived from SatelliteHR Phase I BRD — module "Policy Management". 9 user stories._

---

## POL-01: Create HR and business policies

**User story:** As a Company/HR Admin, I want to create and maintain HR and business policies, so that the organization has a documented, authoritative set of policies to govern operations.

**Acceptance criteria:**
- Given I have policy management rights, when I create a new policy with its content and attributes, then the policy is saved and available for assignment.
- Given an existing policy, when I edit its details, then the updated policy is retained for maintenance.

**Priority:** High
**Source:** FR 6.10.1 (creation and maintenance of policies)

---

## POL-02: Assign policies by organizational scope

**User story:** As a Company/HR Admin, I want to assign policies based on company, jurisdiction, location, department, group, and employment type, so that each policy applies only to the intended population.

**Acceptance criteria:**
- Given I am configuring a policy, when I select one or more scoping attributes (company, jurisdiction, location, department, group, employment type), then the policy applies only to entities matching those attributes.
- Given a policy scoped to a specific department, when a user outside that department is evaluated, then the policy does not apply to them.

**Priority:** High
**Source:** FR 6.10.1 (assignable by company, jurisdiction, location, department, group, employment type)

---

## POL-03: Assign policies by jurisdiction

**User story:** As a Group Company Admin, I want to assign policies by jurisdiction, so that legal and regulatory requirements specific to each jurisdiction are correctly enforced.

**Acceptance criteria:**
- Given entities operating in different jurisdictions, when I assign a policy to a jurisdiction, then only entities in that jurisdiction inherit the policy.
- Given a jurisdiction-scoped policy, when I review applicability, then the system reflects the correct jurisdiction mapping.

**Priority:** Medium
**Source:** FR 6.10.1 (jurisdiction-based assignment)

---

## POL-04: Version policies

**User story:** As a Company/HR Admin, I want policies to support versioning, so that I can update policy content over time while preserving a history of prior versions.

**Acceptance criteria:**
- Given an existing policy, when I make changes and save, then a new version is created while previous versions are retained.
- Given multiple versions of a policy, when I review the policy, then I can identify the current and historical versions.

**Priority:** High
**Source:** FR 6.10.2 (versioning)

---

## POL-05: Apply effective dating to policies

**User story:** As a Company/HR Admin, I want to set effective dates on policies, so that a policy takes effect at the correct time and superseded versions are applied only for their valid periods.

**Acceptance criteria:**
- Given a policy version with an effective date, when the current date is before that date, then the version is not yet in force.
- Given a policy version with an effective date, when that date is reached, then the version becomes the applicable one for its scope.

**Priority:** High
**Source:** FR 6.10.2 (effective dating)

---

## POL-06: Differentiate applicability for employees and contractors

**User story:** As a Company/HR Admin, I want policies to have different applicability for employees and contractors, so that each worker type is governed by the rules appropriate to their engagement.

**Acceptance criteria:**
- Given a policy, when I configure applicability, then I can specify whether it applies to employees, contractors, or both.
- Given a contractor-only policy, when an employee is evaluated, then the policy does not apply to that employee.

**Priority:** Medium
**Source:** FR 6.10.2 (different applicability for employees and contractors)

---

## POL-07: Integrate policies with operational modules

**User story:** As a Company/HR Admin, I want policies to integrate with the leave, attendance, onboarding, probation, performance, exit, and asset management modules, so that policy rules are consistently enforced across HR processes.

**Acceptance criteria:**
- Given a policy relevant to a module (e.g. leave or attendance), when a process runs in that module, then the applicable policy is applied.
- Given policies linked to onboarding, probation, performance, exit, and asset management, when those processes execute, then they respect the associated policy rules.

**Priority:** High
**Source:** FR 6.10.3 (integration with leave, attendance, onboarding, probation, performance, exit, asset management)

---

## POL-08: Role-controlled policy maintenance

**User story:** As a Platform Admin, I want policy maintenance to be role controlled, so that only authorized roles can create or modify policies.

**Acceptance criteria:**
- Given a user without policy maintenance rights, when they attempt to create or edit a policy, then the action is denied.
- Given a user with the appropriate role, when they access policy maintenance, then they can create and modify policies within their scope.

**Priority:** High
**Source:** FR 6.10.4 (role-controlled maintenance)

---

## POL-09: Role-controlled policy visibility

**User story:** As an Employee, I want to see only the policies applicable to my role and scope, so that I view relevant policies without exposure to unrelated or restricted policies.

**Acceptance criteria:**
- Given policy visibility is role controlled, when I view policies, then I see only those my role is permitted to see.
- Given a policy outside my visibility scope, when I browse policies, then that policy is not shown to me.

**Priority:** Medium
**Source:** FR 6.10.4 (role-controlled visibility)
