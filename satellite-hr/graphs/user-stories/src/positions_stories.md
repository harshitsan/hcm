# Positions — User Stories

## POS-01: Define company positions
- Role: Company Admin
- Story: As a Company Admin, I want to define multiple job positions for my company, so that our organizational roles are represented accurately in the system.
- Priority: High
- Source: FR 6.8.1 (company defines multiple positions)

## POS-02: Assign each position to exactly one department
- Role: Company Admin
- Story: As a Company Admin, I want each position to belong to exactly one department, so that positions are correctly organized within the company structure.
- Priority: High
- Source: FR 6.8.1 (each position belongs to exactly one department)

## POS-03: Assign a position to an employee
- Role: Company Admin
- Story: As a Company Admin, I want to assign one position to each employee, so that every employee's role in the organization is clearly identified.
- Priority: High
- Source: FR 6.8.2 (each employee assigned one position)

## POS-04: Use positions in recruitment and onboarding
- Role: Company Admin
- Story: As a Company Admin, I want positions to be usable in recruitment and onboarding, so that hiring and new-hire setup reference standardized organizational roles.
- Priority: Medium
- Source: FR 6.8.3 (positions support recruitment and onboarding)

## POS-05: Use positions in reporting and organizational setup
- Role: Company Admin
- Story: As a Company Admin, I want positions to be available for reporting and organizational setup, so that I can analyze and structure the workforce by role.
- Priority: Medium
- Source: FR 6.8.3 (positions support reporting and organizational setup)

## POS-06: Scope positions to a single company
- Role: Company Admin
- Story: As a Company Admin, I want positions to be company-specific, so that each company's roles remain isolated within its own tenant context.
- Priority: Medium
- Source: FR 6.8 Purpose (company-specific job positions within departments)

## POS-07: Edit an existing position
- Role: Company Admin
- Story: As a Company Admin, I want to edit an existing position's details, so that role definitions stay accurate as the organization evolves.
- Priority: Medium
- Source: FR 6.8.1 (company defines and manages positions)

## POS-08: Remove or deactivate a position
- Role: Company Admin
- Story: As a Company Admin, I want to remove or deactivate a position that is no longer needed, so that the position list reflects only valid current roles.
- Priority: Medium
- Source: FR 6.8.1 / FR 6.8.2 (position lifecycle and one-position-per-employee integrity)

## POS-09: Oversee positions across companies in a group
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to view and manage positions across the companies within my group, so that I can maintain consistent role definitions across the group.
- Priority: Medium
- Source: FR 6.8 Purpose + FR 6.8.1 (company-specific positions within group hierarchy)

## POS-10: View my assigned position
- Role: Employee (User)
- Story: As an Employee (User), I want to view my assigned position, so that I understand my defined role within the organization.
- Priority: Low
- Source: FR 6.8.2 (each employee assigned one position)

## POS-11: Reflect position on non-user employee records
- Role: Company Admin
- Story: As a Company Admin, I want to assign and view positions for Employee (Non-User) records, so that employees without system logins are still represented in the organizational structure.
- Priority: Low
- Source: FR 6.8.2 (each employee assigned one position, incl. non-user employees)

## POS-12: Maintain effective-dated position history
- Role: Company Admin
- Story: As a Company Admin, I want position definitions and employee position assignments to be effective-dated and historized, so that past organizational states are preserved and auditable over time.
- Priority: Medium
- Source: FR 6.8.1, FR 6.8.2 (L1 bitemporal effective-dated history)

## POS-13: Govern positions as per-tenant reference metadata
- Role: Company Admin
- Story: As a Company Admin, I want positions maintained as governed per-tenant reference data with optional custom fields, so that other modules consistently consume position definitions as configuration rather than free text.
- Priority: Medium
- Source: FR 6.8.3 (L2 config / governed reference metadata)

## POS-14: Manage positions through a metadata-driven screen
- Role: Company Admin
- Story: As a Company Admin, I want a metadata-driven positions screen with search, filtering, and navigation, so that I can efficiently manage a large number of positions.
- Priority: Medium
- Source: FR 6.8.3 (L4 presentation)

## POS-15: Tenant-scoped bitemporal position records with row-level security
- Role: Platform Admin
- Story: As a Platform Admin, I want position definitions and employee position assignments stored as tenant-scoped, effective-dated, bitemporal data, so that every change is auditable and the correct role assignments can be reconstructed for any past date without leaking across tenants.
- Priority: Medium
- Source: FR 6.8.1, FR 6.8.2 (L1 domain/data: bitemporal effective-dated positions, RLS tenant isolation)

## POS-16: Oversee positions across the portfolio
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to view and govern the positions of all group companies and companies within my portfolio, so that role definitions remain consistent and compliant across the portfolio.
- Priority: Medium
- Source: FR 6.8.1, FR 6.8.3 (portfolio-wide oversight of positions; multi-tenant governance)

## POS-17: Be represented in the org by a position without portal access
- Role: Employee (Non-User)
- Story: As an HR/Company Admin managing an Employee (Non-User), I want non-portal employees to still hold exactly one position, so that they are fully represented in the organizational structure and reporting despite having no login.
- Priority: Low
- Source: FR 6.8.2 (position representation for non-user employees)

## POS-18: Recruitment and onboarding engines consume the governed position
- Role: Company Admin
- Story: As a Company Admin, I want the recruitment/onboarding workflow and forms engines to consume the governed position, so that positions flow through hiring processes and carry their custom fields without code changes.
- Priority: Medium
- Source: FR 6.8.3 (L3 engine: recruitment/onboarding workflow and forms/dynamic-fields engines consume positions)
