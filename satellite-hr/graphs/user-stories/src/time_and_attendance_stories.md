# Time and Attendance — User Stories

## TNA-01: Manual attendance entry
- Role: Company Admin
- Story: As a Company Admin, I want to manually enter and edit attendance records for employees, so that attendance can be captured even when automated methods are unavailable.
- Priority: High
- Source: FR 6.18.1 (Attendance Capture Methods — manual entry)

## TNA-02: Biometric device integration
- Role: Company Admin
- Story: As a Company Admin, I want attendance to be captured automatically from integrated biometric devices, so that employee punches are recorded without manual effort.
- Priority: High
- Source: FR 6.18.1 (Attendance Capture Methods — biometric device integration)

## TNA-03: Third-party API integration for attendance
- Role: Company Admin
- Story: As a Company Admin, I want attendance data to be captured via API integration with third-party systems, so that attendance recorded in external tools flows into the HRMS.
- Priority: Medium
- Source: FR 6.18.1 (Attendance Capture Methods — API integration with third-party systems)

## TNA-04: CSV/XLS attendance file import
- Role: Company Admin
- Story: As a Company Admin, I want to import attendance from CSV/XLS files, so that I can bulk-load attendance records from external sources.
- Priority: Medium
- Source: FR 6.18.1 (Attendance Capture Methods — CSV/XLS file import)

## TNA-05: Define shift patterns and manage rosters
- Role: Company Admin
- Story: As a Company Admin, I want to define shift patterns and manage rosters, so that employees are scheduled to the correct working shifts.
- Priority: High
- Source: FR 6.18.2 (Shifts and Rosters — shift pattern definition, roster management)

## TNA-06: Request a shift swap with approval
- Role: Employee (User)
- Story: As an Employee (User), I want to request a shift swap that goes through an approval workflow, so that I can exchange shifts with authorization.
- Priority: Medium
- Source: FR 6.18.2 (Shifts and Rosters — shift swapping with approval workflows)

## TNA-07: Company and location-specific holiday calendars
- Role: Company Admin
- Story: As a Company Admin, I want to configure company-specific and location-specific holiday calendars, so that holidays are correctly reflected for each location.
- Priority: High
- Source: FR 6.18.3 (Holiday Calendars — company and location-specific configuration)

## TNA-08: Optional holidays configuration
- Role: Company Admin
- Story: As a Company Admin, I want to configure optional holidays in the holiday calendar, so that employees can choose from a set of optional holidays.
- Priority: Low
- Source: FR 6.18.3 (Holiday Calendars — optional holidays)

## TNA-09: Overtime calculation and categorization
- Role: Company Admin
- Story: As a Company Admin, I want overtime to be calculated and categorized as normal, holiday, or night shift, so that overtime is accurately classified for processing.
- Priority: High
- Source: FR 6.18.4 (Overtime Management — calculation and categorization)

## TNA-10: Overtime eligibility and approval
- Role: Company Admin
- Story: As a Company Admin, I want overtime eligibility to be governed by worker category and approved through a workflow, so that only eligible, authorized overtime is finalized.
- Priority: Medium
- Source: FR 6.18.4 (Overtime Management — eligibility by worker category, approval workflows)

## TNA-11: Attendance exception correction requests
- Role: Employee (User)
- Story: As an Employee (User), I want to raise correction requests for missed punches, late arrivals, and early exits, so that attendance errors can be corrected through an approval flow.
- Priority: High
- Source: FR 6.18.5 (Attendance Exception Workflows — correction requests with approval flows and escalation rules)

## TNA-12: Statutory working hours configuration
- Role: Company Admin
- Story: As a Company Admin, I want to configure statutory working hours aligned with Indian labor law, so that attendance complies with legal working-hour requirements.
- Priority: High
- Source: FR 6.18.6 (Statutory Working Hours — Indian labor law alignment)

## TNA-13: Administrative override with audit trail
- Role: Company Admin
- Story: As a Company Admin, I want to override attendance records with a mandatory reason and full audit trail, so that corrections are authorized and traceable.
- Priority: High
- Source: FR 6.18.7 (Administrative Override — override with mandatory reason and full audit trail)

## TNA-14: Approve or reject shift swap requests
- Role: Company Admin
- Story: As a Company Admin, I want to review and decide on shift swap requests, so that only authorized shift exchanges are applied to the roster.
- Priority: Medium
- Source: FR 6.18.2 (Shifts and Rosters — shift swapping with approval workflows, approver side)

## TNA-15: Approve or reject attendance correction requests and manage escalations
- Role: Company Admin
- Story: As a Company Admin, I want to review and decide on attendance exception correction requests and handle escalations, so that legitimate corrections are applied while errors are controlled.
- Priority: High
- Source: FR 6.18.5 (Attendance Exception Workflows — approval and escalation, approver side)

## TNA-16: Configure attendance exception approval flows and escalation rules
- Role: Company Admin
- Story: As a Company Admin, I want to configure approval flows and escalation rules for attendance exceptions and overtime, so that requests are routed and escalated correctly.
- Priority: Medium
- Source: FR 6.18.4, FR 6.18.5 (approval workflows and escalation rules configuration)

## TNA-17: View own attendance, roster, and holidays
- Role: Employee (User)
- Story: As an Employee (User), I want to view my own attendance records, scheduled shifts, and applicable holidays, so that I can track my time and plan around holidays.
- Priority: Medium
- Source: FR 6.18.1, 6.18.2, 6.18.3 (self-service attendance/roster/holiday visibility)

## TNA-18: Manage attendance for Employee (Non-User)
- Role: Company Admin
- Story: As a Company Admin, I want to capture and manage attendance on behalf of Employee (Non-User) records that have no self-service login, so that non-user employees are included in attendance and compliance processing.
- Priority: Medium
- Source: FR 6.18.1 (Attendance Capture Methods — coverage for non-user employees)

## TNA-19: Attendance review dashboard and compliance reporting
- Role: Company Admin
- Story: As a Company Admin, I want a consolidated attendance review view with compliance reporting, so that I can monitor attendance, exceptions, overtime, and statutory compliance.
- Priority: Medium
- Source: FR 6.18.5, 6.18.6, 6.18.7 (attendance review and compliance oversight)

## TNA-20: Cross-company attendance and compliance oversight
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to oversee attendance configuration and compliance across the companies in my group, so that policies are consistent and compliant group-wide.
- Priority: Low
- Source: FR 6.18.3, 6.18.4, 6.18.6 (group-level attendance oversight)

## TNA-21: Enable and configure attendance capture integrations
- Role: Platform Admin
- Story: As a Platform Admin, I want to enable the Time and Attendance module and provision capture-method integrations, so that companies can use biometric, API, and file-import capture securely.
- Priority: Low
- Source: FR 6.18.1 (Attendance Capture Methods — platform-level integration enablement)

## TNA-22: Bitemporal attendance data model with history and tenant isolation
- Role: Platform Admin
- Story: As a Platform Admin, I want attendance records, overrides, and corrections stored in a bitemporal, tenant-scoped data model, so that every change is historically reconstructable and isolated per tenant.
- Priority: High
- Source: FR 6.18.1, FR 6.18.7 (L1 domain/data)

## TNA-23: Attendance record uniqueness integrity and deduplication persistence
- Role: Company Admin
- Story: As a Company Admin, I want attendance records to enforce uniqueness and integrity across capture sources, so that worked hours are never double-counted and records stay consistent.
- Priority: High
- Source: FR 6.18.1 (L1 domain/data)

## TNA-24: Versioned effective-dated attendance configuration
- Role: Company Admin
- Story: As a Company Admin, I want shift patterns, holiday calendars, statutory rule-packs, overtime eligibility, and approval graphs managed as versioned, effective-dated configuration, so that policy changes apply from the right date without code changes.
- Priority: Medium
- Source: FR 6.18.2, FR 6.18.3, FR 6.18.6 (L2 config/metadata)

## TNA-25: Time engine computes worked hours and overtime accrual
- Role: Company Admin
- Story: As a Company Admin, I want the shared Time/Accrual engine to derive worked hours and overtime from raw punches and schedules, so that computed time is consistent and automated.
- Priority: High
- Source: FR 6.18.4, FR 6.18.6 (L3 engine — Accrual/Balance/Time)

## TNA-26: Rules engine evaluates overtime categorization and statutory compliance
- Role: Company Admin
- Story: As a Company Admin, I want the shared Rules engine to evaluate overtime categorization and statutory compliance via decision tables, so that classification and violation detection are config-driven, not hard-coded.
- Priority: High
- Source: FR 6.18.4, FR 6.18.6 (L3 engine — Rules/decision tables)

## TNA-27: Workflow and notification engines route and notify on attendance requests
- Role: Employee (User)
- Story: As an Employee (User), I want the shared workflow and notification engines to route my shift-swap, correction, and overtime requests and keep me informed, so that requests are actioned and I am notified at each step.
- Priority: Medium
- Source: FR 6.18.2, FR 6.18.4, FR 6.18.5 (L3 engine — Workflow/Notification)

## TNA-28: Metadata-driven attendance screens forms and search
- Role: Employee (User)
- Story: As an Employee (User), I want metadata-driven screens, forms, and grids for attendance capture, correction, and review, so that I can interact with attendance through a consistent, configurable UI.
- Priority: Medium
- Source: FR 6.18.1, FR 6.18.5 (L4 presentation)
