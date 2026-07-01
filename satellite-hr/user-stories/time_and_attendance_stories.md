# Time and Attendance — User Stories

_Derived from SatelliteHR Phase I BRD — module "Time and Attendance". 13 user stories._

---

## TNA-01: Manual attendance entry

**User story:** As a Company/HR Admin, I want to manually enter attendance records for employees, so that attendance can be captured even when automated methods are unavailable.

**Acceptance criteria:**
- Given I am an authorized HR Admin, when I open an employee's attendance record, then I can manually enter or edit punch-in and punch-out times for a given date.
- Given a manual entry is saved, when the record is persisted, then it is attributed to the entering user and available for review and reporting.

**Priority:** High
**Source:** FR 6.18.1 (Attendance Capture Methods — manual entry)

---

## TNA-02: Biometric device integration

**User story:** As a Company/HR Admin, I want attendance to be captured automatically from integrated biometric devices, so that employee punches are recorded without manual effort.

**Acceptance criteria:**
- Given a biometric device is integrated, when an employee punches in or out, then the attendance record is captured against the correct employee.
- Given a device transmits records, when they are ingested, then the timestamps are stored and made available for attendance review.

**Priority:** High
**Source:** FR 6.18.1 (Attendance Capture Methods — biometric device integration)

---

## TNA-03: Third-party API integration for attendance

**User story:** As a Company/HR Admin, I want attendance data to be captured via API integration with third-party systems, so that attendance recorded in external tools flows into the HRMS.

**Acceptance criteria:**
- Given a third-party system is integrated via API, when it sends attendance data, then the records are received and stored against the correct employees.
- Given incoming API data, when it is processed, then it is available alongside other capture methods for review.

**Priority:** Medium
**Source:** FR 6.18.1 (Attendance Capture Methods — API integration with third-party systems)

---

## TNA-04: CSV/XLS attendance file import

**User story:** As a Company/HR Admin, I want to import attendance from CSV/XLS files, so that I can bulk-load attendance records from external sources.

**Acceptance criteria:**
- Given I have a CSV or XLS attendance file, when I upload it, then the system parses and imports the attendance records.
- Given imported records, when the import completes, then the records are associated with the correct employees and dates.

**Priority:** Medium
**Source:** FR 6.18.1 (Attendance Capture Methods — CSV/XLS file import)

---

## TNA-05: Define shift patterns and manage rosters

**User story:** As a Company/HR Admin, I want to define shift patterns and manage rosters, so that employees are scheduled to the correct working shifts.

**Acceptance criteria:**
- Given I am configuring shifts, when I create a shift pattern, then I can specify its working hours and assign it in rosters.
- Given a roster, when I assign employees to shifts, then their scheduled shifts are reflected for the relevant dates.

**Priority:** High
**Source:** FR 6.18.2 (Shifts and Rosters — shift pattern definition, roster management)

---

## TNA-06: Shift swapping with approval

**User story:** As an Employee, I want to request a shift swap that goes through an approval workflow, so that I can exchange shifts with authorization.

**Acceptance criteria:**
- Given I am assigned a shift, when I request a swap, then the request is routed through the defined approval workflow.
- Given a swap request is approved, when the approval is recorded, then the roster is updated to reflect the swapped shifts.

**Priority:** Medium
**Source:** FR 6.18.2 (Shifts and Rosters — shift swapping with approval workflows)

---

## TNA-07: Company and location-specific holiday calendars

**User story:** As a Company/HR Admin, I want to configure company-specific and location-specific holiday calendars, so that holidays are correctly reflected for each location.

**Acceptance criteria:**
- Given I manage holiday calendars, when I add a holiday, then I can scope it to the company or to a specific location.
- Given holiday calendars are configured, when attendance is evaluated, then the applicable holidays are recognized for the relevant employees.

**Priority:** High
**Source:** FR 6.18.3 (Holiday Calendars — company and location-specific configuration)

---

## TNA-08: Optional holidays

**User story:** As a Company/HR Admin, I want to configure optional holidays in the holiday calendar, so that employees can choose from a set of optional holidays.

**Acceptance criteria:**
- Given I am configuring a holiday calendar, when I mark a holiday as optional, then it is distinguished from mandatory holidays.
- Given optional holidays are configured, when they are applied, then they are handled distinctly from fixed holidays in attendance evaluation.

**Priority:** Low
**Source:** FR 6.18.3 (Holiday Calendars — optional holidays)

---

## TNA-09: Overtime calculation and categorization

**User story:** As a Company/HR Admin, I want overtime to be calculated and categorized as normal, holiday, or night shift, so that overtime is accurately classified for processing.

**Acceptance criteria:**
- Given attendance records, when overtime hours are computed, then they are calculated based on worked hours beyond the standard schedule.
- Given overtime is calculated, when it is stored, then it is categorized as normal, holiday, or night shift.

**Priority:** High
**Source:** FR 6.18.4 (Overtime Management — calculation and categorization)

---

## TNA-10: Overtime eligibility and approval

**User story:** As a Manager, I want overtime eligibility to be governed by worker category and to approve overtime through a workflow, so that only eligible overtime is authorized.

**Acceptance criteria:**
- Given a worker category, when overtime is evaluated, then only workers eligible by category are considered for overtime.
- Given overtime is recorded, when it requires authorization, then it is routed through an approval workflow before being finalized.

**Priority:** Medium
**Source:** FR 6.18.4 (Overtime Management — eligibility by worker category, approval workflows)

---

## TNA-11: Attendance exception correction requests

**User story:** As an Employee, I want to raise correction requests for missed punches, late arrivals, and early exits, so that attendance errors can be corrected through an approval flow.

**Acceptance criteria:**
- Given an attendance exception such as a missed punch, late arrival, or early exit, when I submit a correction request, then it is routed through the defined approval flow.
- Given a correction request is not actioned within the defined threshold, when the escalation rule triggers, then the request is escalated accordingly.

**Priority:** High
**Source:** FR 6.18.5 (Attendance Exception Workflows — correction requests with approval flows and escalation rules)

---

## TNA-12: Statutory working hours configuration

**User story:** As a Company/HR Admin, I want to configure statutory working hours aligned with Indian labor law, so that attendance complies with legal working-hour requirements.

**Acceptance criteria:**
- Given I am configuring working hours, when I set daily working hours, weekly off, and maximum working hour limits, then the configuration is saved and applied.
- Given the statutory configuration, when attendance is evaluated, then it is assessed against the configured daily, weekly off, and maximum-hour limits.

**Priority:** High
**Source:** FR 6.18.6 (Statutory Working Hours — Indian labor law alignment)

---

## TNA-13: Administrative override with audit trail

**User story:** As a Company/HR Admin, I want to override attendance records with a mandatory reason and full audit trail, so that corrections are authorized and traceable.

**Acceptance criteria:**
- Given I override an attendance record, when I save the change, then I must provide a mandatory reason before the override is accepted.
- Given an override is applied, when the change is persisted, then a full audit trail captures the change, the reason, and the acting user.

**Priority:** High
**Source:** FR 6.18.7 (Administrative Override — override with mandatory reason and full audit trail)
