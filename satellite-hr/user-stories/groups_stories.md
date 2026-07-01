# Groups — User Stories

_Derived from SatelliteHR Phase I BRD — module "Groups". 7 user stories._

---

## GRP-01: Create global groups

**User story:** As a Platform (HRMS) Administrator, I want to create global groups that are available across the platform, so that I can define groupings that apply to all tenants for policy, eligibility, and security purposes.

**Acceptance criteria:**
- Given I am authenticated as the HRMS Administrator, when I create a group and mark it as global, then the group is created with global scope and becomes available platform-wide.
- Given a global group exists, when a non-HRMS-Administrator user views group settings, then they cannot create or modify global groups.

**Priority:** High
**Source:** FR 6.6.1 (global groups created by HRMS Administrator)

---

## GRP-02: Create company-specific groups

**User story:** As a Company/HR Admin, I want to create groups scoped to my company, so that I can group my company's employees and users independently of other tenants.

**Acceptance criteria:**
- Given I am a Company/HR Admin, when I create a group, then the group is scoped to my company only and is not visible to other companies.
- Given a company-specific group exists, when it is referenced elsewhere in the platform, then it is available only within its owning company's context.

**Priority:** High
**Source:** FR 6.6.1 (company-specific groups)

---

## GRP-03: Build hierarchical parent-child group structures

**User story:** As an administrator, I want to arrange groups into parent-child hierarchies, so that I can model organizational and policy groupings that reflect nested relationships.

**Acceptance criteria:**
- Given I am managing groups, when I assign a parent to a group, then the group is nested under that parent as a child.
- Given a group hierarchy exists, when I view a group, then its parent and child relationships are visible.

**Priority:** Medium
**Source:** FR 6.6.2 (hierarchical parent-child structures)

---

## GRP-04: Support n-level group nesting

**User story:** As an administrator, I want group hierarchies to support unlimited (n-level) nesting, so that I can represent deep organizational structures without depth restrictions.

**Acceptance criteria:**
- Given a group hierarchy exists, when I add child groups beyond a single level, then the system supports nesting at any number of levels.
- Given a deeply nested structure, when I create a new child at any depth, then the system does not reject it due to a nesting-level limit.

**Priority:** Medium
**Source:** FR 6.6.2 (n-level nesting)

---

## GRP-05: Assign employees to multiple groups

**User story:** As a Company/HR Admin, I want to assign an employee to more than one group, so that a single employee can be covered by multiple groupings simultaneously.

**Acceptance criteria:**
- Given an employee record exists, when I add the employee to multiple groups, then the employee is recorded as a member of each of those groups.
- Given an employee belongs to several groups, when I view the employee's group memberships, then all groups they belong to are listed.

**Priority:** High
**Source:** FR 6.6.3 (employees may belong to multiple groups)

---

## GRP-06: Associate users with groups

**User story:** As an administrator, I want to associate users with groups where required, so that group-based security and access can be applied to users, not only employees.

**Acceptance criteria:**
- Given a user account exists, when I associate the user with a group, then the user is recorded as a member of that group.
- Given a user is associated with a group, when I review the group's membership, then the associated user appears.

**Priority:** Medium
**Source:** FR 6.6.3 (users may be associated with groups where required)

---

## GRP-07: Use groups as policy applicability criteria

**User story:** As a Company/HR Admin, I want to select groups as applicability criteria when defining policies, so that policies apply to the members of the chosen groups.

**Acceptance criteria:**
- Given a group exists, when I configure a policy's applicability, then I can choose that group as a criterion.
- Given a policy is scoped to a group, when the policy is evaluated, then it applies to the members of that group.

**Priority:** High
**Source:** FR 6.6.4 (groups available as policy applicability criteria)

---
