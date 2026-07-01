# Audit and Logging — User Stories

## AUD-01: Audit all Company record actions
- Role: Platform Admin
- Story: As a Platform Admin, I want the platform to automatically record every create, update, delete, and status-change action performed on Company records, so that all changes to this mandatory audit entity are fully traceable.
- Priority: High
- Source: FR 6.29.1 (Mandatory Audit Entities — Company)

## AUD-02: Audit all Employee record actions
- Role: Platform Admin
- Story: As a Platform Admin, I want the platform to automatically record every create, update, delete, and status-change action performed on Employee records, so that all changes to this mandatory audit entity are fully accountable.
- Priority: High
- Source: FR 6.29.1 (Mandatory Audit Entities — Employee)

## AUD-03: Capture complete audit data fields
- Role: Company Admin
- Story: As a Company Admin, I want each audit entry to capture the entity type, record identifier, and affected field/attribute, so that I can pinpoint exactly what was changed and where.
- Priority: High
- Source: FR 6.29.2 (Audit Data — entity type, record identifier, field/attribute)

## AUD-04: Capture before-and-after values
- Role: Company Admin
- Story: As a Company Admin, I want each audit entry to record the previous value and the new value for a changed field, so that I can see the exact transition that took place.
- Priority: High
- Source: FR 6.29.2 (Audit Data — previous/new value)

## AUD-05: Capture actor, timestamp, and action type
- Role: Company Admin
- Story: As a Company Admin, I want each audit entry to record the timestamp, the user/actor responsible, and the action type, so that I can attribute every change to a who, when, and what.
- Priority: High
- Source: FR 6.29.2 (Audit Data — timestamp, user/actor, action type)

## AUD-06: Active audit retention for one year
- Role: Platform Admin
- Story: As a Platform Admin, I want audit records retained in active storage for one year, so that recent change history is readily available for review.
- Priority: Medium
- Source: FR 6.29.3 (Retention — 1 year active)

## AUD-07: Archive audit records for seven years total
- Role: Platform Admin
- Story: As a Platform Admin, I want audit records archived so that the total retention reaches seven years, so that the platform meets long-term compliance and audit obligations.
- Priority: Medium
- Source: FR 6.29.3 (Retention — 7 years total with archival)

## AUD-08: View record-level change history
- Role: Company Admin
- Story: As a Company Admin, I want an in-application utility to view the chronological change history for a specific record, so that I can review how that record evolved over time without leaving the application.
- Priority: Medium
- Source: FR 6.29.4 (Record-Level History)

## AUD-09: Secure, tamper-resistant, tenant-isolated logs
- Role: Platform Admin
- Story: As a Platform Admin, I want audit logs to be tamper-resistant with role-based access and tenant boundary enforcement, so that audit data remains trustworthy and isolated per tenant.
- Priority: High
- Source: FR 6.29.5 (Security — tamper-resistance, RBAC, tenant boundary)

## AUD-10: View audit history within portfolio scope
- Role: Portfolio Admin
- Story: As a Portfolio Admin, I want to view the chronological change history of Company and Employee records within my portfolio, so that I can oversee changes across the group companies I am responsible for while staying within my tenant boundary.
- Priority: Medium
- Source: FR 6.29.4, FR 6.29.5 (Record-Level History + RBAC/tenant boundary — Portfolio Admin)

## AUD-11: View audit history within group company scope
- Role: Group Company Admin
- Story: As a Group Company Admin, I want to view the chronological change history of Company and Employee records within my group company, so that I can investigate changes across the companies I manage without crossing tenant boundaries.
- Priority: Medium
- Source: FR 6.29.4, FR 6.29.5 (Record-Level History + RBAC/tenant boundary — Group Company Admin)

## AUD-12: View my own record change history
- Role: Employee (User)
- Story: As an Employee (User), I want to view the chronological change history of my own employee record where I am authorized, so that I can see what changed on my profile, when, and by whom.
- Priority: Low
- Source: FR 6.29.4, FR 6.29.5 (Record-Level History self-service — Employee User)

## AUD-13: Audit changes to non-user employee records
- Role: Employee (Non-User)
- Story: As an Employee (Non-User) whose data is maintained on my behalf, I want every change to my employee record to be audited even though I have no system login, so that my record remains accountable and reviewable by authorized administrators.
- Priority: Medium
- Source: FR 6.29.1, FR 6.29.2, FR 6.29.4 (Audit coverage for Employee Non-User records)

## AUD-14: Deny unauthorized access to audit data
- Role: Company Admin
- Story: As a Company Admin, I want role-based and tenant-scoped access strictly enforced on all audit data and record history, so that only authorized users within the correct tenant can view audit information.
- Priority: High
- Source: FR 6.29.5 (Security — RBAC and tenant boundary enforcement)

## AUD-15: Configure audit retention policy as governed config
- Role: Platform Admin
- Story: As a Platform Admin, I want to configure the audit retention policy — one year active and seven years total with archival — as governed, versioned, effective-dated configuration, so that retention behavior can be adjusted without code changes and the retention/archival process reads it as its rule source.
- Priority: Medium
- Source: FR 6.29.3 (Retention — L2 config)

## AUD-16: Govern mandatory audit entity and field scope
- Role: Platform Admin
- Story: As a Platform Admin, I want to govern which entities and their fields/attributes are in scope as mandatory audit entities via configuration, so that audit coverage for Company, Employee, and their attributes is metadata-driven and consistent across tenants without code changes.
- Priority: Medium
- Source: FR 6.29.1, FR 6.29.2 (Audit scope — L2 config)

## AUD-17: Configure role-based audit access permissions
- Role: Platform Admin
- Story: As a Platform Admin, I want to configure the role-based permissions and tenant scoping that govern who may view audit data and record history, so that audit access control is driven by per-tenant governed config rather than by code.
- Priority: Medium
- Source: FR 6.29.5 (RBAC/tenant boundary — L2 config)

## AUD-18: Search and filter record change history
- Role: Company Admin
- Story: As a Company Admin, I want to search, filter, and sort the record-level change history in the in-application utility, so that I can quickly locate specific changes by field, actor, action type, or date range on large histories.
- Priority: Low
- Source: FR 6.29.4 (Record-Level History — L4 presentation)
