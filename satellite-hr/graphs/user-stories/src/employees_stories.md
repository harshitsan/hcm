# Employees — User Stories

## EMP-01: Company-specific employee records
- Role: Company Admin
- Story: As a Company Admin, I want each employee record to be scoped to exactly one company, so that workforce data remains isolated and accurate per company.
- Priority: High
- Source: FR 6.9.1

## EMP-02: Employee with or without a linked user account
- Role: Company Admin
- Story: As a Company Admin, I want to maintain an employee record either standalone or linked to a user account, so that I can track staff who do not need system access as well as those who do.
- Priority: High
- Source: FR 6.9.2

## EMP-03: Core organizational assignments
- Role: Company Admin
- Story: As a Company Admin, I want to assign each employee to a company, jurisdiction, department(s), and position, so that their placement in the organization is clearly defined.
- Priority: High
- Source: FR 6.9.3

## EMP-04: Group and multi-location assignment
- Role: Company Admin
- Story: As a Company Admin, I want to optionally assign employees to groups and to one or more operating locations, so that I can reflect team membership and where staff operate.
- Priority: Medium
- Source: FR 6.9.3

## EMP-05: Employee lifecycle events
- Role: Company Admin
- Story: As a Company Admin, I want employee records to support lifecycle events such as onboarding, probation, performance, transfers, and exit, so that I can manage the full employment journey in one place.
- Priority: High
- Source: FR 6.9.4

## EMP-06: Primary reporting manager
- Role: Company Admin
- Story: As a Company Admin, I want each employee to have exactly one primary reporting manager, so that the core reporting structure is unambiguous.
- Priority: High
- Source: FR 6.9.5

## EMP-07: Dotted-line (matrix) managers
- Role: Company Admin
- Story: As a Company Admin, I want to optionally assign one or more functional/matrix (dotted-line) managers to an employee, so that dotted-line reporting relationships are represented.
- Priority: Medium
- Source: FR 6.9.5

## EMP-08: Temporary/acting manager with automatic delegation
- Role: Company Admin
- Story: As a Company Admin, I want to assign a temporary/acting manager for an employee's team, so that management responsibilities are delegated automatically while the primary manager is unavailable.
- Priority: Medium
- Source: FR 6.9.5

## EMP-09: Effective-dated manager changes with audit trail
- Role: Company Admin
- Story: As a Company Admin, I want all manager assignment changes (primary, dotted-line, and temporary/acting) to be effective-dated with a complete audit trail, so that reporting history is accurate and traceable.
- Priority: High
- Source: FR 6.9.5

## EMP-10: Duplicate detection on government IDs
- Role: Company Admin
- Story: As a Company Admin, I want the system to enforce uniqueness of government identification fields (Aadhar, Passport, PAN) with deduplication prompts, so that duplicate employee records are prevented.
- Priority: High
- Source: FR 6.9.6

## EMP-11: Statutory workforce data capture (Indian labor law)
- Role: Company Admin
- Story: As a Company Admin, I want to capture statutory workforce data such as UAN, ESIC number, ESI/PF eligibility, Professional Tax registration, LWF applicability, maternity benefit eligibility, and gratuity eligibility, so that the company remains compliant with Indian labor law.
- Priority: High
- Source: FR 6.9.7

## EMP-12: Leave balances with statutory entitlements
- Role: Company Admin
- Story: As a Company Admin, I want to track employee leave balances with their statutory entitlements, so that leave records reflect legally mandated allowances.
- Priority: Medium
- Source: FR 6.9.7

## EMP-13: Self-service view of own employee profile
- Role: Employee (User)
- Story: As an Employee (User), I want to view my own employee profile including my organizational placement, so that I can confirm my company, jurisdiction, department(s), position, groups, and locations are correct.
- Priority: Medium
- Source: FR 6.9.2, FR 6.9.3

## EMP-14: Self-service view of own reporting structure
- Role: Employee (User)
- Story: As an Employee (User), I want to view my primary, dotted-line, and any temporary/acting managers, so that I understand my reporting lines.
- Priority: Medium
- Source: FR 6.9.5

## EMP-15: Self-service view of own leave balances and statutory data
- Role: Employee (User)
- Story: As an Employee (User), I want to view my leave balances, statutory entitlements, and my statutory identifiers, so that I can verify my compliance-related information.
- Priority: Medium
- Source: FR 6.9.7

## EMP-16: Consolidated employee oversight across group companies
- Role: Group Company Admin
- Story: As a Group Company Admin, I want a consolidated view of employee records across the companies in my group, so that I can oversee the workforce while records remain company-specific.
- Priority: Medium
- Source: FR 6.9.1, FR 6.9.3

## EMP-17: Records maintained for staff without system access
- Role: Employee (Non-User)
- Story: As an Employee (Non-User), I want my employment, organizational, statutory, and reporting data to be fully maintained on my behalf without a user account, so that I am tracked and compliant even though I have no system access.
- Priority: Medium
- Source: FR 6.9.2

## EMP-18: Manager delegation during absence
- Role: Employee (User)
- Story: As an Employee (User) who is a manager, I want an acting manager to receive my responsibilities automatically during my absence, so that my team is managed continuously while I am away.
- Priority: Medium
- Source: FR 6.9.5

## EMP-19: Jurisdiction statutory rule-packs for workforce data
- Role: Platform Admin
- Story: As a Platform Admin, I want to maintain effective-dated, versioned jurisdiction rule-packs that define which statutory data applies (UAN, ESIC, ESI/PF, Professional Tax, LWF, maternity, gratuity) and their entitlement parameters, so that the engines determine compliance per jurisdiction without code changes.
- Priority: High
- Source: FR 6.9.7 (L2 config)

## EMP-20: Duplicate-detection uniqueness configuration
- Role: Platform Admin
- Story: As a Platform Admin, I want to configure which government identification fields (Aadhar, Passport, PAN) enforce uniqueness and how matching/dedup scope is evaluated, so that duplicate-detection behavior is governed config rather than hard-coded.
- Priority: High
- Source: FR 6.9.6 (L2 config)

## EMP-28: Jurisdiction statutory field schema (dynamic fields)
- Role: Platform Admin
- Story: As a Platform Admin, I want to define the statutory/custom field schema per jurisdiction (labels, data types, required/optional, validation) as governed metadata, so that the employee form renders the correct statutory fields for each jurisdiction without code changes.
- Priority: Medium
- Source: FR 6.9.7 (L2 config)

## EMP-21: Lifecycle stage and event configuration
- Role: Company Admin
- Story: As a Company Admin, I want to configure lifecycle stages and their parameters (e.g., probation duration, transfer and exit checklists) as governed config, so that the employee lifecycle behaves per company policy without code changes.
- Priority: Medium
- Source: FR 6.9.4 (L2 config)

## EMP-22: Automatic statutory eligibility determination (Rules engine)
- Role: Company Admin
- Story: As a Company Admin, I want the Rules engine to automatically determine ESI/PF, maternity, and gratuity eligibility by evaluating the employee's data against the jurisdiction rule-pack decision tables, so that eligibility is consistent and audit-traceable.
- Priority: High
- Source: FR 6.9.7 (L3 engine)

## EMP-23: Leave balance accrual with statutory entitlements (Accrual engine)
- Role: Company Admin
- Story: As a Company Admin, I want the Accrual/Balance engine to compute and maintain leave balances from statutory entitlements defined in the jurisdiction rule-pack, so that balances reflect legally mandated allowances automatically.
- Priority: Medium
- Source: FR 6.9.7 (L3 engine)

## EMP-24: Automatic delegation routing on acting-manager assignment (Workflow engine)
- Role: Company Admin
- Story: As a Company Admin, I want the Workflow/Approval engine to automatically reroute a manager's pending and incoming approvals to the temporary/acting manager while the assignment is active, so that approvals are not blocked during absence.
- Priority: Medium
- Source: FR 6.9.5 (L3 engine)

## EMP-25: Duplicate matching evaluation (Rules engine)
- Role: Company Admin
- Story: As a Company Admin, I want the Rules engine to evaluate government IDs against the configured duplicate-detection decision tables and classify each hit, so that same-company duplicates are blocked while valid separate-company records are allowed.
- Priority: High
- Source: FR 6.9.6 (L3 engine)

## EMP-26: Lifecycle and manager-change notifications (Notification engine)
- Role: Employee (User)
- Story: As an Employee (User), I want the Notification/Template engine to notify me and affected managers of lifecycle events (e.g., probation ending, transfer, exit) and manager-assignment changes using configured templates, so that stakeholders stay informed automatically.
- Priority: Medium
- Source: FR 6.9.4, FR 6.9.5 (L3 engine)

## EMP-27: Metadata-driven employee directory search and grid
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven employee directory with search, filtering, and configurable columns across organizational attributes, so that I can find and manage employee records efficiently within my company scope.
- Priority: Medium
- Source: FR 6.9.3 (L4)

## EMP-29: Portfolio-wide consolidated employee oversight
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want a consolidated, read-oriented view of employee records across all group companies and companies in my portfolio, so that I can oversee the entire workforce while records remain strictly company-specific.
- Priority: Medium
- Source: FR 6.9.1, FR 6.9.3
