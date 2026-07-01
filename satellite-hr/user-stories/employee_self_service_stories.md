# Employee Self-Service — User Stories

_Derived from SatelliteHR Phase I BRD — module "Employee Self-Service". 8 user stories._

---

## ESS-01: Responsive web self-service access

**User story:** As an Employee, I want to access self-service transactions through a responsive web interface, so that I can perform HR-related tasks from any device browser without needing a dedicated app.

**Acceptance criteria:**
- Given I am an authenticated employee, when I open the self-service portal in a web browser, then the interface renders responsively across desktop, tablet, and common screen sizes.
- Given I access the portal, when Phase I is in scope, then all self-service transactions are available via the web interface only (no native mobile application).
- Given a native mobile application is requested, when it is Phase II scope, then it is not part of this release.

**Priority:** High
**Source:** FR 6.16.1 (responsive web interface; mobile is Phase II)

---

## ESS-02: View personal and employment information

**User story:** As an Employee, I want to view my authorized personal and employment information, so that I can confirm my records are accurate and up to date.

**Acceptance criteria:**
- Given I am an authenticated employee, when I open my self-service profile, then I can view the personal and employment information I am authorized to see.
- Given information exists that I am not authorized to view, when I access my profile, then that information is not displayed.

**Priority:** High
**Source:** FR 6.16.2 (view authorized personal and employment information)

---

## ESS-03: Manage personal and employment information

**User story:** As an Employee, I want to manage my authorized personal and employment information, so that I can keep my own records current without routing every change through HR.

**Acceptance criteria:**
- Given I am an authenticated employee, when I edit a field I am authorized to manage, then the update is saved to my record.
- Given a field is outside my authorized scope, when I attempt to change it, then the change is not permitted.

**Priority:** High
**Source:** FR 6.16.2 (manage authorized personal and employment information)

---

## ESS-04: Access profile information via self-service

**User story:** As an Employee, I want to access my profile information through self-service, so that I can review my details in one place.

**Acceptance criteria:**
- Given I am an authenticated employee, when I open self-service, then a profile information section is available to me.
- Given I open the profile section, when it loads, then it displays my profile details.

**Priority:** High
**Source:** FR 6.16.3 (self-service access to profile information)

---

## ESS-05: Access leave and attendance via self-service

**User story:** As an Employee, I want to access leave and attendance functions through self-service, so that I can review and act on my time-related information.

**Acceptance criteria:**
- Given I am an authenticated employee, when I open self-service, then leave and attendance functions are available to me.
- Given I open the leave or attendance section, when it loads, then it displays the relevant leave and attendance information I am entitled to.

**Priority:** High
**Source:** FR 6.16.3 (self-service access to leave and attendance)

---

## ESS-06: Access announcements via self-service

**User story:** As an Employee, I want to access announcements through self-service, so that I stay informed of organizational communications.

**Acceptance criteria:**
- Given I am an authenticated employee, when I open self-service, then an announcements section is available to me.
- Given announcements are published for me, when I open the announcements section, then I can view them.

**Priority:** Medium
**Source:** FR 6.16.3 (self-service access to announcements)

---

## ESS-07: Access documents and feedback functions via self-service

**User story:** As an Employee, I want to access documents and feedback-related functions through self-service, so that I can retrieve my documents and participate in feedback activities.

**Acceptance criteria:**
- Given I am an authenticated employee, when I open self-service, then documents and feedback-related functions are available to me.
- Given I open the documents section, when it loads, then I can access the documents I am authorized to view.
- Given I open a feedback-related function, when it is available to me, then I can perform the associated feedback action.

**Priority:** Medium
**Source:** FR 6.16.3 (self-service access to documents and feedback-related functions)

---

## ESS-08: Role and policy controlled self-service access

**User story:** As a Company/HR Admin, I want self-service access to be governed by role and policy, so that employees only see and act on functions permitted to them.

**Acceptance criteria:**
- Given a user attempts a self-service action, when access is evaluated, then it is granted or denied based on the user's role and applicable policy.
- Given a function is not permitted by the user's role or policy, when the user accesses self-service, then that function is hidden or blocked.
- Given roles or policies change, when a user next uses self-service, then their available functions reflect the updated role and policy configuration.

**Priority:** High
**Source:** FR 6.16.4 (role and policy controlled access)

---
