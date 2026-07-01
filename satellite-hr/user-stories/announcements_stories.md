# Announcements — User Stories

_Derived from SatelliteHR Phase I BRD — module "Announcements". 8 user stories._

---

## ANN-01: Publish an announcement

**User story:** As a Company/HR Admin, I want to compose and publish organizational announcements, so that relevant employees receive important messages through the system.

**Acceptance criteria:**
- Given I am an authorized user, when I create an announcement with a message and publish it, then the announcement becomes available to its targeted audience.
- Given I am not an authorized user, when I attempt to publish an announcement, then the action is blocked.

**Priority:** High
**Source:** FR 6.14.1

---

## ANN-02: Target announcements by company and jurisdiction

**User story:** As a Company/HR Admin, I want to target announcements by company and jurisdiction, so that messages reach only the legal and organizational entities they apply to.

**Acceptance criteria:**
- Given I am publishing an announcement, when I select one or more companies and/or jurisdictions as the audience, then only employees within those companies/jurisdictions can view it.
- Given no company or jurisdiction is selected, when I try to publish, then the system requires a valid target audience.

**Priority:** High
**Source:** FR 6.14.1

---

## ANN-03: Target announcements by location and department

**User story:** As a Company/HR Admin, I want to target announcements by location and department, so that site- or team-specific messages reach the right people.

**Acceptance criteria:**
- Given I am publishing an announcement, when I select one or more locations and/or departments, then only employees in those locations/departments can view it.
- Given I combine location and department filters, when the announcement is published, then only employees matching the combined criteria receive it.

**Priority:** High
**Source:** FR 6.14.1

---

## ANN-04: Target announcements by group and workforce type

**User story:** As a Company/HR Admin, I want to target announcements by group and workforce type, so that messages relevant to specific employee cohorts (e.g. contractors vs. full-time) reach only those groups.

**Acceptance criteria:**
- Given I am publishing an announcement, when I select one or more groups and/or workforce types, then only employees matching those attributes can view it.
- Given a workforce type is selected, when an employee's workforce type does not match, then the announcement is not visible to that employee.

**Priority:** Medium
**Source:** FR 6.14.1

---

## ANN-05: Schedule an announcement for future publishing

**User story:** As a Company/HR Admin, I want to schedule an announcement to be published at a future date and time, so that messages go live at the right moment without manual intervention.

**Acceptance criteria:**
- Given I set a scheduled publish date/time, when the announcement is saved, then it remains hidden from the audience until that date/time is reached.
- Given the scheduled time is reached, when the system processes the schedule, then the announcement becomes visible to its targeted audience automatically.

**Priority:** Medium
**Source:** FR 6.14.2

---

## ANN-06: Set an expiry for an announcement

**User story:** As a Company/HR Admin, I want to set an expiry date/time on an announcement, so that outdated messages are automatically removed from view.

**Acceptance criteria:**
- Given I set an expiry date/time, when that time passes, then the announcement is no longer visible to the targeted audience.
- Given an announcement has not yet reached its expiry, when an employee views their announcements, then it remains visible.

**Priority:** Medium
**Source:** FR 6.14.2

---

## ANN-07: View relevant announcements as an employee

**User story:** As an Employee, I want to view the announcements relevant to me, so that I stay informed about organizational messages that apply to my context.

**Acceptance criteria:**
- Given I have system access, when I open the announcements view, then I see only the announcements targeted to my company, jurisdiction, location, department, group, and workforce type.
- Given an announcement is not targeted to my attributes, when I view my announcements, then it does not appear.

**Priority:** High
**Source:** FR 6.14.3

---

## ANN-08: Restrict announcement visibility to users with system access

**User story:** As the System, I want to expose announcements only to employees who have system access, so that messages are delivered securely to authenticated recipients.

**Acceptance criteria:**
- Given an employee without system access, when announcements are distributed, then that employee cannot view them in the system.
- Given an employee with valid system access and matching targeting, when they authenticate, then the relevant announcements are available to them.

**Priority:** Medium
**Source:** FR 6.14.3

---
