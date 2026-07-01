# Feedback and Grievance — User Stories

_Derived from SatelliteHR Phase I BRD — module "Feedback and Grievance". 7 user stories._

---

## FBG-01: Submit a feedback or grievance entry

**User story:** As an Employee, I want to submit a feedback or grievance-related entry, so that my concern is formally captured and can be acted upon.

**Acceptance criteria:**
- Given I am an authenticated employee, when I open the Feedback and Grievance module, then I can create a new feedback or grievance entry.
- Given I complete the required details of an entry, when I submit it, then the entry is recorded in the system for review.
- Given I have submitted an entry, when I revisit the module, then I can see the entry I raised.

**Priority:** High
**Source:** FR 6.19.1 (submission of feedback and grievance-related entries)

---

## FBG-02: Role-based review of submitted entries

**User story:** As a Company/HR Admin, I want submitted feedback and grievance entries routed to me for review based on my role, so that the right authorized reviewer handles each entry.

**Acceptance criteria:**
- Given an entry has been submitted, when I access the module in a review role, then I can view the entries assigned for my review.
- Given I hold a reviewer role, when I open an entry, then I can review its details as part of the role-based review workflow.
- Given a user does not hold a review role, when they attempt to review an entry, then the review actions are not available to them.

**Priority:** High
**Source:** FR 6.19.1 (role-based review)

---

## FBG-03: Restrict access to grievance information

**User story:** As a Company/HR Admin, I want access to grievance-related information restricted to authorized personnel, so that sensitive concerns remain confidential.

**Acceptance criteria:**
- Given a user is not authorized, when they attempt to view grievance-related information, then access is denied.
- Given a user is authorized, when they access grievance-related information, then only the entries within their authorization scope are visible.
- Given grievance data exists, when access is granted, then it is limited strictly to authorized personnel.

**Priority:** High
**Source:** FR 6.19.2 (access restricted to authorized personnel)

---

## FBG-04: Track the status of an entry

**User story:** As an Employee, I want to track the status of my submitted feedback or grievance entry, so that I know how it is progressing.

**Acceptance criteria:**
- Given I have submitted an entry, when I view it, then its current status is displayed.
- Given the status of an entry changes, when I revisit the entry, then the updated status is reflected.

**Priority:** Medium
**Source:** FR 6.19.3 (status tracking)

---

## FBG-05: Update status during review

**User story:** As a Company/HR Admin, I want to update the status of a feedback or grievance entry as I review it, so that its progress is accurately reflected.

**Acceptance criteria:**
- Given I am an authorized reviewer, when I review an entry, then I can update its status.
- Given I update an entry's status, when the change is saved, then the new status is recorded and visible to relevant parties.

**Priority:** Medium
**Source:** FR 6.19.3 (status tracking)

---

## FBG-06: Maintain an audit trail

**User story:** As a Company/HR Admin, I want the module to maintain an audit trail of feedback and grievance activity, so that actions on each entry are traceable and accountable.

**Acceptance criteria:**
- Given an entry is submitted, reviewed, or updated, when the action occurs, then it is recorded for auditability.
- Given an audit trail exists, when an authorized user inspects an entry, then the recorded history of actions on that entry is available.

**Priority:** Medium
**Source:** FR 6.19.3 (auditability)

---

## FBG-07: Scope module to Phase 1 needs

**User story:** As a Platform Admin, I want the module scoped to Phase 1 feedback and grievance tracking needs, so that current requirements are met while broader case-management is deferred to a future phase.

**Acceptance criteria:**
- Given the Phase 1 release, when the module is used, then it supports feedback and grievance tracking without full case-management workflows.
- Given broader case-management capabilities are planned for a future phase, when Phase 1 scope is defined, then only feedback and grievance tracking features are included.

**Priority:** Low
**Source:** FR 6.19.4 (Phase 1 scope; case-management deferred to future phase)
