# 6.9 Employees

## Purpose
Manage employee workforce records for each company.

## Functional Requirements

1. Employee records shall be company-specific. If the same physical person is an employee in more than one company, separate employee records shall be created.

2. An employee may exist without a linked user account, or may be linked to a user account if system access is required.

3. Each employee shall belong to: one company, one jurisdiction, at least one department (may belong to multiple), one position, zero or more groups, and may operate across one or more locations.

4. Employee records shall support lifecycle events including onboarding, probation, performance, transfers, and exit processes.

5. **Manager Hierarchy and Reporting Structure:**
   - **Primary Manager** - Each employee shall have exactly one primary reporting manager
   - **Dotted-Line Manager** - Employees may optionally have one or more functional/matrix managers
   - **Temporary/Acting Manager** - Support temporary manager assignments with automatic delegation
   - **Effective-Dated Changes** - All manager assignment changes shall be effective-dated with complete audit trail

6. **Duplicate Detection** - The system shall enforce uniqueness for government identification fields (Aadhar, Passport, PAN) with deduplication prompts.

7. **Statutory Workforce Data Capture (Indian Labor Law)** - The system shall support capture of: UAN, ESIC Number, ESI/PF Eligibility status, Professional Tax registration, LWF applicability, maternity benefit eligibility, gratuity eligibility tracking, and leave balances with statutory entitlements.
